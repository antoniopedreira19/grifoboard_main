import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { calculatePCP } from "@/utils/pcp";
import { useTaskData } from "@/hooks/task/useTaskData";
import { useTaskFilters } from "@/hooks/task/useTaskFilters";

interface DashboardContextType {
  // Current week data
  currentWeekTasks: Task[];
  currentWeekPcpData: any;

  // Previous week data
  prevWeekTasks: Task[];
  prevWeekPcpData: any;

  // All tasks for context
  allTasks: Task[];

  // Loading states
  isLoading: boolean;

  // Week navigation
  weekStartDate: Date;
  setWeekStartDate: (date: Date) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
  initialWeekStartDate: Date;
}

export const DashboardProvider = ({ children, initialWeekStartDate }: DashboardProviderProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [weekStartDate, setWeekStartDate] = useState(initialWeekStartDate);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Previous week calculation
  const prevWeekStart = new Date(weekStartDate);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  // Use task filters for both weeks
  const { filterTasksByWeek } = useTaskFilters(allTasks, weekStartDate);
  const { loadTasks } = useTaskData(session, toast, setAllTasks, setIsLoading);

  // Filter tasks by weeks
  const currentWeekTasks = filterTasksByWeek(allTasks, weekStartDate);
  const prevWeekTasks = filterTasksByWeek(allTasks, prevWeekStart);

  // Calculate PCP data
  const currentWeekPcpData = calculatePCP(currentWeekTasks);
  const prevWeekPcpData = calculatePCP(prevWeekTasks);

  // Load all tasks when obra changes (load broader range to cover multiple weeks)
  useEffect(() => {
    if (session.obraAtiva) {
      setIsLoading(true);

      // Load tasks from 4 weeks ago to 2 weeks in the future to cover current and previous weeks
      const startRange = new Date(weekStartDate);
      startRange.setDate(startRange.getDate() - 28); // 4 weeks back

      const endRange = new Date(weekStartDate);
      endRange.setDate(endRange.getDate() + 14); // 2 weeks forward

      // Use the loadTasks method but with a broader date range to get more data at once
      loadTasks(
        startRange, // Use start range instead of specific week
        (tasks: Task[]) => calculatePCP(tasks), // PCP calculation callback
        (tasks: Task[], startDate: Date) => tasks, // Return all tasks instead of filtering
        () => {}, // No filtered tasks setter needed
        () => setIsLoading(false), // Set loading false when done
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.obraAtiva]);

  const value: DashboardContextType = {
    currentWeekTasks,
    currentWeekPcpData,
    prevWeekTasks,
    prevWeekPcpData,
    allTasks,
    isLoading,
    weekStartDate,
    setWeekStartDate,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
