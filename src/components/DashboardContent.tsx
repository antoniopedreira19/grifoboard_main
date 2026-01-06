import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTaskManager } from "@/hooks/useTaskManager";
import { Loader2, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import PCPOverallCard from "@/components/chart/PCPOverallCard";
import PCPWeeklyChart from "@/components/chart/PCPWeeklyChart";
import PCPBreakdownCard from "@/components/chart/PCPBreakdownCard";
import WeeklyCausesChart from "@/components/dashboard/WeeklyCausesChart";
import WeekNavigation from "@/components/WeekNavigation";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

const DashboardContent = () => {
  const { userSession } = useAuth();

  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });

  const { tasks, isLoading, pcpData } = useTaskManager(weekStartDate);

  const handlePreviousWeek = () => {
    setWeekStartDate((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStartDate((prev) => addDays(prev, 7));
  };

  if (!userSession?.obraAtiva) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-primary">Nenhuma obra selecionada</h2>
        <p className="text-muted-foreground">Selecione uma obra no menu lateral para visualizar os dados.</p>
      </div>
    );
  }

  const safeTasks = tasks || [];

  const stats = useMemo(() => [
    {
      label: "Total de Tarefas",
      value: safeTasks.length,
      icon: CheckCircle2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "PCP Geral",
      value: `${Math.round(pcpData?.overall?.percentage || 0)}%`,
      icon: TrendingUp,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Tarefas Pendentes",
      value: safeTasks.filter((t) => !t.isFullyCompleted).length,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ], [safeTasks, pcpData?.overall?.percentage]);

  const cardHoverEffect =
    "hover:shadow-xl transition-all duration-300 hover:scale-[1.01] cursor-pointer border-border/60 shadow-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral da obra <span className="font-semibold text-primary">{userSession.obraAtiva.nome_obra}</span>
            </p>
          </div>
        </div>

        <WeekNavigation
          weekStartDate={weekStartDate}
          weekEndDate={weekEndDate}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-secondary" />
        </div>
      ) : (
        <>
          {/* Grid de KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="animate-fade-in">
                <Card className="bg-white hover:shadow-md transition-all hover:-translate-y-1 border-border/60 shadow-sm">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-bold font-heading text-primary">{stat.value}</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Gráfico de Evolução Semanal */}
            <div className="lg:col-span-2 h-full animate-fade-in">
              <Card className={`bg-white h-full ${cardHoverEffect}`}>
                <CardHeader>
                  <CardTitle className="text-primary font-heading">Evolução do PCP</CardTitle>
                  <CardDescription>Histórico completo de todas as semanas do projeto</CardDescription>
                </CardHeader>
                <CardContent>
                  <PCPWeeklyChart barColor="#112232" />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="animate-fade-in">
                <PCPOverallCard
                  data={pcpData?.overall || { completedTasks: 0, totalTasks: 0, percentage: 0 }}
                  className={`bg-white ${cardHoverEffect}`}
                />
              </div>

              {/* 2. Causas da Semana */}
              <div className="animate-fade-in">
                <WeeklyCausesChart
                  tasks={safeTasks}
                  weekStartDate={weekStartDate}
                  className={`bg-white ${cardHoverEffect}`}
                />
              </div>
            </div>
          </div>

          {/* 3. Detalhamento por Setor */}
          <div className="animate-fade-in">
            <Card className={`bg-white ${cardHoverEffect}`}>
              <CardHeader>
                <CardTitle className="text-primary font-heading">Detalhamento por Setor</CardTitle>
              </CardHeader>
              <CardContent>
                <PCPBreakdownCard title="" data={pcpData?.bySector || {}} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardContent;
