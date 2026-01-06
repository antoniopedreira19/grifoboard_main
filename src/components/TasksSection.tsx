import { Task } from "@/types";
import TaskList from "@/components/TaskList";
import { ClipboardList, LayoutList, SlidersHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface TasksSectionProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskUpdate: (updatedTask: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskDuplicate: (task: Task) => void;
  onCopyToNextWeek: (task: Task) => void;
  selectedCause: string | null;
  sortBy: "none" | "sector" | "executor" | "discipline";
  onSortChange: (sortBy: "none" | "sector" | "executor" | "discipline") => void;
}

const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  isLoading,
  onTaskUpdate,
  onTaskDelete,
  onTaskDuplicate,
  onCopyToNextWeek,
  selectedCause,
  sortBy,
  onSortChange,
}) => {
  const completedCount = tasks.filter((t) => t.isFullyCompleted).length;

  return (
    <div className="space-y-6">
      {/* Barra de Ferramentas da Lista */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-secondary/10 p-2 rounded-lg">
            <ClipboardList className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-primary">Cronograma de Atividades</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                {completedCount} Concluídas
              </Badge>
              <span>de {tasks.length} totais</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600 font-medium">Agrupar:</span>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-[140px] h-8 border-none bg-transparent focus:ring-0 px-1 text-primary font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-border shadow-lg">
                <SelectItem value="none">Sem grupo</SelectItem>
                <SelectItem value="sector">Por Setor</SelectItem>
                <SelectItem value="executor">Por Executante</SelectItem>
                <SelectItem value="discipline">Por Disciplina</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de Tarefas (Task List gerencia o D&D internamente se houver) */}
      {isLoading && tasks.length === 0 ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onTaskUpdate={onTaskUpdate}
          onTaskDelete={onTaskDelete}
          onTaskDuplicate={onTaskDuplicate}
          onCopyToNextWeek={onCopyToNextWeek}
          selectedCause={selectedCause}
          sortBy={sortBy}
          onSortChange={onSortChange}
        />
      )}
    </div>
  );
};

export default TasksSection;
