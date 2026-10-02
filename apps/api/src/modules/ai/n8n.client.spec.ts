import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpN8nClient } from './n8n.client.js';
import { toN8nPayload } from './n8n-payload.js';
import { MockN8nClient } from './mock.client.js';
import { AiProviderError } from './ai.errors.js';

const generation = { skillCodes: ['EF01CO01', 'EF01CO02'], instruction: 'Criar atividade em dupla.', durationMinutes: 50, digitalResources: true };
const skills = [{ codigo: 'EF01CO01', descricao: 'Primeira habilidade.' }, { codigo: 'EF01CO02', descricao: 'Segunda habilidade.' }];
const responseBody = (payload: ReturnType<typeof toN8nPayload>) => ({
  success: true, sessao: payload.sessao, habilidade: payload.habilidade,
  answer: '# Plano de aula\n## Objetivos\nObjetivo.\n## Atividades\nAtividade.\n## Avaliação\nAvaliação.', format: 'markdown',
});

describe('n8n contract', () => {
  const previous = { url: process.env.N8N_WEBHOOK_URL, key: process.env.N8N_API_KEY, timeout: process.env.N8N_TIMEOUT_MS };
  afterEach(() => {
    vi.unstubAllGlobals();
    if (previous.url === undefined) delete process.env.N8N_WEBHOOK_URL; else process.env.N8N_WEBHOOK_URL = previous.url;
    if (previous.key === undefined) delete process.env.N8N_API_KEY; else process.env.N8N_API_KEY = previous.key;
    if (previous.timeout === undefined) delete process.env.N8N_TIMEOUT_MS; else process.env.N8N_TIMEOUT_MS = previous.timeout;
  });

  it('serializes exactly the confirmed fields and one line per skill', () => {
    expect(toN8nPayload('teacher@local.test', generation, skills)).toEqual({
      sessao: 'teacher@local.test', habilidade: 'EF01CO01 — Primeira habilidade.\nEF01CO02 — Segunda habilidade.',
      instrucao: 'Criar atividade em dupla.', duracao: 50, recursos_digitais: true,
    });
  });

  it('sends the exact contract headers/body once and accepts a coherent response', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://example.invalid/hook';
    process.env.N8N_API_KEY = 'unit-test-only';
    const payload = toN8nPayload('teacher@local.test', generation, skills);
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(responseBody(payload)), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    await expect(new HttpN8nClient().generate(payload, 'request-uuid')).resolves.toMatchObject({ success: true, format: 'markdown' });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.invalid/hook');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json', 'X-API-Key': 'unit-test-only', 'X-Request-Id': 'request-uuid' });
    expect(JSON.parse(String(options.body))).toEqual(payload);
  });

  it('does not retry non-2xx or invalid response', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://example.invalid/hook';
    process.env.N8N_API_KEY = 'unit-test-only';
    const payload = toN8nPayload('teacher@local.test', generation, skills);
    for (const response of [new Response('ignored', { status: 503 }), new Response(JSON.stringify({ ...responseBody(payload), habilidade: 'divergente' }), { status: 200 })]) {
      const fetch = vi.fn().mockResolvedValue(response);
      vi.stubGlobal('fetch', fetch);
      await expect(new HttpN8nClient().generate(payload, 'request-uuid')).rejects.toBeInstanceOf(AiProviderError);
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  });

  it('honors timeout without retry, and mock scenarios never use fetch', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://example.invalid/hook';
    process.env.N8N_API_KEY = 'unit-test-only';
    process.env.N8N_TIMEOUT_MS = '5';
    const fetch = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    vi.stubGlobal('fetch', fetch);
    const payload = toN8nPayload('teacher@local.test', generation, skills);
    await expect(new HttpN8nClient().generate(payload, 'request-uuid')).rejects.toMatchObject({ code: 'AI_TIMEOUT' });
    expect(fetch).toHaveBeenCalledTimes(1);
    const mock = new MockN8nClient();
    process.env.N8N_MOCK_SCENARIO = 'success';
    await expect(mock.generate(payload)).resolves.toMatchObject({ success: true });
    for (const [scenario, code] of [['invalid-response', 'AI_INVALID_RESPONSE'], ['http-error', 'AI_HTTP_ERROR'], ['timeout', 'AI_TIMEOUT']] as const) {
      process.env.N8N_MOCK_SCENARIO = scenario;
      await expect(mock.generate(payload)).rejects.toMatchObject({ code });
    }
    expect(fetch).toHaveBeenCalledTimes(1);
    delete process.env.N8N_MOCK_SCENARIO;
  });
});
