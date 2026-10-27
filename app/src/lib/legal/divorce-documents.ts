import { addYears } from "./dates";
import { divorceTimeline } from "./divorce";
import { blank, fmtDate, type Block, type Caption, type LegalDocument, type Person } from "./documents";
import type { Citation, DivorceGround, DivorcePack, IsoDate } from "./types";

export interface Child {
  name: string;
  birthDate: IsoDate;
}

export type Custody = "" | "joint" | "sole";

/** What the person has told us about their divorce, reused across every document. The person is the petitioner. */
export interface DivorceFacts {
  you: Person;
  /** Your parish of domicile. */
  yourParish: string;
  spouse: Person;
  spouseParish: string;
  marriageDate: IsoDate;
  marriageParish: string;
  covenant: boolean;
  /** Parish where you last lived together as a married couple. */
  lastMatrimonialParish: string;
  separatedDate: IsoDate;
  children: Child[];
  path: "102" | "103";
  ground: DivorceGround;
  /** The facts behind a fault ground, in your words. */
  groundFacts: string;
  petitionFiledDate: IsoDate;
  servedDate: IsoDate;
  servedBy: "sheriff" | "waiver";
  requests: {
    custody: Custody;
    /** With joint custody, who the child mainly lives with. */
    domiciliary: "" | "me" | "spouse";
    childSupport: boolean;
    interimSupport: boolean;
    finalSupport: boolean;
    useOfHome: boolean;
    useOfCar: boolean;
    injunction: boolean;
  };
  caption: Caption;
  /** The other side (or their lawyer) and address, for the certificate of service. */
  serveOn: string;
}

export interface PropertyItem {
  description: string;
  value: string;
  location: string;
  /** "community", or "separate" when you claim it's yours alone. */
  claim: "community" | "separate";
}

const you = (f: DivorceFacts) => blank(f.you.name, "your name");
const spouse = (f: DivorceFacts) => blank(f.spouse.name, "spouse's name");
const d = (iso: IsoDate, what: string) => blank(fmtDate(iso), what);
/** Children of the marriage still under 18 on `on`; a child with no birth date counts as a minor. */
const minors = (f: DivorceFacts, on: IsoDate) =>
  f.children.filter((c) => c.name.trim() && (!c.birthDate || addYears(c.birthDate, 18) > on));

/** How each fault ground reads in a petition, and its paragraph of art. 103. */
const faultAllegation: Record<Exclude<DivorceGround, "separated">, { text: string; para: number }> = {
  adultery: { text: "Defendant has committed adultery.", para: 2 },
  felony: { text: "Defendant has committed a felony and has been sentenced to death or imprisonment at hard labor.", para: 3 },
  abuse: { text: "During the marriage, defendant physically or sexually abused petitioner or a child of one of the spouses.", para: 4 },
  protectiveOrder: { text: "During the marriage, after a contradictory hearing or by consent decree, a protective order or injunction was issued against defendant to protect petitioner or a child of one of the spouses from abuse.", para: 5 },
};

const youngest = (f: DivorceFacts) =>
  f.children.map((c) => c.birthDate).filter(Boolean).sort().at(-1);

/** The caption for a divorce: "you versus spouse" unless the person typed one in. */
export function divorceCaption(f: DivorceFacts): Caption {
  const title = f.caption.title.trim() || (f.you.name.trim() && f.spouse.name.trim() ? `${f.you.name.trim()} versus ${f.spouse.name.trim()}` : "");
  return { ...f.caption, title };
}

function childList(f: DivorceFacts, today: IsoDate): string {
  const kids = minors(f, today);
  if (!kids.length) return "No children were born of or adopted during the marriage who are now minors, and none are expected.";
  return `The following minor children were born of or adopted during the marriage: ${kids
    .map((c) => `${c.name.trim()}, born ${d(c.birthDate, "birth date")}`).join("; ")}.`;
}

function incidentalRequests(f: DivorceFacts): string[] {
  const r = f.requests;
  const out: string[] = [];
  if (r.custody === "joint") {
    out.push(`Petitioner requests joint custody of the minor children${r.domiciliary
      ? `, with ${r.domiciliary === "me" ? "petitioner" : "defendant"} named domiciliary parent,` : ""} under a joint custody implementation plan, as in the children's best interest.`);
  }
  if (r.custody === "sole") out.push("Petitioner requests sole custody of the minor children, as in the children's best interest, with reasonable visitation to defendant as the Court finds appropriate.");
  if (r.childSupport) out.push("Petitioner requests child support under the Louisiana child support guidelines, La. R.S. 9:315 et seq.");
  if (r.interimSupport) out.push("Petitioner is in need of support and requests interim spousal support pending the divorce and the determination of final support. La. Civ. Code art. 113.");
  if (r.finalSupport) out.push("Petitioner is free from fault in the breakup of the marriage, is in need of support, and requests final periodic spousal support. La. Civ. Code art. 112.");
  if (r.useOfHome) out.push("Petitioner requests the exclusive use and occupancy of the family home pending partition of the community property.");
  if (r.useOfCar) out.push("Petitioner requests the exclusive use of the vehicle petitioner regularly drives pending partition of the community property.");
  if (r.injunction) out.push("Petitioner requests that defendant be enjoined from alienating, encumbering or disposing of community property, except in the ordinary course of business or for necessities.");
  return out;
}

export function divorcePetition(pack: DivorcePack, f: DivorceFacts, today: IsoDate): LegalDocument {
  const warnings: string[] = [];
  const citations: Citation[] = [pack.filing.jurisdiction.citation, pack.filing.venue.citation, pack.incidental.citation];
  const ground = pack.grounds.find((g) => g.id === f.ground)!;
  const is102 = f.path === "102";

  if (f.covenant) warnings.push("You have a covenant marriage. These grounds don't apply; covenant marriages have their own grounds and counseling requirement (La. R.S. 9:307).");
  const parishes = [f.yourParish, f.spouseParish, f.lastMatrimonialParish].map((p) => p.trim().toLowerCase()).filter(Boolean);
  if (f.caption.parish.trim() && parishes.length && !parishes.includes(f.caption.parish.trim().toLowerCase())) {
    warnings.push(`You're filing in ${f.caption.parish.trim()} Parish, but that isn't where either of you lives or where you last lived together. A divorce from the wrong parish is void (La. Code Civ. Proc. art. 3941).`);
  }
  if (!is102 && ground.waitingPeriod && f.separatedDate) {
    const t = divorceTimeline(pack, {
      path: "103", ground: f.ground, separatedDate: f.separatedDate, today,
      minorChildren: minors(f, today).length > 0, youngestBirthDate: youngest(f),
    });
    if (t.status !== "ready") warnings.push(`By your separation date you can't file on this ground until ${fmtDate(t.earliest)}. File under article 102 now instead, or wait.`);
  }
  if (!is102 && !ground.waitingPeriod && !f.groundFacts.trim()) warnings.push("Describe the facts behind the ground: what happened, and when. You'll have to prove them.");
  if (f.requests.custody && !minors(f, today).length) warnings.push("You asked for custody but listed no minor children.");
  if (f.children.some((c) => c.name.trim() && !c.birthDate)) warnings.push("Add each child's birth date.");
  if (is102 && f.servedBy === "sheriff" && !f.spouse.address.trim()) warnings.push("Add your spouse's address so the sheriff can serve them.");

  const groundParas: Block[] = is102
    ? [
      { kind: "p", text: `Petitioner desires a divorce under Louisiana Civil Code article 102. After the delays required by article 103.1 have elapsed from service of this petition or the execution of a written waiver of service, petitioner will file a rule to show cause why a divorce should not be granted.` },
    ]
    : ground.waitingPeriod
      ? [{ kind: "p", text: `The parties have lived separate and apart continuously, without reconciliation, since ${d(f.separatedDate, "date you separated")}, a period of at least ${minors(f, today).length ? pack.periods.minorChildren : pack.periods.noMinorChildren} days before the filing of this petition. Petitioner is entitled to a divorce under Louisiana Civil Code article 103(1).` }]
      : [
        { kind: "p", text: `${faultAllegation[f.ground as keyof typeof faultAllegation].text} Specifically: ${blank(f.groundFacts, "what happened, and when")}.` },
        { kind: "p", text: `Petitioner is entitled to a divorce under Louisiana Civil Code article 103(${faultAllegation[f.ground as keyof typeof faultAllegation].para}).` },
      ];
  citations.push(is102 ? pack.afterPetition.citation : pack.groundsCitation, pack.periods.citation);

  const requests = incidentalRequests(f);
  if (f.requests.custody) citations.push(pack.custody.jointPresumption.citation);
  if (f.requests.childSupport) citations.push(pack.childSupport.presumption.citation);
  if (f.requests.finalSupport) citations.push(pack.spousalSupport.final.citation);

  const blocks: Block[] = [
    { kind: "p", text: `The petition of ${you(f)}, a person of the full age of majority domiciled in ${blank(f.yourParish, "your parish")} Parish, Louisiana, in proper person, respectfully represents:` },
    { kind: "list", items: [
      `Made defendant is ${spouse(f)}, a person of the full age of majority domiciled in ${blank(f.spouseParish, "spouse's parish or state")}.`,
      `Petitioner and defendant were married on ${d(f.marriageDate, "date of marriage")} in ${blank(f.marriageParish, "parish or place of marriage")}. Their marriage is not a covenant marriage.`,
      `The parties last lived together as a married couple in ${blank(f.lastMatrimonialParish, "parish")} Parish, Louisiana.`,
      childList(f, today),
      `At least one party is domiciled in Louisiana, and venue is proper in this parish. La. Code Civ. Proc. arts. 10(A)(7), 3941.`,
    ] },
    ...groundParas,
    ...(requests.length ? [{ kind: "list" as const, items: requests }] : []),
    { kind: "p", text: `The community property regime between the parties terminates retroactively to the date of filing of this petition. La. Civ. Code art. 159. Petitioner reserves the right to seek partition of the community property under La. R.S. 9:2801.` },
    { kind: "heading", text: "Prayer" },
    { kind: "p", text: `Petitioner prays that defendant be ${is102 ? "served with a copy of this petition" : "cited to appear and answer this petition"}; that ${is102 ? "after the delays provided by law and on rule to show cause, " : "after due proceedings, "}there be a judgment of divorce between petitioner and defendant${requests.length ? "; that petitioner be granted the relief requested above" : ""}; and for all general and equitable relief.` },
  ];
  if (f.servedBy === "sheriff") {
    blocks.push({ kind: "heading", text: "Please serve" }, { kind: "p", text: `${spouse(f)}, ${blank(f.spouse.address, "spouse's address for service")}` });
  } else {
    blocks.push({ kind: "p", text: "Service will be waived by defendant in writing." });
  }

  return {
    title: is102 ? "Petition for Divorce Under Civil Code Article 102" : "Petition for Divorce Under Civil Code Article 103",
    kind: "pleading",
    caption: divorceCaption(f),
    blocks,
    signer: f.you,
    exhibits: [],
    verification: { statement: "they are the petitioner in this matter and that all of the allegations of the petition are true and correct", role: "Petitioner" },
    noCertificate: true,
    citations,
    warnings,
  };
}

export function waiverOfService(pack: DivorcePack, f: DivorceFacts): LegalDocument {
  return {
    title: "Waiver of Citation and Service",
    kind: "pleading",
    caption: divorceCaption(f),
    blocks: [
      { kind: "p", text: `Defendant, ${spouse(f)}, acknowledges receiving a copy of the Petition for Divorce filed by ${you(f)}${f.petitionFiledDate ? ` on ${fmtDate(f.petitionFiledDate)}` : ""}, and expressly waives citation and service of citation of that petition.` },
      { kind: "p", text: "Defendant does not waive notice of any trial, hearing or judgment, and does not admit any allegation of the petition other than receipt." },
    ],
    signer: f.spouse,
    signoff: "Signed:",
    exhibits: [],
    verification: { statement: "they signed this waiver freely, after reading it", role: "Defendant" },
    noCertificate: true,
    citations: [pack.afterPetition.citation],
    warnings: [
      "Your spouse signs this, not you, after the petition is filed. For an article 102 divorce the waiting period runs from the day it's signed.",
      "Don't pressure your spouse to sign. If they won't, have the sheriff serve them instead.",
    ],
  };
}

export function ruleToShowCause(pack: DivorcePack, f: DivorceFacts, today: IsoDate): LegalDocument {
  const warnings: string[] = [];
  const kids = minors(f, today).length > 0;
  if (f.path !== "102") warnings.push("A rule to show cause is only for a divorce filed under article 102.");
  if (!f.servedDate || !f.separatedDate) {
    warnings.push("Add the date your spouse was served (or signed the waiver) and the date you separated, to check the waiting period.");
  } else {
    const t = divorceTimeline(pack, {
      path: "102", separatedDate: f.separatedDate, servedDate: f.servedDate, today,
      minorChildren: kids, youngestBirthDate: youngest(f),
    });
    if (t.status === "abandoned") warnings.push(`The rule had to be filed by ${fmtDate(t.abandonedAfter!)}. The divorce case is abandoned; you'll need to file a new petition (La. Code Civ. Proc. art. 3954).`);
    else if (t.status === "wait") warnings.push(`Don't file this before ${fmtDate(t.earliest)}. The full ${t.periodDays} days haven't passed yet.`);
  }
  const days = kids ? pack.periods.minorChildren : pack.periods.noMinorChildren;
  return {
    title: "Rule to Show Cause for Divorce Under Civil Code Article 102",
    kind: "pleading",
    caption: divorceCaption(f),
    blocks: [
      { kind: "p", text: `Petitioner, ${you(f)}, in proper person, respectfully represents:` },
      { kind: "list", items: [
        `On ${d(f.petitionFiledDate, "date petition filed")}, petitioner filed a petition for divorce under Louisiana Civil Code article 102.`,
        f.servedBy === "waiver"
          ? `Defendant, ${spouse(f)}, executed a written waiver of service of the petition on ${d(f.servedDate, "date waiver signed")}.`
          : `Defendant, ${spouse(f)}, was served with the petition on ${d(f.servedDate, "date served")}.`,
        `More than ${days} days have elapsed since that ${f.servedBy === "waiver" ? "waiver" : "service"}${kids ? ", the period required because there are minor children of the marriage" : ""}. La. Civ. Code art. 103.1.`,
        `The parties have lived separate and apart continuously since ${d(f.separatedDate, "date you separated")}, for at least ${days} days before the filing of this rule.`,
        "This rule is supported by petitioner's affidavit, attached. La. Code Civ. Proc. art. 3952.",
      ] },
      { kind: "p", text: "Petitioner asks that defendant be ordered to show cause why a judgment of divorce should not be granted, and that after hearing, or on the affidavits if the Court allows, a judgment of divorce be rendered." },
    ],
    order: `IT IS ORDERED that defendant, ${spouse(f)}, show cause on the ____ day of ____________, 20__, at ____ o'clock __.m., why a judgment of divorce should not be rendered in favor of petitioner as prayed for.`,
    signer: f.you,
    exhibits: ["Affidavit of petitioner"],
    serveOn: f.serveOn || (f.spouse.address.trim() ? `${spouse(f)}, ${f.spouse.address.trim()}` : ""),
    citations: [pack.afterPetition.citation, pack.afterPetition.ruleCitation, pack.periods.citation, pack.afterPetition.abandonmentCitation],
    warnings,
  };
}

export function affidavitForDivorce(pack: DivorcePack, f: DivorceFacts, today: IsoDate): LegalDocument {
  const days = minors(f, today).length ? pack.periods.minorChildren : pack.periods.noMinorChildren;
  return {
    title: "Affidavit in Support of Divorce",
    kind: "pleading",
    caption: divorceCaption(f),
    blocks: [
      { kind: "p", text: `${you(f)}, being first duly sworn, states:` },
      { kind: "list", items: [
        `I am the petitioner in this divorce.`,
        `My spouse, ${spouse(f)}, and I have lived separate and apart continuously, without reconciliation, since ${d(f.separatedDate, "date you separated")}, for at least ${days} days before the rule to show cause was filed.`,
        "We are still living separate and apart.",
        "I want to be divorced.",
      ] },
    ],
    signer: f.you,
    signoff: "Affiant:",
    exhibits: [],
    verification: { statement: "the facts in this affidavit are true and correct", role: "Affiant" },
    noCertificate: true,
    citations: [pack.afterPetition.evidenceCitation, pack.afterPetition.ruleCitation],
    warnings: ["Sign this in front of a notary after the rule to show cause is filed. Article 3956 requires an affidavit signed after the rule."],
  };
}

export function proposedJudgment(f: DivorceFacts): LegalDocument {
  return {
    title: "Judgment of Divorce",
    kind: "pleading",
    caption: divorceCaption(f),
    blocks: [
      { kind: "p", text: `This matter came before the Court on the ${f.path === "102" ? "rule to show cause filed by" : "petition of"} ${you(f)}. Considering the pleadings, the evidence and the law, the Court finds that the requirements for a divorce have been met.` },
      { kind: "p", text: `IT IS ORDERED, ADJUDGED AND DECREED that there be a judgment of divorce in favor of ${you(f)} and against ${spouse(f)}, and that the bonds of matrimony between them are dissolved.` },
      { kind: "p", text: "Judgment read, rendered and signed in ____________, Louisiana, on the ____ day of ____________, 20__." },
      { kind: "p", text: "______________________________ Judge" },
    ],
    signer: f.you,
    signoff: "Prepared and submitted by:",
    exhibits: [],
    noCertificate: true,
    citations: [],
    warnings: ["Custody, support and property orders usually go in a separate judgment or a consent judgment. Ask the clerk whether your court has its own judgment form."],
  };
}

export function descriptiveList(pack: DivorcePack, f: DivorceFacts, assets: PropertyItem[], debts: PropertyItem[]): LegalDocument {
  const line = (p: PropertyItem) =>
    `${blank(p.description, "description")}. Value: ${blank(p.value, "fair market value")}. Location: ${blank(p.location, "where it is")}.${p.claim === "separate" ? " Claimed as petitioner's separate property." : ""}`;
  const warnings: string[] = [];
  if (!assets.some((a) => a.description.trim())) warnings.push("List every community asset: home, cars, bank accounts, retirement accounts, furniture, business interests.");
  return {
    title: "Sworn Detailed Descriptive List",
    kind: "pleading",
    caption: divorceCaption(f),
    blocks: [
      { kind: "p", text: `${you(f)}, in proper person, files this sworn detailed descriptive list of the community property, its fair market value and location, and the community liabilities, under La. R.S. 9:2801.` },
      { kind: "heading", text: "Assets" },
      { kind: "list", items: assets.length ? assets.map(line) : ["None known."] },
      { kind: "heading", text: "Liabilities" },
      { kind: "list", items: debts.length ? debts.map((p) => `${blank(p.description, "debt and creditor")}. Balance: ${blank(p.value, "amount owed")}.`) : ["None known."] },
    ],
    signer: f.you,
    exhibits: [],
    verification: { statement: "this list includes all community assets and liabilities known to them", role: "Petitioner" },
    serveOn: f.serveOn,
    citations: [pack.property.partitionCitation, pack.property.communityEnds.citation],
    warnings,
  };
}
