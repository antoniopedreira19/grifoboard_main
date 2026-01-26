import { memo, useState, useCallback } from "react";
import { Building2, Truck, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LazyDestinationSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const destinations = [
  { value: "obra_direta", label: "Obra Direta", shortLabel: "Obra", icon: Building2 },
  { value: "fornecimento", label: "Fornecimento", shortLabel: "Forn.", icon: Truck },
  { value: "cliente", label: "Cliente", shortLabel: "Cliente", icon: User },
] as const;

const getDestination = (value: string | null | undefined) => {
  return destinations.find((d) => d.value === value);
};

// Componente memoizado e leve - só renderiza o popover quando clicado
export const LazyDestinationSelect = memo(function LazyDestinationSelect({
  value,
  onChange,
  disabled,
}: LazyDestinationSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (newValue: string) => {
      onChange(newValue);
      setOpen(false);
    },
    [onChange],
  );

  if (disabled) {
    return <span className="text-[10px] text-slate-300">—</span>;
  }

  const current = getDestination(value);
  const Icon = current?.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-5 text-[10px] px-1.5 rounded flex items-center gap-1 transition-colors",
            "hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-primary/20",
            value ? "text-slate-600" : "text-slate-400",
          )}
        >
          {Icon && <Icon className="w-3 h-3" />}
          <span>{current?.shortLabel || "—"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="end">
        <div className="flex flex-col">
          {destinations.map((dest) => {
            const DestIcon = dest.icon;
            return (
              <button
                key={dest.value}
                type="button"
                onClick={() => handleSelect(dest.value)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors",
                  "hover:bg-slate-100",
                  value === dest.value && "bg-primary/10 text-primary font-medium",
                )}
              >
                <DestIcon className="w-3 h-3" />
                {dest.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
});
