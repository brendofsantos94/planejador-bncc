import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; sessionId: string };
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match?.[1]) throw new UnauthorizedException('Autenticação obrigatória.');
    const claims = await this.auth.authenticateAccessToken(match[1]);
    request.user = { id: claims.sub, email: claims.email, sessionId: claims.sid };
    return true;
  }
}
