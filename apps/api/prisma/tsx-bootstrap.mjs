// Node on Windows does not expose process.geteuid; tsx otherwise falls back to
// os.userInfo(), which can fail in restricted environments before the seed runs.
process.geteuid ??= () => 0;
await import('tsx/esm');
