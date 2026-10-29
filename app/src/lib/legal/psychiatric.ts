import { addYears } from "./dates";
import type { Citation, IsoDate, Note } from "./types";

const rs28_171 = "https://legis.la.gov/legis/Law.aspx?d=156942";
const rs28_53 = "https://legis.la.gov/Legis/Law.aspx?d=85245";
const rs28_63 = "https://legis.la.gov/legis/Law.aspx?d=85267";
const rs9_5628 = "https://www.legis.la.gov/Legis/Law.aspx?d=108286";
const cc3493_1 = "https://www.legis.la.gov/Legis/Law.aspx?d=1386443";

/** Things that can go wrong during a psychiatric hospital stay. */
export type StayEvent =
  | "treatment" | "medication" | "selfHarm" | "restraint" | "staffAssault" | "sexualAbuse"
  | "patientAssault" | "premises" | "heldWithoutBasis" | "noExam" | "rightsDenied"
  | "discrimination" | "policeForce";

export const stayEvents: { id: StayEvent; label: string }[] = [
  { id: "treatment", label: "Wrong diagnosis or treatment, or a doctor's decision that harmed me" },
  { id: "medication", label: "A medication error, overdose, or a drug forced on me without an order" },
  { id: "selfHarm", label: "I (or they) were hurt or died from self-harm while supposed to be watched" },
  { id: "restraint", label: "Restrained or secluded as punishment, for too long, or without checks" },
  { id: "staffAssault", label: "Hit, choked, or otherwise attacked by staff" },
  { id: "sexualAbuse", label: "Sexually abused or harassed" },
  { id: "patientAssault", label: "Attacked by another patient" },
  { id: "premises", label: "Hurt by something unsafe, like a wet floor or broken bed" },
  { id: "heldWithoutBasis", label: "Held after my certificate expired, or with no legal paperwork" },
  { id: "noExam", label: "Committed without a real exam, or the coroner never examined me" },
  { id: "rightsDenied", label: "Denied phone calls, visits, my lawyer, my clothes, or a hearing" },
  { id: "discrimination", label: "Treated worse or denied care because of my disability" },
  { id: "policeForce", label: "Hurt by police or deputies while being picked up or transported" },
];

export type Facility = "private" | "state" | "unknown";

export interface StayFacts {
  facility: Facility;
  eventDate: IsoDate;
  events: StayEvent[];
  patientDied: boolean;
}

export type ClaimId =
  | "malpractice" | "intentional" | "negligence" | "wrongfulConfinement"
  | "rights" | "civilRights" | "disability" | "death";

export interface Claim {
  id: ClaimId;
  name: string;
  what: string;
  /** Whether the medical review panel and the damages cap apply. */
  panel: "yes" | "no" | "maybe";
  deadline: string;
  where: string;
  hurdles: Note[];
  citations: Citation[];
}

export const claims: Record<ClaimId, Claim> = {
  malpractice: {
    id: "malpractice",
    name: "Medical malpractice",
    what: "Harm from a treatment decision or a failure to assess, monitor or treat properly. This includes medication errors and failing to protect a patient known to be at risk of self-harm.",
    panel: "yes",
    deadline: "1 year from the act or discovery, never more than 3 years. A panel request stops the clock.",
    where: "A medical review panel first, then district court. Use the malpractice guide.",
    hurdles: [
      {
        text: "Usually needs a doctor's opinion; the panel's own opinion can serve as one.",
        citation: { label: "La. R.S. 9:2794", url: "https://legis.la.gov/legis/Law.aspx?d=107231", verified: true },
      },
      {
        text: "The mental health law shields doctors, psychologists and hospital staff who act with the skill and care of their peers. It doesn't protect willful or wanton negligence or gross misconduct.",
        citation: { label: "La. R.S. 28:63(A)", url: rs28_63, verified: true },
      },
    ],
    citations: [{ label: "La. R.S. 9:5628", url: rs9_5628, verified: true }],
  },
  intentional: {
    id: "intentional",
    name: "Battery, assault and abuse (intentional torts)",
    what: "Staff deliberately hurting, threatening, or sexually abusing a patient, or restraining someone as punishment. Intentional harm isn't malpractice, so there's no panel and no cap.",
    panel: "no",
    deadline: "2 years from the day of the injury for events on or after July 1, 2024 (1 year before that).",
    where: "District court in the parish where it happened. You can sue the staff member and the facility.",
    hurdles: [
      {
        text: "Courts decide whether a claim is malpractice with six factors. One is whether the harm was intentional, another whether it was treatment-related.",
        citation: { label: "Coleman v. Deno, 813 So. 2d 303 (La. 2002)", verified: false },
      },
      {
        text: "Sexual abuse, especially of a minor, can have a longer deadline. Check before assuming it has passed.",
        citation: { label: "La. R.S. 9:2800.9", verified: false },
      },
    ],
    citations: [{ label: "La. Civ. Code art. 3493.1", url: cc3493_1, verified: true }],
  },
  negligence: {
    id: "negligence",
    name: "Ordinary negligence",
    what: "Harm that didn't involve medical judgment, such as an unsafe floor, broken equipment, or a facility that ignored known threats from another patient.",
    panel: "maybe",
    deadline: "2 years from the injury for events on or after July 1, 2024 (1 year before that), if it isn't malpractice.",
    where: "District court. If it could be called malpractice, file a panel request too, within 1 year.",
    hurdles: [
      {
        text: "Facilities often argue these are malpractice so the panel and cap apply. Attacks by other patients are especially disputed, because they involve assessing the patient.",
        citation: { label: "Coleman v. Deno, 813 So. 2d 303 (La. 2002)", verified: false },
      },
    ],
    citations: [{ label: "La. Civ. Code art. 3493.1", url: cc3493_1, verified: true }],
  },
  wrongfulConfinement: {
    id: "wrongfulConfinement",
    name: "False imprisonment and wrongful commitment",
    what: "Being held without the legal steps the mental health law requires, such as no real exam, no coroner's exam within 72 hours, or more than 15 days on an emergency certificate.",
    panel: "maybe",
    deadline: "2 years for events on or after July 1, 2024 (1 year before that). While still held, ask for a hearing now.",
    where: "While held: a probable-cause hearing within 5 days of asking, or habeas corpus. Afterward: district court.",
    hurdles: [
      {
        text: "Signing an emergency certificate without actually examining the person is evidence of gross negligence.",
        citation: { label: "La. R.S. 28:53(B)", url: rs28_53, verified: true },
      },
      {
        text: "The coroner must independently examine you within 72 hours of admission, or you can't be kept. An emergency certificate allows at most 15 days.",
        citation: { label: "La. R.S. 28:53(A), (G)", url: rs28_53, verified: true },
      },
      {
        text: "People who help apprehend, examine or confine someone in good faith are immune unless they acted with willful or wanton negligence or gross misconduct. Knowingly making a false certificate is a crime.",
        citation: { label: "La. R.S. 28:63(C)", url: rs28_63, verified: true },
      },
    ],
    citations: [{ label: "La. R.S. 28:53", url: rs28_53, verified: true }],
  },
  rights: {
    id: "rights",
    name: "Patient rights violations",
    what: "Louisiana guarantees patients private phone calls, mail and visits, a lawyer, their own clothes, a treatment plan, and limits on restraint, seclusion and medication.",
    panel: "no",
    deadline: "Act now while it's happening. Damages for the harm follow the deadlines for the claims above.",
    where: "Ask for a court hearing, file a complaint with the Louisiana Department of Health, and ask the Mental Health Advocacy Service for a free lawyer.",
    hurdles: [
      {
        text: "The rights law itself doesn't award money. A violation is still strong evidence that the facility fell below the standard of care, and it can support the claims above.",
        citation: { label: "La. R.S. 28:171", url: rs28_171, verified: true },
      },
      {
        text: "Restraint or seclusion only to prevent injury, never as punishment or for staff convenience: a written order, checks every 15 minutes, release when the danger ends.",
        citation: { label: "La. R.S. 28:171(D)", url: rs28_171, verified: true },
      },
      {
        text: "Medication only on a prescriber's order, never as punishment or for convenience.",
        citation: { label: "La. R.S. 28:171(P)", url: rs28_171, verified: true },
      },
      {
        text: "Indigent patients can ask the Mental Health Advocacy Service for a lawyer, and can ask the court for a hearing on discharge or a less restrictive placement.",
        citation: { label: "La. R.S. 28:171(K)–(L)", url: rs28_171, verified: true },
      },
    ],
    citations: [{ label: "La. R.S. 28:171", url: rs28_171, verified: true }],
  },
  civilRights: {
    id: "civilRights",
    name: "Federal civil rights (42 U.S.C. § 1983)",
    what: "Government workers violating your constitutional rights: excessive force, unsafe conditions or needless restraint for someone involuntarily committed, or confinement without due process.",
    panel: "no",
    deadline: "Federal courts borrow Louisiana's injury deadline. It was 1 year; whether the new 2-year period applies isn't settled, so file within 1 year.",
    where: "Federal district court (Eastern, Middle or Western District of Louisiana), or state district court.",
    hurdles: [
      {
        text: "Only works against people acting for the government: staff of a state hospital, police or deputies. Private hospitals usually aren't covered, even for involuntary patients.",
        citation: { label: "42 U.S.C. § 1983", verified: false },
      },
      {
        text: "Sue individual employees by name. The state and its agencies can't be sued for money under § 1983.",
        citation: { label: "Will v. Michigan Dep't of State Police, 491 U.S. 58 (1989)", verified: false },
      },
      {
        text: "People who are involuntarily committed have a constitutional right to safe conditions and freedom from unreasonable restraint.",
        citation: { label: "Youngberg v. Romeo, 457 U.S. 307 (1982)", verified: false },
      },
      {
        text: "Federal court has its own pauper process for people who can't pay the filing fee.",
        citation: { label: "28 U.S.C. § 1915", verified: false },
      },
    ],
    citations: [{ label: "42 U.S.C. § 1983", verified: false }],
  },
  disability: {
    id: "disability",
    name: "Disability discrimination (ADA and Section 504)",
    what: "Being denied care or treated worse because of a mental illness or other disability, or kept institutionalized when community treatment would work.",
    panel: "no",
    deadline: "Borrowed from Louisiana's injury deadline; file within 1 year to be safe.",
    where: "Federal or state court. Complaints can also go to the U.S. Department of Health and Human Services, Office for Civil Rights.",
    hurdles: [
      {
        text: "Against a public facility (Title II) or one that takes Medicare or Medicaid (Section 504), damages require intentional discrimination or deliberate indifference. Against a private facility under Title III, a court can only order changes, not money.",
        citation: { label: "42 U.S.C. §§ 12132, 12188; 29 U.S.C. § 794", verified: false },
      },
      {
        text: "Unjustified institutional isolation can itself be discrimination.",
        citation: { label: "Olmstead v. L.C., 527 U.S. 581 (1999)", verified: false },
      },
    ],
    citations: [{ label: "29 U.S.C. § 794", verified: false }],
  },
  death: {
    id: "death",
    name: "Wrongful death and survival",
    what: "When the patient died, close family can bring the patient's own claims and their own claims for the loss, in addition to everything above.",
    panel: "maybe",
    deadline: "Follows the claim it's based on: 1 year for malpractice; otherwise usually 2 years from the death.",
    where: "The same places as the claims it's based on.",
    hurdles: [
      {
        text: "Only certain relatives, in order: spouse and children; then parents; then brothers and sisters; then grandparents.",
        citation: { label: "La. Civ. Code arts. 2315.1, 2315.2", verified: false },
      },
    ],
    citations: [{ label: "La. Civ. Code art. 2315.2", verified: false }],
  },
};

const byEvent: Record<StayEvent, ClaimId[]> = {
  treatment: ["malpractice"],
  medication: ["malpractice", "rights"],
  selfHarm: ["malpractice"],
  restraint: ["rights", "intentional", "malpractice"],
  staffAssault: ["intentional"],
  sexualAbuse: ["intentional"],
  patientAssault: ["negligence", "malpractice"],
  premises: ["negligence"],
  heldWithoutBasis: ["wrongfulConfinement"],
  noExam: ["wrongfulConfinement"],
  rightsDenied: ["rights"],
  discrimination: ["disability"],
  policeForce: ["civilRights", "intentional"],
};

/** Government-actor events become civil rights claims at a state facility. */
const stateActorEvents: StayEvent[] = ["restraint", "staffAssault", "sexualAbuse", "heldWithoutBasis", "noExam", "patientAssault"];

export interface ClaimSort {
  claims: Claim[];
  /** The earliest deadline that could apply, so nothing is lost by waiting. */
  safeDeadline?: IsoDate;
  safeDeadlineReason?: string;
  warnings: string[];
}

export function sortClaims(f: StayFacts): ClaimSort {
  const ids = new Set<ClaimId>();
  for (const e of f.events) byEvent[e].forEach((id) => ids.add(id));
  if (f.facility !== "private" && f.events.some((e) => stateActorEvents.includes(e))) ids.add("civilRights");
  if (f.patientDied && ids.size) ids.add("death");

  const order: ClaimId[] = ["malpractice", "intentional", "negligence", "wrongfulConfinement", "rights", "civilRights", "disability", "death"];
  const list = order.filter((id) => ids.has(id)).map((id) => claims[id]);

  const warnings: string[] = [];
  if (f.facility === "unknown" && list.some((c) => c.id === "civilRights")) {
    warnings.push("Find out whether the hospital is run by the state. Federal civil rights claims usually work only against government facilities and workers.");
  }
  if (list.some((c) => c.panel !== "no") && list.some((c) => c.panel === "no" || c.panel === "maybe")) {
    warnings.push("Some of these claims need a medical review panel and some don't. File the panel request for the malpractice part, and file suit in court for the rest, both within 1 year.");
  }

  let safeDeadline: IsoDate | undefined;
  let safeDeadlineReason: string | undefined;
  if (f.eventDate && list.length) {
    const oneYear = list.some((c) => ["malpractice", "civilRights", "disability", "negligence", "wrongfulConfinement", "death"].includes(c.id))
      || f.eventDate < "2024-07-01";
    safeDeadline = addYears(f.eventDate, oneYear ? 1 : 2);
    safeDeadlineReason = oneYear
      ? "At least one of these claims can expire 1 year after the event, so treat that as your deadline for everything."
      : "These claims have a 2-year deadline for events on or after July 1, 2024.";
  }
  return { claims: list, safeDeadline, safeDeadlineReason, warnings };
}

export const freeHelp: Note[] = [
  {
    text: "Mental Health Advocacy Service: free lawyers for people in psychiatric facilities, including for hearings on release.",
    citation: { label: "La. R.S. 28:171(K)", url: rs28_171, verified: true },
  },
  {
    text: "Disability Rights Louisiana, the state's federally funded protection and advocacy agency, investigates abuse and neglect of people with mental illness in facilities.",
    citation: { label: "42 U.S.C. § 10801 et seq.", verified: false },
  },
  {
    text: "Louisiana Department of Health complaints: the department must enforce the rules on restraint and seclusion, with penalties.",
    citation: { label: "La. R.S. 28:171(D)(12)", url: rs28_171, verified: true },
  },
];
