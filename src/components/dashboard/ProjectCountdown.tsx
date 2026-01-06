import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Clock, Calendar, Timer, AlertTriangle, CheckCircle2 } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";

const ProjectCountdown = () => {
  const { userSession } = useAuth();

  const projectInfo = useMemo(() => {
    const obra = userSession?.obraAtiva;
    if (!obra?.data_inicio) return null;

    const startDate = new Date(obra.data_inicio);
    const endDate = obra.data_termino ? new Date(obra.data_termino) : null;
    const today = new Date();

    if (!endDate) {
      return {
        hasEndDate: false,
        startDate: format(startDate, "dd/MM/yyyy", { locale: ptBR }),
      };
    }

    const totalDays = differenceInCalendarDays(endDate, startDate);
    const elapsedDays = differenceInCalendarDays(today, startDate);
    const remainingDays = differenceInCalendarDays(endDate, today);
    const percentageElapsed = totalDays > 0 ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)) : 0;
    const isOverdue = remainingDays < 0;
    const isCompleted = obra.status === "concluida";
    const isUrgent = remainingDays <= 30 && remainingDays > 0;

    return {
      hasEndDate: true,
      startDate: format(startDate, "dd/MM/yyyy", { locale: ptBR }),
      endDate: format(endDate, "dd/MM/yyyy", { locale: ptBR }),
      totalDays,
      elapsedDays: Math.max(0, elapsedDays),
      remainingDays: Math.abs(remainingDays),
      percentageElapsed: Math.round(percentageElapsed),
      isOverdue,
      isCompleted,
      isUrgent,
    };
  }, [userSession?.obraAtiva]);

  if (!projectInfo) return null;

  if (!projectInfo.hasEndDate) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-border/50 shadow-lg overflow-hidden h-full">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Cronograma</h3>
              <p className="text-xs text-muted-foreground">Início: {projectInfo.startDate}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Data de término não definida</p>
        </CardContent>
      </Card>
    );
  }

  const {
    startDate,
    endDate,
    totalDays,
    elapsedDays,
    remainingDays,
    percentageElapsed,
    isOverdue,
    isCompleted,
    isUrgent,
  } = projectInfo;

  const getGradientColors = () => {
    if (isCompleted) return "from-emerald-500/10 via-emerald-500/5 to-transparent";
    if (isOverdue) return "from-red-500/10 via-red-500/5 to-transparent";
    if (isUrgent) return "from-amber-500/10 via-amber-500/5 to-transparent";
    return "from-primary/10 via-primary/5 to-transparent";
  };

  const getAccentColor = () => {
    if (isCompleted) return "text-emerald-600";
    if (isOverdue) return "text-red-600";
    if (isUrgent) return "text-amber-600";
    return "text-primary";
  };

  const getProgressColor = () => {
    if (isCompleted) return "bg-emerald-500";
    if (isOverdue) return "bg-red-500";
    if (percentageElapsed > 80) return "bg-amber-500";
    return "bg-primary";
  };

  const getBadgeStyles = () => {
    if (isCompleted) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (isOverdue) return "bg-red-100 text-red-700 border-red-200";
    if (isUrgent) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-primary/10 text-primary border-primary/20";
  };

  const getStatusText = () => {
    if (isCompleted) return "Concluída";
    if (isOverdue) return "Atrasada";
    if (isUrgent) return "Atenção";
    return "No Prazo";
  };

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (isOverdue) return <AlertTriangle className="w-3.5 h-3.5" />;
    if (isUrgent) return <AlertTriangle className="w-3.5 h-3.5" />;
    return <Clock className="w-3.5 h-3.5" />;
  };

  return (
    <Card className="relative bg-white border-border/50 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden h-full group">
      {/* Animated gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getGradientColors()} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-xl" />

      <CardContent className="relative p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
                isOverdue
                  ? "bg-gradient-to-br from-red-500 to-red-600"
                  : isUrgent
                    ? "bg-gradient-to-br from-amber-500 to-amber-600"
                    : isCompleted
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                      : "bg-gradient-to-br from-primary to-primary/80"
              }`}
            >
              <Timer className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Previsão da Obra</h3>
              {/* CORREÇÃO AQUI: Alterado de text-xs para text-[10px] */}
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                {startDate} - {endDate}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${getBadgeStyles()} ${isUrgent && !isOverdue && !isCompleted ? "animate-pulse" : ""}`}
          >
            {getStatusIcon()}
            {getStatusText()}
          </span>
        </div>

        {/* Main countdown */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-4">
            {isOverdue ? (
              <div className="space-y-1">
                <div className={`text-4xl font-bold ${getAccentColor()} tabular-nums animate-pulse`}>
                  {remainingDays}
                </div>
                <p className="text-sm text-red-600 font-medium">
                  {remainingDays === 1 ? "dia de atraso" : "dias de atraso"}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <div
                  className={`text-4xl font-bold ${getAccentColor()} tabular-nums ${isUrgent ? "animate-pulse" : ""}`}
                >
                  {remainingDays}
                </div>
                <p className="text-sm text-muted-foreground">
                  {remainingDays === 1 ? "dia restante" : "dias restantes"}
                </p>
              </div>
            )}
          </div>

          {/* Progress section */}
          <div className="space-y-3 mt-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Progresso do Tempo</span>
              <span className={`font-bold ${getAccentColor()}`}>{percentageElapsed}%</span>
            </div>

            {/* Progress bar with animation */}
            <div className="relative h-2.5 bg-muted/60 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${getProgressColor()}`}
                style={{ width: `${Math.min(100, percentageElapsed)}%` }}
              />
              {/* Animated shine effect */}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]"
                style={{ width: `${Math.min(100, percentageElapsed)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {elapsedDays} de {totalDays} dias
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                decorridos
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(ProjectCountdown);
