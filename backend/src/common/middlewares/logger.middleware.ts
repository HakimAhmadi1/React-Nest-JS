import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startAt = process.hrtime.bigint();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - startAt) / 1e6;
      const message = `${method} ${originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`;

      // Request bodies are never logged — they carry passwords and reset tokens.
      if (res.statusCode >= 500) this.logger.error(message);
      else if (res.statusCode >= 400) this.logger.warn(message);
      else this.logger.log(message);
    });

    next();
  }
}
