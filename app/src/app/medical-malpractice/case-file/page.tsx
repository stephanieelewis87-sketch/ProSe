import Link from "next/link";
import { CaseFile } from "@/components/CaseFile";

export const metadata = { title: "Your case file · ProSe" };

export default function CaseFilePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="no-print flex flex-col gap-2">
        <Link href="/medical-malpractice" className="text-sm underline">Back to the guide</Link>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Louisiana medical malpractice
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Your case file</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Keep your records in one place, answer papers you&apos;re served, and make the letters and court filings
          you need, ready to print and sign.
        </p>
      </header>
      <CaseFile />
    </main>
  );
}
