import { useState } from "react";
import { format, addDays } from "date-fns";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Repeat } from "lucide-react";

export interface RecurrenceConfig {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  weekDays: number[]; // 0 = domingo, 1 = segunda, etc.
  endDate: string;
}

interface RecurrenceSelectorProps {
  config: RecurrenceConfig;
  onChange: (config: RecurrenceConfig) => void;
  startDate: string;
}

const WEEK_DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

export function RecurrenceSelector({ config, onChange, startDate }: RecurrenceSelectorProps) {
  const handleToggle = (enabled: boolean) => {
    onChange({
      ...config,
      enabled,
      endDate: enabled && !config.endDate 
        ? format(addDays(new Date(startDate), 30), "yyyy-MM-dd") 
        : config.endDate,
    });
  };

  const handleWeekDayToggle = (day: number) => {
    const newWeekDays = config.weekDays.includes(day)
      ? config.weekDays.filter((d) => d !== day)
      : [...config.weekDays, day];
    onChange({ ...config, weekDays: newWeekDays });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 font-medium cursor-pointer">
          <Repeat className="w-4 h-4 text-primary" />
          Evento Recorrente
        </Label>
        <Switch checked={config.enabled} onCheckedChange={handleToggle} />
      </div>

      {config.enabled && (
        <div className="space-y-4 pt-2">
          <div className="grid gap-2">
            <Label className="text-sm text-slate-600">Frequência</Label>
            <Select
              value={config.frequency}
              onValueChange={(v) => onChange({ ...config, frequency: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diariamente</SelectItem>
                <SelectItem value="weekly">Semanalmente</SelectItem>
                <SelectItem value="monthly">Mensalmente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.frequency === "weekly" && (
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => (
                  <label
                    key={day.value}
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border cursor-pointer transition-all
                      ${config.weekDays.includes(day.value)
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-slate-600 border-slate-200 hover:border-primary"
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={config.weekDays.includes(day.value)}
                      onChange={() => handleWeekDayToggle(day.value)}
                    />
                    <span className="text-xs font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label className="text-sm text-slate-600">Repetir até</Label>
            <Input
              type="date"
              value={config.endDate}
              min={startDate}
              onChange={(e) => onChange({ ...config, endDate: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
