import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BnccModule } from './modules/bncc/bncc.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({ imports: [DatabaseModule, AuthModule, BnccModule, HealthModule] })
export class AppModule {}
