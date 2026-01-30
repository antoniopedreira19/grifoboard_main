import { useState, useEffect, useMemo, useCallback } from "react";
import { PlaybookImporter } from "@/components/playbook/PlaybookImporter";
import { VirtualizedPlaybookTable } from "@/components/playbook/VirtualizedPlaybookTable";
import PlaybookSummary from "@/components/playbook/PlaybookSummary";
import { ContractingManagement } from "@/components/playbook/ContractingManagement";
import { NoObraSelected } from "@/components/shared/NoObraSelected";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Trash2, Loader2, Settings2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { playbookService } from "@/services/playbookService";
import { gamificationService } from "@/services/gamificationService";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PlaybookItem } from "@/types/playbook";

const Playbook = () => {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const obraId = userSession?.obraAtiva?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orcamento");

  const [coeficiente1, setCoeficiente1] = useState<number>(0.57);
  const [coeficiente2, setCoeficiente2] = useState<number>(0.75);
  const [coeficienteSelecionado, setCoeficienteSelecionado] = useState<"1" | "2">("1");
  const [rawItems, setRawItems] = useState<PlaybookItem[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [userRole, setUserRole] = useState<string>("member");

  useEffect(() => {
    const checkUserRole = async () => {
      if (userSession?.user?.id) {
        const { data } = await supabase.from("usuarios").select("role").eq("id", userSession.user.id).single();
        if (data?.role) {
          setUserRole(data.role);
        }
      }
    };
    checkUserRole();
  }, [userSession?.user?.id]);

  const isAdmin = userRole === "admin" || userRole === "master_admin";

  // Memoized coefficient based on selection
  const activeCoef = useMemo(() => {
    return coeficienteSelecionado === "2" ? coeficiente2 : coeficiente1;
  }, [coeficiente1, coeficiente2, coeficienteSelecionado]);

  // Memoized processed items - only recalculates when rawItems or coef changes
  const processedData = useMemo(() => {
    if (rawItems.length === 0) return null;

    let grandTotalMeta = 0;
    let grandTotalOriginal = 0;

    const processedItems = rawItems.map((item) => {
      const precoUnitarioMeta = (item.preco_unitario || 0) * activeCoef;
      const precoTotalMeta = (item.preco_total || 0) * activeCoef;
      const nivel = item.nivel ?? (item.is_etapa ? 0 : 2);

      if (nivel === 2) {
        grandTotalMeta += precoTotalMeta;
        grandTotalOriginal += item.preco_total || 0;
      }

      return {
        ...item,
        nivel,
        precoUnitarioMeta,
        precoTotalMeta,
        precoTotal: item.preco_total,
        porcentagem: 0,
      };
    });

    const finalItems = processedItems.map((item) => ({
      ...item,
      porcentagem: grandTotalMeta > 0 && item.nivel === 2 ? (item.precoTotalMeta / grandTotalMeta) * 100 : 0,
    }));

    return { items: finalItems as any[], grandTotalMeta, grandTotalOriginal };
  }, [rawItems, activeCoef]);

  const fetchPlaybook = useCallback(
    async (silent = false) => {
      if (!obraId) {
        setIsLoading(false);
        setRawItems([]);
        return;
      }
      if (!silent) setIsLoading(true);
      try {
        const { config, items } = await playbookService.getPlaybook(obraId);

        if (!items || items.length === 0) {
          setRawItems([]);
          return;
        }

        const c1 = config?.coeficiente_1 || 0.57;
        const c2 = config?.coeficiente_2 || 0.75;
        const selected = (config?.coeficiente_selecionado as "1" | "2") || "1";

        setCoeficiente1(c1);
        setCoeficiente2(c2);
        setCoeficienteSelecionado(selected);
        setRawItems(items);
      } catch (error) {
        console.error(error);
        toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" });
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [obraId, toast],
  );

  const silentRefetch = useCallback(() => fetchPlaybook(true), [fetchPlaybook]);

  // Optimistic update handler - updates local state immediately
  const handleOptimisticUpdate = useCallback((itemId: string, field: string, value: string) => {
    setRawItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  }, []);

  const saveCoeficienteConfig = useCallback(async () => {
    if (!obraId) return;
    setIsSavingConfig(true);
    try {
      // Usar saveConfig que NÃO MEXE nos itens - preserva destinos
      await playbookService.saveConfig(obraId, {
        obra_id: obraId,
        coeficiente_1: coeficiente1,
        coeficiente_2: coeficiente2,
        coeficiente_selecionado: coeficienteSelecionado,
      });
      toast({ title: "Sucesso", description: "Coeficientes atualizados." });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    } finally {
      setIsSavingConfig(false);
    }
  }, [obraId, coeficiente1, coeficiente2, coeficienteSelecionado, toast]);

  useEffect(() => {
    fetchPlaybook();
  }, [obraId]);

  const handleClearData = useCallback(async () => {
    if (!obraId) return;
    try {
      // Remove XP earned from playbook before clearing
      if (userSession?.user?.id) {
        await gamificationService.removePlaybookXP(userSession.user.id, obraId);
      }

      await playbookService.savePlaybook(
        obraId,
        {
          obra_id: obraId,
          coeficiente_1: 0,
          coeficiente_2: 0,
          coeficiente_selecionado: "1",
        },
        [],
      );
      setRawItems([]);
      toast({ title: "Dados limpos", description: "Orçamento removido." });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao limpar.", variant: "destructive" });
    }
  }, [obraId, toast, userSession?.user?.id]);

  return (
    <div className="container mx-auto max-w-[1600px] px-4 sm:px-6 py-4 min-h-screen pb-24 space-y-6 bg-slate-50/30">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            Playbook de Obras
          </h1>
          <p className="text-slate-500 mt-1 ml-1 text-sm max-w-2xl">Gestão orçamentária e contratação.</p>
        </div>

        <div className="flex items-center gap-2">
          {processedData && isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" /> Limpar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Playbook?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação apagará todos os dados.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className="bg-red-600">
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isAdmin && <PlaybookImporter onSave={fetchPlaybook} />}
        </div>
      </div>

      {!obraId ? (
        <NoObraSelected />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-slate-500">Carregando...</p>
        </div>
      ) : !processedData ? (
        <Card className="border-dashed border-2 border-slate-200 bg-white/50 min-h-[400px]">
          <CardContent className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
            <BookOpen className="h-10 w-10 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">Playbook Vazio</h3>
            <p className="text-sm text-slate-500">Importe uma planilha para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-white border p-1 rounded-full shadow-sm">
                <TabsTrigger value="orcamento" className="rounded-full px-6 py-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Orçamento
                </TabsTrigger>
                <TabsTrigger value="contratacao" className="rounded-full px-6 py-2 flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> Contratação
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="orcamento" className="space-y-6">
              {isAdmin && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="py-4 px-5">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Configuração de Coeficientes</span>
                      </div>

                      <RadioGroup
                        value={coeficienteSelecionado}
                        onValueChange={(v) => setCoeficienteSelecionado(v as "1" | "2")}
                        className="flex items-center gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="1" id="coef1" />
                          <Label htmlFor="coef1" className="text-sm">
                            Coef. 1
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={coeficiente1}
                            onChange={(e) => setCoeficiente1(parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="2" id="coef2" />
                          <Label htmlFor="coef2" className="text-sm">
                            Coef. 2
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={coeficiente2}
                            onChange={(e) => setCoeficiente2(parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                      </RadioGroup>

                      <Button size="sm" variant="outline" onClick={saveCoeficienteConfig} disabled={isSavingConfig}>
                        {isSavingConfig ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        Salvar Config
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <PlaybookSummary
                totalOriginal={processedData.grandTotalOriginal}
                totalMeta={processedData.grandTotalMeta}
                showOriginal={isAdmin}
              />
              <VirtualizedPlaybookTable
                data={processedData.items}
                grandTotalOriginal={processedData.grandTotalOriginal}
                grandTotalMeta={processedData.grandTotalMeta}
                onUpdate={silentRefetch}
                onOptimisticUpdate={handleOptimisticUpdate}
              />
            </TabsContent>

            <TabsContent value="contratacao">
              <ContractingManagement />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Playbook;
