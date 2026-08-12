import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponseBody {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
  stack?: string;
}

/**
 * Single global error shape.
 *
 * Deliberately never serialises the exception object itself: for a TypeORM
 * `QueryFailedError` that would include the failing SQL and its bound
 * parameters (password hashes among them), and the previous version returned
 * exactly that — plus the caller's decoded JWT — to the client whenever
 * NODE_ENV !== 'production'.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = this.extract(exception, statusCode);

    const body: ErrorResponseBody = {
      success: false,
      statusCode,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${statusCode}: ${message}`);
    }

    // Stack traces are a debugging aid, never part of the contract.
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      body.stack = exception.stack;
    }

    response.status(statusCode).json(body);
  }

  private extract(
    exception: unknown,
    statusCode: number,
  ): { message: string; errors?: string[] } {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return { message: payload };
      }

      if (payload && typeof payload === 'object') {
        const raw = (payload as Record<string, unknown>).message;

        // ValidationPipe returns an array — keep it as an array so the client
        // can surface each field error instead of a comma-joined blob.
        if (Array.isArray(raw)) {
          const errors = raw.map(String);
          return { message: errors[0] ?? exception.message, errors };
        }
        if (typeof raw === 'string') {
          return { message: raw };
        }
      }

      return { message: exception.message };
    }

    // Never leak internals of an unexpected failure.
    return {
      message:
        statusCode === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : String(exception),
    };
  }
}
