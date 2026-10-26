import { describe, expect, it } from "vitest";
import { childSupportShares, divorceTimeline, finalSupportCap, partitionDates } from "../divorce";
import { louisianaDivorce as la } from "../packs/louisiana-divorce";

describe("divorceTimeline, article 102", () => {
  const base = { path: "102" as const, minorChildren: false, today: "2026-10-26" };

  it("waits 180 full days after service when there are no minor children", () => {
    const t = divorceTimeline(la, { ...base, separatedDate: "2026-01-01", servedDate: "2026-03-02" });
    expect(t.periodDays).toBe(180);
    expect(t.earliest).toBe("2026-08-30");
    expect(t.status).toBe("ready");
    expect(t.abandonedAfter).toBe("2028-03-02");
  });

  it("waits 365 days with minor children", () => {
    const t = divorceTimeline(la, { ...base, minorChildren: true, separatedDate: "2026-01-01", servedDate: "2026-03-02" });
    expect(t.periodDays).toBe(365);
    expect(t.earliest).toBe("2027-03-03");
    expect(t.status).toBe("wait");
    expect(t.waitingOn).toBe("service");
    expect(t.daysLeft).toBe(128);
  });

  it("waits on the separation when you moved apart after service", () => {
    const t = divorceTimeline(la, { ...base, separatedDate: "2026-06-01", servedDate: "2026-03-02" });
    expect(t.earliest).toBe("2026-11-29");
    expect(t.waitingOn).toBe("separation");
  });

  it("uses 180 days once the youngest child turns 18 before the rule", () => {
    const t = divorceTimeline(la, {
      ...base, minorChildren: true, youngestBirthDate: "2008-12-15", separatedDate: "2026-06-01", servedDate: "2026-06-01",
    });
    expect(t.earliest).toBe("2026-12-15");
    expect(t.periodDays).toBe(180);
  });

  it("uses the 180-day date when the youngest is already 18 by then", () => {
    const t = divorceTimeline(la, {
      ...base, minorChildren: true, youngestBirthDate: "2008-07-01", separatedDate: "2026-06-01", servedDate: "2026-06-01",
    });
    expect(t.earliest).toBe("2026-11-29");
  });

  it("asks for service when the petition hasn't been served", () => {
    const t = divorceTimeline(la, { ...base, separatedDate: "2026-06-01" });
    expect(t.status).toBe("needService");
  });

  it("flags the case as abandoned two years after service", () => {
    const t = divorceTimeline(la, { ...base, separatedDate: "2024-01-01", servedDate: "2024-10-25" });
    expect(t.status).toBe("abandoned");
  });
});

describe("divorceTimeline, article 103", () => {
  it("counts the period from the separation", () => {
    const t = divorceTimeline(la, { path: "103", ground: "separated", separatedDate: "2026-01-01", minorChildren: false, today: "2026-10-26" });
    expect(t.earliest).toBe("2026-07-01");
    expect(t.status).toBe("ready");
  });

  it("has no waiting period for abuse", () => {
    const t = divorceTimeline(la, { path: "103", ground: "abuse", separatedDate: "2026-10-01", minorChildren: true, today: "2026-10-26" });
    expect(t.periodDays).toBe(0);
    expect(t.status).toBe("ready");
  });
});

describe("childSupportShares", () => {
  it("splits the total by each parent's share of combined income", () => {
    const s = childSupportShares({ yourIncome: 3000, otherIncome: 6000, basicObligation: 1200, childCare: 300, healthInsurance: 150 });
    expect(s.combined).toBe(9000);
    expect(s.yourShare).toBeCloseTo(1 / 3);
    expect(s.total).toBe(1650);
    expect(s.yourPortion).toBe(550);
    expect(s.otherPortion).toBe(1100);
  });

  it("handles no income", () => {
    expect(childSupportShares({ yourIncome: 0, otherIncome: 0, basicObligation: 100, childCare: 0, healthInsurance: 0 }).yourPortion).toBe(0);
  });
});

describe("finalSupportCap", () => {
  it("caps at one-third of net income", () => expect(finalSupportCap(la, 4500, false)).toBe(1500));
  it("has no cap with abuse", () => expect(finalSupportCap(la, 4500, true)).toBeNull());
});

describe("partitionDates", () => {
  it("gives 45 days for the list and 60 to traverse", () => {
    expect(partitionDates(la, "2026-11-02", "2026-12-20")).toEqual({ listDue: "2026-12-17", traverseDue: "2027-02-18" });
  });
});
