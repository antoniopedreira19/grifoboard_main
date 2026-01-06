import { useState } from 'react';
import { PlaybookFarolItem } from '@/types/playbook';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, X } from 'lucide-react';
import { capitalizeWords } from '@/lib/utils/textUtils';

interface PlaybookDetailsModalProps {
  item: PlaybookFarolItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: PlaybookFarolItem) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Negociadas':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Em Andamento':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'A Negociar':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export default function PlaybookDetailsModal({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: PlaybookDetailsModalProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (!item) return null;

  const orcamentoMetaTotal = item.quantidade * item.orcamento_meta_unitario;
  const diferenca = orcamentoMetaTotal - (item.valor_contratado || 0);

  const handleEditClick = () => {
    onClose();
    onEdit(item);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(item.id);
    setDeleteDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Detalhes do Item</DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteClick}
                  title="Excluir"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Etapa</label>
                <p className="text-base mt-1">{capitalizeWords(item.etapa)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Proposta</label>
                <p className="text-base mt-1">{capitalizeWords(item.proposta)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                <p className="text-base mt-1">{capitalizeWords(item.responsavel)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(item.status)} variant="outline">
                    {item.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quantidades */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Quantidades</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantidade</label>
                  <p className="text-base mt-1">{item.quantidade}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unidade</label>
                  <p className="text-base mt-1">{capitalizeWords(item.unidade)}</p>
                </div>
              </div>
            </div>

            {/* Valores */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Valores</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Orçamento Meta Unitário</label>
                  <p className="text-base mt-1 font-semibold">{formatCurrency(item.orcamento_meta_unitario)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Orçamento Meta Total</label>
                  <p className="text-base mt-1 font-semibold bg-yellow-50 dark:bg-yellow-950 p-2 rounded">
                    {formatCurrency(orcamentoMetaTotal)}
                  </p>
                </div>
              </div>

              {item.valor_contratado !== null && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Contratado</label>
                    <p className="text-base mt-1 font-semibold">{formatCurrency(item.valor_contratado)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Diferença</label>
                    <p
                      className={`text-base mt-1 font-semibold p-2 rounded ${
                        diferenca >= 0
                          ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950'
                          : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950'
                      }`}
                    >
                      {formatCurrency(diferenca)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Observação */}
            {item.observacao && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-muted-foreground">Observação</label>
                <p className="text-base mt-1">{capitalizeWords(item.observacao)}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
