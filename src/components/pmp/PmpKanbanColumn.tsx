import React, { useMemo } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { PmpAtividade } from "@/types/pmp";

interface PmpKanbanColumnProps {
  weekId: string;
  tasks: PmpAtividade[];
  children: React.ReactNode;
}

export const PmpKanbanColumn = React.memo(function PmpKanbanColumn({
  weekId,
  tasks,
  children,
}: PmpKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: weekId,
    data: { type: "Column", weekId },
  });

  const itemIds = useMemo(
    () => tasks.map((t) => `${t.id}::${weekId}`),
    [tasks, weekId]
  );

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col gap-2 min-h-[50px] transition-colors duration-200
        ${isOver ? "bg-slate-100/50 ring-2 ring-primary/20 rounded-lg" : "bg-transparent"}
      `}
    >
      <SortableContext id={weekId} items={itemIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
});
