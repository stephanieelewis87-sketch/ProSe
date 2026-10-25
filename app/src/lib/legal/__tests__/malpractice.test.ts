import { describe, expect, it } from "vitest";
import { capRecovery, malpracticeDeadline, panelRequestLetter, panelTimeline } from "../malpractice";
import { louisianaMedicalMalpractice as la } from "../packs/louisiana-medical-malpractice";

const today = "2026-10-25";

describe("malpracticeDeadline (Louisiana)", () => {
  it("gives one year from the act", () => {
    const d = malpracticeDeadline(la, { actDate: "2026-03-10", today });
    expect(d.oneYear).toBe("2027-03-10");
    expect(d.lastDayToFilePanel).toBe("2027-03-10"); // Wednesday
    expect(d.status).toBe("open");
    expect(d.fromDiscovery).toBe(false);
  });

  it("runs from a later discovery date", () => {
    const d = malpracticeDeadline(la, { actDate: "2025-06-02", discoveryDate: "2026-02-03", today });
    expect(d.fromDiscovery).toBe(true);
    expect(d.lastDayToFilePanel).toBe("2027-02-03");
    expect(d.cappedByOuterLimit).toBe(false);
  });

  it("never goes past three years from the act", () => {
    const d = malpracticeDeadline(la, { actDate: "2024-05-01", discoveryDate: "2026-09-01", today });
    expect(d.outerLimit).toBe("2027-05-01"); // Saturday
    expect(d.cappedByOuterLimit).toBe(true);
    expect(d.lastDayToFilePanel).toBe("2027-05-03");
  });

  it("rolls past a weekend and a listed holiday", () => {
    // 2027-03-13 is a Saturday.
    const d = malpracticeDeadline(la, { actDate: "2026-03-13", today, holidays: new Set(["2027-03-15"]) });
    expect(d.lastDayToFilePanel).toBe("2027-03-16");
  });

  it("reports a passed deadline", () => {
    const d = malpracticeDeadline(la, { actDate: "2025-01-10", today });
    expect(d.status).toBe("passed");
    expect(d.daysLeft).toBeLessThan(0);
  });

  it("rejects discovery before the act", () => {
    expect(() => malpracticeDeadline(la, { actDate: "2026-03-10", discoveryDate: "2026-03-01", today })).toThrow();
  });

  it("stops the clock while the panel is pending", () => {
    const d = malpracticeDeadline(la, { actDate: "2026-03-10", today, panelFiledDate: "2026-10-01" });
    expect(d.status).toBe("suspended");
    expect(d.daysLeftAtFiling).toBe(160);
    expect(d.daysLeft).toBeNull();
  });

  it("restarts the remaining days 90 days after notice of the opinion", () => {
    const d = malpracticeDeadline(la, {
      actDate: "2026-03-10", today, panelFiledDate: "2026-10-01", panelNoticeDate: "2027-09-01",
    });
    expect(d.suspensionEnds).toBe("2027-11-30");
    expect(d.lastDayToSue).toBe("2028-05-08"); // 160 days on, a Monday
    expect(d.status).toBe("resumed");
  });

  it("leaves 90 days when the request is filed on the last day", () => {
    const d = malpracticeDeadline(la, {
      actDate: "2026-03-10", today, panelFiledDate: "2027-03-10", panelNoticeDate: "2027-09-01",
    });
    expect(d.daysLeftAtFiling).toBe(0);
    expect(d.lastDayToSue).toBe("2027-11-30");
  });

  it("treats a filing on the rolled-over Monday as timely", () => {
    const d = malpracticeDeadline(la, { actDate: "2026-03-13", today, panelFiledDate: "2027-03-15" });
    expect(d.status).toBe("suspended");
    expect(d.daysLeftAtFiling).toBe(0);
  });

  it("flags a late panel request", () => {
    const d = malpracticeDeadline(la, { actDate: "2025-01-10", today, panelFiledDate: "2026-02-01" });
    expect(d.status).toBe("filedLate");
  });
});

describe("panelTimeline", () => {
  it("dates each step once its starting date is known", () => {
    const steps = panelTimeline(la, { filed: "2026-11-02", confirmationReceived: "2026-11-12" });
    expect(steps[0].due).toBe("2026-11-17");
    expect(steps[1].due).toBe("2026-12-27");
    expect(steps[2].due).toBeUndefined();
    expect(steps[2].waitsOn).toMatch(/certification/);
  });
});

describe("capRecovery", () => {
  it("caps damages at $500,000 and adds future medical on top", () => {
    const r = capRecovery(la, { damages: 1_200_000, futureMedical: 300_000, qualified: true, qualifiedProviders: 2 });
    expect(r.recoverable).toBe(500_000);
    expect(r.lostToCap).toBe(700_000);
    expect(r.fromProviders).toBe(200_000);
    expect(r.fromFund).toBe(600_000);
    expect(r.total).toBe(800_000);
  });

  it("leaves damages under the cap alone", () => {
    const r = capRecovery(la, { damages: 80_000, futureMedical: 0, qualified: true, qualifiedProviders: 1 });
    expect(r.recoverable).toBe(80_000);
    expect(r.fromFund).toBe(0);
  });

  it("doesn't cap a provider who isn't enrolled", () => {
    const r = capRecovery(la, { damages: 1_200_000, futureMedical: 0, qualified: false, qualifiedProviders: 0 });
    expect(r.capApplies).toBe(false);
    expect(r.total).toBe(1_200_000);
  });
});

describe("panelRequestLetter", () => {
  it("includes every required item and marks blanks", () => {
    const text = panelRequestLetter(la, {
      patient: "Jane Doe", claimants: ["Jane Doe"],
      providers: [{ name: "Dr. A. Smith", whatHappened: "Missed the fracture on the x-ray" }],
      dates: "March 10, 2026", injuries: "",
      sender: { name: "Jane Doe", address: "1 Main St, Monroe, LA", phone: "", email: "" },
      today: "2026-10-25",
    });
    expect(text).toContain("R.S. 40:1231.8");
    expect(text).toContain("Dr. A. Smith: Missed the fracture");
    expect(text).toContain("[a short, specific description of the injuries]");
    expect(text).toContain("P.O. Box 44336");
  });
});
