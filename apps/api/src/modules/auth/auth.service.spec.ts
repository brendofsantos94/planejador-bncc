import argon2 from 'argon2';
import { jwtVerify } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

const demoUser = {
  id: '70c9c4f7-531d-48c0-8ce7-4e4b9e5eaa3c',
  email: 'professor1@local.test',
  displayName: 'Professor Um',
  passwordHash: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: ReturnType<typeof vi.fn> };
    session: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    process.env.JWT_ACCESS_SECRET = 'local-test-key-that-is-not-a-real-secret-32';
    process.env.ACCESS_TOKEN_TTL_SECONDS = '900';
    process.env.SESSION_IDLE_TTL_HOURS = '8';
    demoUser.passwordHash = await argon2.hash('local-test-password');
    prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(demoUser) },
      session: {
        create: vi.fn().mockResolvedValue({ id: '7e236b5e-b81f-4220-a0e6-96833728ca5b' }),
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new AuthService(prisma as unknown as PrismaService);
  });

  it('authenticates seeded-style accounts and stores only a refresh hash', async () => {
    const result = await service.login(demoUser.email, 'local-test-password');
    const stored = prisma.session.create.mock.calls[0]?.[0].data as { refreshTokenHash: string };
    const claims = await jwtVerify(
      result.accessToken,
      new TextEncoder().encode(process.env.JWT_ACCESS_SECRET),
    );

    expect(result.user).toEqual({ id: demoUser.id, email: demoUser.email, displayName: demoUser.displayName });
    expect(result).not.toHaveProperty('passwordHash');
    expect(stored.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.refreshTokenHash).not.toBe(result.refreshToken);
    expect(claims.payload.sid).toBe('7e236b5e-b81f-4220-a0e6-96833728ca5b');
    expect(prisma.session.create.mock.calls[0]?.[0].data.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('does not distinguish an unknown account from a wrong password', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.login('absent@local.test', 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
    prisma.user.findUnique.mockResolvedValueOnce(demoUser);
    await expect(service.login(demoUser.email, 'wrong')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates the refresh token and extends the inactivity window', async () => {
    const currentToken = 'current-refresh-token';
    prisma.session.findUnique.mockResolvedValue({
      id: '7e236b5e-b81f-4220-a0e6-96833728ca5b',
      userId: demoUser.id,
      refreshTokenHash: 'not-used-by-the-mock',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user: demoUser,
    });

    const result = await service.refresh(currentToken);
    const update = prisma.session.updateMany.mock.calls[0]?.[0];
    expect(result.refreshToken).not.toBe(currentToken);
    expect(update.where.refreshTokenHash).not.toBe(currentToken);
    expect(update.data.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(update.data.expiresAt.getTime()).toBeGreaterThan(Date.now() + 7 * 60 * 60 * 1000);
  });

  it('rejects an expired session even while validating an access token', async () => {
    const login = await service.login(demoUser.email, 'local-test-password');
    prisma.session.findUnique.mockResolvedValue({
      id: '7e236b5e-b81f-4220-a0e6-96833728ca5b',
      userId: demoUser.id,
      expiresAt: new Date(Date.now() - 1),
      revokedAt: null,
    });
    await expect(service.authenticateAccessToken(login.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
