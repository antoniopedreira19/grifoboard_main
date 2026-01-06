import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { checklistService } from "@/services/checklistService";
import { NovaAtividadeChecklist } from "@/types/checklist";

interface ChecklistFormProps {
  onAtividadeCriada: () => void;
}

const ChecklistForm: React.FC<ChecklistFormProps> = ({ onAtividadeCriada }) => {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<NovaAtividadeChecklist, 'obra_id'>>({
    local: '',
    setor: '',
    responsavel: '',
    data_inicio: '',
    data_termino: '',
    descricao: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userSession?.obraAtiva) return;

    setIsLoading(true);
    try {
      await checklistService.criarAtividade({
        ...formData,
        obra_id: userSession.obraAtiva.id
      });

      toast({
        title: "Atividade criada",
        description: "A atividade foi adicionada ao checklist com sucesso",
      });

      setFormData({
        local: '',
        setor: '',
        responsavel: '',
        data_inicio: '',
        data_termino: '',
        descricao: ''
      });
      setIsOpen(false);
      onAtividadeCriada();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao criar atividade",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Plus className="h-4 w-4 mr-2" />
          Nova Atividade
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Only allow closing when clicking outside, not on focus loss
          const isClickOutside = e.type === 'pointerdown';
          if (!isClickOutside) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Atividade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="local">Local</Label>
            <Input
              id="local"
              value={formData.local}
              onChange={(e) => setFormData({ ...formData, local: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="setor">Setor</Label>
            <Input
              id="setor"
              value={formData.setor}
              onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="responsavel">Responsável</Label>
            <Input
              id="responsavel"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="data_inicio">Data de Início</Label>
            <Input
              id="data_inicio"
              type="date"
              value={formData.data_inicio}
              onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="data_termino">Data de Término</Label>
            <Input
              id="data_termino"
              type="date"
              value={formData.data_termino}
              onChange={(e) => setFormData({ ...formData, data_termino: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Atividade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChecklistForm;
