import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PayloadDto } from '@common/dto/payload.dto';

/** Injects the authenticated principal that `JwtAuthGuard` put on the request. */
export const CurrentUser = createParamDecorator(
  (data: keyof PayloadDto | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as PayloadDto;
    return data ? user?.[data] : user;
  },
);
