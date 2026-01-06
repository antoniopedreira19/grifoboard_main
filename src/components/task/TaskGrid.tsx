import React, { useState, useEffect } from "react";
import TaskCard from "../TaskCard";
import { Task } from "@/types";
import { ClipboardX, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tarefasService } from "@/services/tarefaService";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskGridProps {
  tasks: Task[];
  onTaskUpdate: (updatedTask: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskDuplicate: (task: Task) => void;
  onCopyToNextWeek: (task: Task) => void;
}

// Props internas do wrapper sortable
interface SortableTaskCardProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onCopy: (task: Task) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, onUpdate, onDelete, onDuplicate, onCopy }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="h-full relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1.5 shadow-md border border-border"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <TaskCard
        task={task}
        // CORREÇÃO: Mapeando os nomes corretamente para o TaskCard
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onCopyToNextWeek={onCopy}
      />
    </div>
  );
};

const TaskGrid: React.FC<TaskGridProps> = ({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskDuplicate,
  onCopyToNextWeek,
}) => {
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(tasks);
  const { toast } = useToast();

  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedTasks.findIndex((item) => item.id === active.id);
      const newIndex = orderedTasks.findIndex((item) => item.id === over.id);

      const newOrderedTasks = arrayMove(orderedTasks, oldIndex, newIndex);
      setOrderedTasks(newOrderedTasks);

      try {
        const ordersToUpdate = newOrderedTasks.map((task, index) => ({
          id: task.id,
          ordem: index,
        }));
        await tarefasService.atualizarOrdens(ordersToUpdate);
      } catch (error) {
        console.error("Erro ao salvar ordenação:", error);
        setOrderedTasks(tasks);
      }
    }
  };

  if (orderedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 rounded-xl bg-white border border-gray-100 shadow-sm">
        <div className="bg-gray-50 p-3 rounded-full mb-4">
          <ClipboardX className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-gray-700 font-medium mb-2">Nenhuma tarefa encontrada</h3>
        <p className="text-gray-500 text-sm text-center max-w-md">Tente ajustar os filtros ou criar uma nova tarefa</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-fr">
          {orderedTasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              // Passando as funções com os nomes que o SortableTaskCard espera
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
              onDuplicate={onTaskDuplicate}
              onCopy={onCopyToNextWeek}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default React.memo(TaskGrid);
