import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import type { SkillFilters } from './dto/query-skills.dto.js';

@Injectable()
export class BnccService {
  constructor(private readonly prisma: PrismaService) {}

  findSkills(filters: SkillFilters) {
    const where: Prisma.BnccSkillWhereInput = {};
    if (filters.nivel) where.nivel = { contains: filters.nivel, mode: 'insensitive' };
    if (filters.ano !== undefined) where.ano = filters.ano;
    if (filters.eixo) where.eixo = { contains: filters.eixo, mode: 'insensitive' };
    if (filters.codigo) where.codigo = { contains: filters.codigo, mode: 'insensitive' };
    if (filters.q) {
      where.OR = [
        { codigo: { contains: filters.q, mode: 'insensitive' } },
        { descricao: { contains: filters.q, mode: 'insensitive' } },
        { explicacao: { contains: filters.q, mode: 'insensitive' } },
        { exemplos: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.bnccSkill.findMany({ where, orderBy: { codigo: 'asc' } });
  }
}
