import { useMemo } from 'react';
import { getCurrentWeekRange } from '../utils/dates';

export function useWeeklyRange() {
  return useMemo(() => getCurrentWeekRange(), []);
}


