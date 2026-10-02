import { AiProviderError } from '../modules/ai/ai.errors.js';

export type N8nMode = 'mock' | 'real';
export type MockScenario = 'success' | 'invalid-response' | 'http-error' | 'timeout';

export function getN8nMode(): N8nMode {
  const mode = process.env.N8N_MODE ?? 'mock';
  if (mode !== 'mock' && mode !== 'real') throw new AiProviderError('AI_UNAVAILABLE');
  return mode;
}

export function getN8nTimeoutMs(): number {
  const raw = process.env.N8N_TIMEOUT_MS;
  const timeoutMs = raw === undefined ? 60000 : Number(raw);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new AiProviderError('AI_UNAVAILABLE');
  return timeoutMs;
}

export function getMockScenario(): MockScenario {
  const scenario = process.env.N8N_MOCK_SCENARIO ?? 'success';
  if (scenario === 'success' || scenario === 'invalid-response' || scenario === 'http-error' || scenario === 'timeout') return scenario;
  throw new AiProviderError('AI_UNAVAILABLE');
}

export function getN8nHttpCredentials(): { url: string; apiKey: string } {
  const url = process.env.N8N_WEBHOOK_URL;
  const apiKey = process.env.N8N_API_KEY;
  if (!url || !apiKey || apiKey === 'PREENCHER_NO_VSCODE') throw new AiProviderError('AI_UNAVAILABLE');
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('invalid protocol');
  } catch {
    throw new AiProviderError('AI_UNAVAILABLE');
  }
  return { url, apiKey };
}
