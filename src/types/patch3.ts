/**
 * PATCH3: Schedule Types
 */

export interface ContactPatch3 {
  name: string;
  phone?: string;
  email?: string;
}

export interface ReminderPatch3 {
  days: number;
  hours: number;
  minutes: number;
}

export interface ScheduleEventPatch3 {
  id: string;
  title: string;
  date: string; // ISO string YYYY-MM-DD
  startTime?: string; // HH:mm
  isAllDay: boolean;
  contacts: ContactPatch3[];
  reminder: ReminderPatch3;
  parentId?: string; // For relations
  createdAt: number;
  recurringGroupId?: string; // Patch 11
  recurringSequence?: number; // Patch 11
}

export interface AIRecognitionResultPatch3 {
  title?: string;
  date?: string;
  startTime?: string;
  isAllDay?: boolean;
  contacts?: ContactPatch3[];
  reminder?: ReminderPatch3;
  recurringCount?: number; // Patch 11
}
