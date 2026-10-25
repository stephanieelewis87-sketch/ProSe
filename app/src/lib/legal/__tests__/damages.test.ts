import { describe, expect, it } from "vitest";
import { fitsSmallClaims, valueClaim, type ClaimInput } from "../damages";
import { louisianaCarAccident as la } from "../packs/louisiana-car-accident";

const base: ClaimInput = {
  crashDate: "2026-03-14",
  items: [
    { kind: "medical", description: "ER", amount: 4000 },
    { kind: "lostWages", description: "Work", amount: 1000 },
    { kind: "property", description: "Bumper", amount: 3000 },
  ],
  injured: true,
  painMultiplier: 2,
  claimantInsured: true,
  claimantFaultPercent: 0,
};

describe("valueClaim (Louisiana car accident)", () => {
  it("adds bills and a pain-and-suffering estimate", () => {
    const v = valueClaim(la, base);
    expect(v.special).toBe(8000);
    expect(v.general).toBe(8000);
    expect(v.net).toBe(16000);
  });

  it("leaves out pain and suffering when nobody was hurt", () => {
    expect(valueClaim(la, { ...base, injured: false }).general).toBe(0);
  });

  it("reduces by the claimant's share of fault", () => {
    expect(valueClaim(la, { ...base, claimantFaultPercent: 25 }).net).toBe(12000);
  });

  it("bars recovery at 51% fault for a 2026 crash", () => {
    const v = valueClaim(la, { ...base, claimantFaultPercent: 51 });
    expect(v.barredByFault).toBe(true);
    expect(v.net).toBe(0);
  });

  it("keeps pure comparative fault for a 2025 crash", () => {
    const v = valueClaim(la, { ...base, crashDate: "2025-12-31", claimantFaultPercent: 60 });
    expect(v.barredByFault).toBe(false);
    expect(v.net).toBe(6400);
  });

  it("applies the $15k/$25k uninsured bar before Aug 1, 2025", () => {
    const v = valueClaim(la, {
      ...base,
      crashDate: "2025-07-31",
      claimantInsured: false,
      items: [
        { kind: "medical", description: "ER", amount: 10000 },
        { kind: "property", description: "Car", amount: 30000 },
      ],
    });
    // bodily 10k + 20k pain = 30k, minus 15k = 15k; property 30k minus 25k = 5k
    expect(v.net).toBe(20000);
  });

  it("applies the $100k uninsured bar from Aug 1, 2025", () => {
    expect(valueClaim(la, { ...base, claimantInsured: false }).net).toBe(0);
  });

  it("ignores negative amounts", () => {
    const v = valueClaim(la, { ...base, items: [{ kind: "other", description: "x", amount: -50 }] });
    expect(v.special).toBe(0);
  });
});

describe("fitsSmallClaims", () => {
  it("allows up to $5,000", () => {
    expect(fitsSmallClaims(la, 5000)).toBe(true);
    expect(fitsSmallClaims(la, 5001)).toBe(false);
  });
});
