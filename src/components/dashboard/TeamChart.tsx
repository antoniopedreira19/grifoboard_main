import React, { useState, useEffect, useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';
import { calculatePCP } from "@/utils/pcp";
import { Task } from "@/types";
import { BarChart2 } from "lucide-react";
import { capitalizeWords } from "@/lib/utils/formatters";

interface TeamChartProps {
  weekStartDate: Date;
  tasks: Task[];
  analysisMode?: "weekly" | "overall";
}

const TeamChart = ({
  weekStartDate,
  tasks,
  analysisMode = "weekly"
}: TeamChartProps) => {
  // Memoize team data calculation to prevent recalculations
  const teamData = useMemo(() => {
    if (analysisMode === "weekly") {
      const tasksForWeek = tasks;

      // Group tasks by team
      const teamGroups = tasksForWeek.reduce<Record<string, Task[]>>((acc, task) => {
        const team = task.team || 'Não definido';
        if (!acc[team]) {
          acc[team] = [];
        }
        acc[team].push(task);
        return acc;
      }, {});

      // Calculate PCP for each team group
      const data = Object.entries(teamGroups).map(([team, tasks]) => {
        const pcpData = calculatePCP(tasks);
        return {
          name: capitalizeWords(team.toLowerCase()),
          percentual: Math.round(pcpData.overall.percentage)
        };
      });

      // Sort by percentage descending and limit to top 10
      data.sort((a, b) => b.percentual - a.percentual);
      return data.slice(0, 10);
    } else {
      // Overall analysis - average PCP across all weeks
      const weeklyData: Record<string, Record<string, Task[]>> = {};
      
      // Group tasks by week and team
      tasks.forEach(task => {
        const weekKey = task.weekStartDate?.toISOString() || 'unknown';
        const team = task.team || 'Não definido';
        
        if (!weeklyData[team]) {
          weeklyData[team] = {};
        }
        if (!weeklyData[team][weekKey]) {
          weeklyData[team][weekKey] = [];
        }
        weeklyData[team][weekKey].push(task);
      });

      // Calculate average PCP for each team
      const data = Object.entries(weeklyData).map(([team, weeks]) => {
        const weeklyPCPs = Object.values(weeks).map(weekTasks => {
          const pcpData = calculatePCP(weekTasks);
          return pcpData.overall.percentage;
        });
        
        const avgPCP = weeklyPCPs.reduce((sum, pcp) => sum + pcp, 0) / weeklyPCPs.length;
        
        return {
          name: capitalizeWords(team.toLowerCase()),
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
        <h3 className="text-lg font-medium font-heading">PCP por Executante</h3>
      </div>
      
      {teamData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={teamData}
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

export default React.memo(TeamChart);