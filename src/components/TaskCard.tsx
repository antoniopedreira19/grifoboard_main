import { Task, DayOfWeek, TaskStatus } from "@/types";
import {
  MoreHorizontal,
  Copy,
  Trash2,
  ArrowRightCircle,
  Package,
  ChevronDown,
  Edit,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Ban,
} from "lucide-react";
import { standardCauses } from "@/utils/standardCauses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";
import { cn } from "@/lib/utils";
import EditTaskDialog from "./task-card/EditTaskDialog";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onUpdate: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: Task) => void;
  onCopyToNextWeek: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete, onDuplicate, onCopyToNextWeek }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState("");
  // Estado local para materiais (simulação visual até backend específico)
  const [materials, setMaterials] = useState<string[]>([]);

  const isDone = task.isFullyCompleted;
  const hasIssue = !!task.causeIfNotDone;

  // Cores de Status Visual
  const statusColor = isDone ? "bg-green-500" : hasIssue ? "bg-red-500" : "bg-secondary"; // Dourado (Em andamento)

  const days: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const dayLabels = { mon: "Seg", tue: "Ter", wed: "Qua", thu: "Qui", fri: "Sex", sat: "Sáb", sun: "Dom" };

  // Helper para obter o status atual de um dia
  const getDailyStatus = (day: DayOfWeek): TaskStatus => {
    return task.dailyStatus?.find((s) => s.day === day)?.status || "planned";
  };

  // Clique no dia (Ciclo: Planejado -> Concluído -> Não Concluído -> Planejado)
  const handleDayClick = (day: DayOfWeek, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.plannedDays.includes(day)) return;

    const currentStatus = getDailyStatus(day);
    let newStatus: TaskStatus = "planned";

    if (currentStatus === "planned") newStatus = "completed";
    else if (currentStatus === "completed") newStatus = "not_done";
    else if (currentStatus === "not_done") newStatus = "planned";

    const newDailyStatus = task.dailyStatus?.filter((s) => s.day !== day) || [];
    if (newStatus !== "planned") {
      newDailyStatus.push({ day, status: newStatus });
    }

    // Sugestão automática: se todos os dias estiverem completos, sugere marcar a tarefa como completa
    const allPlannedAreCompleted = task.plannedDays.every((d) => {
      const s = d === day ? newStatus : getDailyStatus(d);
      return s === "completed";
    });

    onUpdate({
      ...task,
      dailyStatus: newDailyStatus,
      // Opcional: Descomente abaixo se quiser que complete a tarefa automaticamente ao completar todos os dias
      // isFullyCompleted: allPlannedAreCompleted ? true : task.isFullyCompleted,
      // causeIfNotDone: allPlannedAreCompleted ? undefined : task.causeIfNotDone
    });
  };

  // Lógica de Status Global (Dropdown)
  const handleSetStatus = (status: "completed" | "not_done" | "in_progress") => {
    if (status === "completed") {
      // ✅ CONCLUÍDA: Marca flag, limpa causa. Mantém dias como estão (respeita histórico).
      onUpdate({
        ...task,
        isFullyCompleted: true,
        // @ts-ignore - Supabase aceita null para limpar
        causeIfNotDone: null,
      });
    } else if (status === "not_done") {
      // ❌ NÃO CONCLUÍDA: Remove flag, exige causa. Mantém dias como estão.
      onUpdate({
        ...task,
        isFullyCompleted: false,
        causeIfNotDone: task.causeIfNotDone || "Outros",
      });
    } else {
      // 🕒 EM ANDAMENTO (Voltar atrás): Limpa tudo.
      onUpdate({
        ...task,
        isFullyCompleted: false,
        // @ts-ignore - Supabase aceita null para limpar
        causeIfNotDone: null,
      });
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.trim()) {
      setMaterials([...materials, newMaterial.trim()]);
      setNewMaterial("");
    }
  };

  const getDayColor = (day: DayOfWeek) => {
    const isPlanned = task.plannedDays.includes(day);
    if (!isPlanned) return "bg-slate-50 text-slate-300 border-slate-100";

    const status = getDailyStatus(day);

    switch (status) {
      case "completed":
        return "bg-green-500 text-white border-green-600 shadow-sm hover:bg-green-600";
      case "not_done":
        return "bg-red-500 text-white border-red-600 shadow-sm hover:bg-red-600";
      case "not_planned":
        return "bg-slate-200 text-slate-400";
      default:
        return "bg-white border-secondary text-secondary font-bold shadow-sm hover:bg-secondary/10";
    }
  };

  const handleCauseChange = (value: string) => {
    // Se selecionou uma causa manualmente, define como não concluída
    onUpdate({
      ...task,
      causeIfNotDone: value === "none" ? undefined : value,
      isFullyCompleted: false,
    });
  };

  // Usar standardCauses importado do utils

  return (
    <>
      <div
        className={cn(
          "group relative bg-white rounded-xl shadow-sm border border-border/60 overflow-hidden hover:shadow-md transition-shadow duration-200",
          isDone ? "bg-slate-50/50" : "",
        )}
      >
        {/* Barra lateral de status */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300", statusColor)} />

        <div className="pl-6 pr-4 py-5 flex flex-col gap-5">
          {/* Cabeçalho */}
          <div className="flex justify-between items-start gap-3">
            <h3
              onClick={() => setIsEditOpen(true)}
              className="text-lg font-bold text-slate-800 hover:text-primary transition-colors cursor-pointer leading-tight flex-1"
            >
              {task.description}
            </h3>

            {/* Botão de Status Global (Dropdown) */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 px-3 text-xs font-semibold rounded-full border transition-all shadow-sm",
                      isDone
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        : hasIssue
                          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          : "bg-white text-slate-600 border-slate-200 hover:text-primary hover:border-secondary/50",
                    )}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Concluída
                      </>
                    ) : hasIssue ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Não Concluída
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-secondary" /> Em andamento
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Definir Status</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleSetStatus("completed")}
                    className="cursor-pointer text-green-700 focus:text-green-800 focus:bg-green-50"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Concluída
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSetStatus("not_done")}
                    className="cursor-pointer text-red-700 focus:text-red-800 focus:bg-red-50"
                  >
                    <Ban className="mr-2 h-4 w-4" /> Não Concluída
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSetStatus("in_progress")} className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4 text-secondary" /> Em Andamento
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Menu de Ações (3 pontinhos) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-slate-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(task)} className="cursor-pointer">
                    <Copy className="mr-2 h-4 w-4" /> Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onCopyToNextWeek(task)} className="cursor-pointer">
                    <ArrowRightCircle className="mr-2 h-4 w-4 text-secondary" /> Mover p/ próx. semana
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-red-600 focus:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Grid de Informações Completas */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Setor</span>
              <span className="text-xs font-semibold text-slate-700 block truncate uppercase">{task.sector}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Disciplina</span>
              <span className="text-xs font-semibold text-slate-700 block truncate uppercase">{task.discipline}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Executante</span>
              <span className="text-xs font-semibold text-slate-700 block truncate uppercase">{task.team || "-"}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Responsável</span>
              <span className="text-xs font-semibold text-slate-700 block truncate uppercase">{task.responsible}</span>
            </div>
            {task.executor && (
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Encarregado</span>
                <span className="text-xs font-semibold text-slate-700 block truncate uppercase">{task.executor}</span>
              </div>
            )}
          </div>

          {/* Timeline Interativa */}
          <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
            {days.map((day) => {
              const isPlanned = task.plannedDays.includes(day);
              return (
                <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                  <span
                    className={cn("text-[9px] uppercase font-bold", isPlanned ? "text-slate-600" : "text-slate-300")}
                  >
                    {dayLabels[day]}
                  </span>
                  <button
                    onClick={(e) => handleDayClick(day, e)}
                    disabled={!isPlanned}
                    className={cn(
                      "w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center transition-all duration-200",
                      getDayColor(day),
                      isPlanned ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default opacity-50",
                    )}
                    title={isPlanned ? "Clique para alterar status" : "Não planejado"}
                  >
                    {getDailyStatus(day) === "completed" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    {getDailyStatus(day) === "not_done" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Rodapé: Materiais e Causa */}
          <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
            <Collapsible open={isMaterialsOpen} onOpenChange={setIsMaterialsOpen} className="w-full">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-slate-500 hover:text-primary -ml-2 gap-2 group"
                  >
                    <Package className="h-4 w-4 group-hover:text-secondary transition-colors" />
                    <span className="text-xs font-medium">Materiais Necessários</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">
                      {materials.length}
                    </span>
                    <ChevronDown
                      className={cn("h-3 w-3 transition-transform duration-200", isMaterialsOpen ? "rotate-180" : "")}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2 pt-2">
                {materials.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {materials.map((mat, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 border-none"
                      >
                        {mat}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar material..."
                    className="h-8 text-xs bg-white"
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMaterial()}
                  />
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 bg-secondary hover:bg-secondary/90"
                    onClick={handleAddMaterial}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Seletor de Causa no Rodapé */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select value={task.causeIfNotDone || "none"} onValueChange={handleCauseChange}>
                  <SelectTrigger
                    className={cn(
                      "h-9 text-xs border-slate-200 transition-colors focus:ring-0",
                      hasIssue ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 hover:bg-white",
                    )}
                  >
                    <SelectValue placeholder="Selecionar causa..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-slate-400">
                      Sem causa registrada
                    </SelectItem>
                    {standardCauses.map((cause) => (
                      <SelectItem key={cause} value={cause}>
                        {cause}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-slate-200 text-slate-500 hover:text-primary"
                  onClick={() => onDuplicate(task)}
                  title="Duplicar"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-slate-200 text-slate-500 hover:text-primary"
                  onClick={() => setIsEditOpen(true)}
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditTaskDialog task={task} isOpen={isEditOpen} onOpenChange={setIsEditOpen} onUpdate={onUpdate} />
    </>
  );
};

export default React.memo(TaskCard);
