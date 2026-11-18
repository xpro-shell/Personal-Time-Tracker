export type EntryType = 'study' | 'break' | 'music' | 'content' | 'day_boundary' | 'sleep' | 'habit' | 'life' | 'desk';
export type ActionType = 'start' | 'stop' | 'tick';
export type EntrySource = 'manual' | 'shortcode' | 'review_queue' | 'hourly_checkin' | 'whatsapp';
export type StudioThemeId = 'emerald' | 'gold' | 'violet' | 'cyan' | 'rose' | 'solar' | 'royal' | 'synth';
export type StudioTextStyleId =
  | 'auto'
  | 'minimal'
  | 'luxury'
  | 'aurora'
  | 'blueprint'
  | 'zen'
  | 'neopop'
  | 'royal'
  | 'monarch'
  | 'orbit'
  | 'crazy';

export interface CustomHabit {
  id: string;
  name: string;
  shortcode: string;
  defaultDurationHours: number;
  dailyTargetMinutes: number;
  colorTheme: 'purple' | 'amber' | 'emerald' | 'blue' | 'rose' | 'bronze' | 'indigo';
  iconType: 'music' | 'dumbbell' | 'book' | 'flame' | 'sparkles' | 'code' | 'heart' | 'moon';
  entryType: EntryType;
  isDefault?: boolean;
}

export interface UserProfile {
  email: string;
  displayName: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  lastActiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionNote {
  id: string;
  text: string;
  assignedDate: string; // YYYY-MM-DD (original session/record date)
  createdAt: string; // ISO string
}

export interface TimeEntry {
  id: string;
  userId: string;
  type: EntryType;
  action: ActionType;
  topic?: string;
  habitId?: string;
  startTime: string; // ISO string
  endTime?: string;   // ISO string (optional if active)
  durationMinutes?: number;
  assignedDate?: string; // Explicit YYYY-MM-DD owner date (survives post-midnight stop)
  notes?: SessionNote[];
  note?: string;
  source: EntrySource;
  createdAt: string;
}

export interface VaultEntry {
  id: string;
  userId: string;
  date: string;
  hoursLost: number;
  type: 'unreconciled_study_debt' | 'unreconciled_break';
  note?: string;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  userId: string;
  rawMessage: string;
  timestamp: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface GapItem {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: 'missing_off' | 'unaccounted_gap';
  description: string;
}

export interface ActiveSession {
  type: EntryType;
  topic?: string;
  startTime: string;
  assignedDate?: string; // Original YYYY-MM-DD date when session started
  notes?: SessionNote[]; // Notes created while session is running
  isPaused?: boolean;
  pausedAt?: string | null;
  accumulatedPausedMs?: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  emoji: string;
  category?: string;
  showInTicker: boolean;
  createdAt: string;
}

export interface TickerSettings {
  intervalSeconds: number;
  fadeAfterSeconds?: number;
  scrollSpeed?: 'slow' | 'normal' | 'fast';
  enabled: boolean;
}
