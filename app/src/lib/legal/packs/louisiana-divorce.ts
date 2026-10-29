import type { DivorcePack } from "../types";

const law = (d: number) => `https://legis.la.gov/legis/Law.aspx?d=${d}`;
const cc102 = law(108532);
const cc103 = law(108533);
const cc103_1 = law(408225);
const cc105 = law(108535);
const cc112 = law(108548);
const cc132 = law(108671);
const cc134 = law(108693);
const cc159 = law(108916);
const rs9_307 = law(107343);
const rs9_315_1 = law(107374);
const rs9_315_2 = law(179355);
const rs9_364 = law(179761);
const rs9_2801 = law(107289);
const ccp10 = law(111104);
const ccp3941 = law(111880);
const ccp3952 = law(111888);
const ccp3954 = law(111890);
const ccp3956 = law(111892);

export const louisianaDivorce: DivorcePack = {
  id: "la-divorce",
  state: "Louisiana",
  caseType: "Divorce (with custody, support and property)",
  filing: {
    jurisdiction: {
      text: "A Louisiana court can grant the divorce only if at least one spouse is domiciled in Louisiana when the petition is filed.",
      citation: { label: "La. Code Civ. Proc. art. 10(A)(7)", url: ccp10, verified: true },
    },
    domicilePresumptionMonths: 6,
    venue: {
      text: "File in the parish where either spouse is domiciled, or the parish where you last lived together as a married couple. Filing anywhere else makes the judgment void, and the spouses can't agree to change this.",
      citation: { label: "La. Code Civ. Proc. art. 3941", url: ccp3941, verified: true },
    },
    covenant: {
      text: "A covenant marriage has its own, longer grounds: two years apart, one year after a judgment of separation (18 months with a minor child), adultery, a felony, abandonment for a year, or abuse, and counseling first. This guide covers standard marriages.",
      citation: { label: "La. R.S. 9:307(A)", url: rs9_307, verified: true },
    },
    fees: {
      text: "Filing and sheriff's fees are set by each parish clerk. If you can't afford them, ask the clerk for the forms to proceed without paying costs in advance (in forma pauperis).",
      citation: { label: "La. Code Civ. Proc. art. 5181 et seq.", verified: false },
    },
  },
  periods: {
    noMinorChildren: 180,
    minorChildren: 365,
    citation: { label: "La. Civ. Code art. 103.1", url: cc103_1, verified: true },
    computation: { label: "La. Code Civ. Proc. art. 5059 (counting days)", verified: false },
  },
  afterPetition: {
    citation: { label: "La. Civ. Code art. 102", url: cc102, verified: true },
    ruleRequirements: [
      "The petition for divorce was served (or service was waived in writing)",
      "The waiting period has passed since that service or waiver",
      "You have lived separate and apart continuously for the waiting period before filing the rule",
    ],
    ruleCitation: { label: "La. Code Civ. Proc. art. 3952", url: ccp3952, verified: true },
    abandonmentYears: 2,
    abandonmentCitation: { label: "La. Code Civ. Proc. art. 3954", url: ccp3954, verified: true },
    evidence: [
      "The petition for divorce",
      "The sheriff's return of service, the return receipt, or the signed waiver of service",
      "The rule to show cause, with your affidavit",
      "The sheriff's return of service of the rule, or a waiver of it",
      "Your affidavit, signed after the rule is filed, that you've lived apart for the full period, still do, and want the divorce",
    ],
    evidenceCitation: { label: "La. Code Civ. Proc. art. 3956", url: ccp3956, verified: true },
    withoutHearing: {
      text: "Many courts grant an uncontested article 102 divorce on these papers without a hearing. Ask the clerk how your court does it and whether it wants a proposed judgment.",
      citation: { label: "Local court practice", verified: false },
    },
  },
  grounds: [
    { id: "separated", label: "Already living apart for the waiting period", plain: "You've already lived separate and apart, without getting back together, for the full waiting period on the day you file.", waitingPeriod: true },
    { id: "adultery", label: "Adultery", plain: "Your spouse committed adultery.", waitingPeriod: false },
    { id: "felony", label: "Felony with hard labor or death sentence", plain: "Your spouse committed a felony and was sentenced to death or imprisonment at hard labor.", waitingPeriod: false },
    { id: "abuse", label: "Physical or sexual abuse", plain: "During the marriage, your spouse physically or sexually abused you or a child of either of you. No criminal case is needed.", waitingPeriod: false },
    { id: "protectiveOrder", label: "Protective order", plain: "During the marriage, after a hearing or by consent, a court issued a protective order or injunction against your spouse to protect you or a child of either of you from abuse.", waitingPeriod: false },
  ],
  groundsCitation: { label: "La. Civ. Code art. 103", url: cc103, verified: true },
  incidental: {
    matters: [
      "Custody of the children",
      "Visitation",
      "Child support",
      "Spousal support",
      "Injunctions (for example, not to sell or hide community property)",
      "Who lives in the family home and uses community property",
      "Use of personal property, such as a car",
    ],
    citation: { label: "La. Civ. Code art. 105", url: cc105, verified: true },
  },
  custody: {
    agreement: {
      text: "If you and your spouse agree on custody, the court follows your agreement unless the child's best interest requires something else, or there's a history of family violence.",
      citation: { label: "La. Civ. Code art. 132", url: cc132, verified: true },
    },
    jointPresumption: {
      text: "Without an agreement the court awards joint custody, unless one parent proves by clear and convincing evidence that sole custody is in the child's best interest.",
      citation: { label: "La. Civ. Code art. 132", url: cc132, verified: true },
    },
    factors: [
      "The risk of abuse to the child, which comes first",
      "The love and emotional ties between each parent and the child",
      "Each parent's ability to give love, guidance and continue the child's education",
      "Each parent's ability to provide food, clothing and medical care",
      "How long the child has lived in a stable home, and keeping that going",
      "Whether each home will last as a family unit",
      "Each parent's moral fitness, as it affects the child",
      "Any history of substance abuse, violence or crime",
      "Each parent's mental and physical health",
      "The child's home, school and community history",
      "The child's reasonable preference, if old enough",
      "Each parent's willingness to support the child's relationship with the other parent",
      "The distance between the homes",
      "Who has taken care of the child in the past",
    ],
    factorsCitation: { label: "La. Civ. Code art. 134(A)", url: cc134, verified: true },
    familyViolence: [
      {
        text: "A parent with a history of family violence (one incident with serious bodily injury, or more than one incident) is presumed not to get sole or joint custody.",
        citation: { label: "La. R.S. 9:364(A)", url: rs9_364, verified: true },
      },
      {
        text: "That parent can overcome it only by completing a court-monitored intervention program, not abusing alcohol or drugs, and showing the child needs them because of the other parent's absence, illness or similar problem.",
        citation: { label: "La. R.S. 9:364(B)", url: rs9_364, verified: true },
      },
      {
        text: "Visitation with that parent must be supervised. The effects of being abused can't by themselves be used against the parent who was abused.",
        citation: { label: "La. R.S. 9:364(C), (E)", url: rs9_364, verified: true },
      },
    ],
    notes: [
      {
        text: "With joint custody, the court usually names a domiciliary parent (where the child mainly lives) and sets a joint custody plan with each parent's time and responsibilities.",
        citation: { label: "La. R.S. 9:335", verified: false },
      },
      {
        text: "The court can send you to mediation over custody and visitation, but there are protections where there's been abuse.",
        citation: { label: "La. R.S. 9:332", verified: false },
      },
      {
        text: "Moving a child's home a long way after custody is set needs notice to the other parent and sometimes the court's approval.",
        citation: { label: "La. R.S. 9:355.1 et seq.", verified: false },
      },
    ],
  },
  childSupport: {
    presumption: {
      text: "Support figured under the state guidelines is presumed correct. The court can go above or below only with specific reasons on the record.",
      citation: { label: "La. R.S. 9:315.1", url: rs9_315_1, verified: true },
    },
    steps: [
      "Each parent files a sworn income statement with pay stubs and the latest federal tax return.",
      "Add the two adjusted gross incomes together. Each parent's percentage of the total is their share.",
      "Look up the basic obligation in the state schedule using the combined income and number of children.",
      "Add work-related child care, health insurance for the children, and certain other costs, then split the total by each parent's share.",
    ],
    stepsCitation: { label: "La. R.S. 9:315.2", url: rs9_315_2, verified: true },
    notes: [
      {
        text: "The schedule of basic obligations by income and number of children.",
        citation: { label: "La. R.S. 9:315.19", verified: false },
      },
      {
        text: "Child care and health insurance costs are added to the basic obligation.",
        citation: { label: "La. R.S. 9:315.3, 9:315.4", verified: false },
      },
      {
        text: "If a parent is voluntarily unemployed or underemployed, the court can set support on what they could earn.",
        citation: { label: "La. R.S. 9:315.2(B), 9:315.11", url: rs9_315_2, verified: true },
      },
      {
        text: "Shared custody (about equal time) uses a different worksheet.",
        citation: { label: "La. R.S. 9:315.9", verified: false },
      },
      {
        text: "The state's child support office can help set and collect support for a small fee.",
        citation: { label: "Louisiana DCFS Child Support Enforcement", verified: false },
      },
    ],
  },
  spousalSupport: {
    interim: [
      {
        text: "While the divorce is pending, a spouse who needs it can get interim support based on their needs, the other's ability to pay, child support, and the standard of living during the marriage.",
        citation: { label: "La. Civ. Code art. 113(A)", verified: false },
      },
      {
        text: "Interim support ends at the divorce, or, if a final support claim is pending, when it's decided or 180 days after the divorce, whichever comes first (longer only for good cause).",
        citation: { label: "La. Civ. Code art. 113(B)", verified: false },
      },
    ],
    final: {
      text: "After the divorce, a spouse who was not at fault before the petition was filed and who needs support can get final periodic support.",
      citation: { label: "La. Civ. Code art. 112(A)", url: cc112, verified: true },
    },
    finalFactors: [
      "Each spouse's income and assets, and how easily the assets can be turned into cash",
      "Each spouse's financial obligations, including support",
      "Each spouse's earning capacity",
      "How custody of the children affects earning capacity",
      "Time needed for education, training or a job",
      "Health and age",
      "Length of the marriage",
      "Tax consequences",
      "Any domestic abuse and its effects",
    ],
    finalCapFraction: 1 / 3,
    capCitation: { label: "La. Civ. Code art. 112(D)", url: cc112, verified: true },
    abusePresumption: {
      text: "A spouse divorced on a fault ground (adultery, felony, abuse or protective order), or found to be a victim of domestic abuse, is presumed entitled to final support. With abuse, the award can be more than one-third and can be a lump sum.",
      citation: { label: "La. Civ. Code art. 112(C)–(D)", url: cc112, verified: true },
    },
  },
  property: {
    communityEnds: {
      text: "The divorce ends the community property regime as of the day the petition was filed. Property and debts either of you acquire after that date are generally your own.",
      citation: { label: "La. Civ. Code art. 159", url: cc159, verified: true },
    },
    listDays: 45,
    traverseDays: 60,
    partitionCitation: { label: "La. R.S. 9:2801(A)", url: rs9_2801, verified: true },
    notes: [
      {
        text: "If a spouse misses the 45 days, the other can ask the court to treat their own list as the court's finding of what the community owns and owes.",
        citation: { label: "La. R.S. 9:2801(A)(1)", url: rs9_2801, verified: true },
      },
      {
        text: "Each spouse owns half of the community property. Property owned before the marriage, or received by gift or inheritance, is generally separate.",
        citation: { label: "La. Civ. Code arts. 2336, 2341", verified: false },
      },
      {
        text: "You don't have to divide property at the same time as the divorce. Many people divorce first and partition later, by agreement or in court.",
        citation: { label: "La. R.S. 9:2801", url: rs9_2801, verified: true },
      },
    ],
  },
  safety: [
    {
      text: "If you're in danger, call 911. The National Domestic Violence Hotline is 1-800-799-7233. You can ask the court for a protective order before or during the divorce.",
      citation: { label: "La. R.S. 46:2131 et seq.", verified: false },
    },
    {
      text: "A divorce for abuse or based on a protective order has no waiting period.",
      citation: { label: "La. Civ. Code art. 103(4)–(5)", url: cc103, verified: true },
    },
  ],
};
