import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SignupAfterFormProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: "profissional" | "empresa" | "fornecedor";
  emailDefault: string;
}

export function SignupAfterFormDialog({ isOpen, onClose, entityId, entityType, emailDefault }: SignupAfterFormProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      // 1. Verificar se o email já existe na tabela usuarios
      const { data: existingUser } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", emailDefault)
        .maybeSingle();

      if (existingUser) {
        toast.error("Este email já está cadastrado. Faça login em /auth");
        setLoading(false);
        return;
      }

      // 2. Criar Usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailDefault,
        password: password,
        options: {
          data: {
            role: "parceiro",
            entity_type: entityType,
          },
        },
      });

      if (authError) {
        // Verifica se é erro de email duplicado
        if (authError.message.includes("already registered") || 
            authError.message.includes("User already registered")) {
          toast.error("Este email já está cadastrado. Faça login em /auth");
          return;
        }
        throw authError;
      }
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // 3. Atualizar entrada na tabela usuarios com role 'parceiro'
      // (O trigger handle_new_user já cria o registro, então fazemos update)
      const { error: usuarioError } = await supabase
        .from("usuarios")
        .update({ role: "parceiro" as any })
        .eq("id", authData.user.id);

      if (usuarioError) {
        console.error("Erro ao atualizar role do usuario:", usuarioError);
      }

      // 4. Vincular o registro criado ao novo user_id usando RPC (bypass RLS)
      const { error: linkError } = await supabase.rpc('link_user_to_form', {
        p_user_id: authData.user.id,
        p_entity_id: entityId,
        p_entity_type: entityType
      });

      if (linkError) {
        console.error("Erro ao vincular formulário:", linkError);
        throw linkError;
      }

      toast.success("Conta criada com sucesso! Acesso liberado.");
      navigate("/portal-parceiro");
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("already registered")) {
        toast.error("Este email já está cadastrado. Faça login em /auth");
      } else {
        toast.error(error.message || "Erro ao criar conta.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerencie seu Perfil</DialogTitle>
          <DialogDescription>
            Crie uma senha para acessar seu painel exclusivo. Você poderá editar suas informações e adicionar mais fotos
            ao marketplace a qualquer momento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Email cadastrado</Label>
            <Input value={emailDefault} disabled className="bg-slate-100" />
          </div>
          <div className="space-y-2">
            <Label>Crie uma Senha</Label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button onClick={handleSignup} className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Criar Acesso e Entrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
