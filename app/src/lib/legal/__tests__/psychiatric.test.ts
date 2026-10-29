import { describe, expect, it } from "vitest";
import { sortClaims } from "../psychiatric";

describe("sortClaims (psychiatric hospital stay)", () => {
  it("treats staff assault as an intentional tort outside the panel", () => {
    const r = sortClaims({ facility: "private", eventDate: "2026-02-01", events: ["staffAssault"], patientDied: false });
    expect(r.claims.map((c) => c.id)).toEqual(["intentional"]);
    expect(r.claims[0].panel).toBe("no");
    expect(r.safeDeadline).toBe("2028-02-01");
  });

  it("adds federal civil rights at a state hospital", () => {
    const r = sortClaims({ facility: "state", eventDate: "2026-02-01", events: ["staffAssault"], patientDied: false });
    expect(r.claims.map((c) => c.id)).toEqual(["intentional", "civilRights"]);
    expect(r.safeDeadline).toBe("2027-02-01");
  });

  it("asks whether the facility is public when it matters", () => {
    const r = sortClaims({ facility: "unknown", eventDate: "", events: ["noExam"], patientDied: false });
    expect(r.claims.map((c) => c.id)).toEqual(["wrongfulConfinement", "civilRights"]);
    expect(r.warnings.some((w) => /run by the state/.test(w))).toBe(true);
    expect(r.safeDeadline).toBeUndefined();
  });

  it("splits malpractice from other claims and adds death claims", () => {
    const r = sortClaims({ facility: "private", eventDate: "2026-02-01", events: ["selfHarm", "restraint"], patientDied: true });
    expect(r.claims.map((c) => c.id)).toEqual(["malpractice", "intentional", "rights", "death"]);
    expect(r.warnings.some((w) => /panel request for the malpractice part/.test(w))).toBe(true);
  });

  it("uses 1 year for an event before July 1, 2024", () => {
    const r = sortClaims({ facility: "private", eventDate: "2024-03-01", events: ["staffAssault"], patientDied: false });
    expect(r.safeDeadline).toBe("2025-03-01");
  });

  it("returns nothing when nothing is checked", () => {
    expect(sortClaims({ facility: "private", eventDate: "2026-02-01", events: [], patientDied: true }).claims).toEqual([]);
  });
});
