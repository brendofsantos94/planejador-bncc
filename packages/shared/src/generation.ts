import { z } from 'zod';

export const generationRequestSchema = z.object({
  skillCodes: z.array(z.string().trim().min(1).max(24)).min(1).max(30),
  instruction: z.string().trim().min(1).max(4000),
  durationMinutes: z.number().int().positive().max(1440),
  digitalResources: z.boolean(),
}).strict().refine((input) => new Set(input.skillCodes).size === input.skillCodes.length, 'Habilidades duplicadas não são permitidas.');

export const n8nRequestSchema = z.object({
  sessao: z.string().email().max(254),
  habilidade: z.string().min(1).max(30000),
  instrucao: z.string().min(1).max(4000),
  duracao: z.number().int().positive().max(1440),
  recursos_digitais: z.boolean(),
}).strict();

const heading = (text: string, names: readonly string[]) => new RegExp(`^#{1,6}\\s*[^\\n]*${names.join('|')}[^\\n]*$`, 'im').test(text);

export const n8nResponseSchema = z.object({
  success: z.literal(true),
  sessao: z.string().email(),
  habilidade: z.string().min(1),
  answer: z.string().trim().min(1).max(100000),
  format: z.literal('markdown'),
}).strict().superRefine((response, ctx) => {
  if (!/^#\s+\S/m.test(response.answer)) ctx.addIssue({ code: 'custom', path: ['answer'], message: 'Markdown precisa de título.' });
  for (const [label, names] of [
    ['objetivos', ['objetivo']], ['atividades', ['atividade']], ['avaliação', ['avaliação', 'avaliacao']],
  ] as const) {
    if (!heading(response.answer, names)) ctx.addIssue({ code: 'custom', path: ['answer'], message: `Markdown precisa da seção ${label}.` });
  }
});

export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type N8nRequest = z.infer<typeof n8nRequestSchema>;
export type N8nResponse = z.infer<typeof n8nResponseSchema>;
