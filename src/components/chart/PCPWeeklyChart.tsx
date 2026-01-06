import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
  Tooltip,
} from "recharts";
import { format, isValid, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { TrendingUp } from "lucide-react";

interface PCPWeeklyChartProps {
  barColor?: string;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-border/50 shadow-xl rounded-xl">
        <p className="text-sm font-semibold text-primary mb-1">{label}</p>
        <p className="text-sm text-secondary font-bold">{`Progresso: ${Math.round(payload[0].value)}%`}</p>
      </div>
    );
  }
  return null;
};

const PCPWeeklyChart: React.FC<PCPWeeklyChartProps> = ({ barColor = "#021C2F" }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [averagePCP, setAveragePCP] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { userSession } = useAuth();
  const obraId = userSession?.obraAtiva?.id;

  useEffect(() => {
    fetchResumoExecucaoData();
  }, [obraId]);

  const fetchResumoExecucaoData = async () => {
    if (!obraId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get current week start date
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const currentWeekISO = format(currentWeekStart, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from("resumo_execucao_semanal")
        .select("semana, percentual_concluido")
        .eq("obra_id", obraId)
        .lte("semana", currentWeekISO)
        .order("semana", { ascending: true });

      if (error) {
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const formattedData = data.map((item, index) => {
          let formattedLabel = `Semana ${index + 1}`;
          if (item.semana) {
            const parsedDate = typeof item.semana === "string" ? parseISO(item.semana) : new Date(item.semana);
            if (isValid(parsedDate)) {
              const date = startOfWeek(parsedDate, { weekStartsOn: 1 });
              formattedLabel = format(date, "dd/MM", { locale: ptBR });
            }
          }
          return {
            name: formattedLabel,
            value: (item.percentual_concluido || 0) * 100,
          };
        });
        setChartData(formattedData);

        // Calculate average
        const sum = data.reduce((acc, item) => acc + (item.percentual_concluido || 0), 0);
        const avg = (sum / data.length) * 100;
        setAveragePCP(Math.round(avg));
      } else {
        setChartData([]);
        setAveragePCP(0);
      }
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  const getAverageColor = (pcp: number) => {
    if (pcp >= 85) return "bg-green-500";
    if (pcp >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  if (isLoading)
    return <div className="flex justify-center h-64 items-center text-gray-500 animate-pulse">Carregando...</div>;
  if (chartData.length === 0)
    return <div className="flex justify-center h-64 items-center text-gray-500">Sem dados</div>;

  return (
    <div className="relative">
      {/* Badge de média animado */}
      <div className="absolute top-0 right-0 z-10">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${getAverageColor(averagePCP)} text-white shadow-lg animate-pulse`}>
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-bold">Média: {averagePCP}%</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 5 }} barSize={40}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} interval={0} />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
          <Bar
            dataKey="value"
            name="Progresso"
            radius={[6, 6, 0, 0]}
            fill={barColor}
            animationDuration={1500}
            animationEasing="ease-out"
          >
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v: number) => `${Math.round(v)}%`}
              style={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PCPWeeklyChart;
