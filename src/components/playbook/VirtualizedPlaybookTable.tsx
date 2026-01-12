import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { PlaybookItem } from "@/types/playbook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
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

interface VirtualizedPlaybookTableProps {
  data: PlaybookItem[];
  grandTotalOriginal: number;
  grandTotalMeta: number;
  onUpdate: () => void;
  onEdit?: (item: PlaybookItem) => void;
  readOnly?: boolean;
}

export function VirtualizedPlaybookTable({
  data,
  grandTotalOriginal,
  grandTotalMeta,
  onUpdate,
  onEdit,
  readOnly = false,
}: VirtualizedPlaybookTableProps) {
  const { toast } = useToast();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Altura da linha
    overscan: 5,
  });

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
    const metaTotal = item.precoTotalMeta || item.preco_total;
    const ratio = metaTotal / item.preco_total;
    return originalVal * ratio;
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Fixo - Grid alinhado */}
      <div className="grid grid-cols-[90px_100px_minmax(300px,1fr)_60px_80px_110px_110px_110px_110px_120px_120px_80px] bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 sticky top-0 z-10 shrink-0">
        <div className="p-2 text-center flex items-center justify-center">Tipo</div>
        <div className="p-2 flex items-center">Código</div>
        <div className="p-2 flex items-center">Descrição</div>
        <div className="p-2 text-center flex items-center justify-center">Unid.</div>
        <div className="p-2 text-center flex items-center justify-center">Qtd.</div>
        <div className="p-2 text-right flex items-center justify-end text-blue-700 bg-blue-50/50">Mão de Obra</div>
        <div className="p-2 text-right flex items-center justify-end text-orange-700 bg-orange-50/50">Materiais</div>
        <div className="p-2 text-right flex items-center justify-end text-yellow-700 bg-yellow-50/50">Equip.</div>
        <div className="p-2 text-right flex items-center justify-end text-emerald-700 bg-emerald-50/50">Verbas</div>
        <div className="p-2 text-right flex items-center justify-end text-slate-900 bg-slate-100">Total Orig.</div>
        <div className="p-2 text-right flex items-center justify-end text-[#A47528] bg-[#A47528]/10">Total Meta</div>
        {!readOnly && <div className="p-2 text-center flex items-center justify-center">Ações</div>}
      </div>

      {/* Corpo Virtualizado */}
      <div ref={parentRef} className="overflow-auto h-[600px] w-full">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = data[virtualRow.index] as any;
            return (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                  "grid grid-cols-[90px_100px_minmax(300px,1fr)_60px_80px_110px_110px_110px_110px_120px_120px_80px] border-b border-slate-100 items-center text-xs hover:bg-slate-50/80 transition-colors",
                  item.nivel === 0 && "bg-slate-100/50 font-semibold border-t-2 border-slate-200",
                  item.nivel === 1 && "bg-blue-50/10 text-blue-900",
                )}
              >
                {/* Badge: Menor e com nomes atualizados */}
                <div className="p-1 text-center">
                  {item.nivel === 0 && (
                    <Badge className="bg-slate-800 h-4 text-[8px] px-1.5 hover:bg-slate-700">Etapa</Badge>
                  )}
                  {item.nivel === 1 && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 h-4 text-[8px] px-1.5 hover:bg-blue-200"
                    >
                      Subetapa
                    </Badge>
                  )}
                  {item.nivel === 2 && (
                    <Badge variant="outline" className="border-slate-200 text-slate-400 h-4 text-[8px] px-1.5">
                      Item
                    </Badge>
                  )}
                </div>

                {/* Código */}
                <div className="p-2 font-mono text-slate-500 truncate">{item.codigo || item.proposta}</div>

                {/* Descrição - ÍCONES REMOVIDOS */}
                <div className="p-2">
                  <div
                    className={cn("truncate", item.nivel === 1 && "pl-4", item.nivel === 2 && "pl-8 text-slate-600")}
                    title={item.descricao || item.etapa}
                  >
                    {item.descricao || item.etapa}
                  </div>
                </div>

                {/* Unidade */}
                <div className="p-2 text-center text-slate-500">{item.unidade}</div>

                {/* Quantidade */}
                <div className="p-2 text-center text-slate-500">{item.qtd}</div>

                {/* Valores Desagregados com Meta */}
                <div className="p-2 text-right bg-blue-50/20 h-full flex flex-col justify-center">
                  <span className="font-medium text-slate-700">{formatCurrency(item.valor_mao_de_obra)}</span>
                  {item.nivel === 2 && (
                    <span className="text-[10px] text-blue-600 leading-none">
                      {formatCurrency(getMetaValue(item.valor_mao_de_obra, item))}
                    </span>
                  )}
                </div>
                <div className="p-2 text-right bg-orange-50/20 h-full flex flex-col justify-center">
                  <span className="font-medium text-slate-700">{formatCurrency(item.valor_materiais)}</span>
                  {item.nivel === 2 && (
                    <span className="text-[10px] text-orange-600 leading-none">
                      {formatCurrency(getMetaValue(item.valor_materiais, item))}
                    </span>
                  )}
                </div>
                <div className="p-2 text-right bg-yellow-50/20 h-full flex flex-col justify-center">
                  <span className="font-medium text-slate-700">{formatCurrency(item.valor_equipamentos)}</span>
                  {item.nivel === 2 && (
                    <span className="text-[10px] text-yellow-600 leading-none">
                      {formatCurrency(getMetaValue(item.valor_equipamentos, item))}
                    </span>
                  )}
                </div>
                <div className="p-2 text-right bg-emerald-50/20 h-full flex flex-col justify-center">
                  <span className="font-medium text-slate-700">{formatCurrency(item.valor_verbas)}</span>
                  {item.nivel === 2 && (
                    <span className="text-[10px] text-emerald-600 leading-none">
                      {formatCurrency(getMetaValue(item.valor_verbas, item))}
                    </span>
                  )}
                </div>

                {/* Totais */}
                <div className="p-2 text-right font-medium bg-slate-50 h-full flex items-center justify-end">
                  {formatCurrency(item.precoTotal || item.preco_total)}
                </div>
                <div className="p-2 text-right font-bold text-[#A47528] bg-[#A47528]/5 h-full flex items-center justify-end">
                  {formatCurrency(item.precoTotalMeta || item.preco_total * 0.57)}
                </div>

                {/* Ações */}
                {!readOnly && (
                  <div className="p-2 flex items-center justify-center gap-1">
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
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
