import Link from "next/link";
import { PsychiatricStay } from "@/components/PsychiatricStay";

export const metadata = { title: "Hurt in a psychiatric hospital · ProSe" };

export default function PsychiatricStayPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-sm underline">All case types</Link>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Louisiana psychiatric hospital stays
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Hurt or wrongly held in a psychiatric hospital?</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Not everything that happens in a hospital is medical malpractice. Abuse, being held without the legal steps,
          denied rights and civil rights violations are different claims, often without the panel or the damages
          cap. Check what happened to see which claims fit and the deadline to protect them all.
        </p>
      </header>
      <PsychiatricStay />
    </main>
  );
}
