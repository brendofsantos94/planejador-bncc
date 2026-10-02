import { z } from 'zod';

export const skillFiltersSchema = z.object({
  nivel: z.string().trim().min(1).max(120).optional(),
  ano: z.coerce.number().int().min(1).max(20).optional(),
  eixo: z.string().trim().min(1).max(160).optional(),
  codigo: z.string().trim().min(1).max(24).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

export type SkillFilters = z.infer<typeof skillFiltersSchema>;
