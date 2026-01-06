/**
 * Formats a Brazilian phone number to (DDD) XXXXX-XXXX format
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Handle different lengths
  if (cleaned.length === 11) {
    // Mobile: (XX) XXXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length >= 8) {
    // Just the number without DDD
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  return phone; // Return original if can't format
};
