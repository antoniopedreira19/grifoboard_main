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

export const gamificationService = {
  // 1. Busca o perfil do usuário atual
  async getProfile(userId: string) {
    const { data, error } = await supabase.from("gamification_profiles").select("*").eq("id", userId).maybeSingle();

    if (error) {
      console.error("Erro ao buscar perfil:", error);
      return null;
    }
    return data as GamificationProfile | null;
  },

  // 2. Busca o Ranking Global ou por Empresa (Top 20)
  async getRanking(empresaId?: string | null) {
    try {
      // Usar a função RPC que permite ver ranking global de todas empresas
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
    const { data, error } = await supabase.from("usuarios").select("empresa_id").eq("id", userId).maybeSingle();

    if (error) {
      console.error("Erro ao buscar empresa do usuário:", error);
      return null;
    }
    return data?.empresa_id || null;
  },

  // 4. Dar XP (Positivo)
  async awardXP(userId: string, action: string, amount: number, referenceId?: string) {
    try {
      if (referenceId) {
        const { data: existing } = await supabase
          .from("gamification_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("reference_id", referenceId)
          .eq("action_type", action)
          .maybeSingle();

        if (existing) return;
      }

      const { error: logError } = await supabase.from("gamification_logs").insert({
        user_id: userId,
        action_type: action,
        xp_amount: amount,
        reference_id: referenceId,
      });

      if (logError) throw logError;

      await this.updateProfileXP(userId, amount);

      toast({
        title: `+${amount} XP Conquistado! 🦅`,
        description: `Ação: ${formatActionName(action)}`,
        variant: "gold",
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao dar XP:", error);
    }
  },

  // 5. Remover XP (Quando desfaz uma ação)
  async removeXP(userId: string, actionToCheck: string, amountToRemove: number, referenceId: string) {
    try {
      const { data: existingLog } = await supabase
        .from("gamification_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("reference_id", referenceId)
        .eq("action_type", actionToCheck)
        .maybeSingle();

      if (existingLog) {
        await supabase.from("gamification_logs").delete().eq("id", existingLog.id);
      } else {
        return;
      }

      await this.updateProfileXP(userId, -Math.abs(amountToRemove));

      toast({
        title: `XP Revertido`,
        description: "Status alterado. Continue focado!",
        variant: "destructive",
        duration: 3000,
      });
    } catch (error) {
      console.error("Erro ao remover XP:", error);
    }
  },

  async updateProfileXP(userId: string, amountToAdd: number) {
    const { data: profile } = await supabase
      .from("gamification_profiles")
      .select("xp_total")
      .eq("id", userId)
      .maybeSingle();

    const currentXP = profile?.xp_total || 0;
    const newXP = Math.max(0, currentXP + amountToAdd);
    const newLevel = Math.floor(newXP / 1000) + 1;

    await supabase.from("gamification_profiles").upsert({
      id: userId,
      xp_total: newXP,
      level_current: newLevel,
      last_activity_date: new Date().toISOString(),
    });
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
