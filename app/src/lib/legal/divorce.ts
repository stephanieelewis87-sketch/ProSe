import { addDays, addYears, daysBetween } from "./dates";
import type { Citation, DivorceGround, DivorcePack, IsoDate } from "./types";

export interface DivorceTimelineInput {
  /** "102": file now, wait, then file a rule. "103": a ground already exists when you file. */
  path: "102" | "103";
  ground?: DivorceGround;
  /** First day you lived separate and apart without getting back together. */
  separatedDate: IsoDate;
  /** Day the petition was served or the waiver of service was signed (art. 102 only). */
  servedDate?: IsoDate;
  /** Whether there are minor children of the marriage. */
  minorChildren: boolean;
  /** Birth date of the youngest child of the marriage, if known: the 365 days apply only while a child is a minor. */
  youngestBirthDate?: IsoDate;
  today: IsoDate;
}

export interface DivorceTimeline {
  /** Days that must pass, as it applies on the earliest date. 0 for a fault ground. */
  periodDays: number;
  /** Earliest safe day to file the rule (art. 102) or the petition (art. 103). */
  earliest: IsoDate;
  /** What `earliest` is waiting on. */
  waitingOn: "separation" | "service" | "nothing";
  /** Art. 102: the rule must be filed by this day or the case is abandoned. */
  abandonedAfter?: IsoDate;
  status: "wait" | "ready" | "abandoned" | "needService";
  daysLeft: number;
  citations: Citation[];
}

/** Day after `n` full days have passed since `from`: counted from the day after, with the last day included. */
const afterFullDays = (from: IsoDate, n: number) => addDays(from, n + 1);

const isMinorOn = (birth: IsoDate, date: IsoDate) => addYears(birth, 18) > date;

/**
 * Earliest date the requisite period is met, counting from `base`. The 365-day period applies only if a
 * child of the marriage is still a minor on the filing date, so when the youngest turns 18 before the
 * 365 days run out, the earliest date is that birthday (or the 180-day date if it's later).
 */
function earliestAfter(pack: DivorcePack, base: IsoDate, input: DivorceTimelineInput): { date: IsoDate; days: number } {
  const short = afterFullDays(base, pack.periods.noMinorChildren);
  if (!input.minorChildren) return { date: short, days: pack.periods.noMinorChildren };
  const long = afterFullDays(base, pack.periods.minorChildren);
  if (!input.youngestBirthDate) return { date: long, days: pack.periods.minorChildren };
  if (!isMinorOn(input.youngestBirthDate, short)) return { date: short, days: pack.periods.noMinorChildren };
  const adult = addYears(input.youngestBirthDate, 18);
  return adult < long ? { date: adult, days: pack.periods.noMinorChildren } : { date: long, days: pack.periods.minorChildren };
}

export function divorceTimeline(pack: DivorcePack, input: DivorceTimelineInput): DivorceTimeline {
  const { today } = input;
  const citations: Citation[] = [pack.periods.citation, pack.periods.computation];

  if (input.path === "103") {
    citations.unshift(pack.groundsCitation);
    const ground = pack.grounds.find((g) => g.id === (input.ground ?? "separated"))!;
    if (!ground.waitingPeriod) {
      return { periodDays: 0, earliest: today, waitingOn: "nothing", status: "ready", daysLeft: 0, citations: [pack.groundsCitation] };
    }
    const { date, days } = earliestAfter(pack, input.separatedDate, input);
    const ready = date <= today;
    return {
      periodDays: days, earliest: date, waitingOn: ready ? "nothing" : "separation",
      status: ready ? "ready" : "wait", daysLeft: Math.max(0, daysBetween(today, date)), citations,
    };
  }

  citations.unshift(pack.afterPetition.citation, pack.afterPetition.abandonmentCitation);
  const sep = earliestAfter(pack, input.separatedDate, input);
  if (!input.servedDate) {
    return {
      periodDays: sep.days, earliest: sep.date, waitingOn: "service", status: "needService",
      daysLeft: Math.max(0, daysBetween(today, sep.date)), citations,
    };
  }
  const svc = earliestAfter(pack, input.servedDate, input);
  const later = svc.date > sep.date ? svc : sep;
  const abandonedAfter = addYears(input.servedDate, pack.afterPetition.abandonmentYears);
  const status = today > abandonedAfter ? "abandoned" : later.date <= today ? "ready" : "wait";
  return {
    periodDays: later.days,
    earliest: later.date,
    waitingOn: status !== "wait" ? "nothing" : svc.date >= sep.date ? "service" : "separation",
    abandonedAfter,
    status,
    daysLeft: Math.max(0, daysBetween(today, later.date)),
    citations,
  };
}

export interface ChildSupportInput {
  /** Monthly adjusted gross income of each parent. */
  yourIncome: number;
  otherIncome: number;
  /** Monthly basic obligation from the schedule in R.S. 9:315.19, for the combined income and number of children. */
  basicObligation: number;
  /** Monthly work-related child care and the children's health insurance premium. */
  childCare: number;
  healthInsurance: number;
}

export interface ChildSupportShares {
  combined: number;
  yourShare: number;
  otherShare: number;
  total: number;
  yourPortion: number;
  otherPortion: number;
}

/** Each parent's percentage of combined income, applied to the total obligation (R.S. 9:315.2(C)). */
export function childSupportShares(input: ChildSupportInput): ChildSupportShares {
  const you = Math.max(0, input.yourIncome), other = Math.max(0, input.otherIncome);
  const combined = you + other;
  const yourShare = combined ? you / combined : 0;
  const total = Math.max(0, input.basicObligation) + Math.max(0, input.childCare) + Math.max(0, input.healthInsurance);
  return {
    combined, yourShare, otherShare: combined ? 1 - yourShare : 0, total,
    yourPortion: Math.round(total * yourShare * 100) / 100,
    otherPortion: Math.round(total * (combined ? 1 - yourShare : 0) * 100) / 100,
  };
}

/** Most final periodic support can be per month, or null when abuse lifts the cap (art. 112(D)). */
export function finalSupportCap(pack: DivorcePack, payerNetIncome: number, abuse: boolean): number | null {
  if (abuse) return null;
  return Math.floor(Math.max(0, payerNetIncome) * pack.spousalSupport.finalCapFraction * 100) / 100;
}

export interface PartitionDates {
  listDue: IsoDate;
  traverseDue?: IsoDate;
}

/** Sworn descriptive lists are due 45 days after a motion is served; traversals 60 days after the last list. */
export function partitionDates(pack: DivorcePack, motionServed: IsoDate, lastListServed?: IsoDate): PartitionDates {
  return {
    listDue: addDays(motionServed, pack.property.listDays),
    traverseDue: lastListServed ? addDays(lastListServed, pack.property.traverseDays) : undefined,
  };
}
