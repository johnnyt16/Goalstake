export type DistributionMode = 'redistribute' | 'donate' | 'mixed';
export type VerificationMode = 'honor' | 'peer_vote' | 'proof_photo';
export type GoalType =
  | 'screen_time'
  | 'workouts'
  | 'steps'
  | 'study'
  | 'sleep'
  | 'water'
  | 'custom';

export interface Challenge {
  id: string;
  groupId: string;
  title: string;
  goalType: GoalType;
  metricUnit: string; // e.g., 'minutes', 'steps', 'sessions'
  targetValue: number;
  stakeAmountCents: number;
  distributionMode: DistributionMode;
  verificationMode: VerificationMode;
  startDate: string; // ISO date
  endDate: string; // ISO date
  status: 'draft' | 'active' | 'settling' | 'settled' | 'cancelled';
  charityId?: string | null;
  mixedWinnersPercent?: number | null; // for 'mixed' mode, 0-100
  createdAt: string;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: string;
  stakeAmountCents: number;
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  date: string; // ISO date
  amount: number; // progress amount for that date
  source: 'manual' | 'integration' | 'photo';
  createdAt: string;
}

export interface Evidence {
  id: string;
  entryId: string;
  type: 'photo';
  url: string;
  createdAt: string;
}

export interface Vote {
  id: string;
  challengeId: string;
  entryId: string;
  voterUserId: string;
  value: 'kept' | 'not_kept';
  createdAt: string;
}

export interface Transaction {
  id: string;
  challengeId: string;
  userId: string | null; // null for donation
  type: 'stake' | 'payout' | 'donation' | 'fee' | 'refund';
  amountCents: number;
  createdAt: string;
}


