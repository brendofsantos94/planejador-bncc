import { BadGatewayException, GatewayTimeoutException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import type { GenerationRequest } from '@planejador/shared';
import { n8nResponseSchema } from '@planejador/shared';
import { AiProviderError } from './ai.errors.js';
import { HttpN8nClient } from './n8n.client.js';
import { MockN8nClient } from './mock.client.js';
import { toN8nPayload } from './n8n-payload.js';
import { markdownTitle, sanitizeMarkdown } from '../plans/markdown/sanitize-markdown.js';
import { getN8nMode } from '../../config/n8n.config.js';

@Injectable()
export class AiRunsService {
  constructor(private readonly prisma: PrismaService, private readonly http: HttpN8nClient, private readonly mock: MockN8nClient) {}

  async generate(userId: string, email: string, requestId: string, input: GenerationRequest) {
    const skills = await this.prisma.bnccSkill.findMany({ where: { codigo: { in: input.skillCodes } } });
    if (skills.length !== new Set(input.skillCodes).size) throw new UnprocessableEntityException('Selecione habilidades BNCC existentes.');
    const payload = toN8nPayload(email, input, skills);
    let mode: 'mock' | 'real';
    try { mode = getN8nMode(); } catch { throw new BadGatewayException('Provedor de geração indisponível.'); }
    const provider = mode === 'real' ? 'n8n' : 'mock';
    await this.prisma.aiRun.create({ data: {
      userId, requestId, inputSnapshot: input as unknown as Prisma.InputJsonValue,
      status: 'PENDING', provider,
    } });
    try {
      const client = mode === 'real' ? this.http : this.mock;
      const output = await client.generate(payload, requestId);
      const checked = n8nResponseSchema.parse(output);
      if (checked.sessao !== email || checked.habilidade !== payload.habilidade) throw new AiProviderError('AI_INVALID_RESPONSE');
      const markdown = sanitizeMarkdown(checked.answer);
      const title = markdownTitle(markdown);
      if (!title) throw new AiProviderError('AI_INVALID_RESPONSE');
      return await this.prisma.$transaction(async (tx) => {
        const plan = await tx.plan.create({ data: {
          ownerId: userId, aiRunId: requestId, title, markdown, status: 'RASCUNHO', aiAssisted: true,
          skills: { create: skills.map(({ id }) => ({ skillId: id })) },
        }, include: { skills: { include: { skill: true } } } });
        await tx.aiRun.update({ where: { requestId }, data: { status: 'SUCCEEDED', finishedAt: new Date() } });
        return { ...plan, skills: plan.skills.map(({ skill }) => skill) };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      const code = error instanceof AiProviderError ? error.code : 'AI_INVALID_RESPONSE';
      await this.prisma.aiRun.update({ where: { requestId }, data: { status: 'FAILED', errorCode: code, finishedAt: new Date() } });
      if (code === 'AI_TIMEOUT') throw new GatewayTimeoutException({ requestId, code: 'AI_TIMEOUT', message: 'A geração excedeu o tempo limite.' });
      throw new BadGatewayException({ requestId, code, message: 'Não foi possível validar a resposta de geração.' });
    }
  }
}
