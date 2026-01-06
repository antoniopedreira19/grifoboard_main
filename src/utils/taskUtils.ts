import { Task, DayOfWeek, TaskStatus } from "@/types";
import { Tarefa } from "@/types/supabase";
import { 
  DAY_FIELD_MAPPING, 
  REVERSE_DAY_FIELD_MAPPING, 
  TASK_STATUS_MAPPING, 
  REVERSE_TASK_STATUS_MAPPING 
} from "@/lib/constants";
import { formatDateToISO } from "@/lib/utils/formatters";

// Re-export for backward compatibility
export { formatDateToISO } from "@/lib/utils/formatters";

// Função auxiliar para converter Tarefa para Task
export const convertTarefaToTask = (tarefa: Tarefa): Task => {
  const task: Task = {
    id: tarefa.id,
    sector: tarefa.setor,
    item: tarefa.item,
    description: tarefa.descricao,
    discipline: tarefa.disciplina,
    team: tarefa.executante,
    responsible: tarefa.responsavel,
    executor: tarefa.encarregado,
    order: tarefa.ordem ?? 0,
    // Convert daily status fields to plannedDays array
    plannedDays: [],
    dailyStatus: [], 
    isFullyCompleted: tarefa.percentual_executado === 1,
    causeIfNotDone: tarefa.causa_nao_execucao,
    // Convert string to Date (local date to avoid timezone issues)
    weekStartDate: tarefa.semana ? new Date(tarefa.semana + 'T00:00:00') : undefined
  };
  
  // Process daily status from individual day fields
  Object.entries(DAY_FIELD_MAPPING).forEach(([dbField, dayOfWeek]) => {
    const dayStatus = tarefa[dbField as keyof Tarefa];
    if (dayStatus === 'Planejada' || dayStatus === 'Executada' || dayStatus === 'Não Feita') {
      task.plannedDays.push(dayOfWeek);
      
      // Add day status to dailyStatus array
      const status = TASK_STATUS_MAPPING[dayStatus as keyof typeof TASK_STATUS_MAPPING];
      
      task.dailyStatus.push({
        day: dayOfWeek,
        status
      });
    }
  });
  
  return task;
};

// Helper to convert Task status to Tarefa format
export const convertTaskStatusToTarefa = (task: Task): Partial<Tarefa> => {
  const tarefaToUpdate: Partial<Tarefa> = {
    setor: task.sector,
    item: task.item,
    descricao: task.description,
    disciplina: task.discipline,
    executante: task.team,
    responsavel: task.responsible,
    encarregado: task.executor,
    percentual_executado: task.isFullyCompleted ? 1 : 0,
    causa_nao_execucao: task.causeIfNotDone,
    // Convert Date to string format for database
    semana: task.weekStartDate ? formatDateToISO(task.weekStartDate) : undefined
  };
  
  // Reset all day fields to null initially
  Object.values(REVERSE_DAY_FIELD_MAPPING).forEach(dbField => {
    (tarefaToUpdate as Record<string, unknown>)[dbField] = null;
  });
  
  // Track which days have been set from dailyStatus
  const daysWithStatus = new Set<string>();
  
  // Update day status fields based on dailyStatus
  if (task.dailyStatus && task.dailyStatus.length > 0) {
    task.dailyStatus.forEach(dailyStatus => {
      const dbField = REVERSE_DAY_FIELD_MAPPING[dailyStatus.day];
      if (dbField) {
        // Get status with proper type casting
        let dbStatus: string | null = REVERSE_TASK_STATUS_MAPPING[dailyStatus.status as keyof typeof REVERSE_TASK_STATUS_MAPPING];
        
        // Fallback mapping in case type lookup fails (ensures 'planned' always saves as 'Planejada')
        if (!dbStatus) {
          if (dailyStatus.status === 'planned') dbStatus = 'Planejada';
          else if (dailyStatus.status === 'completed') dbStatus = 'Executada';
          else if (dailyStatus.status === 'not_done') dbStatus = 'Não Feita';
        }
        
        // Only set field if we have a valid status
        if (dbStatus) {
          (tarefaToUpdate as Record<string, unknown>)[dbField] = dbStatus;
          daysWithStatus.add(dailyStatus.day);
        }
      }
    });
  }
  
  // For any planned day that doesn't have a dailyStatus entry, set it as "Planejada"
  if (task.plannedDays && task.plannedDays.length > 0) {
    task.plannedDays.forEach(plannedDay => {
      if (!daysWithStatus.has(plannedDay)) {
        const dbField = REVERSE_DAY_FIELD_MAPPING[plannedDay];
        if (dbField) {
          (tarefaToUpdate as Record<string, unknown>)[dbField] = 'Planejada';
        }
      }
    });
  }
  
  return tarefaToUpdate;
};
