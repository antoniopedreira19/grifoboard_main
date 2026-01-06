import { ERROR_MESSAGES } from '../constants';

export type AppError = {
  message: string;
  code?: string;
  originalError?: unknown;
};

/**
 * Converts unknown error to a standardized error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Creates a standardized app error
 */
export const createAppError = (
  message: string, 
  code?: string, 
  originalError?: unknown
): AppError => ({
  message,
  code,
  originalError
});

/**
 * Logs error safely without exposing sensitive information
 */
export const logError = (error: unknown, context?: string) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    const prefix = context ? `[${context}]` : '[Error]';
    console.error(prefix, error);
  }
  
  // In production, you might want to send to an error tracking service
  // Example: Sentry.captureException(error);
};