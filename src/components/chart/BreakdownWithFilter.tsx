import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BreakdownWithFilterProps {
  className?: string;
}

interface BreakdownData {
  name: string;
  total: number;
  completed: number;
  percentage: number;
}

const getPercentageColor = (pct: number) => {
  if (pct >= 85) return "text-green-600 bg-green-500";
  if (pct >= 70) return "text-amber-600 bg-amber-500";
  return "text-red-600 bg-red-500";
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const BreakdownWithFilter: React.FC<BreakdownWithFilterProps> = ({ className }) => {
  const [filterBy, setFilterBy] = useState<"sector" | "discipline">("sector");
  const [breakdownData, setBreakdownData] = useState<BreakdownData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userSession } = useAuth();

  useEffect(() => {
    const obraId = userSession?.obraAtiva?.id;
    if (!obraId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchBreakdownData = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('tarefas')
          .select('setor, disciplina, percentual_executado')
          .eq('obra_id', obraId);

        if (error || !isMounted) {
          if (error) console.error("Erro ao buscar dados:", error);
          if (isMounted) setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const stats: Record<string, { total: number; completed: number }> = {};
          const field = filterBy === "sector" ? "setor" : "disciplina";

          data.forEach(task => {
            const key = task[field] || 'Não definido';
            if (!stats[key]) {
              stats[key] = { total: 0, completed: 0 };
            }

            stats[key].total++;
            if (task.percentual_executado === 1) {
              stats[key].completed++;
            }
          });

          const processedData: BreakdownData[] = Object.entries(stats)
            .filter(([_, s]) => s.total > 0)
            .map(([name, s]) => ({
              name,
              total: s.total,
              completed: s.completed,
              percentage: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
            }))
            .sort((a, b) => b.percentage - a.percentage);

          setBreakdownData(processedData);
        } else {
          setBreakdownData([]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Erro ao calcular breakdown:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBreakdownData();

    return () => {
      isMounted = false;
    };
  }, [userSession?.obraAtiva?.id, filterBy]);

  const title = useMemo(() => 
    filterBy === "sector" ? "Detalhamento por Setor" : "Detalhamento por Disciplina",
    [filterBy]
  );

  const handleFilterChange = useCallback((value: "sector" | "discipline") => {
    setFilterBy(value);
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-primary font-heading">{title}</CardTitle>
        <Select value={filterBy} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Filtrar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sector">Por Setor</SelectItem>
            <SelectItem value="discipline">Por Disciplina</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-2 pr-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground animate-pulse">
                Carregando...
              </div>
            ) : breakdownData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado encontrado
              </div>
            ) : (
              breakdownData.map((item, index) => {
                const colorClasses = getPercentageColor(item.percentage);
                return (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-border bg-background transition-all duration-200 hover:scale-[1.01] hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-primary truncate uppercase">
                        {capitalize(item.name)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {item.completed}/{item.total}
                        </span>
                        <span className={cn("font-bold text-sm", colorClasses.split(' ')[0])}>
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", colorClasses.split(' ')[1])}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default React.memo(BreakdownWithFilter);
