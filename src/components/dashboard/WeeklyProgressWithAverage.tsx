import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format } from "date-fns";
import PCPWeeklyChart from "@/components/chart/PCPWeeklyChart";

const WeeklyProgressWithAverage = () => {
  const [averagePCP, setAveragePCP] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { userSession } = useAuth();

  useEffect(() => {
    fetchAverageData();
  }, [userSession?.obraAtiva?.id]);

  const fetchAverageData = async () => {
    const obraId = userSession?.obraAtiva?.id;
    if (!obraId) {
      setIsLoading(false);
      return;
    }

    try {
      // Get current week start date
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const currentWeekISO = format(currentWeekStart, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('resumo_execucao_semanal')
        .select('percentual_concluido')
        .eq('obra_id', obraId)
        .lte('semana', currentWeekISO);

      if (error) {
        console.error("Erro ao buscar dados para média:", error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const sum = data.reduce((acc, item) => acc + (item.percentual_concluido || 0), 0);
        const average = (sum / data.length) * 100; // Convert to percentage
        setAveragePCP(Math.round(average));
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao calcular média PCP:", err);
      setIsLoading(false);
    }
  };

  const getPcpColor = (pcp: number) => {
    if (pcp >= 85) return "text-success";
    if (pcp >= 70) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Progresso Semanal</h2>
          <p className="text-sm text-muted-foreground">Todas as semanas cadastradas</p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getPcpColor(averagePCP)}`}>
            {isLoading ? "..." : `${averagePCP}%`}
          </div>
          <div className="text-xs text-muted-foreground">PCP Médio</div>
        </div>
      </div>
      <div className="bg-background/50 rounded-lg p-4">
        <PCPWeeklyChart />
      </div>
    </div>
  );
};

export default React.memo(WeeklyProgressWithAverage);