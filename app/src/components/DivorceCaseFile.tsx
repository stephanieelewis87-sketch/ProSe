"use client";

import { useEffect, useState } from "react";
import { toIso } from "@/lib/legal/dates";
import {
  affidavitForDivorce, descriptiveList, divorcePetition, proposedJudgment, ruleToShowCause, waiverOfService,
  type Custody, type DivorceFacts, type PropertyItem,
} from "@/lib/legal/divorce-documents";
import { louisianaDivorce as pack } from "@/lib/legal/packs/louisiana-divorce";
import type { DivorceGround } from "@/lib/legal/types";
import { Cite } from "./Cite";
import { DocumentView } from "./DocumentView";

const input = "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-normal dark:border-neutral-700 dark:bg-neutral-900";
const label = "flex flex-col gap-1.5 text-sm font-semibold";
const card = "flex flex-col gap-4 rounded-xl border border-neutral-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900";
const check = "flex items-center gap-2 text-sm font-semibold";

const person = { name: "", address: "", phone: "", email: "" };
const emptyFacts: DivorceFacts = {
  you: person, yourParish: "", spouse: person, spouseParish: "",
  marriageDate: "", marriageParish: "", covenant: false, lastMatrimonialParish: "",
  separatedDate: "", children: [],
  path: "102", ground: "separated", groundFacts: "",
  petitionFiledDate: "", servedDate: "", servedBy: "sheriff",
  requests: { custody: "", domiciliary: "", childSupport: false, interimSupport: false, finalSupport: false, useOfHome: false, useOfCar: false, injunction: false },
  caption: { court: "", parish: "", number: "", division: "", title: "" },
  serveOn: "",
};

const FACTS_KEY = "prose.divorce.facts";

function loadFacts(): DivorceFacts {
  try {
    const raw = localStorage.getItem(FACTS_KEY);
    if (!raw) return emptyFacts;
    const saved = JSON.parse(raw);
    return { ...emptyFacts, ...saved, requests: { ...emptyFacts.requests, ...saved.requests } };
  } catch {
    return emptyFacts;
  }
}

const tabs = ["Your case", "Create a document", "If you were served"] as const;

type Creatable = "petition" | "waiver" | "rule" | "affidavit" | "judgment" | "list";
const creatable: { id: Creatable; label: string }[] = [
  { id: "petition", label: "Petition for divorce" },
  { id: "waiver", label: "Waiver of service (for your spouse to sign)" },
  { id: "rule", label: "Rule to show cause (article 102, after the wait)" },
  { id: "affidavit", label: "Your affidavit for the divorce" },
  { id: "judgment", label: "Proposed judgment of divorce" },
  { id: "list", label: "Sworn detailed descriptive list (property and debts)" },
];

const emptyItem: PropertyItem = { description: "", value: "", location: "", claim: "community" };

export function DivorceCaseFile() {
  const today = toIso(new Date());
  const [tab, setTab] = useState(0);
  const [facts, setFacts] = useState<DivorceFacts>(emptyFacts);
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

  const set = <K extends keyof DivorceFacts>(k: K, v: DivorceFacts[K]) => setFacts((f) => ({ ...f, [k]: v }));
  const req = <K extends keyof DivorceFacts["requests"]>(k: K, v: DivorceFacts["requests"][K]) =>
    setFacts((f) => ({ ...f, requests: { ...f.requests, [k]: v } }));

  const [make, setMake] = useState<Creatable>("petition");
  const [assets, setAssets] = useState<PropertyItem[]>([{ ...emptyItem }]);
  const [debts, setDebts] = useState<PropertyItem[]>([{ ...emptyItem }]);

  const ground = pack.grounds.find((g) => g.id === facts.ground)!;

  const itemEditor = (items: PropertyItem[], setItems: (x: PropertyItem[]) => void, kind: "asset" | "debt") => (
    <div className="no-print flex flex-col gap-3">
      <strong className="text-sm">{kind === "asset" ? "Assets" : "Debts"}</strong>
      {items.map((it, i) => {
        const upd = (patch: Partial<PropertyItem>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
        return (
          <div key={i} className="grid gap-3 rounded-lg border border-neutral-200 p-3 sm:grid-cols-3 dark:border-neutral-800">
            <label className={label}>{kind === "asset" ? "What it is" : "Debt and creditor"}
              <input className={input} value={it.description} onChange={(e) => upd({ description: e.target.value })} /></label>
            <label className={label}>{kind === "asset" ? "Fair market value" : "Balance"}
              <input className={input} value={it.value} onChange={(e) => upd({ value: e.target.value })} /></label>
            {kind === "asset" && (
              <>
                <label className={label}>Where it is
                  <input className={input} value={it.location} onChange={(e) => upd({ location: e.target.value })} /></label>
                <label className={check}>
                  <input type="checkbox" checked={it.claim === "separate"} onChange={(e) => upd({ claim: e.target.checked ? "separate" : "community" })} />
                  I claim this as my separate property
                </label>
              </>
            )}
          </div>
        );
      })}
      <button type="button" className="self-start text-sm underline" onClick={() => setItems([...items, { ...emptyItem }])}>
        Add {kind === "asset" ? "an asset" : "a debt"}
      </button>
    </div>
  );

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
          <h3 className="font-bold">You</h3>
          {(["name", "address", "phone", "email"] as const).map((k) => (
            <label key={k} className={label}>Your {k}
              <input className={input} value={facts.you[k]} onChange={(e) => set("you", { ...facts.you, [k]: e.target.value })} /></label>
          ))}
          <label className={label}>Parish where you live
            <input className={input} value={facts.yourParish} onChange={(e) => set("yourParish", e.target.value)} /></label>
          <h3 className="pt-2 font-bold">Your spouse</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Spouse&apos;s full name
              <input className={input} value={facts.spouse.name} onChange={(e) => set("spouse", { ...facts.spouse, name: e.target.value })} /></label>
            <label className={label}>Parish (or state) where they live
              <input className={input} value={facts.spouseParish} onChange={(e) => set("spouseParish", e.target.value)} /></label>
          </div>
          <label className={label}>Spouse&apos;s address (where the sheriff can serve them)
            <input className={input} value={facts.spouse.address} onChange={(e) => set("spouse", { ...facts.spouse, address: e.target.value })} /></label>
          <h3 className="pt-2 font-bold">The marriage</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Date of marriage
              <input type="date" className={input} value={facts.marriageDate} onChange={(e) => set("marriageDate", e.target.value)} /></label>
            <label className={label}>Where you married (parish and state)
              <input className={input} value={facts.marriageParish} onChange={(e) => set("marriageParish", e.target.value)} /></label>
            <label className={label}>Parish where you last lived together
              <input className={input} value={facts.lastMatrimonialParish} onChange={(e) => set("lastMatrimonialParish", e.target.value)} /></label>
            <label className={label}>Date you started living apart
              <input type="date" className={input} value={facts.separatedDate} onChange={(e) => set("separatedDate", e.target.value)} /></label>
            <label className={check}>
              <input type="checkbox" checked={facts.covenant} onChange={(e) => set("covenant", e.target.checked)} />
              It&apos;s a covenant marriage
            </label>
          </div>
          <h3 className="pt-2 font-bold">Children of the marriage</h3>
          {facts.children.map((c, i) => (
            <div key={i} className="grid gap-4 sm:grid-cols-2">
              <label className={label}>Child {i + 1}&apos;s full name
                <input className={input} value={c.name}
                  onChange={(e) => set("children", facts.children.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></label>
              <label className={label}>Birth date
                <input type="date" className={input} value={c.birthDate}
                  onChange={(e) => set("children", facts.children.map((x, j) => (j === i ? { ...x, birthDate: e.target.value } : x)))} /></label>
            </div>
          ))}
          <button type="button" className="self-start text-sm underline"
            onClick={() => set("children", [...facts.children, { name: "", birthDate: "" }])}>Add a child</button>

          <h3 className="pt-2 font-bold">How you&apos;re filing</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Path
              <select className={input} value={facts.path} onChange={(e) => set("path", e.target.value as DivorceFacts["path"])}>
                <option value="102">Article 102: file now, divorce after the wait</option>
                <option value="103">Article 103: a ground already exists</option>
              </select></label>
            {facts.path === "103" && (
              <label className={label}>Ground
                <select className={input} value={facts.ground} onChange={(e) => set("ground", e.target.value as DivorceGround)}>
                  {pack.grounds.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select></label>
            )}
          </div>
          {facts.path === "103" && !ground.waitingPeriod && (
            <label className={label}>What happened, and when
              <textarea className={input} rows={3} value={facts.groundFacts} onChange={(e) => set("groundFacts", e.target.value)} /></label>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Service
              <select className={input} value={facts.servedBy} onChange={(e) => set("servedBy", e.target.value as DivorceFacts["servedBy"])}>
                <option value="sheriff">The sheriff serves my spouse</option>
                <option value="waiver">My spouse signs a waiver</option>
              </select></label>
            <label className={label}>Date you filed the petition (once filed)
              <input type="date" className={input} value={facts.petitionFiledDate} onChange={(e) => set("petitionFiledDate", e.target.value)} /></label>
            <label className={label}>Date served or waiver signed (once done)
              <input type="date" className={input} value={facts.servedDate} onChange={(e) => set("servedDate", e.target.value)} /></label>
          </div>

          <h3 className="pt-2 font-bold">What you&apos;re asking for besides the divorce</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>Custody
              <select className={input} value={facts.requests.custody} onChange={(e) => req("custody", e.target.value as Custody)}>
                <option value="">Not asking now</option>
                <option value="joint">Joint custody</option>
                <option value="sole">Sole custody</option>
              </select></label>
            {facts.requests.custody === "joint" && (
              <label className={label}>Domiciliary parent (where the children mainly live)
                <select className={input} value={facts.requests.domiciliary} onChange={(e) => req("domiciliary", e.target.value as DivorceFacts["requests"]["domiciliary"])}>
                  <option value="">Not saying</option><option value="me">Me</option><option value="spouse">My spouse</option>
                </select></label>
            )}
          </div>
          {([
            ["childSupport", "Child support"],
            ["interimSupport", "Interim spousal support while the case is pending"],
            ["finalSupport", "Final spousal support after the divorce"],
            ["useOfHome", "Use of the family home"],
            ["useOfCar", "Use of the car I drive"],
            ["injunction", "Order that my spouse not sell or hide community property"],
          ] as const).map(([k, l]) => (
            <label key={k} className={check}>
              <input type="checkbox" checked={facts.requests[k]} onChange={(e) => req(k, e.target.checked)} />
              {l}
            </label>
          ))}

          <h3 className="pt-2 font-bold">Court caption</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Before you file, leave the number and division blank; the clerk assigns them. After that, copy them from
            your filed petition. The case title defaults to &quot;Your name versus Spouse&apos;s name&quot;.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {([["court", "Court (e.g. 4th Judicial District Court)"], ["parish", "Parish"], ["number", "Number"], ["division", "Division"]] as const).map(([k, l]) => (
              <label key={k} className={label}>{l}
                <input className={input} value={facts.caption[k]} onChange={(e) => set("caption", { ...facts.caption, [k]: e.target.value })} /></label>
            ))}
          </div>
          <label className={label}>Case title (optional)
            <input className={input} value={facts.caption.title} onChange={(e) => set("caption", { ...facts.caption, title: e.target.value })} /></label>
          <label className={label}>Who to send copies to (your spouse, or their lawyer, with address)
            <input className={input} value={facts.serveOn} onChange={(e) => set("serveOn", e.target.value)} /></label>
        </section>
      )}

      {tab === 1 && (
        <section className={card}>
          <label className={`${label} no-print`}>What do you need?
            <select className={input} value={make} onChange={(e) => setMake(e.target.value as Creatable)}>
              {creatable.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select></label>
          {make === "petition" && <DocumentView doc={divorcePetition(pack, facts, today)} />}
          {make === "waiver" && <DocumentView doc={waiverOfService(pack, facts)} />}
          {make === "rule" && <DocumentView doc={ruleToShowCause(pack, facts, today)} />}
          {make === "affidavit" && <DocumentView doc={affidavitForDivorce(pack, facts, today)} />}
          {make === "judgment" && <DocumentView doc={proposedJudgment(facts)} />}
          {make === "list" && (
            <>
              <p className="no-print text-sm text-neutral-600 dark:text-neutral-400">
                List everything the community owns and owes as of the day the petition was filed, with fair market
                values. File it within {pack.property.listDays} days after a partition motion is served.
              </p>
              {itemEditor(assets, setAssets, "asset")}
              {itemEditor(debts, setDebts, "debt")}
              <DocumentView doc={descriptiveList(pack, facts, assets, debts)} />
            </>
          )}
        </section>
      )}

      {tab === 2 && (
        <section className={card}>
          <h3 className="font-bold">Your spouse filed for divorce</h3>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
            <li>Read the petition and the citation. An article 103 petition gives you a deadline to answer; if you don&apos;t,
              the court can grant the divorce by default. <Cite c={{ label: "La. Code Civ. Proc. arts. 1001, 1701–1702", verified: false }} /></li>
            <li>An article 102 petition has no answer deadline for the divorce itself; your spouse must wait, then serve you
              with a rule to show cause. You can still file your own requests for custody, support or the home.
              <Cite c={pack.afterPetition.ruleCitation} /></li>
            <li>If you disagree with a request (custody, support, use of the home), file an answer and, if you want things
              of your own, a reconventional demand asking for them. <Cite c={pack.incidental.citation} /></li>
            <li>Check the parish. If neither of you lives there and you didn&apos;t last live together there, the court
              can&apos;t grant the divorce. <Cite c={pack.filing.venue.citation} /></li>
          </ul>
          <h3 className="font-bold">You were served with a rule for custody or support</h3>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
            <li>Go to the hearing on the date in the rule. Bring pay stubs, your latest tax return and proof of child care
              and insurance costs; for support each side files a sworn income statement.
              <Cite c={pack.childSupport.stepsCitation} /></li>
            <li>For custody, bring what shows the factors in step 4 of the <a className="underline" href="/divorce">guide</a>:
              school records, who handles doctor visits, messages about the children. <Cite c={pack.custody.factorsCitation} /></li>
            <li>Many courts send custody disputes to mediation or a conference with a hearing officer first.
              <Cite c={{ label: "La. R.S. 9:332; local rules", verified: false }} /></li>
          </ul>
          <h3 className="font-bold">You were served with a partition motion</h3>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
            <li>File your sworn detailed descriptive list within {pack.property.listDays} days. If you don&apos;t, your
              spouse&apos;s list can become the court&apos;s finding. Use &quot;Sworn detailed descriptive list&quot; in
              Create a document. <Cite c={pack.property.partitionCitation} /></li>
          </ul>
          <p className="text-sm">
            If your spouse asks you to sign a waiver of service, it only replaces the sheriff serving you. Under
            article 102 the waiting period starts the day you sign it. <Cite c={pack.afterPetition.citation} />
          </p>
        </section>
      )}
    </div>
  );
}
