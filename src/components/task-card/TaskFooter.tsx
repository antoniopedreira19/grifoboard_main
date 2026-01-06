
import { Button } from "@/components/ui/button";
import { Copy, Pencil, X, Calendar } from "lucide-react";
import CausesDropdown from "../task/CausesDropdown";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface TaskFooterProps {
  isCompleted: boolean;
  currentCause: string;
  onCauseSelect: (cause: string) => void;
  onCauseRemove?: () => void;
  onEditClick: () => void;
  onDuplicateClick?: () => void;
  onCopyToNextWeek?: () => void;
}

const TaskFooter: React.FC<TaskFooterProps> = ({ 
  isCompleted, 
  currentCause, 
  onCauseSelect,
  onCauseRemove,
  onEditClick,
  onDuplicateClick,
  onCopyToNextWeek 
}) => {
  return (
    <div className="w-full flex justify-between items-center">
      {!isCompleted ? (
        <div className="flex-1 max-w-[65%] relative flex items-center gap-1.5">
          <CausesDropdown 
            onCauseSelect={onCauseSelect}
            currentCause={currentCause}
          />
          {currentCause && onCauseRemove && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCauseRemove}
                    className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 h-6 rounded-md absolute right-1 top-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Remover causa</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ) : (
        <span />
      )}
      
      <div className="flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onCopyToNextWeek} 
                className="text-gray-600 hover:bg-gray-50 p-1.5 h-7 w-7 rounded-md border-gray-200"
              >
                <Calendar className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Copiar para próxima semana</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDuplicateClick} 
                className="text-gray-600 hover:bg-gray-50 p-1.5 h-7 w-7 rounded-md border-gray-200"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Duplicar tarefa</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEditClick} 
          className="text-gray-600 hover:bg-gray-50 text-xs h-7 rounded-md border-gray-200 flex items-center gap-1"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
      </div>
    </div>
  );
};

export default TaskFooter;
