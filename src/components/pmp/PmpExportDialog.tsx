import React, { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PmpWeek } from "@/types/pmp";

interface PmpExportDialogProps {
  obraId: string;
  obraNome: string;
  weeks: PmpWeek[];
  weekStartFilter: number;
  weekEndFilter: number;
}

export const PmpExportDialog = ({
  obraId,
  obraNome,
  weeks,
  weekStartFilter,
  weekEndFilter,
}: PmpExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<"all" | "range" | "single">("range");
  const [selectedWeek, setSelectedWeek] = useState<string>("0");
  const [loading, setLoading] = useState(false);

  const getWeekLabel = (index: number) => {
    const week = weeks[index];
    if (!week) return `Semana ${index + 1}`;
    return `Semana ${String(index + 1).padStart(2, '0')} (${week.formattedRange})`;
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa estar autenticado para exportar relatórios");
        return;
      }

      // Determine which weeks to export
      let weeksToExport: PmpWeek[];
      
      if (exportType === "all") {
        weeksToExport = weeks;
      } else if (exportType === "range") {
        weeksToExport = weeks.slice(weekStartFilter, weekEndFilter + 1);
      } else {
        weeksToExport = [weeks[Number(selectedWeek)]];
      }

      // Prepare weeks data for the edge function
      const weeksData = weeksToExport.map((week, idx) => ({
        weekId: week.id,
        label: `Semana ${String((exportType === "all" ? idx : (exportType === "range" ? weekStartFilter : Number(selectedWeek))) + 1).padStart(2, '0')}`,
        formattedRange: week.formattedRange,
        atividades: [],
      }));

      const functionUrl = 'https://qacaerwosglbayjfskyx.supabase.co/functions/v1/export-pmp-pdf';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          obraId, 
          obraNome,
          weeks: weeksData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error("Export error:", errorData);
        toast.error("Erro ao exportar relatório");
        return;
      }

      const htmlContent = await response.text();
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 250);
        });

        printWindow.addEventListener('afterprint', () => {
          printWindow.close();
        });
        
        toast.success("Abrindo visualização do PDF...");
        setOpen(false);
      } else {
        toast.error("Não foi possível abrir a janela. Verifique se pop-ups estão bloqueados.");
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-sm gap-2">
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar PMP em PDF</DialogTitle>
          <DialogDescription>
            Escolha quais semanas exportar no formato de quadro
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <RadioGroup value={exportType} onValueChange={(v) => setExportType(v as any)}>
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value="range" id="range" />
              <Label htmlFor="range" className="flex-1 cursor-pointer">
                <div className="font-medium">Semanas Filtradas</div>
                <div className="text-sm text-muted-foreground">
                  Exportar {getWeekLabel(weekStartFilter)} até {getWeekLabel(weekEndFilter)}
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex-1 cursor-pointer">
                <div className="font-medium">Todas as Semanas</div>
                <div className="text-sm text-muted-foreground">
                  Exportar todas as {weeks.length} semanas do cronograma
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="flex-1 cursor-pointer">
                <div className="font-medium">Semana Específica</div>
                <div className="text-sm text-muted-foreground">
                  Selecionar uma única semana
                </div>
              </Label>
            </div>
          </RadioGroup>

          {exportType === "single" && (
            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a semana" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((_, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    {getWeekLabel(idx)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
