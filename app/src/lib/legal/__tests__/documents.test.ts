import { describe, expect, it } from "vitest";
import {
  discoveryResponses, documentText, exhibitLabels, motionToExtend, oppositionToNoRightOfAction,
  oppositionToPrescription, pauperApplication, petitionToCompel, recordsRequest, subpoenaRequest, type CaseFacts,
} from "../documents";
import { louisianaMedicalMalpractice as la } from "../packs/louisiana-medical-malpractice";

const facts: CaseFacts = {
  patient: "Jane Doe", patientDied: false,
  you: { name: "Jane Doe", address: "1 Main St, Monroe, LA 71201", phone: "318-555-0100", email: "" },
  relationship: "self",
  providers: [{ name: "Dr. A. Smith", whatHappened: "Missed the fracture" }],
  actDate: "2025-03-10", discoveryDate: "2025-09-01", discoveryHow: "a second doctor read the x-ray",
  panelFiledDate: "2026-06-01", panelFiledBy: "certified mail", feePaidDate: "2026-07-01", feeWaiver: "",
  caption: { court: "4th Judicial District Court", parish: "Ouachita", number: "2026-1234", division: "B", title: "In re: Medical Review Panel Proceeding of Jane Doe" },
  serveOn: "Defense counsel, 2 Court St, Monroe, LA",
};

describe("oppositionToPrescription", () => {
  it("argues from discovery and the panel filing", () => {
    const doc = oppositionToPrescription(la, facts, "2026-10-26", []);
    const text = documentText(doc);
    expect(doc.warnings).toEqual([]);
    expect(text).toContain("4TH JUDICIAL DISTRICT COURT FOR THE PARISH OF OUACHITA");
    expect(text).toContain("273 days after claimant discovered");
    expect(text).toContain("448 days after the act");
    expect(text).toContain("La. R.S. 40:1231.8(A)(2)(a)");
    expect(text).toContain("CERTIFICATE OF SERVICE");
    expect(text).toContain("Jane Doe, in proper person");
  });

  it("warns when the dates show a late filing", () => {
    const doc = oppositionToPrescription(la, { ...facts, discoveryDate: "2025-03-10" }, "2026-10-26", []);
    expect(doc.warnings[0]).toMatch(/after March 10, 2026/);
  });

  it("warns when no fee or waiver is entered", () => {
    const doc = oppositionToPrescription(la, { ...facts, feePaidDate: "" }, "2026-10-26", []);
    expect(doc.warnings.some((w) => /fee/.test(w))).toBe(true);
  });

  it("lists exhibits", () => {
    const text = documentText(oppositionToPrescription(la, facts, "2026-10-26", exhibitLabels(["Mailing receipt", "Fee receipt"])));
    expect(text).toContain("Exhibit A: Mailing receipt");
    expect(text).toContain("Exhibit B: Fee receipt");
  });
});

describe("oppositionToNoRightOfAction", () => {
  it("uses the patient's own right for a living patient", () => {
    expect(documentText(oppositionToNoRightOfAction(facts, []))).toContain("Claimant is the patient");
  });

  it("cites the death-claim classes for a family member", () => {
    const doc = oppositionToNoRightOfAction({ ...facts, relationship: "parent", patientDied: true }, []);
    expect(documentText(doc)).toContain("art. 2315.2");
    expect(doc.warnings.some((w) => /earlier class/.test(w))).toBe(true);
  });
});

describe("other documents", () => {
  it("adds a notary verification to discovery answers and flags blanks", () => {
    const doc = discoveryResponses(facts, "Dr. A. Smith", [{ question: "List your doctors", answer: "" }]);
    expect(documentText(doc)).toContain("VERIFICATION");
    expect(doc.warnings).toHaveLength(1);
  });

  it("adds a proposed order to court requests", () => {
    expect(documentText(petitionToCompel(facts, "The provider has not named its panelist"))).toContain("show cause");
    expect(documentText(motionToExtend(facts, "2026-07-15", "records are still outstanding"))).toContain("JUDGE");
  });

  it("writes letters without a caption or certificate", () => {
    const text = documentText(recordsRequest(facts, "Ochsner LSU Health", "", "2026-10-26"));
    expect(text).not.toContain("CERTIFICATE OF SERVICE");
    expect(text).toContain("[provider's address]");
    expect(documentText(subpoenaRequest(facts, "Ochsner", "", "x-rays", "Ouachita"))).toContain("40:1231.8(D)(4)");
  });
});

describe("pauperApplication", () => {
  const fin = {
    householdSize: 3, monthlyIncome: 1450, incomeSources: "part-time work", benefits: ["SNAP (food stamps)", "Medicaid"],
    monthlyExpenses: 1600, property: "2010 car worth $2,500", debts: "", helper: { name: "Ann Roe", address: "3 Oak St", relationship: "sister" },
  };

  it("includes the motion, both affidavits and an order, and isn't served", () => {
    const text = documentText(pauperApplication(facts, fin));
    expect(text).toContain("EX PARTE MOTION TO PROCEED WITHOUT PRIOR PAYMENT OF COSTS");
    expect(text).toContain("AFFIDAVIT OF POVERTY");
    expect(text).toContain("AFFIDAVIT OF THIRD PERSON");
    expect(text).toContain("3 people live in my household");
    expect(text).toContain("$1,450");
    expect(text).toContain("presumption of eligibility");
    expect(text).toContain("40:1231.8(A)(1)(d)");
    expect(text).toContain("I am not Jane Doe's attorney");
    expect(text).not.toContain("CERTIFICATE OF SERVICE");
    expect(text).toContain("JUDGE");
  });

  it("asks for a second person and proof when missing", () => {
    const doc = pauperApplication(facts, { ...fin, benefits: [], helper: { name: "", address: "", relationship: "" } });
    expect(doc.warnings.some((w) => /isn't your lawyer/.test(w))).toBe(true);
    expect(doc.warnings.some((w) => /125%/.test(w))).toBe(true);
    expect(documentText(doc)).not.toContain("presumption of eligibility");
  });
});
