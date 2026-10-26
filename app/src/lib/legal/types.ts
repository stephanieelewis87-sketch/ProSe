/** An ISO calendar date, "YYYY-MM-DD". Dates are calendar days, never times. */
export type IsoDate = string;

/** Where a rule comes from. `verified` means someone checked it against the official text. */
export interface Citation {
  label: string;
  url?: string;
  verified: boolean;
}

/** A rule value that changes depending on when the crash happened. */
export interface Dated<T> {
  /** First crash date this applies to (inclusive). Omit for "since forever". */
  from?: IsoDate;
  value: T;
  citation: Citation;
}

export type FaultModel =
  | { kind: "pure" }
  | { kind: "modified"; barAtPercent: number };

export interface UninsuredBar {
  bodilyInjury: number;
  propertyDamage: number;
}

/** Everything the app needs to know about one case type in one state. */
export interface JurisdictionPack {
  id: string;
  state: string;
  caseType: string;
  terms: { limitationsPeriod: string };
  prescriptionYears: Dated<number>[];
  deadlineComputation: Citation;
  interruption: Citation;
  fault: Dated<FaultModel>[];
  uninsuredBar: Dated<UninsuredBar>[];
  smallClaims: { limit: number; citation: Citation; notes: { text: string; citation: Citation }[] };
}

/** A fact a person needs, with where it comes from. */
export interface Note {
  text: string;
  citation: Citation;
}

/** Medical malpractice in one state: the pre-suit panel, prescription and the damages cap. */
export interface MedMalPack {
  id: string;
  state: string;
  caseType: string;
  terms: { limitationsPeriod: string };
  prescription: {
    /** Years from the act, or from discovery when later. */
    years: number;
    /** No suit later than this many years after the act, even with late discovery. */
    outerLimitYears: number;
    citation: Citation;
    /** Whether the panel request also suspends the outer limit. */
    outerLimitSuspended: Citation;
  };
  deadlineComputation: Citation;
  panel: {
    required: Citation;
    filedWith: { name: string; mail: string; handDelivery: string; fax: string; phone: string; url: string };
    requiredContents: string[];
    contentsCitation: Citation;
    feePerQualifiedDefendant: number;
    /** Days after the board's confirmation is received to pay or file a waiver. */
    feeDueDays: number;
    feeCitation: Citation;
    feeWaivers: Note[];
    /** Prescription stays suspended until this many days after certified-mail notice of the opinion. */
    suspensionEndsDaysAfterNotice: number;
    suspensionCitation: Citation;
    /** Days after the board certifies the filing for the claimant to name a provider panelist. */
    claimantPicksPanelistDays: number;
    selectionCitation: Citation;
    /** Days after the panel is selected that the chairman's evidence schedule must allow. */
    evidenceDays: number;
    /** Days after the evidence closes for the panel's written opinion. */
    opinionDays: number;
    /** Months after the chairman is selected before suit may be filed without an opinion. */
    opinionDeadlineMonths: number;
    findings: string[];
    opinionUse: Note;
    costs: Note[];
    waiverByAgreement: Citation;
    /** Court proceedings that can happen while the panel is still pending. */
    courtDuringPanel: { exceptions: Note[]; discovery: Note[]; other: Note[] };
  };
  cap: {
    /** Total recovery for all claims for one patient, before interest and costs. */
    total: number;
    /** Most any one qualified provider pays; the state fund pays the rest up to the total. */
    perProvider: number;
    futureMedicalExcluded: boolean;
    citation: Citation;
    notes: Note[];
  };
  proof: { elements: string[]; citation: Citation; resIpsa: Note };
  expert: { qualifications: string[]; citation: Citation; notes: Note[] };
  qualification: { text: string; phone: string; citation: Citation };
  records: Note;
}
