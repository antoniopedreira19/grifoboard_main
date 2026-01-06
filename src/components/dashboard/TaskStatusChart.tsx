
import { Task } from "@/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface TaskStatusChartProps {
  tasks: Task[];
}

const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ tasks }) => {
  // Calculate counts for different task statuses
  const completedCount = tasks.filter(task => task.isFullyCompleted).length;
  // Changed logic: Not completed tasks are all tasks that aren't fully completed
  const notDoneCount = tasks.filter(task => !task.isFullyCompleted).length;
  const plannedCount = tasks.length - completedCount - notDoneCount;
  
  const data = [
    { name: 'Concluídas', value: completedCount },
    { name: 'Não Realizadas', value: notDoneCount }, // Fixed the label from 'Não Feitas' to 'Não Realizadas'
    { name: 'Planejadas', value: plannedCount },
  ];
  
  const COLORS = ['#10b981', '#ef4444', '#021C2F'];
  
  return (
    <ResponsiveContainer width="100%" height={300}>
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
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TaskStatusChart;
