import { malpracticeDeadline } from "./malpractice";
import { daysBetween } from "./dates";
import type { Citation, IsoDate, MedMalPack } from "./types";

const rs40_1231_8 = "https://legis.la.gov/legis/Law.aspx?d=964877";
const recordsRight: Citation = { label: "La. R.S. 40:1165.1", verified: false };

export type Block =
  | { kind: "heading"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] };

export interface Person {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Caption {
  /** e.g. "19th Judicial District Court" */
  court: string;
  parish: string;
  number: string;
  division: string;
  /** The case title exactly as it appears on the papers served on you. */
  title: string;
}

export type Relationship = "self" | "spouse" | "child" | "parent" | "sibling" | "grandparent" | "other";

/** What the person has told us about their case, reused across every document. */
export interface CaseFacts {
  patient: string;
  patientDied: boolean;
  /** The person filing these documents. */
  you: Person;
  relationship: Relationship;
  providers: { name: string; whatHappened: string }[];
  actDate: IsoDate;
  discoveryDate: IsoDate;
  /** How the person found out, in their words. */
  discoveryHow: string;
  panelFiledDate: IsoDate;
  panelFiledBy: "certified mail" | "fax" | "hand delivery";
  feePaidDate: IsoDate;
  feeWaiver: "" | "physician affidavit" | "pauper ruling";
  caption: Caption;
  /** Who the other side's lawyers are, for the certificate of service. */
  serveOn: string;
}

export interface LegalDocument {
  title: string;
  kind: "letter" | "pleading";
  caption?: Caption;
  /** Letter recipient lines. */
  to?: string[];
  blocks: Block[];
  signer: Person;
  exhibits: string[];
  /** Pleadings that need a judge's signature carry a proposed order. */
  order?: string;
  /** Sworn answers carry a verification for a notary. */
  verified?: boolean;
  serveOn?: string;
  citations: Citation[];
  /** Things the person should fix or know before filing. */
  warnings: string[];
}

const blank = (s: string | undefined, what: string) => (s ?? "").trim() || `[${what}]`;

export const fmtDate = (iso: IsoDate) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }) : "";

const d = (iso: IsoDate, what: string) => blank(fmtDate(iso), what);

const providerNames = (f: CaseFacts) => {
  const names = f.providers.map((p) => p.name.trim()).filter(Boolean);
  return names.length ? names.join(", ") : "[provider names]";
};

/** "Exhibit A: …" labels for the records the person picked. */
export function exhibitLabels(titles: string[]): string[] {
  return titles.map((t, i) => `Exhibit ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ""}: ${t}`);
}

function factsAboutFiling(f: CaseFacts): string[] {
  const fee = f.feeWaiver
    ? `Claimant filed a ${f.feeWaiver} in place of the filing fee.`
    : f.feePaidDate
      ? `Claimant paid the filing fee on ${fmtDate(f.feePaidDate)}.`
      : "Claimant paid the filing fee on [date].";
  return [
    `On ${d(f.actDate, "date of treatment")}, ${blank(f.patient, "patient")} was treated by ${providerNames(f)}.`,
    f.discoveryDate && f.discoveryDate !== f.actDate
      ? `Claimant did not know, and had no reason to know, of the malpractice until ${fmtDate(f.discoveryDate)}, when ${blank(f.discoveryHow, "how you found out")}.`
      : `Claimant learned of the malpractice on ${d(f.discoveryDate || f.actDate, "date you found out")}.`,
    `On ${d(f.panelFiledDate, "filing date")}, claimant filed a request for a medical review panel with the Division of Administration by ${f.panelFiledBy}.`,
    fee,
  ];
}

export function oppositionToPrescription(pack: MedMalPack, f: CaseFacts, today: IsoDate, exhibits: string[]): LegalDocument {
  const warnings: string[] = [];
  const citations: Citation[] = [
    pack.prescription.citation,
    pack.panel.suspensionCitation,
    pack.panel.feeCitation,
    { label: "Carter v. Haygood, 892 So. 2d 1261 (La. 2005)", verified: false },
  ];
  const argument: string[] = [];
  try {
    const dl = malpracticeDeadline(pack, {
      actDate: f.actDate, discoveryDate: f.discoveryDate || undefined, panelFiledDate: f.panelFiledDate, today,
    });
    if (dl.status === "filedLate") {
      warnings.push(`By the dates entered, the request was filed after ${fmtDate(dl.lastDayToFilePanel)}. Check the date you found out; this opposition only works if that date is right.`);
    }
    argument.push(
      `The request was filed ${daysBetween(f.discoveryDate || f.actDate, f.panelFiledDate)} days after claimant discovered the malpractice, within one year, and ${daysBetween(f.actDate, f.panelFiledDate)} days after the act, within three years.`,
    );
  } catch {
    warnings.push("Enter the treatment date, the date you found out and the panel filing date to complete the argument.");
  }
  if (!f.feePaidDate && !f.feeWaiver) warnings.push("Add the date you paid the fee, or the waiver you filed. Without it, the request didn't stop the clock.");

  return {
    title: "Memorandum in Opposition to Peremptory Exception of Prescription",
    kind: "pleading",
    caption: f.caption,
    blocks: [
      { kind: "p", text: `Claimant, ${blank(f.you.name, "your name")}, in proper person, opposes the peremptory exception of prescription filed by ${providerNames(f)}. The claim was timely filed, and the exception should be overruled.` },
      { kind: "heading", text: "Facts" },
      { kind: "list", items: factsAboutFiling(f) },
      { kind: "heading", text: "Law and argument" },
      { kind: "p", text: "A medical malpractice claim must be filed within one year from the date of the alleged act, omission or neglect, or within one year from the date of discovery, and in all events within three years from the date of the act. La. R.S. 9:5628(A)." },
      { kind: "p", text: "Filing a request for review by a medical review panel suspends the time within which suit must be instituted, as to all joint tortfeasors, until ninety days after the claimant is notified by certified mail of the panel's opinion. La. R.S. 40:1231.8(A)(2)(a)." },
      { kind: "p", text: "The party pleading prescription bears the burden of proving it. When a claim is not prescribed on its face, that burden stays with the exceptor. Carter v. Haygood, 892 So. 2d 1261 (La. 2005)." },
      ...argument.map((text) => ({ kind: "p" as const, text })),
      { kind: "p", text: "Because the request was filed within one year of discovery and within three years of the act, and the filing fee requirement was met, prescription was suspended and has not run." },
      { kind: "heading", text: "Conclusion" },
      { kind: "p", text: "Claimant asks the Court to overrule the peremptory exception of prescription." },
    ],
    signer: f.you,
    exhibits,
    serveOn: f.serveOn,
    citations,
    warnings,
  };
}

const beneficiaryClasses: Record<Relationship, number> = {
  self: 0, spouse: 1, child: 1, parent: 2, sibling: 3, grandparent: 4, other: 99,
};

export function oppositionToNoRightOfAction(f: CaseFacts, exhibits: string[]): LegalDocument {
  const warnings: string[] = [];
  const citations: Citation[] = [
    { label: "La. R.S. 40:1231.8(B)(2)(a)", url: rs40_1231_8, verified: true },
  ];
  const blocks: Block[] = [
    { kind: "p", text: `Claimant, ${blank(f.you.name, "your name")}, in proper person, opposes the peremptory exception of no right of action filed by ${providerNames(f)}.` },
    { kind: "heading", text: "Facts" },
  ];
  if (f.relationship === "self") {
    blocks.push(
      { kind: "list", items: [`Claimant is the patient, ${blank(f.patient, "patient")}, who was treated by ${providerNames(f)} on ${d(f.actDate, "date")}.`] },
      { kind: "heading", text: "Law and argument" },
      { kind: "p", text: "The exception of no right of action asks only whether the plaintiff belongs to the class of persons to whom the law grants the cause of action. A patient injured by a health care provider's malpractice is the person the law protects and may bring the claim." },
    );
    citations.push({ label: "La. Code Civ. Proc. art. 927(A)(6)", verified: false });
  } else {
    const rel = f.relationship;
    if (rel === "other") warnings.push("Only a spouse, children, parents, siblings or grandparents can bring a death claim, in that order. Check who the law allows before filing.");
    if (!f.patientDied) warnings.push("If the patient is alive, the patient usually brings the claim. A family member generally can't, except for limited claims of their own.");
    if (rel === "parent" || rel === "sibling" || rel === "grandparent") {
      warnings.push(`A ${rel} can bring a death claim only if no one in an earlier class survived. Say so in the facts, and attach proof if you have it.`);
    }
    blocks.push(
      { kind: "list", items: [
        `${blank(f.patient, "patient")} was treated by ${providerNames(f)} on ${d(f.actDate, "date")}${f.patientDied ? " and has died" : ""}.`,
        `Claimant is the patient's ${rel}.`,
        ...(beneficiaryClasses[rel] > 1 && beneficiaryClasses[rel] < 99 ? ["[No surviving spouse or child (and, for siblings or grandparents, no surviving parent).]"] : []),
      ] },
      { kind: "heading", text: "Law and argument" },
      { kind: "p", text: "The right to recover for the patient's own injuries survives the patient's death in favor of, in order: the surviving spouse and children; then the surviving parents; then the surviving brothers and sisters; then the surviving grandparents. La. Civ. Code art. 2315.1(A). The same persons, in the same order, may recover their own damages for the wrongful death. La. Civ. Code art. 2315.2(A)." },
      { kind: "p", text: `As the patient's ${rel}, claimant belongs to the class of persons to whom the law grants these actions.` },
    );
    citations.push(
      { label: "La. Civ. Code art. 2315.1", verified: false },
      { label: "La. Civ. Code art. 2315.2", verified: false },
    );
  }
  blocks.push(
    { kind: "heading", text: "Conclusion" },
    { kind: "p", text: "Claimant asks the Court to overrule the peremptory exception of no right of action." },
  );
  return {
    title: "Memorandum in Opposition to Peremptory Exception of No Right of Action",
    kind: "pleading", caption: f.caption, blocks, signer: f.you, exhibits, serveOn: f.serveOn, citations, warnings,
  };
}

export interface DiscoveryItem {
  question: string;
  answer: string;
}

export function discoveryResponses(f: CaseFacts, served: string, items: DiscoveryItem[]): LegalDocument {
  const warnings: string[] = [];
  if (items.some((i) => !i.answer.trim())) warnings.push("Some questions have no answer yet. Answer each one, or say why you can't.");
  return {
    title: "Claimant's Answers to Interrogatories and Responses to Requests for Production",
    kind: "pleading",
    caption: f.caption,
    blocks: [
      { kind: "p", text: `Claimant, ${blank(f.you.name, "your name")}, in proper person, answers the discovery served by ${blank(served, "who sent the questions")} as follows.` },
      ...items.flatMap((it, i): Block[] => [
        { kind: "heading", text: `No. ${i + 1}` },
        { kind: "p", text: `Request: ${blank(it.question, "copy the question exactly")}` },
        { kind: "p", text: `Answer: ${blank(it.answer, "your answer")}` },
      ]),
    ],
    signer: f.you,
    exhibits: [],
    verified: true,
    serveOn: f.serveOn,
    citations: [
      { label: "La. R.S. 40:1231.8(D)(2)–(3)", url: rs40_1231_8, verified: true },
      { label: "La. Code Civ. Proc. arts. 1458, 1462", verified: false },
    ],
    warnings,
  };
}

export function recordsRequest(f: CaseFacts, provider: string, providerAddress: string, today: IsoDate): LegalDocument {
  return {
    title: "Request for Medical Records",
    kind: "letter",
    to: [blank(provider, "provider or hospital"), "Attn: Medical Records / Health Information Management", blank(providerAddress, "provider's address")],
    blocks: [
      { kind: "p", text: fmtDate(today) },
      { kind: "p", text: `Re: Records of ${blank(f.patient, "patient")}` },
      { kind: "p", text: `I request a complete copy of the medical records of ${blank(f.patient, "patient")} from ${d(f.actDate, "first date of treatment")} to today, including:` },
      { kind: "list", items: [
        "Physician, nursing and progress notes",
        "Orders, medication administration records and anesthesia records",
        "Operative, consultation and discharge reports",
        "Lab and pathology results",
        "Imaging on disc, with the radiologist's reports",
        "Billing records and itemized statements",
      ] },
      { kind: "p", text: "A signed HIPAA authorization is enclosed. Please tell me the cost before copying if it will be more than the usual fee." },
    ],
    signer: f.you,
    exhibits: [],
    citations: [recordsRight],
    warnings: [],
  };
}

export function subpoenaRequest(f: CaseFacts, witness: string, witnessAddress: string, wanted: string, clerk: string): LegalDocument {
  return {
    title: "Request for Subpoena Duces Tecum",
    kind: "letter",
    to: [`Clerk of Court, ${blank(clerk, "parish")} Parish`],
    blocks: [
      { kind: "p", text: `Re: Medical review panel proceeding of ${blank(f.patient, "patient")}, filed with the Division of Administration on ${d(f.panelFiledDate, "filing date")}` },
      { kind: "p", text: "Under La. R.S. 40:1231.8(D)(4), I am a party to the medical review panel proceeding above and request that the Clerk issue a subpoena duces tecum to:" },
      { kind: "list", items: [`${blank(witness, "person or records custodian")}, ${blank(witnessAddress, "address")}`] },
      { kind: "p", text: `to produce the following for inspection and copying: ${blank(wanted, "describe the documents exactly")}.` },
      { kind: "p", text: "Please tell me the issuance and service fees, or whether a pauper ruling covers them." },
    ],
    signer: f.you,
    exhibits: [],
    citations: [{ label: "La. R.S. 40:1231.8(D)(4)", url: rs40_1231_8, verified: true }],
    warnings: [],
  };
}

export function petitionToCompel(f: CaseFacts, failure: string): LegalDocument {
  return {
    title: "Petition for Order Directing Compliance with Medical Review Panel Provisions",
    kind: "pleading",
    caption: f.caption,
    blocks: [
      { kind: "p", text: `Petitioner, ${blank(f.you.name, "your name")}, in proper person, respectfully represents:` },
      { kind: "list", items: [
        `On ${d(f.panelFiledDate, "filing date")}, petitioner filed a request for a medical review panel concerning the treatment of ${blank(f.patient, "patient")} by ${providerNames(f)}.`,
        `${blank(failure, "what the other side failed to do, with dates")}.`,
        "Under La. R.S. 40:1231.8(C)(6), a party aggrieved by another party's failure to comply with the medical review panel provisions may petition any district court of proper venue for an order directing compliance.",
      ] },
      { kind: "p", text: "Petitioner asks that the defendant be ordered to show cause why it should not be ordered to comply, and that after hearing the Court order compliance within a set time." },
    ],
    order: `Considering the petition, IT IS ORDERED that ${providerNames(f)} show cause on the ____ day of ____________, 20__, at ____ o'clock __.m., why the relief requested should not be granted.`,
    signer: f.you,
    exhibits: [],
    serveOn: f.serveOn,
    citations: [{ label: "La. R.S. 40:1231.8(C)(6)", url: rs40_1231_8, verified: true }],
    warnings: [],
  };
}

export function motionToExtend(f: CaseFacts, chairmanNoticeDate: IsoDate, goodCause: string): LegalDocument {
  return {
    title: "Motion to Extend Time for Medical Review Panel Opinion",
    kind: "pleading",
    caption: f.caption,
    blocks: [
      { kind: "p", text: `Claimant, ${blank(f.you.name, "your name")}, in proper person, moves to extend the twelve-month period for the medical review panel to render its opinion, and represents:` },
      { kind: "list", items: [
        `Notice of the selection of the attorney chairman was given on ${d(chairmanNoticeDate, "date")}.`,
        `Good cause exists because ${blank(goodCause, "why more time is needed")}.`,
        "La. R.S. 40:1231.8(B)(1)(b) allows either party to petition for an order extending the twelve-month period for good cause.",
      ] },
    ],
    order: "IT IS ORDERED that the time for the medical review panel to render its opinion is extended to ____________, 20__.",
    signer: f.you,
    exhibits: [],
    serveOn: f.serveOn,
    citations: [{ label: "La. R.S. 40:1231.8(B)(1)(b)", url: rs40_1231_8, verified: true }],
    warnings: [],
  };
}

/** The whole document as plain text, for copying and for tests. */
export function documentText(doc: LegalDocument): string {
  const out: string[] = [];
  const c = doc.caption;
  if (c) {
    out.push(
      `${blank(c.court, "court").toUpperCase()} FOR THE PARISH OF ${blank(c.parish, "parish").toUpperCase()}`,
      "STATE OF LOUISIANA",
      `NUMBER: ${blank(c.number, "docket number")}    DIVISION: ${blank(c.division, "division")}`,
      blank(c.title, "case title exactly as on the papers").toUpperCase(),
      "",
      doc.title.toUpperCase(),
      "",
    );
  }
  if (doc.to) out.push(...doc.to, "");
  for (const b of doc.blocks) {
    if (b.kind === "heading") out.push(b.text.toUpperCase());
    else if (b.kind === "p") out.push(b.text);
    else out.push(...b.items.map((it, i) => `${i + 1}. ${it}`));
    out.push("");
  }
  if (doc.exhibits.length) out.push("Exhibits attached:", ...doc.exhibits, "");
  const s = doc.signer;
  out.push(
    "Respectfully submitted,",
    "",
    "______________________________",
    `${blank(s.name, "your name")}${doc.kind === "pleading" ? ", in proper person" : ""}`,
    blank(s.address, "your address"),
    [s.phone, s.email].filter((x) => x.trim()).join(" · ") || "[phone and email]",
  );
  if (doc.verified) {
    out.push(
      "", "VERIFICATION",
      `STATE OF LOUISIANA, PARISH OF ${blank(c?.parish, "parish").toUpperCase()}`,
      `Before me, the undersigned notary, personally appeared ${blank(s.name, "your name")}, who, being sworn, said that the answers above are true and correct to the best of their knowledge.`,
      "______________________________  ______________________________",
      "Claimant                          Notary Public",
    );
  }
  if (doc.kind === "pleading") {
    out.push(
      "", "CERTIFICATE OF SERVICE",
      `I certify that a copy of this document has been served on ${blank(doc.serveOn, "the other side's lawyers, with addresses")} by mail or email on ____________, 20__.`,
      "______________________________",
    );
  }
  if (doc.order) out.push("", "ORDER", doc.order, "", "______________________________", "JUDGE");
  return out.join("\n");
}
