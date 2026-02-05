import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface GamificationProfile {
  id: string;
  xp_total: number | null;
  level_current: number | null;
  current_streak: number | null;
}

export interface RankingItem extends GamificationProfile {
  nome: string;
  role: string;
  position?: number;
}

// Tipos de ação válidos e seus XP máximos (espelham o banco)
const XP_CONFIG = {
  TAREFA_CONCLUIDA: 30,
  DIARIO_CRIADO: 25,
  CONTRATACAO_FAST: 50,
  ECONOMIA_PLAYBOOK: 100,
  PMP_ATIVIDADE_CONCLUIDA: 50,
  PMP_RESTRICAO_CONCLUIDA: 20,
} as const;

type ActionType = keyof typeof XP_CONFIG;

export const gamificationService = {
  // 1. Busca o perfil do usuário atual
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from("gamification_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar perfil:", error);
      return null;
    }
    return data as GamificationProfile | null;
  },

  // 2. Busca o Ranking Global ou por Empresa (Top 20)
  async getRanking(empresaId?: string | null) {
    try {
      const { data: rankingData, error: rankingError } = await supabase
        .rpc("get_grifoway_ranking", {
          p_empresa_id: empresaId || null,
          p_limit: 20,
        });

      if (rankingError) {
        console.error("Erro ao buscar ranking:", rankingError);
        throw rankingError;
      }

      if (!rankingData || rankingData.length === 0) return [];

      const ranking: RankingItem[] = rankingData.map((item: any) => ({
        id: item.user_id,
        xp_total: item.pontuacao_geral,
        level_current: Math.floor((item.pontuacao_geral || 0) / 1000) + 1,
        current_streak: 0,
        nome: item.nome || "Usuário Grifo",
        role: "Membro FAST",
        position: item.posicao,
      }));

      return ranking;
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
      return [];
    }
  },

  // 3. Busca empresa_id do usuário atual
  async getUserEmpresaId(userId: string) {
    const { data, error } = await supabase
      .from("usuarios")
      .select("empresa_id")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar empresa do usuário:", error);
      return null;
    }
    return data?.empresa_id || null;
  },

  // 4. Dar XP (usando função segura do banco - atômica e validada)
  async awardXP(userId: string, action: ActionType, amount: number, referenceId?: string) {
    try {
      // Validação local antes de chamar o banco
      if (!XP_CONFIG[action]) {
        console.warn(`Ação de gamificação inválida: ${action}`);
        return { success: false, error: "Ação inválida" };
      }

      const maxAllowed = XP_CONFIG[action];
      if (amount > maxAllowed || amount < 0) {
        console.warn(`XP inválido para ${action}: ${amount} (max: ${maxAllowed})`);
        return { success: false, error: "XP inválido" };
      }

      // Chamar função segura do banco (atômica, previne race conditions)
      const { data, error } = await supabase.rpc("award_xp", {
        p_user_id: userId,
        p_action_type: action,
        p_xp_amount: amount,
        p_reference_id: referenceId || null,
      });

      if (error) {
        console.error("Erro ao dar XP:", error);
        return { success: false, error: error.message };
      }

      const result = data as { success: boolean; error?: string; already_awarded?: boolean; xp_total?: number; level?: number };

      if (result.success) {
        toast({
          title: `+${amount} XP Conquistado! 🦅`,
          description: `Ação: ${formatActionName(action)}`,
          variant: "gold",
          duration: 3000,
        });
      } else if (result.already_awarded) {
        // Silenciosamente ignora se já foi concedido (não é erro, é proteção)
        console.log(`XP já concedido anteriormente para ${action}:${referenceId}`);
      } else {
        console.warn("Falha ao dar XP:", result.error);
      }

      return result;
    } catch (error) {
      console.error("Erro ao dar XP:", error);
      return { success: false, error: "Erro inesperado" };
    }
  },

  // 5. Remover XP (usando função segura do banco)
  async removeXP(userId: string, actionToCheck: ActionType, _amountToRemove: number, referenceId: string) {
    try {
      const { data, error } = await supabase.rpc("remove_xp", {
        p_user_id: userId,
        p_action_type: actionToCheck,
        p_reference_id: referenceId,
      });

      if (error) {
        console.error("Erro ao remover XP:", error);
        return { success: false, error: error.message };
      }

      const result = data as { success: boolean; error?: string; xp_removed?: number };

      if (result.success && result.xp_removed && result.xp_removed > 0) {
        toast({
          title: `XP Revertido`,
          description: "Status alterado. Continue focado!",
          variant: "destructive",
          duration: 3000,
        });
      }

      return result;
    } catch (error) {
      console.error("Erro ao remover XP:", error);
      return { success: false, error: "Erro inesperado" };
    }
  },

  // 6. Remover XP do Playbook de uma obra (usando função segura do banco)
  async removePlaybookXP(userId: string, obraId: string) {
    try {
      const { data, error } = await supabase.rpc("remove_playbook_xp", {
        p_user_id: userId,
        p_obra_id: obraId,
      });

      if (error) {
        console.error("Erro ao remover XP do playbook:", error);
        return { success: false, error: error.message };
      }

      const result = data as { success: boolean; xp_removed?: number };

      if (result.success && result.xp_removed && result.xp_removed > 0) {
        toast({
          title: `XP do Playbook Removido`,
          description: `${result.xp_removed} XP foram revertidos.`,
          variant: "destructive",
          duration: 3000,
        });
      }

      return result;
    } catch (error) {
      console.error("Erro ao remover XP do playbook:", error);
      return { success: false, error: "Erro inesperado" };
    }
  },
};

function formatActionName(action: string): string {
  const map: Record<string, string> = {
    TAREFA_CONCLUIDA: "Tarefa FAST Concluída",
    DIARIO_CRIADO: "Diário Enviado",
    CONTRATACAO_FAST: "Contratação Fechada",
    ECONOMIA_PLAYBOOK: "Economia Gerada na Obra 💰",
    PMP_ATIVIDADE_CONCLUIDA: "Atividade do PMP Concluída",
  };
  return map[action] || action.replace(/_/g, " ");
}
