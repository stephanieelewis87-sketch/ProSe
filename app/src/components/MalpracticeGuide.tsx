"use client";

import { useMemo, useState } from "react";
import { toIso } from "@/lib/legal/dates";
import { capRecovery, malpracticeDeadline, panelRequestLetter, panelTimeline } from "@/lib/legal/malpractice";
import { louisianaMedicalMalpractice as pack } from "@/lib/legal/packs/louisiana-medical-malpractice";
import { Box } from "./Box";
import { Cite, longDate } from "./Cite";

const input = "rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900";
const label = "flex flex-col gap-1.5 text-sm font-semibold";
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const steps = [
  "Your deadline",
  "Is the provider covered?",
  "Get your records",
  "Request the panel",
  "Fee and panel dates",
  "Court during the panel",
  "Find your expert",
  "What you can recover",
] as const;

type Coverage = "yes" | "no" | "unknown";

function PauperBox() {
  return (
    <Box tone="ok">
      <strong>Low or no income? Ask for pauper status (in forma pauperis).</strong>
      <span>A judge&apos;s order lets you go forward without paying costs up front. It covers the panel fee, your
        share of the panel&apos;s costs, and court costs.</span>
      {pack.pauper.sections.map((sec) => (
        <div key={sec.heading} className="flex flex-col gap-1 pt-1">
          <strong>{sec.heading}</strong>
          <ul className="list-disc pl-5">{sec.items.map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}</ul>
        </div>
      ))}
      <strong className="pt-1">How to apply</strong>
      <ol className="list-decimal pl-5">{pack.pauper.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      <a className="self-start font-semibold underline" href="/medical-malpractice/case-file?doc=pauper">
        Make your pauper application in the case file
      </a>
    </Box>
  );
}

export function MalpracticeGuide() {
  const today = toIso(new Date());
  const [step, setStep] = useState(0);

  const [actDate, setActDate] = useState("2026-03-10");
  const [discoveryDate, setDiscoveryDate] = useState("");
  const [panelFiled, setPanelFiled] = useState("");
  const [panelNotice, setPanelNotice] = useState("");
  const [coverage, setCoverage] = useState<Coverage>("unknown");

  const [patient, setPatient] = useState("");
  const [claimants, setClaimants] = useState("");
  const [providers, setProviders] = useState([{ name: "", whatHappened: "" }]);
  const [dates, setDates] = useState("");
  const [injuries, setInjuries] = useState("");
  const [sender, setSender] = useState({ name: "", address: "", phone: "", email: "" });
  const [copied, setCopied] = useState(false);

  const [confirmation, setConfirmation] = useState("");
  const [certified, setCertified] = useState("");
  const [panelSelected, setPanelSelected] = useState("");

  const [damages, setDamages] = useState(750000);
  const [futureMedical, setFutureMedical] = useState(0);
  const [providerCount, setProviderCount] = useState(1);

  const deadline = useMemo(() => {
    try {
      return malpracticeDeadline(pack, {
        actDate, today,
        discoveryDate: discoveryDate || undefined,
        panelFiledDate: panelFiled || undefined,
        panelNoticeDate: (panelFiled && panelNotice) || undefined,
      });
    } catch {
      return null;
    }
  }, [actDate, discoveryDate, panelFiled, panelNotice, today]);

  const letter = panelRequestLetter(pack, {
    patient, claimants: claimants.split(","), providers, dates, injuries, sender, today: longDate(today),
  });
  const timeline = panelFiled
    ? panelTimeline(pack, {
      filed: panelFiled,
      confirmationReceived: confirmation || undefined,
      certified: certified || undefined,
      panelSelected: panelSelected || undefined,
    })
    : null;
  const cap = capRecovery(pack, {
    damages, futureMedical, qualified: coverage !== "no", qualifiedProviders: providerCount,
  });

  const p = pack.panel;

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Steps" className="flex flex-wrap gap-2">
        {steps.map((s, i) => (
          <button key={s} type="button" onClick={() => setStep(i)}
            aria-current={i === step ? "step" : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${i === step
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-neutral-300 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"}`}>
            {i + 1}. {s}
          </button>
        ))}
      </nav>

      <section className="flex flex-col gap-5 rounded-xl border border-neutral-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="text-xl font-extrabold">{step + 1}. {steps[step]}</h2>

        {step === 0 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              In Louisiana you have one year from the malpractice, or from when you found out about it. Even if you found
              out late, the outer limit is three years from the malpractice. Filing a panel request stops the clock.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Date of the treatment that went wrong
                <input type="date" className={input} value={actDate} onChange={(e) => setActDate(e.target.value)} />
              </label>
              <label className={label}>
                Date you found out (if later)
                <input type="date" className={input} value={discoveryDate} onChange={(e) => setDiscoveryDate(e.target.value)} />
              </label>
              <label className={label}>
                Date you filed a panel request (if you have)
                <input type="date" className={input} value={panelFiled} onChange={(e) => setPanelFiled(e.target.value)} />
              </label>
              {panelFiled && (
                <label className={label}>
                  Date the panel&apos;s opinion arrived by certified mail
                  <input type="date" className={input} value={panelNotice} onChange={(e) => setPanelNotice(e.target.value)} />
                </label>
              )}
            </div>

            {!deadline ? (
              <p className="text-sm text-neutral-500">Check the dates. The date you found out can&apos;t be before the treatment.</p>
            ) : (
              <>
                {deadline.status === "open" && (
                  <Box tone={deadline.daysLeft! <= 90 ? "warn" : "ok"}>
                    <span>Last day to file your panel request</span>
                    <span className="text-2xl font-extrabold">{longDate(deadline.lastDayToFilePanel)}</span>
                    <span>
                      {deadline.daysLeft} days from today.
                      {deadline.cappedByOuterLimit && " The three-year outer limit sets this date."}
                      {deadline.fromDiscovery && !deadline.cappedByOuterLimit && " Counted from when you found out."}
                    </span>
                    <span>
                      Don&apos;t wait for this date. Mail it certified as soon as the request is ready; the mailing date
                      counts as the filing date.
                    </span>
                  </Box>
                )}
                {deadline.status === "passed" && (
                  <Box tone="bad">
                    <strong>The deadline was {longDate(deadline.lastDayToSue ?? deadline.lastDayToFilePanel)}.</strong>
                    <span>
                      If you found out later than the date you entered, put that date in. Courts look at when you knew,
                      or reasonably should have known, that something was wrong. The three-year outer limit can&apos;t
                      be extended that way.
                    </span>
                  </Box>
                )}
                {deadline.status === "filedLate" && (
                  <Box tone="bad">
                    <strong>That request was filed after {longDate(deadline.lastDayToFilePanel)}.</strong>
                    <span>A late request doesn&apos;t stop the clock. Check the discovery date above.</span>
                  </Box>
                )}
                {deadline.status === "suspended" && (
                  <Box tone="ok">
                    <strong>Your clock is stopped while the panel works.</strong>
                    <span>
                      You had {deadline.daysLeftAtFiling} days left when you filed. They start running again{" "}
                      {p.suspensionEndsDaysAfterNotice} days after the opinion arrives by certified mail. This only holds
                      if you paid the fee or filed a waiver within {p.feeDueDays} days.
                    </span>
                  </Box>
                )}
                {deadline.status === "resumed" && (
                  <Box tone={deadline.daysLeft! <= 60 ? "warn" : "ok"}>
                    <span>Last day to file suit in district court</span>
                    <span className="text-2xl font-extrabold">{longDate(deadline.lastDayToSue!)}</span>
                    <span>
                      {deadline.daysLeft} days from today. The clock restarted on {longDate(deadline.suspensionEnds!)}
                      {deadline.daysLeftAtFiling ? ` with the ${deadline.daysLeftAtFiling} days you had left.` : "."}
                    </span>
                  </Box>
                )}
                <div className="flex flex-wrap gap-3">{deadline.citations.map((c) => <Cite key={c.label} c={c} />)}</div>
              </>
            )}
            <Box tone="warn">
              <span>
                <strong>Talking to the hospital, a complaint to the medical board, or an insurer&apos;s claim number does
                not stop this clock.</strong> Only a panel request filed with the Division of Administration does.
                Filing it with any other agency doesn&apos;t count.
              </span>
              <Cite c={p.suspensionCitation} />
            </Box>
            <Box tone="plain">
              <span>
                <strong>Can&apos;t afford the costs?</strong> With low or no income you can ask a judge for pauper
                status (in forma pauperis). It covers the panel fee, your share of panel costs and court costs. Step 5
                explains it, and the case file makes the application.
              </span>
              <Cite c={pack.pauper.sections[0].items[0].citation} />
            </Box>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Most Louisiana doctors and hospitals are enrolled with the Patient&apos;s Compensation Fund. For them you
              must go through a medical review panel before you can sue, and the damages cap applies.
            </p>
            <label className={label}>
              Is the provider enrolled with the Fund?
              <select className={input} value={coverage} onChange={(e) => setCoverage(e.target.value as Coverage)}>
                <option value="unknown">I don&apos;t know yet</option>
                <option value="yes">Yes, it&apos;s enrolled</option>
                <option value="no">No, it isn&apos;t enrolled</option>
              </select>
            </label>
            {coverage === "unknown" && (
              <Box tone="plain">
                <span>
                  Call the Patient&apos;s Compensation Fund at {pack.qualification.phone}. {pack.qualification.text} If you
                  aren&apos;t sure, file the panel request anyway: it stops the clock for every provider involved, enrolled
                  or not.
                </span>
                <span className="flex flex-wrap gap-3">
                  <Cite c={pack.qualification.citation} />
                  <Cite c={{ label: "La. R.S. 40:1231.8(A)(2)(a)", url: p.required.url, verified: true }} />
                </span>
              </Box>
            )}
            {coverage === "yes" && (
              <Box tone="ok">
                <span>You need a panel opinion before you can file suit. Go on to get your records and write the request.</span>
                <Cite c={p.required} />
              </Box>
            )}
            {coverage === "no" && (
              <Box tone="warn">
                <span>
                  No panel is needed and there&apos;s no damages cap. You file suit directly in district court, still
                  within the one-year and three-year limits.
                </span>
                <span className="flex flex-wrap gap-3">
                  <Cite c={pack.cap.notes[0].citation} />
                  <Cite c={{ ...pack.prescription.citation, label: "La. R.S. 9:5628(C)" }} />
                </span>
              </Box>
            )}
            <Box tone="plain">
              <span>{pack.cap.notes[3].text}</span>
              <Cite c={pack.cap.notes[3].citation} />
            </Box>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Your records are the case. The panel decides on paper, and any expert will start by reading them.
            </p>
            <Box tone="plain">
              <span>{pack.records.text}</span>
              <Cite c={pack.records.citation} />
            </Box>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
              <li>Ask every provider involved, and the ones who treated you afterward, for the complete chart: notes,
                orders, nursing notes, medication records, imaging and lab results.</li>
              <li>Ask for imaging on a disc, not just the radiologist&apos;s report.</li>
              <li>Write a dated timeline: each visit, what you were told, what was done, and when you realized something
                was wrong. That date matters for your deadline.</li>
              <li>Keep every bill, receipt and pay stub. You&apos;ll need them for what you can recover.</li>
            </ol>
            <Box tone="warn">
              <span>Don&apos;t wait for the records to file the panel request. The request only needs a short description;
                you send the evidence later.</span>
            </Box>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              There is no official form. A letter with these items is enough. Fill in what you know; anything left blank
              shows in [brackets].
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Patient&apos;s full name
                <input className={input} value={patient} onChange={(e) => setPatient(e.target.value)} />
              </label>
              <label className={label}>
                Everyone making the claim (commas between names)
                <input className={input} value={claimants} onChange={(e) => setClaimants(e.target.value)} />
              </label>
            </div>
            {providers.map((pr, i) => (
              <div key={i} className="grid gap-4 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 sm:grid-cols-2">
                <label className={label}>
                  Provider {i + 1}: full name
                  <input className={input} placeholder="Dr. ..., or the hospital's legal name" value={pr.name}
                    onChange={(e) => setProviders(providers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                </label>
                <label className={label}>
                  What they did or failed to do
                  <input className={input} value={pr.whatHappened}
                    onChange={(e) => setProviders(providers.map((x, j) => (j === i ? { ...x, whatHappened: e.target.value } : x)))} />
                </label>
                {providers.length > 1 && (
                  <button type="button" className="justify-self-start text-xs underline"
                    onClick={() => setProviders(providers.filter((_, j) => j !== i))}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" className="self-start rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
              onClick={() => setProviders([...providers, { name: "", whatHappened: "" }])}>
              Add another provider
            </button>
            <Box tone="plain">
              <span>Name every doctor, nurse, hospital and clinic that may share the blame. A provider you leave out of
                the panel may be hard to add later.</span>
            </Box>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Dates of the malpractice
                <input className={input} placeholder="e.g. March 10 to 12, 2026" value={dates} onChange={(e) => setDates(e.target.value)} />
              </label>
              <label className={label}>
                The injuries
                <input className={input} value={injuries} onChange={(e) => setInjuries(e.target.value)} />
              </label>
              {(["name", "address", "phone", "email"] as const).map((k) => (
                <label key={k} className={label}>
                  Your {k}
                  <input className={input} value={sender[k]} onChange={(e) => setSender({ ...sender, [k]: e.target.value })} />
                </label>
              ))}
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-neutral-100 p-4 font-mono text-xs dark:bg-neutral-800">{letter}</pre>
            <button type="button" className="self-start rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => { navigator.clipboard?.writeText(letter).then(() => setCopied(true), () => {}); }}>
              {copied ? "Copied" : "Copy the letter"}
            </button>
            <div className="flex flex-wrap gap-3"><Cite c={p.contentsCitation} /></div>
            <Box tone="ok">
              <strong>Where to send it</strong>
              <span>Certified mail, return receipt (best, the mailing date counts): {p.filedWith.name}, {p.filedWith.mail}</span>
              <span>Hand delivery: {p.filedWith.handDelivery}</span>
              <span>Fax: {p.filedWith.fax}. Faxes after 5 p.m. count as the next business day. Call {p.filedWith.phone} to
                confirm it arrived.</span>
              <span>Not the Patient&apos;s Compensation Fund: it can&apos;t accept panel requests. Keep a copy and the
                mailing receipt.</span>
              <Cite c={{ label: "Division of Administration filing instructions", url: p.filedWith.url, verified: true }} />
            </Box>
          </>
        )}

        {step === 4 && (
          <>
            {!panelFiled ? (
              <Box tone="plain">
                <span>Enter the date you filed your panel request in step 1 to see your dates here.</span>
              </Box>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className={label}>
                    Confirmation letter arrived
                    <input type="date" className={input} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
                  </label>
                  <label className={label}>
                    Board&apos;s certification date
                    <input type="date" className={input} value={certified} onChange={(e) => setCertified(e.target.value)} />
                  </label>
                  <label className={label}>
                    Panel complete on
                    <input type="date" className={input} value={panelSelected} onChange={(e) => setPanelSelected(e.target.value)} />
                  </label>
                </div>
                <ol className="flex flex-col gap-3">
                  {timeline!.map((s) => (
                    <li key={s.label} className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                      <strong>{s.label}</strong>
                      <span>{s.due ? `By ${longDate(s.due)}` : `Due date set by ${s.waitsOn}`}</span>
                      <Cite c={s.citation} />
                    </li>
                  ))}
                </ol>
              </>
            )}
            <Box tone="warn">
              <strong>Miss the fee and the request is void, and your clock never stopped.</strong>
              <span>
                ${p.feePerQualifiedDefendant} for each qualified provider within {p.feeDueDays} days of receiving the
                board&apos;s confirmation. Instead of paying you can file one of these:
              </span>
              <ul className="list-disc pl-5">{p.feeWaivers.map((w) => <li key={w.text}>{w.text} <Cite c={w.citation} /></li>)}</ul>
              <Cite c={p.feeCitation} />
            </Box>
            <PauperBox />
            <Box tone="plain">
              <strong>How the panel works</strong>
              <span>
                Three doctors and a lawyer who chairs without a vote. You pick one doctor, the provider picks one, and
                those two pick the third. Pick a doctor in the same specialty as the provider you&apos;re naming. The
                panel decides on written evidence, then gives an opinion within {p.opinionDays} days. If there&apos;s
                no opinion {p.opinionDeadlineMonths} months after the chairman is chosen, you may file suit.
              </span>
              <span>It can find:</span>
              <ul className="list-disc pl-5">{p.findings.map((f) => <li key={f}>{f}</li>)}</ul>
              <Cite c={p.selectionCitation} />
            </Box>
            <Box tone="plain">
              <strong>What it costs</strong>
              <ul className="list-disc pl-5">{p.costs.map((c) => <li key={c.text}>{c.text} <Cite c={c.citation} /></li>)}</ul>
              <span>Every side can agree in writing to skip the panel and go straight to court.</span>
              <Cite c={p.waiverByAgreement} />
            </Box>
          </>
        )}

        {step === 5 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              The panel isn&apos;t a court, but you can still end up in one while it&apos;s working. Expect this, so
              papers from a district court don&apos;t catch you off guard.
            </p>
            <Box tone="warn">
              <strong>Exception hearings</strong>
              <ul className="list-disc pl-5">
                {p.courtDuringPanel.exceptions.map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}
              </ul>
            </Box>
            <Box tone="plain">
              <strong>If you get an exception</strong>
              <ol className="list-decimal pl-5">
                <li>Write down the hearing date and the deadline for your written opposition.</li>
                <li>Find what it says is wrong. For prescription it&apos;s almost always about dates.</li>
                <li>Answer with proof: the date you found out and how (step 1), the date you mailed the panel request
                  and its certified-mail receipt, and the fee receipt or waiver.</li>
                <li>Go to the hearing. If you don&apos;t, the court can grant the exception without hearing you.</li>
              </ol>
            </Box>
            <Box tone="plain">
              <strong>Discovery</strong>
              <ul className="list-disc pl-5">
                {p.courtDuringPanel.discovery.map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}
              </ul>
              <span>Answer discovery on time and truthfully, and keep a copy of everything you send.</span>
            </Box>
            <Box tone="plain">
              <strong>Other times you can go to court</strong>
              <ul className="list-disc pl-5">
                {p.courtDuringPanel.other.map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}
              </ul>
            </Box>
          </>
        )}

        {step === 6 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              To win you have to prove three things, and in most cases a doctor has to say them.
            </p>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
              {pack.proof.elements.map((e) => <li key={e}>{e}</li>)}
            </ol>
            <Cite c={pack.proof.citation} />
            <Box tone="ok">
              <strong>The panel can be your first expert.</strong>
              <span>{p.opinionUse.text}</span>
              <Cite c={p.opinionUse.citation} />
            </Box>
            <Box tone="plain">
              <strong>Your expert must be:</strong>
              <ul className="list-disc pl-5">{pack.expert.qualifications.map((q) => <li key={q}>{q}</li>)}</ul>
              <Cite c={pack.expert.citation} />
            </Box>
            <div className="flex flex-col gap-2 text-sm">
              <strong>Where to look</strong>
              <ol className="flex list-decimal flex-col gap-2 pl-5">
                <li><strong>The doctor who treated you afterward.</strong> They&apos;ve seen the harm and often already
                  have an opinion. Ask whether they&apos;d review the records or sign the fee-waiver affidavit.</li>
                <li><strong>Medical school faculty.</strong> Teaching counts as practicing, so professors at teaching
                  hospitals qualify.</li>
                <li><strong>Doctors outside Louisiana.</strong> Any U.S. license works, and out-of-state doctors are often
                  more willing to review a Louisiana case.</li>
                <li><strong>Retired or part-time doctors</strong> who practiced when your claim arose.</li>
                <li><strong>Expert witness directories</strong>, searchable by specialty. Ask for the review fee in writing
                  before sending anything.</li>
              </ol>
            </div>
            <Box tone="plain">
              <strong>Ask the right question</strong>
              <span>
                Send a one-page timeline, the records, and one question: &quot;Did the care on these dates meet the
                standard of care for this specialty, and if not, did that cause the injury?&quot; A short, specific
                review costs less than an open-ended one.
              </span>
            </Box>
            <ul className="flex flex-col gap-2 text-sm">
              {pack.expert.notes.map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}
            </ul>
            <Box tone="ok">
              <strong>When the mistake is obvious, you may not need an expert.</strong>
              <span>{pack.proof.resIpsa.text}</span>
              <Cite c={pack.proof.resIpsa.citation} />
            </Box>
          </>
        )}

        {step === 7 && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className={label}>
                Damages except future medical
                <input type="number" min={0} step={1000} className={input} value={damages}
                  onChange={(e) => setDamages(Number(e.target.value))} />
              </label>
              <label className={label}>
                Future medical care
                <input type="number" min={0} step={1000} className={input} value={futureMedical}
                  onChange={(e) => setFutureMedical(Number(e.target.value))} />
              </label>
              <label className={label}>
                Enrolled providers at fault
                <input type="number" min={1} max={20} className={input} value={providerCount}
                  onChange={(e) => setProviderCount(Number(e.target.value))} />
              </label>
            </div>
            <Box tone={cap.lostToCap > 0 ? "warn" : "ok"}>
              <span>Most you can recover, before interest and costs</span>
              <span className="text-2xl font-extrabold">{money(cap.total)}</span>
              {cap.capApplies ? (
                <span>
                  {cap.lostToCap > 0 && `The cap removes ${money(cap.lostToCap)}. `}
                  The providers pay up to {money(cap.fromProviders)} and the Patient&apos;s Compensation Fund pays{" "}
                  {money(cap.fromFund)}{cap.futureMedical > 0 && ", including future medical care as it's needed"}.
                </span>
              ) : (
                <span>Step 2 says the provider isn&apos;t enrolled, so no cap applies.</span>
              )}
              <span className="flex flex-wrap gap-3">{cap.citations.map((c) => <Cite key={c.label} c={c} />)}</span>
            </Box>
            <ul className="flex flex-col gap-2 text-sm">
              {pack.cap.notes.slice(0, 3).map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}
            </ul>
          </>
        )}

        <div className="flex justify-between pt-2">
          <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-neutral-700">Back</button>
          <button type="button" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Next</button>
        </div>
      </section>
    </div>
  );
}
