import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { addDays, format } from "date-fns";
import { usePmpData } from "@/hooks/usePmpData";
import { usePmpMutations } from "@/hooks/usePmpMutations";
import {
  PmpHeader,
  PmpKanbanBoard,
  PmpRestricoesPanel,
  PmpPlantaSetores,
  PmpAtividadeModal,
  PmpSetorModal,
} from "@/components/pmp";
import { NoObraSelected } from "@/components/shared/NoObraSelected";
import type { PmpAtividade, PmpFormData, Restricao, ColorKey } from "@/types/pmp";
import { safeParseDate } from "@/utils/pmpDateUtils";

const PMP = () => {
  const { toast } = useToast();

  // Custom hooks para dados e mutations
  const {
    obraAtiva,
    setores,
    atividades,
    weeks,
    todasRestricoes,
    urgencyInfo,
    isLoadingAtividades,
    getTasksForWeek,
    getNextOrder,
    refetchSetores,
  } = usePmpData();

  const {
    saveMutation,
    moveMutation,
    deleteMutation,
    toggleCheckMutation,
    resolveRestricaoMutation,
    deleteRestricaoMutation,
    addSetorMutation,
    uploadPlantaMutation,
    removePlantaMutation,
  } = usePmpMutations(obraAtiva?.id);

  // Estados do modal e filtros
  const [responsavelFilter, setResponsavelFilter] = useState<string>("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PmpFormData>({
    titulo: "",
    cor: "yellow" as ColorKey,
    responsavel: "",
    data_inicio: "",
    data_termino: "",
    setor: "",
  });
  const [restricoesTemp, setRestricoesTemp] = useState<Restricao[]>([]);

  // Handlers
  const handleOpenAdd = useCallback((weekId: string) => {
    const weekDate = safeParseDate(weekId);
    const endDate = weekDate ? addDays(weekDate, 5) : new Date();
    
    setEditingId(null);
    setFormData({
      titulo: "",
      cor: "yellow",
      responsavel: "",
      data_inicio: weekId,
      data_termino: format(endDate, "yyyy-MM-dd"),
      setor: "",
    });
    setRestricoesTemp([]);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((atividade: PmpAtividade) => {
    setEditingId(atividade.id);
    setFormData({
      titulo: atividade.titulo,
      cor: (atividade.cor as ColorKey) || "yellow",
      responsavel: atividade.responsavel || "",
      data_inicio: atividade.data_inicio?.split("T")[0] || "",
      data_termino: atividade.data_termino?.split("T")[0] || "",
      setor: atividade.setor || "",
    });
    setRestricoesTemp(atividade.pmp_restricoes || []);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
  }, []);

  const handleSaveAtividade = useCallback(
    (data: { formData: PmpFormData; restricoesNovas: Restricao[] }) => {
      if (!data.formData.titulo) {
        toast({ title: "Título obrigatório", variant: "destructive" });
        return;
      }

      const semanaRef = data.formData.data_inicio || format(new Date(), "yyyy-MM-dd");

      saveMutation.mutate(
        {
          editingId,
          formData: {
            ...data.formData,
            semana_referencia: semanaRef,
          },
          restricoesNovas: data.restricoesNovas,
          currentMaxOrder: getNextOrder() - 1000,
        },
        {
          onSuccess: () => handleCloseModal(),
        }
      );
    },
    [editingId, saveMutation, getNextOrder, handleCloseModal, toast]
  );

  const handleToggleCheck = useCallback(
    (id: string, currentStatus: boolean, hasRestrictions: boolean) => {
      if (!currentStatus && hasRestrictions) {
        toast({
          title: "Restrições Pendentes",
          description: "Você deve resolver todas as restrições antes de concluir esta atividade.",
          variant: "destructive",
        });
        return;
      }
      toggleCheckMutation.mutate({ id, novoStatus: !currentStatus });
    },
    [toggleCheckMutation, toast]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation]
  );

  const handleMove = useCallback(
    (params: {
      id: string;
      semana_referencia: string;
      data_inicio?: string | null;
      data_termino?: string | null;
      ordem?: number;
    }) => {
      moveMutation.mutate(params);
    },
    [moveMutation]
  );

  const handleResolveRestricao = useCallback(
    (id: string, resolvido: boolean) => {
      resolveRestricaoMutation.mutate({ id, resolvido });
    },
    [resolveRestricaoMutation]
  );

  const handleAddSetor = useCallback(
    (setor: string) => {
      addSetorMutation.mutate(setor, {
        onSuccess: () => {
          setIsSetorModalOpen(false);
          refetchSetores();
        },
      });
    },
    [addSetorMutation, refetchSetores]
  );

  const handleUploadPlanta = useCallback(
    (file: File) => {
      uploadPlantaMutation.mutate(file);
    },
    [uploadPlantaMutation]
  );

  const handleRemovePlanta = useCallback(() => {
    removePlantaMutation.mutate();
  }, [removePlantaMutation]);

  // Lista de responsáveis únicos para o filtro
  const responsaveisUnicos = useMemo(() => {
    const set = new Set<string>();
    atividades.forEach((a) => {
      if (a.responsavel) set.add(a.responsavel);
    });
    return Array.from(set).sort();
  }, [atividades]);

  // Função de filtro para tarefas por semana
  const getFilteredTasksForWeek = useCallback(
    (weekId: string) => {
      const tasks = getTasksForWeek(weekId);
      if (responsavelFilter === "todos") return tasks;
      return tasks.filter((t) => t.responsavel === responsavelFilter);
    },
    [getTasksForWeek, responsavelFilter]
  );

  // Early return se não houver obra
  if (!obraAtiva) {
    return <NoObraSelected />;
  }

  return (
    <div className="min-h-screen flex flex-col space-y-4 font-sans bg-slate-50/30 pb-20">
      {/* Header */}
      <PmpHeader
        nomeObra={obraAtiva.nome_obra}
        totalSemanas={weeks.length}
        urgencyInfo={urgencyInfo}
      />

      {/* Kanban Board */}
      <PmpKanbanBoard
        weeks={weeks}
        getTasksForWeek={getFilteredTasksForWeek}
        onOpenAdd={handleOpenAdd}
        onOpenEdit={handleOpenEdit}
        onDelete={handleDelete}
        onToggleCheck={handleToggleCheck}
        onMove={handleMove}
        responsaveis={responsaveisUnicos}
        responsavelFilter={responsavelFilter}
        onResponsavelFilterChange={setResponsavelFilter}
      />

      {/* Painel de Restrições */}
      <PmpRestricoesPanel
        restricoes={todasRestricoes}
        isLoading={isLoadingAtividades}
        onResolve={handleResolveRestricao}
      />

      {/* Planta de Setores */}
      <PmpPlantaSetores
        plantaUrl={obraAtiva.pmp_planta_url}
        isUploading={uploadPlantaMutation.isPending || removePlantaMutation.isPending}
        onUpload={handleUploadPlanta}
        onRemove={handleRemovePlanta}
      />

      {/* Modal de Atividade */}
      <PmpAtividadeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAtividade}
        onOpenSetorModal={() => setIsSetorModalOpen(true)}
        editingId={editingId}
        initialFormData={formData}
        initialRestricoes={restricoesTemp}
        setores={setores}
        isSaving={saveMutation.isPending}
      />

      {/* Modal de Setor */}
      <PmpSetorModal
        isOpen={isSetorModalOpen}
        onClose={() => setIsSetorModalOpen(false)}
        onSave={handleAddSetor}
        isSaving={addSetorMutation.isPending}
      />
    </div>
  );
};

export default PMP;
