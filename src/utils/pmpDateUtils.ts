import { format, parseISO, isValid, isBefore, startOfDay } from "date-fns";

/**
 * Parseia uma data de forma segura, retornando null se inválida
 */
export const safeParseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Formata uma data de forma segura, retornando fallback se inválida
 */
export const safeFormatDate = (
  dateString: string | null | undefined,
  formatString: string,
  fallback: string = "-"
): string => {
  const parsed = safeParseDate(dateString);
  if (!parsed) return fallback;
  
  try {
    return format(parsed, formatString);
  } catch {
    return fallback;
  }
};

/**
 * Verifica se uma data está atrasada (antes de hoje)
 */
export const isDateOverdue = (dateString: string | null | undefined): boolean => {
  const parsed = safeParseDate(dateString);
  if (!parsed) return false;
  
  return isBefore(parsed, startOfDay(new Date()));
};

/**
 * Calcula a diferença em dias entre uma data e hoje
 */
export const getDaysFromToday = (dateString: string | null | undefined): number | null => {
  const parsed = safeParseDate(dateString);
  if (!parsed) return null;
  
  const today = startOfDay(new Date());
  const diffTime = parsed.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Retorna formatação de intervalo de datas segura
 */
export const safeDateRangeDisplay = (
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string | null => {
  const start = safeFormatDate(startDate, "dd/MM", null as unknown as string);
  const end = safeFormatDate(endDate, "dd/MM", null as unknown as string);
  
  if (!start || !end || start === "-" || end === "-") return null;
  
  return `${start} - ${end}`;
};

/**
 * Gera um ID único para restrição temporária
 */
export const generateTempId = (): string => {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
