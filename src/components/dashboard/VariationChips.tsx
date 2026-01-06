import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface VariationChipsProps {
  completedDelta: number;
  pendingDelta: number;
  pcpDelta: number;
  delaysDelta: number;
  criticalCausesDelta: number;
}

const VariationChips: React.FC<VariationChipsProps> = ({
  completedDelta,
  pendingDelta,
  pcpDelta,
  delaysDelta,
  criticalCausesDelta
}) => {
  const getVariationColor = (delta: number, isNegativeGood: boolean = false) => {
    if (delta === 0) return "secondary";
    const isPositive = delta > 0;
    const isGood = isNegativeGood ? !isPositive : isPositive;
    return isGood ? "success" : "destructive";
  };

  const getVariationIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="h-3 w-3" />;
    if (delta < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const formatDelta = (delta: number, isPercentage: boolean = false) => {
    const sign = delta > 0 ? "+" : "";
    const suffix = isPercentage ? "p.p." : "";
    return `${sign}${delta}${suffix}`;
  };

  const chips = [
    {
      label: "Concluídas",
      delta: completedDelta,
      isNegativeGood: false
    },
    {
      label: "Pendentes", 
      delta: pendingDelta,
      isNegativeGood: true
    },
    {
      label: "PCP",
      delta: pcpDelta,
      isNegativeGood: false,
      isPercentage: true
    },
    {
      label: "Atrasos",
      delta: delaysDelta,
      isNegativeGood: true
    },
    {
      label: "Causas críticas",
      delta: criticalCausesDelta,
      isNegativeGood: true
    }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <Badge
          key={`${chip.label}-${chip.delta}`}
          variant={getVariationColor(chip.delta, chip.isNegativeGood) as any}
          className="flex items-center gap-1 px-3 py-1"
        >
          {getVariationIcon(chip.delta)}
          <span className="text-xs font-medium">
            {chip.label}: {formatDelta(chip.delta, chip.isPercentage)}
          </span>
        </Badge>
      ))}
    </div>
  );
};

export default VariationChips;