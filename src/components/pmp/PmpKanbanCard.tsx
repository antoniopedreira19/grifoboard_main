import React, { useMemo, memo } from "react";
import { GripVertical, CheckCircle2, Circle, Trash2, AlertCircle, AlertTriangle, User, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PmpAtividade } from "@/types/pmp";
import { safeDateRangeDisplay, isDateOverdue } from "@/utils/pmpDateUtils";

interface PmpKanbanCardProps {
  atividade: PmpAtividade;
  weekId: string;
  onDelete?: (id: string) => void;
  onToggleCheck?: (id: string, currentStatus: boolean, hasRestrictions: boolean) => void;
  onClick?: (atividade: PmpAtividade) => void;
  isOverlay?: boolean;
}

const POSTIT_COLORS_MAP: Record<string, { border: string; ring: string }> = {
  yellow: { border: "border-l-yellow-400", ring: "ring-yellow-400" },
  green: { border: "border-l-emerald-500", ring: "ring-emerald-500" },
  blue: { border: "border-l-blue-500", ring: "ring-blue-500" },
  red: { border: "border-l-red-500", ring: "ring-red-500" },
  purple: { border: "border-l-purple-500", ring: "ring-purple-500" },
  orange: { border: "border-l-orange-500", ring: "ring-orange-500" },
  pink: { border: "border-l-pink-500", ring: "ring-pink-500" },
  cyan: { border: "border-l-cyan-500", ring: "ring-cyan-500" },
  lime: { border: "border-l-lime-500", ring: "ring-lime-500" },
  indigo: { border: "border-l-indigo-500", ring: "ring-indigo-500" },
  amber: { border: "border-l-amber-500", ring: "ring-amber-500" },
  teal: { border: "border-l-teal-500", ring: "ring-teal-500" },
};

// Componente para badges - memoizado separadamente
const CardBadges = memo(function CardBadges({ 
  isCompleted, 
  isDelayed, 
  hasRestrictions, 
  restricoesPendentes 
}: { 
  isCompleted: boolean; 
  isDelayed: boolean; 
  hasRestrictions: boolean; 
  restricoesPendentes: number;
}) {
  if (!isCompleted && !isDelayed && !hasRestrictions) return null;
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {isCompleted && (
        <Badge
          variant="outline"
          className="text-[9px] h-4 bg-green-50 text-green-700 border-green-200 px-1.5 font-bold"
        >
          CONCLUÍDO
        </Badge>
      )}
      {isDelayed && (
        <Badge variant="destructive" className="text-[9px] h-4 px-1.5 font-bold flex items-center gap-1">
          <AlertCircle className="h-2 w-2" /> ATRASADO
        </Badge>
      )}
      {hasRestrictions && !isCompleted && (
        <Badge
          variant="outline"
          className="text-[9px] h-4 px-1.5 font-bold flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200"
        >
          <AlertTriangle className="h-2 w-2" /> {restricoesPendentes} RESTRIÇÕES
        </Badge>
      )}
    </div>
  );
});

// Componente para footer do card - memoizado
const CardFooter = memo(function CardFooter({ 
  dateDisplay, 
  isDelayed, 
  setor, 
  responsavel 
}: { 
  dateDisplay: string | null; 
  isDelayed: boolean; 
  setor?: string | null; 
  responsavel?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-100/50">
      {dateDisplay && (
        <div className="flex items-center gap-2 text-[10px]">
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
              isDelayed ? "bg-red-50 text-red-600 font-medium" : "bg-slate-100 text-slate-600"
            }`}
          >
            <CalendarIcon className="h-3 w-3" />
            <span>{dateDisplay}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {setor ? (
          <div className="flex items-center gap-1 text-[10px] text-slate-600 font-medium bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded max-w-[50%]">
            <MapPin className="h-3 w-3 flex-shrink-0 text-slate-400" />
            <span className="truncate" title={setor}>
              {setor}
            </span>
          </div>
        ) : (
          <div />
        )}

        {responsavel && (
          <div className="flex items-center gap-1 text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded max-w-[50%] ml-auto">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate" title={responsavel}>
              {responsavel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export const PmpKanbanCard = memo(function PmpKanbanCard({
  atividade,
  weekId,
  onDelete,
  onToggleCheck,
  onClick,
  isOverlay = false,
}: PmpKanbanCardProps) {
  const uniqueDragId = `${atividade.id}::${weekId}`;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: uniqueDragId,
    data: { atividade, originWeekId: weekId },
    disabled: isOverlay,
  });

  const style = useMemo(() => ({
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }), [transform, transition, isDragging]);

  const isCompleted = atividade.concluido;
  const restricoesPendentes = useMemo(
    () => atividade.pmp_restricoes?.filter((r) => !r.resolvido).length || 0,
    [atividade.pmp_restricoes]
  );
  const hasRestrictions = restricoesPendentes > 0;

  const isDelayed = useMemo(() => {
    if (isCompleted) return false;
    return isDateOverdue(atividade.data_termino);
  }, [isCompleted, atividade.data_termino]);

  const dateDisplay = useMemo(() => {
    return safeDateRangeDisplay(atividade.data_inicio, atividade.data_termino);
  }, [atividade.data_inicio, atividade.data_termino]);

  const colorStyles = POSTIT_COLORS_MAP[atividade.cor] || POSTIT_COLORS_MAP.yellow;

  const cardClasses = useMemo(() => `
    relative group select-none p-3 rounded-md 
    border border-slate-200 border-l-[4px] 
    ${isDelayed ? "border-l-red-600 bg-red-50/50" : colorStyles.border} 
    ${isCompleted ? "opacity-75 bg-slate-50 border-l-slate-300" : "bg-white"}
    shadow-sm hover:shadow-md transition-shadow
    flex flex-col gap-2 cursor-grab active:cursor-grabbing
  `, [isDelayed, colorStyles.border, isCompleted]);

  if (isOverlay) {
    return (
      <div className={`${cardClasses} w-[280px] z-[9999] rotate-2 scale-105 shadow-xl bg-white cursor-grabbing`}>
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-slate-400 mt-0.5" />
          <p className="text-sm font-medium text-slate-700 leading-snug">{atividade.titulo}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(atividade)}
      className={cardClasses}
    >
      <div className="flex items-start gap-2">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onToggleCheck?.(atividade.id, !!isCompleted, hasRestrictions);
          }}
          className={`mt-0.5 transition-colors ${
            isCompleted
              ? "text-green-500"
              : hasRestrictions
                ? "text-slate-300 cursor-not-allowed"
                : isDelayed
                  ? "text-red-500"
                  : "text-slate-300 hover:text-slate-400"
          }`}
        >
          {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium leading-snug break-words ${
              isCompleted ? "text-slate-500 line-through decoration-slate-400" : "text-slate-700"
            }`}
          >
            {atividade.titulo}
          </p>

          <CardBadges 
            isCompleted={!!isCompleted}
            isDelayed={isDelayed}
            hasRestrictions={hasRestrictions}
            restricoesPendentes={restricoesPendentes}
          />
        </div>

        <div className="mt-0.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      <CardFooter 
        dateDisplay={dateDisplay}
        isDelayed={isDelayed}
        setor={atividade.setor}
        responsavel={atividade.responsavel}
      />

      {onDelete && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(atividade.id);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders desnecessários
  return (
    prevProps.atividade.id === nextProps.atividade.id &&
    prevProps.atividade.titulo === nextProps.atividade.titulo &&
    prevProps.atividade.concluido === nextProps.atividade.concluido &&
    prevProps.atividade.cor === nextProps.atividade.cor &&
    prevProps.atividade.data_inicio === nextProps.atividade.data_inicio &&
    prevProps.atividade.data_termino === nextProps.atividade.data_termino &&
    prevProps.atividade.setor === nextProps.atividade.setor &&
    prevProps.atividade.responsavel === nextProps.atividade.responsavel &&
    prevProps.atividade.pmp_restricoes?.length === nextProps.atividade.pmp_restricoes?.length &&
    prevProps.weekId === nextProps.weekId &&
    prevProps.isOverlay === nextProps.isOverlay
  );
});
