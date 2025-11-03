import { create } from 'zustand';
import type { UsageEntry } from '../types/usage';

interface UsageState {
  entries: UsageEntry[];
  upsertEntry: (entry: UsageEntry) => void;
}

export const useUsageStore = create<UsageState>(() => ({
  entries: [],
  upsertEntry: () => {},
}));


