import type { UsageEntry } from '../types/usage';

export function sumMinutes(entries: UsageEntry[]): number {
  return entries.reduce((acc, e) => acc + e.minutesUsed, 0);
}


