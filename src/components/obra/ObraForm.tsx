import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { obrasService } from "@/services/obraService";
import { useToast } from "@/hooks/use-toast";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useAuth } from "@/context/AuthContext";
import { X, Building2 } from "lucide-react";

interface ObraFormProps {
  isOpen: boolean;
  onClose: () => void;
  onObraCriada: () => void;
}

const ObraForm = ({ isOpen, onClose, onObraCriada }: ObraFormProps) => {
  const { userSession } = useAuth();
  const { users, isLoading: isLoadingUsers } = useCompanyUsers();
  
  const [nomeObra, setNomeObra] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataTermino, setDataTermino] = useState("");
  const [status, setStatus] = useState("em_andamento");
  const [responsavel, setResponsavel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setNomeObra("");
    setLocalizacao("");
    setDataInicio("");
    setDataTermino("");
    setStatus("em_andamento");
    setResponsavel("");
    setIsSubmitting(false);
  };

  const isFormValid = () => {
    return nomeObra.trim() !== "" && localizacao.trim() !== "" && dataInicio !== "";
  };

  const handleCreateObra = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);

    try {
      const novaObra = {
        nome_obra: nomeObra,
        localizacao,
        data_inicio: dataInicio,
        data_termino: dataTermino || undefined,
        status,
        usuario_id: responsavel || userSession?.user?.id,
      };

      await obrasService.criarObra(novaObra);

      toast({
        title: "Sucesso!",
        description: "Nova obra registrada no sistema.",
        className: "bg-grifo-primary text-white border-none",
      });

      onClose();
      resetForm();
      onObraCriada();
    } catch (error: any) {
      console.error("Erro ao criar obra:", error);
      toast({
        title: "Erro ao criar obra",
        description: error.message || "Ocorreu um erro ao criar a obra. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ordenar usuários e incluir o próprio usuário logado no topo
  const sortedUsers = [...users].sort((a, b) => {
    // Usuário atual fica no topo
    if (a.id === userSession?.user?.id) return -1;
    if (b.id === userSession?.user?.id) return 1;
    // Depois ordena por nome
    return (a.nome || a.email || "").localeCompare(b.nome || b.email || "");
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          resetForm();
        }
      }}
    >
      <DialogContent
        className="sm:max-w-[500px] bg-white border-grifo-tertiary shadow-2xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const isClickOutside = e.type === "pointerdown";
          if (!isClickOutside) e.preventDefault();
        }}
      >
        <DialogHeader className="border-b border-grifo-tertiary/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-grifo-secondary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-grifo-secondary" />
            </div>
            <DialogTitle className="text-xl font-heading text-grifo-primary">Cadastrar Nova Obra</DialogTitle>
          </div>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="nome_obra" className="text-grifo-primary font-medium">
              Nome do Empreendimento
            </Label>
            <Input
              id="nome_obra"
              value={nomeObra}
              onChange={(e) => setNomeObra(e.target.value)}
              placeholder="Ex: Residencial Vista do Parque"
              className="focus-visible:ring-grifo-secondary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="localizacao" className="text-grifo-primary font-medium">
              Localização
            </Label>
            <Input
              id="localizacao"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Cidade - UF"
              className="focus-visible:ring-grifo-secondary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio" className="text-grifo-primary font-medium">
                Data de Início
              </Label>
              <Input
                id="data_inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="focus-visible:ring-grifo-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_termino" className="text-grifo-primary font-medium">
                Previsão de Término
              </Label>
              <Input
                id="data_termino"
                type="date"
                value={dataTermino}
                onChange={(e) => setDataTermino(e.target.value)}
                min={dataInicio}
                className="focus-visible:ring-grifo-secondary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel" className="text-grifo-primary font-medium">
              Responsável pela Obra
            </Label>
            <Select value={responsavel} onValueChange={setResponsavel}>
              <SelectTrigger id="responsavel" className="focus:ring-grifo-secondary">
                <SelectValue placeholder={isLoadingUsers ? "Carregando..." : "Selecione o responsável"} />
              </SelectTrigger>
              <SelectContent>
                {sortedUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nome || user.email || "Usuário sem nome"}
                    {user.id === userSession?.user?.id && " (Eu)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-grifo-primary font-medium">
              Status Inicial
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status" className="focus:ring-grifo-secondary">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao_iniciada">Não iniciada</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="border-t border-grifo-tertiary/20 pt-4 mt-2 gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-grifo-tertiary text-grifo-primary hover:bg-grifo-background"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateObra}
            disabled={!isFormValid() || isSubmitting}
            className="bg-grifo-secondary hover:bg-grifo-secondary/90 text-white"
          >
            {isSubmitting ? "Salvando..." : "Criar Obra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ObraForm;
