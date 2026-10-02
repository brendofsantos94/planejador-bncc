import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { PrismaService } from '../../database/prisma.service.js';
import type { AuthResult, PublicUser } from './auth.schemas.js';

interface AccessClaims {
  sub: string;
  sid: string;
  email: string;
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function accessSecret(): Uint8Array {
  const value = process.env.JWT_ACCESS_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters');
  return new TextEncoder().encode(value);
}

function ttlSeconds(): number {
  const parsed = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 900;
}

function idleTtlMs(): number {
  const hours = Number(process.env.SESSION_IDLE_TTL_HOURS ?? 8);
  const safeHours = Number.isSafeInteger(hours) && hours > 0 ? hours : 8;
  return safeHours * 60 * 60 * 1000;
}

function publicUser(user: { id: string; email: string; displayName: string }): PublicUser {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private async createAccessToken(user: PublicUser, sessionId: string): Promise<string> {
    return new SignJWT({ sid: sessionId, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${ttlSeconds()}s`)
      .sign(accessSecret());
  }

  private async createSession(userId: string): Promise<{ id: string; refreshToken: string }> {
    const refreshToken = randomBytes(48).toString('base64url');
    const now = new Date();
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: tokenHash(refreshToken),
        lastSeenAt: now,
        expiresAt: new Date(now.getTime() + idleTtlMs()),
      },
      select: { id: true },
    });
    return { id: session.id, refreshToken };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = user ? await argon2.verify(user.passwordHash, password).catch(() => false) : false;
    if (!user || !valid) throw new UnauthorizedException('Credenciais inválidas.');

    const safeUser = publicUser(user);
    const session = await this.createSession(user.id);
    return {
      accessToken: await this.createAccessToken(safeUser, session.id),
      expiresIn: ttlSeconds(),
      user: safeUser,
      refreshToken: session.refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const currentHash = tokenHash(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: currentHash },
      include: { user: true },
    });
    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now) {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }

    const nextRefresh = randomBytes(48).toString('base64url');
    const nextExpiry = new Date(now.getTime() + idleTtlMs());
    const rotated = await this.prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash: currentHash, revokedAt: null, expiresAt: { gt: now } },
      data: {
        refreshTokenHash: tokenHash(nextRefresh),
        lastSeenAt: now,
        expiresAt: nextExpiry,
      },
    });
    if (rotated.count !== 1) throw new UnauthorizedException('Sessão inválida ou expirada.');

    const safeUser = publicUser(session.user);
    return {
      accessToken: await this.createAccessToken(safeUser, session.id),
      expiresIn: ttlSeconds(),
      user: safeUser,
      refreshToken: nextRefresh,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: tokenHash(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async authenticateAccessToken(token: string): Promise<AccessClaims> {
    try {
      const { payload } = await jwtVerify(token, accessSecret(), { algorithms: ['HS256'] });
      const sub = payload.sub;
      const sid = payload.sid;
      const email = payload.email;
      if (typeof sub !== 'string' || typeof sid !== 'string' || typeof email !== 'string') {
        throw new Error('Invalid claims');
      }
      const now = new Date();
      const session = await this.prisma.session.findUnique({ where: { id: sid } });
      if (!session || session.userId !== sub || session.revokedAt || session.expiresAt <= now) {
        throw new Error('Invalid session');
      }
      await this.prisma.session.update({
        where: { id: sid },
        data: { lastSeenAt: now, expiresAt: new Date(now.getTime() + idleTtlMs()) },
      });
      return { sub, sid, email };
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
  }
}
