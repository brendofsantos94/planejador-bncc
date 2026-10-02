import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { UnprocessableEntityException } from '@nestjs/common';
import { PlansController } from './plans.controller.js';
import { AccessTokenGuard } from '../auth/access-token.guard.js';

describe('PlansController generation boundary', () => {
  it('requires the authentication guard and returns a requestId with generated plan', async () => {
    expect(Reflect.getMetadata('__guards__', PlansController)).toContain(AccessTokenGuard);
    const generate = vi.fn().mockResolvedValue({ id: 'plan-1' });
    const controller = new PlansController({} as never, { generate } as never);
    const result = await controller.generate(
      { skillCodes: ['EF01CO01'], instruction: 'Atividade.', durationMinutes: 30, digitalResources: false },
      { user: { id: 'user-1', email: 'teacher@local.test', sessionId: 'session-1' } } as never,
    );
    expect(result.requestId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.plan).toEqual({ id: 'plan-1' });
    expect(generate).toHaveBeenCalledWith('user-1', 'teacher@local.test', result.requestId, expect.objectContaining({ skillCodes: ['EF01CO01'] }));
  });

  it('rejects invalid REST input before invoking generation', async () => {
    const generate = vi.fn();
    const controller = new PlansController({} as never, { generate } as never);
    await expect(controller.generate({}, { user: { id: 'user-1', email: 'teacher@local.test' } } as never)).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(generate).not.toHaveBeenCalled();
  });
});
