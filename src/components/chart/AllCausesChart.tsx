import React, { useState, useEffect, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AllCausesChartProps {
  className?: string;
}

interface CauseData {
  causa: string;
  quantidade: number;
  participacao: number;
  isCritica: boolean;
}

const criticalCauses = [
  "Projeto",
  "Planejamento/Sequenciamento",
  "Suprimentos/Compras",
  "Logística/Entrega",
  "Equipamento",
];

const AllCausesChart: React.FC<AllCausesChartProps> = ({ className }) => {
  const [causesData, setCausesData] = useState<CauseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userSession } = useAuth();

  useEffect(() => {
    const obraId = userSession?.obraAtiva?.id;
    if (!obraId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAllCauses = async () => {
      try {
        const { data, error } = await supabase
          .from('tarefas')
          .select('causa_nao_execucao')
          .eq('obra_id', obraId)
          .not('causa_nao_execucao', 'is', null);

        if (error || !isMounted) {
          if (error) console.error("Erro ao buscar causas:", error);
          if (isMounted) setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const causeCounts: Record<string, number> = {};
          data.forEach(task => {
            const cause = task.causa_nao_execucao;
            if (cause) {
              causeCounts[cause] = (causeCounts[cause] || 0) + 1;
            }
          });

          const totalCauses = Object.values(causeCounts).reduce((sum, count) => sum + count, 0);

          const processedData: CauseData[] = Object.entries(causeCounts)
            .map(([causa, quantidade]) => ({
              causa,
              quantidade,
              participacao: totalCauses > 0 ? (quantidade / totalCauses) * 100 : 0,
              isCritica: criticalCauses.some(c => causa.includes(c)),
            }))
            .sort((a, b) => b.quantidade - a.quantidade);

          setCausesData(processedData);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Erro ao calcular causas:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllCauses();

    return () => {
      isMounted = false;
    };
  }, [userSession?.obraAtiva?.id]);

  const totalOccurrences = useMemo(() => 
    causesData.reduce((sum, c) => sum + c.quantidade, 0),
    [causesData]
  );

  return (
    <div className={cn("h-full p-6 rounded-2xl", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
          <AlertTriangle className="h-5 w-5 text-secondary" />
          Principais Causas
        </h3>
        <Badge variant="outline">
          {totalOccurrences} ocorrências
        </Badge>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Carregando...</p>
          </div>
        ) : causesData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma causa registrada</p>
          </div>
        ) : (
          causesData.map((item, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border transition-all duration-200 hover:scale-[1.01] hover:shadow-sm",
                item.isCritica
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-background",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium text-sm text-primary truncate">{item.causa}</span>
                  {item.isCritica && (
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5 shrink-0">
                      Crítica
                    </Badge>
                  )}
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary">{item.quantidade}x</span>
                    <span className="text-xs text-muted-foreground font-medium min-w-[45px] text-right">
                      {item.participacao.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    item.isCritica ? "bg-destructive" : "bg-secondary"
                  )}
                  style={{ width: `${item.participacao}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(AllCausesChart);
