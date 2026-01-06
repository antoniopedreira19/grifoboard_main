import React, { useState, useEffect } from "react";
import { BarChart2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PCPGeneralCardProps {
  className?: string;
}

const PCPGeneralCard: React.FC<PCPGeneralCardProps> = ({ className }) => {
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { userSession } = useAuth();

  useEffect(() => {
    fetchGeneralData();
  }, [userSession?.obraAtiva?.id]);

  const fetchGeneralData = async () => {
    const obraId = userSession?.obraAtiva?.id;
    if (!obraId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select('percentual_executado')
        .eq('obra_id', obraId);

      if (error) {
        console.error("Erro ao buscar dados gerais:", error);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const total = data.length;
        const completed = data.filter(task => task.percentual_executado === 1).length;

        setTotalTasks(total);
        setCompletedTasks(completed);
        setPercentage(total > 0 ? Math.round((completed / total) * 100) : 0);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Erro ao calcular PCP geral:", err);
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
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <BarChart2 className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 ml-3 truncate">PCP Geral</h3>
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
                strokeDasharray={`${percentage * 2.83} 283`}
                className={cn("transition-all duration-700 ease-out", getPcpColor(percentage))}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-xl font-bold", isLoading ? "text-muted-foreground" : getPcpColor(percentage))}>
                {isLoading ? "..." : `${percentage}%`}
              </span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs font-medium text-slate-600 mb-1">
              {completedTasks} de {totalTasks} atividades
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-[10px] text-slate-500">Executadas</span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-2"></div>
              <span className="text-[10px] text-slate-500">Planejadas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PCPGeneralCard);
