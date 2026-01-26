import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, LayoutList, ListTree, Minus, Trash2, Building2, Truck, User } from "lucide-react";
import { PlaybookItem } from "@/types/playbook";
import { cn } from "@/lib/utils";
import { playbookService } from "@/services/playbookService";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// Componente auxiliar para o seletor de destino compacto
const DestinationSelect = ({
  value,
  onChange,
  disabled,
}: {
  value?: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => {
  const getIcon = (val: string | null | undefined) => {
    switch (val) {
      case "obra_direta":
        return <Building2 className="w-3 h-3" />;
      case "fornecimento":
        return <Truck className="w-3 h-3" />;
      case "cliente":
        return <User className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getLabel = (val: string | null | undefined) => {
    switch (val) {
      case "obra_direta":
        return "Obra";
      case "fornecimento":
        return "Forn.";
      case "cliente":
        return "Cliente";
      default:
        return "—";
    }
  };

  if (disabled) {
    return <span className="text-[10px] text-slate-300">—</span>;
  }

  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "h-5 text-[10px] px-1.5 border-none shadow-none bg-transparent hover:bg-slate-100 transition-colors",
          value ? "text-slate-600" : "text-slate-400",
        )}
      >
        <span className="flex items-center gap-1">
          {getIcon(value)}
          <span>{getLabel(value)}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="obra_direta">
          <span className="flex items-center gap-2 text-xs">
            <Building2 className="w-3 h-3" /> Obra Direta
          </span>
        </SelectItem>
        <SelectItem value="fornecimento">
          <span className="flex items-center gap-2 text-xs">
            <Truck className="w-3 h-3" /> Fornecimento
          </span>
        </SelectItem>
        <SelectItem value="cliente">
          <span className="flex items-center gap-2 text-xs">
            <User className="w-3 h-3" /> Cliente
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

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

  const handleDestinationChange = async (itemId: string, field: string, value: string) => {
    try {
      await playbookService.atualizarItem(itemId, { [field]: value });
      toast({ title: "Destino atualizado" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const getMetaValue = (originalVal: number, item: any) => {
    if (!item.precoTotal || item.precoTotal === 0) return 0;
    const ratio = (item.precoTotalMeta || 0) / item.precoTotal;
    return originalVal * ratio;
  };

  // Calculate percentage based on grand total
  const getPercentage = (item: any) => {
    const total = item.precoTotal || item.preco_total || 0;
    if (grandTotalOriginal === 0) return 0;
    return (total / grandTotalOriginal) * 100;
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[70px] text-center text-xs font-bold text-slate-700">Nível</TableHead>
              <TableHead className="w-[250px] max-w-[250px] text-xs font-bold text-slate-700">Descrição</TableHead>
              <TableHead className="w-[50px] text-center text-xs font-bold text-slate-700">Unid.</TableHead>
              <TableHead className="w-[50px] text-center text-xs font-bold text-slate-700">Qtd.</TableHead>
              <TableHead className="w-[60px] text-center text-xs font-bold text-slate-700">%</TableHead>

              <TableHead className="w-[130px] text-right text-xs font-bold text-blue-700 bg-blue-50/50">
                Mão de Obra
              </TableHead>
              <TableHead className="w-[130px] text-right text-xs font-bold text-orange-700 bg-orange-50/50">
                Materiais
              </TableHead>
              <TableHead className="w-[130px] text-right text-xs font-bold text-yellow-700 bg-yellow-50/50">
                Equip.
              </TableHead>
              <TableHead className="w-[130px] text-right text-xs font-bold text-emerald-700 bg-emerald-50/50">
                Verbas
              </TableHead>

              <TableHead className="w-[110px] text-right text-xs font-bold text-slate-900 bg-slate-100">
                Total Orig.
              </TableHead>
              <TableHead className="w-[110px] text-right text-xs font-bold text-[#A47528] bg-[#A47528]/10">
                Total Meta
              </TableHead>
              {!readOnly && <TableHead className="w-[70px] text-center text-xs font-bold">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: any) => {
              const isParent = item.nivel === 0 || item.nivel === 1;
              const percentage = getPercentage(item);
              const isHighPercentage = percentage > 2;

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
                    {item.nivel === 0 && <Badge className="bg-slate-800 h-5 text-[10px]">NV 0</Badge>}
                    {item.nivel === 1 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 h-5 text-[10px]">
                        NV 1
                      </Badge>
                    )}
                    {item.nivel === 2 && (
                      <Badge variant="outline" className="border-slate-200 text-slate-400 h-5 text-[10px]">
                        ITEM
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2 max-w-[250px]">
                    <div
                      className={cn(
                        "flex items-start gap-2 text-sm",
                        item.nivel === 1 && "pl-4",
                        item.nivel === 2 && "pl-8 text-slate-600",
                      )}
                    >
                      <span className="flex-shrink-0 mt-0.5">
                        {item.nivel === 0 && <LayoutList className="h-4 w-4 text-slate-700" />}
                        {item.nivel === 1 && <ListTree className="h-4 w-4 text-blue-400" />}
                        {item.nivel === 2 && <Minus className="h-3 w-3 text-slate-300" />}
                      </span>
                      <span
                        className="break-words whitespace-normal leading-tight"
                        title={item.descricao || item.etapa}
                      >
                        {item.descricao || item.etapa}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs text-slate-500 py-2">{item.unidade}</TableCell>
                  <TableCell className="text-center text-xs text-slate-500 py-2">{item.qtd}</TableCell>

                  {/* Coluna de % */}
                  <TableCell className="text-center py-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded",
                        isHighPercentage ? "bg-amber-100 text-amber-800 font-bold" : "text-slate-500",
                      )}
                    >
                      {percentage.toFixed(1)}%
                    </span>
                  </TableCell>

                  {/* Mão de Obra */}
                  <TableCell className="text-right py-2 bg-blue-50/20">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-slate-700">
                        {formatCurrency(item.valor_mao_de_obra)}
                      </span>
                      {item.nivel === 2 && (
                        <span className="text-[10px] text-blue-600">
                          {formatCurrency(getMetaValue(item.valor_mao_de_obra, item))}
                        </span>
                      )}
                      {item.nivel === 2 && item.valor_mao_de_obra > 0 && (
                        <DestinationSelect
                          value={item.destino_mao_de_obra}
                          onChange={(v) => handleDestinationChange(item.id, "destino_mao_de_obra", v)}
                        />
                      )}
                    </div>
                  </TableCell>

                  {/* Materiais */}
                  <TableCell className="text-right py-2 bg-orange-50/20">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-slate-700">{formatCurrency(item.valor_materiais)}</span>
                      {item.nivel === 2 && (
                        <span className="text-[10px] text-orange-600">
                          {formatCurrency(getMetaValue(item.valor_materiais, item))}
                        </span>
                      )}
                      {item.nivel === 2 && item.valor_materiais > 0 && (
                        <DestinationSelect
                          value={item.destino_materiais}
                          onChange={(v) => handleDestinationChange(item.id, "destino_materiais", v)}
                        />
                      )}
                    </div>
                  </TableCell>

                  {/* Equipamentos */}
                  <TableCell className="text-right py-2 bg-yellow-50/20">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-slate-700">
                        {formatCurrency(item.valor_equipamentos)}
                      </span>
                      {item.nivel === 2 && (
                        <span className="text-[10px] text-yellow-600">
                          {formatCurrency(getMetaValue(item.valor_equipamentos, item))}
                        </span>
                      )}
                      {item.nivel === 2 && item.valor_equipamentos > 0 && (
                        <DestinationSelect
                          value={item.destino_equipamentos}
                          onChange={(v) => handleDestinationChange(item.id, "destino_equipamentos", v)}
                        />
                      )}
                    </div>
                  </TableCell>

                  {/* Verbas */}
                  <TableCell className="text-right py-2 bg-emerald-50/20">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-slate-700">{formatCurrency(item.valor_verbas)}</span>
                      {item.nivel === 2 && (
                        <span className="text-[10px] text-emerald-600">
                          {formatCurrency(getMetaValue(item.valor_verbas, item))}
                        </span>
                      )}
                      {item.nivel === 2 && item.valor_verbas > 0 && (
                        <DestinationSelect
                          value={item.destino_verbas}
                          onChange={(v) => handleDestinationChange(item.id, "destino_verbas", v)}
                        />
                      )}
                    </div>
                  </TableCell>

                  {/* Totais */}
                  <TableCell className="text-right py-2 font-medium text-xs bg-slate-50">
                    {formatCurrency(item.precoTotal || item.preco_total)}
                  </TableCell>
                  <TableCell className="text-right py-2 font-bold text-xs text-[#A47528] bg-[#A47528]/5">
                    {formatCurrency(item.precoTotalMeta)}
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
