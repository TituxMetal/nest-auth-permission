import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Request, Response } from 'express'
import { LoggerService } from '~/common/logger.service'

interface ErrorResponse {
  statusCode: number
  timestamp: string
  path: string
  method: string
  message: string | string[]
  error?: string
  stack?: string
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger: LoggerService

  constructor() {
    this.logger = new LoggerService(HttpExceptionFilter.name)
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const errorResponse = this.buildErrorResponse(exception, request)

    this.logError(errorResponse, exception)

    response.status(errorResponse.statusCode).json(errorResponse)
  }

  private logError(errorResponse: ErrorResponse, exception: unknown): void {
    const isServerError = errorResponse.statusCode >= 500
    const logLevel = isServerError ? 'error' : 'warn'
    const logMessage = isServerError ? 'Server error occurred' : 'Client error occurred'

    const context = {
      statusCode: errorResponse.statusCode,
      path: errorResponse.path,
      method: errorResponse.method,
      message: errorResponse.message,
      ...(isServerError && exception instanceof Error && { stack: exception.stack })
    }

    this.logger[logLevel](logMessage, context)
  }

  private buildErrorResponse(exception: unknown, request: Request): ErrorResponse {
    const baseResponse = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method
    }

    // Early return for HttpException
    if (exception instanceof HttpException) {
      return this.buildHttpExceptionResponse(exception, baseResponse)
    }

    // Early return for standard Error
    if (exception instanceof Error) {
      return this.buildStandardErrorResponse(exception, baseResponse)
    }

    // Default unknown error response
    return this.buildUnknownErrorResponse(exception, baseResponse)
  }

  private buildHttpExceptionResponse(
    exception: HttpException,
    baseResponse: Pick<ErrorResponse, 'timestamp' | 'path' | 'method'>
  ): ErrorResponse {
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse()

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] }).message || exception.message

    return {
      ...baseResponse,
      statusCode: status,
      message,
      error: exception.name,
      ...(process.env.NODE_ENV === 'development' && { stack: exception.stack })
    }
  }

  private buildStandardErrorResponse(
    exception: Error,
    baseResponse: Pick<ErrorResponse, 'timestamp' | 'path' | 'method'>
  ): ErrorResponse {
    return {
      ...baseResponse,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: exception.message || 'Internal server error',
      error: exception.name,
      ...(process.env.NODE_ENV === 'development' && { stack: exception.stack })
    }
  }

  private buildUnknownErrorResponse(
    exception: unknown,
    baseResponse: Pick<ErrorResponse, 'timestamp' | 'path' | 'method'>
  ): ErrorResponse {
    return {
      ...baseResponse,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'UnknownError',
      ...(process.env.NODE_ENV === 'development' && { stack: String(exception) })
    }
  }
}
