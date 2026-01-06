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

// Tipo auxiliar para a view de usuários
type RankingUserView = {
  id: string;
  nome: string | null;
};

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
      let userIds: string[] = [];

      // Se tiver empresa_id, busca apenas usuários dessa empresa
      if (empresaId) {
        const { data: empresaUsers, error: empresaError } = await supabase
          .from("usuarios")
          .select("id")
          .eq("empresa_id", empresaId);

        if (empresaError) {
          console.error("Erro ao buscar usuários da empresa:", empresaError);
          throw empresaError;
        }

        userIds = empresaUsers?.map((u) => u.id) || [];

        // Se não encontrou usuários na empresa, retorna lista vazia
        if (userIds.length === 0) {
          return [];
        }
      }

      // Busca perfis de gamificação
      let query = supabase.from("gamification_profiles").select("*").order("xp_total", { ascending: false }).limit(20);

      // Se tiver filtro de usuários (por empresa), aplica o filtro
      if (empresaId && userIds.length > 0) {
        query = query.in("id", userIds);
      }

      const { data: profiles, error: profileError } = await query;

      if (profileError) {
        console.error("Erro ao buscar perfis:", profileError);
        throw profileError;
      }

      if (!profiles || profiles.length === 0) return [];

      const profileIds = profiles.map((p) => p.id);

      // Busca nomes para exibir no ranking
      // Usamos 'data: usersData' e fazemos o cast manual logo abaixo
      const { data: usersData, error: userError } = await supabase
        .from("ranking_users_view" as any)
        .select("id, nome")
        .in("id", profileIds);

      if (userError) {
        console.error("Erro ao buscar nomes:", userError);
        throw userError;
      }

      // CAST EXPLÍCITO: Força o TypeScript a entender a estrutura
      const users = usersData as unknown as RankingUserView[] | null;

      const ranking: RankingItem[] = profiles.map((profile, index) => {
        const userDetails = users?.find((u) => u.id === profile.id);
        const displayName = userDetails?.nome || "Usuário Grifo";

        return {
          ...profile,
          nome: displayName,
          role: "Membro FAST",
          position: index + 1,
        };
      });

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
