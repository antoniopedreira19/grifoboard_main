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
  MapPin,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Agenda() {
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "reuniao":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "visita":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "entrega":
        return "bg-green-100 text-green-700 border-green-200";
      case "milestone":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-[1600px] h-[calc(100vh-2rem)] flex flex-col gap-4 overflow-hidden">
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
                  <Label>Participantes (separe por vírgula)</Label>
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
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 shrink-0">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 border-r border-slate-100 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
              {calendarDays.map((day, idx) => {
                const dayEvents = events.filter((e) => isSameDay(parseISO(e.start_date), day));
                const isTodayDate = isToday(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "border-b border-r border-slate-100 p-2 flex flex-col gap-1 transition-colors min-h-0", // min-h-0 crucial para nested flex
                      !isCurrentMonth && "bg-slate-50/50 text-slate-400",
                      isTodayDate && "bg-blue-50/30",
                    )}
                  >
                    <div className="flex justify-between items-center mb-1 shrink-0">
                      <span
                        className={cn(
                          "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                          isTodayDate ? "bg-primary text-white shadow-sm" : "text-slate-700",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                          {dayEvents.length}
                        </Badge>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "text-[10px] px-1.5 py-1 rounded border shadow-sm truncate font-medium cursor-pointer hover:opacity-80 transition-opacity",
                            getCategoryColor(event.category),
                          )}
                          title={`${event.title} - ${format(parseISO(event.start_date), "HH:mm")}`}
                        >
                          <span className="font-bold opacity-75 mr-1">
                            {format(parseISO(event.start_date), "HH:mm")}
                          </span>
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {events.length === 0 && (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center gap-3">
                  <CalendarIcon className="w-10 h-10 opacity-20" />
                  <p>Nenhum evento neste período.</p>
                </div>
              )}
              {events.map((event) => (
                <div key={event.id} className="flex gap-4 group">
                  <div className="w-16 flex flex-col items-center pt-1 shrink-0">
                    <span className="text-2xl font-bold text-slate-700">
                      {format(parseISO(event.start_date), "dd")}
                    </span>
                    <span className="text-xs uppercase font-semibold text-slate-400">
                      {format(parseISO(event.start_date), "EEE", { locale: ptBR })}
                    </span>
                  </div>

                  <Card className="flex-1 border-l-4 border-l-primary hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                      <div className="space-y-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg text-slate-800">{event.title}</h3>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] capitalize", getCategoryColor(event.category))}
                          >
                            {event.category}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                        )}

                        <div className="flex flex-wrap gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {format(parseISO(event.start_date), "HH:mm")} - {format(parseISO(event.end_date), "HH:mm")}
                          </div>
                          {event.participants && event.participants.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Users className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[300px]">{event.participants.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
