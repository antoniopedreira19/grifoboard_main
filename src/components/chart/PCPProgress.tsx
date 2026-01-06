
import { Progress } from "@/components/ui/progress";
import { PCPData } from "@/types";

interface PCPProgressProps {
  data: PCPData;
  label?: string;
}

const PCPProgress: React.FC<PCPProgressProps> = ({ data, label }) => {
  const percentage = Math.round(data.percentage);
  
  return (
    <div className="w-full">
      {label && <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{percentage}%</span>
      </div>}
      <div className="w-full flex items-center gap-2">
        <div className="w-full">
          <Progress 
            value={percentage} 
            className="h-2" 
            style={{ "--progress-color": "#021C2F" } as React.CSSProperties}
          />
        </div>
        <span className="text-sm font-medium w-12 text-right">
          {data.completedTasks}/{data.totalTasks}
        </span>
      </div>
    </div>
  );
};

export default PCPProgress;
