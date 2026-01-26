import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Target, DollarSign } from "lucide-react";

interface PlaybookSummaryProps {
  totalOriginal: number;
  totalMeta: number;
  showOriginal?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function PlaybookSummary({ totalOriginal, totalMeta, showOriginal = true }: PlaybookSummaryProps) {
  const diferenca = totalOriginal - totalMeta;
  const percentualEconomia = totalOriginal > 0 ? (diferenca / totalOriginal) * 100 : 0;

  // Se for member, mostra apenas a Meta Grifo centralizada
  if (!showOriginal) {
    return (
      <div className="flex justify-center">
        <Card className="bg-blue-50 border-blue-200 shadow-sm max-w-md w-full">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Meta Grifo</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{formatCurrency(totalMeta)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Visão completa para admin
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Orçamento Original</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalOriginal)}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Meta Grifo</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(totalMeta)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`shadow-sm ${diferenca >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${diferenca >= 0 ? "text-green-600" : "text-red-600"}`}>
                Economia Projetada
              </p>
              <p className={`text-2xl font-bold mt-1 ${diferenca >= 0 ? "text-green-900" : "text-red-900"}`}>
                {formatCurrency(diferenca)}
              </p>
              <p className={`text-xs mt-1 ${diferenca >= 0 ? "text-green-600" : "text-red-600"}`}>
                {percentualEconomia.toFixed(1)}% do orçamento
              </p>
            </div>
            <div className={`p-3 rounded-xl ${diferenca >= 0 ? "bg-green-100" : "bg-red-100"}`}>
              {diferenca >= 0 ? (
                <TrendingDown className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingUp className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
