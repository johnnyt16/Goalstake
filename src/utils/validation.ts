export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parsePositiveNumber(input: string): number | null {
  const n = Number(input);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function parseNonNegativeNumber(input: string): number | null {
  const n = Number(input);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}


