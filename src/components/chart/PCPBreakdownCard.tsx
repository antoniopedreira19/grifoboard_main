import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PCPData } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { capitalizeWords } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface PCPBreakdownCardProps {
  title: string;
  data: Record<string, PCPData>;
}

const PCPBreakdownCard: React.FC<PCPBreakdownCardProps> = ({ title, data }) => {
  const sortedEntries = data ? Object.entries(data).sort((a, b) => b[1].percentage - a[1].percentage) : [];

  return (
    <>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-heading">{title}</CardTitle>
        </CardHeader>
      )}
      <div>
        <ScrollArea className="h-[200px] w-full">
          <div className="space-y-2 pr-3 pl-1 py-1">
            {sortedEntries.length > 0 &&
              sortedEntries.map(([key, value], index) => (
                <div
                  key={key}
                  // ANIMAÇÃO AQUI: Hover na linha inteira
                  className="group py-2.5 px-3 rounded-lg hover:bg-secondary/5 transition-colors duration-200 animate-fade-in cursor-default"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-700 truncate flex-1 mr-2 group-hover:text-primary transition-colors">
                      {capitalizeWords(key.toLowerCase())}
                    </span>
                    <span className="text-sm font-bold text-slate-800 flex-shrink-0 group-hover:text-secondary transition-colors">
                      {Math.round(value.percentage)}%
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        // ANIMAÇÃO DA BARRA: Gradiente e transição suave
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                          value.percentage >= 100 ? "bg-green-500" : "bg-gradient-to-r from-primary to-secondary",
                        )}
                        style={{ width: `${value.percentage}%` }}
                      >
                        {/* Efeito de brilho passando na barra */}
                        <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium flex-shrink-0 w-12 text-right">
                      {value.completedTasks}/{value.totalTasks}
                    </span>
                  </div>
                </div>
              ))}

            {(!data || Object.keys(data).length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">📊</span>
                </div>
                <p className="text-xs text-slate-500 text-center">Sem dados disponíveis</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default PCPBreakdownCard;
