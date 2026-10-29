"use client";

import { useMemo, useState } from "react";
import { toIso } from "@/lib/legal/dates";
import { childSupportShares, divorceTimeline, finalSupportCap, partitionDates } from "@/lib/legal/divorce";
import { louisianaDivorce as pack } from "@/lib/legal/packs/louisiana-divorce";
import type { DivorceGround } from "@/lib/legal/types";
import { Box } from "./Box";
import { Cite, longDate } from "./Cite";

const input = "rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900";
const label = "flex flex-col gap-1.5 text-sm font-semibold";
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => `${Math.round(n * 100)}%`;

const steps = [
  "Can you file here?",
  "Choose your path",
  "File and serve",
  "Children: custody",
  "Child support",
  "Spousal support",
  "Property and debts",
  "Get the judgment",
] as const;

export function DivorceGuide() {
  const today = toIso(new Date());
  const [step, setStep] = useState(0);

  const [covenant, setCovenant] = useState(false);
  const [monthsHere, setMonthsHere] = useState(12);

  const [path, setPath] = useState<"102" | "103">("102");
  const [ground, setGround] = useState<DivorceGround>("separated");
  const [separated, setSeparated] = useState("2026-06-01");
  const [served, setServed] = useState("");
  const [minorChildren, setMinorChildren] = useState(true);
  const [youngest, setYoungest] = useState("");

  const [yourIncome, setYourIncome] = useState(3000);
  const [otherIncome, setOtherIncome] = useState(5000);
  const [basic, setBasic] = useState(1000);
  const [childCare, setChildCare] = useState(0);
  const [health, setHealth] = useState(0);

  const [payerNet, setPayerNet] = useState(4500);
  const [abuse, setAbuse] = useState(false);

  const [motionServed, setMotionServed] = useState("");
  const [lastList, setLastList] = useState("");

  const timeline = useMemo(() => {
    try {
      return divorceTimeline(pack, {
        path, ground, separatedDate: separated, servedDate: (path === "102" && served) || undefined,
        minorChildren, youngestBirthDate: (minorChildren && youngest) || undefined, today,
      });
    } catch {
      return null;
    }
  }, [path, ground, separated, served, minorChildren, youngest, today]);

  const shares = childSupportShares({ yourIncome, otherIncome, basicObligation: basic, childCare, healthInsurance: health });
  const cap = finalSupportCap(pack, payerNet, abuse);
  const partition = motionServed ? partitionDates(pack, motionServed, lastList || undefined) : null;
  const g = pack.grounds.find((x) => x.id === ground)!;

  return (
    <div className="flex flex-col gap-5">
      <Box tone="warn">
        {pack.safety.map((n) => <span key={n.text}>{n.text} <Cite c={n.citation} /></span>)}
      </Box>

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
              You can file in Louisiana if you or your spouse lives here. You file in the parish court where one of you
              lives, or where you last lived together.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Months you (or your spouse) have lived in Louisiana
                <input type="number" min={0} className={input} value={monthsHere} onChange={(e) => setMonthsHere(Number(e.target.value))} />
              </label>
              <label className="flex items-center gap-2 self-end text-sm font-semibold">
                <input type="checkbox" checked={covenant} onChange={(e) => setCovenant(e.target.checked)} />
                We have a covenant marriage
              </label>
            </div>
            {monthsHere >= pack.filing.domicilePresumptionMonths ? (
              <Box tone="ok">
                <span>
                  After {pack.filing.domicilePresumptionMonths} months living in a Louisiana parish, the law presumes that
                  parish is your domicile. You can file.
                </span>
                <Cite c={{ label: "La. Code Civ. Proc. art. 10(B)", url: pack.filing.jurisdiction.citation.url, verified: true }} />
              </Box>
            ) : (
              <Box tone="warn">
                <span>
                  Under {pack.filing.domicilePresumptionMonths} months there&apos;s no presumption. You can still file if
                  Louisiana is truly your home (you moved here intending to stay), but be ready to prove it: a lease,
                  job, driver&apos;s license, voter registration.
                </span>
                <Cite c={{ label: "La. Code Civ. Proc. art. 10(B)", url: pack.filing.jurisdiction.citation.url, verified: true }} />
              </Box>
            )}
            {covenant && (
              <Box tone="bad">
                <strong>The rest of this guide is for standard marriages.</strong>
                <span>{pack.filing.covenant.text}</span>
                <Cite c={pack.filing.covenant.citation} />
              </Box>
            )}
            <ul className="flex flex-col gap-2 text-sm">
              {[pack.filing.jurisdiction, pack.filing.venue, pack.filing.fees].map((n) => (
                <li key={n.text}>{n.text} <Cite c={n.citation} /></li>
              ))}
              <li>
                Most parishes file divorces in the district court. East Baton Rouge has a separate family court, and
                Orleans files them in Civil District Court. Ask the clerk which court and division takes divorces.{" "}
                <Cite c={{ label: "Local court practice", verified: false }} />
              </li>
            </ul>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Louisiana has two no-fault paths. Under <strong>article 102</strong> you file now, serve your spouse,
              and once the waiting period has passed (and you&apos;ve lived apart that long) you file a rule asking for
              the divorce. Under <strong>article 103</strong> a ground already exists when you file, such as already
              having lived apart for the full period. The waiting period is {pack.periods.noMinorChildren} days, or{" "}
              {pack.periods.minorChildren} days if you have minor children together.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>
                Path
                <select className={input} value={path} onChange={(e) => setPath(e.target.value as "102" | "103")}>
                  <option value="102">Article 102: file now, divorce after the wait</option>
                  <option value="103">Article 103: a ground already exists</option>
                </select>
              </label>
              {path === "103" && (
                <label className={label}>
                  Ground
                  <select className={input} value={ground} onChange={(e) => setGround(e.target.value as DivorceGround)}>
                    {pack.grounds.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </select>
                </label>
              )}
              <label className={label}>
                Date you started living separate and apart
                <input type="date" className={input} value={separated} onChange={(e) => setSeparated(e.target.value)} />
              </label>
              {path === "102" && (
                <label className={label}>
                  Date your spouse was served or signed a waiver (if done)
                  <input type="date" className={input} value={served} onChange={(e) => setServed(e.target.value)} />
                </label>
              )}
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={minorChildren} onChange={(e) => setMinorChildren(e.target.checked)} />
                We have children together under 18
              </label>
              {minorChildren && (
                <label className={label}>
                  Youngest child&apos;s birth date (optional)
                  <input type="date" className={input} value={youngest} onChange={(e) => setYoungest(e.target.value)} />
                </label>
              )}
            </div>
            {path === "103" && <p className="text-sm">{g.plain}</p>}

            {!timeline ? (
              <p className="text-sm text-neutral-500">Enter the date you separated.</p>
            ) : (
              <>
                {timeline.status === "ready" && timeline.periodDays === 0 && (
                  <Box tone="ok">
                    <strong>No waiting period for this ground.</strong>
                    <span>You can file the petition now. You&apos;ll have to prove the ground, so gather police reports, orders, photos and witnesses.</span>
                  </Box>
                )}
                {timeline.status === "ready" && timeline.periodDays > 0 && (
                  <Box tone="ok">
                    <span>{path === "102" ? "You can file the rule to show cause now" : "You can file the petition now"}</span>
                    <span>The {timeline.periodDays}-day period was met on {longDate(timeline.earliest)}.</span>
                    {timeline.abandonedAfter && (
                      <span>File the rule by {longDate(timeline.abandonedAfter)}, or the case is abandoned and you start over.</span>
                    )}
                  </Box>
                )}
                {(timeline.status === "wait" || timeline.status === "needService") && (
                  <Box tone="plain">
                    <span>{path === "102" ? "Earliest day to file the rule to show cause" : "Earliest day to file the petition"}</span>
                    <span className="text-2xl font-extrabold">{longDate(timeline.earliest)}</span>
                    <span>
                      {timeline.daysLeft} days from today, counting {timeline.periodDays} full days
                      {timeline.status === "needService"
                        ? " of separation. The same days must also pass after your spouse is served, so file and serve soon."
                        : timeline.waitingOn === "service" ? " after service." : " of living apart."}
                    </span>
                    {path === "103" && <span>You don&apos;t have to wait: you can file under article 102 now and the time runs while the case is open.</span>}
                  </Box>
                )}
                {timeline.status === "abandoned" && (
                  <Box tone="bad">
                    <strong>The rule had to be filed by {longDate(timeline.abandonedAfter!)}.</strong>
                    <span>The case was abandoned without any order. File a new petition.</span>
                  </Box>
                )}
                <div className="flex flex-wrap gap-3">{timeline.citations.map((c) => <Cite key={c.label} c={c} />)}</div>
              </>
            )}
            <Box tone="warn">
              <span>
                <strong>Living &quot;separate and apart&quot; means not living together as spouses.</strong> Moving back in
                together, even briefly, can restart the clock. Courts look at the facts, so keep proof of when you moved
                out.
              </span>
              <Cite c={{ label: "Reconciliation case law", verified: false }} />
            </Box>
          </>
        )}

        {step === 2 && (
          <>
            <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm">
              <li>
                <strong>Write the petition.</strong> The <a className="underline" href="/divorce/case-file">case file</a> drafts
                it from your answers, under article 102 or 103, with any requests for custody, support and use of the home.
                Sign the verification in front of a notary.
              </li>
              <li>
                <strong>File it</strong> with the clerk of court in the right parish, with the filing fee or a request to
                proceed without paying costs. Write down the filing date: the community property ends on it.
              </li>
              <li>
                <strong>Serve your spouse.</strong> Either the sheriff serves them (you pay the sheriff&apos;s fee, and list
                their address on the petition), or, if they agree, they sign a waiver of citation and service in front
                of a notary. The case file has the waiver.
              </li>
              <li>
                <strong>Ask for what you need now.</strong> You can ask the court to decide these in the divorce case,
                before the divorce itself:
                <ul className="mt-1 list-disc pl-5">{pack.incidental.matters.map((m) => <li key={m}>{m}</li>)}</ul>
              </li>
            </ol>
            <div className="flex flex-wrap gap-3">
              <Cite c={pack.afterPetition.citation} /><Cite c={pack.incidental.citation} /><Cite c={pack.filing.fees.citation} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <ul className="flex flex-col gap-2 text-sm">
              <li>{pack.custody.agreement.text} <Cite c={pack.custody.agreement.citation} /></li>
              <li>{pack.custody.jointPresumption.text} <Cite c={pack.custody.jointPresumption.citation} /></li>
            </ul>
            <div className="flex flex-col gap-2 text-sm">
              <strong>What the court weighs</strong>
              <ol className="list-decimal pl-5">{pack.custody.factors.map((f) => <li key={f}>{f}</li>)}</ol>
              <Cite c={pack.custody.factorsCitation} />
            </div>
            <Box tone="warn">
              <strong>If there has been family violence</strong>
              {pack.custody.familyViolence.map((n) => <span key={n.text}>{n.text} <Cite c={n.citation} /></span>)}
            </Box>
            <ul className="flex flex-col gap-2 text-sm">
              {pack.custody.notes.map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}
            </ul>
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{pack.childSupport.presumption.text} <Cite c={pack.childSupport.presumption.citation} /></p>
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">{pack.childSupport.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <Cite c={pack.childSupport.stepsCitation} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Your monthly adjusted gross income
                <input type="number" min={0} step={100} className={input} value={yourIncome} onChange={(e) => setYourIncome(Number(e.target.value))} /></label>
              <label className={label}>Other parent&apos;s monthly adjusted gross income
                <input type="number" min={0} step={100} className={input} value={otherIncome} onChange={(e) => setOtherIncome(Number(e.target.value))} /></label>
              <label className={label}>Basic obligation from the state schedule (monthly)
                <input type="number" min={0} step={10} className={input} value={basic} onChange={(e) => setBasic(Number(e.target.value))} /></label>
              <label className={label}>Work-related child care (monthly)
                <input type="number" min={0} step={10} className={input} value={childCare} onChange={(e) => setChildCare(Number(e.target.value))} /></label>
              <label className={label}>Children&apos;s health insurance (monthly)
                <input type="number" min={0} step={10} className={input} value={health} onChange={(e) => setHealth(Number(e.target.value))} /></label>
            </div>
            <Box tone="plain">
              <span>Combined income {money(shares.combined)}: your share is {pct(shares.yourShare)}, the other parent&apos;s is {pct(shares.otherShare)}.</span>
              <span>Of the {money(shares.total)} a month total, your part is <strong>{money(shares.yourPortion)}</strong> and the other parent&apos;s is <strong>{money(shares.otherPortion)}</strong>.</span>
              <span>The parent the children mainly live with pays their part directly; the other parent pays theirs as support. This is an estimate: the court uses the full worksheet.</span>
            </Box>
            <ul className="flex flex-col gap-2 text-sm">
              {pack.childSupport.notes.map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}
            </ul>
          </>
        )}

        {step === 5 && (
          <>
            <div className="flex flex-col gap-2 text-sm">
              <strong>Interim support, while the divorce is pending</strong>
              {pack.spousalSupport.interim.map((n) => <span key={n.text}>{n.text} <Cite c={n.citation} /></span>)}
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <strong>Final support, after the divorce</strong>
              <span>{pack.spousalSupport.final.text} <Cite c={pack.spousalSupport.final.citation} /></span>
              <span>The court looks at:</span>
              <ul className="list-disc pl-5">{pack.spousalSupport.finalFactors.map((f) => <li key={f}>{f}</li>)}</ul>
              <span>{pack.spousalSupport.abusePresumption.text} <Cite c={pack.spousalSupport.abusePresumption.citation} /></span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Paying spouse&apos;s monthly net income
                <input type="number" min={0} step={100} className={input} value={payerNet} onChange={(e) => setPayerNet(Number(e.target.value))} /></label>
              <label className="flex items-center gap-2 self-end text-sm font-semibold">
                <input type="checkbox" checked={abuse} onChange={(e) => setAbuse(e.target.checked)} />
                Domestic abuse by the paying spouse
              </label>
            </div>
            <Box tone="plain">
              {cap === null ? (
                <span>With domestic abuse, final support isn&apos;t limited to one-third of net income and can be paid as a lump sum.</span>
              ) : (
                <>
                  <span>Most final periodic support can be</span>
                  <span className="text-2xl font-extrabold">{money(cap)} a month</span>
                  <span>One-third of the paying spouse&apos;s net income. The court sets the actual amount from need and ability to pay.</span>
                </>
              )}
              <Cite c={pack.spousalSupport.capCitation} />
            </Box>
          </>
        )}

        {step === 6 && (
          <>
            <Box tone="ok">
              <span>{pack.property.communityEnds.text}</span>
              <Cite c={pack.property.communityEnds.citation} />
            </Box>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              To divide property in court, either spouse files a motion to partition. Each of you then has{" "}
              {pack.property.listDays} days to file a sworn detailed descriptive list of everything the community owns
              and owes, with values, and {pack.property.traverseDays} days after the last list to dispute the other&apos;s.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Date the partition motion was served on you (or your spouse)
                <input type="date" className={input} value={motionServed} onChange={(e) => setMotionServed(e.target.value)} /></label>
              <label className={label}>Date the last list was served (if done)
                <input type="date" className={input} value={lastList} onChange={(e) => setLastList(e.target.value)} /></label>
            </div>
            {partition && (
              <Box tone="plain">
                <span>Your sworn detailed descriptive list is due <strong>{longDate(partition.listDue)}</strong>.</span>
                {partition.traverseDue && <span>Traverse or agree with the other list by <strong>{longDate(partition.traverseDue)}</strong>.</span>}
                <Cite c={pack.property.partitionCitation} />
              </Box>
            )}
            <ul className="flex flex-col gap-2 text-sm">
              {pack.property.notes.map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}
            </ul>
            <p className="text-sm">The <a className="underline" href="/divorce/case-file">case file</a> builds the descriptive list.</p>
          </>
        )}

        {step === 7 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Under article 103 the court grants the divorce after your spouse answers or the time to answer passes,
              by trial or default. Under article 102, once the wait is over, you file a rule to show cause. It must say:
            </p>
            <Cite c={{ label: "La. Code Civ. Proc. arts. 1701–1702 (default)", verified: false }} />
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">{pack.afterPetition.ruleRequirements.map((r) => <li key={r}>{r}</li>)}</ul>
            <Cite c={pack.afterPetition.ruleCitation} />
            <div className="flex flex-col gap-2 text-sm">
              <strong>What proves an article 102 divorce</strong>
              <ol className="list-decimal pl-5">{pack.afterPetition.evidence.map((e) => <li key={e}>{e}</li>)}</ol>
              <Cite c={pack.afterPetition.evidenceCitation} />
            </div>
            <Box tone="plain">
              <span>{pack.afterPetition.withoutHearing.text}</span>
              <Cite c={pack.afterPetition.withoutHearing.citation} />
            </Box>
            <Box tone="warn">
              <span>
                File the rule within {pack.afterPetition.abandonmentYears} years of service or the waiver. After that the
                case is abandoned automatically and you have to start over.
              </span>
              <Cite c={pack.afterPetition.abandonmentCitation} />
            </Box>
            <p className="text-sm">
              The <a className="underline" href="/divorce/case-file">case file</a> has the rule, your affidavit and a
              proposed judgment.
            </p>
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
