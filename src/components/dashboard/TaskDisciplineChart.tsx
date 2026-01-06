
import { Task } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";

interface TaskDisciplineChartProps {
  tasks: Task[];
}

const TaskDisciplineChart: React.FC<TaskDisciplineChartProps> = ({ tasks }) => {
  // Group tasks by discipline
  const disciplineMap = tasks.reduce<{[key: string]: number}>((acc, task) => {
    const discipline = task.discipline || "Sem disciplina";
    acc[discipline] = (acc[discipline] || 0) + 1;
    return acc;
  }, {});
  
  // Transform into chart data format and sort by value (count) descending
  const data = Object.entries(disciplineMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  // Colors for different disciplines
  const COLORS = [
    '#0c4a6e', '#10b981', '#3b82f6', '#ef4444', 
    '#8b5cf6', '#ec4899', '#f59e0b', '#84cc16'
  ];
  
  return (
    <Card className="shadow-sm border border-gray-100/40">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-primary" />
          <CardTitle className="text-lg font-heading">Tarefas por Disciplina</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} tarefas`, undefined]} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TaskDisciplineChart;
