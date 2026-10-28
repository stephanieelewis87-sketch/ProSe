import type { CourtSupportPack } from "../types";

const toVerify = (label: string, url?: string) => ({ label, url, verified: false });

/**
 * Who can come to court with a person who has no one, what each kind of helper may do, and the
 * Louisiana rules that draw the line between support and practicing law.
 */
export const louisianaCourtSupport: CourtSupportPack = {
  id: "la-court-support",
  state: "Louisiana",
  limits: {
    unauthorizedPractice: {
      text:
        "Only a licensed Louisiana lawyer can give you legal advice, write your court papers for you as your " +
        "representative, or speak for you in court. Anyone else who does is breaking the law, even if they mean well.",
      citation: toVerify("La. R.S. 37:212–213"),
    },
    openCourts: {
      text: "Louisiana courts are open to the public, so a support person can usually sit in the courtroom with you.",
      citation: { label: "La. Const. art. I, § 22", verified: true },
    },
    noPrivilege: {
      text:
        "What you tell a non-lawyer helper is not protected like what you tell a lawyer. They can be asked about it. " +
        "If you have a lawyer, ask before bringing a helper into a private meeting, because it can lose that protection.",
      citation: toVerify("La. Code Evid. art. 506"),
    },
    accommodation: {
      text:
        "If you have a disability, you can ask the court for an accommodation, which can include having a support " +
        "person next to you. Ask the court's ADA coordinator or the clerk well before your court date.",
      citation: { label: "42 U.S.C. § 12132 (ADA Title II)", verified: true },
    },
    interpreter: {
      text: "If you don't speak or understand English well, ask the clerk for a court interpreter. Don't rely on a friend to interpret.",
      citation: toVerify("La. Code Civ. Proc. art. 192.2"),
    },
  },
  options: [
    {
      id: "companion",
      name: "Court companion",
      who: "A trusted friend, family member, church or community volunteer, or someone you pay by the hour to go with you.",
      cost: "Free, or an hourly rate you agree on.",
      canDo: [
        "Drive you there, find the courtroom and help you get through security",
        "Sit with you in the courtroom and the hallway while you wait",
        "Take notes on what the judge says and the next date",
        "Hold your papers and hand you the right one",
        "Help you stay calm and remember your questions",
      ],
      cannot: [
        "Tell you what to file or what to say to the judge",
        "Stand up and speak for you",
        "Sit at your table unless the judge allows it",
      ],
    },
    {
      id: "victim-advocate",
      name: "Domestic violence or victim advocate",
      who: "Trained staff from a family violence program or the district attorney's victim assistance office.",
      cost: "Free.",
      canDo: [
        "Go with you to a protective order hearing",
        "Help you fill out the court's petition form",
        "Make a safety plan for the day, including waiting areas away from the other person",
        "Connect you to shelter, counseling and legal aid",
      ],
      cannot: ["Give you legal advice or argue your case"],
      citation: toVerify("La. R.S. 46:2131 et seq. (Protection from Family Violence Act)"),
    },
    {
      id: "self-help",
      name: "Court self-help center or navigator",
      who: "Staff at a courthouse self-help desk, law library or legal aid clinic.",
      cost: "Free.",
      canDo: [
        "Explain court procedures and what a hearing will look like",
        "Give you the right official forms and show you where to file",
        "Point you to legal aid and lawyer referral",
      ],
      cannot: ["Tell you which choice is best for your case"],
    },
    {
      id: "limited-scope-lawyer",
      name: "Lawyer for one hearing",
      who: "A licensed lawyer you hire for only part of your case, such as one court date, instead of the whole thing.",
      cost: "A flat fee or a few hours of the lawyer's rate. Free or reduced-fee if you qualify for legal aid.",
      canDo: [
        "Give you legal advice",
        "Speak for you in court at that hearing",
        "Review the papers you wrote before you file them",
      ],
      cannot: ["Handle anything outside what you both agreed to in writing"],
      citation: { label: "La. Rules of Prof. Conduct R. 1.2(c)", verified: true },
    },
  ],
  resources: [
    { name: "Louisiana Law Help", what: "Free legal aid, self-help guides and clinics by parish.", url: "https://louisianalawhelp.org" },
    { name: "Louisiana State Bar Association", what: "Lawyer referral and free legal help programs.", url: "https://www.lsba.org/public/" },
    { name: "Louisiana 211", what: "Rides, childcare and community volunteers. Dial 211.", url: "https://www.louisiana211.org" },
    { name: "National Domestic Violence Hotline", what: "Connects you to a local advocate. Call 1-800-799-7233.", url: "https://www.thehotline.org" },
  ],
};
