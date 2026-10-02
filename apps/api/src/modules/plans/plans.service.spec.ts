import { describe, expect, it, vi } from 'vitest';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PlansService } from './plans.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

describe('PlansService owner filters and version conflict', () => {
  it('applies ownerId to list and detail, and hides another user plan as 404', async () => {
    const prisma = { plan: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) } };
    const service = new PlansService(prisma as unknown as PrismaService);
    await service.list('owner-a');
    expect(prisma.plan.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { ownerId: 'owner-a' } }));
    await expect(service.get('owner-b', 'plan-private')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.plan.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'plan-private', ownerId: 'owner-b' } }));
  });

  it('scopes update by owner and version, using 404 for another user and 409 for stale own version', async () => {
    const prisma = {
      plan: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findFirst: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'plan-private' }),
      },
    };
    const service = new PlansService(prisma as unknown as PrismaService);
    await expect(service.update('owner-b', 'plan-private', { markdown: '# Aula', version: 1 })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update('owner-a', 'plan-private', { markdown: '# Aula', version: 1 })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.plan.updateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { id: 'plan-private', ownerId: 'owner-b', version: 1 } }));
    expect(prisma.plan.updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: { id: 'plan-private', ownerId: 'owner-a', version: 1 } }));
  });

  it('sanitizes Markdown and increments version only when the current version matches', async () => {
    const saved = { id: 'plan-1', title: 'Aula segura', markdown: '# Aula segura\n\n&lt;script&gt;x&lt;/script&gt;', version: 2, skills: [] };
    const prisma = {
      plan: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findFirst: vi.fn().mockResolvedValue(saved),
      },
    };
    const service = new PlansService(prisma as unknown as PrismaService);
    await expect(service.update('owner-a', 'plan-1', { markdown: '# Aula segura\n<script>x</script>', version: 1 })).resolves.toMatchObject({ version: 2 });
    expect(prisma.plan.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'plan-1', ownerId: 'owner-a', version: 1 },
      data: expect.objectContaining({ markdown: '# Aula segura\n&lt;script&gt;x&lt;/script&gt;', version: { increment: 1 } }),
    }));
  });
});
