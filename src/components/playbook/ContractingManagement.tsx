import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PlaybookItem } from "@/types/playbook";
import { playbookService } from "@/services/playbookService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Building2, Truck, User, Loader2, Edit2, Clock, MessageSquare, CheckCircle2, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DestinationType = "obra_direta" | "fornecimento" | "cliente";
type StatusContratacao = "a_negociar" | "negociando" | "negociado";

interface CostItem {
  itemId: string;
  descricao: string;
  tipo: "mao_de_obra" | "materiais";
  valorOriginal: number;
  valorMeta: number;
  destino: DestinationType;
  valorContratado?: number;
  observacao?: string;
  statusContratacao?: StatusContratacao;
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
  const [configCoef, setConfigCoef] = useState<number>(coeficiente);

  // Modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CostItem | null>(null);
  const [editValues, setEditValues] = useState<{ valorContratado: number; observacao: string; statusContratacao: StatusContratacao }>({
    valorContratado: 0,
    observacao: "",
    statusContratacao: "a_negociar",
  });

  // Modal de valor negociado (quando muda status para negociado)
  const [valorNegociadoModalOpen, setValorNegociadoModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ itemId: string; tipo: string } | null>(null);
  const [valorNegociado, setValorNegociado] = useState<number>(0);

  useEffect(() => {
    loadItems();
  }, [userSession?.obraAtiva?.id]);

  const loadItems = async () => {
    if (!userSession?.obraAtiva?.id) return;
    try {
      setLoading(true);
      const { config, items: data } = await playbookService.getPlaybook(userSession.obraAtiva.id);
      setItems(data);
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
          statusContratacao: (item.status_contratacao as StatusContratacao) || "a_negociar",
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
          statusContratacao: (item.status_contratacao as StatusContratacao) || "a_negociar",
        });
      }
    });

    return result;
  };

  const getDestinationTotals = (destination: DestinationType) => {
    const costItems = getItemsForDestination(destination);
    const totalMeta = costItems.reduce((sum, item) => sum + item.valorMeta, 0);
    const totalContratado = costItems.reduce((sum, item) => sum + (item.valorContratado || 0), 0);
    const itemsNegociados = costItems.filter(item => item.statusContratacao === "negociado").length;
    const diferenca = totalContratado - totalMeta;
    const percentual = totalMeta > 0 ? ((diferenca / totalMeta) * 100) : 0;
    
    return { totalMeta, totalContratado, itemsNegociados, diferenca, percentual, total: costItems.length };
  };

  // Resumo financeiro por status
  const getFinancialSummaryByStatus = (destination: DestinationType) => {
    const costItems = getItemsForDestination(destination);
    const totalMeta = costItems.reduce((sum, item) => sum + item.valorMeta, 0);
    const totalContratado = costItems.reduce((sum, item) => sum + (item.valorContratado || 0), 0);

    const statuses: StatusContratacao[] = ["negociado", "negociando", "a_negociar"];
    const summary = statuses.map((status) => {
      const itemsStatus = costItems.filter((item) =>
        status === "a_negociar"
          ? item.statusContratacao === "a_negociar" || !item.statusContratacao
          : item.statusContratacao === status
      );
      const valorMetaStatus = itemsStatus.reduce((sum, item) => sum + item.valorMeta, 0);
      const valorContratadoStatus = itemsStatus.reduce((sum, item) => sum + (item.valorContratado || 0), 0);
      const verbaDisponivel = valorMetaStatus - valorContratadoStatus;

      return {
        status,
        valorMeta: valorMetaStatus,
        percentMeta: totalMeta > 0 ? (valorMetaStatus / totalMeta) * 100 : 0,
        valorContratado: valorContratadoStatus,
        percentContratado: totalContratado > 0 ? (valorContratadoStatus / totalContratado) * 100 : 0,
        verbaDisponivel,
        percentVerba: valorMetaStatus > 0 ? (1 - valorContratadoStatus / valorMetaStatus) * 100 : 100,
      };
    });

    const totalVerba = totalMeta - totalContratado;
    const percentVerbaTotal = totalMeta > 0 ? (1 - totalContratado / totalMeta) * 100 : 100;

    return { summary, totalMeta, totalContratado, totalVerba, percentVerbaTotal };
  };

  const getCounts = () => ({
    obra_direta: getItemsForDestination("obra_direta").length,
    fornecimento: getItemsForDestination("fornecimento").length,
    cliente: getItemsForDestination("cliente").length,
  });

  const counts = getCounts();

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "mao_de_obra": return "Mão de Obra";
      case "materiais": return "Materiais";
      default: return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "mao_de_obra": return "bg-blue-100 text-blue-800";
      case "materiais": return "bg-orange-100 text-orange-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusLabel = (status: StatusContratacao) => {
    switch (status) {
      case "a_negociar": return "A Negociar";
      case "negociando": return "Negociando";
      case "negociado": return "Negociado";
      default: return "A Negociar";
    }
  };

  const getStatusColor = (status: StatusContratacao) => {
    switch (status) {
      case "a_negociar": return "bg-slate-100 text-slate-600";
      case "negociando": return "bg-amber-100 text-amber-700";
      case "negociado": return "bg-emerald-100 text-emerald-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusIcon = (status: StatusContratacao) => {
    switch (status) {
      case "a_negociar": return Clock;
      case "negociando": return MessageSquare;
      case "negociado": return FileCheck;
      default: return Clock;
    }
  };

  // Abrir modal de edição
  const handleOpenEditModal = (costItem: CostItem) => {
    setEditingItem(costItem);
    setEditValues({
      valorContratado: costItem.valorContratado || 0,
      observacao: costItem.observacao || "",
      statusContratacao: costItem.statusContratacao || "a_negociar",
    });
    setEditModalOpen(true);
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await playbookService.atualizarItem(editingItem.itemId, {
        valor_contratado: editValues.valorContratado,
        observacao: editValues.observacao,
        status_contratacao: editValues.statusContratacao,
      });
      toast({ title: "Salvo com sucesso" });
      setEditModalOpen(false);
      setEditingItem(null);
      loadItems();
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  // Mudar status direto na tabela
  const handleStatusChange = async (costItem: CostItem, newStatus: StatusContratacao) => {
    if (newStatus === "negociado") {
      // Abre modal para pedir valor negociado
      setPendingStatusChange({ itemId: costItem.itemId, tipo: costItem.tipo });
      setValorNegociado(costItem.valorContratado || costItem.valorMeta);
      setValorNegociadoModalOpen(true);
    } else {
      // Atualiza direto
      try {
        await playbookService.atualizarItem(costItem.itemId, {
          status_contratacao: newStatus,
        });
        toast({ title: "Status atualizado" });
        loadItems();
      } catch (error) {
        toast({ title: "Erro ao atualizar status", variant: "destructive" });
      }
    }
  };

  // Confirmar valor negociado
  const handleConfirmNegociado = async () => {
    if (!pendingStatusChange) return;
    try {
      await playbookService.atualizarItem(pendingStatusChange.itemId, {
        status_contratacao: "negociado",
        valor_contratado: valorNegociado,
      });
      toast({ title: "Contrato fechado com sucesso!" });
      setValorNegociadoModalOpen(false);
      setPendingStatusChange(null);
      loadItems();
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  // Tabela de resumo financeiro por status
  const renderFinancialSummary = (destination: DestinationType) => {
    const { summary, totalMeta, totalContratado, totalVerba, percentVerbaTotal } = getFinancialSummaryByStatus(destination);
    
    if (totalMeta === 0) return null;

    const getStatusColor = (status: StatusContratacao) => {
      switch (status) {
        case "negociado": return "text-emerald-700";
        case "negociando": return "text-amber-700";
        case "a_negociar": return "text-slate-700";
        default: return "text-slate-700";
      }
    };

    return (
      <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Resumo Financeiro por Status</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th className="text-left py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Situação</th>
                <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Orçado</th>
                <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-[60px]">%</th>
                <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Efetivado</th>
                <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-[60px]">%</th>
                <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Verba Disp.</th>
                <th className="text-right py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 w-[60px]">%</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.status} className="border-b border-slate-200 last:border-0">
                  <td className={cn("py-2 px-3 font-semibold text-xs", getStatusColor(row.status))}>
                    {getStatusLabel(row.status).toUpperCase()}
                  </td>
                  <td className="py-2 px-3 text-right text-xs font-medium text-[#A47528]">
                    {formatCurrency(row.valorMeta)}
                  </td>
                  <td className="py-2 px-3 text-right text-xs text-slate-500">
                    {row.percentMeta.toFixed(2)}%
                  </td>
                  <td className="py-2 px-3 text-right text-xs font-medium text-slate-800">
                    {row.valorContratado > 0 ? formatCurrency(row.valorContratado) : "—"}
                  </td>
                  <td className="py-2 px-3 text-right text-xs text-slate-500">
                    {row.valorContratado > 0 ? `${row.percentContratado.toFixed(2)}%` : "—"}
                  </td>
                  <td className="py-2 px-3 text-right text-xs font-medium text-emerald-600">
                    {formatCurrency(row.verbaDisponivel)}
                  </td>
                  <td className="py-2 px-3 text-right text-xs text-slate-500">
                    {row.percentVerba.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 rounded-b-lg">
                <td className="py-2.5 px-3 font-bold text-xs text-white rounded-bl-lg">TOTAL</td>
                <td className="py-2.5 px-3 text-right text-xs font-bold text-white">{formatCurrency(totalMeta)}</td>
                <td className="py-2.5 px-3 text-right text-xs font-medium text-white/80">100,00%</td>
                <td className="py-2.5 px-3 text-right text-xs font-bold text-white">{formatCurrency(totalContratado)}</td>
                <td className="py-2.5 px-3 text-right text-xs font-medium text-white/80">100,00%</td>
                <td className="py-2.5 px-3 text-right text-xs font-bold text-white">{formatCurrency(totalVerba)}</td>
                <td className="py-2.5 px-3 text-right text-xs font-medium text-white/80 rounded-br-lg">{percentVerbaTotal.toFixed(2)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
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
        {renderFinancialSummary(destination)}
        <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-bold">Descrição</TableHead>
                <TableHead className="text-xs font-bold w-[110px]">Tipo</TableHead>
                <TableHead className="text-xs font-bold text-right w-[120px]">Valor Meta</TableHead>
                <TableHead className="text-xs font-bold text-right w-[120px]">Contratado</TableHead>
                <TableHead className="text-xs font-bold w-[150px]">Status</TableHead>
                <TableHead className="text-xs font-bold w-[80px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costItems.map((costItem) => {
                const uniqueKey = `${costItem.itemId}-${costItem.tipo}`;
                const hasContrato = (costItem.statusContratacao === "negociado" || costItem.statusContratacao === "negociando") && costItem.valorContratado && costItem.valorContratado > 0;
                const StatusIcon = getStatusIcon(costItem.statusContratacao || "a_negociar");
                const hasObservacao = costItem.observacao && costItem.observacao.trim().length > 0;

                return (
                  <TableRow key={uniqueKey} className="hover:bg-slate-50/50">
                    <TableCell className="text-sm font-medium">{costItem.descricao}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] whitespace-nowrap", getTipoColor(costItem.tipo))}>
                        {getTipoLabel(costItem.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-[#A47528]">
                      {formatCurrency(costItem.valorMeta)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-medium">
                        {hasContrato ? formatCurrency(costItem.valorContratado!) : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={costItem.statusContratacao || "a_negociar"} 
                        onValueChange={(v) => handleStatusChange(costItem, v as StatusContratacao)}
                      >
                        <SelectTrigger className={cn(
                          "h-8 w-[140px] text-xs font-medium border-0",
                          getStatusColor(costItem.statusContratacao || "a_negociar")
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="a_negociar">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-slate-500" />
                              A Negociar
                            </div>
                          </SelectItem>
                          <SelectItem value="negociando">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-3 w-3 text-amber-600" />
                              Negociando
                            </div>
                          </SelectItem>
                          <SelectItem value="negociado">
                            <div className="flex items-center gap-2">
                              <FileCheck className="h-3 w-3 text-emerald-600" />
                              Negociado
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {hasObservacao && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7">
                                <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" side="left">
                              <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Observação</h4>
                                <p className="text-sm text-slate-700">{costItem.observacao}</p>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenEditModal(costItem)}>
                          <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                      </div>
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
        <p className="text-slate-600">Acompanhe o status das negociações e valores contratados.</p>
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

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Descrição</Label>
                <p className="text-sm font-medium">{editingItem.descricao}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Tipo</Label>
                  <Badge className={cn("text-xs", getTipoColor(editingItem.tipo))}>
                    {getTipoLabel(editingItem.tipo)}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Valor Meta</Label>
                  <p className="text-sm font-bold text-[#A47528]">{formatCurrency(editingItem.valorMeta)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={editValues.statusContratacao} 
                  onValueChange={(v) => setEditValues(prev => ({ ...prev, statusContratacao: v as StatusContratacao }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_negociar">A Negociar</SelectItem>
                    <SelectItem value="negociando">Negociando</SelectItem>
                    <SelectItem value="negociado">Negociado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(editValues.statusContratacao === "negociando" || editValues.statusContratacao === "negociado") && (
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor Contratado</Label>
                  <Input
                    id="valor"
                    type="number"
                    value={editValues.valorContratado}
                    onChange={(e) => setEditValues(prev => ({ ...prev, valorContratado: parseFloat(e.target.value) || 0 }))}
                    placeholder="0,00"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="obs">Observação</Label>
                <Textarea
                  id="obs"
                  value={editValues.observacao}
                  onChange={(e) => setEditValues(prev => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Adicione uma observação..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} className="bg-[#A47528] hover:bg-[#8B6320]">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Valor Negociado */}
      <Dialog open={valorNegociadoModalOpen} onOpenChange={setValorNegociadoModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Fechar Contrato
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Informe o valor final negociado para este item.
            </p>
            <div className="space-y-2">
              <Label htmlFor="valorNegociado">Valor Negociado</Label>
              <Input
                id="valorNegociado"
                type="number"
                value={valorNegociado}
                onChange={(e) => setValorNegociado(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="text-lg font-medium"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setValorNegociadoModalOpen(false);
              setPendingStatusChange(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmNegociado} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
