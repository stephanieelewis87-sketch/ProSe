"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toIso } from "@/lib/legal/dates";
import {
  discoveryResponses, exhibitLabels, motionToExtend, oppositionToNoRightOfAction, oppositionToPrescription,
  benefitOptions, pauperApplication, petitionToCompel, recordsRequest, subpoenaRequest,
  type CaseFacts, type DiscoveryItem, type Finances, type Relationship,
} from "@/lib/legal/documents";
import { louisianaMedicalMalpractice as pack } from "@/lib/legal/packs/louisiana-medical-malpractice";
import {
  addFiles, deleteRecord, getBlob, listRecords, recordTitle, timeline, updateRecord,
  type MedicalRecord, type RecordKind,
} from "@/lib/records/store";
import { zip } from "@/lib/records/zip";
import { Cite } from "./Cite";
import { DocumentView } from "./DocumentView";

const input = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-normal dark:border-neutral-700 dark:bg-neutral-900";
const label = "flex flex-col gap-1.5 text-sm font-semibold";
const card = "flex flex-col gap-4 rounded-xl border border-neutral-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900";

const emptyFacts: CaseFacts = {
  patient: "", patientDied: false,
  you: { name: "", address: "", phone: "", email: "" },
  relationship: "self",
  providers: [{ name: "", whatHappened: "" }],
  actDate: "", discoveryDate: "", discoveryHow: "",
  panelFiledDate: "", panelFiledBy: "certified mail", feePaidDate: "", feeWaiver: "",
  caption: { court: "", parish: "", number: "", division: "", title: "" },
  serveOn: "",
};

const FACTS_KEY = "prose.medmal.facts";

function loadFacts(): CaseFacts {
  try {
    const raw = localStorage.getItem(FACTS_KEY);
    return raw ? { ...emptyFacts, ...JSON.parse(raw) } : emptyFacts;
  } catch {
    return emptyFacts;
  }
}

const tabs = ["Your case", "Medical records", "Respond to papers", "Create a document"] as const;

type Received = "prescription" | "noRightOfAction" | "discovery" | "deposition" | "prematurity" | "subpoena";
const received: { id: Received; label: string }[] = [
  { id: "prescription", label: "Exception of prescription (they say you filed too late)" },
  { id: "noRightOfAction", label: "Exception of no right of action (they say you can't bring this claim)" },
  { id: "discovery", label: "Interrogatories or requests for documents" },
  { id: "deposition", label: "A notice of deposition" },
  { id: "subpoena", label: "A subpoena" },
  { id: "prematurity", label: "Exception of prematurity (you sued before the panel finished)" },
];

type Creatable = "pauper" | "records" | "subpoena" | "compel" | "extend";
const creatable: { id: Creatable; label: string }[] = [
  { id: "pauper", label: "Ask to proceed without paying costs (pauper status)" },
  { id: "records", label: "Request your medical records" },
  { id: "subpoena", label: "Ask the clerk for a subpoena for records" },
  { id: "compel", label: "Ask the court to make the other side follow the panel rules" },
  { id: "extend", label: "Ask the court for more time for the panel" },
];

export function CaseFile() {
  const today = toIso(new Date());
  const [tab, setTab] = useState(0);
  const [facts, setFacts] = useState<CaseFacts>(emptyFacts);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFacts(loadFacts());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(FACTS_KEY, JSON.stringify(facts));
    } catch {
      // Private mode or storage blocked: the page still works for this visit.
    }
  }, [facts, loaded]);

  const set = <K extends keyof CaseFacts>(k: K, v: CaseFacts[K]) => setFacts((f) => ({ ...f, [k]: v }));

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [storageError, setStorageError] = useState("");
  const refresh = useCallback(() => {
    listRecords().then(setRecords, () => setStorageError("This browser won't let the page store files (private mode can do this). Files you add won't be kept."));
  }, []);
  useEffect(refresh, [refresh]);
  const ordered = useMemo(() => timeline(records), [records]);
  const [chosen, setChosen] = useState<string[]>([]);
  const exhibits = exhibitLabels(ordered.filter((r) => chosen.includes(r.id)).map(recordTitle));

  const [got, setGot] = useState<Received>("prescription");
  const [make, setMake] = useState<Creatable>("pauper");
  const [fin, setFin] = useState<Finances>({
    householdSize: 1, monthlyIncome: 0, incomeSources: "", benefits: [], monthlyExpenses: 0, property: "", debts: "",
    helper: { name: "", address: "", relationship: "" },
  });
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("doc") === "pauper") {
      setTab(3);
      setMake("pauper");
    }
  }, []);
  const [served, setServed] = useState("");
  const [questions, setQuestions] = useState<DiscoveryItem[]>([{ question: "", answer: "" }]);
  const [target, setTarget] = useState({ name: "", address: "", wanted: "" });
  const [failure, setFailure] = useState("");
  const [chairmanNotice, setChairmanNotice] = useState("");
  const [goodCause, setGoodCause] = useState("");

  const exhibitPicker = (
    <div className="no-print flex flex-col gap-2 text-sm">
      <strong>Attach records as exhibits</strong>
      {ordered.length === 0 ? (
        <span className="text-neutral-500">Add records in the Medical records tab to attach them here.</span>
      ) : ordered.map((r) => (
        <label key={r.id} className="flex items-center gap-2">
          <input type="checkbox" checked={chosen.includes(r.id)}
            onChange={(e) => setChosen(e.target.checked ? [...chosen, r.id] : chosen.filter((x) => x !== r.id))} />
          {recordTitle(r)}
        </label>
      ))}
    </div>
  );

  async function exportAll() {
    const entries = [];
    const used = new Set<string>();
    for (const r of ordered) {
      const blob = await getBlob(r.id);
      if (!blob) continue;
      let name = `${r.date || "undated"} ${r.provider || "unknown"} - ${r.fileName}`.replace(/[\\/:*?"<>|]/g, "_");
      while (used.has(name)) name = `copy ${name}`;
      used.add(name);
      entries.push({ name, data: new Uint8Array(await blob.arrayBuffer()) });
    }
    entries.push({ name: "case-facts.json", data: new TextEncoder().encode(JSON.stringify({ facts, records: ordered }, null, 2)) });
    const url = URL.createObjectURL(new Blob([zip(entries)], { type: "application/zip" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `medical-records-${today}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Case file" className="no-print flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <button key={t} type="button" onClick={() => setTab(i)} aria-current={i === tab ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${i === tab
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-neutral-300 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"}`}>
            {t}
          </button>
        ))}
      </nav>

      {tab === 0 && (
        <section className={card}>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Fill this in once. Every document uses it. It&apos;s saved only in this browser.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Patient&apos;s full name
              <input className={input} value={facts.patient} onChange={(e) => set("patient", e.target.value)} /></label>
            <label className={label}>You are the patient&apos;s
              <select className={input} value={facts.relationship} onChange={(e) => set("relationship", e.target.value as Relationship)}>
                <option value="self">I am the patient</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Brother or sister</option>
                <option value="grandparent">Grandparent</option>
                <option value="other">Other</option>
              </select></label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={facts.patientDied} onChange={(e) => set("patientDied", e.target.checked)} />
              The patient has died
            </label>
          </div>
          {(["name", "address", "phone", "email"] as const).map((k) => (
            <label key={k} className={label}>Your {k}
              <input className={input} value={facts.you[k]} onChange={(e) => set("you", { ...facts.you, [k]: e.target.value })} /></label>
          ))}
          {facts.providers.map((p, i) => (
            <div key={i} className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Provider {i + 1}
                <input className={input} value={p.name}
                  onChange={(e) => set("providers", facts.providers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></label>
              <label className={label}>What they did
                <input className={input} value={p.whatHappened}
                  onChange={(e) => set("providers", facts.providers.map((x, j) => (j === i ? { ...x, whatHappened: e.target.value } : x)))} /></label>
            </div>
          ))}
          <button type="button" className="self-start text-sm underline"
            onClick={() => set("providers", [...facts.providers, { name: "", whatHappened: "" }])}>Add a provider</button>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Date of the treatment
              <input type="date" className={input} value={facts.actDate} onChange={(e) => set("actDate", e.target.value)} /></label>
            <label className={label}>Date you found out
              <input type="date" className={input} value={facts.discoveryDate} onChange={(e) => set("discoveryDate", e.target.value)} /></label>
          </div>
          <label className={label}>How you found out
            <input className={input} placeholder="e.g. a second doctor read the x-ray and told me the fracture was missed"
              value={facts.discoveryHow} onChange={(e) => set("discoveryHow", e.target.value)} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Date you filed the panel request
              <input type="date" className={input} value={facts.panelFiledDate} onChange={(e) => set("panelFiledDate", e.target.value)} /></label>
            <label className={label}>Filed by
              <select className={input} value={facts.panelFiledBy} onChange={(e) => set("panelFiledBy", e.target.value as CaseFacts["panelFiledBy"])}>
                <option>certified mail</option><option>fax</option><option>hand delivery</option>
              </select></label>
            <label className={label}>Date you paid the fee
              <input type="date" className={input} value={facts.feePaidDate} onChange={(e) => set("feePaidDate", e.target.value)} /></label>
            <label className={label}>Or the waiver you filed
              <select className={input} value={facts.feeWaiver} onChange={(e) => set("feeWaiver", e.target.value as CaseFacts["feeWaiver"])}>
                <option value="">None</option><option>physician affidavit</option><option>pauper ruling</option>
              </select></label>
          </div>
          <h3 className="pt-2 font-bold">Court caption</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Copy these exactly from the top of the court papers you were served. During the panel the case title is
            often &quot;In re: Medical Review Panel Proceeding of&quot; and your name.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {([["court", "Court (e.g. 19th Judicial District Court)"], ["parish", "Parish"], ["number", "Number"], ["division", "Division"]] as const).map(([k, l]) => (
              <label key={k} className={label}>{l}
                <input className={input} value={facts.caption[k]} onChange={(e) => set("caption", { ...facts.caption, [k]: e.target.value })} /></label>
            ))}
          </div>
          <label className={label}>Case title
            <input className={input} value={facts.caption.title} onChange={(e) => set("caption", { ...facts.caption, title: e.target.value })} /></label>
          <label className={label}>Who to send copies to (the other side&apos;s lawyers and their addresses)
            <input className={input} value={facts.serveOn} onChange={(e) => set("serveOn", e.target.value)} /></label>
        </section>
      )}

      {tab === 1 && (
        <section className={card}>
          <div className="rounded-lg bg-emerald-50 p-4 text-sm dark:bg-emerald-950">
            <strong>Your records stay on this device.</strong> They&apos;re stored in this browser and never sent to a
            server. Download a backup now and then, because clearing your browser data deletes them.
          </div>
          {storageError && <div className="rounded-lg bg-red-50 p-4 text-sm dark:bg-red-950">{storageError}</div>}
          <label className={label}>Add records (PDFs, photos, scans)
            <input type="file" multiple accept="application/pdf,image/*,.doc,.docx,.txt" className={input}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                try { await addFiles(files); refresh(); } catch { setStorageError("Couldn't save those files in this browser."); }
              }} /></label>
          {ordered.length > 0 && (
            <>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Tag each record with the provider and the date of care. They&apos;re listed in date order, which is
                your timeline.
              </p>
              <ol className="flex flex-col gap-3">
                {ordered.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <button type="button" className="font-semibold underline" onClick={async () => {
                        const b = await getBlob(r.id);
                        if (b) window.open(URL.createObjectURL(b), "_blank", "noopener");
                      }}>{r.fileName}</button>
                      <span className="text-neutral-500">{Math.max(1, Math.round(r.size / 1024))} KB</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className={label}>Provider
                        <input className={input} defaultValue={r.provider}
                          onBlur={(e) => updateRecord({ ...r, provider: e.target.value }).then(refresh)} /></label>
                      <label className={label}>Date of care
                        <input type="date" className={input} value={r.date}
                          onChange={(e) => updateRecord({ ...r, date: e.target.value }).then(refresh)} /></label>
                      <label className={label}>Kind
                        <select className={input} value={r.kind}
                          onChange={(e) => updateRecord({ ...r, kind: e.target.value as RecordKind }).then(refresh)}>
                          {["chart", "imaging", "lab", "bill", "letter", "photo", "other"].map((k) => <option key={k}>{k}</option>)}
                        </select></label>
                    </div>
                    <label className={label}>Notes (what this shows)
                      <input className={input} defaultValue={r.notes}
                        onBlur={(e) => updateRecord({ ...r, notes: e.target.value }).then(refresh)} /></label>
                    <button type="button" className="self-start text-xs text-red-700 underline dark:text-red-400" onClick={() => {
                      if (confirm(`Delete ${r.fileName} from this device?`)) deleteRecord(r.id).then(refresh);
                    }}>Delete</button>
                  </li>
                ))}
              </ol>
              <button type="button" className="self-start rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
                onClick={exportAll}>Download a backup (.zip)</button>
            </>
          )}
          <div className="flex flex-wrap gap-3 text-sm">{pack.records.text} <Cite c={pack.records.citation} /></div>
        </section>
      )}

      {tab === 2 && (
        <section className={card}>
          <label className={`${label} no-print`}>What did you receive?
            <select className={input} value={got} onChange={(e) => setGot(e.target.value as Received)}>
              {received.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select></label>

          {got === "prescription" && (
            <>
              <p className="no-print text-sm text-neutral-600 dark:text-neutral-400">
                This answers the exception with your dates. Check the Your case tab first, attach the certified-mail
                receipt and fee receipt, and file it with the clerk before the opposition deadline on your notice.
              </p>
              {exhibitPicker}
              <DocumentView doc={oppositionToPrescription(pack, facts, today, exhibits)} />
            </>
          )}
          {got === "noRightOfAction" && (
            <>
              {exhibitPicker}
              <DocumentView doc={oppositionToNoRightOfAction(facts, exhibits)} />
            </>
          )}
          {got === "discovery" && (
            <>
              <div className="no-print flex flex-col gap-3">
                <label className={label}>Who sent the questions
                  <input className={input} value={served} onChange={(e) => setServed(e.target.value)} /></label>
                {questions.map((q, i) => (
                  <div key={i} className="grid gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                    <label className={label}>Question {i + 1} (copy it exactly)
                      <textarea className={input} rows={2} value={q.question}
                        onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))} /></label>
                    <label className={label}>Your answer
                      <textarea className={input} rows={3} value={q.answer}
                        onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))} /></label>
                  </div>
                ))}
                <button type="button" className="self-start text-sm underline"
                  onClick={() => setQuestions([...questions, { question: "", answer: "" }])}>Add a question</button>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Answer truthfully and completely. If you don&apos;t know, say so. Sign the verification in front of a
                  notary, and send the documents they asked for with your answers.
                </p>
              </div>
              <DocumentView doc={discoveryResponses(facts, served, questions)} />
            </>
          )}
          {got === "deposition" && (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
              <li>A deposition is sworn testimony, taken before the panel meets. You must go. If the date doesn&apos;t
                work, call the lawyer who sent it right away and agree on another date in writing.</li>
              <li>Read your records and your timeline first. Answer only the question asked; &quot;I don&apos;t know&quot;
                and &quot;I don&apos;t remember&quot; are fine when true.</li>
              <li>You can take depositions too, for example of a nurse who was there.</li>
              <li><Cite c={pack.panel.courtDuringPanel.discovery[0].citation} /></li>
            </ul>
          )}
          {got === "subpoena" && (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
              <li>A subpoena is a court order. Follow it: appear, or produce the documents, by the date on it.</li>
              <li>If it asks for something you don&apos;t have, say so in writing to the lawyer who issued it before
                the date.</li>
              <li><Cite c={pack.panel.courtDuringPanel.discovery[1].citation} /></li>
            </ul>
          )}
          {got === "prematurity" && (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
              <li>If the provider is enrolled with the Fund and the panel hasn&apos;t ruled, the court will usually
                dismiss the suit as premature. Arguing against it rarely works.</li>
              <li>What protects you is the panel request: if you haven&apos;t filed one, file it now (see the guide).
                The dismissal doesn&apos;t end the claim if the panel request stops the clock in time.</li>
              <li>If the provider isn&apos;t enrolled, attach proof (the board&apos;s letter saying so). Then no panel
                is required.</li>
              <li><Cite c={pack.panel.courtDuringPanel.exceptions[3].citation} /> <Cite c={pack.panel.required} /></li>
            </ul>
          )}
        </section>
      )}

      {tab === 3 && (
        <section className={card}>
          <label className={`${label} no-print`}>What do you need?
            <select className={input} value={make} onChange={(e) => setMake(e.target.value as Creatable)}>
              {creatable.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select></label>
          <p className="no-print text-sm text-neutral-600 dark:text-neutral-400">
            The panel request letter is in step 4 of the <a className="underline" href="/medical-malpractice">guide</a>.
          </p>
          {(make === "records" || make === "subpoena") && (
            <div className="no-print grid gap-3 sm:grid-cols-2">
              <label className={label}>{make === "records" ? "Provider or hospital" : "Who has the records"}
                <input className={input} value={target.name} onChange={(e) => setTarget({ ...target, name: e.target.value })} /></label>
              <label className={label}>Their address
                <input className={input} value={target.address} onChange={(e) => setTarget({ ...target, address: e.target.value })} /></label>
              {make === "subpoena" && (
                <label className={`${label} sm:col-span-2`}>Exactly which documents
                  <input className={input} value={target.wanted} onChange={(e) => setTarget({ ...target, wanted: e.target.value })} /></label>
              )}
            </div>
          )}
          {make === "pauper" && (
            <>
              <div className="no-print flex flex-col gap-3">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  If you have low or no income, a judge can let you go forward without paying costs up front. This
                  makes the motion, your affidavit, the second person&apos;s affidavit and the order for the judge to
                  sign. Your answers stay in this browser.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className={label}>People in your household
                    <input type="number" min={1} className={input} value={fin.householdSize}
                      onChange={(e) => setFin({ ...fin, householdSize: Number(e.target.value) })} /></label>
                  <label className={label}>Household income per month (before taxes)
                    <input type="number" min={0} className={input} value={fin.monthlyIncome}
                      onChange={(e) => setFin({ ...fin, monthlyIncome: Number(e.target.value) })} /></label>
                  <label className={label}>Necessary expenses per month
                    <input type="number" min={0} className={input} value={fin.monthlyExpenses}
                      onChange={(e) => setFin({ ...fin, monthlyExpenses: Number(e.target.value) })} /></label>
                </div>
                <label className={label}>Where the income comes from
                  <input className={input} placeholder="e.g. part-time job, Social Security disability, none"
                    value={fin.incomeSources} onChange={(e) => setFin({ ...fin, incomeSources: e.target.value })} /></label>
                <fieldset className="flex flex-col gap-1.5 text-sm">
                  <legend className="pb-1 font-semibold">Benefits you get</legend>
                  {benefitOptions.map((b) => (
                    <label key={b} className="flex items-center gap-2">
                      <input type="checkbox" checked={fin.benefits.includes(b)}
                        onChange={(e) => setFin({ ...fin, benefits: e.target.checked ? [...fin.benefits, b] : fin.benefits.filter((x) => x !== b) })} />
                      {b}
                    </label>
                  ))}
                </fieldset>
                <label className={label}>Property you own and its value
                  <input className={input} placeholder="e.g. 2012 car worth $3,000; $150 in checking"
                    value={fin.property} onChange={(e) => setFin({ ...fin, property: e.target.value })} /></label>
                <label className={label}>Debts
                  <input className={input} value={fin.debts} onChange={(e) => setFin({ ...fin, debts: e.target.value })} /></label>
                <strong className="pt-2 text-sm">Someone who knows your finances (not your lawyer)</strong>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(["name", "address", "relationship"] as const).map((k) => (
                    <label key={k} className={label}>{k === "relationship" ? "How they know you" : `Their ${k}`}
                      <input className={input} value={fin.helper[k]}
                        onChange={(e) => setFin({ ...fin, helper: { ...fin.helper, [k]: e.target.value } })} /></label>
                  ))}
                </div>
                <ul className="flex flex-col gap-2 text-sm">
                  {pack.pauper.sections[0].items.map((n) => <li key={n.text}>{n.text} <Cite c={n.citation} /></li>)}
                </ul>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  File it with the clerk of the district court in a parish where your claim could be filed. If the
                  case has no number yet, leave it blank; the clerk assigns one. For the panel fee, the signed order must
                  reach the Fund within 45 days of the confirmation letter.
                </p>
              </div>
              <DocumentView doc={pauperApplication(facts, fin)} />
            </>
          )}
          {make === "records" && <DocumentView doc={recordsRequest(facts, target.name, target.address, today)} />}
          {make === "subpoena" && (
            <DocumentView doc={subpoenaRequest(facts, target.name, target.address, target.wanted, facts.caption.parish)} />
          )}
          {make === "compel" && (
            <>
              <label className={`${label} no-print`}>What the other side failed to do, with dates
                <textarea className={input} rows={3} value={failure} onChange={(e) => setFailure(e.target.value)} /></label>
              <DocumentView doc={petitionToCompel(facts, failure)} />
            </>
          )}
          {make === "extend" && (
            <>
              <div className="no-print grid gap-3 sm:grid-cols-2">
                <label className={label}>Date of notice that the chairman was chosen
                  <input type="date" className={input} value={chairmanNotice} onChange={(e) => setChairmanNotice(e.target.value)} /></label>
                <label className={label}>Why more time is needed
                  <input className={input} value={goodCause} onChange={(e) => setGoodCause(e.target.value)} /></label>
              </div>
              <DocumentView doc={motionToExtend(facts, chairmanNotice, goodCause)} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
