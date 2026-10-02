import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { loginSchema } from './auth.schemas.js';
import { AuthService } from './auth.service.js';

const refreshCookie = 'bncc_refresh';
const csrfCookie = 'bncc_csrf';
const idleMs = 8 * 60 * 60 * 1000;

function cookieOptions(httpOnly: boolean) {
  const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
  return { httpOnly, secure, sameSite: 'lax' as const, path: httpOnly ? '/auth' : '/', maxAge: idleMs };
}

function setSessionCookies(response: Response, refreshToken: string): void {
  const csrfToken = randomUUID() + randomUUID();
  response.cookie(refreshCookie, refreshToken, cookieOptions(true));
  response.cookie(csrfCookie, csrfToken, cookieOptions(false));
}

function assertCookieRequest(request: Request, origin: string | undefined): void {
  const expectedOrigin = process.env.WEB_ORIGIN;
  const csrfHeader = request.get('x-csrf-token');
  const csrfCookieValue = request.cookies?.[csrfCookie] as string | undefined;
  if (!expectedOrigin || origin !== expectedOrigin || !csrfHeader || csrfHeader !== csrfCookieValue) {
    throw new UnauthorizedException('Requisição de sessão inválida.');
  }
}

function publicAuthResult(result: Awaited<ReturnType<AuthService['login']>>) {
  return { accessToken: result.accessToken, expiresIn: result.expiresIn, user: result.user };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new UnauthorizedException('Credenciais inválidas.');
    const result = await this.auth.login(parsed.data.email, parsed.data.password);
    setSessionCookies(response, result.refreshToken);
    return publicAuthResult(result);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    assertCookieRequest(request, origin);
    const refreshToken = request.cookies?.[refreshCookie] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Sessão inválida ou expirada.');
    const result = await this.auth.refresh(refreshToken);
    setSessionCookies(response, result.refreshToken);
    return publicAuthResult(result);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Headers('origin') origin: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    assertCookieRequest(request, origin);
    const refreshToken = request.cookies?.[refreshCookie] as string | undefined;
    await this.auth.logout(refreshToken);
    response.clearCookie(refreshCookie, cookieOptions(true));
    response.clearCookie(csrfCookie, cookieOptions(false));
  }
}
