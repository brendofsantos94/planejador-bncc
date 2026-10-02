export class AiProviderError extends Error {
  constructor(readonly code: 'AI_TIMEOUT' | 'AI_HTTP_ERROR' | 'AI_INVALID_RESPONSE' | 'AI_UNAVAILABLE') {
    super(code);
    this.name = 'AiProviderError';
  }
}
