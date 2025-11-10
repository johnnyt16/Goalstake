export interface AppUsage {
  appName: string;
  minutesUsed: number;
}

export interface UsageEntry {
  id: string;
  userId: string;
  date: string; // ISO
  minutesUsed: number;
  weeklyMinutes?: number; // Total for the week
  dailyAverage?: number; // Average per day for the week
  appUsage?: AppUsage[]; // Per-app breakdown
}


