
import { Task, DayOfWeek, TaskStatus } from "@/types";

export const useTaskStatus = (task: Task, onTaskUpdate: (updatedTask: Task) => void) => {
  const handleStatusChange = (day: DayOfWeek, newStatus: TaskStatus) => {
    const updatedDailyStatus = task.dailyStatus.map(status => 
      status.day === day ? { ...status, status: newStatus } : status
    );

    onTaskUpdate({
      ...task,
      dailyStatus: updatedDailyStatus,
    });
  };

  const handleCompletionStatusChange = () => {
    onTaskUpdate({
      ...task,
      isFullyCompleted: !task.isFullyCompleted,
    });
  };

  const handleCauseSelect = (cause: string) => {
    onTaskUpdate({
      ...task,
      causeIfNotDone: cause
    });
  };

  return {
    handleStatusChange,
    handleCompletionStatusChange,
    handleCauseSelect
  };
};
