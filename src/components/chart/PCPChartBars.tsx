
import React from "react";
import { Bar, Cell, LabelList } from "recharts";

interface PCPChartBarsProps {
  chartData: {
    name: string;
    value: number;
    isCurrentWeek?: boolean;
  }[];
  colors: {
    standard: string;
    highlighted: string;
  };
}

const PCPChartBars: React.FC<PCPChartBarsProps> = ({ chartData, colors }) => {
  return (
      <Bar 
        dataKey="value" 
        radius={[4, 4, 0, 0]} 
        fillOpacity={1}
        isAnimationActive={false}
        name="PCP"
        minPointSize={5}
        fill="#021C2F"
      >
      {chartData.map((entry, index) => (
        <Cell 
          key={`cell-${index}`} 
          fill="#021C2F"
          stroke={entry.isCurrentWeek ? "#0284C7" : ""}
          strokeWidth={entry.isCurrentWeek ? 1 : 0}
        />
      ))}
        <LabelList 
          dataKey="value" 
          position="top" 
          formatter={(value: number) => `${Math.round(value)}%`}
          style={{ fontSize: 11, fill: '#666' }}
        />
    </Bar>
  );
};

export default React.memo(PCPChartBars);
