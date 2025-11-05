import { Logger } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { LoggerService } from './logger.service'

// Type definition for Bun's spy mock calls
interface SpyMock<T extends unknown[] = unknown[]> {
  calls: T[]
  results: Array<{ type: 'return' | 'throw'; value: unknown }>
}

// Properly typed spy with mock property
interface TypedSpy<TArgs extends unknown[] = unknown[]> {
  mock: SpyMock<TArgs>
}

// Helper to safely access spy call arguments with proper typing
const getSpyCall = <TArgs extends unknown[] = unknown[]>(
  spy: TypedSpy<TArgs>,
  callIndex: number
): TArgs => {
  return spy.mock.calls[callIndex]
}

describe('LoggerService', () => {
  let loggerService: LoggerService
  let logSpy: TypedSpy
  let warnSpy: TypedSpy
  let errorSpy: TypedSpy
  let debugSpy: TypedSpy
  let verboseSpy: TypedSpy

  beforeEach(() => {
    logSpy = spyOn(Logger.prototype, 'log').mockImplementation(() => {}) as TypedSpy
    warnSpy = spyOn(Logger.prototype, 'warn').mockImplementation(() => {}) as TypedSpy
    errorSpy = spyOn(Logger.prototype, 'error').mockImplementation(() => {}) as TypedSpy
    debugSpy = spyOn(Logger.prototype, 'debug').mockImplementation(() => {}) as TypedSpy
    verboseSpy = spyOn(Logger.prototype, 'verbose').mockImplementation(() => {}) as TypedSpy

    loggerService = new LoggerService('TestContext')
  })

  afterEach(() => {
    mock.clearAllMocks()
  })

  describe('info', () => {
    it('should log info message without context', () => {
      loggerService.info('Test message')

      expect(logSpy).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith('Test message', undefined)
    })

    it('should log info message with context', () => {
      const context = { userId: '123', action: 'login' }
      loggerService.info('User logged in', context)

      expect(logSpy).toHaveBeenCalledWith(
        'User logged in {"userId":"123","action":"login"}',
        context
      )
    })

    it('should sanitize sensitive data in context', () => {
      const context = { userId: '123', password: 'secret123' }
      loggerService.info('User action', context)

      const call = getSpyCall(logSpy, 0)
      expect(call[0]).toContain('secr******')
      expect(call[0]).not.toContain('secret123')
    })

    it('should not sanitize non-sensitive data in context', () => {
      const context = { userId: '123', action: 'view' }
      loggerService.info('User action', context)

      const call = getSpyCall(logSpy, 0)
      expect(call[0]).toContain('"userId":"123"')
      expect(call[0]).toContain('"action":"view"')
    })
  })

  describe('warn', () => {
    it('should log warn message without context', () => {
      loggerService.warn('Warning message')

      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith('Warning message', undefined)
    })

    it('should log warn message with context', () => {
      const context = { retryCount: 3 }
      loggerService.warn('Retry attempt', context)

      expect(warnSpy).toHaveBeenCalledWith('Retry attempt {"retryCount":3}', context)
    })

    it('should sanitize sensitive data in context', () => {
      const context = { apiKey: 'key123456', endpoint: '/api/users' }
      loggerService.warn('API call', context)

      const call = getSpyCall(warnSpy, 0)
      expect(call[0]).toContain('key1******')
      expect(call[0]).not.toContain('key123456')
    })

    it('should not sanitize non-sensitive data in context', () => {
      const context = { endpoint: '/api/users', method: 'GET' }
      loggerService.warn('API call', context)

      const call = getSpyCall(warnSpy, 0)
      expect(call[0]).toContain('"endpoint":"/api/users"')
      expect(call[0]).toContain('"method":"GET"')
    })
  })

  describe('error', () => {
    it('should log error message without context', () => {
      loggerService.error('Error occurred')

      expect(errorSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy).toHaveBeenCalledWith('Error occurred', undefined)
    })

    it('should log error message with context', () => {
      const context = { errorCode: 500, path: '/api/users' }
      loggerService.error('Server error', context)

      expect(errorSpy).toHaveBeenCalledWith(
        'Server error {"errorCode":500,"path":"/api/users"}',
        context
      )
    })

    it('should sanitize sensitive data in context', () => {
      const context = { token: 'bearer_xyz789', errorCode: 401 }
      loggerService.error('Auth error', context)

      const call = getSpyCall(errorSpy, 0)
      expect(call[0]).toContain('bear******')
      expect(call[0]).not.toContain('bearer_xyz789')
    })

    it('should not sanitize non-sensitive data in context', () => {
      const context = { errorCode: 404, path: '/api/users' }
      loggerService.error('Not found', context)

      const call = getSpyCall(errorSpy, 0)
      expect(call[0]).toContain('"errorCode":404')
      expect(call[0]).toContain('"path":"/api/users"')
    })
  })

  describe('debug', () => {
    it('should log debug message without context', () => {
      loggerService.debug('Debug info')

      expect(debugSpy).toHaveBeenCalledTimes(1)
      expect(debugSpy).toHaveBeenCalledWith('Debug info', undefined)
    })

    it('should log debug message with context', () => {
      const context = { queryTime: '50ms', rows: 10 }
      loggerService.debug('Query executed', context)

      expect(debugSpy).toHaveBeenCalledWith(
        'Query executed {"queryTime":"50ms","rows":10}',
        context
      )
    })

    it('should sanitize sensitive data in context', () => {
      const context = { secret: 'app_secret_xyz', debug: true }
      loggerService.debug('Debug info', context)

      const call = getSpyCall(debugSpy, 0)
      expect(call[0]).toContain('app_******')
      expect(call[0]).not.toContain('app_secret_xyz')
    })

    it('should not sanitize non-sensitive data in context', () => {
      const context = { debug: true, level: 'verbose' }
      loggerService.debug('Debug info', context)

      const call = getSpyCall(debugSpy, 0)
      expect(call[0]).toContain('"debug":true')
      expect(call[0]).toContain('"level":"verbose"')
    })
  })

  describe('verbose', () => {
    it('should log verbose message without context', () => {
      loggerService.verbose('Verbose log')

      expect(verboseSpy).toHaveBeenCalledTimes(1)
      expect(verboseSpy).toHaveBeenCalledWith('Verbose log', undefined)
    })

    it('should log verbose message with context', () => {
      const context = { details: 'extra info' }
      loggerService.verbose('Detailed log', context)

      expect(verboseSpy).toHaveBeenCalledWith('Detailed log {"details":"extra info"}', context)
    })

    it('should sanitize sensitive data in context', () => {
      const context = { password: 'pass123', details: 'info' }
      loggerService.verbose('Verbose log', context)

      const call = getSpyCall(verboseSpy, 0)
      expect(call[0]).toContain('pass******')
      expect(call[0]).not.toContain('pass123')
    })

    it('should not sanitize non-sensitive data in context', () => {
      const context = { details: 'info', level: 5 }
      loggerService.verbose('Verbose log', context)

      const call = getSpyCall(verboseSpy, 0)
      expect(call[0]).toContain('"details":"info"')
      expect(call[0]).toContain('"level":5')
    })
  })

  describe('sanitization', () => {
    it('should recursively sanitize nested sensitive keys', () => {
      const context = {
        userId: '123',
        password: 'secret123',
        nested: {
          password: 'nestedSecret'
        }
      }
      loggerService.info('Test', context)

      const call = getSpyCall(logSpy, 0)
      expect(call[0]).toContain('secr******')
      expect(call[0]).toContain('nest******')
      expect(call[0]).not.toContain('nestedSecret')
      expect(call[0]).not.toContain('secret123')
    })

    it('should handle empty and null values', () => {
      const context = {
        password: '',
        token: null,
        userId: '123'
      }
      loggerService.info('Test', context)

      const call = getSpyCall(logSpy, 0)
      expect(call[0]).toContain('"userId":"123"')
      expect(call[0]).toContain('REDACTED')
      expect(call[0]).not.toContain('RECREATED')
    })

    it('should sanitize case insensitive keys', () => {
      const context = {
        PASSWORD: 'secret1',
        Token: 'token123',
        ApiKey: 'key456'
      }
      loggerService.info('Test', context)

      const call = getSpyCall(logSpy, 0)
      expect(call[0]).toContain('secr******')
      expect(call[0]).toContain('toke******')
      expect(call[0]).toContain('key4******')
    })
  })
})
