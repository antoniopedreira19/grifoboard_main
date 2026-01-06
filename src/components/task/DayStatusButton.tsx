
import { DayOfWeek, TaskStatus } from "@/types";
import { getStatusColor } from "@/utils/pcp";
import { Check } from "lucide-react";

interface DayStatusButtonProps {
  day: DayOfWeek;
  status: TaskStatus;
  isPlanned: boolean;
  onStatusChange: (day: DayOfWeek, newStatus: TaskStatus) => void;
}

const DayStatusButton: React.FC<DayStatusButtonProps> = ({ day, status, isPlanned, onStatusChange }) => {
  if (!isPlanned) {
    return (
      <div className="h-7 w-7 rounded-md bg-gray-100 opacity-30 border border-gray-200" />
    );
  }

  const statusColorMap = {
    planned: "bg-blue-100 border-blue-300 hover:bg-blue-200",
    completed: "bg-green-100 border-green-300 hover:bg-green-200",
    not_done: "bg-red-100 border-red-300 hover:bg-red-200",
    not_planned: "bg-gray-100 border-gray-200 hover:bg-gray-200"
  };
  
  const statusTextMap = {
    planned: "text-blue-700",
    completed: "text-green-700",
    not_done: "text-red-700",
    not_planned: "text-gray-500"
  };
  
  const handleClick = () => {
    // Cycle through statuses: planned -> completed -> not_done -> planned
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      planned: "completed",
      completed: "not_done",
      not_done: "planned",
      not_planned: "planned"
    };
    onStatusChange(day, nextStatus[status]);
  };

  return (
    <button
      onClick={handleClick}
      className={`h-7 w-7 rounded-md ${statusColorMap[status]} flex items-center justify-center ${statusTextMap[status]} transition-colors duration-150 shadow-sm border motion-reduce:transition-none`}
      aria-label={`Status para ${day}: ${status}`}
    >
      {status === "completed" && <span className="text-xs font-bold">✓</span>}
      {status === "not_done" && <span className="text-xs font-bold">X</span>}
      {status === "planned" && <span className="text-xs font-bold">●</span>}
    </button>
  );
};

export default DayStatusButton;
