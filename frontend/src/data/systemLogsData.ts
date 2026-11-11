export const LOG_CATEGORIES = [
  'login_attempt',
  'api_error',
  'crash',
  'payment_failure',
  'server_issue',
  'security_audit',
  'general',
] as const

export type LogCategory = (typeof LOG_CATEGORIES)[number]

export const categoryLabels: Record<LogCategory, string> = {
  login_attempt: 'Login',
  api_error: 'API Error',
  crash: 'Crash',
  payment_failure: 'Payment',
  server_issue: 'Server',
  security_audit: 'Security',
  general: 'General',
}

export const LOG_LEVELS = ['info', 'warn', 'error', 'debug'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

export const levelLabels: Record<LogLevel, string> = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG',
}

export const SERVICES = [
  'auth-service',
  'user-service',
  'payment-service',
  'mentor-service',
  'matching-service',
  'notification-service',
  'gateway',
] as const
