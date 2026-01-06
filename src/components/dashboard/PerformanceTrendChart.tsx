
import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { format, isValid, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface PerformanceTrendChartProps {
  weeklyPCPData?: any[];
}

const PerformanceTrendChart: React.FC<PerformanceTrendChartProps> = () => {
  const [chartData, setChartData] = useState<any[]>([]);
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
      
      const { data, error } = await supabase
        .from('resumo_execucao_semanal')
        .select('semana, percentual_concluido')
        .eq('obra_id', obraId)
        .order('semana', { ascending: true });
      
      if (error) {
        setIsLoading(false);
        return;
      }
      
      if (data && data.length > 0) {
        const formattedData = data.map((item, index) => {
          // Converter string para data e obter a segunda-feira
          let date = null;
          if (item.semana) {
            // Parse a string para objeto Date
            const parsedDate = typeof item.semana === 'string' 
              ? parseISO(item.semana) 
              : new Date(item.semana);
              
            if (isValid(parsedDate)) {
              // Garantir que a data seja a segunda-feira da semana
              date = startOfWeek(parsedDate, { weekStartsOn: 1 });
            }
          }
          
          const formattedDate = date && isValid(date)
            ? format(date, "dd/MM", { locale: ptBR })
            : `Semana ${index + 1}`;
            
          return {
            name: formattedDate,
            // Multiplicar o percentual por 100 para exibir como porcentagem
            value: (item.percentual_concluido || 0) * 100,
            isCurrentWeek: index === data.length - 1 // Assume que o último é a semana atual
          };
        });
        
        setChartData(formattedData);
      } else {
        setChartData([]);
      }
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando dados...</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  // Atualizado para usar #021C2F para todas as barras
  const barColors = {
    normal: "#021C2F",
    current: "#021C2F"
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={chartData} 
        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
        barSize={40}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <YAxis 
          tickFormatter={(value) => `${value}%`}
          domain={[0, 100]}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          formatter={(value) => [`${value}%`, 'Progresso']}
          labelFormatter={(name) => `Semana: ${name}`}
        />
        <Bar 
          dataKey="value" 
          name="Progresso Semanal" 
          radius={[4, 4, 0, 0]}
          fill="#021C2F"
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill="#021C2F"
              stroke={entry.isCurrentWeek ? "#0369a1" : ""}
              strokeWidth={entry.isCurrentWeek ? 1 : 0}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PerformanceTrendChart;
