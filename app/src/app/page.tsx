import Link from "next/link";
import { DeadlineChecker } from "@/components/DeadlineChecker";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <nav className="flex gap-4 text-sm">
        <span className="font-semibold">Car accident</span>
        <Link href="/medical-malpractice" className="underline">Medical malpractice</Link>
        <Link href="/court-support" className="ml-auto underline">Someone to go to court with you</Link>
      </nav>
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Louisiana car accident
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">When do you have to file?</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Enter the date of the crash. You&apos;ll get your last day to sue and the Louisiana rules that
          change what you can recover, each with its legal source.
        </p>
      </header>
      <DeadlineChecker />
    </main>
  );
}
