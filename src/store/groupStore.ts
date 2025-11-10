import { create } from 'zustand';
import type { Group } from '../types/group';

interface GroupState {
  group: Group | null;
  setGroup: (group: Group) => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  group: null,
  setGroup: (group: Group) => set({ group }),
}));


