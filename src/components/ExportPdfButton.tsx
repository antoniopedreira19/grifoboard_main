import { FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Utility function to normalize any date to Monday of its week
function toMondayISO(date: Date): string {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const delta = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate days to subtract to get Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + delta);
  return monday.toISOString().slice(0, 10); // Return YYYY-MM-DD format
}

interface ExportPdfButtonProps {
  obraId: string;
  obraNome: string;
  weekStartDate: Date;
}

const ExportPdfButton = ({ obraId, obraNome, weekStartDate }: ExportPdfButtonProps) => {
  const weekStartISO = toMondayISO(weekStartDate);

  const filename = `Relatorio_Semanal_${obraNome.replace(/\s+/g,"_")}_${weekStartISO}.pdf`;

  const handleDownload = async () => {
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Você precisa estar autenticado para exportar relatórios");
        return;
      }

      // Get Supabase URL from environment
      const functionUrl = 'https://qacaerwosglbayjfskyx.supabase.co/functions/v1/export-pdf';

      // Call the edge function with fetch to get binary data
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ obraId, obraNome, weekStart: weekStartISO }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error("Export error:", errorData);
        toast.error("Erro ao exportar relatório");
        return;
      }

      // Get HTML content
      const htmlContent = await response.text();
      
      // Open in new window and trigger print dialog (about:blank allows Save as PDF reliably)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        // Add a meaningful title to avoid showing raw about:blank in headers if enabled
        const htmlWithTitle = htmlContent.replace('<head>', '<head><title>Relatório Semanal</title>');
        printWindow.document.write(htmlWithTitle);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 250);
        });

        // Close the window after printing
        printWindow.addEventListener('afterprint', () => {
          printWindow.close();
        });
        
        toast.success("Abrindo janela de impressão...");
      } else {
        toast.error("Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.");
      }
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Erro ao baixar relatório");
    }
  };

  return (
    <button 
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-primary/20 rounded-md hover:bg-primary/5 transition-colors"
    >
      <FileDown className="h-4 w-4" />
      Exportar PDF
    </button>
  );
};
export default ExportPdfButton;