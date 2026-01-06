import React, { useState, useCallback } from "react";
import { Plus, User, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DropAnimation,
  defaultDropAnimationSideEffects,
  DragOverlay,
} from "@dnd-kit/core";
import { parseISO, addDays, differenceInCalendarDays } from "date-fns";
import { PmpKanbanCard } from "./PmpKanbanCard";
import { PmpKanbanColumn } from "./PmpKanbanColumn";
import type { PmpAtividade, PmpWeek } from "@/types/pmp";
import { safeParseDate } from "@/utils/pmpDateUtils";

interface PmpKanbanBoardProps {
  weeks: PmpWeek[];
  getTasksForWeek: (weekId: string) => PmpAtividade[];
  onOpenAdd: (weekId: string) => void;
  onOpenEdit: (atividade: PmpAtividade) => void;
  onDelete: (id: string) => void;
  onToggleCheck: (id: string, currentStatus: boolean, hasRestrictions: boolean) => void;
  onMove: (params: {
    id: string;
    semana_referencia: string;
    data_inicio?: string | null;
    data_termino?: string | null;
    ordem?: number;
  }) => void;
  responsaveis: string[];
  responsavelFilter: string;
  onResponsavelFilterChange: (value: string) => void;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.5" } },
  }),
};

export const PmpKanbanBoard = React.memo(function PmpKanbanBoard({
  weeks,
  getTasksForWeek,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onToggleCheck,
  onMove,
  responsaveis,
  responsavelFilter,
  onResponsavelFilterChange,
}: PmpKanbanBoardProps) {
  const [activeDragItem, setActiveDragItem] = useState<PmpAtividade | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const atividade = event.active.data.current?.atividade as PmpAtividade | undefined;
    if (atividade) {
      setActiveDragItem(atividade);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragItem(null);

      if (!over) return;

      const activeTask = active.data.current?.atividade as PmpAtividade;
      if (!activeTask) return;

      const originWeekId = active.data.current?.originWeekId as string;
      let targetWeekId = "";

      if (over.data.current?.type === "Column") {
        targetWeekId = over.data.current.weekId;
      } else if (over.data.current?.originWeekId) {
        targetWeekId = over.data.current.originWeekId;
      }

      if (!targetWeekId) return;

      let novaOrdem = activeTask.ordem || 0;

      // Se soltou sobre um CARD
      if (over.data.current?.type !== "Column") {
        const overTask = over.data.current?.atividade as PmpAtividade;
        if (overTask) {
          const delta = 500;
          if (activeTask.ordem && overTask.ordem) {
            novaOrdem =
              activeTask.ordem > overTask.ordem
                ? overTask.ordem - delta
                : overTask.ordem + delta;
          } else {
            novaOrdem = (overTask.ordem || 0) + delta;
          }
        }
      } else {
        // Se soltou na COLUNA
        const targetTasks = getTasksForWeek(targetWeekId);
        const maxOrder = targetTasks.reduce((max, t) => Math.max(max, t.ordem || 0), 0);
        novaOrdem = maxOrder + 1000;
      }

      let newDataInicio: string | null = null;
      let newDataTermino: string | null = null;

      if (targetWeekId !== originWeekId) {
        const originDate = safeParseDate(originWeekId);
        const targetDate = safeParseDate(targetWeekId);

        if (originDate && targetDate) {
          const daysDiff = differenceInCalendarDays(targetDate, originDate);

          if (activeTask.data_inicio && activeTask.data_termino) {
            const startDate = safeParseDate(activeTask.data_inicio);
            const endDate = safeParseDate(activeTask.data_termino);

            if (startDate && endDate) {
              newDataInicio = addDays(startDate, daysDiff).toISOString();
              newDataTermino = addDays(endDate, daysDiff).toISOString();
            }
          } else {
            newDataInicio = targetDate.toISOString();
            newDataTermino = addDays(targetDate, 5).toISOString();
          }
        }
      }

      onMove({
        id: activeTask.id,
        semana_referencia: targetWeekId,
        data_inicio: newDataInicio,
        data_termino: newDataTermino,
        ordem: novaOrdem,
      });
    },
    [getTasksForWeek, onMove]
  );

  return (
    <div className="w-full border border-slate-200 rounded-xl bg-white shadow-sm flex-shrink-0 overflow-hidden flex flex-col">
      {/* Barra de filtros */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtrar:</span>
        </div>
        <Select value={responsavelFilter} onValueChange={onResponsavelFilterChange}>
          <SelectTrigger className="w-[200px] h-8 text-sm">
            <User className="h-3.5 w-3.5 mr-2 text-slate-500" />
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os responsáveis</SelectItem>
            {responsaveis.map((resp) => (
              <SelectItem key={resp} value={resp}>
                {resp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {responsavelFilter !== "todos" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-slate-500 hover:text-slate-700"
            onClick={() => onResponsavelFilterChange("todos")}
          >
            Limpar filtro
          </Button>
        )}
      </div>

      {/* Kanban */}
      <div className="h-[520px] flex-1 overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full h-full bg-slate-50/30">
          <div className="flex flex-col h-full min-w-max">
            {/* Headers fixos das semanas */}
            <div className="flex p-4 pb-2 gap-4 sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm">
              {weeks.map((week) => (
                <div
                  key={`header-${week.id}`}
                  className="flex-shrink-0 w-[280px]"
                >
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-800 text-sm uppercase">
                        {week.label}
                      </span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {week.year}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium capitalize">
                      {week.formattedRange}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Corpo das colunas com cards */}
            <div className="flex px-4 pb-4 gap-4 flex-1">
              {weeks.map((week) => {
                const weekTasks = getTasksForWeek(week.id);
                return (
                  <div
                    key={week.id}
                    className="flex-shrink-0 w-[280px] flex flex-col h-full"
                  >
                    {/* Corpo da Coluna */}
                    <div className="bg-slate-100/50 rounded-lg border border-dashed border-slate-200 flex-1 flex flex-col min-h-[400px] overflow-hidden relative">
                      <div className="flex-1 overflow-y-auto p-2 pb-14">
                        <PmpKanbanColumn weekId={week.id} tasks={weekTasks}>
                          {weekTasks.map((atividade) => (
                            <PmpKanbanCard
                              key={`${atividade.id}::${week.id}`}
                              weekId={week.id}
                              atividade={atividade}
                              onDelete={onDelete}
                              onClick={onOpenEdit}
                              onToggleCheck={onToggleCheck}
                            />
                          ))}
                        </PmpKanbanColumn>
                      </div>

                      {/* Botão Adicionar */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-slate-100 via-slate-100 to-transparent pt-4">
                        <Button
                          variant="ghost"
                          className="w-full bg-white hover:bg-white/80 shadow-sm border border-slate-200 text-slate-600 text-xs h-8"
                          onClick={() => onOpenAdd(week.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" className="h-3" />
        </ScrollArea>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragItem ? (
            <PmpKanbanCard atividade={activeDragItem} weekId="overlay" isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
      </div>
    </div>
  );
});
