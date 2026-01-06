import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface TaskFiltersProps {
  tasks: Task[];
  onFiltersChange: (filteredTasks: Task[]) => void;
  selectedCause: string | null;
  sortBy: "none" | "sector" | "executor" | "discipline";
  onSortChange: (sortBy: "none" | "sector" | "executor" | "discipline") => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ tasks, onFiltersChange, selectedCause, sortBy, onSortChange }) => {
  const isMobile = useIsMobile();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("all");
  const [filterDiscipline, setFilterDiscipline] = useState("all");
  const [filterResponsible, setFilterResponsible] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterExecutor, setFilterExecutor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // Memoized unique filter options
  const sectors = useMemo(() => Array.from(new Set(tasks.map(task => task.sector))).filter(Boolean), [tasks]);
  const disciplines = useMemo(() => Array.from(new Set(tasks.map(task => task.discipline))).filter(Boolean), [tasks]);
  const responsibles = useMemo(() => Array.from(new Set(tasks.map(task => task.responsible))).filter(Boolean), [tasks]);
  const teams = useMemo(() => Array.from(new Set(tasks.map(task => task.team))).filter(Boolean), [tasks]);
  const executors = useMemo(() => Array.from(new Set(tasks.map(task => task.executor).filter(Boolean))).filter(Boolean), [tasks]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterSector !== "all") count++;
    if (filterDiscipline !== "all") count++;
    if (filterResponsible !== "all") count++;
    if (filterTeam !== "all") count++;
    if (filterExecutor !== "all") count++;
    if (filterStatus !== "all") count++;
    return count;
  }, [filterSector, filterDiscipline, filterResponsible, filterTeam, filterExecutor, filterStatus]);

  // Debounce search term
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Memoized filter and sort logic
  const processedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      const matchesSearch = 
        debouncedSearchTerm === "" ||
        task.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        task.item.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        
      const matchesSector = filterSector === "all" || task.sector === filterSector;
      const matchesDiscipline = filterDiscipline === "all" || task.discipline === filterDiscipline;
      const matchesResponsible = filterResponsible === "all" || task.responsible === filterResponsible;
      const matchesTeam = filterTeam === "all" || task.team === filterTeam;
      const matchesExecutor = filterExecutor === "all" || task.executor === filterExecutor;
      
      const matchesStatus = filterStatus === "all" || 
                          (filterStatus === "completed" && task.isFullyCompleted) ||
                          (filterStatus === "not_completed" && !task.isFullyCompleted);
      
      return matchesSearch && matchesSector && matchesDiscipline && matchesResponsible && matchesTeam && matchesExecutor && matchesStatus;
    });

    // Apply sorting/grouping in alphabetical order
    if (sortBy !== "none") {
      filtered.sort((a, b) => {
        let valueA = "";
        let valueB = "";
        
        if (sortBy === "sector") {
          valueA = (a.sector || "").toLowerCase();
          valueB = (b.sector || "").toLowerCase();
        } else if (sortBy === "executor") {
          valueA = (a.team || "").toLowerCase();
          valueB = (b.team || "").toLowerCase();
        } else if (sortBy === "discipline") {
          valueA = (a.discipline || "").toLowerCase();
          valueB = (b.discipline || "").toLowerCase();
        }
        
        return valueA.localeCompare(valueB, 'pt-BR');
      });
    }

    return filtered;
  }, [tasks, debouncedSearchTerm, filterSector, filterDiscipline, filterResponsible, filterTeam, filterExecutor, filterStatus, sortBy]);

  // Only call onFiltersChange when processedTasks changes
  useEffect(() => {
    onFiltersChange(processedTasks);
  }, [processedTasks, onFiltersChange]);

  // Reset filters when selectedCause changes
  useEffect(() => {
    setSearchTerm("");
    setFilterSector("all");
    setFilterDiscipline("all");
    setFilterResponsible("all");
    setFilterTeam("all");
    setFilterExecutor("all");
    setFilterStatus("all");
    // Don't reset sortBy when cause changes
  }, [selectedCause]);

  const clearAllFilters = () => {
    setFilterSector("all");
    setFilterDiscipline("all");
    setFilterResponsible("all");
    setFilterTeam("all");
    setFilterExecutor("all");
    setFilterStatus("all");
    setSearchTerm("");
  };

  // Mobile: Filtros em Sheet/Modal
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 mb-4">
        {/* Busca + Botão de filtros */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 h-10"
          />
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 relative shrink-0">
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle>Filtros</SheetTitle>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
                      <X className="h-4 w-4 mr-1" />
                      Limpar ({activeFiltersCount})
                    </Button>
                  )}
                </div>
              </SheetHeader>
              
              <div className="space-y-4 overflow-y-auto pb-6">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Concluídas</SelectItem>
                      <SelectItem value="not_completed">Não Concluídas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Setor</label>
                  <Select value={filterSector} onValueChange={setFilterSector}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Setor" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      {sectors.map(sector => (
                        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Disciplina</label>
                  <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Disciplina" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      {disciplines.map(discipline => (
                        <SelectItem key={discipline} value={discipline}>{discipline}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Responsável</label>
                  <Select value={filterResponsible} onValueChange={setFilterResponsible}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Responsável" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      {responsibles.map(responsible => (
                        <SelectItem key={responsible} value={responsible}>{responsible}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Executante</label>
                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Executante" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team} value={team}>{team}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Encarregado</label>
                  <Select value={filterExecutor} onValueChange={setFilterExecutor}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Encarregado" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      {executors.map(executor => (
                        <SelectItem key={executor} value={executor}>{executor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  className="w-full h-12" 
                  onClick={() => setIsFilterOpen(false)}
                >
                  Aplicar Filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  }

  // Desktop: Layout original
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-shrink-0 w-[200px]">
          <div className="text-xs text-muted-foreground mb-1">Busca</div>
          <Input
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex-shrink-0">
          <div className="text-xs text-muted-foreground mb-1">Status</div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
              <SelectItem value="not_completed">Não Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-shrink-0">
          <div className="text-xs text-muted-foreground mb-1">Setor</div>
          <Select value={filterSector} onValueChange={setFilterSector}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos</SelectItem>
              {sectors.map(sector => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-shrink-0">
          <div className="text-xs text-muted-foreground mb-1">Disciplina</div>
          <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos</SelectItem>
              {disciplines.map(discipline => (
                <SelectItem key={discipline} value={discipline}>{discipline}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-shrink-0">
          <div className="text-xs text-muted-foreground mb-1">Responsável</div>
          <Select value={filterResponsible} onValueChange={setFilterResponsible}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos</SelectItem>
              {responsibles.map(responsible => (
                <SelectItem key={responsible} value={responsible}>{responsible}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-shrink-0">
          <div className="text-xs text-muted-foreground mb-1">Executante</div>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Executante" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos</SelectItem>
              {teams.map(team => (
                <SelectItem key={team} value={team}>{team}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-shrink-0">
          <div className="text-xs text-muted-foreground mb-1">Encarregado</div>
          <Select value={filterExecutor} onValueChange={setFilterExecutor}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Encarregado" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Todos</SelectItem>
              {executors.map(executor => (
                <SelectItem key={executor} value={executor}>{executor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default TaskFilters;
