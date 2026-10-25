import { describe, expect, it } from "vitest";
import { addYears, parseIso } from "../dates";
import { louisianaCarAccident as la } from "../packs/louisiana-car-accident";
import { filingDeadline } from "../prescription";

describe("filingDeadline (Louisiana car accident)", () => {
  it("gives 1 year for a crash before July 1, 2024", () => {
    const d = filingDeadline(la, "2024-06-30", "2024-07-01");
    expect(d.years).toBe(1);
    expect(d.nominal).toBe("2025-06-30");
    expect(d.lastDay).toBe("2025-06-30"); // Monday
  });

  it("gives 2 years for a crash on July 1, 2024", () => {
    const d = filingDeadline(la, "2024-07-01", "2024-07-01");
    expect(d.years).toBe(2);
    expect(d.lastDay).toBe("2026-07-01"); // Wednesday
    expect(d.citations[0].label).toBe("La. Civ. Code art. 3493.1");
  });

  it("rolls a Saturday last day to Monday", () => {
    // 2028-03-11 is a Saturday.
    const d = filingDeadline(la, "2026-03-11", "2026-03-11");
    expect(d.nominal).toBe("2028-03-11");
    expect(d.rolledOver).toEqual(["2028-03-11", "2028-03-12"]);
    expect(d.lastDay).toBe("2028-03-13");
  });

  it("rolls past a listed court holiday after a weekend", () => {
    const d = filingDeadline(la, "2026-03-11", "2026-03-11", new Set(["2028-03-13"]));
    expect(d.lastDay).toBe("2028-03-14");
  });

  it("counts days left from today", () => {
    expect(filingDeadline(la, "2026-03-14", "2026-10-25").daysLeft).toBe(506);
  });

  it("reports a passed deadline as negative days", () => {
    expect(filingDeadline(la, "2023-01-10", "2026-10-25").daysLeft).toBeLessThan(0);
  });
});

describe("dates", () => {
  it("moves Feb 29 to Feb 28 in a non-leap year", () => {
    expect(addYears("2028-02-29", 2)).toBe("2030-02-28");
  });

  it("rejects impossible dates", () => {
    expect(() => parseIso("2026-02-30")).toThrow();
    expect(() => parseIso("03/14/2026")).toThrow();
  });
});
