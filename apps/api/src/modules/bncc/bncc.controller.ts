import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { skillFiltersSchema } from './dto/query-skills.dto.js';
import { BnccService } from './bncc.service.js';

@Controller('bncc/skills')
@UseGuards(AccessTokenGuard)
export class BnccController {
  constructor(private readonly bncc: BnccService) {}

  @Get()
  async list(@Query() query: Record<string, unknown>) {
    const filters = skillFiltersSchema.safeParse(query);
    if (!filters.success) throw new BadRequestException('Filtros de habilidade inválidos.');
    return { items: await this.bncc.findSkills(filters.data) };
  }
}
