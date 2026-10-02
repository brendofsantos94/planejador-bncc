import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { z } from 'zod';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const skillSchema = z.object({
  nivel: z.string().min(1),
  ano: z.number().int().nullable().optional(),
  eixo: z.string().min(1),
  codigo: z.string().min(1),
  descricao: z.string().min(1),
  explicacao: z.string(),
  exemplos: z.string(),
});

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value.startsWith('replace-with-')) {
    throw new Error(`${name} must be set to a local value before seeding`);
  }
  return value;
}

const connectionString = requiredEnv('DATABASE_URL');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

export async function closeSeedConnection(): Promise<void> {
  await prisma.$disconnect();
}

export async function seed(): Promise<{ users: number; skills: number }> {
  const users = [
    {
      email: requiredEnv('DEMO_TEACHER_ONE_EMAIL').toLowerCase(),
      password: requiredEnv('DEMO_TEACHER_ONE_PASSWORD'),
      displayName: requiredEnv('DEMO_TEACHER_ONE_NAME'),
    },
    {
      email: requiredEnv('DEMO_TEACHER_TWO_EMAIL').toLowerCase(),
      password: requiredEnv('DEMO_TEACHER_TWO_PASSWORD'),
      displayName: requiredEnv('DEMO_TEACHER_TWO_NAME'),
    },
  ];

  for (const user of users) {
    const passwordHash = await argon2.hash(user.password, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, displayName: user.displayName },
      create: { email: user.email, passwordHash, displayName: user.displayName },
    });
  }

  const catalogPath = resolve(process.cwd(), '../../docs/data/bncc-recorte.json');
  const catalog = z.array(skillSchema).parse(JSON.parse(await readFile(catalogPath, 'utf8')));
  for (const skill of catalog) {
    await prisma.bnccSkill.upsert({
      where: { codigo: skill.codigo },
      update: {
        nivel: skill.nivel,
        ano: skill.ano ?? null,
        eixo: skill.eixo,
        descricao: skill.descricao,
        explicacao: skill.explicacao,
        exemplos: skill.exemplos,
      },
      create: {
        nivel: skill.nivel,
        ano: skill.ano ?? null,
        eixo: skill.eixo,
        codigo: skill.codigo,
        descricao: skill.descricao,
        explicacao: skill.explicacao,
        exemplos: skill.exemplos,
      },
    });
  }

  console.info(`Seed concluído: ${users.length} professores e ${catalog.length} habilidades.`);
  return { users: users.length, skills: catalog.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await seed();
  } finally {
    await prisma.$disconnect();
  }
}
