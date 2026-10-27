import Link from "next/link";
import { DivorceCaseFile } from "@/components/DivorceCaseFile";

export const metadata = { title: "Your divorce case file · ProSe" };

export default function DivorceCaseFilePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="no-print flex flex-col gap-2">
        <Link href="/divorce" className="text-sm underline">Back to the guide</Link>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Louisiana divorce
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">Your case file</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Enter your facts once and make the papers you need, from the petition to the judgment, ready to sign, notarize
          and file.
        </p>
      </header>
      <DivorceCaseFile />
    </main>
  );
}
