import { Injectable } from '@nestjs/common';
import { n8nResponseSchema, type N8nRequest, type N8nResponse } from '@planejador/shared';
import { getN8nHttpCredentials, getN8nTimeoutMs } from '../../config/n8n.config.js';
import { AiProviderError } from './ai.errors.js';

export interface N8nClient { generate(payload: N8nRequest, requestId: string): Promise<N8nResponse> }

@Injectable()
export class HttpN8nClient implements N8nClient {
  async generate(payload: N8nRequest, requestId: string): Promise<N8nResponse> {
    const { url, apiKey } = getN8nHttpCredentials();
    const timeoutMs = getN8nTimeoutMs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-Request-Id': requestId },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (error) {
        if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError')) throw new AiProviderError('AI_TIMEOUT');
        throw new AiProviderError('AI_UNAVAILABLE');
      }
      if (!response.ok) throw new AiProviderError('AI_HTTP_ERROR');
      let value: unknown;
      try { value = await response.json(); } catch {
        if (controller.signal.aborted) throw new AiProviderError('AI_TIMEOUT');
        throw new AiProviderError('AI_INVALID_RESPONSE');
      }
      const parsed = n8nResponseSchema.safeParse(value);
      if (!parsed.success || parsed.data.sessao !== payload.sessao || parsed.data.habilidade !== payload.habilidade) {
        throw new AiProviderError('AI_INVALID_RESPONSE');
      }
      return parsed.data;
    } finally {
      clearTimeout(timeout);
    }
  }
}
