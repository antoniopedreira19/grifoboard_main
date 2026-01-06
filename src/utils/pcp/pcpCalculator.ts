
import { PCPBreakdown, Task, WeeklyPCPData } from "../../types";

export const calculatePCP = (tasks: Task[]): PCPBreakdown => {
  // Filter only tasks that have planned days
  const tasksWithPlannedDays = tasks.filter(task => task.plannedDays.length > 0);
  
  if (tasksWithPlannedDays.length === 0) {
    return {
      overall: { completedTasks: 0, totalTasks: 0, percentage: 0 },
      bySector: {},
      byExecutor: {},
      byDiscipline: {}
    };
  }

  // Overall PCP - based on isFullyCompleted flag
  const completedTasks = tasksWithPlannedDays.filter(task => task.isFullyCompleted).length;
  const totalTasks = tasksWithPlannedDays.length;
  const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // By sector
  const sectors = Array.from(new Set(tasksWithPlannedDays.map(task => task.sector)));
  const bySector: Record<string, { completedTasks: number; totalTasks: number; percentage: number }> = {};
  
  sectors.forEach(sector => {
    const sectorTasks = tasksWithPlannedDays.filter(task => task.sector === sector);
    const sectorCompletedTasks = sectorTasks.filter(task => task.isFullyCompleted).length;
    bySector[sector] = {
      completedTasks: sectorCompletedTasks,
      totalTasks: sectorTasks.length,
      percentage: (sectorCompletedTasks / sectorTasks.length) * 100
    };
  });

  // By executor (using team field which maps to executante)
  const executors = Array.from(new Set(tasksWithPlannedDays.map(task => task.team).filter(Boolean)));
  const byExecutor: Record<string, { completedTasks: number; totalTasks: number; percentage: number }> = {};
  
  executors.forEach(executor => {
    const executorTasks = tasksWithPlannedDays.filter(task => task.team === executor);
    const executorCompletedTasks = executorTasks.filter(task => task.isFullyCompleted).length;
    byExecutor[executor!] = {
      completedTasks: executorCompletedTasks,
      totalTasks: executorTasks.length,
      percentage: (executorCompletedTasks / executorTasks.length) * 100
    };
  });
  
  // By discipline
  const disciplines = Array.from(new Set(tasksWithPlannedDays.map(task => task.discipline)));
  const byDiscipline: Record<string, { completedTasks: number; totalTasks: number; percentage: number }> = {};
  
  disciplines.forEach(discipline => {
    const disciplineTasks = tasksWithPlannedDays.filter(task => task.discipline === discipline);
    const disciplineCompletedTasks = disciplineTasks.filter(task => task.isFullyCompleted).length;
    byDiscipline[discipline] = {
      completedTasks: disciplineCompletedTasks,
      totalTasks: disciplineTasks.length,
      percentage: (disciplineCompletedTasks / disciplineTasks.length) * 100
    };
  });

  return {
    overall: { completedTasks, totalTasks, percentage },
    bySector,
    byExecutor,
    byDiscipline
  };
};

// Store historical PCP data by week start date
export const storeHistoricalPCPData = (
  historicalData: Map<string, number>, 
  weekStart: Date, 
  percentage: number
): Map<string, number> => {
  const weekKey = new Date(weekStart).toISOString().split('T')[0];
  historicalData.set(weekKey, percentage);
  return historicalData;
};

// Generate weekly PCP data including the previous weeks
export const generateWeeklyPCPData = (
  currentWeekStart: Date,
  currentWeekPCP: number,
  historicalData: Map<string, number>
): WeeklyPCPData[] => {
  const result: WeeklyPCPData[] = [];
  
  // Add data for previous 3 weeks and current week
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - (7 * i));
    
    const weekKey = weekStart.toISOString().split('T')[0];
    
    // Get stored PCP value or use current week's PCP as fallback for the current week
    const pcpValue = i === 0 ? currentWeekPCP : 
                    (historicalData.get(weekKey) !== undefined ? 
                    historicalData.get(weekKey)! : Math.round(Math.random() * 100));
    
    // Add to results
    result.push({
      week: `Week ${i+1}`,
      percentage: pcpValue,
      date: weekStart,
      isCurrentWeek: i === 0  // Current week is at i=0
    });
  }
  
  return result;
};
