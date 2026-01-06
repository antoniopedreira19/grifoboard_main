import { Task } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditTaskForm from "./EditTaskForm";
import { Edit, X } from "lucide-react";
import { useTaskEditForm } from "./useTaskEditForm";
import { Button } from "@/components/ui/button";

export interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onUpdate: (updatedTask: Task) => void;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({ isOpen, onOpenChange, task, onUpdate }) => {
  const { editFormData, handleEditFormChange, handleDayToggle, handleSave, isFormValid, handleWeekDateChange } =
    useTaskEditForm(task, (updatedTask) => {
      onUpdate(updatedTask);
      onOpenChange(false);
    });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
        {/* Header Fixo */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-heading font-bold text-primary">Editar Tarefa</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Atualize as informações e o planejamento</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Corpo Flexível (O Form agora vai rolar aqui dentro) */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <EditTaskForm
            task={task}
            editFormData={editFormData}
            onEditFormChange={handleEditFormChange}
            onDayToggle={handleDayToggle}
            onDelete={() => {}}
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            isFormValid={isFormValid}
            onWeekDateChange={handleWeekDateChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog;
