import 'reflect-metadata';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';

describe('BNCC catalog integration', () => {
  let app: INestApplication;
  const email = process.env.DEMO_TEACHER_ONE_EMAIL ?? '';
  const password = process.env.DEMO_TEACHER_ONE_PASSWORD ?? '';
  let token = '';

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    await app.init();
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password }).expect(200);
    token = login.body.accessToken as string;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('combines grade, axis, and text filters and returns only matching skills', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/bncc/skills')
      .query({ ano: 2, eixo: 'Mundo Digital', q: 'hardware' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].codigo).toBe('EF02CO04');
  });

  it('supports code search, empty results, and rejects malformed filters', async () => {
    const byCode = await request(app.getHttpServer())
      .get('/api/v1/bncc/skills')
      .query({ codigo: 'EF01CO01' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(byCode.body.items.map((skill: { codigo: string }) => skill.codigo)).toEqual(['EF01CO01']);

    const empty = await request(app.getHttpServer())
      .get('/api/v1/bncc/skills')
      .query({ q: 'texto sem correspondência' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(empty.body.items).toEqual([]);

    await request(app.getHttpServer())
      .get('/api/v1/bncc/skills')
      .query({ ano: -2 })
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });
});
