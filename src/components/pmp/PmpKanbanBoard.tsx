import React, { useState, useCallback, useMemo, useRef } from "react";
import { Plus, User, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { addDays, differenceInCalendarDays } from "date-fns";
import { PmpKanbanCard } from "./PmpKanbanCard";
import { PmpKanbanColumn } from "./PmpKanbanColumn";
import { PmpExportDialog } from "./PmpExportDialog";
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
  weekStartFilter: number;
  weekEndFilter: number;
  onWeekStartFilterChange: (value: number) => void;
  onWeekEndFilterChange: (value: number) => void;
  obraId?: string;
  obraNome?: string;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.5" } },
  }),
};

// Componente memoizado para header de semana
const WeekHeader = React.memo(function WeekHeader({ week, index }: { week: PmpWeek; index: number }) {
  return (
    <div className="flex-shrink-0 w-[280px]">
      <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-foreground text-sm uppercase">
            {week.label}
          </span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
            {week.year}
          </span>
        </div>
        <div className="text-xs text-muted-foreground font-medium capitalize">
          {week.formattedRange}
        </div>
      </div>
    </div>
  );
});

// Componente memoizado para coluna inteira
const WeekColumn = React.memo(function WeekColumn({
  week,
  tasks,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onToggleCheck,
}: {
  week: PmpWeek;
  tasks: PmpAtividade[];
  onOpenAdd: (weekId: string) => void;
  onOpenEdit: (atividade: PmpAtividade) => void;
  onDelete: (id: string) => void;
  onToggleCheck: (id: string, currentStatus: boolean, hasRestrictions: boolean) => void;
}) {
  return (
    <div className="flex-shrink-0 w-[280px] flex flex-col">
      <div className="bg-muted/50 rounded-lg border border-dashed border-border flex flex-col min-h-[380px] relative">
        <div className="p-2 pb-14 space-y-2">
          <PmpKanbanColumn weekId={week.id} tasks={tasks}>
            {tasks.map((atividade) => (
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

        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-muted via-muted to-transparent pt-4">
          <Button
            variant="ghost"
            className="w-full bg-card hover:bg-card/80 shadow-sm border border-border text-muted-foreground text-xs h-8"
            onClick={() => onOpenAdd(week.id)}
          >
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
});

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
  weekStartFilter,
  weekEndFilter,
  onWeekStartFilterChange,
  onWeekEndFilterChange,
  obraId,
  obraNome,
}: PmpKanbanBoardProps) {
  const [activeDragItem, setActiveDragItem] = useState<PmpAtividade | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Weeks filtradas - memoizado
  const filteredWeeks = useMemo(
    () => weeks.slice(weekStartFilter, weekEndFilter + 1),
    [weeks, weekStartFilter, weekEndFilter]
  );

  // Labels para os seletores - memoizado
  const weekLabels = useMemo(() => {
    return weeks.map((week, idx) => ({
      value: String(idx),
      label: `Semana ${String(idx + 1).padStart(2, '0')} (${week.formattedRange})`,
    }));
  }, [weeks]);

  // Pré-calcular tarefas por semana filtrada
  const weekTasksMap = useMemo(() => {
    const map = new Map<string, PmpAtividade[]>();
    filteredWeeks.forEach((week) => {
      map.set(week.id, getTasksForWeek(week.id));
    });
    return map;
  }, [filteredWeeks, getTasksForWeek]);

  return (
    <div className="w-full border border-border rounded-xl bg-card shadow-sm flex-shrink-0 overflow-hidden flex flex-col h-[600px]">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filtrar:</span>
        </div>
        
        <Select value={responsavelFilter} onValueChange={onResponsavelFilterChange}>
          <SelectTrigger className="w-[180px] h-8 text-sm">
            <User className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
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

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">Semanas:</span>
        </div>
        
        <Select 
          value={String(weekStartFilter)} 
          onValueChange={(val) => onWeekStartFilterChange(Number(val))}
        >
          <SelectTrigger className="w-[220px] h-8 text-sm">
            <SelectValue placeholder="Início" />
          </SelectTrigger>
          <SelectContent>
            {weekLabels.map(({ value, label }, idx) => (
              <SelectItem key={value} value={value} disabled={idx > weekEndFilter}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground text-sm">até</span>

        <Select 
          value={String(weekEndFilter)} 
          onValueChange={(val) => onWeekEndFilterChange(Number(val))}
        >
          <SelectTrigger className="w-[220px] h-8 text-sm">
            <SelectValue placeholder="Fim" />
          </SelectTrigger>
          <SelectContent>
            {weekLabels.map(({ value, label }, idx) => (
              <SelectItem key={value} value={value} disabled={idx < weekStartFilter}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(weekStartFilter !== 0 || weekEndFilter !== weeks.length - 1) && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              onWeekStartFilterChange(0);
              onWeekEndFilterChange(weeks.length - 1);
            }}
          >
            Mostrar todas
          </Button>
        )}

        {responsavelFilter !== "todos" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onResponsavelFilterChange("todos")}
          >
            Limpar responsável
          </Button>
        )}

        <div className="h-6 w-px bg-border ml-auto" />

        {obraId && obraNome && (
          <PmpExportDialog
            obraId={obraId}
            obraNome={obraNome}
            weeks={weeks}
            weekStartFilter={weekStartFilter}
            weekEndFilter={weekEndFilter}
          />
        )}
      </div>

      {/* Kanban Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-hidden flex flex-col bg-muted/30">
          {/* Wrapper com scroll nativo (melhor performance que ScrollArea) */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            style={{ 
              // CSS para scroll suave com GPU acceleration
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="min-w-max">
              {/* Headers fixos das semanas */}
              <div className="flex p-4 pb-2 gap-4 sticky top-0 z-20 bg-muted/95 backdrop-blur-sm border-b border-border">
                {filteredWeeks.map((week, idx) => (
                  <WeekHeader key={week.id} week={week} index={idx} />
                ))}
              </div>

              {/* Corpo das colunas com cards */}
              <div className="flex px-4 pb-4 pt-2 gap-4">
                {filteredWeeks.map((week) => (
                  <WeekColumn
                    key={week.id}
                    week={week}
                    tasks={weekTasksMap.get(week.id) || []}
                    onOpenAdd={onOpenAdd}
                    onOpenEdit={onOpenEdit}
                    onDelete={onDelete}
                    onToggleCheck={onToggleCheck}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragItem ? (
            <PmpKanbanCard atividade={activeDragItem} weekId="overlay" isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
});
