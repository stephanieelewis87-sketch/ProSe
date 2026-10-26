"use client";

import { useState } from "react";
import { documentText, verificationOf, type LegalDocument } from "@/lib/legal/documents";
import { Cite } from "./Cite";

const B = ({ v, what }: { v: string; what: string }) => <>{v.trim() || `[${what}]`}</>;

/** A document laid out like a Louisiana filing or letter, ready to print or copy. */
export function DocumentView({ doc }: { doc: LegalDocument }) {
  const [copied, setCopied] = useState(false);
  const c = doc.caption;
  const s = doc.signer;
  const v = verificationOf(doc);
  return (
    <div className="flex flex-col gap-3">
      {doc.warnings.length > 0 && (
        <div className="no-print flex flex-col gap-1 rounded-lg bg-amber-50 p-4 text-sm dark:bg-amber-950">
          <strong>Before you file</strong>
          <ul className="list-disc pl-5">{doc.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}
      <div className="no-print flex flex-wrap gap-2">
        <button type="button" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <button type="button" className="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          onClick={() => navigator.clipboard?.writeText(documentText(doc)).then(() => setCopied(true), () => {})}>
          {copied ? "Copied" : "Copy text"}
        </button>
      </div>
      <article className="paper flex flex-col gap-4 rounded-lg border border-neutral-300 bg-white p-6 font-serif text-[15px] leading-relaxed text-black sm:p-10">
        {c && (
          <header className="flex flex-col gap-1 text-center font-bold uppercase">
            <span><B v={c.court} what="court" /> for the Parish of <B v={c.parish} what="parish" /></span>
            <span>State of Louisiana</span>
            <span className="flex flex-wrap justify-center gap-x-8 font-normal">
              <span>Number: <B v={c.number} what="docket number" /></span>
              <span>Division: <B v={c.division} what="division" /></span>
            </span>
            <span className="pt-2"><B v={c.title} what="case title exactly as on the papers" /></span>
            <span className="border-t border-black pt-3 underline">{doc.title}</span>
          </header>
        )}
        {doc.to && <div>{doc.to.map((l) => <div key={l}>{l}</div>)}</div>}
        {doc.blocks.map((b, i) =>
          b.kind === "heading" ? <h3 key={i} className="pt-2 text-center font-bold uppercase">{b.text}</h3>
          : b.kind === "p" ? <p key={i} className={c ? "indent-10" : ""}>{b.text}</p>
          : <ol key={i} className="list-decimal pl-8">{b.items.map((it) => <li key={it} className="pb-1">{it}</li>)}</ol>)}
        {doc.exhibits.length > 0 && (
          <div><strong>Exhibits attached:</strong><ul className="pl-4">{doc.exhibits.map((e) => <li key={e}>{e}</li>)}</ul></div>
        )}
        <div className="ml-auto flex w-full max-w-xs flex-col pt-4">
          <span>{doc.signoff ?? "Respectfully submitted,"}</span>
          <span className="mt-8 border-t border-black" />
          <span><B v={s.name} what="your name" />{doc.kind === "pleading" && ", in proper person"}</span>
          <span><B v={s.address} what="your address" /></span>
          <span>{[s.phone, s.email].filter((x) => x.trim()).join(" · ") || "[phone and email]"}</span>
        </div>
        {v && (
          <div className="flex flex-col gap-2 pt-4">
            <h3 className="text-center font-bold uppercase">Verification</h3>
            <p>State of Louisiana, Parish of <B v={c?.parish ?? ""} what="parish" /></p>
            <p>Before me, the undersigned notary, personally appeared <B v={s.name} what="your name" />, who, being sworn,
              said that {v.statement}.</p>
            <div className="grid grid-cols-2 gap-8 pt-6"><span className="border-t border-black">{v.role}</span><span className="border-t border-black">Notary Public</span></div>
          </div>
        )}
        {doc.kind === "pleading" && !doc.noCertificate && (
          <div className="flex flex-col gap-2 pt-4">
            <h3 className="text-center font-bold uppercase">Certificate of service</h3>
            <p>I certify that a copy of this document has been served on <B v={doc.serveOn ?? ""} what="the other side's lawyers, with addresses" /> by
              mail or email on ____________, 20__.</p>
            <span className="mt-6 max-w-xs border-t border-black" />
          </div>
        )}
        {doc.order && (
          <div className="flex flex-col gap-2 pt-6" style={{ breakBefore: "page" }}>
            <h3 className="text-center font-bold uppercase">Order</h3>
            <p>{doc.order}</p>
            <span className="ml-auto mt-8 w-64 border-t border-black text-center">Judge</span>
          </div>
        )}
      </article>
      <div className="no-print flex flex-wrap gap-3">{doc.citations.map((ct) => <Cite key={ct.label} c={ct} />)}</div>
    </div>
  );
}
