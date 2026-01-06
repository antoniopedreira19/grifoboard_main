export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type TaskStatus = "planned" | "completed" | "not_done" | "not_planned";

export interface DayStatus {
  day: DayOfWeek;
  status: TaskStatus;
}

export interface PCPData {
  completedTasks: number;
  totalTasks: number;
  percentage: number;
}

export interface PCPBreakdown {
  overall: PCPData;
  bySector: Record<string, PCPData>;
  byExecutor: Record<string, PCPData>;
  byDiscipline: Record<string, PCPData>;
}

export interface WeeklyPCPData {
  week: string;
  percentage: number;
  date: Date;
  isCurrentWeek: boolean;
}

export interface Task {
  id: string;
  sector: string;
  item: string;
  description: string;
  discipline: string;
  team: string;
  responsible: string;
  executor?: string;
  plannedDays: DayOfWeek[];
  dailyStatus: DayStatus[];
  isFullyCompleted: boolean;
  causeIfNotDone?: string;
  weekStartDate?: Date;
  order?: number;
  created_at?: string; // ADICIONADO: Propriedade que faltava
}
