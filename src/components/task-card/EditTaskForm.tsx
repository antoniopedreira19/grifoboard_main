import { Task, DayOfWeek } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Users, Briefcase, Layers, HardHat, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegistry } from "@/context/RegistryContext";

interface EditTaskFormProps {
  task: Task;
  editFormData: any;
  onEditFormChange: (field: string, value: string) => void;
  onDayToggle: (day: DayOfWeek) => void;
  onDelete: () => void;
  onSave: () => Promise<void> | void;
  onCancel?: () => void;
  isFormValid: () => boolean;
  onWeekDateChange: (date: Date) => void;
}

const EditTaskForm: React.FC<EditTaskFormProps> = ({
  editFormData,
  onEditFormChange,
  onDayToggle,
  onSave,
  onCancel,
  isFormValid,
}) => {
  const { sectors, disciplines, teams, responsibles, executors } = useRegistry();

  const days: { key: DayOfWeek; label: string }[] = [
    { key: "mon", label: "Seg" },
    { key: "tue", label: "Ter" },
    { key: "wed", label: "Qua" },
    { key: "thu", label: "Qui" },
    { key: "fri", label: "Sex" },
    { key: "sat", label: "Sáb" },
    { key: "sun", label: "Dom" },
  ];

  // Helper para garantir que o valor atual apareça na lista mesmo se foi deletado do registro
  const ensureOption = (options: string[], currentValue: string) => {
    if (currentValue && !options.includes(currentValue)) {
      return [currentValue, ...options];
    }
    return options;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <ScrollArea className="flex-1 w-full">
        <div className="p-6 space-y-8">
          {/* Seção 1: Definição */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <Briefcase className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Definição da Atividade</h3>
            </div>

            <div className="grid gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">
                  Descrição da Tarefa <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  value={editFormData.description}
                  onChange={(e) => onEditFormChange("description", e.target.value)}
                  className="resize-none bg-slate-50 border-slate-200 focus:bg-white transition-colors min-h-[80px]"
                  placeholder="Ex: Instalação de tubulação de água fria no 3º Pavimento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">
                    Setor <span className="text-red-500">*</span>
                  </Label>
                  <Select value={editFormData.sector} onValueChange={(val) => onEditFormChange("sector", val)}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ensureOption(sectors, editFormData.sector).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">Disciplina</Label>
                  <Select value={editFormData.discipline} onValueChange={(val) => onEditFormChange("discipline", val)}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ensureOption(disciplines, editFormData.discipline).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2: Equipe */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Equipe Responsável</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">
                  Responsável <span className="text-red-500">*</span>
                </Label>
                <Select value={editFormData.responsible} onValueChange={(val) => onEditFormChange("responsible", val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureOption(responsibles, editFormData.responsible).map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-500">Executante</Label>
                <Select value={editFormData.team} onValueChange={(val) => onEditFormChange("team", val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureOption(teams, editFormData.team).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold text-slate-500">Encarregado</Label>
                <Select value={editFormData.executor} onValueChange={(val) => onEditFormChange("executor", val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 focus:bg-white">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ensureOption(executors, editFormData.executor).map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Seção 3: Planejamento */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Planejamento Semanal</h3>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
              <Label className="text-xs font-semibold text-slate-500 mb-4 block">
                Dias de Execução <span className="text-red-500">*</span>
              </Label>
              <div className="flex justify-between items-center gap-2">
                {days.map((day) => {
                  const isSelected = editFormData.plannedDays.includes(day.key);
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => onDayToggle(day.key)}
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
      </ScrollArea>

      <div className="flex-none p-4 bg-white border-t border-slate-100 flex justify-end gap-3 shadow-[-10px_0_20px_rgba(0,0,0,0.02)] z-20">
        <Button variant="outline" onClick={onCancel} className="border-slate-200 text-slate-600 hover:bg-slate-50">
          Cancelar
        </Button>
        <Button
          onClick={onSave}
          disabled={!isFormValid()}
          className={cn(
            "gap-2 px-6 shadow-lg transition-all",
            isFormValid() ? "bg-primary hover:bg-primary/90" : "bg-slate-300 cursor-not-allowed",
          )}
        >
          <Save className="h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};

export default EditTaskForm;
