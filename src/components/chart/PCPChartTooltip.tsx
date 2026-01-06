
import { TooltipProps } from "recharts";

// Using the recharts TooltipProps type to ensure compatibility
type PCPChartTooltipProps = TooltipProps<number, string>;

const PCPChartTooltip: React.FC<PCPChartTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  
  const data = payload[0];
  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="font-medium">{data.payload.name}</div>
      <div className="text-sm text-muted-foreground">
        PCP: {data.value}%
      </div>
    </div>
  );
};

export default PCPChartTooltip;
