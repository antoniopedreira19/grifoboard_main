import { useState, useEffect } from "react";
import { DayOfWeek } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, Users, CalendarIcon, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRegistry } from "@/context/RegistryContext"; // Importando Contexto

interface TaskFormProps {
  onTaskCreate: (task: any) => Promise<any>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentWeekStartDate: Date;
}

const TaskForm: React.FC<TaskFormProps> = ({ onTaskCreate, isOpen, onOpenChange, currentWeekStartDate }) => {
  const { toast } = useToast();
  // Consumindo dados dos cadastros
  const { sectors, disciplines, teams, responsibles, executors, isLoading: isLoadingRegistry } = useRegistry();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    sector: "",
    discipline: "",
    description: "",
    responsible: "",
    team: "",
    executor: "",
    plannedDays: [] as DayOfWeek[],
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        sector: "",
        discipline: "",
        description: "",
        responsible: "",
        team: "",
        executor: "",
        plannedDays: [],
      });
    }
  }, [isOpen]);

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData((prev) => {
      const isSelected = prev.plannedDays.includes(day);
      return {
        ...prev,
        plannedDays: isSelected ? prev.plannedDays.filter((d) => d !== day) : [...prev.plannedDays, day],
      };
    });
  };

  const isFormValid = () => {
    return (
      formData.sector.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.responsible.trim() !== "" &&
      formData.plannedDays.length > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsLoading(true);
    try {
      await onTaskCreate({
        ...formData,
        weekStartDate: currentWeekStartDate,
      });
      onOpenChange(false);
      toast({
        title: "Sucesso",
        description: "Nova tarefa criada com sucesso.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const days: { key: DayOfWeek; label: string }[] = [
    { key: "mon", label: "Seg" },
    { key: "tue", label: "Ter" },
    { key: "wed", label: "Qua" },
    { key: "thu", label: "Qui" },
    { key: "fri", label: "Sex" },
    { key: "sat", label: "Sáb" },
    { key: "sun", label: "Dom" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 gap-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-white sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-heading font-bold text-primary">Nova Tarefa</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Adicione uma nova atividade ao cronograma</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
          {/* Seção 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-bold text-slate-700 uppercase">O que será feito?</h3>
            </div>

            <div className="grid gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">
                  Descrição <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="resize-none border-slate-200 focus:border-secondary min-h-[70px]"
                  placeholder="Descreva a atividade..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">
                    Setor <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.sector}
                    onValueChange={(value) => setFormData({ ...formData, sector: value })}
                    disabled={isLoadingRegistry}
                  >
                    <SelectTrigger className="border-slate-200 bg-white">
                      <SelectValue placeholder="Selecione o Setor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">Disciplina</Label>
                  <Select
                    value={formData.discipline}
                    onValueChange={(value) => setFormData({ ...formData, discipline: value })}
                    disabled={isLoadingRegistry}
                  >
                    <SelectTrigger className="border-slate-200 bg-white">
                      <SelectValue placeholder="Selecione a Disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplines.map((discipline) => (
                        <SelectItem key={discipline} value={discipline}>
                          {discipline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-bold text-slate-700 uppercase">Quem fará?</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">
                  Responsável <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.responsible}
                  onValueChange={(value) => setFormData({ ...formData, responsible: value })}
                  disabled={isLoadingRegistry}
                >
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {responsibles.map((resp) => (
                      <SelectItem key={resp} value={resp}>
                        {resp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Executante</Label>
                <Select
                  value={formData.team}
                  onValueChange={(value) => setFormData({ ...formData, team: value })}
                  disabled={isLoadingRegistry}
                >
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Encarregado</Label>
                <Select
                  value={formData.executor}
                  onValueChange={(value) => setFormData({ ...formData, executor: value })}
                  disabled={isLoadingRegistry}
                >
                  <SelectTrigger className="border-slate-200 bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {executors.map((exc) => (
                      <SelectItem key={exc} value={exc}>
                        {exc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Seção 3: Planejamento (Mantida igual) */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-secondary" />
              <h3 className="text-sm font-bold text-slate-700 uppercase">Quando?</h3>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center gap-2">
                {days.map((day) => {
                  const isSelected = formData.plannedDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      onClick={() => handleDayToggle(day.key)}
                      className={cn(
                        "flex flex-col items-center justify-center w-11 h-16 rounded-lg transition-all duration-200 border-2",
                        isSelected
                          ? "bg-secondary text-white border-secondary shadow-md transform -translate-y-1"
                          : "bg-slate-50 text-slate-400 border-transparent hover:bg-slate-100 hover:border-slate-200",
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase mb-1">{day.label}</span>
                      <div className={cn("w-2 h-2 rounded-full", isSelected ? "bg-white" : "bg-slate-300")} />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || isLoading}
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            {isLoading ? "Criando..." : "Criar Tarefa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;
