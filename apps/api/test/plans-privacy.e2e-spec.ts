import { describe, expect, it } from 'vitest';
import { sanitizeMarkdown, markdownTitle } from '../src/modules/plans/markdown/sanitize-markdown.js';

describe('Markdown safety', () => {
  it('escapes raw HTML, neutralizes executable links, and extracts a bounded title', () => {
    const value = sanitizeMarkdown('# Aula\n<script>alert(1)</script>\n[link](javascript:alert(1))');
    expect(value).toContain('&lt;script&gt;');
    expect(value).not.toContain('<script>');
    expect(value).not.toContain('javascript:');
    expect(sanitizeMarkdown('<img src=x onerror=alert(1')).toBe('&lt;img src=x onerror=alert(1');
    expect(markdownTitle(value)).toBe('Aula');
  });
});
