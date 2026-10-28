import Link from "next/link";
import { CourtSupportGuide } from "@/components/CourtSupportGuide";

export const metadata = { title: "Someone to go to court with you · ProSe" };

export default function CourtSupport() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <Link href="/" className="text-sm underline">All case types</Link>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Court support
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">You don&apos;t have to go to court alone</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          If you have no one to go with you, you can ask a volunteer, a free advocate or a paid companion to come to your
          court date. This shows who can help, what they can and can&apos;t do, and writes the request for you.
        </p>
      </header>
      <CourtSupportGuide />
    </main>
  );
}
