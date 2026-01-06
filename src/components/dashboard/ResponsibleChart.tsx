import React, { useState, useEffect, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';
import { calculatePCP } from "@/utils/pcp";
import { Task } from "@/types";
import { BarChart2 } from "lucide-react";
import { capitalizeWords } from "@/lib/utils/formatters";

interface ResponsibleChartProps {
  weekStartDate: Date;
  tasks: Task[];
  analysisMode?: "weekly" | "overall";
}

const ResponsibleChart = ({
  weekStartDate,
  tasks,
  analysisMode = "weekly"
}: ResponsibleChartProps) => {
  // Memoize responsible data calculation to prevent recalculations
  const responsibleData = useMemo(() => {
    if (analysisMode === "weekly") {
      const tasksForWeek = tasks;

      // Group tasks by responsible
      const responsibleGroups = tasksForWeek.reduce<Record<string, Task[]>>((acc, task) => {
        const responsible = task.responsible || 'Não definido';
        if (!acc[responsible]) {
          acc[responsible] = [];
        }
        acc[responsible].push(task);
        return acc;
      }, {});

      // Calculate PCP for each responsible group
      const data = Object.entries(responsibleGroups).map(([responsible, tasks]) => {
        const pcpData = calculatePCP(tasks);
        return {
          name: capitalizeWords(responsible.toLowerCase()),
          percentual: Math.round(pcpData.overall.percentage)
        };
      });

      // Sort by percentage descending and limit to top 10
      data.sort((a, b) => b.percentual - a.percentual);
      return data.slice(0, 10);
    } else {
      // Overall analysis - average PCP across all weeks
      const weeklyData: Record<string, Record<string, Task[]>> = {};
      
      // Group tasks by week and responsible
      tasks.forEach(task => {
        const weekKey = task.weekStartDate?.toISOString() || 'unknown';
        const responsible = task.responsible || 'Não definido';
        
        if (!weeklyData[responsible]) {
          weeklyData[responsible] = {};
        }
        if (!weeklyData[responsible][weekKey]) {
          weeklyData[responsible][weekKey] = [];
        }
        weeklyData[responsible][weekKey].push(task);
      });

      // Calculate average PCP for each responsible
      const data = Object.entries(weeklyData).map(([responsible, weeks]) => {
        const weeklyPCPs = Object.values(weeks).map(weekTasks => {
          const pcpData = calculatePCP(weekTasks);
          return pcpData.overall.percentage;
        });
        
        const avgPCP = weeklyPCPs.reduce((sum, pcp) => sum + pcp, 0) / weeklyPCPs.length;
        
        return {
          name: capitalizeWords(responsible.toLowerCase()),
          percentual: Math.round(avgPCP)
        };
      });

      // Sort by percentage descending and limit to top 10
      data.sort((a, b) => b.percentual - a.percentual);
      return data.slice(0, 10);
    }
  }, [tasks, analysisMode]);

  return (
    <div className="w-full min-h-[380px] h-[380px] border border-gray-200 rounded-lg p-4">
      <div className="flex items-center mb-4">
        <BarChart2 className="h-5 w-5 mr-2 text-primary" />
        <h3 className="text-lg font-medium font-heading">PCP por Responsável</h3>
      </div>
      
      {responsibleData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={responsibleData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              tickFormatter={value => `${value}%`}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip formatter={value => [`${value}%`, 'PCP']} />
            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
            <Bar 
              dataKey="percentual" 
              fill="#021C2F" 
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            >
              <LabelList 
                dataKey="percentual" 
                position="right" 
                formatter={(value: number) => `${Math.round(value)}%`}
                style={{ fontSize: 11, fill: '#64748b' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center text-gray-400">
          Sem dados disponíveis para esta semana
        </div>
      )}
    </div>
  );
};

export default React.memo(ResponsibleChart);