import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { AiRunsService } from './ai-runs.service.js';
import { HttpN8nClient } from './n8n.client.js';
import { MockN8nClient } from './mock.client.js';

@Module({ imports: [DatabaseModule], providers: [AiRunsService, HttpN8nClient, MockN8nClient], exports: [AiRunsService] })
export class AiModule {}
