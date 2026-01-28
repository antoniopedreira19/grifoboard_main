import { useState } from "react";
import { PlaybookItem } from "@/types/playbook";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Pencil } from "lucide-react";
import { playbookService } from "@/services/playbookService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ContractingTableProps {
  items: PlaybookItem[];
  destino: string;
  onUpdate: () => void;
}

const STATUS_OPTIONS = [
  { value: "A Negociar", label: "A Negociar", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "Em Andamento", label: "Em Andamento", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "Negociadas", label: "Contratado", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

export function ContractingTable({ items, destino, onUpdate }: ContractingTableProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await playbookService.updateItem(itemId, { status_contratacao: newStatus });
      toast({ title: "Status atualizado" });
      onUpdate();
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleDateChange = async (itemId: string, date: string) => {
    try {
      await playbookService.updateItem(itemId, { data_limite: date });
      // Feedback opcional ou apenas onUpdate
      onUpdate();
    } catch (error) {
      toast({ title: "Erro ao atualizar data", variant: "destructive" });
    }
  };

  const handleStartEdit = (item: PlaybookItem) => {
    setEditingId(item.id);
    setEditValue(String(item.valor_contratado || ""));
  };

  const handleSaveEdit = async (itemId: string) => {
    try {
      const valor = parseFloat(editValue.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
      await playbookService.updateItem(itemId, {
        valor_contratado: valor,
        status_contratacao: valor > 0 ? "Negociadas" : undefined,
      });
      toast({ title: "Valor atualizado" });
      setEditingId(null);
      onUpdate();
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const getStatusBadge = (status: string | null | undefined) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
    return (
      <Badge variant="outline" className={cn("text-xs", option.color)}>
        {option.label}
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[30%] text-xs font-semibold">Descrição</TableHead>
            {/* NOVA COLUNA DATA LIMITE */}
            <TableHead className="w-[15%] text-center text-xs font-semibold">Data Limite</TableHead>
            <TableHead className="w-[15%] text-right text-xs font-semibold">Valor Meta</TableHead>
            <TableHead className="w-[15%] text-right text-xs font-semibold">Valor Contratado</TableHead>
            <TableHead className="w-[15%] text-center text-xs font-semibold">Status</TableHead>
            <TableHead className="w-[10%] text-center text-xs font-semibold">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/20">
              <TableCell className="font-medium text-sm">
                <div className="flex flex-col">
                  <span className="text-foreground">{item.descricao}</span>
                  {item.codigo && <span className="text-xs text-muted-foreground">{item.codigo}</span>}
                </div>
              </TableCell>

              {/* CÉLULA DATA LIMITE */}
              <TableCell className="text-center p-2">
                <Input
                  type="date"
                  className="h-8 w-full text-xs text-center bg-transparent border-slate-200 shadow-none focus:bg-white transition-colors"
                  value={item.data_limite ? item.data_limite.split("T")[0] : ""}
                  onChange={(e) => handleDateChange(item.id, e.target.value)}
                />
              </TableCell>

              <TableCell className="text-right text-sm text-muted-foreground">
                {formatCurrency(item.preco_total || 0)}
              </TableCell>

              <TableCell className="text-right">
                {editingId === item.id ? (
                  <div className="flex items-center gap-1 justify-end">
                    <Input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 h-7 text-sm text-right"
                      placeholder="0,00"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                      onClick={() => handleSaveEdit(item.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive/80"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      item.valor_contratado && item.valor_contratado > 0 ? "text-emerald-600" : "text-muted-foreground",
                    )}
                  >
                    {item.valor_contratado ? formatCurrency(item.valor_contratado) : "—"}
                  </span>
                )}
              </TableCell>

              <TableCell className="text-center">
                <Select
                  value={item.status_contratacao || "A Negociar"}
                  onValueChange={(v) => handleStatusChange(item.id, v)}
                >
                  <SelectTrigger className="h-7 w-32 text-xs border-none bg-transparent mx-auto">
                    <SelectValue>{getStatusBadge(item.status_contratacao)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <Badge variant="outline" className={cn("text-xs", option.color)}>
                          {option.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>

              <TableCell className="text-center">
                {editingId !== item.id && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleStartEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                Nenhum item encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
