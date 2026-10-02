import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { markdownTitle, sanitizeMarkdown } from './markdown/sanitize-markdown.js';
import { z } from 'zod';

const zPlanUpdate = z.object({ markdown: z.string().trim().min(1).max(100000), version: z.number().int().positive() }).strict();

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerId: string) {
    const plans = await this.prisma.plan.findMany({
      where: { ownerId }, orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, status: true, aiAssisted: true, version: true, updatedAt: true },
    });
    return { items: plans };
  }

  async get(ownerId: string, id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, ownerId }, include: { skills: { include: { skill: true } } },
    });
    if (!plan) throw new NotFoundException('Plano não encontrado.');
    return { ...plan, skills: plan.skills.map(({ skill }) => skill) };
  }

  async update(ownerId: string, id: string, input: unknown) {
    const parsed = zPlanUpdate.safeParse(input);
    if (!parsed.success) throw new UnprocessableEntityException('Conteúdo ou versão inválidos.');
    const markdown = sanitizeMarkdown(parsed.data.markdown);
    const title = markdownTitle(markdown);
    if (!title || markdown.length > 100000) throw new UnprocessableEntityException('Markdown inválido.');
    const result = await this.prisma.plan.updateMany({
      where: { id, ownerId, version: parsed.data.version },
      data: { markdown, title, version: { increment: 1 }, lastSavedAt: new Date() },
    });
    if (result.count === 0) {
      const owned = await this.prisma.plan.findFirst({ where: { id, ownerId }, select: { id: true } });
      if (!owned) throw new NotFoundException('Plano não encontrado.');
      throw new ConflictException({ statusCode: 409, code: 'STALE_VERSION', message: 'O plano mudou. Recarregue antes de salvar.' });
    }
    return this.get(ownerId, id);
  }

}
