import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { pmpService } from "@/services/pmpService";
import { registrosService } from "@/services/registroService";
import {
  format,
  addDays,
  differenceInWeeks,
  parseISO,
  startOfWeek,
  areIntervalsOverlapping,
  differenceInCalendarDays,
  startOfDay,
  isValid,
} from "date-fns";
import type { PmpAtividade, PmpWeek, RestricaoComAtividade, UrgencyInfo } from "@/types/pmp";
import { safeParseDate } from "@/utils/pmpDateUtils";

// Tempo de cache para queries (5 minutos)
const STALE_TIME = 5 * 60 * 1000;

export const usePmpData = () => {
  const { userSession } = useAuth();
  const obraAtivaContext = userSession?.obraAtiva;

  // Query: Obra Atual
  const { data: obraData } = useQuery({
    queryKey: ["obra_atual", obraAtivaContext?.id],
    queryFn: async () => {
      if (!obraAtivaContext?.id) return null;
      return pmpService.fetchObra(obraAtivaContext.id);
    },
    enabled: !!obraAtivaContext?.id,
    initialData: obraAtivaContext as any,
    staleTime: STALE_TIME,
  });

  const obraAtiva = (obraData || obraAtivaContext) as any;

  // Query: Setores
  const { data: setores = [], refetch: refetchSetores } = useQuery({
    queryKey: ["registros-pmp-setores", obraAtiva?.id],
    queryFn: async () => {
      if (!obraAtiva?.id) return [];
      const registros = await registrosService.listarRegistros(obraAtiva.id);
      return registros.filter((r) => r.tipo === "sector").map((r) => r.valor);
    },
    enabled: !!obraAtiva?.id,
    staleTime: STALE_TIME,
  });

  // Query: Atividades com Restrições
  const {
    data: atividades = [],
    isLoading: isLoadingAtividades,
    refetch: refetchAtividades,
  } = useQuery({
    queryKey: ["pmp_atividades", obraAtiva?.id],
    queryFn: async () => {
      if (!obraAtiva?.id) return [];
      return pmpService.fetchAtividades(obraAtiva.id);
    },
    enabled: !!obraAtiva?.id,
    staleTime: STALE_TIME,
  });

  // Memo: Semanas geradas a partir das datas da obra
  const weeks = useMemo<PmpWeek[]>(() => {
    if (!obraAtiva?.data_inicio || !obraAtiva?.data_termino) return [];

    const start = safeParseDate(obraAtiva.data_inicio);
    const end = safeParseDate(obraAtiva.data_termino);
    
    if (!start || !end) return [];

    const firstWeekStart = startOfWeek(start, { weekStartsOn: 1 });
    const totalWeeks = Math.max(differenceInWeeks(end, firstWeekStart) + 2, 1);
    const weeksArray: PmpWeek[] = [];

    for (let i = 0; i < totalWeeks; i++) {
      const currentWeekStart = addDays(firstWeekStart, i * 7);
      const weekEnd = addDays(currentWeekStart, 6);
      weeksArray.push({
        id: format(currentWeekStart, "yyyy-MM-dd"),
        label: `Semana ${i + 1}`,
        year: format(currentWeekStart, "yyyy"),
        start: currentWeekStart,
        end: weekEnd,
        formattedRange: `${format(currentWeekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}`,
      });
    }

    return weeksArray;
  }, [obraAtiva?.data_inicio, obraAtiva?.data_termino]);

  // Memo: Mapa de tarefas por semana (pré-calculado para performance)
  const tasksByWeek = useMemo<Map<string, PmpAtividade[]>>(() => {
    const map = new Map<string, PmpAtividade[]>();

    weeks.forEach((week) => {
      const tasksForWeek = atividades.filter((atividade) => {
        if (!atividade.data_inicio) {
          return atividade.semana_referencia === week.id;
        }

        const start = safeParseDate(atividade.data_inicio);
        if (!start) return false;

        const end = safeParseDate(atividade.data_termino) || start;

        return areIntervalsOverlapping(
          { start, end },
          { start: week.start, end: week.end },
          { inclusive: true }
        );
      });

      map.set(week.id, tasksForWeek);
    });

    return map;
  }, [weeks, atividades]);

  // Função helper para obter tarefas de uma semana específica
  const getTasksForWeek = (weekId: string): PmpAtividade[] => {
    return tasksByWeek.get(weekId) || [];
  };

  // Memo: Lista plana de todas as restrições
  const todasRestricoes = useMemo<RestricaoComAtividade[]>(() => {
    const list: RestricaoComAtividade[] = [];

    atividades.forEach((ativ) => {
      if (ativ.pmp_restricoes) {
        ativ.pmp_restricoes.forEach((rest) => {
          list.push({
            ...rest,
            atividadeTitulo: ativ.titulo,
            atividadeId: ativ.id,
            semana: ativ.semana_referencia,
          });
        });
      }
    });

    // Ordena por data limite de forma segura
    return list.sort((a, b) => {
      const dateA = safeParseDate(a.data_limite);
      const dateB = safeParseDate(b.data_limite);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateA.getTime() - dateB.getTime();
    });
  }, [atividades]);

  // Memo: Informações de urgência (bomba relógio)
  const urgencyInfo = useMemo<UrgencyInfo>(() => {
    const defaultInfo: UrgencyInfo = {
      daysRemaining: null,
      urgencyBg: "",
      urgencyBorder: "",
      urgencyText: "",
      iconColor: "",
      statusLabel: "",
      isExploded: false,
    };

    if (!obraAtiva?.data_termino) return defaultInfo;

    const end = safeParseDate(obraAtiva.data_termino);
    if (!end) return defaultInfo;

    const today = startOfDay(new Date());
    const days = differenceInCalendarDays(end, today);

    let styles = {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      icon: "text-orange-600",
      label: "TEMPO RESTANTE",
      exploded: false,
    };

    if (days < 0) {
      styles = {
        bg: "bg-red-600",
        border: "border-red-700",
        text: "text-white",
        icon: "text-white animate-bounce",
        label: "PRAZO ESTOURADO!",
        exploded: true,
      };
    } else if (days <= 14) {
      styles = {
        bg: "bg-red-100",
        border: "border-red-400",
        text: "text-red-800",
        icon: "text-red-600 animate-pulse",
        label: "PRAZO CRÍTICO",
        exploded: false,
      };
    }

    return {
      daysRemaining: days,
      urgencyBg: styles.bg,
      urgencyBorder: styles.border,
      urgencyText: styles.text,
      iconColor: styles.icon,
      statusLabel: styles.label,
      isExploded: styles.exploded,
    };
  }, [obraAtiva?.data_termino]);

  // Calcula a próxima ordem para nova atividade
  const getNextOrder = (): number => {
    return atividades.reduce((max, t) => Math.max(max, t.ordem || 0), 0) + 1000;
  };

  return {
    // Dados
    obraAtiva,
    setores,
    atividades,
    weeks,
    tasksByWeek,
    todasRestricoes,
    urgencyInfo,

    // Estado
    isLoadingAtividades,

    // Funções
    getTasksForWeek,
    getNextOrder,
    refetchSetores,
    refetchAtividades,
  };
};
