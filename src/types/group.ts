export interface GroupMember {
  id: string;
  name: string;
  dailyGoalMinutes: number;
}

export interface Group {
  id: string;
  name: string;
  members: GroupMember[];
}


