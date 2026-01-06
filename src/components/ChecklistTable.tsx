
import { AtividadeChecklist } from "@/types/checklist";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2 } from "lucide-react";

interface ChecklistTableProps {
  atividades: AtividadeChecklist[];
  isLoading: boolean;
  onAtividadeToggle: (atividadeId: string, concluida: boolean) => void;
  onAtividadeDelete: (atividadeId: string) => void;
}

const ChecklistTable: React.FC<ChecklistTableProps> = ({ 
  atividades, 
  isLoading, 
  onAtividadeToggle,
  onAtividadeDelete
}) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Não definida";
    
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Data inválida";
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (atividades.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhuma atividade encontrada
      </div>
    );
  }

  return (
    <div className="p-4" style={{ overflow: 'hidden', whiteSpace: 'normal', wordWrap: 'break-word', width: '100%' }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Status</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Local</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Data de Início</TableHead>
            <TableHead>Data de Término</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {atividades.map((atividade) => (
            <TableRow key={atividade.id}>
              <TableCell>
                <Checkbox
                  checked={atividade.concluida}
                  onCheckedChange={(checked) => 
                    onAtividadeToggle(atividade.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell 
                className="font-medium" 
                style={{ overflow: 'hidden', whiteSpace: 'normal', wordWrap: 'break-word' }}
              >
                {atividade.descricao || "-"}
              </TableCell>
              <TableCell style={{ overflow: 'hidden', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                {atividade.local}
              </TableCell>
              <TableCell style={{ overflow: 'hidden', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                {atividade.setor}
              </TableCell>
              <TableCell style={{ overflow: 'hidden', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                {atividade.responsavel}
              </TableCell>
              <TableCell style={{ overflow: 'hidden', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                {formatDate(atividade.data_inicio)}
              </TableCell>
              <TableCell style={{ overflow: 'hidden', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                {formatDate(atividade.data_termino)}
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir atividade</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onAtividadeDelete(atividade.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ChecklistTable;
