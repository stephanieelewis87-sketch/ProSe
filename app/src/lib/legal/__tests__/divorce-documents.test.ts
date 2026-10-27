import { describe, expect, it } from "vitest";
import { documentText } from "../documents";
import {
  affidavitForDivorce, descriptiveList, divorcePetition, proposedJudgment, ruleToShowCause, waiverOfService,
  type DivorceFacts,
} from "../divorce-documents";
import { louisianaDivorce as la } from "../packs/louisiana-divorce";

const facts: DivorceFacts = {
  you: { name: "Jane Doe", address: "1 Main St, Monroe, LA 71201", phone: "318-555-0100", email: "" },
  yourParish: "Ouachita",
  spouse: { name: "John Doe", address: "9 Elm St, West Monroe, LA 71291", phone: "", email: "" },
  spouseParish: "Ouachita",
  marriageDate: "2015-05-02", marriageParish: "Caddo Parish, Louisiana", covenant: false,
  lastMatrimonialParish: "Ouachita",
  separatedDate: "2026-01-01",
  children: [{ name: "Sam Doe", birthDate: "2018-04-01" }],
  path: "102", ground: "separated", groundFacts: "",
  petitionFiledDate: "2026-02-20", servedDate: "2026-03-02", servedBy: "sheriff",
  requests: { custody: "joint", domiciliary: "me", childSupport: true, interimSupport: false, finalSupport: false, useOfHome: true, useOfCar: false, injunction: false },
  caption: { court: "4th Judicial District Court", parish: "Ouachita", number: "", division: "", title: "" },
  serveOn: "",
};

describe("divorcePetition", () => {
  it("drafts an article 102 petition with the incidental requests", () => {
    const doc = divorcePetition(la, facts, "2026-02-15");
    const text = documentText(doc);
    expect(doc.warnings).toEqual([]);
    expect(text).toContain("JANE DOE VERSUS JOHN DOE");
    expect(text).toContain("PETITION FOR DIVORCE UNDER CIVIL CODE ARTICLE 102");
    expect(text).toContain("Sam Doe, born April 1, 2018");
    expect(text).toContain("joint custody of the minor children, with petitioner named domiciliary parent");
    expect(text).toContain("PLEASE SERVE");
    expect(text).toContain("VERIFICATION");
    expect(text).not.toContain("CERTIFICATE OF SERVICE");
  });

  it("warns when an article 103 separation petition is early", () => {
    const doc = divorcePetition(la, { ...facts, path: "103" }, "2026-10-26");
    expect(doc.warnings[0]).toMatch(/until January 2, 2027/);
  });

  it("pleads a fault ground with its paragraph", () => {
    const text = documentText(divorcePetition(la, { ...facts, path: "103", ground: "abuse", groundFacts: "he struck me on May 1, 2026" }, "2026-10-26"));
    expect(text).toContain("physically or sexually abused petitioner");
    expect(text).toContain("article 103(4)");
  });

  it("warns about the wrong parish and covenant marriage", () => {
    const doc = divorcePetition(la, { ...facts, covenant: true, caption: { ...facts.caption, parish: "Orleans" } }, "2026-02-15");
    expect(doc.warnings.some((w) => /covenant/.test(w))).toBe(true);
    expect(doc.warnings.some((w) => /void/.test(w))).toBe(true);
  });
});

describe("ruleToShowCause", () => {
  it("is ready once 365 days pass after service", () => {
    const doc = ruleToShowCause(la, facts, "2027-03-03");
    expect(doc.warnings).toEqual([]);
    expect(documentText(doc)).toContain("More than 365 days have elapsed since that service");
    expect(doc.order).toMatch(/show cause/);
  });

  it("warns when filed early", () => {
    expect(ruleToShowCause(la, facts, "2026-10-26").warnings[0]).toMatch(/before March 3, 2027/);
  });
});

describe("other divorce documents", () => {
  it("has the spouse sign the waiver", () => {
    const text = documentText(waiverOfService(la, facts));
    expect(text).toContain("expressly waives citation and service");
    expect(text).toContain("John Doe");
    expect(text).toMatch(/Defendant\s+Notary Public/);
  });

  it("swears to the separation in the affidavit", () => {
    expect(documentText(affidavitForDivorce(la, facts, "2027-03-03"))).toContain("at least 365 days before the rule");
  });

  it("drafts a judgment", () => {
    expect(documentText(proposedJudgment(facts))).toContain("bonds of matrimony between them are dissolved");
  });

  it("lists assets and debts under oath", () => {
    const text = documentText(descriptiveList(la, facts,
      [{ description: "2019 Honda Civic", value: "$14,000", location: "Petitioner's home", claim: "community" }],
      [{ description: "Visa card, Chase", value: "$3,200", location: "", claim: "community" }]));
    expect(text).toContain("2019 Honda Civic. Value: $14,000");
    expect(text).toContain("Balance: $3,200");
    expect(text).toContain("CERTIFICATE OF SERVICE");
  });
});
