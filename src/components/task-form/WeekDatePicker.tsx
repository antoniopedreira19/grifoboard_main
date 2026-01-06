
import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getWeekStartDate } from "@/utils/pcp";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface WeekDatePickerProps {
  weekStartDate: Date | undefined;
  setWeekStartDate: (date: Date) => void;
}

const WeekDatePicker: React.FC<WeekDatePickerProps> = ({ 
  weekStartDate, 
  setWeekStartDate 
}) => {
  return (
    <div className="space-y-2 w-full">
      <Label htmlFor="weekStartDate" className="font-medium">Semana</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="weekStartDate"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !weekStartDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {weekStartDate ? format(weekStartDate, "dd/MM/yyyy") : <span>Selecionar data</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={weekStartDate}
            onSelect={(date) => {
              // Force selection to be Monday by finding the Monday of the selected date's week
              if (date) {
                setWeekStartDate(getWeekStartDate(date));
              }
            }}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default WeekDatePicker;
