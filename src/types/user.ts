export interface AppGoal {
  appName: string;
  dailyGoalMinutes: number;
}

export interface User {
  id: string;
  name: string;
  dailyGoalMinutes: number;
  appGoals?: AppGoal[]; // Optional app-specific goals
}


