// Application-wide constants
export const APP_CONFIG = {
  name: 'GrifoBoard',
  description: 'Controle do PCP de Obra',
  version: '1.0.0',
} as const;

// Database field mappings
export const DAY_FIELD_MAPPING = {
  'seg': 'mon',
  'ter': 'tue', 
  'qua': 'wed',
  'qui': 'thu',
  'sex': 'fri',
  'sab': 'sat',
  'dom': 'sun'
} as const;

export const REVERSE_DAY_FIELD_MAPPING = {
  'mon': 'seg',
  'tue': 'ter',
  'wed': 'qua', 
  'thu': 'qui',
  'fri': 'sex',
  'sat': 'sab',
  'sun': 'dom'
} as const;

// Task status mappings
export const TASK_STATUS_MAPPING = {
  'Planejada': 'planned',
  'Executada': 'completed',
  'Não Feita': 'not_done'
} as const;

export const REVERSE_TASK_STATUS_MAPPING = {
  'planned': 'Planejada',
  'completed': 'Executada', 
  'not_done': 'Não Feita'
} as const;

// Default error messages
export const ERROR_MESSAGES = {
  UNKNOWN_ERROR: 'Erro desconhecido',
  NETWORK_ERROR: 'Erro de conexão',
  VALIDATION_ERROR: 'Dados inválidos',
  PERMISSION_ERROR: 'Permissão negada',
  NOT_FOUND: 'Recurso não encontrado'
} as const;

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
} as const;