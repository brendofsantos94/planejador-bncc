import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiRunsService } from './ai-runs.service.js';
import { HttpN8nClient } from './n8n.client.js';
import { MockN8nClient } from './mock.client.js';
import type { PrismaService } from '../../database/prisma.service.js';

const input = { skillCodes: ['EF01CO01'], instruction: 'Criar atividade.', durationMinutes: 45, digitalResources: false };
const skills = [{ id: 'skill-1', codigo: 'EF01CO01', descricao: 'Habilidade oficial.' }];

describe('AiRunsService transaction boundaries', () => {
  const previousMode = process.env.N8N_MODE;
  const previousScenario = process.env.N8N_MOCK_SCENARIO;
  afterEach(() => {
    if (previousMode === undefined) delete process.env.N8N_MODE; else process.env.N8N_MODE = previousMode;
    if (previousScenario === undefined) delete process.env.N8N_MOCK_SCENARIO; else process.env.N8N_MOCK_SCENARIO = previousScenario;
  });

  function setup() {
    const tx = {
      plan: { create: vi.fn().mockResolvedValue({ id: 'plan-1', status: 'RASCUNHO', aiAssisted: true, skills: [] }) },
      aiRun: { update: vi.fn().mockResolvedValue({}) },
    };
    const prisma = {
      bnccSkill: { findMany: vi.fn().mockResolvedValue(skills) },
      aiRun: { create: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn(async (work: (txArg: typeof tx) => unknown) => work(tx)),
    };
    const service = new AiRunsService(prisma as unknown as PrismaService, new HttpN8nClient(), new MockN8nClient());
    return { service, prisma, tx };
  }

  it('persists PENDING first and creates exactly one Plan with SUCCEEDED in one transaction', async () => {
    process.env.N8N_MODE = 'mock';
    process.env.N8N_MOCK_SCENARIO = 'success';
    const { service, prisma, tx } = setup();
    await expect(service.generate('user-1', 'teacher@local.test', '00000000-0000-4000-8000-000000000001', input)).resolves.toMatchObject({ id: 'plan-1' });
    expect(prisma.aiRun.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING', provider: 'mock' }) }));
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.plan.create).toHaveBeenCalledTimes(1);
    expect(tx.aiRun.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'SUCCEEDED' }) }));
  });

  it.each([
    ['invalid-response', 'AI_INVALID_RESPONSE'], ['http-error', 'AI_HTTP_ERROR'], ['timeout', 'AI_TIMEOUT'],
  ] as const)('marks %s as FAILED without creating a partial plan', async (scenario, code) => {
    process.env.N8N_MODE = 'mock';
    process.env.N8N_MOCK_SCENARIO = scenario;
    const { service, prisma, tx } = setup();
    await expect(service.generate('user-1', 'teacher@local.test', '00000000-0000-4000-8000-000000000002', input)).rejects.toMatchObject({ response: expect.objectContaining({ code }) });
    expect(prisma.aiRun.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING' }) }));
    expect(prisma.aiRun.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED', errorCode: code }) }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.plan.create).not.toHaveBeenCalled();
  });
});
