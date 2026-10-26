import Link from "next/link";
import { MalpracticeGuide } from "@/components/MalpracticeGuide";

export const metadata = { title: "Medical malpractice in Louisiana · ProSe" };

export default function MedicalMalpractice() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-sm underline">All case types</Link>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Louisiana medical malpractice
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">You can bring this claim yourself</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Louisiana makes you go through a medical review panel before you can sue a doctor or hospital. It has strict
          dates, but each step is a letter, a fee or a choice. This walks you through them in order, with the law for
          each one.
        </p>
        <Link href="/medical-malpractice/case-file"
          className="self-start rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
          Open your case file: records, documents and responses
        </Link>
      </header>
      <MalpracticeGuide />
    </main>
  );
}
