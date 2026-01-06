
import { useCallback } from "react";
import { Task, PCPBreakdown } from "@/types";
import { tarefasService } from "@/services/tarefaService";
import { convertTarefaToTask } from "@/utils/taskUtils";
import { getErrorMessage } from "@/lib/utils/errorHandler";

type ToastType = {
  title: string;
  description: string;
  variant?: "default" | "destructive";
};

type SessionType = {
  obraAtiva?: { id: string; nome_obra?: string };
};

export const useTaskData = (
  session: SessionType,
  toast: (props: ToastType) => void,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // Função para carregar tarefas do Supabase
  const loadTasks = useCallback(async (
    weekStartDate: Date,
    calculatePCPData: (tasks: Task[]) => PCPBreakdown,
    filterTasksByWeek: (tasks: Task[], startDate: Date) => Task[],
    setFilteredTasks: React.Dispatch<React.SetStateAction<Task[]>>,
    callback?: () => void
  ) => {
    if (!session.obraAtiva) {
      return;
    }
    
    setIsLoading(true);
    try {
      const tarefas = await tarefasService.listarTarefas(session.obraAtiva.id);
      
      const convertedTasks = tarefas.map(convertTarefaToTask);
      
      setTasks(convertedTasks);
      
      // Filter tasks for the current week
      const weekFilteredTasks = filterTasksByWeek(convertedTasks, weekStartDate);
      
      // Ensure stable order by DB 'ordem' when no custom sort is applied
      const orderedWeekTasks = [...weekFilteredTasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      
      setFilteredTasks(orderedWeekTasks);
      
      // Calcular dados do PCP para o gráfico semanal com as tarefas filtradas
      calculatePCPData(orderedWeekTasks);
      
      // Execute callback if provided
      if (callback) callback();
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Erro ao carregar tarefas",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [session.obraAtiva, toast, setTasks, setIsLoading]);
  
  return { loadTasks };
};
