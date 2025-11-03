import { useMemo } from 'react';
import type { UsageEntry } from '../types/usage';
import { sumMinutes } from '../utils/calc';

export function useDerivedStats(entries: UsageEntry[]) {
  return useMemo(() => ({
    totalMinutes: sumMinutes(entries),
  }), [entries]);
}


