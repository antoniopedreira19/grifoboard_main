
import { DayOfWeek, Task, TaskStatus, WeeklyPCPData } from "../../types";
import { formatDateRange, getWeekEndDate, getWeekStartDate } from "./dateUtils";

export const generateMockTasks = (weekStart?: Date): Task[] => {
  const sectors = ["Fundação", "Alvenaria", "Estrutura", "Acabamento", "Instalações"];
  const disciplines = ["Civil", "Elétrica", "Hidráulica", "Arquitetura"];
  const teams = ["Executante A", "Executante B", "Executante C"];
  const responsibles = ["João Silva", "Maria Oliveira", "Carlos Santos"];
  const executors = ["Pedro Alves", "Ana Costa", "Felipe Souza", "Juliana Lima"];
  
  const mockTasks: Task[] = [];
  
  for (let i = 1; i <= 15; i++) {
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const discipline = disciplines[Math.floor(Math.random() * disciplines.length)];
    const team = teams[Math.floor(Math.random() * teams.length)];
    const responsible = responsibles[Math.floor(Math.random() * responsibles.length)];
    const executor = executors[Math.floor(Math.random() * executors.length)];
    
    // Randomly select which days are planned
    const allDays: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const plannedDays: DayOfWeek[] = [];
    
    allDays.forEach(day => {
      if (Math.random() > 0.5) {
        plannedDays.push(day);
      }
    });
    
    // Create daily status for each day
    const dailyStatus: { day: DayOfWeek; status: TaskStatus }[] = allDays.map(day => {
      if (plannedDays.includes(day)) {
        // If day is planned, randomly assign status
        const rand = Math.random();
        let status: TaskStatus = "planned";
        if (rand < 0.6) {
          status = "completed";
        } else if (rand < 0.9) {
          status = "not_done";
        }
        return { day, status };
      } else {
        return { day, status: "not_planned" as TaskStatus };
      }
    });
    
    // Randomly determine if task is fully completed
    const isFullyCompleted = Math.random() > 0.5;
    
    mockTasks.push({
      id: `task-${i}`,
      sector,
      item: `Item ${i}`,
      description: `Tarefa ${i} de ${sector}`,
      discipline,
      team,
      responsible,
      executor,
      plannedDays,
      dailyStatus,
      isFullyCompleted,
      causeIfNotDone: isFullyCompleted ? undefined : "Falta de material",
      weekStartDate: weekStart ? new Date(weekStart) : undefined
    });
  }
  
  return mockTasks;
};

// Generate mock weekly PCP data for the chart
export const generateMockWeeklyData = (currentWeekStart: Date, weeksToGenerate: number = 4): WeeklyPCPData[] => {
  const weeklyData: WeeklyPCPData[] = [];
  
  // Generate previous weeks data
  for (let i = weeksToGenerate - 1; i >= 0; i--) {
    const weekDate = new Date(currentWeekStart);
    weekDate.setDate(currentWeekStart.getDate() - (7 * i));
    
    const startDate = getWeekStartDate(weekDate);
    const endDate = getWeekEndDate(startDate);
    const dateStr = formatDateRange(startDate, endDate);
    
    // Generate a random percentage between 30 and 95
    const percentage = Math.floor(Math.random() * (95 - 30 + 1)) + 30;
    
    weeklyData.push({
      week: dateStr,
      percentage,
      date: new Date(startDate),
      isCurrentWeek: i === 0
    });
  }
  
  return weeklyData;
};

// Generate weekly PCP data for the current week and previous weeks
export const generateWeeklyPCPData = (currentWeekStart: Date, currentWeekPCP: number, historicalData: Map<string, number> = new Map()): WeeklyPCPData[] => {
  const weeklyData: WeeklyPCPData[] = [];
  
  // Track weeks we've already added to avoid duplicates
  const addedWeekKeys = new Set<string>();
  
  // Generate data for previous three weeks
  for (let i = 3; i >= 0; i--) {
    // Calculate the week start date
    const weekDate = new Date(currentWeekStart);
    if (i > 0) {
      weekDate.setDate(currentWeekStart.getDate() - (7 * i));
    }
    
    const startDate = getWeekStartDate(weekDate);
    const endDate = getWeekEndDate(startDate);
    const dateStr = formatDateRange(startDate, endDate);
    
    // Check if this week is already added
    const weekKey = startDate.toISOString().split('T')[0];
    if (addedWeekKeys.has(weekKey)) {
      continue;
    }
    addedWeekKeys.add(weekKey);
    
    // Calculate percentage
    let percentage;
    if (i === 0) {
      // Current week
      percentage = currentWeekPCP;
    } else {
      // Check if we have historical data for this week
      percentage = historicalData.get(weekKey);
      if (percentage === undefined) {
        // Generate a random percentage between 30 and 95 for previous weeks if no historical data
        percentage = Math.floor(Math.random() * (95 - 30 + 1)) + 30;
      }
    }
    
    weeklyData.push({
      week: dateStr,
      percentage,
      date: new Date(startDate),
      isCurrentWeek: i === 0
    });
  }
  
  return weeklyData;
};
