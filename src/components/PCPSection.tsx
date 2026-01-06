import React, { memo, useMemo } from "react";
import { PCPBreakdown, WeeklyPCPData, Task } from "@/types";
import { Card } from "@/components/ui/card";
import PCPOverallCard from "@/components/chart/PCPOverallCard";
import WeeklyCausesChart from "@/components/dashboard/WeeklyCausesChart";
import { startOfWeek } from "date-fns";

interface PCPSectionProps {
  pcpData: PCPBreakdown;
  weeklyPCPData: WeeklyPCPData[];
  tasks: Task[];
  selectedCause: string | null;
  onCauseSelect: (cause: string) => void;
  onClearFilter: () => void;
}

const PCPSection = memo(({ pcpData, tasks }: PCPSectionProps) => {
  const currentWeekStart = useMemo(() => 
    tasks.length > 0 ? startOfWeek(new Date(tasks[0].created_at || new Date()), { weekStartsOn: 1 }) : new Date(),
    [tasks]
  );

  const overallData = useMemo(() => 
    pcpData?.overall || { percentage: 0, completedTasks: 0, totalTasks: 0 },
    [pcpData?.overall]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
      {/* Card 1: Indicador Principal */}
      <div className="h-full min-h-[300px] hover:-translate-y-0.5 transition-transform duration-200">
        <PCPOverallCard
          data={overallData}
          className="h-full bg-white border-border/60 shadow-md hover:shadow-xl transition-shadow duration-200"
        />
      </div>

      {/* Card 2: Causas */}
      <div className="h-full min-h-[300px] hover:-translate-y-0.5 transition-transform duration-200">
        <Card className="h-full bg-white border-border/60 shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden">
          <WeeklyCausesChart
            tasks={tasks}
            weekStartDate={currentWeekStart}
            className="h-full border-none shadow-none"
          />
        </Card>
      </div>
    </div>
  );
});

PCPSection.displayName = "PCPSection";

export default PCPSection;
