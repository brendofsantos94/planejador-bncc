import { describe, expect, it } from 'vitest';
import { generationRequestSchema, n8nResponseSchema } from '@planejador/shared';

const valid = { success: true, sessao: 'teacher@local.test', habilidade: 'EF01CO01 — descrição', answer: '# Plano\n## Objetivos\nA\n## Atividades\nB\n## Avaliação\nC', format: 'markdown' };

describe('n8n response validation', () => {
  it('accepts the exact response contract with required sections', () => {
    expect(n8nResponseSchema.safeParse(valid).success).toBe(true);
  });
  it.each([
    { ...valid, success: false }, { ...valid, format: 'html' }, { ...valid, answer: '# Plano\n## Objetivos\nA' },
    { ...valid, extra: 'not allowed' }, { ...valid, answer: 7 },
  ])('rejects invalid response shape or content', (value) => {
    expect(n8nResponseSchema.safeParse(value).success).toBe(false);
  });
});

describe('generation request validation', () => {
  it('accepts one or several unique skill codes with the confirmed field types', () => {
    expect(generationRequestSchema.safeParse({ skillCodes: ['EF01CO01', 'EF01CO02'], instruction: 'Atividade.', durationMinutes: 45, digitalResources: false }).success).toBe(true);
  });
  it.each([
    { skillCodes: [], instruction: 'Atividade.', durationMinutes: 45, digitalResources: false },
    { skillCodes: ['EF01CO01', 'EF01CO01'], instruction: 'Atividade.', durationMinutes: 45, digitalResources: false },
    { skillCodes: ['EF01CO01'], instruction: ' ', durationMinutes: 45, digitalResources: false },
    { skillCodes: ['EF01CO01'], instruction: 'Atividade.', durationMinutes: 45.5, digitalResources: false },
    { skillCodes: ['EF01CO01'], instruction: 'Atividade.', durationMinutes: 45, digitalResources: 'sim' },
  ])('rejects invalid generation input', (value) => {
    expect(generationRequestSchema.safeParse(value).success).toBe(false);
  });
});
