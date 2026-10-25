# ProSe

Self-help software for people handling civil cases without a lawyer. It gives people specific next steps, exact deadlines and court-ready documents, with the source for every rule, instead of "contact a legal professional."

## First focus

- **Case type:** car accident claims (the injured person's insurance claim, then small claims or district court)
- **State:** Louisiana
- **Platform:** web app first

## What's here

- `prototype/index.html` is a clickable, single-file prototype. It covers crash intake, the prescription deadline (La. Civ. Code art. 3493.1), the damages tracker, the demand letter and choosing a court. Open it in a browser to try it.

- `app/` is the real web app (Next.js, TypeScript, Tailwind).
  - `app/src/lib/legal/` holds the legal logic: the Louisiana car accident rules pack (every rule cited and marked checked or to verify), the filing deadline calculator and the claim value calculator.
  - Run it: `cd app && npm install && npm run dev`, then open http://localhost:3000.
  - Test it: `cd app && npm test`.

## Next

Port the full prototype flow into the app (intake, damages, demand letter, court choice), add Louisiana court holidays to the deadline calculator, then accounts and reminders.

Rules marked "To verify" in the prototype still need to be checked against the official Louisiana text.
