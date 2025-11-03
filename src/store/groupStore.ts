import { create } from 'zustand';
import type { Group } from '../types/group';

interface GroupState {
  group: Group | null;
  setGroup: (group: Group) => void;
}

export const useGroupStore = create<GroupState>(() => ({
  group: null,
  setGroup: () => {},
}));


