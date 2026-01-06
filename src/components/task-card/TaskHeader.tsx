
import { Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleX } from "lucide-react";

interface TaskHeaderProps {
  task: Task;
  onCompletionStatusChange: () => void;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({ task, onCompletionStatusChange }) => {
  return (
    <div className="flex justify-between items-start gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-800 mb-0.5 text-xs leading-tight line-clamp-2">
          {task.description}
        </h3>
        <p className="text-[11px] text-gray-500 line-clamp-1">
          {task.item}
        </p>
      </div>
      
      {task.isFullyCompleted ? (
        <Badge 
          className="shrink-0 cursor-pointer px-1.5 py-0.5 h-5 bg-green-100 hover:bg-green-200 text-green-700 border-green-200 flex items-center gap-1 whitespace-nowrap text-[10px]"
          variant="outline"
          onClick={onCompletionStatusChange}
        >
          <CheckCircle2 className="h-3 w-3" />
          Concluída
        </Badge>
      ) : (
        <Badge 
          className="shrink-0 cursor-pointer px-1.5 py-0.5 h-5 bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200 flex items-center gap-1 whitespace-nowrap text-[10px]"
          variant="outline"
          onClick={onCompletionStatusChange}
        >
          <CircleX className="h-3 w-3" />
          Não Concluída
        </Badge>
      )}
    </div>
  );
};

export default TaskHeader;
