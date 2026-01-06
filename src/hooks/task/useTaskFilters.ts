
import { useState, useCallback } from "react";
import { Task } from "@/types";
import { formatDateToISO } from "@/utils/taskUtils";

export const useTaskFilters = (allTasks: Task[], weekStartDate: Date) => {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  // Filter tasks based on week start date
  const filterTasksByWeek = useCallback((tasks: Task[], startDate: Date) => {
    // Format both dates for comparison (local date strings)
    const weekStartDateStr = formatDateToISO(startDate);
    
    const filtered = tasks.filter(task => {
      // If task has no weekStartDate, skip it
      if (!task.weekStartDate) {
        return false;
      }
      
      // Format the task's week start date for comparison
      const taskWeekStartStr = formatDateToISO(task.weekStartDate);
      
      // Match tasks where the week start date is the same as the selected week
      return taskWeekStartStr === weekStartDateStr;
    });
    
    return filtered;
  }, []);
  
  return {
    filteredTasks,
    setFilteredTasks,
    filterTasksByWeek
  };
};
