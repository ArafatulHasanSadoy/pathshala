export function nid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export function nextCode(existing: string[], prefix: string, width = 3): string {
  let max = 0;
  for (const c of existing) {
    const n = Number.parseInt(c.replace(/\D/g, "").slice(-width), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(width, "0")}`;
}
