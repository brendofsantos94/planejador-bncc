import { Body, Controller, Get, Param, Patch, Post, Req, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AccessTokenGuard, type AuthenticatedRequest } from '../auth/access-token.guard.js';
import { generationRequestSchema } from '@planejador/shared';
import { AiRunsService } from '../ai/ai-runs.service.js';
import { PlansService } from './plans.service.js';

@Controller('plans')
@UseGuards(AccessTokenGuard)
export class PlansController {
  constructor(private readonly plans: PlansService, private readonly aiRuns: AiRunsService) {}

  @Post('generations')
  async generate(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const parsed = generationRequestSchema.safeParse(body);
    if (!parsed.success) throw new UnprocessableEntityException('Solicitação de geração inválida.');
    const requestId = randomUUID();
    const plan = await this.aiRuns.generate(request.user.id, request.user.email, requestId, parsed.data);
    return { requestId, plan };
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) { return this.plans.list(request.user.id); }

  @Get(':id')
  get(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return this.plans.get(request.user.id, id); }

  @Patch(':id')
  update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) {
    return this.plans.update(request.user.id, id, body);
  }
}
