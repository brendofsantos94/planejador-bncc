export function sanitizeMarkdown(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\]\(\s*(?:javascript|vbscript|data):[^)]*\)/gi, ']')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

export function markdownTitle(markdown: string): string | null {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return title && title.length <= 240 ? title : null;
}
