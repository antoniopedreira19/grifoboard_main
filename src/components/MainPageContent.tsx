import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import TaskForm from "@/components/TaskForm";
import WeekNavigation from "@/components/WeekNavigation";
import RegistryDialog from "@/components/RegistryDialog";
import { getPreviousWeekDates, getNextWeekDates, getWeekStartDate } from "@/utils/pcp";
import { useToast } from "@/hooks/use-toast";
import { useTaskManager } from "@/hooks/useTaskManager";
import MainHeader from "@/components/MainHeader";
import PCPSection from "@/components/PCPSection";
import TasksSection from "@/components/TasksSection";
import ProjectCountdown from "@/components/dashboard/ProjectCountdown";
import { Loader2, LayoutList, PieChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load analytics components to improve tab switching performance
const PCPWeeklyChart = lazy(() => import("@/components/chart/PCPWeeklyChart"));
const PCPGeneralCard = lazy(() => import("@/components/chart/PCPGeneralCard"));
const AllCausesChart = lazy(() => import("@/components/chart/AllCausesChart"));
const ExecutorRankingChart = lazy(() => import("@/components/chart/ExecutorRankingChart"));
const BreakdownWithFilter = lazy(() => import("@/components/chart/BreakdownWithFilter"));

const AnalyticsLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 text-secondary animate-spin" />
  </div>
);

const MainPageContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [selectedCause, setSelectedCause] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"none" | "sector" | "executor" | "discipline">("none");
  const [activeTab, setActiveTab] = useState("planning");

  const [weekStartDate, setWeekStartDate] = useState(getWeekStartDate(new Date()));

  const [weekEndDate, setWeekEndDate] = useState(new Date());

  useEffect(() => {
    const endDate = new Date(weekStartDate);

    endDate.setDate(endDate.getDate() + 6);

    setWeekEndDate(endDate);
  }, [weekStartDate]);

  const {
    tasks,

    isLoading,

    pcpData,

    weeklyPCPData,

    handleTaskUpdate,

    handleTaskDelete,

    handleTaskCreate,

    handleTaskDuplicate,

    handleCopyToNextWeek,
  } = useTaskManager(weekStartDate);

  const handleCauseSelect = (cause: string) => {
    if (selectedCause === cause) {
      setSelectedCause(null);
    } else {
      setSelectedCause(cause);
    }
  };

  const navigateToPreviousWeek = () => {
    const { start } = getPreviousWeekDates(weekStartDate);

    setWeekStartDate(start);

    setSelectedCause(null);
  };

  const navigateToNextWeek = () => {
    const { start } = getNextWeekDates(weekStartDate);

    setWeekStartDate(start);

    setSelectedCause(null);
  };

  return (
    <div className="container mx-auto max-w-[1600px] px-0 sm:px-3 md:px-6 py-2 md:py-6 min-h-screen pb-24 space-y-3 md:space-y-6">
      {/* 1. Header Global */}
      <MainHeader
        onNewTaskClick={() => setIsFormOpen(true)}
        onRegistryClick={() => setIsRegistryOpen(true)}
        onChecklistClick={() => navigate("/checklist")}
      />

      {/* 2. Sistema de Abas - Design Premium */}
      <Tabs defaultValue="planning" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 md:space-y-6">
        {/* Header Unificado - NÃO sticky no mobile */}
        <div className={`bg-gradient-to-r from-white via-white to-slate-50/80 rounded-xl md:rounded-2xl shadow-md md:shadow-lg border border-border/40 p-2 ${!isMobile ? 'sticky top-0 z-20' : ''} backdrop-blur-xl`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 md:gap-3">
            {/* Tabs com design refinado */}
            <TabsList className="bg-slate-100/80 p-1 md:p-1.5 rounded-lg md:rounded-xl h-auto w-full lg:w-auto">
              <TabsTrigger
                value="planning"
                className="gap-1.5 md:gap-2.5 px-3 md:px-5 py-2 md:py-2.5 rounded-md md:rounded-lg text-xs md:text-sm font-medium transition-all duration-200
                  data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/10
                  data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-white/50"
              >
                <LayoutList className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>Planejamento</span>
              </TabsTrigger>

              <TabsTrigger
                value="analytics"
                className="gap-1.5 md:gap-2.5 px-3 md:px-5 py-2 md:py-2.5 rounded-md md:rounded-lg text-xs md:text-sm font-medium transition-all duration-200
                  data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:shadow-primary/10
                  data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-white/50"
              >
                <PieChart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>Indicadores</span>
              </TabsTrigger>
            </TabsList>

            {/* Week Navigation - Sempre ativo */}
            <div className="flex items-center gap-2">
              <WeekNavigation
                weekStartDate={weekStartDate}
                weekEndDate={weekEndDate}
                onPreviousWeek={navigateToPreviousWeek}
                onNextWeek={navigateToNextWeek}
              />
            </div>
          </div>
        </div>

        {/* === ABA 1: PLANEJAMENTO (OPERACIONAL) === */}
        {/* forceMount keeps it mounted, hidden class hides it when not active */}
        <TabsContent 
          value="planning" 
          className="space-y-6 outline-none data-[state=inactive]:hidden"
          forceMount
        >
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <PCPSection
                pcpData={pcpData}
                weeklyPCPData={weeklyPCPData}
                tasks={tasks}
                selectedCause={selectedCause}
                onCauseSelect={handleCauseSelect}
                onClearFilter={() => setSelectedCause(null)}
              />
            </div>
            <div className="lg:col-span-1 animate-fade-in">
              <ProjectCountdown />
            </div>
          </div>

          {/* Mostrar loading apenas na primeira carga (sem tarefas) */}
          {isLoading && tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 text-secondary animate-spin" />
              <p className="text-muted-foreground font-medium">Carregando planejamento...</p>
            </div>
          ) : (
            <TasksSection
              tasks={tasks}
              isLoading={false}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onTaskDuplicate={handleTaskDuplicate}
              onCopyToNextWeek={handleCopyToNextWeek}
              selectedCause={selectedCause}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          )}
        </TabsContent>

        {/* === ABA 2: INDICADORES (ESTRATÉGICO - DADOS GLOBAIS) === */}
        <TabsContent value="analytics" className="space-y-6 outline-none">
          {activeTab === "analytics" && (
            <Suspense fallback={<AnalyticsLoader />}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de Evolução Semanal */}
                <div className="lg:col-span-2 h-full">
                  <Card className="bg-white h-full border-border/60 shadow-sm hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="text-primary font-heading">Evolução do PCP</CardTitle>
                      <CardDescription>Histórico completo de todas as semanas do projeto</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PCPWeeklyChart barColor="#112232" />
                    </CardContent>
                  </Card>
                </div>

                <PCPGeneralCard
                  className="bg-white border-border/60 shadow-sm hover:shadow-xl transition-shadow duration-300"
                />
              </div>

              {/* Causas e Ranking */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AllCausesChart
                  className="bg-white border-border/60 shadow-sm hover:shadow-xl transition-shadow duration-300"
                />
                <ExecutorRankingChart
                  className="shadow-sm hover:shadow-xl transition-shadow duration-300"
                />
              </div>

              {/* Detalhamento */}
              <div className="grid grid-cols-1 gap-6">
                <BreakdownWithFilter
                  className="bg-white border-border/60 shadow-sm hover:shadow-xl transition-shadow duration-300"
                />
              </div>
            </Suspense>
          )}
        </TabsContent>
      </Tabs>

      <TaskForm
        onTaskCreate={handleTaskCreate}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        currentWeekStartDate={weekStartDate}
      />

      <RegistryDialog isOpen={isRegistryOpen} onOpenChange={setIsRegistryOpen} />
    </div>
  );
};

export default MainPageContent;
