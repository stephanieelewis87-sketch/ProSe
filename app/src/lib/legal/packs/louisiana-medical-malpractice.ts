import type { MedMalPack } from "../types";

const rs9_5628 = "https://www.legis.la.gov/Legis/Law.aspx?d=108286";
const rs40_1231_8 = "https://legis.la.gov/legis/Law.aspx?d=964877";
const rs40_1231_2 = "https://legis.la.gov/legis/law.aspx?d=97087";
const rs9_2794 = "https://legis.la.gov/legis/Law.aspx?d=107231";
const howToFile = "https://doa.la.gov/doa/mmc/pcf/pcf-how-to-file-instructions/";
const panelFaq = "https://doa.la.gov/doa/mmc/medical-review-panel/faq/";

export const louisianaMedicalMalpractice: MedMalPack = {
  id: "la-medical-malpractice",
  state: "Louisiana",
  caseType: "Medical malpractice (injured patient or family)",
  terms: { limitationsPeriod: "prescription" },
  prescription: {
    years: 1,
    outerLimitYears: 3,
    citation: { label: "La. R.S. 9:5628(A)", url: rs9_5628, verified: true },
    outerLimitSuspended: { label: "Borel v. Young, 989 So. 2d 42 (La. 2008)", verified: false },
  },
  deadlineComputation: { label: "La. Civ. Code art. 3454", verified: false },
  panel: {
    required: { label: "La. R.S. 40:1231.8(B)(1)(a)(i)", url: rs40_1231_8, verified: true },
    filedWith: {
      name: "Division of Administration, Medical Review Panel Office",
      mail: "P.O. Box 44336, Baton Rouge, LA 70804-4336 (certified mail)",
      handDelivery: "1201 North Third Street, 7th Floor, Suite 210, Baton Rouge, LA 70802",
      fax: "(225) 342-1057",
      phone: "(225) 342-8509",
      url: howToFile,
    },
    requiredContents: [
      "A statement that this is a request for a medical review panel",
      "The patient's full name (one patient per request)",
      "The full names of everyone making the claim",
      "The full names of each doctor, hospital or clinic you are naming",
      "The dates of the malpractice",
      "A short description of what each one did wrong",
      "A short, specific description of the injuries",
    ],
    contentsCitation: { label: "La. R.S. 40:1231.8(A)(1)(b)", url: rs40_1231_8, verified: true },
    feePerQualifiedDefendant: 100,
    feeDueDays: 45,
    feeCitation: { label: "La. R.S. 40:1231.8(A)(1)(c), (A)(3)(a)", url: rs40_1231_8, verified: true },
    feeWaivers: [
      {
        text: "An affidavit from a licensed physician who reviewed the records and says each named provider breached the standard of care.",
        citation: { label: "La. R.S. 40:1231.8(A)(1)(d)", url: rs40_1231_8, verified: true },
      },
      {
        text: "A ruling from a district court that you can't afford court costs (in forma pauperis).",
        citation: { label: "La. Code Civ. Proc. art. 5181 et seq.", url: rs40_1231_8, verified: true },
      },
    ],
    suspensionEndsDaysAfterNotice: 90,
    suspensionCitation: { label: "La. R.S. 40:1231.8(A)(2)(a)", url: rs40_1231_8, verified: true },
    claimantPicksPanelistDays: 30,
    selectionCitation: { label: "La. R.S. 40:1231.8(C)(3)", url: rs40_1231_8, verified: true },
    evidenceDays: 90,
    opinionDays: 30,
    opinionDeadlineMonths: 12,
    findings: [
      "The evidence supports that the provider failed to meet the standard of care.",
      "The evidence does not support that the provider failed to meet the standard of care.",
      "There is a factual question, not needing expert opinion, for the court to decide.",
      "Whether the failure caused the injury, and how long and how serious the disability is.",
    ],
    opinionUse: {
      text: "The panel's opinion can be used as evidence in court, and either side can call a panel doctor as a witness. A favorable opinion is expert testimony you didn't have to hire.",
      citation: { label: "La. R.S. 40:1231.8(G), (H)", url: rs40_1231_8, verified: true },
    },
    costs: [
      {
        text: "Panel doctors are paid $25 a day, up to $300 each; the attorney chairman $100 a day, up to $2,000, plus expenses.",
        citation: { label: "La. R.S. 40:1231.8(I)(1)", url: rs40_1231_8, verified: true },
      },
      {
        text: "The losing side of the opinion pays the panel's costs, and they're split when the panel finds a fact question. With a pauper ruling, the provider pays up front and is repaid from any recovery.",
        citation: { label: "La. R.S. 40:1231.8(I)(2)–(3)", url: rs40_1231_8, verified: true },
      },
      {
        text: "If all the panel doctors rule against you and you still sue, you must post a bond for the panel's costs.",
        citation: { label: "La. R.S. 40:1231.8(I)(2)(c)", url: rs40_1231_8, verified: true },
      },
    ],
    waiverByAgreement: { label: "La. R.S. 40:1231.8(B)(1)(c)", url: rs40_1231_8, verified: true },
  },
  cap: {
    total: 500000,
    perProvider: 100000,
    futureMedicalExcluded: true,
    citation: { label: "La. R.S. 40:1231.2(B)", url: rs40_1231_2, verified: true },
    notes: [
      {
        text: "The cap covers only providers enrolled with the Patient's Compensation Fund. A provider who isn't enrolled has no cap and no panel requirement.",
        citation: { label: "La. R.S. 40:1231.2(A)–(B)", url: rs40_1231_2, verified: true },
      },
      {
        text: "Future medical care is paid as it's needed by the Fund, on top of the $500,000.",
        citation: { label: "La. R.S. 40:1231.3", url: "https://legis.la.gov/legis/Law.aspx?d=964871", verified: false },
      },
      {
        text: "The Louisiana Supreme Court upheld the cap.",
        citation: { label: "Oliver v. Magnolia Clinic, 85 So. 3d 39 (La. 2012)", verified: false },
      },
      {
        text: "Claims against state hospitals and state-employed doctors fall under a separate act with its own panel and cap.",
        citation: { label: "La. R.S. 40:1237.1", verified: false },
      },
    ],
  },
  proof: {
    elements: [
      "The standard of care: what a reasonably careful provider (or specialist, for a specialty issue) would have done.",
      "The breach: this provider didn't do it.",
      "Causation: the breach caused an injury you wouldn't otherwise have had.",
    ],
    citation: { label: "La. R.S. 9:2794(A)", url: rs9_2794, verified: true },
    resIpsa: {
      text: "When the mistake is obvious to anyone (a sponge left inside, surgery on the wrong limb), the court can let the facts speak for themselves without the usual expert proof.",
      citation: { label: "La. R.S. 9:2794(C)", url: rs9_2794, verified: true },
    },
  },
  expert: {
    qualifications: [
      "Practicing medicine now, or when the claim arose (teaching or consulting counts)",
      "Knows the accepted standard of care for your condition",
      "Qualified by training or experience to give that opinion",
      "Licensed in any U.S. state, or a graduate of an accredited medical school",
    ],
    citation: { label: "La. R.S. 9:2794(D)", url: rs9_2794, verified: true },
    notes: [
      {
        text: "You can subpoena a doctor with special knowledge of the procedure to testify about the standard of care, even without their consent. The court sets the fee.",
        citation: { label: "La. R.S. 9:2794(B)", url: rs9_2794, verified: true },
      },
      {
        text: "Board certification or substantial training in the area counts toward qualification.",
        citation: { label: "La. R.S. 9:2794(D)(3)", url: rs9_2794, verified: true },
      },
    ],
  },
  qualification: {
    text: "Ask the Patient's Compensation Fund whether each provider is enrolled. After you file, the board's confirmation letter says which defendants are qualified.",
    phone: "(225) 342-5200 or (866) 469-9555",
    citation: { label: "Division of Administration FAQ", url: panelFaq, verified: true },
  },
  records: {
    text: "You have a right to a copy of your medical records. Ask in writing and keep a copy of the request.",
    citation: { label: "La. R.S. 40:1165.1", verified: false },
  },
};
