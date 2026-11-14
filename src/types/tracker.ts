export type EntryType = 'study' | 'break' | 'music' | 'content' | 'day_boundary' | 'sleep' | 'habit';
export type ActionType = 'start' | 'stop' | 'tick';
export type EntrySource = 'manual' | 'shortcode' | 'whatsapp_import';

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
  source: EntrySource;
  sourceHash?: string;
  createdAt: string;
}

export interface DailySummary {
  id: string; // date YYYY-MM-DD
  userId: string;
  date: string; // YYYY-MM-DD
  studyMinutes: number;
  breakMinutes: number;
  studyTargetMinutes: number; // default 360 (6 hours)
  breakQuotaMinutes: number;  // default 120 (2 hours)
  studyDeficitMinutes: number;
  breakSurplusMinutes: number;
  reason?: string;
  status: 'active' | 'reconciled' | 'vaulted';
  createdAt: string;
  updatedAt: string;
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

export interface WordMapping {
  id: string;
  userId: string;
  triggerWord: string;
  mappedAction: string;
  category: string;
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
}

export interface ParsedWhatsAppResult {
  validEntries: Array<Omit<TimeEntry, 'id' | 'userId' | 'createdAt'>>;
  reviewItems: Array<{
    rawMessage: string;
    timestamp: string;
    reason: string;
  }>;
  toFillGaps: Array<{
    timestamp: string;
    description: string;
    suspectedType: string;
  }>;
  duplicateCount: number;
  totalParsed: number;
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

