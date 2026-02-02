import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgendaEvent } from "@/types/agenda";

interface CopyEventModalProps {
  event: AgendaEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: (targetDate: Date) => Promise<void>;
}

export function CopyEventModal({ event, open, onOpenChange, onCopy }: CopyEventModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [copying, setCopying] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  if (!event) return null;

  const handleCopy = async () => {
    if (!selectedDate) return;

    setCopying(true);
    try {
      await onCopy(selectedDate);
      onOpenChange(false);
      setSelectedDate(undefined);
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary" />
            Copiar Evento
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border">
            <p className="font-medium text-slate-800">{event.title}</p>
            <p className="text-sm text-slate-500 mt-1">
              Será copiado para a nova data com o mesmo horário e configurações.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Selecione a nova data</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCopy} disabled={!selectedDate || copying}>
            {copying ? "Copiando..." : "Copiar Evento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
