import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { defineConfig, env } from 'prisma/config';

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --import ./prisma/tsx-bootstrap.mjs prisma/seed.ts',
  },
  datasource: { url: env('DATABASE_URL') },
});
