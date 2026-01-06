import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, RefreshCw, Trash2, Lock, Eye, EyeOff } from "lucide-react";

interface UserSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserSettingsModal = ({ open, onOpenChange }: UserSettingsModalProps) => {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pega o nome atual do user_metadata ou da tabela usuarios
  const currentName = userSession?.user?.user_metadata?.full_name || "";
  const [displayName, setDisplayName] = useState(currentName);

  const handleSave = async () => {
    if (!userSession?.user?.id) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Atualiza o display_name no Auth (user_metadata)
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      if (authError) throw authError;

      // 2. Atualiza o nome na tabela usuarios
      const { error: dbError } = await supabase
        .from("usuarios")
        .update({ nome: trimmedName })
        .eq("id", userSession.user.id);

      if (dbError) throw dbError;

      toast({
        title: "Nome atualizado!",
        description: "Seu nome foi salvo com sucesso.",
      });

      // 3. Atualiza a sessão localmente para refletir a mudança imediatamente sem reload
      await supabase.auth.refreshSession();

      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar nome:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível atualizar o nome.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
      });

      // Limpa os campos e fecha a seção
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Atualiza o estado quando o modal abre
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDisplayName(userSession?.user?.user_metadata?.full_name || "");
      setShowPasswordSection(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-secondary" />
            Configurações do Perfil
          </DialogTitle>
          <DialogDescription>Atualize suas informações pessoais</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de exibição</Label>
            <Input
              id="displayName"
              placeholder="Seu nome completo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Este nome aparecerá no seu perfil e no ranking.</p>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userSession?.user?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
          </div>

          <Separator className="my-4" />

          {/* Seção de Senha */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Alterar Senha
            </Label>
            
            {!showPasswordSection ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPasswordSection(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Alterar minha senha
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={changingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={changingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={changingPassword}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                  >
                    {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Alterar senha
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Seção de Cache */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualização do App
            </Label>
            <p className="text-xs text-muted-foreground">
              Se você está vendo uma versão antiga do app, clique no botão abaixo para forçar a atualização.
            </p>
            <Button
              variant="outline"
              className="w-full"
              disabled={clearingCache}
              onClick={async () => {
                setClearingCache(true);
                try {
                  // Limpa todos os caches do Service Worker
                  if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                  }
                  
                  // Desregistra o Service Worker atual
                  if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(reg => reg.unregister()));
                  }

                  toast({
                    title: "Cache limpo!",
                    description: "A página será recarregada com a versão mais recente.",
                    variant: "gold",
                  });

                  // Aguarda um pouco e recarrega a página forçando bypass do cache
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                } catch (error) {
                  console.error("Erro ao limpar cache:", error);
                  toast({
                    title: "Erro",
                    description: "Não foi possível limpar o cache. Tente novamente.",
                    variant: "destructive",
                  });
                  setClearingCache(false);
                }
              }}
            >
              {clearingCache ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Limpar cache e atualizar
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettingsModal;
