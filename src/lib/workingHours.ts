/**
 * Working-hours helpers shared by the cart delivery-time picker and the
 * public schedule display.
 *
 * The admin stores per-day hours in the settings row as `sched_<day>` (a text
 * range like "09:00–18:00") and `sched_<day>_open` (boolean). These helpers
 * normalize that data and derive selectable time slots.
 */
import type { Settings } from "@/lib/supabase";

export type ScheduleDay =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export const SCHEDULE_DAYS: ScheduleDay[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export interface DayHours {
  open: boolean;
  /** Raw range text, e.g. "09:00–18:00". */
  time: string;
}

export type WorkingHours = Record<ScheduleDay, DayHours>;

/** Extract a normalized per-day working-hours map from the settings row. */
export function extractWorkingHours(
  settings: Pick<
    Settings,
    | "sched_mon" | "sched_mon_open"
    | "sched_tue" | "sched_tue_open"
    | "sched_wed" | "sched_wed_open"
    | "sched_thu" | "sched_thu_open"
    | "sched_fri" | "sched_fri_open"
    | "sched_sat" | "sched_sat_open"
    | "sched_sun" | "sched_sun_open"
  >,
): WorkingHours {
  const row = settings as unknown as Record<string, unknown>;
  const result = {} as WorkingHours;
  for (const day of SCHEDULE_DAYS) {
    const open = row[`sched_${day}_open`] !== false;
    const time = (row[`sched_${day}`] as string) || "";
    result[day] = { open, time };
  }
  return result;
}

/** Map a JS Date (getDay: 0=Sun..6=Sat) to our schedule day key. */
export function dayKeyFromDate(date: Date): ScheduleDay {
  // getDay(): 0=Sun, 1=Mon, ... 6=Sat
  const map: ScheduleDay[] = [
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
  ];
  return map[date.getDay()];
}

function toMinutes(hhmm: string): number | null {
  const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function minutesToHHMM(total: number): string {
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/**
 * Parse a range like "09:00–18:00" (handles -, – and — separators).
 * Returns minute offsets, or null if it can't be parsed.
 */
export function parseRange(
  time: string,
): { startMin: number; endMin: number } | null {
  if (!time) return null;
  const parts = time.split(/[-–—]/);
  if (parts.length !== 2) return null;
  const startMin = toMinutes(parts[0]);
  const endMin = toMinutes(parts[1]);
  if (startMin === null || endMin === null || endMin <= startMin) return null;
  return { startMin, endMin };
}

/**
 * Build selectable "HH:MM" slots within a day's range.
 * @param stepMin slot granularity in minutes (default 30)
 */
export function buildTimeSlots(time: string, stepMin = 30): string[] {
  const range = parseRange(time);
  if (!range) return [];
  const slots: string[] = [];
  for (let t = range.startMin; t <= range.endMin; t += stepMin) {
    slots.push(minutesToHHMM(t));
  }
  return slots;
}
