import Link from "next/link";
import { DivorceGuide } from "@/components/DivorceGuide";

export const metadata = { title: "Divorce in Louisiana · ProSe" };

export default function Divorce() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-sm underline">All case types</Link>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Louisiana divorce
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">You can file for divorce yourself</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Most Louisiana divorces are no-fault: you live apart for 180 days, or 365 with children, and file the right
          papers in the right order. This walks you through the divorce and the questions that come with it: custody,
          child support, spousal support and property, with the law for each one.
        </p>
        <Link href="/divorce/case-file"
          className="self-start rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
          Open your case file: petition, waiver, rule and more
        </Link>
      </header>
      <DivorceGuide />
    </main>
  );
}
