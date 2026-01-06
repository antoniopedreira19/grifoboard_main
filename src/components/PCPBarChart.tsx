
import React, { useMemo } from "react";
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChartContainer } from "@/components/ui/chart";
import PCPChartBars from "./chart/PCPChartBars";

interface PCPBarChartProps {
  weeklyData: {
    week: string;
    percentage: number;
    date: Date;
    isCurrentWeek?: boolean;
  }[];
}

const PCPBarChart: React.FC<PCPBarChartProps> = ({ weeklyData }) => {
  // Memoize chart data to prevent recalculations
  const chartData = useMemo(() => 
    weeklyData.map(item => ({
      name: format(item.date, "dd/MM", { locale: ptBR }),
      value: item.percentage,
      isCurrentWeek: item.isCurrentWeek
    })), 
    [weeklyData]
  );

  // Chart colors - all set to the same blue color
  const chartColors = useMemo(() => ({
    standard: "#021C2F",
    highlighted: "#021C2F"
  }), []);

  return (
    <CardContent className="pt-1 px-0">
      <div className="min-h-[220px] h-[220px] w-full">
        <ChartContainer
          config={{
            value: {
              label: "PCP (%)"
            }
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 30, right: 10, left: 0, bottom: 5 }}
              barSize={36}
              barGap={2}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                opacity={0.3}
              />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
              />
              <YAxis
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                tickCount={5}
                width={35}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={() => null} cursor={false} />
              <PCPChartBars chartData={chartData} colors={chartColors} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </CardContent>
  );
};

export default React.memo(PCPBarChart);
