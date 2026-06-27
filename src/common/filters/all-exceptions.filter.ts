import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | object = 'Internal server error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      message = typeof res === 'string' ? res : (res as any).message || res
    } else if (exception instanceof Error) {
      // Prisma unique constraint violation
      if ((exception as any).code === 'P2002') {
        status = HttpStatus.CONFLICT
        message = 'A record with this value already exists'
      } else if ((exception as any).code === 'P2025') {
        status = HttpStatus.NOT_FOUND
        message = 'Record not found'
      } else {
        this.logger.error(exception.message, exception.stack)
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    })
  }
}
