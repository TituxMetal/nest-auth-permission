import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/httpException.filter'
import { LoggerService } from './common/logger.service'

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false })
  const logger = new LoggerService('Bootstrap')

  // Security middleware
  app.use(helmet())

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter())

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  )

  // CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })

  const port = process.env.PORT ?? 3000
  await app.listen(port)

  logger.info('Application started successfully', {
    port,
    environment: process.env.NODE_ENV || 'development',
    cors: process.env.ALLOWED_ORIGINS ?? ['http://localhost:3000']
  })
}

void bootstrap().catch(error => {
  const logger = new LoggerService('Bootstrap')
  logger.error('Failed to start application', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  })
  process.exit(1)
})
