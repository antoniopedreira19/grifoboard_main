import { useState, useEffect, useCallback, useMemo, useRef, useTransition } from "react";
import { Task, WeeklyPCPData } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { calculatePCP } from "@/utils/pcp";
import { formatDateToISO, convertTarefaToTask } from "@/utils/taskUtils";
import { useTaskFilters } from "@/hooks/task/useTaskFilters";
import { useTaskActions } from "@/hooks/task/useTaskActions";
import { useTaskData } from "@/hooks/task/useTaskData";

export const useTaskManager = (weekStartDate: Date) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyPCPData, setWeeklyPCPData] = useState<WeeklyPCPData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  
  // Cache filtered tasks by week to avoid recalculation
  const filteredCacheRef = useRef<Map<string, Task[]>>(new Map());

  const { filterTasksByWeek, filteredTasks, setFilteredTasks } = useTaskFilters(tasks, weekStartDate);
  const { loadTasks } = useTaskData(session, toast, setTasks, setIsLoading);

  // Memoized week key for cache lookups
  const weekKey = useMemo(() => formatDateToISO(weekStartDate), [weekStartDate]);

  // Memoized PCP calculation - only recalculate when filteredTasks actually change
  const pcpData = useMemo(() => {
    return calculatePCP(filteredTasks || []);
  }, [filteredTasks]);

  // Update weeklyPCPData when pcpData changes
  const updateWeeklyPCPData = useCallback((percentage: number) => {
    const weeklyData: WeeklyPCPData = {
      week: "Atual",
      percentage,
      date: weekStartDate,
      isCurrentWeek: true,
    };
    setWeeklyPCPData([weeklyData]);
  }, [weekStartDate]);

  // Simplified calculatePCPData for use in actions (only updates weeklyPCPData)
  const calculatePCPData = useCallback(
    (tasksList: Task[]) => {
      const safeList = tasksList || [];
      const data = calculatePCP(safeList);
      updateWeeklyPCPData(data.overall.percentage);
      return data;
    },
    [updateWeeklyPCPData],
  );

  const { handleTaskUpdate, handleTaskDelete, handleTaskCreate, handleTaskDuplicate, handleCopyToNextWeek } =
    useTaskActions({
      toast,
      tasks,
      setTasks,
      weekStartDate,
      calculatePCPData,
      session,
    });

  // Load tasks when obraAtiva changes
  useEffect(() => {
    if (session.obraAtiva) {
      // Clear cache when obra changes
      filteredCacheRef.current.clear();
      loadTasks(weekStartDate, calculatePCPData, filterTasksByWeek, setFilteredTasks);
    } else {
      setTasks([]);
      setFilteredTasks([]);
    }
  }, [session.obraAtiva]); // eslint-disable-line react-hooks/exhaustive-deps

  // Optimized filter with cache - wrap in transition for smoother UX
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    
    // Check cache first
    const cached = filteredCacheRef.current.get(weekKey);
    if (cached) {
      setFilteredTasks(cached);
      updateWeeklyPCPData(calculatePCP(cached).overall.percentage);
      return;
    }
    
    // Use startTransition to mark this as non-urgent update
    startTransition(() => {
      const filtered = filterTasksByWeek(tasks, weekStartDate);
      
      // Cache the result
      filteredCacheRef.current.set(weekKey, filtered);
      
      // Batch updates by calculating before setting
      const pcp = calculatePCP(filtered);
      
      setFilteredTasks(filtered);
      updateWeeklyPCPData(pcp.overall.percentage);
    });
  }, [weekStartDate, tasks, weekKey, filterTasksByWeek, setFilteredTasks, updateWeeklyPCPData]);

  // Clear cache when tasks change (invalidate cache)
  useEffect(() => {
    filteredCacheRef.current.clear();
  }, [tasks]);

  return {
    tasks: filteredTasks || [],
    allTasks: tasks || [],
    isLoading: isLoading || isPending,
    pcpData,
    weeklyPCPData,
    loadTasks: (callback?: () => void) =>
      loadTasks(weekStartDate, calculatePCPData, filterTasksByWeek, setFilteredTasks, callback),
    handleTaskUpdate,
    handleTaskDelete,
    handleTaskCreate,
    handleTaskDuplicate,
    handleCopyToNextWeek,
  };
};

export { formatDateToISO, convertTarefaToTask } from "@/utils/taskUtils";
