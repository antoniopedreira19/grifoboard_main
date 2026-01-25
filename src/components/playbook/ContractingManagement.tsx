import { PlaybookTable } from "@/components/playbook/PlaybookTable";
import { PlaybookItem } from "@/types/playbook";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, DollarSign, CheckCircle2, Clock, Briefcase } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ContractingManagementProps {
  data?: PlaybookItem[];
  grandTotalOriginal?: number;
  grandTotalMeta?: number;
  onUpdate?: () => void;
}

export function ContractingManagement({
  data = [],
  grandTotalOriginal = 0,
  grandTotalMeta = 0,
  onUpdate = () => {},
}: ContractingManagementProps) {
  if (data.length === 0) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Orçamento Vazio</AlertTitle>
        <AlertDescription className="text-blue-600">
          Importe uma planilha para começar a gestão de contratação.
        </AlertDescription>
      </Alert>
    );
  }

  // --- CÁLCULOS DO RESUMO ---
  const totalContratado = data.reduce((acc, item) => acc + (item.valor_contratado || 0), 0);

  // Saldo: Quanto falta contratar (Meta - Contratado).
  // Nota: Isso é uma visão macro. Idealmente somaria apenas itens não contratados,
  // mas Meta - Contratado dá a visão de "Saldo de Caixa" do projeto.
  const saldo = grandTotalMeta - totalContratado;

  const itensContratados = data.filter((i) => (i.valor_contratado || 0) > 0).length;
  // Assumindo que itens sem valor contratado mas com meta > 0 estão "A Contratar"
  const itensAContratar = data.filter(
    (i) => (i.preco_total || 0) > 0 && (!i.valor_contratado || i.valor_contratado === 0) && i.nivel === 2,
  ).length;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Contratação</h2>
          <p className="text-slate-600">Acompanhe o status e valores de contratação.</p>
        </div>
      </div>

      {/* --- CARDS DE RESUMO --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Orçamento Meta</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(grandTotalMeta)}</div>
            <p className="text-xs text-slate-500">Meta estipulada</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Contratado</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalContratado)}</div>
            <p className="text-xs text-blue-100 bg-blue-600 inline-block px-1.5 rounded mt-1">
              {((totalContratado / grandTotalMeta) * 100).toFixed(1)}% da meta
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">A Contratar / Saldo</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatCurrency(saldo)}
            </div>
            <p className="text-xs text-slate-500">Disponível na meta</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Status Itens</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {itensContratados}{" "}
              <span className="text-sm font-normal text-slate-400">/ {itensContratados + itensAContratar}</span>
            </div>
            <p className="text-xs text-slate-500">{itensAContratar} pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* --- TABELA --- */}
      <PlaybookTable
        data={data}
        grandTotalOriginal={grandTotalOriginal}
        grandTotalMeta={grandTotalMeta}
        onUpdate={onUpdate}
        readOnly={false}
        mode="contracting" // Ativa o modo de contratação na tabela
      />
    </div>
  );
}
