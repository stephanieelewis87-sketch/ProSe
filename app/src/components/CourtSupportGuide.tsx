"use client";

import { useState } from "react";
import { toIso } from "@/lib/legal/dates";
import { supportAgreement, supportRequest, supportTasks, type SupportTask } from "@/lib/legal/court-support";
import { louisianaCourtSupport as pack } from "@/lib/legal/packs/louisiana-court-support";
import { Cite, longDate } from "./Cite";

const input = "rounded-lg border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900";
const label = "flex flex-col gap-1.5 text-sm font-semibold";

const steps = [
  "What a helper can do",
  "Who can come with you",
  "Ask for help",
  "Agree in writing",
  "On the day",
] as const;

function Box({ tone, children }: { tone: "ok" | "warn" | "plain"; children: React.ReactNode }) {
  const bg = {
    ok: "bg-emerald-50 dark:bg-emerald-950",
    warn: "bg-amber-50 dark:bg-amber-950",
    plain: "bg-neutral-100 dark:bg-neutral-800",
  }[tone];
  return <div className={`flex flex-col gap-1.5 rounded-lg p-4 text-sm ${bg}`}>{children}</div>;
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <pre className="whitespace-pre-wrap rounded-lg border border-neutral-300 bg-neutral-50 p-4 font-sans text-sm dark:border-neutral-700 dark:bg-neutral-950">
        {text}
      </pre>
      <button type="button" className="self-start rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        onClick={() => navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function CourtSupportGuide() {
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [court, setCourt] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [room, setRoom] = useState("");
  const [hearing, setHearing] = useState("");
  const [tasks, setTasks] = useState<SupportTask[]>(["findCourtroom", "sitWithMe", "notes"]);
  const [paid, setPaid] = useState(false);
  const [rate, setRate] = useState(25);
  const [needs, setNeeds] = useState("");
  const [helper, setHelper] = useState("");

  const request = {
    name, phone, email, needs, tasks,
    courtDate: { court, address, date, time, room, hearing },
    pay: paid ? { kind: "paid" as const, hourlyRate: rate } : { kind: "volunteer" as const },
    longDate: date ? longDate(date) : "",
  };
  const l = pack.limits;
  const daysAway = date ? Math.round((Date.parse(date) - Date.parse(toIso(new Date()))) / 86_400_000) : null;

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
              Going to court alone is hard. Someone next to you can get you there on time, keep your papers straight and
              write down what the judge said, so you can focus on your case. There is one line they can&apos;t cross.
            </p>
            <Box tone="warn">
              <strong>Support is not legal help</strong>
              <span>{l.unauthorizedPractice.text}</span>
              <Cite c={l.unauthorizedPractice.citation} />
            </Box>
            <Box tone="ok">
              <strong>You can bring someone</strong>
              <span>{l.openCourts.text} They sit behind the rail, not at your table, unless the judge says otherwise.</span>
              <Cite c={l.openCourts.citation} />
            </Box>
            <Box tone="plain">
              <strong>Be careful what you share</strong>
              <span>{l.noPrivilege.text}</span>
              <Cite c={l.noPrivilege.citation} />
            </Box>
            <Box tone="plain">
              <strong>Disability or language needs</strong>
              <span>{l.accommodation.text}</span>
              <Cite c={l.accommodation.citation} />
              <span>{l.interpreter.text}</span>
              <Cite c={l.interpreter.citation} />
            </Box>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Pick the kind of helper that fits your case. If you need someone to speak for you, only a lawyer can, and
              you can hire one for a single hearing.
            </p>
            {pack.options.map((o) => (
              <div key={o.id} className="flex flex-col gap-2 rounded-lg border border-neutral-300 p-4 text-sm dark:border-neutral-700">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <strong className="text-base">{o.name}</strong>
                  <span className="text-neutral-600 dark:text-neutral-400">{o.cost}</span>
                </div>
                <span>{o.who}</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">Can</p>
                    <ul className="list-disc pl-5">{o.canDo.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300">Can&apos;t</p>
                    <ul className="list-disc pl-5">{o.cannot.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>
                </div>
                {o.citation && <Cite c={o.citation} />}
              </div>
            ))}
            <h3 className="font-bold">Where to find someone</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {pack.resources.map((r) => (
                <li key={r.name}>
                  <a className="font-semibold underline" href={r.url} target="_blank" rel="noopener noreferrer">{r.name}</a>
                  {" "}{r.what}
                </li>
              ))}
            </ul>
            <p className="text-xs text-neutral-500">
              ProSe doesn&apos;t vet or employ helpers. Check phone numbers and websites before you rely on them.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Fill in your court date from your notice. You&apos;ll get a message to send to a friend, a volunteer program
              or a paid companion. Ask at least a week ahead if you can.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Your name<input className={input} value={name} onChange={(e) => setName(e.target.value)} /></label>
              <label className={label}>Phone<input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
              <label className={label}>Email<input className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label className={label}>Court<input className={input} placeholder="e.g. 19th Judicial District Court" value={court} onChange={(e) => setCourt(e.target.value)} /></label>
              <label className={label}>Court address<input className={input} value={address} onChange={(e) => setAddress(e.target.value)} /></label>
              <label className={label}>Courtroom or division<input className={input} value={room} onChange={(e) => setRoom(e.target.value)} /></label>
              <label className={label}>Date<input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label className={label}>Time on your notice<input type="time" className={input} value={time} onChange={(e) => setTime(e.target.value)} /></label>
              <label className={`${label} sm:col-span-2`}>What kind of hearing
                <input className={input} placeholder="e.g. Protective order hearing, small claims trial, status conference" value={hearing} onChange={(e) => setHearing(e.target.value)} />
              </label>
            </div>
            {daysAway !== null && daysAway >= 0 && daysAway < 7 && (
              <Box tone="warn">
                <strong>Your court date is {daysAway === 0 ? "today" : `in ${daysAway} day${daysAway === 1 ? "" : "s"}`}</strong>
                <span>Send this to several people at once, and call a local family violence program or 211 if it&apos;s urgent.</span>
              </Box>
            )}
            <fieldset className="flex flex-col gap-2 text-sm">
              <legend className="mb-1 font-semibold">What would help</legend>
              {(Object.keys(supportTasks) as SupportTask[]).map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input type="checkbox" checked={tasks.includes(t)}
                    onChange={(e) => setTasks(e.target.checked ? [...tasks, t] : tasks.filter((x) => x !== t))} />
                  {supportTasks[t]}
                </label>
              ))}
            </fieldset>
            <fieldset className="flex flex-wrap items-end gap-4 text-sm">
              <legend className="mb-1 font-semibold">Pay</legend>
              <label className="flex items-center gap-2"><input type="radio" checked={!paid} onChange={() => setPaid(false)} />Looking for a volunteer</label>
              <label className="flex items-center gap-2"><input type="radio" checked={paid} onChange={() => setPaid(true)} />I can pay</label>
              {paid && (
                <label className={label}>Per hour
                  <input type="number" min={0} className={`${input} w-28`} value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} />
                </label>
              )}
            </fieldset>
            <label className={label}>Anything else they should know
              <textarea className={input} rows={2} placeholder="e.g. I use a cane; the other side will be there" value={needs} onChange={(e) => setNeeds(e.target.value)} />
            </label>
            <CopyBlock text={supportRequest(request)} />
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Once someone says yes, write down what they&apos;ll do. It protects you both, and it makes clear they
              won&apos;t be giving legal advice. This uses the details from step 3.
            </p>
            <label className={label}>Helper&apos;s name<input className={input} value={helper} onChange={(e) => setHelper(e.target.value)} /></label>
            {paid && (
              <Box tone="plain">
                <strong>Before you pay anyone</strong>
                <span>Ask for a reference or meet them first. Don&apos;t pay the full amount ahead of time. Walk away from anyone
                  who offers to &quot;handle your case&quot; or talk to the judge for you and isn&apos;t a lawyer.</span>
              </Box>
            )}
            <CopyBlock text={supportAgreement(pack, { ...request, helper })} />
          </>
        )}

        {step === 4 && (
          <>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
              <li>Send your helper the court notice, the address and where to park the day before.</li>
              <li>Bring your papers in one folder, plus a copy of everything you filed.</li>
              <li>Phones are often not allowed or must be silent. Your helper should take notes on paper.</li>
              <li>When your case is called, walk up alone unless the judge says your helper can come with you.</li>
              <li>If you need a moment, you can ask the judge, &quot;May I have a moment to look at my notes?&quot;</li>
              <li>Before you leave, have your helper read back the next court date and anything the judge told you to do.</li>
            </ul>
            <Box tone="ok">
              <strong>If you need a lawyer after all</strong>
              <span>
                If the other side has a lawyer, or the judge says something you don&apos;t understand, you can ask for time to
                get legal help. Legal aid and the bar&apos;s referral service are in step 2.
              </span>
            </Box>
          </>
        )}

        <div className="flex justify-between">
          <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold disabled:opacity-40 dark:border-neutral-700">
            Back
          </button>
          <button type="button" disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
