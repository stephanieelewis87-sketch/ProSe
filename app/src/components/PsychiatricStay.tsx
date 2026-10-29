"use client";

import { useState } from "react";
import { freeHelp, sortClaims, stayEvents, type Facility, type StayEvent } from "@/lib/legal/psychiatric";
import { Box } from "./Box";
import { Cite, longDate } from "./Cite";

const input = "w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-normal dark:border-neutral-700 dark:bg-neutral-900";
const label = "flex min-w-0 flex-col gap-1.5 text-sm font-semibold";
const panelText = { yes: "Panel first, damages capped", no: "No panel, no cap", maybe: "May or may not need the panel" };

export function PsychiatricStay() {
  const [facility, setFacility] = useState<Facility>("unknown");
  const [eventDate, setEventDate] = useState("");
  const [events, setEvents] = useState<StayEvent[]>([]);
  const [died, setDied] = useState(false);
  const result = sortClaims({ facility, eventDate, events, patientDied: died });

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-xl border border-neutral-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="text-xl font-extrabold">What happened?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>Who runs the hospital?
            <select className={input} value={facility} onChange={(e) => setFacility(e.target.value as Facility)}>
              <option value="unknown">I don&apos;t know</option>
              <option value="private">A private hospital or company</option>
              <option value="state">The state or another government agency</option>
            </select></label>
          <label className={label}>When did it happen?
            <input type="date" className={input} value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></label>
        </div>
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="pb-1 font-semibold">Check everything that happened</legend>
          {stayEvents.map((ev) => (
            <label key={ev.id} className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={events.includes(ev.id)}
                onChange={(e) => setEvents(e.target.checked ? [...events, ev.id] : events.filter((x) => x !== ev.id))} />
              {ev.label}
            </label>
          ))}
          <label className="flex items-start gap-2 pt-2 font-semibold">
            <input type="checkbox" className="mt-1" checked={died} onChange={(e) => setDied(e.target.checked)} />
            The patient died
          </label>
        </fieldset>
      </section>

      {result.claims.length > 0 && (
        <section className="flex flex-col gap-4 rounded-xl border border-neutral-300 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-xl font-extrabold">Claims you may have</h2>
          {result.safeDeadline && (
            <Box tone="warn">
              <span>File by</span>
              <span className="text-2xl font-extrabold">{longDate(result.safeDeadline)}</span>
              <span>{result.safeDeadlineReason}</span>
            </Box>
          )}
          {result.warnings.map((w) => <Box key={w} tone="plain"><span>{w}</span></Box>)}
          {result.claims.map((c) => (
            <article key={c.id} className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold">{c.name}</h3>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${c.panel === "no"
                  ? "bg-emerald-100 text-emerald-800" : c.panel === "yes" ? "bg-amber-100 text-amber-800" : "bg-neutral-200 text-neutral-800"}`}>
                  {panelText[c.panel]}
                </span>
              </div>
              <p>{c.what}</p>
              <p><strong>Deadline:</strong> {c.deadline}</p>
              <p><strong>Where:</strong> {c.where}</p>
              <ul className="list-disc pl-5">{c.hurdles.map((h) => <li key={h.text}>{h.text} <Cite c={h.citation} /></li>)}</ul>
              <div className="flex flex-wrap gap-3">{c.citations.map((ct) => <Cite key={ct.label} c={ct} />)}</div>
              {c.id === "malpractice" && (
                <a className="self-start font-semibold underline" href="/medical-malpractice">Open the malpractice guide</a>
              )}
            </article>
          ))}
        </section>
      )}

      <Box tone="ok">
        <strong>Free help</strong>
        <ul className="list-disc pl-5">{freeHelp.map((h) => <li key={h.text}>{h.text} <Cite c={h.citation} /></li>)}</ul>
      </Box>
      <Box tone="plain">
        <strong>Save the evidence now</strong>
        <ul className="list-disc pl-5">
          <li>Write down what happened, when, and who was there while you remember it.</li>
          <li>Photograph injuries, and get them looked at and recorded by a doctor outside the facility.</li>
          <li>Request your full chart, including restraint and seclusion orders, the 15-minute check sheets, medication
            records and incident reports.</li>
          <li>Keep your emergency certificate, the coroner&apos;s certificate and any court papers.</li>
        </ul>
        <a className="self-start font-semibold underline" href="/medical-malpractice/case-file">
          Store your records and make a records request in the case file
        </a>
      </Box>
    </div>
  );
}
