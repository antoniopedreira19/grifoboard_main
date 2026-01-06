
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import { AtividadeChecklist } from "@/types/checklist";

interface ChecklistStatsProps {
  atividades: AtividadeChecklist[];
}

const ChecklistStats: React.FC<ChecklistStatsProps> = ({ atividades }) => {
  const totalAtividades = atividades.length;
  const atividadesConcluidas = atividades.filter(atividade => atividade.concluida).length;
  const atividadesPendentes = totalAtividades - atividadesConcluidas;
  
  const percentualConcluidas = totalAtividades > 0 ? Math.round((atividadesConcluidas / totalAtividades) * 100) : 0;
  const percentualPendentes = totalAtividades > 0 ? Math.round((atividadesPendentes / totalAtividades) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-800">
            Atividades Concluídas
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-800">{atividadesConcluidas}</div>
          <p className="text-xs text-green-600">
            {percentualConcluidas}% do total
          </p>
        </CardContent>
      </Card>

      <Card className="bg-orange-50 border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-800">
            Atividades Pendentes
          </CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-800">{atividadesPendentes}</div>
          <p className="text-xs text-orange-600">
            {percentualPendentes}% do total
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChecklistStats;
