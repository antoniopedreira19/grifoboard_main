import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, LayoutList, ListTree, Minus, Trash2 } from "lucide-react";
import { PlaybookItem } from "@/types/playbook";
import { cn } from "@/lib/utils";
import { playbookService } from "@/services/playbookService";
import { useToast } from "@/hooks/use-toast";
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

interface PlaybookTableProps {
  data: PlaybookItem[];
  grandTotalOriginal: number;
  grandTotalMeta: number;
  onUpdate: () => void;
  onEdit?: (item: PlaybookItem) => void;
  readOnly?: boolean;
}

export function PlaybookTable({
  data,
  grandTotalOriginal,
  grandTotalMeta,
  onUpdate,
  onEdit,
  readOnly = false,
}: PlaybookTableProps) {
  const { toast } = useToast();

  const formatCurrency = (val: number | undefined | null) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val || 0);
  };

  const handleDelete = async (id: string) => {
    try {
      await playbookService.deleteItem(id);
      toast({ title: "Item excluído com sucesso" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const getMetaValue = (originalVal: number, item: any) => {
    if (!item.preco_total || item.preco_total === 0) return 0;
    // Tenta usar precoTotalMeta se existir (calculado no front), senão usa o próprio valor
    const metaTotal = item.precoTotalMeta || item.preco_total;
    const ratio = metaTotal / item.preco_total;
    return originalVal * ratio;
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[90px] text-center text-xs font-bold text-slate-700">Tipo</TableHead>
              <TableHead className="w-[100px] text-xs font-bold text-slate-700">Código</TableHead>
              <TableHead className="min-w-[300px] text-xs font-bold text-slate-700">Descrição</TableHead>
              <TableHead className="w-[60px] text-center text-xs font-bold text-slate-700">Unid.</TableHead>
              <TableHead className="w-[80px] text-center text-xs font-bold text-slate-700">Qtd.</TableHead>

              <TableHead className="w-[110px] text-right text-xs font-bold text-blue-700 bg-blue-50/50">
                Mão de Obra
              </TableHead>
              <TableHead className="w-[110px] text-right text-xs font-bold text-orange-700 bg-orange-50/50">
                Materiais
              </TableHead>
              <TableHead className="w-[110px] text-right text-xs font-bold text-yellow-700 bg-yellow-50/50">
                Equip.
              </TableHead>
              <TableHead className="w-[110px] text-right text-xs font-bold text-emerald-700 bg-emerald-50/50">
                Verbas
              </TableHead>

              <TableHead className="w-[120px] text-right text-xs font-bold text-slate-900 bg-slate-100">
                Total Orig.
              </TableHead>
              <TableHead className="w-[120px] text-right text-xs font-bold text-[#A47528] bg-[#A47528]/10">
                Total Meta
              </TableHead>
              {!readOnly && <TableHead className="w-[80px] text-center text-xs font-bold">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: any) => {
              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "hover:bg-slate-50/80 transition-colors",
                    item.nivel === 0 && "bg-slate-100/50 font-semibold border-t-2 border-slate-200",
                    item.nivel === 1 && "bg-blue-50/10 text-blue-900",
                  )}
                >
                  <TableCell className="text-center py-2">
                    {/* ALTERAÇÃO: Nomes atualizados e fonte reduzida para text-[9px] */}
                    {item.nivel === 0 && <Badge className="bg-slate-800 h-5 text-[9px] px-2">Etapa</Badge>}
                    {item.nivel === 1 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 h-5 text-[9px] px-2">
                        Subetapa
                      </Badge>
                    )}
                    {item.nivel === 2 && (
                      <Badge variant="outline" className="border-slate-200 text-slate-400 h-5 text-[9px] px-2">
                        Item
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500 py-2">
                    {item.codigo || item.proposta}
                  </TableCell>
                  <TableCell className="py-2">
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        item.nivel === 1 && "pl-4",
                        item.nivel === 2 && "pl-8 text-slate-600",
                      )}
                    >
                      {item.nivel === 0 && <LayoutList className="h-4 w-4 text-slate-700" />}
                      {item.nivel === 1 && <ListTree className="h-4 w-4 text-blue-400" />}
                      {item.nivel === 2 && <Minus className="h-3 w-3 text-slate-300" />}
                      <span className="truncate max-w-[400px]" title={item.descricao || item.etapa}>
                        {item.descricao || item.etapa}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs text-slate-500 py-2">{item.unidade}</TableCell>
                  <TableCell className="text-center text-xs text-slate-500 py-2">{item.qtd}</TableCell>

                  {/* Colunas de Valor Desagregado */}
                  <TableCell className="text-right py-2 bg-blue-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-700">
                        {formatCurrency(item.valor_mao_de_obra)}
                      </span>
                      {item.nivel === 2 && (
                        <span className="text-[10px] text-blue-600">
                          {formatCurrency(getMetaValue(item.valor_mao_de_obra, item))}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2 bg-orange-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-700">{formatCurrency(item.valor_materiais)}</span>
                      {item.nivel === 2 && (
                        <span className="text-[10px] text-orange-600">
                          {formatCurrency(getMetaValue(item.valor_materiais, item))}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2 bg-yellow-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-700">
                        {formatCurrency(item.valor_equipamentos)}
                      </span>
                      {item.nivel === 2 && (
                        <span className="text-[10px] text-yellow-600">
                          {formatCurrency(getMetaValue(item.valor_equipamentos, item))}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2 bg-emerald-50/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-700">{formatCurrency(item.valor_verbas)}</span>
                      {item.nivel === 2 && (
                        <span className="text-[10px] text-emerald-600">
                          {formatCurrency(getMetaValue(item.valor_verbas, item))}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Totais */}
                  <TableCell className="text-right py-2 font-medium text-xs bg-slate-50">
                    {formatCurrency(item.precoTotal || item.preco_total)}
                  </TableCell>
                  <TableCell className="text-right py-2 font-bold text-xs text-[#A47528] bg-[#A47528]/5">
                    {formatCurrency(item.precoTotalMeta || item.preco_total * 0.57)}{" "}
                    {/* Fallback visual se meta não calculada */}
                  </TableCell>

                  {!readOnly && (
                    <TableCell className="text-center py-2">
                      <div className="flex items-center justify-center gap-1">
                        {onEdit && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(item)}>
                            <Edit2 className="h-3 w-3 text-slate-400" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-600">
                              <Trash2 className="h-3 w-3 text-slate-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir item?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o item do orçamento.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
