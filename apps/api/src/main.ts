import 'reflect-metadata';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { AppModule } from './app.module.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  SESSION_IDLE_TTL_HOURS: z.coerce.number().int().positive().default(8),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
});

async function bootstrap(): Promise<void> {
  const env = environmentSchema.parse(process.env);
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: env.WEB_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
  });
  app.setGlobalPrefix('api/v1');
  await app.listen(env.PORT, '0.0.0.0');
}

void bootstrap();
