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
