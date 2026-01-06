import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AtividadeChecklist } from "@/types/checklist";
import { checklistService } from "@/services/checklistService";
import ChecklistTable from "./ChecklistTable";
import ChecklistForm from "./ChecklistForm";
import ChecklistFilters from "./ChecklistFilters";
import ChecklistStats from "./ChecklistStats";
import { CheckSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChecklistContent = () => {
  const navigate = useNavigate();
  const { userSession } = useAuth();
  const { toast } = useToast();
  const [atividades, setAtividades] = useState<AtividadeChecklist[]>([]);
  const [filteredAtividades, setFilteredAtividades] = useState<AtividadeChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    local: "",
    setor: "",
    responsavel: "",
  });

  // Calculate unique values for filters
  const uniqueValues = useMemo(() => {
    const uniqueLocais = [...new Set(atividades.map((atividade) => atividade.local))].filter(Boolean).sort();
    const uniqueSetores = [...new Set(atividades.map((atividade) => atividade.setor))].filter(Boolean).sort();
    const uniqueResponsaveis = [...new Set(atividades.map((atividade) => atividade.responsavel))]
      .filter(Boolean)
      .sort();

    return {
      uniqueLocais,
      uniqueSetores,
      uniqueResponsaveis,
    };
  }, [atividades]);

  const loadAtividades = async () => {
    if (!userSession?.obraAtiva) return;

    setIsLoading(true);
    try {
      const atividadesData = await checklistService.listarAtividades(userSession.obraAtiva.id);

      setAtividades(atividadesData);
      setFilteredAtividades(atividadesData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao carregar atividades",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (filters: { local: string; setor: string; responsavel: string }) => {
    setFilters(filters);

    let filtered = atividades;

    if (filters.local) {
      filtered = filtered.filter((atividade) => atividade.local === filters.local);
    }

    if (filters.setor) {
      filtered = filtered.filter((atividade) => atividade.setor === filters.setor);
    }

    if (filters.responsavel) {
      filtered = filtered.filter((atividade) => atividade.responsavel === filters.responsavel);
    }

    setFilteredAtividades(filtered);
  };

  useEffect(() => {
    if (userSession?.obraAtiva) {
      loadAtividades();
    }
  }, [userSession?.obraAtiva]);

  useEffect(() => {
    applyFilters(filters);
  }, [atividades, filters]);

  const handleAtividadeToggle = async (atividadeId: string, concluida: boolean) => {
    try {
      await checklistService.atualizarAtividade(atividadeId, { concluida });

      setAtividades((prevAtividades) =>
        prevAtividades.map((atividade) => (atividade.id === atividadeId ? { ...atividade, concluida } : atividade)),
      );

      toast({
        title: concluida ? "Atividade concluída" : "Atividade marcada como não concluída",
        description: "Status atualizado com sucesso",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao atualizar atividade",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAtividadeDelete = async (atividadeId: string) => {
    try {
      await checklistService.excluirAtividade(atividadeId);

      setAtividades((prevAtividades) => prevAtividades.filter((atividade) => atividade.id !== atividadeId));

      toast({
        title: "Atividade excluída",
        description: "Atividade removida com sucesso",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao excluir atividade",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (!userSession?.obraAtiva) {
    return (
      <div className="container mx-auto px-12 py-8">
        <div className="text-center text-muted-foreground">Selecione uma obra para visualizar o checklist</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center">
          <div className="bg-primary/10 p-3 rounded-xl mr-4">
            <CheckSquare className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Checklist de Atividades</h1>
            <p className="text-muted-foreground text-sm">Gerencie verificações e pendências da obra</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/tarefas")}
          className="border-gray-200 hover:bg-gray-50 shadow-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Tarefas
        </Button>
      </div>

      <div className="glass-card rounded-xl shadow-lg border border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="p-6 border-b border-gray-100">
          <ChecklistForm onAtividadeCriada={loadAtividades} />
        </div>

        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <ChecklistFilters
            onFiltersChange={applyFilters}
            uniqueLocais={uniqueValues.uniqueLocais}
            uniqueSetores={uniqueValues.uniqueSetores}
            uniqueResponsaveis={uniqueValues.uniqueResponsaveis}
          />
        </div>

        <div className="p-6">
          <ChecklistStats atividades={filteredAtividades} />
        </div>

        <ChecklistTable
          atividades={filteredAtividades}
          isLoading={isLoading}
          onAtividadeToggle={handleAtividadeToggle}
          onAtividadeDelete={handleAtividadeDelete}
        />
      </div>
    </div>
  );
};

export default ChecklistContent;
