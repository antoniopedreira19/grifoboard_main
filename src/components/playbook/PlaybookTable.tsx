import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Search, ListTree, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { playbookService } from "@/services/playbookService";
import { useToast } from "@/hooks/use-toast";

export interface PlaybookItem {
  id: number | string;
  descricao: string;
  unidade: string;
  qtd: number;
  precoUnitario: number;
  precoTotal: number;
  isEtapa: boolean;
  nivel?: number;
  precoUnitarioMeta: number;
  precoTotalMeta: number;
  porcentagem: number;
  destino?: string | null;
}

interface PlaybookTableProps {
  data: PlaybookItem[];
  grandTotalOriginal: number;
  grandTotalMeta: number;
  onUpdate?: () => void;
}

export function PlaybookTable({ data, grandTotalOriginal, grandTotalMeta, onUpdate }: PlaybookTableProps) {
  const { toast } = useToast();
  const [expandedIds, setExpandedIds] = useState<Record<string | number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const toggleRow = (id: number | string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allParents = data
      .filter((i) => i.nivel === 0 || i.nivel === 1 || i.isEtapa)
      .reduce(
        (acc, curr) => ({
          ...acc,
          [curr.id]: true,
        }),
        {},
      );
    setExpandedIds(allParents);
  };

  const collapseAll = () => setExpandedIds({});

  const handleSetDestination = async (id: number | string, destino: string) => {
    try {
      await playbookService.updateItem(String(id), { destino: destino === "clean" ? null : destino });
      toast({
        description: destino === "clean" ? "Item removido da gestão." : `Item enviado para ${destino}.`,
        className: "bg-green-50 border-green-200",
      });
      if (onUpdate) onUpdate();
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível definir o destino.", variant: "destructive" });
    }
  };

  const filteredData = data.filter((item) => item.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalsMap = new Map<number | string, { precoTotal: number; precoTotalMeta: number }>();
  let currentL0_Id: number | string | null = null;
  let currentL1_Id: number | string | null = null;

  data.forEach((item) => {
    const level = item.nivel ?? (item.isEtapa ? 0 : 2);
    if (level === 0) {
      currentL0_Id = item.id;
      currentL1_Id = null;
      totalsMap.set(item.id, { precoTotal: 0, precoTotalMeta: 0 });
    } else if (level === 1) {
      currentL1_Id = item.id;
      totalsMap.set(item.id, { precoTotal: 0, precoTotalMeta: 0 });
    } else if (level === 2) {
      if (currentL1_Id !== null) {
        const t1 = totalsMap.get(currentL1_Id) || { precoTotal: 0, precoTotalMeta: 0 };
        totalsMap.set(currentL1_Id, {
          precoTotal: t1.precoTotal + item.precoTotal,
          precoTotalMeta: t1.precoTotalMeta + item.precoTotalMeta,
        });
      }
      if (currentL0_Id !== null) {
        const t0 = totalsMap.get(currentL0_Id) || { precoTotal: 0, precoTotalMeta: 0 };
        totalsMap.set(currentL0_Id, {
          precoTotal: t0.precoTotal + item.precoTotal,
          precoTotalMeta: t0.precoTotalMeta + item.precoTotalMeta,
        });
      }
    }
  });

  currentL0_Id = null;
  currentL1_Id = null;

  const rowsToRender = filteredData.map((item) => {
    const level = item.nivel ?? (item.isEtapa ? 0 : 2);
    const itemId = item.id;
    let isVisible = true;

    if (level === 0) {
      currentL0_Id = itemId;
      currentL1_Id = null;
    } else if (level === 1) {
      currentL1_Id = itemId;
    }

    if (!searchTerm) {
      if (level === 1 && currentL0_Id !== null && !expandedIds[currentL0_Id]) isVisible = false;
      else if (level === 2) {
        if (currentL0_Id !== null && !expandedIds[currentL0_Id]) isVisible = false;
        else if (currentL1_Id !== null && !expandedIds[currentL1_Id]) isVisible = false;
      }
    }

    const isExpanded = !!expandedIds[itemId];
    const totals = level === 0 || level === 1 ? totalsMap.get(itemId) : undefined;
    const valMeta = totals ? totals.precoTotalMeta : item.precoTotalMeta;
    const displayPercentage = grandTotalMeta > 0 ? (valMeta / grandTotalMeta) * 100 : 0;

    return {
      ...item,
      level,
      visible: isVisible,
      isExpanded,
      displayTotal: totals ? totals.precoTotal : item.precoTotal,
      displayTotalMeta: totals ? totals.precoTotalMeta : item.precoTotalMeta,
      displayPercentage,
    };
  });

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes soft-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.05); } }
        .animate-soft-pulse { animation: soft-pulse 3s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar item ou etapa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={expandAll} className="flex-1 sm:flex-none text-slate-600">
            Expandir Todos
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="flex-1 sm:flex-none text-slate-600">
            Recolher Todos
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[30%] pl-6">Descrição</TableHead>
                <TableHead className="text-right w-[60px]">Unid.</TableHead>
                <TableHead className="text-right w-[60px]">Qtd</TableHead>
                <TableHead className="text-right">Preço Unit.</TableHead>
                <TableHead className="text-right">Preço Total</TableHead>
                <TableHead className="text-right bg-blue-50/50 text-blue-900 border-l border-blue-100">
                  Unit. Meta
                </TableHead>
                <TableHead className="text-right bg-blue-50/50 text-blue-900 font-bold">Total Meta</TableHead>
                <TableHead className="text-right w-[50px]">%</TableHead>
                <TableHead className="text-center w-[120px]">Gestão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rowsToRender
                .filter((r) => r.visible)
                .map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      item.level === 0
                        ? "bg-slate-100/80 hover:bg-slate-200/50 border-t-2 border-slate-200 cursor-pointer"
                        : item.level === 1
                          ? "bg-blue-50/30 hover:bg-blue-50 border-t border-blue-100 cursor-pointer"
                          : "hover:bg-slate-50 border-b border-slate-50",
                    )}
                    onClick={item.level === 0 || item.level === 1 ? () => toggleRow(item.id) : undefined}
                  >
                    <TableCell
                      className={cn("py-3 relative", item.level === 0 ? "pl-6" : item.level === 1 ? "pl-10" : "pl-14")}
                    >
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          item.level === 0
                            ? "font-bold text-slate-800 uppercase text-sm"
                            : item.level === 1
                              ? "font-bold text-blue-900 text-xs uppercase tracking-wide"
                              : "text-slate-600 capitalize text-sm",
                        )}
                      >
                        {(item.level === 0 || item.level === 1) && (
                          <div className="p-1 rounded-md hover:bg-black/5 transition-colors">
                            {item.isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                        )}
                        {item.level === 1 && <ListTree className="h-3 w-3 text-blue-400 mr-1 opacity-50" />}
                        {item.level === 2 && <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200" />}
                        <span>{item.descricao.toLowerCase()}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right text-xs text-slate-500">{item.unidade}</TableCell>
                    <TableCell className="text-right text-xs text-slate-500">{item.qtd > 0 ? item.qtd : "-"}</TableCell>
                    <TableCell className="text-right text-xs font-mono text-slate-600">
                      {item.level === 2 && formatCurrency(item.precoUnitario)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-slate-600 font-medium">
                      {formatCurrency(item.displayTotal)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-blue-600 bg-blue-50/30 border-l border-blue-50">
                      {item.level === 2 && formatCurrency(item.precoUnitarioMeta)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono font-bold text-blue-700 bg-blue-50/30">
                      {formatCurrency(item.displayTotalMeta)}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.displayPercentage > 0 && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-mono text-[10px] border transition-all",
                            item.displayPercentage > 2
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 animate-soft-pulse font-bold shadow-sm"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200",
                            item.level === 0 && "text-[11px] font-bold",
                            item.level === 1 && "text-[10px] font-semibold",
                          )}
                        >
                          {item.displayPercentage.toFixed(2)}%
                        </Badge>
                      )}
                    </TableCell>

                    {/* Coluna GESTÃO Atualizada: Permite selecionar se >2% OU se já tem destino, independente do nível */}
                    <TableCell className="text-center p-1">
                      {item.displayPercentage > 2 || item.destino ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={item.destino || ""}
                            onValueChange={(val) => handleSetDestination(item.id, val)}
                          >
                            <SelectTrigger
                              className={cn(
                                "h-7 text-[10px] w-full border-0 shadow-sm transition-all",
                                item.destino
                                  ? "bg-blue-100 text-blue-800 font-bold hover:bg-blue-200"
                                  : "bg-white text-slate-400 hover:bg-slate-50 border border-slate-200",
                              )}
                            >
                              <div className="flex items-center gap-1 justify-center w-full">
                                {item.destino ? (
                                  <span>{item.destino}</span>
                                ) : (
                                  <>
                                    <span className="hidden sm:inline">Definir</span>
                                    <ArrowUpRight className="h-3 w-3 opacity-50" />
                                  </>
                                )}
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Obra">Obra Direta</SelectItem>
                              <SelectItem value="Fornecimento">Fornecimento</SelectItem>
                              <SelectItem value="Cliente">Cliente</SelectItem>
                              {item.destino && (
                                <>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <SelectItem
                                    value="clean"
                                    className="text-red-500 focus:text-red-600 focus:bg-red-50 font-medium"
                                  >
                                    Remover
                                  </SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className="text-slate-200 text-[10px]">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

              {rowsToRender.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-400">
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter className="bg-slate-800 text-white hover:bg-slate-800 border-t-4 border-yellow-500 sticky bottom-0 z-20 shadow-xl">
              <TableRow>
                <TableCell colSpan={4} className="pl-6 font-bold uppercase tracking-wider text-sm py-4">
                  Total Geral Consolidado
                </TableCell>
                <TableCell className="text-right font-bold font-mono text-white text-sm">
                  {formatCurrency(grandTotalOriginal)}
                </TableCell>
                <TableCell className="text-right border-l border-slate-600/50" />
                <TableCell className="text-right font-bold font-mono text-yellow-400 text-sm">
                  {formatCurrency(grandTotalMeta)}
                </TableCell>
                <TableCell className="text-right font-bold text-xs text-slate-300">100%</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
    </div>
  );
}
