import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Target,
  Edit3,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  LayoutGrid,
  Settings,
  Save,
  Star,
  Trophy,
  Medal,
  Shield,
  Activity,
  Crosshair,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdherenceRanking } from "@/components/metas/AdherenceRanking";

// --- TIPOS ---
interface MetaAnual {
  id?: string;
  ano: number;
  meta_faturamento: number;
  meta_margem_liquida: number;
}

interface Squad {
  id: string;
  nome: string;
}

interface ObraFinanceira {
  id: any;
  nome_obra: string;
  faturamento_realizado: number;
  lucro_realizado: number; // Lucro Previsto
  lucro_consolidado: number; // Lucro Consolidado
  considerar_na_meta: boolean;
  usuario_id: string | null;
  nps: number | null;
  data_inicio: string | null;
  status?: string;
}

interface RankingData {
  user_id: string;
  pontuacao_geral: number;
  posicao_geral: number;
  posicao_empresa: number;
}

const GestaoMetas = () => {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filtros
  const [anoSelecionado, setAnoSelecionado] = useState("2026");
  const [viewMode, setViewMode] = useState<"squad" | "obra" | "aderencia">("squad");

  // Modais
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [selectedObraForEdit, setSelectedObraForEdit] = useState<string | null>(null);

  // Estados de Edição
  const [tempMeta, setTempMeta] = useState<MetaAnual>({
    ano: 2026,
    meta_faturamento: 0,
    meta_margem_liquida: 0,
  });

  const [localObras, setLocalObras] = useState<ObraFinanceira[]>([]);
  const [isSavingObras, setIsSavingObras] = useState(false);

  // --- QUERY PRINCIPAL ---
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["gestaoMetas", userSession?.user?.id, anoSelecionado],
    queryFn: async () => {
      if (!userSession?.user?.id) throw new Error("Usuário não logado");

      const { data: userData } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", userSession.user.id)
        .single();

      if (!userData?.empresa_id) throw new Error("Empresa não encontrada");

      const { data: metaData } = await supabase
        .from("metas_anuais" as any)
        .select("*")
        .eq("empresa_id", userData.empresa_id)
        .eq("ano", parseInt(anoSelecionado))
        .maybeSingle();

      const meta = metaData
        ? (metaData as unknown as MetaAnual)
        : { ano: parseInt(anoSelecionado), meta_faturamento: 0, meta_margem_liquida: 0 };

      // Busca usuários para mapear como Squads
      const { data: usuariosData } = await supabase
        .from("usuarios")
        .select("id, nome")
        .eq("empresa_id", userData.empresa_id)
        .order("nome");

      const squadsList: Squad[] = (usuariosData || []).map((u) => ({
        id: u.id,
        nome: u.nome || "Agente Desconhecido",
      }));

      const dataInicioAno = `${anoSelecionado}-01-01`;
      const dataFimAno = `${anoSelecionado}-12-31`;

      const { data: obrasData } = await supabase
        .from("obras" as any)
        .select(
          "id, nome_obra, faturamento_realizado, lucro_realizado, lucro_consolidado, considerar_na_meta, usuario_id, nps, data_inicio, data_termino, status",
        )
        .eq("empresa_id", userData.empresa_id)
        .gte("data_termino", dataInicioAno)
        .lte("data_termino", dataFimAno)
        .order("nome_obra");

      return {
        empresa_id: userData.empresa_id,
        meta,
        squads: squadsList,
        obras: (obrasData || []) as unknown as ObraFinanceira[],
      };
    },
    enabled: !!userSession?.user?.id,
    staleTime: 1000 * 60 * 10,
  });

  // --- QUERY RANKING GRIFOWAY ---
  const { data: rankings } = useQuery({
    queryKey: ["rankingsGrifoWay", dashboardData?.empresa_id],
    queryFn: async () => {
      try {
        // Tenta buscar da view de ranking
        const { data, error } = await supabase
          .from("ranking_grifoway" as any)
          .select("user_id, pontuacao_geral, posicao_geral, posicao_empresa");

        if (error) {
          // Fallback silencioso se a view não existir ainda
          console.warn("Ranking view unavailable");
          return [];
        }
        return (data as unknown as RankingData[]) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: !!dashboardData?.empresa_id,
  });

  // --- QUERY ADERÊNCIA AO SISTEMA ---
  const { data: adherenceData, isLoading: isLoadingAdherence } = useQuery({
    queryKey: ["adherenceData", dashboardData?.empresa_id],
    queryFn: async () => {
      if (!dashboardData?.empresa_id) return [];

      // 1. Buscar usuários da empresa
      const { data: usersData, error: usersError } = await supabase
        .from("usuarios")
        .select("id, nome")
        .eq("empresa_id", dashboardData.empresa_id)
        .order("nome");

      if (usersError) {
        console.error("Erro ao buscar usuários:", usersError);
        return [];
      }

      const users = usersData || [];
      const userIds = users.map((u) => u.id);
      if (userIds.length === 0) return [];

      // 2. Buscar perfis de gamificação (sem relacionamento FK)
      const { data: profilesData, error: profilesError } = await supabase
        .from("gamification_profiles")
        .select("id, xp_total, level_current")
        .in("id", userIds);

      if (profilesError) {
        console.error("Erro ao buscar perfis de gamificação:", profilesError);
      }

      const profilesById = new Map<string, { xp_total: number | null; level_current: number | null }>();
      (profilesData || []).forEach((p: any) => {
        if (p?.id) profilesById.set(p.id, { xp_total: p.xp_total ?? 0, level_current: p.level_current ?? 1 });
      });

      // 3. Buscar contagem de logs por action_type
      const { data: logsData, error: logsError } = await supabase
        .from("gamification_logs")
        .select("user_id, action_type")
        .in("user_id", userIds);

      if (logsError) {
        console.error("Erro ao buscar logs:", logsError);
      }

      // Agregar logs por usuário e tipo
      const logsMap: Record<string, Record<string, number>> = {};
      (logsData || []).forEach((log) => {
        if (!log.user_id || !log.action_type) return;
        if (!logsMap[log.user_id]) logsMap[log.user_id] = {};
        logsMap[log.user_id][log.action_type] = (logsMap[log.user_id][log.action_type] || 0) + 1;
      });

      // Mapear para estrutura de aderência
      const result = users.map((user) => {
        const profile = profilesById.get(user.id);
        const userLogs = logsMap[user.id] || {};

        return {
          id: user.id,
          nome: user.nome || "Usuário",
          xp_total: profile?.xp_total || 0,
          level: profile?.level_current || 1,
          features: {
            PCP: userLogs["TAREFA_CONCLUIDA"] || 0,
            DIARIO: userLogs["DIARIO_CRIADO"] || 0,
            PMP: (userLogs["PMP_ATIVIDADE_CONCLUIDA"] || 0) + (userLogs["PMP_RESTRICAO_CONCLUIDA"] || 0),
            PLAYBOOK: (userLogs["CONTRATACAO_FAST"] || 0) + (userLogs["ECONOMIA_PLAYBOOK"] || 0),
          },
        };
      });

      // Filtrar apenas usuários com atividade e ordenar por XP decrescente
      return result
        .filter((u) => u.xp_total > 0 || Object.values(u.features).some((v) => v > 0))
        .sort((a, b) => b.xp_total - a.xp_total);
    },
    enabled: !!dashboardData?.empresa_id,
  });

  useEffect(() => {
    if (dashboardData?.meta) {
      setTempMeta(dashboardData.meta);
    }
  }, [dashboardData]);

  // --- LÓGICA DE EDIÇÃO (MODAL) ---
  const handleOpenLancamento = (open: boolean) => {
    if (open && dashboardData?.obras) {
      setLocalObras(JSON.parse(JSON.stringify(dashboardData.obras)));
    }
    setIsLancamentoModalOpen(open);
  };

  const handleLocalChange = (id: any, field: keyof ObraFinanceira, value: any) => {
    setLocalObras((prev) =>
      prev.map((obra) => {
        if (obra.id === id) {
          return { ...obra, [field]: value };
        }
        return obra;
      }),
    );
  };

  const handleSaveAll = async () => {
    setIsSavingObras(true);
    try {
      const originalObras = dashboardData?.obras || [];
      const updates = [];

      for (const localObra of localObras) {
        const original = originalObras.find((o) => o.id === localObra.id);
        if (!original) continue;

        const hasChanged =
          localObra.faturamento_realizado !== original.faturamento_realizado ||
          localObra.lucro_realizado !== original.lucro_realizado ||
          localObra.lucro_consolidado !== original.lucro_consolidado ||
          localObra.considerar_na_meta !== original.considerar_na_meta ||
          localObra.usuario_id !== original.usuario_id ||
          localObra.nps !== original.nps ||
          localObra.data_inicio !== original.data_inicio;

        if (hasChanged) {
          updates.push(
            supabase
              .from("obras" as any)
              .update({
                faturamento_realizado: localObra.faturamento_realizado,
                lucro_realizado: localObra.lucro_realizado,
                lucro_consolidado: localObra.lucro_consolidado,
                considerar_na_meta: localObra.considerar_na_meta,
                usuario_id: localObra.usuario_id,
                nps: localObra.nps,
                data_inicio: localObra.data_inicio,
              })
              .eq("id", localObra.id),
          );
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        await queryClient.invalidateQueries({ queryKey: ["gestaoMetas"] });
        toast({ title: "Dados Sincronizados com Sucesso", className: "bg-emerald-600 text-white border-none" });
      } else {
        toast({ title: "Nenhuma alteração detectada." });
      }

      setIsLancamentoModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Falha na Sincronização", variant: "destructive" });
    } finally {
      setIsSavingObras(false);
    }
  };

  const saveMetaMutation = useMutation({
    mutationFn: async (newMeta: MetaAnual) => {
      const payload = {
        empresa_id: dashboardData?.empresa_id,
        ano: parseInt(anoSelecionado),
        meta_faturamento: newMeta.meta_faturamento,
        meta_margem_liquida: newMeta.meta_margem_liquida,
      };
      const { error } = await supabase.from("metas_anuais" as any).upsert(payload, { onConflict: "empresa_id, ano" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gestaoMetas"] });
      toast({ title: "Diretrizes Atualizadas", className: "bg-[#C7A347] text-white border-none" });
    },
    onError: () => toast({ title: "Erro ao salvar metas", variant: "destructive" }),
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const getNpsColor = (score: number) => {
    if (score >= 9) return "bg-emerald-900/30 text-emerald-400 border-emerald-800";
    if (score >= 7) return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
    return "bg-red-900/30 text-red-400 border-red-800";
  };

  // --- CÁLCULOS KPI ---
  const meta = dashboardData?.meta || { meta_faturamento: 0, meta_margem_liquida: 0 };
  const obras = dashboardData?.obras || [];
  const squads = dashboardData?.squads || [];

  const obrasConsideradas = obras.filter((o) => o.considerar_na_meta);
  const totalFaturamento = obrasConsideradas.reduce((acc, curr) => acc + (curr.faturamento_realizado || 0), 0);
  const totalLucroPrevisto = obrasConsideradas.reduce((acc, curr) => acc + (curr.lucro_realizado || 0), 0);
  const totalLucroConsolidado = obrasConsideradas.reduce((acc, curr) => acc + (curr.lucro_consolidado || 0), 0);
  const margemPrevista = totalFaturamento > 0 ? (totalLucroPrevisto / totalFaturamento) * 100 : 0;
  const margemConsolidada = totalFaturamento > 0 ? (totalLucroConsolidado / totalFaturamento) * 100 : 0;
  const percentualMeta = meta.meta_faturamento > 0 ? (totalFaturamento / meta.meta_faturamento) * 100 : 0;

  const obrasComNps = obrasConsideradas.filter((o) => o.nps !== null && o.nps !== undefined);
  const npsMedioEmpresa =
    obrasComNps.length > 0 ? obrasComNps.reduce((acc, curr) => acc + (curr.nps || 0), 0) / obrasComNps.length : 0;

  // --- RANKING LOGIC ---
  const rankingSquads = squads
    .map((squad) => {
      const obrasDoSquad = obrasConsideradas.filter((o) => o.usuario_id === squad.id);
      const fat = obrasDoSquad.reduce((acc, curr) => acc + (curr.faturamento_realizado || 0), 0);
      const lucPrev = obrasDoSquad.reduce((acc, curr) => acc + (curr.lucro_realizado || 0), 0);
      const lucCons = obrasDoSquad.reduce((acc, curr) => acc + (curr.lucro_consolidado || 0), 0);
      const squadObrasComNps = obrasDoSquad.filter((o) => o.nps !== null);
      const npsMedio =
        squadObrasComNps.length > 0
          ? squadObrasComNps.reduce((acc, curr) => acc + (curr.nps || 0), 0) / squadObrasComNps.length
          : null;

      return {
        ...squad,
        faturamento: fat,
        lucroPrevisto: lucPrev,
        lucroConsolidado: lucCons,
        margemPrevista: fat > 0 ? (lucPrev / fat) * 100 : 0,
        margemConsolidada: fat > 0 ? (lucCons / fat) * 100 : 0,
        contrib: meta.meta_faturamento > 0 ? (fat / meta.meta_faturamento) * 100 : 0,
        qtd_obras: obrasDoSquad.length,
        nps_medio: npsMedio,
      };
    })
    .filter((r) => r.qtd_obras > 0)
    .sort((a, b) => b.faturamento - a.faturamento);

  const topSquad = rankingSquads.length > 0 ? rankingSquads[0] : null;

  // Lógica para obras sem dono
  const obrasSemSquad = obrasConsideradas.filter((o) => !o.usuario_id);
  if (obrasSemSquad.length > 0) {
    const fat = obrasSemSquad.reduce((acc, curr) => acc + (curr.faturamento_realizado || 0), 0);
    const lucPrev = obrasSemSquad.reduce((acc, curr) => acc + (curr.lucro_realizado || 0), 0);
    const lucCons = obrasSemSquad.reduce((acc, curr) => acc + (curr.lucro_consolidado || 0), 0);
    const squadObrasComNps = obrasSemSquad.filter((o) => o.nps !== null);
    const npsMedio =
      squadObrasComNps.length > 0
        ? squadObrasComNps.reduce((acc, curr) => acc + (curr.nps || 0), 0) / squadObrasComNps.length
        : null;

    rankingSquads.push({
      id: "sem-squad",
      nome: "Unidade Não Atribuída",
      faturamento: fat,
      lucroPrevisto: lucPrev,
      lucroConsolidado: lucCons,
      margemPrevista: fat > 0 ? (lucPrev / fat) * 100 : 0,
      margemConsolidada: fat > 0 ? (lucCons / fat) * 100 : 0,
      contrib: meta.meta_faturamento > 0 ? (fat / meta.meta_faturamento) * 100 : 0,
      qtd_obras: obrasSemSquad.length,
      nps_medio: npsMedio,
    } as any);
  }

  const rankingObras = [...obrasConsideradas].sort((a, b) => b.faturamento_realizado - a.faturamento_realizado);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-[80vh] bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-[#C7A347]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#C7A347] selection:text-black pb-20">
      {/* --- COMMAND CENTER HEADER --- */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <img
                src="https://qacaerwosglbayjfskyx.supabase.co/storage/v1/object/public/templates/GrifoStrikeForce.png"
                alt="Grifo Strike Force"
                className="h-16 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(199,163,71,0.3)]"
              />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wider uppercase flex items-center gap-2">
                  Painel de Controle
                </h1>
                <p className="text-slate-400 text-xs tracking-widest uppercase">Performance & Elite Squads</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                <SelectTrigger className="w-[100px] h-10 bg-slate-800 border-slate-700 text-slate-200 focus:ring-[#C7A347]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2027">2027</SelectItem>
                </SelectContent>
              </Select>

              {/* BOTÃO CONFIGURAÇÕES */}
              <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 gap-2 bg-slate-800 border-slate-700 text-slate-400 hover:text-[#C7A347] hover:border-[#C7A347] hover:bg-slate-900 transition-all uppercase text-xs tracking-wider font-bold"
                  >
                    <Settings className="h-4 w-4" />
                    Metas
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-slate-100">
                  <DialogHeader>
                    <DialogTitle className="text-[#C7A347] uppercase tracking-widest flex items-center gap-2">
                      <Crosshair className="h-5 w-5" /> Definição de Alvos
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Parâmetros operacionais para {anoSelecionado}.
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="metas" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-1 bg-slate-800">
                      <TabsTrigger
                        value="metas"
                        className="data-[state=active]:bg-[#C7A347] data-[state=active]:text-black font-bold uppercase"
                      >
                        Metas Anuais
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="metas" className="space-y-6 py-4">
                      <div className="grid gap-5">
                        <div className="grid gap-2">
                          <Label className="text-slate-300 uppercase text-xs">Meta de Faturamento (Anual)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                              type="number"
                              className="pl-9 bg-slate-950 border-slate-700 text-white font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={tempMeta.meta_faturamento}
                              onChange={(e) =>
                                setTempMeta({ ...tempMeta, meta_faturamento: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-slate-300 uppercase text-xs">Meta de Margem Líquida (%)</Label>
                          <div className="relative">
                            <TrendingUp className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                            <Input
                              type="number"
                              className="pl-9 bg-slate-950 border-slate-700 text-white font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={tempMeta.meta_margem_liquida}
                              onChange={(e) =>
                                setTempMeta({ ...tempMeta, meta_margem_liquida: parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => saveMetaMutation.mutate(tempMeta)}
                          className="bg-[#C7A347] hover:bg-[#b08d3b] text-black w-full mt-2 gap-2 font-bold uppercase tracking-widest"
                        >
                          {saveMetaMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Salvar Diretrizes
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>

              {/* Botão Lançar Resultados */}
              <Button
                onClick={() => handleOpenLancamento(true)}
                className="h-10 bg-[#C7A347] hover:bg-[#b08d3b] text-black gap-2 shadow-[0_0_15px_rgba(199,163,71,0.4)] transition-all hover:scale-105 font-bold uppercase tracking-widest"
              >
                <Edit3 className="h-4 w-4" /> Lançar Operação
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-8">
        {/* --- KPI HUD --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* KPI 1: Faturamento */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Target className="h-32 w-32 text-white" />
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C7A347]"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                Faturamento Realizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-white mb-2">{formatCurrency(totalFaturamento)}</div>

              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 uppercase">Target</span>
                <span className="text-[#C7A347] font-mono">{formatCurrency(meta.meta_faturamento)}</span>
              </div>
              <Progress value={Math.min(percentualMeta, 100)} className="h-2 bg-slate-800 [&>*]:bg-[#C7A347]" />
              <div className="mt-2 text-right text-xs text-slate-400 font-mono">
                {percentualMeta.toFixed(1)}% Concluído
              </div>
            </CardContent>
          </Card>

          {/* KPI 2: Lucros e Margens */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden group col-span-1 md:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="h-32 w-32 text-emerald-500" />
            </div>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-emerald-500"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                Lucro & Margem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Lucro Previsto - Vermelho se margem < 18% */}
              {(() => {
                const ALVO_MARGEM = 18;
                const isPrevistoBelowAlvo = margemPrevista < ALVO_MARGEM;
                const isConsolidadoWorse = totalLucroConsolidado < totalLucroPrevisto && margemConsolidada < margemPrevista;
                
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-white uppercase tracking-wider">Lucro Previsto</p>
                        <p className={`text-lg font-mono font-bold ${isPrevistoBelowAlvo ? "text-red-400" : "text-emerald-400"}`}>
                          {formatCurrency(totalLucroPrevisto)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white uppercase tracking-wider">Margem Prev.</p>
                        <p className={`text-lg font-mono font-bold ${isPrevistoBelowAlvo ? "text-red-400" : "text-emerald-400"}`}>
                          {margemPrevista.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-800"></div>

                    {/* Lucro Consolidado - Vermelho se menor que Previsto e margem também menor */}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-white uppercase tracking-wider">Lucro Consolidado</p>
                        <p className={`text-lg font-mono font-bold ${isConsolidadoWorse ? "text-red-400" : "text-emerald-400"}`}>
                          {formatCurrency(totalLucroConsolidado)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white uppercase tracking-wider">Margem Cons.</p>
                        <p className={`text-lg font-mono font-bold ${isConsolidadoWorse ? "text-red-400" : "text-emerald-400"}`}>
                          {margemConsolidada.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="text-[10px] text-slate-500 uppercase pt-1 border-t border-slate-800">
                Alvo: <span className="text-slate-300 font-bold">18%</span>
              </div>
            </CardContent>
          </Card>

          {/* KPI 3: Top Operator */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-800 shadow-xl col-span-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <CardHeader className="pb-2 flex flex-row items-center justify-between relative z-10">
              <CardTitle className="text-xs font-bold text-[#C7A347] uppercase tracking-[0.2em] flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Top Operator
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {topSquad ? (
                <div className="space-y-3">
                  <div className="text-xl font-bold text-white truncate border-b border-slate-700/50 pb-2">
                    {topSquad.nome}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Faturamento</p>
                      <p className="text-sm font-mono text-slate-200">{formatCurrency(topSquad.faturamento)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-400 uppercase">Margem Prev.</p>
                      <p
                        className={`text-sm font-mono font-bold ${topSquad.margemPrevista >= meta.meta_margem_liquida ? "text-amber-300" : "text-amber-500"}`}
                      >
                        {topSquad.margemPrevista.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-400 uppercase">Margem Cons.</p>
                      <p
                        className={`text-sm font-mono font-bold ${topSquad.margemConsolidada >= meta.meta_margem_liquida ? "text-emerald-300" : "text-red-400"}`}
                      >
                        {topSquad.margemConsolidada.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 text-sm py-4 italic">Sem dados de inteligência</div>
              )}
            </CardContent>
          </Card>

          {/* KPI 4: NPS */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Star className="h-4 w-4 text-[#C7A347]" fill="currentColor" /> Qualidade Global (NPS)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-4xl font-mono font-bold text-white">{npsMedioEmpresa.toFixed(1)}</div>
                <div className="text-sm text-slate-500 mb-1 font-mono">/ 10</div>
              </div>
              <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-[#C7A347]"
                  style={{ width: `${npsMedioEmpresa * 10}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RANKING SWITCHER --- */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-wider">
              <BarChart3 className="h-6 w-6 text-[#C7A347]" /> Ranking de Performance
            </h2>
            <div className="bg-slate-900 p-1 rounded-md border border-slate-800 flex items-center">
              <button
                onClick={() => setViewMode("squad")}
                className={`px-6 py-2 text-xs font-bold rounded uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === "squad" ? "bg-[#C7A347] text-black shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Shield className="h-3 w-3" /> Squads
              </button>
              <button
                onClick={() => setViewMode("obra")}
                className={`px-6 py-2 text-xs font-bold rounded uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === "obra" ? "bg-[#C7A347] text-black shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
              >
                <LayoutGrid className="h-3 w-3" /> Obras
              </button>
              <button
                onClick={() => setViewMode("aderencia")}
                className={`px-6 py-2 text-xs font-bold rounded uppercase tracking-wider transition-all flex items-center gap-2 ${viewMode === "aderencia" ? "bg-[#C7A347] text-black shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
              >
                <Activity className="h-3 w-3" /> Aderência
              </button>
            </div>
          </div>

          {viewMode === "squad" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankingSquads.map((squad, index) => (
                <div
                  key={squad.id}
                  className={`bg-slate-900 p-6 rounded-lg border hover:border-[#C7A347] transition-all relative group overflow-hidden ${index === 0 ? "border-[#C7A347]/50 shadow-[0_0_20px_rgba(199,163,71,0.1)]" : "border-slate-800"}`}
                >
                  {/* RANKING BADGE */}
                  <div className="absolute top-0 right-0 p-0">
                    <div
                      className={`px-3 py-1 rounded-bl-lg text-[10px] font-bold uppercase tracking-widest ${index === 0 ? "bg-[#C7A347] text-black" : index === 1 ? "bg-slate-400 text-black" : index === 2 ? "bg-amber-800 text-white" : "bg-slate-800 text-slate-500"}`}
                    >
                      Rank #{index + 1}
                    </div>
                  </div>

                  <div className="mb-6 pr-14">
                    <h3 className="font-bold text-white text-lg truncate mb-1">{squad.nome}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                        {squad.qtd_obras} MISSÕES
                      </Badge>
                      <Badge variant="outline" className="border-[#C7A347]/30 text-[#C7A347] text-[10px]">
                        {squad.contrib.toFixed(1)}% IMPACTO
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 text-xs uppercase tracking-wider">Faturamento</span>
                      <span className="font-mono text-slate-200">{formatCurrency(squad.faturamento)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-amber-400 text-xs uppercase tracking-wider">Lucro Previsto</span>
                      <span className="font-mono text-amber-300">{formatCurrency(squad.lucroPrevisto)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-amber-400 text-xs uppercase tracking-wider">Margem Prevista</span>
                      <span className="font-mono font-bold text-amber-300">
                        {squad.margemPrevista.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className={`text-xs uppercase tracking-wider ${squad.lucroConsolidado === 0 ? "text-slate-400" : squad.lucroConsolidado < squad.lucroPrevisto ? "text-red-400" : "text-emerald-400"}`}>
                        Lucro Consolidado
                      </span>
                      <span className={`font-mono ${squad.lucroConsolidado === 0 ? "text-slate-400" : squad.lucroConsolidado < squad.lucroPrevisto ? "text-red-400" : "text-emerald-300"}`}>
                        {formatCurrency(squad.lucroConsolidado)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className={`text-xs uppercase tracking-wider ${squad.margemConsolidada === 0 ? "text-slate-400" : squad.margemConsolidada < squad.margemPrevista ? "text-red-400" : "text-emerald-400"}`}>
                        Margem Consolidada
                      </span>
                      <span className={`font-mono font-bold ${squad.margemConsolidada === 0 ? "text-slate-400" : squad.margemConsolidada < squad.margemPrevista ? "text-red-400" : "text-emerald-300"}`}>
                        {squad.margemConsolidada.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 text-xs uppercase tracking-wider flex items-center gap-1">
                        <Star className="h-3 w-3" /> NPS
                      </span>
                      {squad.nps_medio !== null ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getNpsColor(squad.nps_medio)}`}>
                          {squad.nps_medio.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {rankingSquads.length === 0 && (
                <p className="col-span-full text-center text-slate-600 py-10 uppercase tracking-widest text-sm">
                  Nenhum operador ativo no período.
                </p>
              )}
            </div>
          )}

          {viewMode === "obra" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rankingObras.map((obra) => (
                <div
                  key={obra.id}
                  onClick={() => {
                    setSelectedObraForEdit(obra.id);
                    handleOpenLancamento(true);
                  }}
                  className="bg-slate-900 p-5 rounded-lg border border-slate-800 hover:border-[#C7A347] transition-all flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3
                        className="font-bold text-white truncate max-w-[180px] group-hover:text-[#C7A347] transition-colors"
                        title={obra.nome_obra}
                      >
                        {obra.nome_obra}
                      </h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {squads.find((s) => s.id === obra.usuario_id)?.nome || "Não Atribuído"}
                      </p>
                    </div>
                    {obra.nps !== null && (
                      <div className={`px-2 py-1 rounded text-[10px] font-bold border ${getNpsColor(obra.nps)}`}>
                        NPS {obra.nps}
                      </div>
                    )}
                  </div>
                  {(() => {
                    const margemPrev = obra.faturamento_realizado > 0 ? (obra.lucro_realizado / obra.faturamento_realizado) * 100 : 0;
                    const margemCons = obra.faturamento_realizado > 0 ? ((obra.lucro_consolidado || 0) / obra.faturamento_realizado) * 100 : 0;
                    const lucroConsolidado = obra.lucro_consolidado || 0;
                    
                    return (
                      <div className="space-y-2 pt-3 border-t border-slate-800/50">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-slate-500 uppercase">Faturamento</p>
                          <p className="font-mono text-sm text-slate-300">{formatCurrency(obra.faturamento_realizado)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-amber-400 uppercase">Lucro Previsto</p>
                          <p className="font-mono text-sm text-amber-300">{formatCurrency(obra.lucro_realizado)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-amber-400 uppercase">Margem Prevista</p>
                          <p className="font-mono text-sm text-amber-300">{margemPrev.toFixed(2)}%</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-[10px] uppercase ${lucroConsolidado === 0 ? "text-slate-400" : lucroConsolidado < obra.lucro_realizado ? "text-red-400" : "text-emerald-400"}`}>
                            Lucro Consolidado
                          </p>
                          <p className={`font-mono text-sm ${lucroConsolidado === 0 ? "text-slate-400" : lucroConsolidado < obra.lucro_realizado ? "text-red-400" : "text-emerald-300"}`}>
                            {formatCurrency(lucroConsolidado)}
                          </p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-[10px] uppercase ${margemCons === 0 ? "text-slate-400" : margemCons < margemPrev ? "text-red-400" : "text-emerald-400"}`}>
                            Margem Consolidada
                          </p>
                          <p className={`font-mono text-sm font-bold ${margemCons === 0 ? "text-slate-400" : margemCons < margemPrev ? "text-red-400" : "text-emerald-300"}`}>
                            {margemCons.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-slate-800/30">
                    <Edit3 className="h-3 w-3 inline-block mr-1" />
                    Clique para editar
                  </div>
                </div>
              ))}
              {rankingObras.length === 0 && (
                <p className="col-span-full text-center text-slate-600 py-10 uppercase tracking-widest text-sm">
                  Nenhuma missão ativa no período.
                </p>
              )}
            </div>
          )}

          {viewMode === "aderencia" && (
            <AdherenceRanking data={adherenceData || []} isLoading={isLoadingAdherence} />
          )}
        </div>

        {/* --- MODAL DE LANÇAMENTO (MANTÉM UI MAIS LIMPA PARA EDIÇÃO, MAS COM TEMA DARK) --- */}
        <Dialog open={isLancamentoModalOpen} onOpenChange={handleOpenLancamento}>
          <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-slate-950 border-slate-800 text-slate-100">
            <DialogHeader className="p-6 pb-2 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl uppercase tracking-wider text-[#C7A347] font-bold">
                    Lançamento de Resultados - {anoSelecionado}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">Atualização de status operacional.</DialogDescription>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Selecionado</p>
                  <p className="text-lg font-mono font-bold text-white">{formatCurrency(totalFaturamento)}</p>
                </div>
              </div>
            </DialogHeader>
            <ScrollArea className="flex-1 p-6 bg-slate-900/50">
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-900">
                    <TableRow className="border-slate-800 hover:bg-slate-900">
                      <TableHead className="w-[50px] text-center text-slate-400">Ativa?</TableHead>
                      <TableHead className="min-w-[150px] text-slate-400">Obra</TableHead>
                      <TableHead className="w-[130px] text-slate-400">Início (Ano)</TableHead>
                      <TableHead className="min-w-[150px] text-slate-400">Squad Responsável</TableHead>
                      <TableHead className="w-[140px] text-slate-400">Faturamento</TableHead>
                      <TableHead className="w-[140px] text-amber-400">Lucro Previsto</TableHead>
                      <TableHead className="w-[140px] text-emerald-400">Lucro Consolidado</TableHead>
                      <TableHead className="w-[90px] text-slate-400">NPS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localObras.map((obra) => (
                      <TableRow
                        key={obra.id}
                        className={`border-slate-800 hover:bg-slate-900/50 ${!obra.considerar_na_meta ? "opacity-40 grayscale" : ""}`}
                      >
                        <TableCell className="text-center">
                          <Switch
                            checked={obra.considerar_na_meta}
                            onCheckedChange={(checked) => handleLocalChange(obra.id, "considerar_na_meta", checked)}
                            className="data-[state=checked]:bg-[#C7A347]"
                          />
                        </TableCell>
                        <TableCell className="font-bold text-slate-200">
                          {obra.nome_obra}
                          <div className="text-[10px] text-slate-500 uppercase">{obra.status}</div>
                        </TableCell>

                        <TableCell>
                          <Input
                            type="date"
                            className="h-8 w-full text-xs bg-slate-950 border-slate-700 text-white"
                            value={obra.data_inicio || ""}
                            onChange={(e) => handleLocalChange(obra.id, "data_inicio", e.target.value)}
                          />
                        </TableCell>

                        <TableCell>
                          <Select
                            value={obra.usuario_id || "none"}
                            onValueChange={(val) =>
                              handleLocalChange(obra.id, "usuario_id", val === "none" ? null : val)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs bg-slate-950 border-slate-700 text-white w-full">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white">
                              <SelectItem value="none" className="text-slate-500 italic">
                                Sem Squad
                              </SelectItem>
                              {squads.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="h-8 text-right bg-slate-950 border-slate-700 text-white font-mono text-xs focus:border-[#C7A347] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={obra.faturamento_realizado === 0 ? "" : obra.faturamento_realizado}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                              handleLocalChange(obra.id, "faturamento_realizado", val);
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="h-8 text-right bg-slate-950 border-amber-700/50 text-amber-300 font-mono text-xs focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={obra.lucro_realizado === 0 ? "" : obra.lucro_realizado}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                              handleLocalChange(obra.id, "lucro_realizado", val);
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className="h-8 text-right bg-slate-950 border-emerald-700/50 text-emerald-300 font-mono text-xs focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={obra.lucro_consolidado === 0 ? "" : obra.lucro_consolidado}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                              handleLocalChange(obra.id, "lucro_consolidado", val);
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            className="h-8 text-center bg-slate-950 border-slate-700 text-white font-bold text-xs focus:border-[#C7A347] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="-"
                            value={obra.nps !== null ? obra.nps : ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? null : parseFloat(e.target.value);
                              if (val !== null && (val < 0 || val > 10)) return;
                              handleLocalChange(obra.id, "nps", val);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
            <DialogFooter className="p-4 border-t border-slate-800 bg-slate-900 gap-2">
              <Button
                variant="outline"
                onClick={() => setIsLancamentoModalOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                CANCELAR
              </Button>
              <Button
                onClick={handleSaveAll}
                className="bg-[#C7A347] hover:bg-[#b08d3b] text-black w-full sm:w-auto min-w-[120px] font-bold uppercase tracking-widest"
                disabled={isSavingObras}
              >
                {isSavingObras ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                CONFIRMAR DADOS
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GestaoMetas;
