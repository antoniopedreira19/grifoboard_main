
import { DayOfWeek, Task, TaskStatus } from "@/types";
import { dayNameMap } from "@/utils/pcp";
import DayStatusButton from "./DayStatusButton";

interface TaskStatusDisplayProps {
  task: Task;
  onStatusChange: (day: DayOfWeek, newStatus: TaskStatus) => void;
}

const TaskStatusDisplay: React.FC<TaskStatusDisplayProps> = ({ task, onStatusChange }) => {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
      <div className="grid grid-cols-7 gap-1.5">
        {Object.entries(dayNameMap).map(([day, shortName]) => {
          const dayKey = day as DayOfWeek;
          const dayStatus = task.dailyStatus.find(s => s.day === dayKey)?.status || "not_planned";
          const isPlanned = task.plannedDays.includes(dayKey);
          
          return (
            <div key={day} className="flex flex-col items-center">
              <span className="text-[9px] text-gray-500 mb-1 font-semibold">{shortName}</span>
              <DayStatusButton
                day={dayKey}
                status={dayStatus}
                isPlanned={isPlanned}
                onStatusChange={onStatusChange}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskStatusDisplay;
