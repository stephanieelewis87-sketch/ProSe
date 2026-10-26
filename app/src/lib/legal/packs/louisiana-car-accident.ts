import type { JurisdictionPack } from "../types";

const nolo = "https://www.nolo.com/legal-encyclopedia/louisiana-small-claims-court-31722.html";

export const louisianaCarAccident: JurisdictionPack = {
  id: "la-car-accident",
  state: "Louisiana",
  caseType: "Car accident (injured person)",
  terms: { limitationsPeriod: "prescription" },
  prescriptionYears: [
    {
      value: 1,
      citation: { label: "La. Civ. Code art. 3492 (before July 1, 2024)", verified: false },
    },
    {
      from: "2024-07-01",
      value: 2,
      citation: {
        label: "La. Civ. Code art. 3493.1",
        url: "https://www.legis.la.gov/Legis/Law.aspx?d=1386443",
        verified: true,
      },
    },
  ],
  deadlineComputation: { label: "La. Civ. Code art. 3454", verified: false },
  interruption: { label: "La. Civ. Code art. 3462", verified: false },
  fault: [
    { value: { kind: "pure" }, citation: { label: "La. Civ. Code art. 2323 (before Jan 1, 2026)", verified: false } },
    {
      from: "2026-01-01",
      value: { kind: "modified", barAtPercent: 51 },
      citation: {
        label: "La. Civ. Code art. 2323 (Acts 2025, No. 15)",
        url: "https://legis.la.gov/legis/law.aspx?d=109387",
        verified: true,
      },
    },
  ],
  uninsuredBar: [
    {
      value: { bodilyInjury: 15000, propertyDamage: 25000 },
      citation: { label: "La. R.S. 32:866 (before Aug 1, 2025)", verified: false },
    },
    {
      from: "2025-08-01",
      value: { bodilyInjury: 100000, propertyDamage: 100000 },
      citation: { label: "La. R.S. 32:866 (HB 434, 2025)", url: "https://www.morrisbart.com/?p=55052", verified: false },
    },
  ],
  smallClaims: {
    limit: 5000,
    citation: { label: "La. R.S. 13:5202", url: "https://legis.la.gov/legis/Law.aspx?d=77961", verified: true },
    notes: [
      { text: "Filing in small claims gives up the right to appeal.", citation: { label: "Nolo summary", url: nolo, verified: false } },
      {
        text: "The defendant can ask to move the case to regular court within 10 days of notice.",
        citation: { label: "Nolo summary", url: nolo, verified: false },
      },
    ],
  },
};
