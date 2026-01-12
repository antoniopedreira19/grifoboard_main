import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { agendaService } from "@/services/agendaService";
import { AgendaEvent } from "@/types/agenda";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  parseISO,
  startOfWeek,
  endOfWeek,
  isBefore,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  List,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EventDetailModal } from "@/components/agenda/EventDetailModal";
import { EventEditModal } from "@/components/agenda/EventEditModal";

export default function Agenda() {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form States
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    category: "geral",
    participants: "",
    description: "",
  });

  const obraId = userSession?.obraAtiva?.id;

  const fetchEvents = async () => {
    if (!obraId) return;
    setLoading(true);
    try {
      const start = startOfMonth(subMonths(currentDate, 1));
      const end = endOfMonth(addMonths(currentDate, 1));
      const data = await agendaService.listarEventos(obraId, start, end);
      setEvents(data);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar a agenda.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, obraId]);

  const handleCreateEvent = async () => {
    if (!obraId || !newEvent.title || !newEvent.date) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }

    try {
      const startDateTime = new Date(`${newEvent.date}T${newEvent.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      await agendaService.criarEvento({
        obra_id: obraId,
        title: newEvent.title,
        description: newEvent.description,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        category: newEvent.category as any,
        participants: newEvent.participants
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      });

      toast({ title: "Sucesso", description: "Evento agendado com sucesso." });
      setIsModalOpen(false);
      fetchEvents();
      setNewEvent({ ...newEvent, title: "", description: "", participants: "" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao criar evento.", variant: "destructive" });
    }
  };

  const handleToggleComplete = async (event: AgendaEvent, e: React.MouseEvent) => {
    e.stopPropagation(); // Previne abrir detalhes se tiver clique no card
    try {
      const newStatus = !event.completed;

      // Atualização Otimista no Frontend
      setEvents((prev) => prev.map((ev) => (ev.id === event.id ? { ...ev, completed: newStatus } : ev)));

      await agendaService.toggleConclusao(event.id, newStatus);

      if (newStatus) {
        toast({ description: "Evento concluído!" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o status.", variant: "destructive" });
      fetchEvents(); // Reverte em caso de erro
    }
  };

  const handleOpenDetail = (event: AgendaEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (event: AgendaEvent) => {
    setSelectedEvent(event);
    setIsEditOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await agendaService.deletarEvento(eventId);
      toast({ description: "Evento excluído com sucesso!" });
      fetchEvents();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir evento.", variant: "destructive" });
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const getCategoryColor = (cat: string, completed: boolean) => {
    if (completed) return "bg-slate-100 text-slate-400 border-slate-200 line-through decoration-slate-400";

    switch (cat) {
      case "reuniao":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "visita":
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
      case "entrega":
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
      case "milestone":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
    }
  };

  // Helper para verificar status
  const getEventStatus = (event: AgendaEvent) => {
    const now = new Date();
    // Considera atrasado se a data final já passou e não está completo
    const isOverdue = !event.completed && isBefore(parseISO(event.end_date), now);

    return { isOverdue };
  };

  return (
    <div className="container mx-auto p-4 max-w-[1600px] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" /> Agenda da Obra
          </h1>
          <p className="text-slate-500 text-sm">Gerencie reuniões, visitas e marcos importantes.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="calendar">
                <CalendarIcon className="w-4 h-4 mr-2" /> Calendário
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="w-4 h-4 mr-2" /> Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Agendar Evento</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Título do Evento</Label>
                  <Input
                    placeholder="Ex: Reunião de Alinhamento"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={newEvent.category} onValueChange={(v) => setNewEvent({ ...newEvent, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                      <SelectItem value="visita">Visita Técnica</SelectItem>
                      <SelectItem value="entrega">Entrega de Material</SelectItem>
                      <SelectItem value="milestone">Marco Importante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Participantes</Label>
                  <Input
                    placeholder="João, Maria, Empreiteira X"
                    value={newEvent.participants}
                    onChange={(e) => setNewEvent({ ...newEvent, participants: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Assunto / Descrição</Label>
                  <Textarea
                    placeholder="Detalhes sobre o evento..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateEvent}>Confirmar Agendamento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold capitalize text-slate-800 min-w-[200px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoje
          </Button>
        </div>

        {view === "calendar" ? (
          <div className="flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 border-r border-slate-100 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* AUMENTADO AQUI: minmax(160px -> 220px) */}
            <div className="grid grid-cols-7 auto-rows-[minmax(220px,1fr)]">
              {calendarDays.map((day, idx) => {
                const dayEvents = events.filter((e) => isSameDay(parseISO(e.start_date), day));
                const isTodayDate = isToday(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      // AUMENTADO AQUI: min-h-[160px] -> min-h-[220px]
                      "border-b border-r border-slate-100 p-2 flex flex-col gap-2 transition-colors min-h-[220px]",
                      !isCurrentMonth && "bg-slate-50/50 text-slate-400",
                      isTodayDate && "bg-blue-50/20",
                    )}
                  >
                    <div className="flex justify-between items-center shrink-0">
                      <span
                        className={cn(
                          "text-base font-semibold w-8 h-8 flex items-center justify-center rounded-full",
                          isTodayDate ? "bg-primary text-white shadow-md" : "text-slate-700",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 px-2 font-medium bg-slate-100 text-slate-600"
                        >
                          {dayEvents.length} eventos
                        </Badge>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-1.5 w-full">
                      {/* AUMENTADO AQUI: slice(0, 3) -> slice(0, 5) */}
                      {dayEvents.slice(0, 5).map((event) => {
                        const { isOverdue } = getEventStatus(event);
                        return (
                          <div
                            key={event.id}
                            onClick={() => handleOpenDetail(event)}
                            className={cn(
                              "text-xs px-2.5 py-1.5 rounded-md border shadow-sm truncate font-medium cursor-pointer transition-all flex items-center gap-2 group relative",
                              getCategoryColor(event.category, event.completed),
                              isOverdue && "border-red-300 bg-red-50 text-red-700",
                            )}
                            title={`${event.title} (${format(parseISO(event.start_date), "HH:mm")})`}
                          >
                            {/* Checkbox Button */}
                            <button
                              onClick={(e) => handleToggleComplete(event, e)}
                              className={cn(
                                "shrink-0 transition-colors hover:scale-110",
                                event.completed
                                  ? "text-green-600"
                                  : isOverdue
                                    ? "text-red-500"
                                    : "text-slate-400 hover:text-primary",
                              )}
                            >
                              {event.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                            </button>

                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className={cn(
                                    "font-bold text-[10px] px-1 rounded",
                                    event.completed ? "opacity-50" : "bg-white/50 opacity-100",
                                  )}
                                >
                                  {format(parseISO(event.start_date), "HH:mm")}
                                </span>
                                <span className="truncate">{event.title}</span>
                              </div>
                              {isOverdue && (
                                <span className="text-[9px] font-bold text-red-600 flex items-center gap-1">
                                  <AlertCircle className="w-2.5 h-2.5" /> Atrasado
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* AJUSTADO AQUI: cálculo para + mais */}
                      {dayEvents.length > 5 && (
                        <span className="text-[10px] text-slate-500 font-medium px-2 py-1 hover:text-primary cursor-pointer">
                          + {dayEvents.length - 5} mais
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {events.length === 0 && (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
                  <CalendarIcon className="w-10 h-10 opacity-20" />
                  <p>Nenhum evento neste período.</p>
                </div>
              )}
              {events.map((event) => {
                const { isOverdue } = getEventStatus(event);

                return (
                  <div key={event.id} className="flex gap-4 group">
                    <div className="w-20 flex flex-col items-center pt-1 shrink-0">
                      <span className={cn("text-3xl font-bold", event.completed ? "text-slate-400" : "text-slate-700")}>
                        {format(parseISO(event.start_date), "dd")}
                      </span>
                      <span className="text-sm uppercase font-semibold text-slate-400">
                        {format(parseISO(event.start_date), "EEE", { locale: ptBR })}
                      </span>
                    </div>

                    <Card
                      onClick={() => handleOpenDetail(event)}
                      className={cn(
                        "flex-1 border-l-4 hover:shadow-md transition-all cursor-pointer",
                        event.completed
                          ? "border-l-green-500 bg-slate-50 opacity-70"
                          : isOverdue
                            ? "border-l-red-500 bg-red-50/10 border-red-200"
                            : "border-l-primary",
                      )}
                    >
                      <CardContent className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="space-y-2 w-full">
                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              onClick={(e) => handleToggleComplete(event, e)}
                              className={cn(
                                "shrink-0 transition-colors hover:scale-110 mr-2",
                                event.completed
                                  ? "text-green-600"
                                  : isOverdue
                                    ? "text-red-500"
                                    : "text-slate-400 hover:text-primary",
                              )}
                            >
                              {event.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                            </button>

                            <h3
                              className={cn(
                                "font-bold text-xl",
                                event.completed ? "text-slate-500 line-through" : "text-slate-800",
                              )}
                            >
                              {event.title}
                            </h3>

                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-2 py-0.5 capitalize",
                                getCategoryColor(event.category, event.completed),
                              )}
                            >
                              {event.category}
                            </Badge>

                            {isOverdue && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] h-5 bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                              >
                                Atrasado
                              </Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-slate-600 line-clamp-2 pl-10">{event.description}</p>
                          )}

                          <div className="flex flex-wrap gap-6 mt-3 pl-10">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Clock className="w-4 h-4" />
                              {format(parseISO(event.start_date), "HH:mm")} -{" "}
                              {format(parseISO(event.end_date), "HH:mm")}
                            </div>
                            {event.participants && event.participants.length > 0 && (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Users className="w-4 h-4" />
                                <span className="truncate max-w-[400px]">{event.participants.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <EventDetailModal
        event={selectedEvent}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteEvent}
        onUpdate={() => {
          fetchEvents();
          // Atualiza o selectedEvent com dados frescos
          if (selectedEvent) {
            const updated = events.find((e) => e.id === selectedEvent.id);
            if (updated) setSelectedEvent(updated);
          }
        }}
        obraId={obraId || ""}
      />

      <EventEditModal
        event={selectedEvent}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onUpdate={fetchEvents}
        obraId={obraId || ""}
      />
    </div>
  );
}
