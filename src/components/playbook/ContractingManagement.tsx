import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Adicionado Trash2 nas importações
import { CalendarIcon, MessageSquare, Upload, Eye, Loader2, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { playbookService } from "@/services/playbookService";
import { gamificationService } from "@/services/gamificationService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export interface ContractingItem {
  id: number | string;
  descricao: string;
  unidade: string;
  qtd: number;
  precoTotalMeta: number;
  nivel?: number;
  destino: string | null;
  responsavel: string | null;
  data_limite: string | null;
  valor_contratado: number | null;
  status_contratacao: string;
  observacao: string | null;
  contract_url: string | null;
}

interface EnrichedContractingItem extends ContractingItem {
  etapaPrincipal: string;
}

interface ContractingManagementProps {
  items: ContractingItem[];
  onUpdate: () => void;
}

type FieldType = "responsavel" | "data" | "valor" | "status" | "obs";

export function ContractingManagement({ items, onUpdate }: ContractingManagementProps) {
  const { toast } = useToast();
  const { userSession } = useAuth();
  const [editingItem, setEditingItem] = useState<EnrichedContractingItem | null>(null);
  const [editingField, setEditingField] = useState<FieldType | null>(null);
  const [fieldValue, setFieldValue] = useState<string>("");
  const [dateValue, setDateValue] = useState<Date | undefined>(undefined);

  const [isUploading, setIsUploading] = useState<string | number | null>(null);

  let currentMainStage = "";
  const enrichedItems: EnrichedContractingItem[] = items.map((item) => {
    if (item.nivel === 0) {
      currentMainStage = item.descricao;
    }
    return { ...item, etapaPrincipal: currentMainStage || item.descricao };
  });

  const activeItems = enrichedItems.filter((i) => i.destino);

  const capitalize = (str: string) => {
    return str.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // --- LÓGICA DE UPLOAD ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, itemId: string | number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(itemId);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from("playbook-documents").upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("playbook-documents").getPublicUrl(filePath);

      await playbookService.updateItem(String(itemId), { contract_url: publicUrl });

      toast({ title: "Contrato anexado com sucesso!" });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao anexar contrato", variant: "destructive" });
    } finally {
      setIsUploading(null);
    }
  };

  // --- LÓGICA DE EXCLUSÃO DE ARQUIVO ---
  const handleRemoveFile = async (itemId: string | number, fileUrl: string) => {
    try {
      // 1. Tentar remover do Storage (Opcional, para não deixar lixo)
      try {
        const path = fileUrl.split("/playbook-documents/")[1];
        if (path) {
          await supabase.storage.from("playbook-documents").remove([path]);
        }
      } catch (err) {
        console.warn("Erro ao remover arquivo do storage, mas prosseguindo com desvinculo", err);
      }

      // 2. Atualizar banco para null
      await playbookService.updateItem(String(itemId), { contract_url: null });

      toast({ title: "Contrato removido." });
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao remover contrato", variant: "destructive" });
    }
  };

  const openFieldModal = (item: EnrichedContractingItem, field: FieldType, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setEditingField(field);

    switch (field) {
      case "responsavel":
        setFieldValue(item.responsavel || "");
        break;
      case "data":
        setDateValue(item.data_limite ? new Date(item.data_limite) : undefined);
        break;
      case "valor":
        setFieldValue(item.valor_contratado?.toString() || "");
        break;
      case "status":
        setFieldValue(item.status_contratacao || "A Negociar");
        break;
      case "obs":
        setFieldValue(item.observacao || "");
        break;
    }
  };

  const closeModal = () => {
    setEditingItem(null);
    setEditingField(null);
    setFieldValue("");
    setDateValue(undefined);
  };

  const handleSave = async () => {
    if (!editingItem || !editingField) return;

    try {
      const updates: Record<string, unknown> = {};
      const previousStatus = editingItem.status_contratacao;

      switch (editingField) {
        case "responsavel":
          updates.responsavel = fieldValue || null;
          break;
        case "data":
          updates.data_limite = dateValue?.toISOString() || null;
          break;
        case "valor":
          updates.valor_contratado = fieldValue ? parseFloat(fieldValue) : null;
          break;
        case "status":
          updates.status_contratacao = fieldValue;
          break;
        case "obs":
          updates.observacao = fieldValue || null;
          break;
      }

      await playbookService.updateItem(String(editingItem.id), updates);

      if (userSession?.user?.id) {
        if (
          editingField === "status" &&
          (fieldValue === "Negociada" || fieldValue === "Contratado") &&
          previousStatus !== "Negociada" &&
          previousStatus !== "Contratado"
        ) {
          await gamificationService.awardXP(userSession.user.id, "CONTRATACAO_FAST", 100, String(editingItem.id));

          const valorContratadoFinal = editingItem.valor_contratado || 0;
          const valorMeta = editingItem.precoTotalMeta || 0;

          if (valorMeta > 0 && valorContratadoFinal > 0 && valorContratadoFinal < valorMeta) {
            await gamificationService.awardXP(
              userSession.user.id,
              "ECONOMIA_PLAYBOOK",
              50,
              `${editingItem.id}_ECONOMY`,
            );
          }
        } else if (
          editingField === "status" &&
          (fieldValue === "A Negociar" || fieldValue === "Em Andamento") &&
          (previousStatus === "Negociada" || previousStatus === "Contratado")
        ) {
          await gamificationService.removeXP(userSession.user.id, "CONTRATACAO_FAST", 100, String(editingItem.id));
          await gamificationService.removeXP(userSession.user.id, "ECONOMIA_PLAYBOOK", 50, `${editingItem.id}_ECONOMY`);
        }
      }

      toast({ description: "Salvo!" });
      closeModal();
      onUpdate();
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    }
  };

  const getModalTitle = () => {
    switch (editingField) {
      case "responsavel":
        return "Responsável";
      case "data":
        return "Data Limite";
      case "valor":
        return "Valor Contratado";
      case "status":
        return "Status";
      case "obs":
        return "Observação";
      default:
        return "";
    }
  };

  const renderFieldInput = () => {
    switch (editingField) {
      case "responsavel":
        return (
          <Input
            autoFocus
            placeholder="Nome do responsável"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
          />
        );
      case "data":
        return (
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={setDateValue}
            locale={ptBR}
            className="rounded-md border"
          />
        );
      case "valor":
        return (
          <Input
            autoFocus
            type="number"
            placeholder="0.00"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
          />
        );
      case "status":
        return (
          <div className="flex flex-col gap-2">
            {["A Negociar", "Em Andamento", "Negociada"].map((status) => (
              <Button
                key={status}
                variant={fieldValue === status ? "default" : "outline"}
                className="justify-start"
                onClick={() => setFieldValue(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        );
      case "obs":
        return (
          <textarea
            autoFocus
            className="w-full min-h-[100px] text-sm p-3 border rounded-md resize-none"
            placeholder="Observações..."
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
          />
        );
      default:
        return null;
    }
  };

  const calculateSummary = (filtered: EnrichedContractingItem[]) => {
    const statuses = ["Negociada", "Em Andamento", "A Negociar"];
    const byStatus = statuses.map((status) => {
      const items = filtered.filter((i) => (i.status_contratacao || "A Negociar") === status);
      const totalMeta = items.reduce((sum, i) => sum + i.precoTotalMeta, 0);
      const totalContratado = items.reduce((sum, i) => sum + (i.valor_contratado || 0), 0);
      return { status, totalMeta, totalContratado, count: items.length };
    });
    const totalMeta = byStatus.reduce((sum, s) => sum + s.totalMeta, 0);
    const totalContratado = byStatus.reduce((sum, s) => sum + s.totalContratado, 0);
    return { byStatus, totalMeta, totalContratado };
  };

  const formatPercent = (value: number, total: number) => {
    if (total === 0) return "0,00%";
    return ((value / total) * 100).toFixed(2).replace(".", ",") + "%";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Negociada":
        return "bg-green-500";
      case "Em Andamento":
        return "bg-yellow-500";
      case "A Negociar":
        return "bg-red-500";
      default:
        return "bg-red-500";
    }
  };

  const renderSummary = (filtered: EnrichedContractingItem[]) => {
    const { byStatus, totalMeta, totalContratado } = calculateSummary(filtered);
    if (filtered.length === 0) return null;

    return (
      <div className="mt-4 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-[#112231]">
            <TableRow className="hover:bg-[#112231]">
              <TableHead className="w-[180px] text-white font-bold text-xs">SITUAÇÃO</TableHead>
              <TableHead className="text-right text-white font-bold text-xs">ORÇADO</TableHead>
              <TableHead className="text-center text-white font-bold text-xs w-[80px]">%</TableHead>
              <TableHead className="text-right text-white font-bold text-xs">EFETIVADO</TableHead>
              <TableHead className="text-center text-white font-bold text-xs w-[80px]">%</TableHead>
              <TableHead className="text-right text-white font-bold text-xs">VERBA DISPONÍVEL</TableHead>
              <TableHead className="text-center text-white font-bold text-xs w-[80px]">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byStatus.map((row) => {
              const verbaDisponivel = row.totalMeta - row.totalContratado;
              const percentVerba = row.totalMeta > 0 ? (row.totalContratado / row.totalMeta) * 100 : 0;
              return (
                <TableRow key={row.status} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-sm text-slate-700 flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", getStatusColor(row.status))} />
                    {row.status.toUpperCase()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-slate-700">
                    {formatCurrency(row.totalMeta)}
                  </TableCell>
                  <TableCell className="text-center text-sm font-mono text-slate-500">
                    {formatPercent(row.totalMeta, totalMeta)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-slate-700">
                    {row.totalContratado > 0 ? formatCurrency(row.totalContratado) : "-"}
                  </TableCell>
                  <TableCell className="text-center text-sm font-mono text-slate-500">
                    {row.totalContratado > 0 ? formatPercent(row.totalContratado, totalContratado) : "0,00%"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono text-slate-700">
                    {formatCurrency(verbaDisponivel)}
                  </TableCell>
                  <TableCell className="text-center text-sm font-mono">
                    <span
                      className={cn(
                        "font-medium",
                        percentVerba <= 0 ? "text-green-600" : percentVerba < 100 ? "text-amber-600" : "text-red-500",
                      )}
                    >
                      {(100 - percentVerba).toFixed(2).replace(".", ",")}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-[#A47528]/10 hover:bg-[#A47528]/15 border-t-2 border-[#A47528]/30">
              <TableCell className="font-bold text-sm text-slate-900">TOTAL</TableCell>
              <TableCell className="text-right text-sm font-mono font-bold text-slate-900">
                {formatCurrency(totalMeta)}
              </TableCell>
              <TableCell className="text-center text-sm font-mono font-bold text-slate-700">100,00%</TableCell>
              <TableCell className="text-right text-sm font-mono font-bold text-slate-900">
                {formatCurrency(totalContratado)}
              </TableCell>
              <TableCell className="text-center text-sm font-mono font-bold text-slate-700">100,00%</TableCell>
              <TableCell className="text-right text-sm font-mono font-bold text-slate-900">
                {formatCurrency(totalMeta - totalContratado)}
              </TableCell>
              <TableCell className="text-center text-sm font-mono font-bold">
                <span className={cn(totalContratado >= totalMeta ? "text-green-600" : "text-amber-600")}>
                  {totalMeta > 0 ? ((1 - totalContratado / totalMeta) * 100).toFixed(2).replace(".", ",") : "100,00"}%
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderTable = (filterDestino: string) => {
    const filtered = activeItems.filter((i) => i.destino === filterDestino);

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 mt-4">
          <p className="text-sm">Nenhum item enviado para {filterDestino} ainda.</p>
          <p className="text-xs mt-1">Vá na aba "Orçamento" e classifique os itens relevantes.</p>
        </div>
      );
    }

    return (
      <>
        <div className="border border-slate-200 rounded-lg bg-white overflow-hidden mt-4 shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-[140px] font-bold text-slate-900">Etapa</TableHead>
                <TableHead>Proposta</TableHead>
                <TableHead className="w-[110px]">Responsável</TableHead>
                <TableHead className="w-[90px]">Data</TableHead>
                <TableHead className="text-right w-[100px]">Meta</TableHead>
                <TableHead className="text-right w-[100px]">Contratado</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="text-center w-[80px]">Contrato</TableHead>
                <TableHead className="w-[40px]">Obs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const valorNum = item.valor_contratado || 0;
                const diferenca = valorNum - item.precoTotalMeta;
                const isNegotiated = item.status_contratacao === "Negociada";

                return (
                  <TableRow key={item.id} className="hover:bg-slate-50">
                    <TableCell className="font-bold text-[10px] text-slate-500 uppercase truncate">
                      {item.etapaPrincipal.toLowerCase()}
                    </TableCell>
                    <TableCell className="font-medium text-sm text-slate-700">{capitalize(item.descricao)}</TableCell>
                    <TableCell
                      className="text-xs text-slate-600 cursor-pointer hover:bg-blue-50 rounded transition-colors"
                      onClick={(e) => openFieldModal(item, "responsavel", e)}
                    >
                      {item.responsavel || <span className="text-blue-400 text-[10px]">+ adicionar</span>}
                    </TableCell>
                    <TableCell
                      className="text-xs text-slate-600 cursor-pointer hover:bg-blue-50 rounded transition-colors"
                      onClick={(e) => openFieldModal(item, "data", e)}
                    >
                      {item.data_limite ? (
                        format(new Date(item.data_limite), "dd/MM/yy")
                      ) : (
                        <CalendarIcon className="h-3 w-3 text-blue-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono text-blue-700 font-medium">
                      {formatCurrency(item.precoTotalMeta)}
                    </TableCell>
                    <TableCell
                      className="text-right text-xs font-mono cursor-pointer hover:bg-blue-50 rounded transition-colors"
                      onClick={(e) => openFieldModal(item, "valor", e)}
                    >
                      {valorNum > 0 ? (
                        <span className={diferenca <= 0 ? "text-green-600" : "text-red-600"}>
                          {formatCurrency(valorNum)}
                        </span>
                      ) : (
                        <span className="text-blue-400 text-[10px]">+ valor</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="cursor-pointer hover:bg-blue-50 rounded transition-colors"
                      onClick={(e) => openFieldModal(item, "status", e)}
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] transition-all whitespace-nowrap",
                          item.status_contratacao === "Negociada" && "bg-green-100 text-green-800 hover:bg-green-200",
                          item.status_contratacao === "Em Andamento" &&
                            "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                          (!item.status_contratacao || item.status_contratacao === "A Negociar") &&
                            "bg-red-100 text-red-700 hover:bg-red-200",
                        )}
                      >
                        {item.status_contratacao || "A Negociar"}
                      </Badge>
                    </TableCell>

                    {/* CÉLULA DE CONTRATO ATUALIZADA */}
                    <TableCell className="text-center">
                      {isNegotiated ? (
                        <div className="flex justify-center items-center gap-1">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, item.id)}
                              disabled={isUploading === item.id}
                            />
                            {isUploading === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : item.contract_url ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-blue-600 hover:bg-blue-50"
                                  onClick={() => window.open(item.contract_url!, "_blank")}
                                  title="Ver Contrato"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {/* Botão de Substituir */}
                                <div
                                  title="Substituir"
                                  className="flex items-center text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                                >
                                  <Upload className="h-3 w-3" />
                                </div>
                              </div>
                            ) : (
                              <div
                                title="Anexar Contrato"
                                className="flex items-center text-slate-300 hover:text-[#C7A347] transition-colors p-1"
                              >
                                <Paperclip className="h-4 w-4" />
                              </div>
                            )}
                          </label>

                          {/* BOTÃO DE EXCLUIR */}
                          {item.contract_url && !isUploading && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveFile(item.id, item.contract_url!)}
                              title="Remover Contrato"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-200 text-[10px]">-</span>
                      )}
                    </TableCell>

                    <TableCell
                      className="cursor-pointer hover:bg-blue-50 rounded transition-colors"
                      onClick={(e) => openFieldModal(item, "obs", e)}
                    >
                      <MessageSquare className={cn("h-4 w-4", item.observacao ? "text-amber-500" : "text-slate-300")} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {renderSummary(filtered)}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Mini-Modal por Campo */}
      <Dialog open={!!editingItem && !!editingField} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
            {editingItem && <p className="text-xs text-slate-500 truncate">{capitalize(editingItem.descricao)}</p>}
          </DialogHeader>
          <div className="py-4">{renderFieldInput()}</div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={closeModal}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header e Tabs omitidos para brevidade, mantendo igual ao original ... */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Farol de Contratações</h2>
          <p className="text-sm text-slate-500">Clique em cada campo para editar.</p>
        </div>
      </div>

      <Tabs defaultValue="Obra" className="w-full">
        <TabsList className="bg-slate-100 p-1 border border-slate-200 w-full justify-start h-auto">
          <TabsTrigger
            value="Obra"
            className="px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 font-medium"
          >
            Obra
            <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-600 text-[10px] h-5 px-1.5">
              {activeItems.filter((i) => i.destino === "Obra").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="Fornecimento"
            className="px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-700 font-medium"
          >
            Fornecimento
            <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-600 text-[10px] h-5 px-1.5">
              {activeItems.filter((i) => i.destino === "Fornecimento").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="Cliente"
            className="px-6 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-700 font-medium"
          >
            Cliente
            <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-600 text-[10px] h-5 px-1.5">
              {activeItems.filter((i) => i.destino === "Cliente").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Obra">{renderTable("Obra")}</TabsContent>
        <TabsContent value="Fornecimento">{renderTable("Fornecimento")}</TabsContent>
        <TabsContent value="Cliente">{renderTable("Cliente")}</TabsContent>
      </Tabs>
    </div>
  );
}
