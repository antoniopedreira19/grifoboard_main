import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaybookItem } from "@/types/playbook";
import { playbookService } from "@/services/playbookService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Building2, Truck, User, Loader2, Edit2, Check, X, TrendingUp, TrendingDown, Minus, Target, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DestinationType = "obra_direta" | "fornecimento" | "cliente";

interface CostItem {
  itemId: string;
  descricao: string;
  tipo: "mao_de_obra" | "materiais";
  valorOriginal: number;
  valorMeta: number;
  destino: DestinationType;
  valorContratado?: number;
  observacao?: string;
}

interface ContractingManagementProps {
  coeficiente?: number;
}

export function ContractingManagement({ coeficiente = 0.57 }: ContractingManagementProps) {
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
  const [configCoef, setConfigCoef] = useState<number>(coeficiente);

  useEffect(() => {
    loadItems();
  }, [userSession?.obraAtiva?.id]);

  const loadItems = async () => {
    if (!userSession?.obraAtiva?.id) return;
    try {
      setLoading(true);
      const { config, items: data } = await playbookService.getPlaybook(userSession.obraAtiva.id);
      setItems(data);
      // Use o coeficiente selecionado da config
      const selectedCoef = config?.coeficiente_selecionado === "2" 
        ? (config?.coeficiente_2 || 0.75)
        : (config?.coeficiente_1 || 0.57);
      setConfigCoef(selectedCoef);
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

  // Agrupa itens por destino de cada tipo de custo - agora com valor meta correto
  const getItemsForDestination = (destination: DestinationType): CostItem[] => {
    const result: CostItem[] = [];

    items.forEach((item) => {
      if (item.destino_mao_de_obra === destination && item.valor_mao_de_obra > 0) {
        result.push({
          itemId: item.id,
          descricao: item.descricao,
          tipo: "mao_de_obra",
          valorOriginal: item.valor_mao_de_obra,
          valorMeta: item.valor_mao_de_obra * configCoef,
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
          valorOriginal: item.valor_materiais,
          valorMeta: item.valor_materiais * configCoef,
          destino: destination,
          valorContratado: item.valor_contratado,
          observacao: item.observacao,
        });
      }
    });

    return result;
  };

  // Calcula totais por destino
  const getDestinationTotals = (destination: DestinationType) => {
    const costItems = getItemsForDestination(destination);
    const totalMeta = costItems.reduce((sum, item) => sum + item.valorMeta, 0);
    const totalContratado = costItems.reduce((sum, item) => sum + (item.valorContratado || 0), 0);
    const itemsContratados = costItems.filter(item => item.valorContratado && item.valorContratado > 0).length;
    const diferenca = totalContratado - totalMeta;
    const percentual = totalMeta > 0 ? ((diferenca / totalMeta) * 100) : 0;
    
    return { totalMeta, totalContratado, itemsContratados, diferenca, percentual, total: costItems.length };
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
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Determina o status da contratação
  const getContractStatus = (valorMeta: number, valorContratado?: number) => {
    if (!valorContratado || valorContratado === 0) {
      return { status: "pendente", label: "Pendente", color: "bg-slate-100 text-slate-600", icon: Target };
    }
    
    const diferenca = valorContratado - valorMeta;
    const percentual = (diferenca / valorMeta) * 100;
    
    if (percentual <= -5) {
      // Contratou abaixo da meta (ótimo)
      return { status: "otimo", label: "Abaixo da Meta", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 };
    } else if (percentual >= 5) {
      // Contratou acima da meta (ruim)
      return { status: "ruim", label: "Acima da Meta", color: "bg-red-100 text-red-800", icon: XCircle };
    } else {
      // Dentro da margem (bom)
      return { status: "bom", label: "Na Meta", color: "bg-amber-100 text-amber-800", icon: CheckCircle2 };
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

  // Card de resumo para cada destino
  const renderSummaryCard = (destination: DestinationType) => {
    const totals = getDestinationTotals(destination);
    if (totals.total === 0) return null;

    const isPositive = totals.diferenca < 0;
    const isNeutral = totals.itemsContratados === 0;

    return (
      <Card className="border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm mb-4">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Total Meta</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(totals.totalMeta)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Total Contratado</span>
              <span className="text-lg font-bold text-slate-900">
                {totals.itemsContratados > 0 ? formatCurrency(totals.totalContratado) : "—"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Diferença</span>
              <div className="flex items-center gap-1">
                {!isNeutral && (
                  <>
                    {isPositive ? (
                      <TrendingDown className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    )}
                    <span className={cn(
                      "text-lg font-bold",
                      isPositive ? "text-emerald-600" : "text-red-600"
                    )}>
                      {formatCurrency(Math.abs(totals.diferenca))}
                    </span>
                  </>
                )}
                {isNeutral && <span className="text-lg font-bold text-slate-400">—</span>}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Status</span>
              {!isNeutral ? (
                <Badge className={cn(
                  "w-fit mt-1",
                  isPositive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                )}>
                  {isPositive ? "Economia" : "Acima do Meta"} ({Math.abs(totals.percentual).toFixed(1)}%)
                </Badge>
              ) : (
                <Badge className="w-fit mt-1 bg-slate-100 text-slate-600">
                  {totals.itemsContratados}/{totals.total} contratados
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
      <>
        {renderSummaryCard(destination)}
        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-bold">Descrição</TableHead>
                <TableHead className="text-xs font-bold w-[100px]">Tipo</TableHead>
                <TableHead className="text-xs font-bold text-right w-[120px]">Valor Meta</TableHead>
                <TableHead className="text-xs font-bold text-right w-[120px]">Contratado</TableHead>
                <TableHead className="text-xs font-bold text-right w-[120px]">Diferença</TableHead>
                <TableHead className="text-xs font-bold w-[120px]">Status</TableHead>
                <TableHead className="text-xs font-bold w-[150px]">Observação</TableHead>
                <TableHead className="text-xs font-bold w-[60px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costItems.map((costItem) => {
                const uniqueKey = `${costItem.itemId}-${costItem.tipo}`;
                const isEditing = editingId === uniqueKey;
                const contractStatus = getContractStatus(costItem.valorMeta, costItem.valorContratado);
                const diferenca = (costItem.valorContratado || 0) - costItem.valorMeta;
                const hasContrato = costItem.valorContratado && costItem.valorContratado > 0;
                const StatusIcon = contractStatus.icon;

                return (
                  <TableRow key={uniqueKey} className="hover:bg-slate-50/50">
                    <TableCell className="text-sm font-medium">{costItem.descricao}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px]", getTipoColor(costItem.tipo))}>
                        {getTipoLabel(costItem.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#A47528]">
                      {formatCurrency(costItem.valorMeta)}
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
                        <span className="text-sm font-medium">
                          {hasContrato ? formatCurrency(costItem.valorContratado!) : "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasContrato && (
                        <div className="flex items-center justify-end gap-1">
                          {diferenca < 0 ? (
                            <TrendingDown className="h-3 w-3 text-emerald-600" />
                          ) : diferenca > 0 ? (
                            <TrendingUp className="h-3 w-3 text-red-600" />
                          ) : (
                            <Minus className="h-3 w-3 text-slate-400" />
                          )}
                          <span className={cn(
                            "text-xs font-medium",
                            diferenca < 0 ? "text-emerald-600" : diferenca > 0 ? "text-red-600" : "text-slate-500"
                          )}>
                            {formatCurrency(Math.abs(diferenca))}
                          </span>
                        </div>
                      )}
                      {!hasContrato && <span className="text-xs text-slate-400">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] gap-1", contractStatus.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {contractStatus.label}
                      </Badge>
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
                        <span className="text-xs text-slate-500 line-clamp-1">{costItem.observacao || "—"}</span>
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
      </>
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
        <p className="text-slate-600">Acompanhe os valores contratados vs meta e identifique oportunidades.</p>
      </div>

      <Tabs value={activeDestination} onValueChange={(v) => setActiveDestination(v as DestinationType)}>
        <TabsList className="bg-white border p-1 rounded-lg shadow-sm">
          <TabsTrigger value="obra_direta" className="px-4 py-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Obra
            <Badge variant="secondary" className="ml-1 text-[10px] bg-[#A47528] text-white">{counts.obra_direta}</Badge>
          </TabsTrigger>
          <TabsTrigger value="fornecimento" className="px-4 py-2 flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Fornecimento
            <Badge variant="secondary" className="ml-1 text-[10px] bg-[#A47528] text-white">{counts.fornecimento}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cliente" className="px-4 py-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Cliente
            <Badge variant="secondary" className="ml-1 text-[10px] bg-[#A47528] text-white">{counts.cliente}</Badge>
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
