
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyPCPData } from "@/types";
import PCPBarChart from "../PCPBarChart";

interface PCPWeeklyCardProps {
  weeklyData: WeeklyPCPData[];
}

const PCPWeeklyCard: React.FC<PCPWeeklyCardProps> = ({ weeklyData }) => {
  return (
    <Card className="col-span-1 shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle className="text-lg">PCP por Semana</CardTitle>
      </CardHeader>
      <PCPBarChart weeklyData={weeklyData} />
    </Card>
  );
};

export default PCPWeeklyCard;
