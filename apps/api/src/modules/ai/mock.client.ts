import { Injectable } from '@nestjs/common';
import { n8nResponseSchema, type N8nRequest, type N8nResponse } from '@planejador/shared';
import { AiProviderError } from './ai.errors.js';
import type { N8nClient } from './n8n.client.js';
import { getMockScenario } from '../../config/n8n.config.js';

@Injectable()
export class MockN8nClient implements N8nClient {
  async generate(payload: N8nRequest): Promise<N8nResponse> {
    switch (getMockScenario()) {
      case 'timeout': throw new AiProviderError('AI_TIMEOUT');
      case 'http-error': throw new AiProviderError('AI_HTTP_ERROR');
      case 'invalid-response': throw new AiProviderError('AI_INVALID_RESPONSE');
      case 'success': break;
      default: throw new AiProviderError('AI_UNAVAILABLE');
    }
    const result = n8nResponseSchema.parse({
      success: true,
      sessao: payload.sessao,
      habilidade: payload.habilidade,
      answer: '# Plano de aula\n\n## Objetivos\n- Desenvolver a habilidade selecionada.\n\n## Atividades\n1. Realizar atividade orientada.\n\n## Avaliação\nObservar a participação e as produções.',
      format: 'markdown',
    });
    return result;
  }
}
