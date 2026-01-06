import React, { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PCPAverageCardProps {
  className?: string;
}

const PCPAverageCard: React.FC<PCPAverageCardProps> = ({ className }) => {
  const [averagePCP, setAveragePCP] = useState(0);
  const [totalWeeks, setTotalWeeks] = useState(0);
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
      // Get current week start (Monday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() + diff);
      currentWeekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('resumo_execucao_semanal')
        .select('percentual_concluido, semana')
        .eq('obra_id', obraId)
        .lte('semana', currentWeekStart.toISOString().split('T')[0]);

      if (error) {
        console.error("Erro ao buscar dados para média:", error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const sum = data.reduce((acc, item) => acc + (item.percentual_concluido || 0), 0);
        const average = (sum / data.length) * 100;
        setAveragePCP(Math.round(average));
        setTotalWeeks(data.length);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao calcular média PCP:", err);
      setIsLoading(false);
    }
  };

  const getPcpColor = (pcp: number) => {
    if (pcp >= 85) return "text-green-600";
    if (pcp >= 70) return "text-amber-500";
    return "text-red-500";
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white border border-slate-200/50 shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in",
        className,
      )}
    >
      <div className="relative p-6">
        <div className="flex items-center mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 shadow-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 ml-3 truncate">PCP Médio Geral</h3>
        </div>

        <div className="flex flex-col justify-center items-center space-y-4">
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-100"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${averagePCP * 2.83} 283`}
                className={cn("transition-all duration-700 ease-out", getPcpColor(averagePCP))}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-xl font-bold", isLoading ? "text-muted-foreground" : getPcpColor(averagePCP))}>
                {isLoading ? "..." : `${averagePCP}%`}
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs font-medium text-slate-600 mb-1">
              Média de {totalWeeks} semana{totalWeeks !== 1 ? 's' : ''}
            </div>
            <div className="text-[10px] text-slate-500">
              Até a semana atual
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PCPAverageCard);
