import { createElement } from "react";
import { Task } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertCircle, User, Users, Wrench } from "lucide-react";
import MaterialsSection from "@/components/materials/MaterialsSection";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  type: "completed" | "pending";
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  tasks,
  type
}) => {
  const isCompleted = type === "completed";
  const title = isCompleted ? "Tarefas Concluídas" : "Tarefas Não Realizadas";
  const icon = isCompleted ? CheckCircle2 : AlertCircle;
  const iconColor = isCompleted ? "text-success" : "text-destructive";
  const badgeVariant = isCompleted ? "default" : "destructive";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {createElement(icon, { className: `w-5 h-5 ${iconColor}` })}
            <span>{title}</span>
            <Badge variant={badgeVariant} className="ml-2">
              {tasks.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] w-full pr-2">
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma tarefa {isCompleted ? "concluída" : "pendente"} encontrada.</p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <div key={task.id} className="space-y-3">
                  <div className="glass-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">
                          {task.description}
                        </h4>
                        <p className="text-sm text-muted-foreground uppercase">
                          {task.sector} • {task.item}
                        </p>
                      </div>
                      <Badge variant={badgeVariant} className="ml-2">
                        {isCompleted ? "Concluída" : "Pendente"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">D</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Disciplina:</span>
                          <p className="font-medium uppercase">{task.discipline}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Responsável:</span>
                          <p className="font-medium uppercase">{task.responsible}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Executante:</span>
                          <p className="font-medium uppercase">{task.team}</p>
                        </div>
                      </div>
                      
                      {task.executor && (
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Encarregado:</span>
                            <p className="font-medium uppercase">{task.executor}</p>
                          </div>
                        </div>
                      )}
                      
                      {!isCompleted && task.causeIfNotDone && (
                        <div className="flex items-center gap-2 md:col-span-2 lg:col-span-3">
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          <div>
                            <span className="text-muted-foreground">Causa:</span>
                            <p className="font-medium text-destructive">{task.causeIfNotDone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!isCompleted && (
                      <MaterialsSection tarefaId={task.id} />
                    )}
                  </div>
                  
                  {index < tasks.length - 1 && <Separator className="my-4" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;