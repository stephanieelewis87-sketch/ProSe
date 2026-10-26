import { addDays, addYears, daysBetween, isWeekend, ruleFor } from "./dates";
import type { Citation, IsoDate, JurisdictionPack } from "./types";

export interface FilingDeadline {
  years: number;
  /** The anniversary date before any holiday adjustment. */
  nominal: IsoDate;
  /** Last day to file suit. */
  lastDay: IsoDate;
  /** Days skipped because the nominal last day was a weekend or holiday. */
  rolledOver: IsoDate[];
  daysLeft: number;
  citations: Citation[];
}

/**
 * Last day to file suit. The crash day isn't counted; the period ends on the anniversary,
 * and a last day on a weekend or listed court holiday moves to the next day that isn't one.
 */
export function filingDeadline(
  pack: JurisdictionPack,
  crashDate: IsoDate,
  today: IsoDate,
  holidays: ReadonlySet<IsoDate> = new Set(),
): FilingDeadline {
  const rule = ruleFor(pack.prescriptionYears, crashDate);
  const nominal = addYears(crashDate, rule.value);
  const rolledOver: IsoDate[] = [];
  let lastDay = nominal;
  while (isWeekend(lastDay) || holidays.has(lastDay)) {
    rolledOver.push(lastDay);
    lastDay = addDays(lastDay, 1);
  }
  return {
    years: rule.value,
    nominal,
    lastDay,
    rolledOver,
    daysLeft: daysBetween(today, lastDay),
    citations: [rule.citation, pack.deadlineComputation],
  };
}
