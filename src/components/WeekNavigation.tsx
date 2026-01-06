import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { formatDateRange } from "@/utils/pcp";
import { useAuth } from "@/context/AuthContext";
import ExportDialog from "@/components/ExportDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface WeekNavigationProps {
  weekStartDate: Date;
  weekEndDate: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

const WeekNavigation = ({
  weekStartDate,
  weekEndDate,
  onPreviousWeek,
  onNextWeek
}: WeekNavigationProps) => {
  const { userSession } = useAuth();
  const isMobile = useIsMobile();
  const currentWeekFormatted = formatDateRange(weekStartDate, weekEndDate);
  
  // Normalizar datas para comparação (remover hora/minuto/segundo)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startNormalized = new Date(weekStartDate);
  startNormalized.setHours(0, 0, 0, 0);
  
  const endNormalized = new Date(weekEndDate);
  endNormalized.setHours(23, 59, 59, 999);
  
  const isCurrentWeek = 
    startNormalized.getTime() <= today.getTime() && 
    today.getTime() <= endNormalized.getTime();
    
  return (
    <div className="flex items-center gap-1 md:gap-1.5">
      {/* Botão Anterior */}
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8 md:h-9 md:w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        onClick={onPreviousWeek}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Container da Data */}
      <div className="flex items-center gap-2 md:gap-3 bg-slate-50/80 rounded-xl px-2 md:px-4 py-1.5 md:py-2 border border-border/30">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="p-1 md:p-1.5 rounded-lg bg-primary/10">
            <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
          </div>
          <span className="text-xs md:text-sm font-semibold text-foreground tracking-tight">
            {currentWeekFormatted}
          </span>
          {isCurrentWeek && (
            <span className="text-[8px] md:text-[9px] font-bold text-white bg-emerald-500 px-1 md:px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
              Atual
            </span>
          )}
        </div>
        
        {/* Separador e botão Export - escondido no mobile */}
        {!isMobile && (
          <>
            <div className="h-6 w-px bg-border/50" />
            <ExportDialog
              obraId={userSession.obraAtiva?.id || ""}
              obraNome={userSession.obraAtiva?.nome_obra || ""}
              weekStartDate={weekStartDate}
            />
          </>
        )}
      </div>
      
      {/* Botão Próximo */}
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8 md:h-9 md:w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        onClick={onNextWeek}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default WeekNavigation;
