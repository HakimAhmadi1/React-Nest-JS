import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponseEnvelope<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

/** Paths that publish their own response shape and must not be wrapped. */
const BYPASS = [/^\/api\/health/, /^\/api\/docs/];

/**
 * Wraps every successful response in `{ success, statusCode, message, data }`,
 * mirroring the error shape from `GlobalExceptionFilter`. The frontend's axios
 * interceptor already unwraps `.data`, and the admin users table reads
 * `.data` / `.total` off it.
 *
 * Must be registered BEFORE `ClassSerializerInterceptor` in the providers
 * array: the first-registered interceptor is outermost, so its `map` runs
 * last, which keeps the serializer looking at the raw entity (and stripping
 * `@Exclude()` fields such as `password`) rather than at this envelope.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseEnvelope<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseEnvelope<T> | T> {
    const request = context.switchToHttp().getRequest<Request>();

    if (BYPASS.some((pattern) => pattern.test(request.url))) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        statusCode: response.statusCode ?? HttpStatus.OK,
        message: 'Request successful',
        data,
      })),
    );
  }
}
