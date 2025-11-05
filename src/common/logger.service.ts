import { Injectable, Logger } from '@nestjs/common'

interface LogContext {
  [key: string]: unknown
}

@Injectable()
export class LoggerService {
  private readonly logger: Logger

  constructor(context?: string) {
    this.logger = new Logger(context ?? LoggerService.name)
  }

  info(message: string, context?: LogContext): void {
    this.log('log', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context)
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  verbose(message: string, context?: LogContext): void {
    this.log('verbose', message, context)
  }

  private log(
    level: 'log' | 'warn' | 'error' | 'debug' | 'verbose',
    message: string,
    context?: LogContext
  ): void {
    const formattedMessage = this.formatMessage(message, context)
    this.logger[level](formattedMessage, context)
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sensitiveKeys = ['password', 'token', 'secret', 'key']

    const sanitize = (obj: unknown): unknown => {
      // Guard: primitive types and null
      if (typeof obj !== 'object' || obj === null) {
        return obj
      }

      // Guard: arrays
      if (Array.isArray(obj)) {
        return obj.map(sanitize)
      }

      // Process object entries
      return Object.entries(obj).reduce<Record<string, unknown>>((sanitized, [key, value]) => {
        sanitized[key] = this.sanitizeValue(key, value, sensitiveKeys, sanitize)
        return sanitized
      }, {})
    }

    return sanitize(context) as LogContext
  }

  private sanitizeValue(
    key: string,
    value: unknown,
    sensitiveKeys: string[],
    sanitize: (obj: unknown) => unknown
  ): unknown {
    const isSensitive = sensitiveKeys.some(s => key.toLowerCase().includes(s))

    // Not sensitive: recursively sanitize nested objects
    if (!isSensitive) {
      return sanitize(value)
    }

    // Sensitive string with content: partial redaction
    if (typeof value === 'string' && value.length > 0) {
      return `${value.substring(0, Math.min(4, value.length))}******`
    }

    // Sensitive but not a valid string: full redaction
    return 'REDACTED'
  }

  private formatMessage(message: string, context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) {
      return message
    }

    const sanitizedContext = this.sanitizeContext(context)

    return `${message} ${JSON.stringify(sanitizedContext)}`
  }
}
