import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Task } from "@/types";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, TrendingDown } from "lucide-react";
interface CausesCountCardProps {
  tasks: Task[];
  onCauseSelect: (cause: string) => void;
}
const CausesCountCard: React.FC<CausesCountCardProps> = ({
  tasks,
  onCauseSelect
}) => {
  // Count occurrences of each cause
  const causeCount: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.causeIfNotDone) {
      causeCount[task.causeIfNotDone] = (causeCount[task.causeIfNotDone] || 0) + 1;
    }
  });

  // Convert to array for sorting
  const causesArray = Object.entries(causeCount).map(([cause, count]) => ({
    cause,
    count
  }));

  // Sort by count (highest to lowest)
  causesArray.sort((a, b) => b.count - a.count);
  if (causesArray.length === 0) {
    return <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/50 shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in">        
        <div className="relative p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 ml-3 truncate">Causas do Não Cumprimento</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-lg font-bold">✓</span>
              </div>
            </div>
            <p className="text-slate-600 text-center font-medium">Nenhuma causa registrada</p>
            <p className="text-slate-500 text-sm text-center">Excelente! Todas as tarefas estão sendo executadas conforme planejado.</p>
          </div>
        </div>
      </div>;
  }
  return <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/50 shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in">      
      <div className="relative p-6">
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 ml-3 truncate">Causas</h3>
        </div>
        
        <ScrollArea className="max-h-[200px] w-full">
          <div className="space-y-1">
            {causesArray.map(({
            cause,
            count
          }, index) => <div key={cause} className="flex items-center justify-between py-2 cursor-pointer hover:bg-slate-50 transition-all duration-200 animate-fade-in" style={{
            animationDelay: `${index * 100}ms`
          }} onClick={() => onCauseSelect(cause)}>
                <span className="text-sm font-medium text-slate-700 flex-1 mr-2 break-words">
                  {cause}
                </span>
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-xs font-bold">{count}</span>
                </div>
              </div>)}
          </div>
        </ScrollArea>
      </div>
    </div>;
};
export default CausesCountCard;