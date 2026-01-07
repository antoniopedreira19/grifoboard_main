import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, LayoutList, ListTree, Minus, Trash2, Building2, Truck, User } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlaybookTableProps {
  data: PlaybookItem[];
  grandTotalOriginal: number;
  grandTotalMeta: number;
  onUpdate: () => void;
  onEdit?: (item: PlaybookItem) => void;
  readOnly?: boolean;
}

type DestinoType = "obra_direta" | "fornecimento" | "cliente" | null;

const destinoOptions = [
  { value: "obra_direta", label: "Obra", icon: Building2, color: "text-blue-600" },
  { value: "fornecimento", label: "Forn.", icon: Truck, color: "text-orange-600" },
  { value: "cliente", label: "Cliente", icon: User, color: "text-emerald-600" },
];

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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const handleDestinoChange = async (
    itemId: string,
    field: "destino_mao_de_obra" | "destino_materiais" | "destino_equipamentos" | "destino_verbas",
    value: string
  ) => {
    try {
      await playbookService.atualizarItem(itemId, { [field]: value as DestinoType });
      onUpdate();
    } catch (error) {
      toast({ title: "Erro ao atualizar destino", variant: "destructive" });
    }
  };

  const getMetaValue = (originalVal: number, item: any) => {
    if (!item.precoTotal || item.precoTotal === 0) return 0;
    const ratio = (item.precoTotalMeta || 0) / item.precoTotal;
    return originalVal * ratio;
  };

  const DestinoSelect = ({
    value,
    onChange,
    disabled,
  }: {
    value: string | null | undefined;
    onChange: (val: string) => void;
    disabled?: boolean;
  }) => {
    const selected = destinoOptions.find((o) => o.value === value);
    return (
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-5 w-16 text-[9px] px-1 border-slate-200">
          <SelectValue placeholder="-">
            {selected && (
              <span className={cn("font-medium", selected.color)}>{selected.label}</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {destinoOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              <div className="flex items-center gap-1">
                <opt.icon className={cn("h-3 w-3", opt.color)} />
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[1400px]">
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[60px] text-center text-[10px] font-bold text-slate-700 px-1">Nível</TableHead>
              <TableHead className="min-w-[200px] text-[10px] font-bold text-slate-700 px-2">Descrição</TableHead>
              <TableHead className="w-[40px] text-center text-[10px] font-bold text-slate-700 px-1">Un.</TableHead>
              <TableHead className="w-[40px] text-center text-[10px] font-bold text-slate-700 px-1">Qtd</TableHead>

              {/* Mão de Obra */}
              <TableHead className="w-[75px] text-right text-[10px] font-bold text-blue-700 bg-blue-50/50 px-1">
                M.Obra
              </TableHead>
              <TableHead className="w-[60px] text-center text-[10px] font-bold text-blue-700 bg-blue-50/50 px-1">
                Dest.
              </TableHead>

              {/* Materiais */}
              <TableHead className="w-[75px] text-right text-[10px] font-bold text-orange-700 bg-orange-50/50 px-1">
                Mater.
              </TableHead>
              <TableHead className="w-[60px] text-center text-[10px] font-bold text-orange-700 bg-orange-50/50 px-1">
                Dest.
              </TableHead>

              {/* Equipamentos */}
              <TableHead className="w-[75px] text-right text-[10px] font-bold text-yellow-700 bg-yellow-50/50 px-1">
                Equip.
              </TableHead>
              <TableHead className="w-[60px] text-center text-[10px] font-bold text-yellow-700 bg-yellow-50/50 px-1">
                Dest.
              </TableHead>

              {/* Verbas */}
              <TableHead className="w-[75px] text-right text-[10px] font-bold text-emerald-700 bg-emerald-50/50 px-1">
                Verbas
              </TableHead>
              <TableHead className="w-[60px] text-center text-[10px] font-bold text-emerald-700 bg-emerald-50/50 px-1">
                Dest.
              </TableHead>

              <TableHead className="w-[85px] text-right text-[10px] font-bold text-slate-900 bg-slate-100 px-1">
                Total Orig.
              </TableHead>
              <TableHead className="w-[85px] text-right text-[10px] font-bold text-[#A47528] bg-[#A47528]/10 px-1">
                Total Meta
              </TableHead>
              {!readOnly && <TableHead className="w-[60px] text-center text-[10px] font-bold px-1">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: any) => {
              const isLevel2 = item.nivel === 2;

              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "hover:bg-slate-50/80 transition-colors",
                    item.nivel === 0 && "bg-slate-100/50 font-semibold border-t-2 border-slate-200",
                    item.nivel === 1 && "bg-blue-50/10 text-blue-900",
                  )}
                >
                  <TableCell className="text-center py-1 px-1">
                    {item.nivel === 0 && <Badge className="bg-slate-800 h-4 text-[9px] px-1">NV0</Badge>}
                    {item.nivel === 1 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 h-4 text-[9px] px-1">
                        NV1
                      </Badge>
                    )}
                    {item.nivel === 2 && (
                      <Badge variant="outline" className="border-slate-200 text-slate-400 h-4 text-[9px] px-1">
                        ITEM
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <div
                      className={cn(
                        "flex items-center gap-1 text-[11px]",
                        item.nivel === 1 && "pl-2",
                        item.nivel === 2 && "pl-4 text-slate-600",
                      )}
                    >
                      {item.nivel === 0 && <LayoutList className="h-3 w-3 text-slate-700 flex-shrink-0" />}
                      {item.nivel === 1 && <ListTree className="h-3 w-3 text-blue-400 flex-shrink-0" />}
                      {item.nivel === 2 && <Minus className="h-2 w-2 text-slate-300 flex-shrink-0" />}
                      <span className="truncate" title={item.descricao || item.etapa}>
                        {item.descricao || item.etapa}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-[10px] text-slate-500 py-1 px-1">{item.unidade}</TableCell>
                  <TableCell className="text-center text-[10px] text-slate-500 py-1 px-1">{item.qtd}</TableCell>

                  {/* Mão de Obra */}
                  <TableCell className="text-right py-1 px-1 bg-blue-50/20">
                    <span className="text-[10px] font-medium text-slate-700">
                      {formatCurrency(item.valor_mao_de_obra)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-1 px-1 bg-blue-50/20">
                    {isLevel2 && item.valor_mao_de_obra > 0 ? (
                      <DestinoSelect
                        value={item.destino_mao_de_obra}
                        onChange={(val) => handleDestinoChange(item.id, "destino_mao_de_obra", val)}
                        disabled={readOnly}
                      />
                    ) : (
                      <span className="text-[9px] text-slate-300">-</span>
                    )}
                  </TableCell>

                  {/* Materiais */}
                  <TableCell className="text-right py-1 px-1 bg-orange-50/20">
                    <span className="text-[10px] font-medium text-slate-700">
                      {formatCurrency(item.valor_materiais)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-1 px-1 bg-orange-50/20">
                    {isLevel2 && item.valor_materiais > 0 ? (
                      <DestinoSelect
                        value={item.destino_materiais}
                        onChange={(val) => handleDestinoChange(item.id, "destino_materiais", val)}
                        disabled={readOnly}
                      />
                    ) : (
                      <span className="text-[9px] text-slate-300">-</span>
                    )}
                  </TableCell>

                  {/* Equipamentos */}
                  <TableCell className="text-right py-1 px-1 bg-yellow-50/20">
                    <span className="text-[10px] font-medium text-slate-700">
                      {formatCurrency(item.valor_equipamentos)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-1 px-1 bg-yellow-50/20">
                    {isLevel2 && item.valor_equipamentos > 0 ? (
                      <DestinoSelect
                        value={item.destino_equipamentos}
                        onChange={(val) => handleDestinoChange(item.id, "destino_equipamentos", val)}
                        disabled={readOnly}
                      />
                    ) : (
                      <span className="text-[9px] text-slate-300">-</span>
                    )}
                  </TableCell>

                  {/* Verbas */}
                  <TableCell className="text-right py-1 px-1 bg-emerald-50/20">
                    <span className="text-[10px] font-medium text-slate-700">
                      {formatCurrency(item.valor_verbas)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-1 px-1 bg-emerald-50/20">
                    {isLevel2 && item.valor_verbas > 0 ? (
                      <DestinoSelect
                        value={item.destino_verbas}
                        onChange={(val) => handleDestinoChange(item.id, "destino_verbas", val)}
                        disabled={readOnly}
                      />
                    ) : (
                      <span className="text-[9px] text-slate-300">-</span>
                    )}
                  </TableCell>

                  {/* Totais */}
                  <TableCell className="text-right py-1 px-1 font-medium text-[10px] bg-slate-50">
                    {formatCurrency(item.precoTotal || item.preco_total)}
                  </TableCell>
                  <TableCell className="text-right py-1 px-1 font-bold text-[10px] text-[#A47528] bg-[#A47528]/5">
                    {formatCurrency(item.precoTotalMeta)}
                  </TableCell>

                  {!readOnly && (
                    <TableCell className="text-center py-1 px-1">
                      <div className="flex items-center justify-center gap-0.5">
                        {onEdit && (
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onEdit(item)}>
                            <Edit2 className="h-2.5 w-2.5 text-slate-400" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-red-600">
                              <Trash2 className="h-2.5 w-2.5 text-slate-400" />
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
