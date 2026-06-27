import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import helmet from 'helmet'
import * as compression from 'compression'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const logger = new Logger('Bootstrap')

  // Security headers
  app.use(helmet())

  // Gzip compression
  app.use(compression())

  // CORS — allow frontend origin
  const frontendUrl = configService.get<string>('frontendUrl')
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:5173', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  // Global API prefix
  app.setGlobalPrefix('api/v1')

  // Global validation pipe — strip unknown fields, transform types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter())

  // Global response transformer
  app.useGlobalInterceptors(new TransformInterceptor())

  // Swagger API docs (disabled in production)
  if (configService.get<string>('nodeEnv') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CoPaila API')
      .setDescription('CoPaila Carbon Audit Platform REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document)
    logger.log(`Swagger docs available at /api/docs`)
  }

  const port = configService.get<number>('port')
  await app.listen(port)
  logger.log(`Server running on port ${port} [${configService.get('nodeEnv')}]`)
}

bootstrap()
