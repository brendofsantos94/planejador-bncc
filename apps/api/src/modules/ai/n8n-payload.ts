import type { N8nRequest } from '@planejador/shared';
import type { GenerationRequest } from '@planejador/shared';

export interface GenerationSkill { codigo: string; descricao: string }

export function toN8nPayload(email: string, request: GenerationRequest, skills: GenerationSkill[]): N8nRequest {
  const byCode = new Map(skills.map((skill) => [skill.codigo, skill]));
  return {
    sessao: email,
    habilidade: request.skillCodes.map((code) => {
      const skill = byCode.get(code);
      if (!skill) throw new Error('Selected skill not found');
      return `${skill.codigo} — ${skill.descricao}`;
    }).join('\n'),
    instrucao: request.instruction,
    duracao: request.durationMinutes,
    recursos_digitais: request.digitalResources,
  };
}
