/**
 * Formats a date to ISO string (YYYY-MM-DD) avoiding timezone issues
 */
export const formatDateToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a date to Brazilian format (DD/MM/YYYY)
 */
export const formatDateToBR = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats an ISO date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)
 * Avoids timezone issues by parsing the date components directly
 */
export const formatISODateToBR = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Formats an ISO date string (YYYY-MM-DD) to Brazilian long format (DD de MMMM de YYYY)
 * Avoids timezone issues by parsing the date components directly
 */
export const formatISODateToLongBR = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const monthName = months[parseInt(month) - 1];
  return `${parseInt(day)} de ${monthName} de ${year}`;
};

/**
 * Formats percentage value with locale
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Capitalizes first letter of each word
 */
export const capitalizeWords = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Truncates text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};