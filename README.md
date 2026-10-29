# ProSe

Self-help software for people handling civil cases without a lawyer. It gives people specific next steps, exact deadlines and court-ready documents, with the source for every rule, instead of "contact a legal professional."

## First focus

- **Case types:** car accident claims (the injured person's insurance claim, then small claims or district court), medical malpractice (the medical review panel, then district court), and divorce (with custody, support and property)
- **State:** Louisiana
- **Platform:** web app first

## What's here

- `prototype/index.html` is a clickable, single-file prototype. It covers crash intake, the prescription deadline (La. Civ. Code art. 3493.1), the damages tracker, the demand letter and choosing a court. Open it in a browser to try it.

- `app/` is the real web app (Next.js, TypeScript, Tailwind).
  - `app/src/lib/legal/` holds the legal logic: the Louisiana car accident rules pack (every rule cited and marked checked or to verify), the filing deadline calculator and the claim value calculator.
  - `/medical-malpractice` walks a patient through a Louisiana malpractice claim: the 1-year/3-year deadline (R.S. 9:5628) and how a panel request stops it, checking whether the provider is enrolled with the Patient's Compensation Fund, getting records, a panel request letter with every item R.S. 40:1231.8 requires, the fee and panel dates, finding a qualified expert (R.S. 9:2794), and the $500,000 cap (R.S. 40:1231.2).
  - `/medical-malpractice/case-file` is the person's case file: case facts entered once, medical records uploaded and kept only in the browser (IndexedDB, with a .zip backup), responses to papers they're served (oppositions to exceptions of prescription and no right of action, sworn discovery answers, guidance for depositions, subpoenas and prematurity) and court-ready documents (a pauper application with both affidavits and an order for people with low or no income, records request, subpoena request, petition to compel, motion to extend) to print or save as PDF.
  - `/divorce` walks a spouse through a Louisiana divorce: filing here and the right parish (Code Civ. Proc. arts. 10, 3941), the article 102 and 103 paths with a calculator for the 180/365-day waiting periods (Civ. Code art. 103.1) and the 2-year abandonment rule (art. 3954), custody (arts. 132, 134, R.S. 9:364), a child support share estimate (R.S. 9:315.2), the one-third cap on final spousal support (art. 112), and partition deadlines (R.S. 9:2801).
  - `/divorce/case-file` drafts the divorce papers from facts entered once: the petition (102 or 103, with requests for custody, support and the home), a waiver of service, the rule to show cause, the art. 3956 affidavit, a proposed judgment and the sworn detailed descriptive list.
  - Run it: `cd app && npm install && npm run dev`, then open http://localhost:3000.
  - Test it: `cd app && npm test`.

## Next

Port the full prototype flow into the app (intake, damages, demand letter, court choice), add Louisiana court holidays to the deadline calculator, then accounts and reminders.

Rules marked "To verify" in the prototype still need to be checked against the official Louisiana text.
