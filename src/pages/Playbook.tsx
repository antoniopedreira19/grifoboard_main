import { useState, useEffect } from "react";
import { PlaybookImporter } from "@/components/playbook/PlaybookImporter";
import { PlaybookTable, PlaybookItem } from "@/components/playbook/PlaybookTable";
// CORREÇÃO 1: Import default para resolver TS2614
import PlaybookSummary from "@/components/playbook/PlaybookSummary";
import { ContractingManagement } from "@/components/playbook/ContractingManagement";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Trash2, Loader2, Settings2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { playbookService } from "@/services/playbookService";
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

const Playbook = () => {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const obraId = userSession?.obraAtiva?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orcamento");
  const [playbookData, setPlaybookData] = useState<{
    items: PlaybookItem[];
    grandTotalMeta: number;
    grandTotalOriginal: number;
  } | null>(null);

  const [coeficiente1, setCoeficiente1] = useState<number>(0.57);
  const [coeficiente2, setCoeficiente2] = useState<number>(0.75);
  const [coeficienteSelecionado, setCoeficienteSelecionado] = useState<"1" | "2">("1");
  const [rawItems, setRawItems] = useState<any[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [userRole, setUserRole] = useState<string>("member");

  // Verifica a role do usuário
  useEffect(() => {
    const checkUserRole = async () => {
      if (userSession?.user?.id) {
        const { data } = await supabase
          .from("usuarios")
          .select("role")
          .eq("id", userSession.user.id)
          .single();
        if (data?.role) {
          setUserRole(data.role);
        }
      }
    };
    checkUserRole();
  }, [userSession?.user?.id]);

  const isAdmin = userRole === "admin" || userRole === "master_admin";

  const processItems = (items: any[], coef: number) => {
    let grandTotalMeta = 0;
    let grandTotalOriginal = 0;

    const processedItems = items.map((item) => {
      const precoUnitarioMeta = (item.preco_unitario || 0) * coef;
      const precoTotalMeta = (item.preco_total || 0) * coef;

      const nivel = item.nivel ?? (item.is_etapa ? 0 : 2);

      if (nivel === 2) {
        grandTotalMeta += precoTotalMeta;
        grandTotalOriginal += item.preco_total || 0;
      }

      return {
        id: item.id, // CORREÇÃO 2: Mantém o UUID original do banco!
        descricao: item.descricao,
        unidade: item.unidade,
        qtd: Number(item.qtd),
        precoUnitario: Number(item.preco_unitario),
        precoTotal: Number(item.preco_total),
        isEtapa: item.is_etapa,
        nivel: nivel,
        precoUnitarioMeta,
        precoTotalMeta,
        porcentagem: 0,
        // Campos da Fase 2
        destino: item.destino,
        responsavel: item.responsavel,
        data_limite: item.data_limite,
        valor_contratado: item.valor_contratado,
        status_contratacao: item.status_contratacao,
        observacao: item.observacao,
        contract_url: item.contract_url, // <--- ADICIONADO AQUI
      };
    });

    // Calcula porcentagem e formata o objeto final
    const finalItems = processedItems.map((item) => ({
      ...item,
      // Não sobrescrevemos mais o ID com Math.random ou ordem
      porcentagem: grandTotalMeta > 0 && item.nivel === 2 ? (item.precoTotalMeta / grandTotalMeta) * 100 : 0,
    }));

    return { items: finalItems as PlaybookItem[], grandTotalMeta, grandTotalOriginal };
  };

  const fetchPlaybook = async (silent = false) => {
    if (!obraId) {
      setIsLoading(false);
      setPlaybookData(null);
      return;
    }
    if (!silent) setIsLoading(true);
    try {
      const { config, items } = await playbookService.getPlaybook(obraId);

      if (!items || items.length === 0) {
        setPlaybookData(null);
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

      const coef = selected === "2" ? c2 : c1;
      const processed = processItems(items, coef);
      setPlaybookData(processed);
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao carregar dados do playbook.", variant: "destructive" });
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const silentRefetch = () => fetchPlaybook(true);

  const handleCoeficienteChange = async (newSelected: "1" | "2", newC1?: number, newC2?: number) => {
    const c1 = newC1 ?? coeficiente1;
    const c2 = newC2 ?? coeficiente2;
    const coef = newSelected === "2" ? c2 : c1;

    if (rawItems.length > 0) {
      const processed = processItems(rawItems, coef);
      setPlaybookData(processed);
    }
  };

  const saveCoeficienteConfig = async () => {
    if (!obraId) return;
    setIsSavingConfig(true);
    try {
      await playbookService.savePlaybook(
        obraId,
        {
          obra_id: obraId,
          coeficiente_1: coeficiente1,
          coeficiente_2: coeficiente2,
          coeficiente_selecionado: coeficienteSelecionado,
        },
        rawItems.map((item, index) => ({
          obra_id: obraId,
          descricao: item.descricao,
          unidade: item.unidade || "",
          qtd: item.qtd || 0,
          preco_unitario: item.preco_unitario || 0,
          preco_total: item.preco_total || 0,
          is_etapa: item.is_etapa || false,
          nivel: item.nivel ?? (item.is_etapa ? 0 : 2),
          ordem: index,
        })),
      );
      toast({ title: "Sucesso", description: "Coeficientes atualizados com sucesso." });
    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao salvar coeficientes.", variant: "destructive" });
    } finally {
      setIsSavingConfig(false);
    }
  };

  useEffect(() => {
    fetchPlaybook();
  }, [obraId]);

  const handleClearData = async () => {
    if (!obraId) return;
    try {
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

      setPlaybookData(null);
      toast({ title: "Dados limpos", description: "O orçamento foi removido com sucesso." });
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível limpar os dados.", variant: "destructive" });
    }
  };

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
          <p className="text-slate-500 mt-1 ml-1 text-sm max-w-2xl">
            Controle orçamentário detalhado: Orçamento Original vs. Meta Grifo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Limpar - Apenas para Admin */}
          {playbookData && isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" /> Limpar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Playbook?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação apagará todos os dados orçamentários importados para esta obra.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className="bg-red-600 hover:bg-red-700">
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Importador - Apenas para Admin */}
          {isAdmin && <PlaybookImporter onSave={fetchPlaybook} />}
        </div>
      </div>

      {!obraId ? (
        <Card className="border-dashed border-2 border-slate-200 shadow-none bg-white/50 min-h-[400px]">
          <CardContent className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
            <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100">
              <BookOpen className="h-10 w-10 text-slate-300" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-semibold text-slate-700">Selecione uma obra</h3>
              <p className="text-sm text-slate-500">Para visualizar o Playbook, selecione uma obra no menu lateral.</p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-slate-500">Carregando orçamento...</p>
        </div>
      ) : !playbookData ? (
        <Card className="border-dashed border-2 border-slate-200 shadow-none bg-white/50 min-h-[400px]">
          <CardContent className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
            <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100">
              <BookOpen className="h-10 w-10 text-slate-300" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-semibold text-slate-700">Seu Playbook está vazio</h3>
              <p className="text-sm text-slate-500">
                Importe sua planilha de orçamento padrão para começar a definir as metas.
              </p>
            </div>
            <div className="pt-2">
              <PlaybookImporter onSave={fetchPlaybook} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-full shadow-sm">
                <TabsTrigger
                  value="orcamento"
                  className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2 transition-all"
                >
                  <BookOpen className="h-4 w-4" />
                  1. Orçamento & Metas
                </TabsTrigger>
                <TabsTrigger
                  value="contratacao"
                  className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2 transition-all"
                >
                  <ListChecks className="h-4 w-4" />
                  2. Gestão de Contratações
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="orcamento" className="space-y-6 animate-in fade-in duration-300">
              {/* Configuração de Coeficientes - Apenas para Admin */}
              {isAdmin && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Settings2 className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-slate-700">Configuração de Coeficientes</h3>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
                      <RadioGroup
                        value={coeficienteSelecionado}
                        onValueChange={(value: "1" | "2") => {
                          setCoeficienteSelecionado(value);
                          handleCoeficienteChange(value);
                        }}
                        className="flex gap-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="coef1" />
                            <Label htmlFor="coef1" className="text-sm text-slate-600 cursor-pointer">
                              Coeficiente 1
                            </Label>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={coeficiente1}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCoeficiente1(val);
                              if (coeficienteSelecionado === "1") {
                                handleCoeficienteChange("1", val, coeficiente2);
                              }
                            }}
                            className="w-24 h-8 text-sm"
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2" id="coef2" />
                            <Label htmlFor="coef2" className="text-sm text-slate-600 cursor-pointer">
                              Coeficiente 2
                            </Label>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={coeficiente2}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCoeficiente2(val);
                              if (coeficienteSelecionado === "2") {
                                handleCoeficienteChange("2", coeficiente1, val);
                              }
                            }}
                            className="w-24 h-8 text-sm"
                          />
                        </div>
                      </RadioGroup>

                      <Button size="sm" onClick={saveCoeficienteConfig} disabled={isSavingConfig} className="h-8">
                        {isSavingConfig ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Salvar Coeficientes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <PlaybookSummary
                totalOriginal={playbookData.grandTotalOriginal}
                totalMeta={playbookData.grandTotalMeta}
                showOriginal={isAdmin}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-lg font-bold text-slate-700">Estrutura Analítica</h3>
                  <span className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {playbookData.items.length} registros
                  </span>
                </div>
                <PlaybookTable
                  data={playbookData.items}
                  grandTotalOriginal={playbookData.grandTotalOriginal}
                  grandTotalMeta={playbookData.grandTotalMeta}
                  onUpdate={silentRefetch}
                />
              </div>
            </TabsContent>

            <TabsContent value="contratacao" className="space-y-6 animate-in fade-in duration-300">
              <ContractingManagement items={playbookData.items as any} onUpdate={silentRefetch} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Playbook;
