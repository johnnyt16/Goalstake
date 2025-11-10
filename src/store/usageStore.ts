import { create } from 'zustand';
import type { UsageEntry } from '../types/usage';

interface UsageState {
  entries: UsageEntry[];
  upsertEntry: (entry: UsageEntry) => void;
}

export const useUsageStore = create<UsageState>((set) => ({
  entries: [],
  upsertEntry: (entry: UsageEntry) =>
    set((state) => {
      const others = state.entries.filter((e) => e.id !== entry.id);
      return { entries: [...others, entry] };
    }),
}));


