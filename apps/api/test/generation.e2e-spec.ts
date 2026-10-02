import 'reflect-metadata';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Generation and plan privacy integration (local mock only)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let firstToken = '';
  let secondToken = '';
  let planId = '';
  const requestIds: string[] = [];
  const previousMode = process.env.N8N_MODE;
  const firstEmail = process.env.DEMO_TEACHER_ONE_EMAIL ?? '';
  const firstPassword = process.env.DEMO_TEACHER_ONE_PASSWORD ?? '';
  const secondEmail = process.env.DEMO_TEACHER_TWO_EMAIL ?? '';
  const secondPassword = process.env.DEMO_TEACHER_TWO_PASSWORD ?? '';

  beforeAll(async () => {
    process.env.N8N_MODE = 'mock';
    delete process.env.N8N_MOCK_SCENARIO;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();
    prisma = app.get(PrismaService);
    const one = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: firstEmail, password: firstPassword }).expect(200);
    const two = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: secondEmail, password: secondPassword }).expect(200);
    firstToken = one.body.accessToken as string;
    secondToken = two.body.accessToken as string;
  });

  afterAll(async () => {
    if (requestIds.length) {
      await prisma.plan.deleteMany({ where: { aiRunId: { in: requestIds } } });
      await prisma.aiRun.deleteMany({ where: { requestId: { in: requestIds } } });
    }
    await app?.close();
    if (previousMode === undefined) delete process.env.N8N_MODE; else process.env.N8N_MODE = previousMode;
  });

  it('creates one atomic draft on success; mock failures leave AiRun FAILED with no plan', async () => {
    const skills = await prisma.bnccSkill.findMany({ take: 2, orderBy: { codigo: 'asc' } });
    expect(skills.length).toBeGreaterThan(0);
    const skillCodes = skills.map(({ codigo }) => codigo);
    const successful = await request(app.getHttpServer()).post('/api/v1/plans/generations')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({ skillCodes, instruction: 'Criar atividade em dupla.', durationMinutes: 50, digitalResources: true }).expect(201);
    planId = successful.body.plan.id as string;
    const successRequestId = successful.body.requestId as string;
    requestIds.push(successRequestId);
    expect(await prisma.plan.count({ where: { aiRunId: successRequestId } })).toBe(1);
    expect(await prisma.aiRun.findUniqueOrThrow({ where: { requestId: successRequestId } })).toMatchObject({ status: 'SUCCEEDED', provider: 'mock' });
    expect(successful.body.plan).toMatchObject({ ownerId: (await prisma.user.findUniqueOrThrow({ where: { email: firstEmail.toLowerCase() } })).id, status: 'RASCUNHO', aiAssisted: true });

    for (const [scenario, status, code] of [['invalid-response', 502, 'AI_INVALID_RESPONSE'], ['http-error', 502, 'AI_HTTP_ERROR'], ['timeout', 504, 'AI_TIMEOUT']] as const) {
      process.env.N8N_MOCK_SCENARIO = scenario;
      const failed = await request(app.getHttpServer()).post('/api/v1/plans/generations')
        .set('Authorization', `Bearer ${firstToken}`)
        .send({ skillCodes, instruction: 'Criar atividade em dupla.', durationMinutes: 50, digitalResources: true }).expect(status);
      const id = failed.body.requestId as string;
      expect(id).toMatch(/^[0-9a-f-]{36}$/i);
      requestIds.push(id);
      expect(failed.body.code).toBe(code);
      expect(await prisma.aiRun.findUniqueOrThrow({ where: { requestId: id } })).toMatchObject({ status: 'FAILED', errorCode: code });
      expect(await prisma.plan.count({ where: { aiRunId: id } })).toBe(0);
    }
    delete process.env.N8N_MOCK_SCENARIO;
  });

  it('isolates list, detail, and edit, and enforces optimistic version', async () => {
    if (!planId) throw new Error('Generation success test must establish a draft first');
    const own = await request(app.getHttpServer()).get('/api/v1/plans').set('Authorization', `Bearer ${firstToken}`).expect(200);
    expect(own.body.items.some((plan: { id: string }) => plan.id === planId)).toBe(true);
    const other = await request(app.getHttpServer()).get('/api/v1/plans').set('Authorization', `Bearer ${secondToken}`).expect(200);
    expect(other.body.items.some((plan: { id: string }) => plan.id === planId)).toBe(false);
    await request(app.getHttpServer()).get(`/api/v1/plans/${planId}`).set('Authorization', `Bearer ${secondToken}`).expect(404);
    await request(app.getHttpServer()).patch(`/api/v1/plans/${planId}`).set('Authorization', `Bearer ${secondToken}`).send({ markdown: '# Alterado', version: 1 }).expect(404);
    const updated = await request(app.getHttpServer()).patch(`/api/v1/plans/${planId}`).set('Authorization', `Bearer ${firstToken}`)
      .send({ markdown: '# Plano revisado\n\n<script>alert(1)</script>\n\n## Objetivos', version: 1 }).expect(200);
    expect(updated.body.version).toBe(2);
    expect(updated.body.markdown).not.toContain('<script>');
    await request(app.getHttpServer()).patch(`/api/v1/plans/${planId}`).set('Authorization', `Bearer ${firstToken}`)
      .send({ markdown: '# Conflito\n', version: 1 }).expect(409);
  });
});
