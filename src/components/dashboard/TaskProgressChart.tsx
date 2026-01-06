
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from "recharts";

interface TaskProgressChartProps {
  pcpData: any;
}

const TaskProgressChart: React.FC<TaskProgressChartProps> = ({ pcpData }) => {
  // If pcpData is not available or doesn't have disciplines, show empty state
  if (!pcpData || !pcpData.disciplines || pcpData.disciplines.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        Sem dados disponíveis
      </div>
    );
  }
  
  // Transform PCP data for the chart
  const chartData = pcpData.disciplines.map((discipline: any) => ({
    name: discipline.name,
    Planejado: 100,
    Executado: discipline.percentage,
  }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{
          top: 30,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(tick) => `${tick}%`} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend />
        <Bar dataKey="Planejado" fill="#e2e8f0" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList 
            dataKey="Planejado" 
            position="top" 
            formatter={(value: number) => `${value}%`}
            style={{ fontSize: 11, fill: '#64748b' }}
          />
        </Bar>
        <Bar dataKey="Executado" fill="#0c4a6e" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList 
            dataKey="Executado" 
            position="top" 
            formatter={(value: number) => `${Math.round(value)}%`}
            style={{ fontSize: 11, fill: '#64748b' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(TaskProgressChart);
