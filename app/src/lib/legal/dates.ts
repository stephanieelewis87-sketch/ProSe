import type { Dated, IsoDate } from "./types";

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIso(date: IsoDate): Date {
  const m = ISO.exec(date);
  if (!m) throw new Error(`Not a YYYY-MM-DD date: ${date}`);
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (toIso(d) !== date) throw new Error(`Not a real calendar date: ${date}`);
  return d;
}

export function toIso(d: Date): IsoDate {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return toIso(new Date(parseIso(date).getTime() + days * 864e5));
}

/** Same month and day `years` later; a date that doesn't exist (Feb 29) becomes the month's last day. */
export function addYears(date: IsoDate, years: number): IsoDate {
  const d = parseIso(date);
  const y = d.getUTCFullYear() + years, m = d.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return toIso(new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), lastDay))));
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 864e5);
}

export function isWeekend(date: IsoDate): boolean {
  const day = parseIso(date).getUTCDay();
  return day === 0 || day === 6;
}

/** The rule in force for an event on `date`: the entry with the latest `from` on or before it. */
export function ruleFor<T>(rules: Dated<T>[], date: IsoDate): Dated<T> {
  const applicable = rules.filter((r) => !r.from || r.from <= date);
  if (applicable.length === 0) throw new Error(`No rule covers ${date}`);
  return applicable.reduce((a, b) => ((b.from ?? "") > (a.from ?? "") ? b : a));
}
