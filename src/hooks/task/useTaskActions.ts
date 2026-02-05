import { useCallback } from "react";
import { Task } from "@/types";
import { Tarefa } from "@/types/supabase";
import { tarefasService } from "@/services/tarefaService";
import { convertTarefaToTask, convertTaskStatusToTarefa, formatDateToISO } from "@/utils/taskUtils";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import { gamificationService } from "@/services/gamificationService";
import { useAuth } from "@/context/AuthContext";

type ToastType = {
  title: string;
  description: string;
  variant?: "default" | "destructive";
};

type SessionType = {
  obraAtiva?: { id: string; nome_obra?: string };
};

type TaskActionsProps = {
  toast: (props: ToastType) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  weekStartDate: Date;
  calculatePCPData: (tasks: Task[]) => any;
  session: SessionType;
};

export const useTaskActions = ({
  toast,
  tasks,
  setTasks,
  weekStartDate,
  calculatePCPData,
  session,
}: TaskActionsProps) => {
  const { userSession } = useAuth();

  // Função para atualizar uma tarefa
  const handleTaskUpdate = useCallback(
    async (updatedTask: Task) => {
      try {
        console.log("🔄 Iniciando atualização da tarefa:", updatedTask.id);

        // 1. IMPORTANTE: Encontrar o estado ANTERIOR da tarefa antes de salvar
        // Isso permite saber se ela "virou" concluída ou se "deixou" de ser
        const previousTask = tasks.find((t) => t.id === updatedTask.id);

        // Converter Task para Tarefa
        const tarefaToUpdate = convertTaskStatusToTarefa(updatedTask);

        await tarefasService.atualizarTarefa(updatedTask.id, tarefaToUpdate);
        console.log("✅ Tarefa salva no banco com sucesso.");

        // --- LÓGICA DE GAMIFICAÇÃO INTELIGENTE ---
        if (userSession?.user?.id && previousTask) {
          const wasCompleted = previousTask.isFullyCompleted;
          const isNowCompleted = updatedTask.isFullyCompleted;

          console.log(`🎮 Estado da Tarefa: Antes=${wasCompleted}, Agora=${isNowCompleted}`);

          // CENÁRIO A: Acabou de completar (Ganha XP)
          if (!wasCompleted && isNowCompleted) {
            console.log("🚀 Tarefa concluída: Tentando dar XP...");
            gamificationService.awardXP(userSession.user.id, "TAREFA_CONCLUIDA", 30, updatedTask.id);
          }
          // CENÁRIO B: Estava completa e voltou atrás (Remove XP)
          else if (wasCompleted && !isNowCompleted) {
            console.log("u21A9 Tarefa revertida: Removendo XP...");
            gamificationService.removeXP(
              userSession.user.id,
              "TAREFA_CONCLUIDA", // Procura pelo log desta ação
              30, // Remove 30 XP
              updatedTask.id, // ID da tarefa para localizar o log exato
            );
          }
        }
        // ----------------------------------------

        // Atualizar a tarefa localmente
        const updatedTasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
        setTasks(updatedTasks);

        // Recalcular PCP com todas as tarefas (filtros são recalculados automaticamente pelo TaskFilters)
        calculatePCPData(updatedTasks);

        toast({
          title: "Tarefa atualizada",
          description: "As alterações foram salvas com sucesso.",
        });

        return updatedTask;
      } catch (error: unknown) {
        console.error("❌ Erro no handleTaskUpdate:", error);
        const errorMessage = getErrorMessage(error);
        toast({
          title: "Erro ao atualizar tarefa",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      }
    },
    [tasks, toast, calculatePCPData, setTasks, userSession],
  );

  // Função para excluir uma tarefa
  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      try {
        await tarefasService.excluirTarefa(taskId);

        // Remover a tarefa localmente
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        setTasks(updatedTasks);

        // Recalcular PCP com todas as tarefas (filtros são recalculados automaticamente pelo TaskFilters)
        calculatePCPData(updatedTasks);

        toast({
          title: "Tarefa excluída",
          description: "A tarefa foi removida com sucesso.",
        });

        return true;
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        toast({
          title: "Erro ao excluir tarefa",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    },
    [tasks, toast, calculatePCPData, setTasks],
  );

  // Função para criar uma nova tarefa
  const handleTaskCreate = useCallback(
    async (newTaskData: Omit<Task, "id" | "dailyStatus" | "isFullyCompleted">) => {
      try {
        if (!session.obraAtiva) {
          throw new Error("Nenhuma obra ativa selecionada");
        }

        // Ensure we have a week start date
        if (!newTaskData.weekStartDate) {
          throw new Error("Data de início da semana (segunda-feira) é obrigatória");
        }

        // Initialize the new Tarefa object with required fields
        const itemValue = newTaskData.item || `${newTaskData.sector}-${Date.now()}`;

        const novaTarefa: Omit<Tarefa, "id" | "created_at"> = {
          obra_id: session.obraAtiva.id,
          setor: newTaskData.sector,
          item: itemValue,
          descricao: newTaskData.description,
          disciplina: newTaskData.discipline,
          executante: newTaskData.team,
          responsavel: newTaskData.responsible,
          encarregado: newTaskData.executor,
          semana: formatDateToISO(newTaskData.weekStartDate),
          percentual_executado: 0,
          causa_nao_execucao: newTaskData.causeIfNotDone,
          seg: null,
          ter: null,
          qua: null,
          qui: null,
          sex: null,
          sab: null,
          dom: null,
        };

        const dayMapping: Record<string, string> = {
          mon: "seg",
          tue: "ter",
          wed: "qua",
          thu: "qui",
          fri: "sex",
          sat: "sab",
          sun: "dom",
        };

        newTaskData.plannedDays.forEach((day) => {
          const dbField = dayMapping[day];
          (novaTarefa as Record<string, unknown>)[dbField] = "Planejada";
        });

        const createdTarefa = await tarefasService.criarTarefa(novaTarefa);
        const novaTask = convertTarefaToTask(createdTarefa);

        const updatedTasks = [novaTask, ...tasks];
        setTasks(updatedTasks);

        // Recalcular PCP com todas as tarefas (filtros são recalculados automaticamente pelo TaskFilters)
        calculatePCPData(updatedTasks);

        toast({
          title: "Tarefa criada",
          description: "Nova tarefa adicionada com sucesso.",
        });

        return novaTask;
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        toast({
          title: "Erro ao criar tarefa",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      }
    },
    [session.obraAtiva, tasks, toast, calculatePCPData, setTasks],
  );

  // Função para duplicar tarefa
  const handleTaskDuplicate = useCallback(
    async (taskToDuplicate: Task) => {
      try {
        if (!session.obraAtiva) {
          throw new Error("Nenhuma obra ativa selecionada");
        }

        const newTaskData: Omit<Task, "id" | "dailyStatus" | "isFullyCompleted"> = {
          sector: taskToDuplicate.sector,
          item: taskToDuplicate.item,
          description: taskToDuplicate.description,
          discipline: taskToDuplicate.discipline,
          team: taskToDuplicate.team,
          responsible: taskToDuplicate.responsible,
          executor: taskToDuplicate.executor,
          plannedDays: [...taskToDuplicate.plannedDays],
          weekStartDate: taskToDuplicate.weekStartDate,
          causeIfNotDone: taskToDuplicate.causeIfNotDone,
        };

        const createdTask = await handleTaskCreate(newTaskData);

        toast({
          title: "Tarefa duplicada",
          description: "Uma nova cópia da tarefa foi criada com sucesso.",
        });

        return createdTask;
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        toast({
          title: "Erro ao duplicar tarefa",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      }
    },
    [session.obraAtiva, handleTaskCreate, toast],
  );

  // Função para copiar para a próxima semana
  const handleCopyToNextWeek = useCallback(
    async (taskToDuplicate: Task) => {
      try {
        if (!session.obraAtiva) {
          throw new Error("Nenhuma obra ativa selecionada");
        }

        const currentWeekStart = taskToDuplicate.weekStartDate || new Date();
        const nextWeekStart = new Date(
          currentWeekStart.getFullYear(),
          currentWeekStart.getMonth(),
          currentWeekStart.getDate() + 7,
        );

        const newTaskData: Omit<Task, "id" | "dailyStatus" | "isFullyCompleted"> = {
          sector: taskToDuplicate.sector,
          item: taskToDuplicate.item,
          description: taskToDuplicate.description,
          discipline: taskToDuplicate.discipline,
          team: taskToDuplicate.team,
          responsible: taskToDuplicate.responsible,
          executor: taskToDuplicate.executor,
          plannedDays: [...taskToDuplicate.plannedDays],
          weekStartDate: nextWeekStart,
          causeIfNotDone: taskToDuplicate.causeIfNotDone,
        };

        const createdTask = await handleTaskCreate(newTaskData);

        toast({
          title: "Tarefa copiada para próxima semana",
          description: "Uma nova tarefa foi criada para a semana seguinte.",
        });

        return createdTask;
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        toast({
          title: "Erro ao copiar tarefa",
          description: errorMessage,
          variant: "destructive",
        });
        throw error;
      }
    },
    [session.obraAtiva, handleTaskCreate, toast],
  );

  return {
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskCreate,
    handleTaskDuplicate,
    handleCopyToNextWeek,
  };
};
