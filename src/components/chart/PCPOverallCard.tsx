import React, { memo, useMemo } from "react";
import { PCPData } from "@/types";
import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PCPOverallCardProps {
  data: PCPData;
  className?: string;
}

const PCPOverallCard: React.FC<PCPOverallCardProps> = memo(({ data, className }) => {
  const percentage = useMemo(() => (data ? Math.round(data.percentage) : 0), [data?.percentage]);
  const dashArray = useMemo(() => `${percentage * 2.83} 283`, [percentage]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white border border-slate-200/50 shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
        className,
      )}
    >
      <div className="relative p-6">
        <div className="flex items-center mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <BarChart2 className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 ml-3 truncate">PCP Geral da Semana</h3>
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
                strokeDasharray={dashArray}
                className="text-secondary transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{percentage}%</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs font-medium text-slate-600 mb-1">
              {data?.completedTasks || 0} de {data?.totalTasks || 0} tarefas concluídas
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-[10px] text-slate-500">Concluídas</span>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-2"></div>
              <span className="text-[10px] text-slate-500">Pendentes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PCPOverallCard.displayName = "PCPOverallCard";

export default PCPOverallCard;
