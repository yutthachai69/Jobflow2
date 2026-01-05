/**
 * Structured Logging System
 * 
 * Provides structured logging with different log levels and optional
 * integration with error tracking services (e.g., Sentry)
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  userId?: string
  username?: string
  role?: string
  path?: string
  method?: string
  ip?: string
  userAgent?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

/**
 * Logger class for structured logging
 */
class Logger {
  private isDevelopment: boolean
  private sentryDsn: string | undefined

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.sentryDsn = process.env.SENTRY_DSN
  }

  /**
   * Format log entry as JSON string
   */
  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry, null, this.isDevelopment ? 2 : 0)
  }

  /**
   * Send error to external tracking service (Sentry)
   */
  private async sendToErrorTracking(entry: LogEntry) {
    if (!this.sentryDsn || entry.level !== 'error') {
      return
    }

    // TODO: Integrate with Sentry SDK
    // For now, we'll just log that we would send it
    if (this.isDevelopment) {
      console.log('[Error Tracking] Would send to Sentry:', entry.message)
    }
  }

  /**
   * Write log to console (and optionally to file/external service)
   */
  private writeLog(entry: LogEntry) {
    const formatted = this.formatLog(entry)

    // Write to console with appropriate method
    switch (entry.level) {
      case 'error':
        console.error(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted)
        }
        break
    }

    // Send to error tracking service (async, don't await)
    this.sendToErrorTracking(entry).catch(() => {
      // Silently fail if error tracking fails
    })
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    return entry
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, context)
      this.writeLog(entry)
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext) {
    const entry = this.createLogEntry('info', message, context)
    this.writeLog(entry)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, error?: Error) {
    const entry = this.createLogEntry('warn', message, context, error)
    this.writeLog(entry)
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, error?: Error) {
    const entry = this.createLogEntry('error', message, context, error)
    this.writeLog(entry)
  }

  /**
   * Log application error with full context
   */
  logError(error: Error, context?: LogContext) {
    this.error(error.message, context, error)
  }

  /**
   * Log security event
   */
  security(eventType: string, details: Record<string, any>) {
    this.warn(`[SECURITY] ${eventType}`, {
      eventType,
      ...details,
    })
  }
}

// Export singleton instance
export const logger = new Logger()

/**
 * Helper function to create context from request
 */
export function createLogContext(
  request?: Request | null,
  user?: { id?: string; username?: string; role?: string } | null
): LogContext {
  const context: LogContext = {}

  if (user) {
    context.userId = user.id
    context.username = user.username
    context.role = user.role
  }

  if (request) {
    const url = new URL(request.url)
    context.path = url.pathname
    context.method = request.method
    context.ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    context.userAgent = request.headers.get('user-agent') || undefined
  }

  return context
}

