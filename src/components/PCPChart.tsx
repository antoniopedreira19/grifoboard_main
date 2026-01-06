
import { PCPBreakdown, Task, WeeklyPCPData } from "@/types";
import PCPOverallCard from "./chart/PCPOverallCard";
import PCPBreakdownCard from "./chart/PCPBreakdownCard";
import CausesCountCard from "./chart/CausesCountCard";
import { BookOpen, Users, UserCheck } from "lucide-react";

interface PCPChartProps {
  pcpData: PCPBreakdown;
  weeklyData: WeeklyPCPData[];
  tasks: Task[];
  onCauseSelect: (cause: string) => void;
}

const PCPChart: React.FC<PCPChartProps> = ({ pcpData, weeklyData, tasks, onCauseSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Overall PCP */}
      <PCPOverallCard data={pcpData.overall} />
      
      {/* PCP by Discipline */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/50 shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in">        
        <div className="relative p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 ml-3 truncate">PCP por Disciplina</h3>
          </div>
          <div className="space-y-3">
            <PCPBreakdownCard title="" data={pcpData.byDiscipline || {}} />
          </div>
        </div>
      </div>
      
      {/* PCP by Executor */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/50 shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in">        
        <div className="relative p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 ml-3 truncate">PCP por Executante</h3>
          </div>
          <div className="space-y-3">
            <PCPBreakdownCard title="" data={pcpData.byExecutor || {}} />
          </div>
        </div>
      </div>

      {/* Causes Count Card */}
      <CausesCountCard tasks={tasks} onCauseSelect={onCauseSelect} />
    </div>
  );
};

export default PCPChart;
