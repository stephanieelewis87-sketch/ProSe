import type { CourtSupportPack } from "./types";

/** Things a support person can do on a court date. None of them is legal advice or speaking for you. */
export const supportTasks = {
  ride: "Drive me to the courthouse and back",
  findCourtroom: "Meet me at the entrance and help me find the courtroom",
  sitWithMe: "Sit with me in the courtroom and while I wait",
  notes: "Take notes on what the judge says and the next court date",
  papers: "Help me keep my papers in order",
  calm: "Help me stay calm and remember what I wanted to say",
  childcare: "Watch my children in the hallway or waiting area",
} as const;

export type SupportTask = keyof typeof supportTasks;

export interface CourtDate {
  court: string;
  address: string;
  /** "YYYY-MM-DD". */
  date: string;
  /** "HH:MM", 24-hour, as on the notice. */
  time: string;
  room: string;
  hearing: string;
}

export interface SupportRequest {
  name: string;
  phone: string;
  email: string;
  courtDate: CourtDate;
  tasks: SupportTask[];
  pay: { kind: "volunteer" } | { kind: "paid"; hourlyRate: number };
  needs: string;
  /** Pre-formatted date line, e.g. "Wednesday, November 18, 2026". */
  longDate: string;
}

const blank = (s: string, what: string) => s.trim() || `[${what}]`;
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: n % 1 ? 2 : 0 });

/** "13:30" → "1:30 PM". */
export function clock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Not a time: ${hhmm}`);
  }
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** Courts call many cases at the same time, so a helper should plan to arrive early and stay a while. */
export const arriveEarlyMinutes = 45;
export const planForHours = 4;

/** When to meet and how long to book a helper, with the cost if they are paid. */
export function booking(time: string, hourlyRate?: number) {
  const [h, m] = time.split(":").map(Number);
  const start = h * 60 + m - arriveEarlyMinutes;
  if (start < 0) throw new Error(`Not a court time: ${time}`);
  const meet = `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
  return {
    meet,
    hours: planForHours,
    cost: hourlyRate === undefined ? undefined : Math.round(hourlyRate * planForHours * 100) / 100,
  };
}

/** A message a person can send to a volunteer, a program or a paid companion to ask for help on one court date. */
export function supportRequest(r: SupportRequest): string {
  const c = r.courtDate;
  const b = c.time ? booking(c.time, r.pay.kind === "paid" ? r.pay.hourlyRate : undefined) : null;
  const tasks = r.tasks.length ? r.tasks.map((t) => `- ${supportTasks[t]}`) : ["- Sit with me in the courtroom and while I wait"];
  return [
    `Hi, my name is ${blank(r.name, "your name")}. I have a court date and I'm handling my case on my own. I'm looking for someone to come with me for support.`,
    "",
    `When: ${r.longDate || "[date]"}${c.time ? `, hearing at ${clock(c.time)}` : ", [time]"}`,
    `Where: ${blank(c.court, "court name")}, ${blank(c.address, "court address")}${c.room.trim() ? `, ${c.room.trim()}` : ""}`,
    `What it is: ${blank(c.hearing, "type of hearing")}`,
    b ? `I'd like to meet at ${clock(b.meet)} and plan for about ${b.hours} hours, since court often runs late.` : "",
    "",
    "What I'd like help with:",
    ...tasks,
    r.needs.trim() ? `\nAnything else you should know: ${r.needs.trim()}` : "",
    "",
    r.pay.kind === "paid"
      ? `I can pay ${money(r.pay.hourlyRate)} an hour (about ${money(b?.cost ?? r.pay.hourlyRate * planForHours)} for the day).`
      : "I'm looking for a volunteer and can't pay, but I'd be very grateful.",
    "",
    "I'm not asking for legal advice or for anyone to speak for me in court. I just don't want to go alone.",
    "",
    `You can reach me at ${[r.phone, r.email].filter((s) => s.trim()).join(" or ") || "[phone or email]"}.`,
    "",
    "Thank you,",
    blank(r.name, "your name"),
  ].filter((line, i, all) => !(line === "" && all[i - 1] === "")).join("\n");
}

/** A short written agreement so the person and the helper both know what the helper will and won't do. */
export function supportAgreement(pack: CourtSupportPack, r: SupportRequest & { helper: string }): string {
  const tasks = r.tasks.length ? r.tasks : (["sitWithMe"] as SupportTask[]);
  return [
    "Court support agreement",
    "",
    `${blank(r.helper, "helper's name")} will go with ${blank(r.name, "your name")} to ${blank(r.courtDate.court, "court name")} on ${r.longDate || "[date]"}${r.courtDate.time ? ` (meet at ${clock(booking(r.courtDate.time).meet)})` : ""}.`,
    "",
    "The helper will:",
    ...tasks.map((t) => `- ${supportTasks[t]}`),
    "",
    "The helper will not:",
    "- Give legal advice or tell me what to file or say",
    "- Speak for me to the judge, the clerk or the other side",
    "- Sign or file anything for me",
    "",
    `Why: ${pack.limits.unauthorizedPractice.text} (${pack.limits.unauthorizedPractice.citation.label})`,
    "",
    `Privacy: ${pack.limits.noPrivilege.text}`,
    "",
    r.pay.kind === "paid"
      ? `Pay: ${money(r.pay.hourlyRate)} an hour, paid at the end of the day. If the hearing is cancelled with less than 24 hours' notice, [agree on what happens].`
      : "Pay: none. The helper is volunteering.",
    "",
    "Either of us can cancel by phone or text as early as possible.",
    "",
    `Signed: ______________________  ${blank(r.name, "your name")}`,
    `Signed: ______________________  ${blank(r.helper, "helper's name")}`,
  ].join("\n");
}
