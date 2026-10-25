import { ruleFor } from "./dates";
import type { Citation, IsoDate, JurisdictionPack } from "./types";

export type DamageKind = "medical" | "lostWages" | "property" | "other";

export interface DamageItem {
  kind: DamageKind;
  description: string;
  amount: number;
}

export interface ClaimInput {
  crashDate: IsoDate;
  items: DamageItem[];
  injured: boolean;
  /** Multiple of medical bills used as a pain-and-suffering negotiating figure. */
  painMultiplier: number;
  claimantInsured: boolean;
  claimantFaultPercent: number;
}

export interface ClaimValue {
  medical: number;
  lostWages: number;
  property: number;
  other: number;
  /** Bills and out-of-pocket losses. */
  special: number;
  /** Pain and suffering estimate. */
  general: number;
  gross: number;
  uninsuredReduction: number;
  faultReduction: number;
  barredByFault: boolean;
  net: number;
  citations: Citation[];
}

export function valueClaim(pack: JurisdictionPack, input: ClaimInput): ClaimValue {
  const sum = (k: DamageKind) =>
    input.items.filter((i) => i.kind === k).reduce((a, i) => a + Math.max(0, i.amount || 0), 0);
  const medical = sum("medical"), lostWages = sum("lostWages"), property = sum("property"), other = sum("other");
  const special = medical + lostWages + property + other;
  const general = input.injured ? medical * Math.max(0, input.painMultiplier) : 0;
  const gross = special + general;
  const citations: Citation[] = [];

  let bodily = medical + lostWages + other + general;
  let prop = property;
  if (!input.claimantInsured) {
    const bar = ruleFor(pack.uninsuredBar, input.crashDate);
    bodily = Math.max(0, bodily - bar.value.bodilyInjury);
    prop = Math.max(0, prop - bar.value.propertyDamage);
    citations.push(bar.citation);
  }
  const afterUninsured = bodily + prop;

  const fault = Math.min(100, Math.max(0, input.claimantFaultPercent));
  const faultRule = ruleFor(pack.fault, input.crashDate);
  const barredByFault = faultRule.value.kind === "modified" && fault >= faultRule.value.barAtPercent;
  const net = barredByFault ? 0 : afterUninsured * (1 - fault / 100);
  if (fault > 0) citations.push(faultRule.citation);

  return {
    medical, lostWages, property, other, special, general, gross,
    uninsuredReduction: gross - afterUninsured,
    faultReduction: afterUninsured - net,
    barredByFault,
    net: Math.round(net),
    citations,
  };
}

export function fitsSmallClaims(pack: JurisdictionPack, amount: number): boolean {
  return amount <= pack.smallClaims.limit;
}
