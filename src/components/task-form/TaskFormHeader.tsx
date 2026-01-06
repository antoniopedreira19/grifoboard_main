
import { X } from "lucide-react";
import { DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TaskFormHeader: React.FC = () => {
  return (
    <DialogHeader className="sticky top-0 bg-background z-10 p-6 pb-4 border-b">
      <div className="flex items-center justify-between">
        <DialogTitle className="text-xl font-semibold">Nova Tarefa</DialogTitle>
        <DialogClose className="rounded-full hover:bg-muted w-7 h-7 flex items-center justify-center focus:outline-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </div>
    </DialogHeader>
  );
};

export default TaskFormHeader;
