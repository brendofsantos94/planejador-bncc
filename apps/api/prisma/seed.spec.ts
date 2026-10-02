import 'dotenv/config';
import { afterAll, describe, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { closeSeedConnection, seed } from './seed.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required for the seed integration test');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

describe('idempotent development seed', () => {
  afterAll(async () => {
    await Promise.all([prisma.$disconnect(), closeSeedConnection()]);
  });

  it('can run twice without duplicating demo teachers or BNCC codes', async () => {
    const first = await seed();
    const usersAfterFirst = await prisma.user.count();
    const skillsAfterFirst = await prisma.bnccSkill.count();
    const second = await seed();
    const usersAfterSecond = await prisma.user.count();
    const skillsAfterSecond = await prisma.bnccSkill.count();

    expect(first.users).toBe(2);
    expect(second).toEqual(first);
    expect(usersAfterSecond).toBe(usersAfterFirst);
    expect(skillsAfterSecond).toBe(skillsAfterFirst);
    expect(skillsAfterSecond).toBe(5);
  });
});
