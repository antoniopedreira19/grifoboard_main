import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaybookItem } from "@/types/playbook";
import { playbookService } from "@/services/playbookService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Building2, Truck, User, Loader2, AlertCircle, FileText, Edit2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DestinationType = "obra_direta" | "fornecimento" | "cliente";

interface CostItem {
  itemId: string;
  descricao: string;
  tipo: "mao_de_obra" | "materiais" | "equipamentos" | "verbas";
  valor: number;
  destino: DestinationType;
  valorContratado?: number;
  observacao?: string;
}

export function ContractingManagement() {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PlaybookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDestination, setActiveDestination] = useState<DestinationType>("obra_direta");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ valorContratado: number; observacao: string }>({
    valorContratado: 0,
    observacao: "",
  });

  useEffect(() => {
    loadItems();
  }, [userSession?.obraAtiva?.id]);

  const loadItems = async () => {
    if (!userSession?.obraAtiva?.id) return;
    try {
      setLoading(true);
      const data = await playbookService.listarItens(userSession.obraAtiva.id);
      setItems(data.filter((item) => item.nivel === 2));
    } catch (error) {
      console.error("Erro ao carregar itens", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os itens do playbook.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Agrupa itens por destino de cada tipo de custo
  const getItemsForDestination = (destination: DestinationType): CostItem[] => {
    const result: CostItem[] = [];

    items.forEach((item) => {
      if (item.destino_mao_de_obra === destination && item.valor_mao_de_obra > 0) {
        result.push({
          itemId: item.id,
          descricao: item.descricao,
          tipo: "mao_de_obra",
          valor: item.valor_mao_de_obra,
          destino: destination,
          valorContratado: item.valor_contratado,
          observacao: item.observacao,
        });
      }
      if (item.destino_materiais === destination && item.valor_materiais > 0) {
        result.push({
          itemId: item.id,
          descricao: item.descricao,
          tipo: "materiais",
          valor: item.valor_materiais,
          destino: destination,
          valorContratado: item.valor_contratado,
          observacao: item.observacao,
        });
      }
      if (item.destino_equipamentos === destination && item.valor_equipamentos > 0) {
        result.push({
          itemId: item.id,
          descricao: item.descricao,
          tipo: "equipamentos",
          valor: item.valor_equipamentos,
          destino: destination,
          valorContratado: item.valor_contratado,
          observacao: item.observacao,
        });
      }
      if (item.destino_verbas === destination && item.valor_verbas > 0) {
        result.push({
          itemId: item.id,
          descricao: item.descricao,
          tipo: "verbas",
          valor: item.valor_verbas,
          destino: destination,
          valorContratado: item.valor_contratado,
          observacao: item.observacao,
        });
      }
    });

    return result;
  };

  const getCounts = () => ({
    obra_direta: getItemsForDestination("obra_direta").length,
    fornecimento: getItemsForDestination("fornecimento").length,
    cliente: getItemsForDestination("cliente").length,
  });

  const counts = getCounts();

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "mao_de_obra":
        return "Mão de Obra";
      case "materiais":
        return "Materiais";
      case "equipamentos":
        return "Equipamentos";
      case "verbas":
        return "Verbas";
      default:
        return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "mao_de_obra":
        return "bg-blue-100 text-blue-800";
      case "materiais":
        return "bg-orange-100 text-orange-800";
      case "equipamentos":
        return "bg-yellow-100 text-yellow-800";
      case "verbas":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const handleStartEdit = (costItem: CostItem) => {
    setEditingId(`${costItem.itemId}-${costItem.tipo}`);
    setEditValues({
      valorContratado: costItem.valorContratado || 0,
      observacao: costItem.observacao || "",
    });
  };

  const handleSaveEdit = async (itemId: string) => {
    try {
      await playbookService.atualizarItem(itemId, {
        valor_contratado: editValues.valorContratado,
        observacao: editValues.observacao,
      });
      toast({ title: "Salvo com sucesso" });
      setEditingId(null);
      loadItems();
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const renderDestinationContent = (destination: DestinationType) => {
    const costItems = getItemsForDestination(destination);

    if (costItems.length === 0) {
      return (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">Nenhum item enviado para {destination === "obra_direta" ? "Obra" : destination === "fornecimento" ? "Fornecimento" : "Cliente"} ainda.</p>
            <p className="text-slate-400 text-sm mt-1">Vá na aba "Orçamento" e classifique os itens relevantes.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-xs font-bold">Descrição</TableHead>
              <TableHead className="text-xs font-bold w-[100px]">Tipo</TableHead>
              <TableHead className="text-xs font-bold text-right w-[120px]">Valor Meta</TableHead>
              <TableHead className="text-xs font-bold text-right w-[120px]">Contratado</TableHead>
              <TableHead className="text-xs font-bold w-[200px]">Observação</TableHead>
              <TableHead className="text-xs font-bold w-[80px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costItems.map((costItem) => {
              const uniqueKey = `${costItem.itemId}-${costItem.tipo}`;
              const isEditing = editingId === uniqueKey;

              return (
                <TableRow key={uniqueKey} className="hover:bg-slate-50/50">
                  <TableCell className="text-sm">{costItem.descricao}</TableCell>
                  <TableCell>
                    <Badge className={cn("text-[10px]", getTipoColor(costItem.tipo))}>
                      {getTipoLabel(costItem.tipo)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatCurrency(costItem.valor)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editValues.valorContratado}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, valorContratado: parseFloat(e.target.value) || 0 }))}
                        className="h-7 text-sm w-28"
                      />
                    ) : (
                      <span className="text-sm">{costItem.valorContratado ? formatCurrency(costItem.valorContratado) : "—"}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editValues.observacao}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, observacao: e.target.value }))}
                        className="h-7 text-sm"
                        placeholder="Observação..."
                      />
                    ) : (
                      <span className="text-xs text-slate-500">{costItem.observacao || "—"}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(costItem.itemId)}>
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStartEdit(costItem)}>
                        <Edit2 className="h-3 w-3 text-slate-400" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Carregando itens do orçamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Farol de Contratações</h2>
        <p className="text-slate-600">Clique em cada campo para editar.</p>
      </div>

      <Tabs value={activeDestination} onValueChange={(v) => setActiveDestination(v as DestinationType)}>
        <TabsList className="bg-white border p-1 rounded-lg shadow-sm">
          <TabsTrigger value="obra_direta" className="px-4 py-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Obra
            <Badge variant="secondary" className="ml-1 text-[10px]">{counts.obra_direta}</Badge>
          </TabsTrigger>
          <TabsTrigger value="fornecimento" className="px-4 py-2 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Fornecimento
            <Badge variant="secondary" className="ml-1 text-[10px]">{counts.fornecimento}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cliente" className="px-4 py-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Cliente
            <Badge variant="secondary" className="ml-1 text-[10px]">{counts.cliente}</Badge>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="obra_direta">
            {renderDestinationContent("obra_direta")}
          </TabsContent>
          <TabsContent value="fornecimento">
            {renderDestinationContent("fornecimento")}
          </TabsContent>
          <TabsContent value="cliente">
            {renderDestinationContent("cliente")}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
