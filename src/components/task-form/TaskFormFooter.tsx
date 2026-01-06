
import { Button } from "@/components/ui/button";

interface TaskFormFooterProps {
  onSubmit: () => void;
  isFormValid: boolean;
}

const TaskFormFooter: React.FC<TaskFormFooterProps> = ({ 
  onSubmit, 
  isFormValid 
}) => {
  return (
    <div className="flex justify-end p-6 sticky bottom-0 bg-background border-t mt-auto">
      <Button onClick={onSubmit} disabled={!isFormValid}>
        Adicionar Tarefa
      </Button>
    </div>
  );
};

export default TaskFormFooter;
