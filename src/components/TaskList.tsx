
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Task } from "@/types";
import TaskFilters from "./task/TaskFilters";
import TaskGrid from "./task/TaskGrid";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle2 } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (updatedTask: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskDuplicate: (task: Task) => void;
  onCopyToNextWeek: (task: Task) => void;
  selectedCause: string | null;
  sortBy: "none" | "sector" | "executor" | "discipline";
  onSortChange: (sortBy: "none" | "sector" | "executor" | "discipline") => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskDuplicate,
  onCopyToNextWeek,
  selectedCause,
  sortBy,
  onSortChange
}) => {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);
  const { toast } = useToast();
  
  // Memoize tasksAfterCauseFilter to avoid recalculating on every render
  const tasksAfterCauseFilter = useMemo(() => {
    return selectedCause
      ? tasks.filter(task => task.causeIfNotDone === selectedCause)
      : tasks;
  }, [tasks, selectedCause]);
  
  // Memoize handleTaskUpdate to maintain reference stability
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    onTaskUpdate(updatedTask);
    
    if (updatedTask.isFullyCompleted) {
      toast({
        title: "Tarefa concluída",
        description: updatedTask.description,
      });
    }
  }, [onTaskUpdate, toast]);

  // Memoize setFilteredTasks callback for TaskFilters
  const handleFiltersChange = useCallback((filtered: Task[]) => {
    setFilteredTasks(filtered);
  }, []);

  useEffect(() => {
    setFilteredTasks(tasksAfterCauseFilter);
  }, [tasksAfterCauseFilter]);

  return (
    <div className="w-full space-y-6">
      <div className="glass-card p-5 rounded-xl shadow-sm">
        <TaskFilters 
          tasks={tasksAfterCauseFilter} 
          onFiltersChange={handleFiltersChange}
          selectedCause={selectedCause}
          sortBy={sortBy}
          onSortChange={onSortChange}
        />
      </div>
      
      {selectedCause && (
        <Alert variant="success" className="flex items-center mb-2">
          <CheckCircle2 className="h-4 w-4" />
          <div>
            <AlertTitle className="text-sm">Filtro por causa ativo</AlertTitle>
            <AlertDescription className="text-xs">
              Exibindo tarefas com a causa: <span className="font-medium">{selectedCause}</span>
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      <TaskGrid 
        tasks={filteredTasks} 
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={onTaskDelete}
        onTaskDuplicate={onTaskDuplicate}
        onCopyToNextWeek={onCopyToNextWeek}
      />
    </div>
  );
};

export default React.memo(TaskList);
