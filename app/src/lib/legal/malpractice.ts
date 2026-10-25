import { addDays, addYears, daysBetween, isWeekend } from "./dates";
import type { Citation, IsoDate, MedMalPack } from "./types";

function rollForward(date: IsoDate, holidays: ReadonlySet<IsoDate>): IsoDate {
  let d = date;
  while (isWeekend(d) || holidays.has(d)) d = addDays(d, 1);
  return d;
}

export interface MalpracticeInput {
  actDate: IsoDate;
  /** When the patient learned, or should have learned, of the malpractice. Omit if the same day. */
  discoveryDate?: IsoDate;
  today: IsoDate;
  /** Day the panel request was filed: the certified mailing date, fax date or receipt stamp. */
  panelFiledDate?: IsoDate;
  /** Day the certified-mail notice of the panel's opinion (or of non-coverage or dismissal) arrived. */
  panelNoticeDate?: IsoDate;
  holidays?: ReadonlySet<IsoDate>;
}

export type DeadlineStatus = "open" | "passed" | "suspended" | "resumed" | "filedLate";

export interface MalpracticeDeadline {
  fromDiscovery: boolean;
  /** One year from the act or the later discovery. */
  oneYear: IsoDate;
  /** Three years from the act. */
  outerLimit: IsoDate;
  cappedByOuterLimit: boolean;
  /** Last day to file the panel request, which is what stops the clock. */
  lastDayToFilePanel: IsoDate;
  status: DeadlineStatus;
  /** Days that were left when the request was filed; they start running again after the suspension. */
  daysLeftAtFiling?: number;
  suspensionEnds?: IsoDate;
  /** Last day to file suit after the panel, once the notice date is known. */
  lastDayToSue?: IsoDate;
  /** Days until the next deadline that applies; null while the clock is stopped. */
  daysLeft: number | null;
  citations: Citation[];
}

/**
 * Louisiana med mal prescription: one year from the act or discovery, never more than three years
 * from the act. A timely panel request stops the clock until 90 days after notice of the opinion,
 * and the days that were left start running again then.
 */
export function malpracticeDeadline(pack: MedMalPack, input: MalpracticeInput): MalpracticeDeadline {
  const holidays = input.holidays ?? new Set<IsoDate>();
  const { actDate, today } = input;
  const discovery = input.discoveryDate ?? actDate;
  if (discovery < actDate) throw new Error("Discovery can't be before the act");

  const p = pack.prescription;
  const oneYear = addYears(discovery, p.years);
  const outerLimit = addYears(actDate, p.outerLimitYears);
  const cappedByOuterLimit = outerLimit < oneYear;
  const nominal = cappedByOuterLimit ? outerLimit : oneYear;
  const lastDayToFilePanel = rollForward(nominal, holidays);
  const citations: Citation[] = [p.citation, pack.deadlineComputation];
  const base = { fromDiscovery: discovery > actDate, oneYear, outerLimit, cappedByOuterLimit, lastDayToFilePanel };

  if (!input.panelFiledDate) {
    const daysLeft = daysBetween(today, lastDayToFilePanel);
    return { ...base, status: daysLeft < 0 ? "passed" : "open", daysLeft, citations };
  }

  const filed = input.panelFiledDate;
  if (filed < actDate) throw new Error("The panel request can't be filed before the act");
  if (filed > lastDayToFilePanel) return { ...base, status: "filedLate", daysLeft: null, citations };

  citations.push(pack.panel.suspensionCitation);
  if (cappedByOuterLimit) citations.push(p.outerLimitSuspended);
  const daysLeftAtFiling = Math.max(0, daysBetween(filed, nominal));
  if (!input.panelNoticeDate) {
    return { ...base, status: "suspended", daysLeftAtFiling, daysLeft: null, citations };
  }

  const suspensionEnds = addDays(input.panelNoticeDate, pack.panel.suspensionEndsDaysAfterNotice);
  const lastDayToSue = rollForward(addDays(suspensionEnds, daysLeftAtFiling), holidays);
  const daysLeft = daysBetween(today, lastDayToSue);
  return {
    ...base, status: daysLeft < 0 ? "passed" : "resumed", daysLeftAtFiling, suspensionEnds, lastDayToSue, daysLeft, citations,
  };
}

export interface PanelStep {
  label: string;
  /** Due date when the dates it depends on are known. */
  due?: IsoDate;
  /** What the due date waits on, when it isn't known yet. */
  waitsOn?: string;
  citation: Citation;
}

export interface PanelDates {
  filed: IsoDate;
  /** Day you received the board's confirmation letter. */
  confirmationReceived?: IsoDate;
  /** Day the board certified the filing (usually on the confirmation letter). */
  certified?: IsoDate;
  /** Day the last panel member was chosen. */
  panelSelected?: IsoDate;
}

/** The claimant's own deadlines through the panel, as far as the known dates allow. */
export function panelTimeline(pack: MedMalPack, dates: PanelDates): PanelStep[] {
  const p = pack.panel;
  const when = (from: IsoDate | undefined, days: number, waitsOn: string) =>
    from ? { due: addDays(from, days) } : { waitsOn };
  return [
    {
      label: "The board confirms it received your request and says which providers are qualified",
      due: addDays(dates.filed, 15),
      citation: { label: "La. R.S. 40:1231.8(A)(3)", url: p.required.url, verified: true },
    },
    {
      label: `Pay $${p.feePerQualifiedDefendant} for each qualified provider, or file a fee waiver`,
      ...when(dates.confirmationReceived, p.feeDueDays, "the day the confirmation letter arrives"),
      citation: p.feeCitation,
    },
    {
      label: "Name your doctor for the panel",
      ...when(dates.certified, p.claimantPicksPanelistDays, "the board's certification date"),
      citation: p.selectionCitation,
    },
    {
      label: "Send your evidence: records, your expert's report, your position paper",
      ...when(dates.panelSelected, p.evidenceDays, "the day the panel is complete"),
      citation: { label: "La. R.S. 40:1231.8(C)(2), (D)", url: p.required.url, verified: true },
    },
  ];
}

export interface CapInput {
  /** All damages other than future medical care: past bills, lost income, pain and suffering. */
  damages: number;
  futureMedical: number;
  /** Whether the providers are enrolled with the Patient's Compensation Fund. */
  qualified: boolean;
  qualifiedProviders: number;
}

export interface CapResult {
  capApplies: boolean;
  /** Damages that can be recovered after the cap, before interest and costs. */
  recoverable: number;
  lostToCap: number;
  futureMedical: number;
  fromProviders: number;
  fromFund: number;
  total: number;
  citations: Citation[];
}

export function capRecovery(pack: MedMalPack, input: CapInput): CapResult {
  const damages = Math.max(0, input.damages || 0);
  const futureMedical = Math.max(0, input.futureMedical || 0);
  if (!input.qualified) {
    const total = damages + futureMedical;
    return {
      capApplies: false, recoverable: damages, lostToCap: 0, futureMedical,
      fromProviders: total, fromFund: 0, total, citations: [pack.cap.notes[0].citation],
    };
  }
  const recoverable = Math.min(damages, pack.cap.total);
  const fromProviders = Math.min(recoverable, pack.cap.perProvider * Math.max(1, input.qualifiedProviders));
  return {
    capApplies: true,
    recoverable,
    lostToCap: damages - recoverable,
    futureMedical,
    fromProviders,
    fromFund: recoverable - fromProviders + futureMedical,
    total: recoverable + futureMedical,
    citations: [pack.cap.citation, pack.cap.notes[1].citation],
  };
}

export interface PanelRequest {
  patient: string;
  claimants: string[];
  providers: { name: string; whatHappened: string }[];
  dates: string;
  injuries: string;
  sender: { name: string; address: string; phone: string; email: string };
  today: IsoDate;
}

/** A panel request letter with every item R.S. 40:1231.8(A)(1)(b) requires. */
export function panelRequestLetter(pack: MedMalPack, r: PanelRequest): string {
  const f = pack.panel.filedWith;
  const blank = (s: string, what: string) => s.trim() || `[${what}]`;
  const claimants = r.claimants.map((c) => c.trim()).filter(Boolean);
  const providers = r.providers.filter((p) => p.name.trim() || p.whatHappened.trim());
  return [
    r.today,
    "",
    f.name,
    f.mail.replace(/ \(certified mail\)$/, ""),
    "",
    "Sent by certified mail, return receipt requested",
    "",
    `Re: Request for a medical review panel, patient ${blank(r.patient, "patient's full name")}`,
    "",
    `Under La. R.S. 40:1231.8, I request the formation of a medical review panel to review the following claim.`,
    "",
    `1. Patient: ${blank(r.patient, "patient's full name")}`,
    `2. Claimants: ${claimants.length ? claimants.join(", ") : "[full names of everyone making the claim]"}`,
    "3. Health care providers named:",
    ...(providers.length ? providers : [{ name: "", whatHappened: "" }]).map(
      (p, i) => `   ${String.fromCharCode(97 + i)}. ${blank(p.name, "provider's full name")}`,
    ),
    `4. Dates of the alleged malpractice: ${blank(r.dates, "dates")}`,
    "5. What each provider did:",
    ...(providers.length ? providers : [{ name: "", whatHappened: "" }]).map(
      (p, i) => `   ${String.fromCharCode(97 + i)}. ${blank(p.name, "provider")}: ${blank(p.whatHappened, "what this provider did or failed to do")}`,
    ),
    `6. Injuries: ${blank(r.injuries, "a short, specific description of the injuries")}`,
    "",
    "I am representing myself. Please send all notices to me at the address below.",
    "",
    blank(r.sender.name, "your name"),
    blank(r.sender.address, "your mailing address"),
    [r.sender.phone, r.sender.email].filter((s) => s.trim()).join(" · ") || "[phone and email]",
  ].join("\n");
}
