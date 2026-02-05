import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { pmpService } from "@/services/pmpService";
import { registrosService } from "@/services/registroService";
import { gamificationService } from "@/services/gamificationService";
import type { PmpAtividade, Restricao } from "@/types/pmp";

interface SaveAtividadeParams {
  editingId: string | null;
  formData: {
    titulo: string;
    cor: string;
    responsavel: string;
    data_inicio: string;
    data_termino: string;
    setor: string;
    semana_referencia: string;
  };
  restricoesNovas: Restricao[];
  restricoesParaDeletar: string[];
  currentMaxOrder: number;
}

export const usePmpMutations = (obraId: string | undefined) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userSession } = useAuth();
  const userId = userSession?.user?.id;

  // Keys para invalidação
  const atividadesKey = ["pmp_atividades", obraId];
  const obraKey = ["obra_atual", obraId];
  const setoresKey = ["registros-pmp-setores", obraId];

  // Mutation: Salvar Atividade (criar ou editar)
  const saveMutation = useMutation({
    mutationFn: async ({
      editingId,
      formData,
      restricoesNovas,
      restricoesParaDeletar,
      currentMaxOrder,
    }: SaveAtividadeParams) => {
      let atividadeId = editingId;

      const atividadeData = {
        titulo: formData.titulo,
        cor: formData.cor,
        responsavel: formData.responsavel || null,
        data_inicio: formData.data_inicio || null,
        data_termino: formData.data_termino || null,
        setor: formData.setor || null,
        semana_referencia: formData.semana_referencia,
      };

      if (editingId) {
        await pmpService.updateAtividade(editingId, atividadeData);
      } else {
        if (!obraId) throw new Error("Obra não selecionada");
        const created = await pmpService.createAtividade(
          obraId,
          atividadeData as any,
          currentMaxOrder + 1000
        );
        atividadeId = created.id;
      }

      // Deletar restrições marcadas para deleção
      if (restricoesParaDeletar.length > 0) {
        await Promise.all(
          restricoesParaDeletar.map((id) => pmpService.deleteRestricao(id))
        );
      }

      // Inserir novas restrições (apenas as que não têm ID)
      if (restricoesNovas.length > 0 && atividadeId) {
        await pmpService.createRestricoes(atividadeId, restricoesNovas);
      }

      return atividadeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atividadesKey });
      toast({ title: "Salvo com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao salvar atividade:", error);
      toast({
        title: "Erro ao salvar",
        description: "Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    },
  });

  // Mutation: Mover Atividade (drag and drop)
  const moveMutation = useMutation({
    mutationFn: async ({
      id,
      semana_referencia,
      data_inicio,
      data_termino,
      ordem,
    }: {
      id: string;
      semana_referencia: string;
      data_inicio?: string | null;
      data_termino?: string | null;
      ordem?: number;
    }) => {
      await pmpService.moveAtividade(id, {
        semana_referencia,
        data_inicio,
        data_termino,
        ordem,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atividadesKey });
    },
  });

  // Mutation: Deletar Atividade
  const deleteMutation = useMutation({
    mutationFn: async ({ id, wasConcluido }: { id: string; wasConcluido: boolean }) => {
      await pmpService.deleteAtividade(id);
      return { id, wasConcluido };
    },
    onSuccess: async (data) => {
      // Se a atividade estava concluída, remover o XP que foi dado
      if (data.wasConcluido && userId) {
        await gamificationService.removeXP(userId, "PMP_ATIVIDADE_CONCLUIDA", 50, data.id);
      }
      queryClient.invalidateQueries({ queryKey: atividadesKey });
      toast({ title: "Removido!" });
    },
  });

  // Mutation: Toggle Concluído
  const toggleCheckMutation = useMutation({
    mutationFn: async ({
      id,
      novoStatus,
    }: {
      id: string;
      novoStatus: boolean;
    }) => {
      await pmpService.toggleConcluido(id, novoStatus);
      return { id, novoStatus };
    },
    onSuccess: async (data) => {
      if (userId) {
        if (data.novoStatus) {
          await gamificationService.awardXP(userId, "PMP_ATIVIDADE_CONCLUIDA", 50, data.id);
        } else {
          await gamificationService.removeXP(userId, "PMP_ATIVIDADE_CONCLUIDA", 50, data.id);
        }
      }
      queryClient.invalidateQueries({ queryKey: atividadesKey });
    },
  });

  // Mutation: Resolver Restrição
  const resolveRestricaoMutation = useMutation({
    mutationFn: async ({
      id,
      resolvido,
    }: {
      id: string;
      resolvido: boolean;
    }) => {
      await pmpService.updateRestricao(id, resolvido);
      return { id, resolvido };
    },
    onSuccess: async (data) => {
      if (userId) {
        if (data.resolvido) {
          await gamificationService.awardXP(userId, "PMP_RESTRICAO_CONCLUIDA", 20, data.id);
        } else {
          await gamificationService.removeXP(userId, "PMP_RESTRICAO_CONCLUIDA", 20, data.id);
        }
      }
      queryClient.invalidateQueries({ queryKey: atividadesKey });
      toast({ title: "Restrição atualizada" });
    },
  });

  // Mutation: Deletar Restrição
  const deleteRestricaoMutation = useMutation({
    mutationFn: async ({ id, wasResolvido }: { id: string; wasResolvido: boolean }) => {
      await pmpService.deleteRestricao(id);
      return { id, wasResolvido };
    },
    onSuccess: async (data) => {
      // Se a restrição estava resolvida, remover o XP que foi dado
      if (data.wasResolvido && userId) {
        await gamificationService.removeXP(userId, "PMP_RESTRICAO_CONCLUIDA", 20, data.id);
      }
      queryClient.invalidateQueries({ queryKey: atividadesKey });
    },
  });

  // Mutation: Adicionar Setor
  const addSetorMutation = useMutation({
    mutationFn: async (valor: string) => {
      if (!obraId) throw new Error("Obra não selecionada");
      await registrosService.criarRegistro({
        obra_id: obraId,
        tipo: "sector",
        valor: valor.trim(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setoresKey });
      toast({ title: "Setor cadastrado com sucesso!" });
    },
  });

  // Mutation: Upload Planta
  const uploadPlantaMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!obraId) throw new Error("Obra não selecionada");
      const publicUrl = await pmpService.uploadPlantaImage(obraId, file);
      await pmpService.updateObraPlanta(obraId, publicUrl);
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obraKey });
      toast({ title: "Imagem enviada com sucesso!" });
    },
    onError: (error) => {
      console.error("Erro ao enviar imagem:", error);
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
    },
  });

  // Mutation: Remover Planta
  const removePlantaMutation = useMutation({
    mutationFn: async () => {
      if (!obraId) throw new Error("Obra não selecionada");
      await pmpService.updateObraPlanta(obraId, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obraKey });
      toast({ title: "Imagem removida!" });
    },
  });

  return {
    saveMutation,
    moveMutation,
    deleteMutation,
    toggleCheckMutation,
    resolveRestricaoMutation,
    deleteRestricaoMutation,
    addSetorMutation,
    uploadPlantaMutation,
    removePlantaMutation,
  };
};
