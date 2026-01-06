/**
 * Capitaliza a primeira letra de cada palavra em uma string
 */
export const capitalizeWords = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
