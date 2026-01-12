import { memo, useMemo, useState, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit2,
  LayoutList,
  ListTree,
  Minus,
  ChevronDown,
  ChevronRight,
  Settings2,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { PlaybookItem } from "@/types/playbook";
import { cn } from "@/lib/utils";
import { playbookService } from "@/services/playbookService";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VirtualizedPlaybookTableProps {
  data: PlaybookItem[];
  grandTotalOriginal: number;
  grandTotalMeta: number;
  onUpdate: () => void;
  onOptimisticUpdate?: (itemId: string, field: string, value: string) => void;
  onEdit?: (item: PlaybookItem) => void;
  readOnly?: boolean;
}

// Memoized currency formatter
const formatCurrency = (val: number | undefined | null) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val || 0);
};

const destinationOptions = [
  { value: "obra_direta", label: "Obra Direta", color: "bg-blue-100 text-blue-800" },
  { value: "fornecimento", label: "Fornecimento", color: "bg-orange-100 text-orange-800" },
  { value: "cliente", label: "Cliente", color: "bg-emerald-100 text-emerald-800" },
];

// Destination selector component for popover - shows META values (original * coefficient)
const DestinationSelector = memo(function DestinationSelector({
  item,
  onDestinationChange,
}: {
  item: any;
  onDestinationChange: (itemId: string, field: string, value: string) => void;
}) {
  // Calculate meta values (original * coefficient ratio)
  const getMetaValue = useCallback(
    (originalVal: number) => {
      const precoTotal = item.precoTotal || item.preco_total || 0;
      if (!precoTotal || precoTotal === 0) return 0;
      const ratio = (item.precoTotalMeta || 0) / precoTotal;
      return originalVal * ratio;
    },
    [item.precoTotal, item.preco_total, item.precoTotalMeta],
  );

  const metaMaoDeObra = getMetaValue(item.valor_mao_de_obra || 0);
  const metaMateriais = getMetaValue(item.valor_materiais || 0);

  const hasValues = metaMaoDeObra > 0 || metaMateriais > 0;

  if (!hasValues) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-5 w-5" title="Destinos">
          <Settings2 className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 bg-white" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-slate-700">Definir destinos (valores meta)</h4>

          {metaMaoDeObra > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-blue-700 font-medium">Mão de Obra</span>
                <span className="text-[10px] text-slate-500">{formatCurrency(metaMaoDeObra)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Select
                  value={item.destino_mao_de_obra || ""}
                  onValueChange={(v) => onDestinationChange(item.id, "destino_mao_de_obra", v)}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {destinationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {item.destino_mao_de_obra && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => onDestinationChange(item.id, "destino_mao_de_obra", "")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {metaMateriais > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-orange-700 font-medium">Materiais</span>
                <span className="text-[10px] text-slate-500">{formatCurrency(metaMateriais)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Select
                  value={item.destino_materiais || ""}
                  onValueChange={(v) => onDestinationChange(item.id, "destino_materiais", v)}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {destinationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {item.destino_materiais && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => onDestinationChange(item.id, "destino_materiais", "")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

// Memoized row component
const PlaybookRow = memo(function PlaybookRow({
  item,
  grandTotalOriginal,
  isCollapsed,
  onToggleCollapse,
  onDestinationChange,
  onEdit,
  readOnly,
}: {
  item: any;
  grandTotalOriginal: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onDestinationChange: (itemId: string, field: string, value: string) => void;
  onEdit?: (item: PlaybookItem) => void;
  readOnly?: boolean;
}) {
  const percentage = useMemo(() => {
    const total = item.precoTotal || item.preco_total || 0;
    if (grandTotalOriginal === 0) return 0;
    return (total / grandTotalOriginal) * 100;
  }, [item.precoTotal, item.preco_total, grandTotalOriginal]);

  const isHighPercentage = percentage >= 2;

  return (
    <div
      className={cn(
        "flex items-stretch border-b border-slate-100 hover:bg-slate-50/80 transition-colors min-h-[48px]",
        item.nivel === 0 && "bg-slate-100/50 font-semibold border-t-2 border-slate-200",
        item.nivel === 1 && "bg-blue-50/10 text-blue-900",
      )}
    >
      {/* Nível */}
      <div className="w-[70px] flex items-center justify-center py-2 flex-shrink-0">
        {item.nivel === 0 && (
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button onClick={onToggleCollapse} className="p-0.5 hover:bg-slate-200 rounded">
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            <Badge className="bg-slate-800 h-5 text-[10px]">Etapa</Badge>
          </div>
        )}
        {item.nivel === 1 && (
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button onClick={onToggleCollapse} className="p-0.5 hover:bg-blue-200 rounded">
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 h-5 text-[10px]">
              SubEtapa
            </Badge>
          </div>
        )}
        {item.nivel === 2 && (
          <Badge variant="outline" className="border-slate-200 text-slate-400 h-5 text-[10px]">
            Item
          </Badge>
        )}
      </div>

      {/* Descrição */}
      <div className="w-[300px] py-2 flex-shrink-0">
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
            className="break-words whitespace-normal leading-tight line-clamp-2"
            title={item.descricao || item.etapa}
          >
            {item.descricao || item.etapa}
          </span>
        </div>
      </div>

      {/* Unidade */}
      <div className="w-[60px] flex items-center justify-center text-xs text-slate-500 py-2 flex-shrink-0">
        {item.unidade}
      </div>

      {/* Qtd */}
      <div className="w-[60px] flex items-center justify-center text-xs text-slate-500 py-2 flex-shrink-0">
        {item.qtd}
      </div>

      {/* Mão de Obra */}
      <div className="w-[130px] flex items-center justify-end py-2 px-2 bg-blue-50/20 flex-shrink-0">
        <span className="text-xs font-medium text-slate-700">{formatCurrency(item.valor_mao_de_obra)}</span>
      </div>

      {/* Materiais */}
      <div className="w-[130px] flex items-center justify-end py-2 px-2 bg-orange-50/20 flex-shrink-0">
        <span className="text-xs font-medium text-slate-700">{formatCurrency(item.valor_materiais)}</span>
      </div>

      {/* Total Original */}
      <div className="w-[130px] flex items-center justify-end py-2 px-2 font-medium text-xs bg-slate-50 flex-shrink-0">
        {formatCurrency(item.precoTotal || item.preco_total)}
      </div>

      {/* Total Meta */}
      <div className="w-[130px] flex items-center justify-end py-2 px-2 font-bold text-xs text-[#A47528] bg-[#A47528]/5 flex-shrink-0">
        {formatCurrency(item.precoTotalMeta)}
      </div>

      {/* % - após Total Meta */}
      <div className="w-[55px] flex items-center justify-center py-2 flex-shrink-0">
        <span
          className={cn(
            "text-xs font-medium px-1 py-0.5 rounded",
            isHighPercentage ? "bg-amber-100 text-amber-800 font-bold" : "text-slate-500",
          )}
        >
          {percentage.toFixed(1)}%
        </span>
      </div>

      {/* Ações - Mínimo */}
      {!readOnly && (
        <div className="w-[50px] flex items-center justify-center gap-0.5 py-2 flex-shrink-0">
          {isHighPercentage && <DestinationSelector item={item} onDestinationChange={onDestinationChange} />}
        </div>
      )}
    </div>
  );
});

export const VirtualizedPlaybookTable = memo(function VirtualizedPlaybookTable({
  data,
  grandTotalOriginal,
  grandTotalMeta,
  onUpdate,
  onOptimisticUpdate,
  onEdit,
  readOnly = false,
}: VirtualizedPlaybookTableProps) {
  const { toast } = useToast();
  const parentRef = useRef<HTMLDivElement>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Memoize visible items based on collapsed sections
  const visibleItems = useMemo(() => {
    if (collapsedSections.size === 0) return data;

    const result: typeof data = [];
    let skipUntilLevel: number | null = null;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const nivel = item.nivel ?? 2;

      // If we're skipping and this item is at a level <= skipUntilLevel, stop skipping
      if (skipUntilLevel !== null && nivel <= skipUntilLevel) {
        skipUntilLevel = null;
      }

      // If we're currently skipping, continue
      if (skipUntilLevel !== null) continue;

      result.push(item);

      // If this item is collapsed, start skipping
      if (collapsedSections.has(item.id)) {
        skipUntilLevel = nivel;
      }
    }

    return result;
  }, [data, collapsedSections]);

  const virtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5, // Reduzido para melhor performance
  });

  // Get all collapsible items (nivel 0 or 1)
  const collapsibleIds = useMemo(() => {
    return data.filter((item) => item.nivel === 0 || item.nivel === 1).map((item) => item.id);
  }, [data]);

  const handleToggleCollapse = useCallback((itemId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsedSections(new Set());
  }, []);

  const handleCollapseAll = useCallback(() => {
    setCollapsedSections(new Set(collapsibleIds));
  }, [collapsibleIds]);

  const isAllExpanded = collapsedSections.size === 0;
  const isAllCollapsed = collapsibleIds.length > 0 && collapsedSections.size === collapsibleIds.length;

  // Optimistic update handler
  const handleDestinationChange = useCallback(
    async (itemId: string, field: string, value: string) => {
      // Convert empty string to null for clearing destinations
      const dbValue = value === "" ? null : value;

      // Optimistic update - update UI immediately
      if (onOptimisticUpdate) {
        onOptimisticUpdate(itemId, field, value);
      }

      try {
        await playbookService.atualizarItem(itemId, { [field]: dbValue });
        toast({ title: dbValue ? "Destino atualizado" : "Destino removido" });
        // Only refetch if no optimistic update was provided
        if (!onOptimisticUpdate) {
          onUpdate();
        }
      } catch (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
        // Revert on error
        onUpdate();
      }
    },
    [toast, onUpdate, onOptimisticUpdate],
  );

  const virtualItems = virtualizer.getVirtualItems();

  // Calculate total width for proper scrolling
  const totalWidth = 70 + 300 + 60 + 60 + 130 + 130 + 130 + 130 + 55 + (readOnly ? 0 : 50);

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Expand/Collapse controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-xs text-slate-500">
          {data.length} itens • {visibleItems.length} visíveis
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleExpandAll}
            disabled={isAllExpanded}
          >
            <Maximize2 className="h-3 w-3" />
            Expandir Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleCollapseAll}
            disabled={isAllCollapsed}
          >
            <Minimize2 className="h-3 w-3" />
            Recolher Todos
          </Button>
        </div>
      </div>

      {/* Scrollable container for header + body */}
      <div
        ref={parentRef}
        className="overflow-auto playbook-table-scroll"
        style={{ height: "calc(100vh - 370px)", minHeight: "450px" }}
      >
        {/* Header - inside scroll container for horizontal sync */}
        <div
          className="flex items-center bg-slate-50 border-b border-slate-200 text-xs font-bold sticky top-0 z-10"
          style={{ minWidth: `${totalWidth}px` }}
        >
          <div className="w-[70px] text-center py-3 text-slate-700 flex-shrink-0">Nível</div>
          <div className="w-[300px] py-3 text-slate-700 flex-shrink-0">Descrição</div>
          <div className="w-[60px] text-center py-3 text-slate-700 flex-shrink-0">Unid.</div>
          <div className="w-[60px] text-center py-3 text-slate-700 flex-shrink-0">Qtd.</div>
          <div className="w-[130px] text-right py-3 px-2 text-blue-700 bg-blue-50/50 flex-shrink-0">Mão de Obra</div>
          <div className="w-[130px] text-right py-3 px-2 text-orange-700 bg-orange-50/50 flex-shrink-0">Materiais</div>
          <div className="w-[130px] text-right py-3 px-2 text-slate-900 bg-slate-100 flex-shrink-0">Total Orig.</div>
          <div className="w-[130px] text-right py-3 px-2 text-[#A47528] bg-[#A47528]/10 flex-shrink-0">Total Meta</div>
          <div className="w-[55px] text-center py-3 text-slate-700 flex-shrink-0">%</div>
          {!readOnly && <div className="w-[50px] text-center py-3 flex-shrink-0"></div>}
        </div>

        {/* Virtualized rows */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            minWidth: `${totalWidth}px`,
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = visibleItems[virtualRow.index];
            const isCollapsible = item.nivel === 0 || item.nivel === 1;
            const isCollapsed = collapsedSections.has(item.id);

            return (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  minWidth: `${totalWidth}px`,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <PlaybookRow
                  item={item}
                  grandTotalOriginal={grandTotalOriginal}
                  isCollapsed={isCollapsible ? isCollapsed : undefined}
                  onToggleCollapse={isCollapsible ? () => handleToggleCollapse(item.id) : undefined}
                  onDestinationChange={handleDestinationChange}
                  onEdit={onEdit}
                  readOnly={readOnly}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer com totais */}
      <div className="flex items-center bg-slate-100 border-t-2 border-slate-300 text-xs font-bold">
        <div className="py-3 px-4 text-slate-700 flex-1">TOTAL GERAL ({data.length} itens)</div>
        <div className="flex items-center gap-6 pr-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-normal">Total Original</span>
            <span className="text-slate-900">{formatCurrency(grandTotalOriginal)}</span>
          </div>
          <div className="flex flex-col items-end px-3 py-1 rounded bg-[#A47528]/10">
            <span className="text-[10px] text-[#A47528]/70 font-normal">Total Meta</span>
            <span className="text-[#A47528]">{formatCurrency(grandTotalMeta)}</span>
          </div>
        </div>
        <div className="w-[55px] flex-shrink-0" />
        {!readOnly && <div className="w-[50px] flex-shrink-0" />}
      </div>
    </div>
  );
});
