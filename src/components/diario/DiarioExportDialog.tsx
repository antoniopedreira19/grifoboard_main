import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileDown, Loader2, Calendar, CalendarRange, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DiarioExportDialogProps {
  obraId: string;
  obraNome: string;
  date: Date;
}

export function DiarioExportDialog({ obraId, obraNome, date }: DiarioExportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"day" | "week">("day");
  const [includePhotos, setIncludePhotos] = useState(true);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.access_token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await supabase.functions.invoke("export-diario-pdf", {
        body: {
          obraId,
          obraNome,
          exportType,
          date: format(date, "yyyy-MM-dd"),
          includePhotos,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const { html } = response.data;

      // Open in new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for images to load before triggering print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível abrir a janela de impressão. Verifique se popups estão habilitados.",
          variant: "destructive",
        });
      }

      setOpen(false);
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Erro ao exportar",
        description: error.message || "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formattedDate = format(date, "dd 'de' MMMM", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            Exportar Diário de Obra
          </DialogTitle>
          <DialogDescription>
            Gere um PDF com os registros do diário de obra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Período de Exportação</Label>
            <RadioGroup
              value={exportType}
              onValueChange={(value) => setExportType(value as "day" | "week")}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="export-day"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  exportType === "day"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <RadioGroupItem value="day" id="export-day" className="sr-only" />
                <Calendar className={`h-6 w-6 ${exportType === "day" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${exportType === "day" ? "text-primary" : "text-muted-foreground"}`}>
                  Dia Atual
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  {formattedDate}
                </span>
              </Label>

              <Label
                htmlFor="export-week"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  exportType === "week"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <RadioGroupItem value="week" id="export-week" className="sr-only" />
                <CalendarRange className={`h-6 w-6 ${exportType === "week" ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${exportType === "week" ? "text-primary" : "text-muted-foreground"}`}>
                  Semana Atual
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Segunda a Domingo
                </span>
              </Label>
            </RadioGroup>
          </div>

          {/* Include Photos Checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Checkbox
              id="include-photos"
              checked={includePhotos}
              onCheckedChange={(checked) => setIncludePhotos(checked as boolean)}
            />
            <div className="flex items-center gap-2 flex-1">
              <Image className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="include-photos" className="text-sm font-normal cursor-pointer">
                Incluir fotos no PDF
              </Label>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            O PDF será aberto em uma nova janela para impressão ou salvamento.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Exportar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
