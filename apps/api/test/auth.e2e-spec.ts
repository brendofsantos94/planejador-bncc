import 'reflect-metadata';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

function cookieValues(response: request.Response): { pair: string; csrf: string; refresh: string } {
  const headers = response.headers['set-cookie'] ?? [];
  const values = Array.isArray(headers) ? headers : [headers];
  const refresh = values.find((value) => value.startsWith('bncc_refresh='));
  const csrf = values.find((value) => value.startsWith('bncc_csrf='));
  if (!refresh || !csrf) throw new Error('Authentication response did not set expected session cookies');
  const pair = [refresh, csrf].map((value) => value.split(';')[0] ?? '').join('; ');
  return {
    pair,
    csrf: decodeURIComponent((csrf.split(';')[0] ?? '').split('=').slice(1).join('=')),
    refresh: decodeURIComponent((refresh.split(';')[0] ?? '').split('=').slice(1).join('=')),
  };
}

describe('Auth and session integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  const oneEmail = process.env.DEMO_TEACHER_ONE_EMAIL ?? '';
  const onePassword = process.env.DEMO_TEACHER_ONE_PASSWORD ?? '';
  const twoEmail = process.env.DEMO_TEACHER_TWO_EMAIL ?? '';
  const twoPassword = process.env.DEMO_TEACHER_TWO_PASSWORD ?? '';

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('authenticates both seeded demo accounts without exposing hashes', async () => {
    expect(oneEmail).not.toBe('');
    expect(twoEmail).not.toBe('');
    const first = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: oneEmail, password: onePassword }).expect(200);
    const second = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: twoEmail, password: twoPassword }).expect(200);
    expect(first.body.user.email).toBe(oneEmail.toLowerCase());
    expect(second.body.user.email).toBe(twoEmail.toLowerCase());
    expect(first.body).not.toHaveProperty('passwordHash');
    expect(second.body).not.toHaveProperty('passwordHash');
    const cookies = first.headers['set-cookie'];
    const cookieList = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
    expect(cookieList.some((cookie) => cookie.startsWith('bncc_refresh=') && cookie.includes('HttpOnly'))).toBe(true);
  });

  it('rejects invalid credentials and protects catalog from anonymous requests', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: oneEmail, password: 'incorrect-local-password' }).expect(401);
    await request(app.getHttpServer()).get('/api/v1/bncc/skills').expect(401);
  });

  it('persists only a hash, rotates refresh, enforces eight-hour inactivity, and logs out', async () => {
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: oneEmail, password: onePassword }).expect(200);
    const firstCookies = cookieValues(login);
    const refreshTokenHash = createHash('sha256').update(firstCookies.refresh).digest('hex');
    const session = await prisma.session.findUniqueOrThrow({ where: { refreshTokenHash } });
    expect(session.refreshTokenHash).not.toBe(firstCookies.refresh);
    expect(session.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Origin', 'http://untrusted.local')
      .set('Cookie', firstCookies.pair)
      .set('X-CSRF-Token', firstCookies.csrf)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Origin', webOrigin)
      .set('Cookie', firstCookies.pair)
      .expect(401);

    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Origin', webOrigin)
      .set('Cookie', firstCookies.pair)
      .set('X-CSRF-Token', firstCookies.csrf)
      .expect(200);
    const secondCookies = cookieValues(refreshed);
    const rotated = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(rotated.refreshTokenHash).not.toBe(session.refreshTokenHash);
    expect(rotated.refreshTokenHash).not.toBe(secondCookies.refresh);

    await prisma.session.update({ where: { id: session.id }, data: { expiresAt: new Date(Date.now() - 1) } });
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Origin', webOrigin)
      .set('Cookie', secondCookies.pair)
      .set('X-CSRF-Token', secondCookies.csrf)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/bncc/skills')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Origin', webOrigin)
      .set('Cookie', secondCookies.pair)
      .set('X-CSRF-Token', secondCookies.csrf)
      .expect(204);
    const loggedOut = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    expect(loggedOut.revokedAt).not.toBeNull();
  });
});
