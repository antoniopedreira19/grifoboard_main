import { useState, useEffect } from "react";
import { PlaybookTable } from "@/components/playbook/PlaybookTable";
import { PlaybookItem } from "@/types/playbook";
import { playbookService } from "@/services/playbookService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, DollarSign, CheckCircle2, Clock, Briefcase, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ContractingManagementProps {
  coeficiente?: number;
}

export function ContractingManagement({ coeficiente = 0.57 }: ContractingManagementProps) {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PlaybookItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega os dados
  const loadItems = async () => {
    if (!userSession?.obraAtiva?.id) return;
    try {
      setLoading(true);
      const data = await playbookService.listarItens(userSession.obraAtiva.id);
      setItems(data);
    } catch (error) {
      console.error("Erro ao carregar itens", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os itens.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [userSession?.obraAtiva?.id]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // --- CÁLCULOS DO RESUMO ---
  // Filtramos nível 2 para somar apenas os itens e não duplicar com as etapas
  const itensLevel2 = items.filter((i) => i.nivel === 2);

  // Calcula totais considerando o coeficiente para a meta
  const grandTotalMeta = itensLevel2.reduce((acc, i) => {
    // Usa o valor total original * coeficiente para ter a meta ajustada
    return acc + (i.preco_total || 0) * coeficiente;
  }, 0);

  const totalContratado = itensLevel2.reduce((acc, i) => acc + (i.valor_contratado || 0), 0);
  const saldo = grandTotalMeta - totalContratado;

  const itensTotalCount = itensLevel2.length;
  const itensContratadosCount = itensLevel2.filter((i) => (i.valor_contratado || 0) > 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Carregando farol de contratação...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Orçamento Vazio</AlertTitle>
        <AlertDescription className="text-blue-600">
          Importe uma planilha no Orçamento para começar a gestão.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Farol de Contratação</h2>
          <p className="text-slate-600">Gestão de prazos e valores contratados.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadItems} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* --- CARDS DE RESUMO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meta */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Orçamento Meta</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(grandTotalMeta)}</div>
            <p className="text-xs text-slate-500">Valor alvo total (Coef: {coeficiente})</p>
          </CardContent>
        </Card>

        {/* Contratado */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Contratado</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalContratado)}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                {grandTotalMeta > 0 ? ((totalContratado / grandTotalMeta) * 100).toFixed(1) : 0}%
              </span>
              <span className="text-xs text-slate-400">da meta</span>
            </div>
          </CardContent>
        </Card>

        {/* Saldo */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Saldo Disponível</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatCurrency(saldo)}
            </div>
            <p className="text-xs text-slate-500">Meta - Contratado</p>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Progresso de Itens</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {itensContratadosCount} <span className="text-sm font-normal text-slate-400">/ {itensTotalCount}</span>
            </div>
            <p className="text-xs text-slate-500">Itens fechados</p>
          </CardContent>
        </Card>
      </div>

      {/* --- TABELA UNIFICADA --- */}
      <div className="bg-white rounded-lg border shadow-sm">
        <PlaybookTable
          data={items.map((item) => ({
            ...item,
            // Calcula o valor meta (alvo) de cada item individualmente para exibição na tabela
            precoTotalMeta: (item.preco_total || 0) * coeficiente,
          }))}
          grandTotalOriginal={grandTotalMeta} // Usando meta como base para %
          grandTotalMeta={grandTotalMeta}
          onUpdate={loadItems}
          readOnly={false}
          mode="contracting" // MODO CONTRATAÇÃO ATIVADO
        />
      </div>
    </div>
  );
}
