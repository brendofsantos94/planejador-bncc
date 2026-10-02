import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AiModule } from '../ai/ai.module.js';
import { PlansController } from './plans.controller.js';
import { PlansService } from './plans.service.js';

@Module({ imports: [DatabaseModule, AuthModule, AiModule], controllers: [PlansController], providers: [PlansService] })
export class PlansModule {}
