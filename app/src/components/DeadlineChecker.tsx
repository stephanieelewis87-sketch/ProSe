"use client";

import { useMemo, useState } from "react";
import { valueClaim } from "@/lib/legal/damages";
import { toIso } from "@/lib/legal/dates";
import { louisianaCarAccident as pack } from "@/lib/legal/packs/louisiana-car-accident";
import { filingDeadline } from "@/lib/legal/prescription";
import { Cite, longDate } from "./Cite";

export function DeadlineChecker() {
  const [crashDate, setCrashDate] = useState("2026-03-14");
  const [insured, setInsured] = useState(true);
  const [fault, setFault] = useState(0);
  const today = toIso(new Date());

  const result = useMemo(() => {
    try {
      const deadline = filingDeadline(pack, crashDate, today);
      const claim = valueClaim(pack, {
        crashDate, items: [{ kind: "medical", description: "", amount: 1000 }], injured: true,
        painMultiplier: 0, claimantInsured: insured, claimantFaultPercent: fault,
      });
      return { deadline, claim };
    } catch {
      return null;
    }
  }, [crashDate, insured, fault, today]);

  const input = "rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-neutral-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Date of the crash
          <input id="crashDate" type="date" className={input} value={crashDate} onChange={(e) => setCrashDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Did you have insurance?
          <select id="insured" className={input} value={insured ? "yes" : "no"} onChange={(e) => setInsured(e.target.value === "yes")}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Your share of fault (%)
          <input id="fault" type="number" min={0} max={100} step={5} className={input} value={fault}
            onChange={(e) => setFault(Number(e.target.value))} />
        </label>
      </div>

      {!result ? (
        <p className="text-sm text-neutral-500">Enter a valid date to see your deadline.</p>
      ) : (
        <>
          <div className={`flex flex-col gap-1 rounded-lg p-4 ${result.deadline.daysLeft < 0 ? "bg-red-50 dark:bg-red-950"
            : result.deadline.daysLeft <= 180 ? "bg-amber-50 dark:bg-amber-950" : "bg-emerald-50 dark:bg-emerald-950"}`}>
            <span className="text-sm">Last day to file suit ({pack.terms.limitationsPeriod})</span>
            <span className="text-2xl font-extrabold">{longDate(result.deadline.lastDay)}</span>
            <span className="text-sm">
              {result.deadline.daysLeft >= 0 ? `${result.deadline.daysLeft} days from today.` : "This date has passed."}{" "}
              {result.deadline.years} year{result.deadline.years > 1 ? "s" : ""} from the crash.
              {result.deadline.rolledOver.length > 0 && " Moved past a weekend."}
            </span>
            <div className="flex flex-wrap gap-3 pt-1">{result.deadline.citations.map((c) => <Cite key={c.label} c={c} />)}</div>
          </div>

          <div className="rounded-lg bg-amber-50 p-4 text-sm dark:bg-amber-950">
            <strong>Talking to the insurer does not stop this clock.</strong> Only filing suit in the right court does.{" "}
            <Cite c={pack.interruption} />
          </div>

          {result.claim.barredByFault && (
            <div className="rounded-lg bg-red-50 p-4 text-sm dark:bg-red-950">
              <strong>At {fault}% fault, Louisiana bars recovery for this crash.</strong> Fault is decided on the evidence, so
              gather the police report, photos and witnesses first. <Cite c={result.claim.citations.at(-1)!} />
            </div>
          )}
          {!result.claim.barredByFault && fault > 0 && (
            <div className="rounded-lg bg-amber-50 p-4 text-sm dark:bg-amber-950">
              Your recovery drops by your {fault}% share of fault. <Cite c={result.claim.citations.at(-1)!} />
            </div>
          )}
          {!insured && (
            <div className="rounded-lg bg-amber-50 p-4 text-sm dark:bg-amber-950">
              <strong>&quot;No pay, no play&quot; applies.</strong> As an uninsured driver you can&apos;t recover the first part of
              your injury and property damages. <Cite c={result.claim.citations[0]} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
