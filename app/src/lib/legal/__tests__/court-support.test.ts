import { describe, expect, it } from "vitest";
import { booking, clock, supportAgreement, supportRequest, type SupportRequest } from "../court-support";
import { louisianaCourtSupport as la } from "../packs/louisiana-court-support";

const base: SupportRequest = {
  name: "Dana Smith",
  phone: "504-555-0100",
  email: "",
  courtDate: {
    court: "Orleans Parish Civil District Court",
    address: "421 Loyola Ave, New Orleans",
    date: "2026-11-18",
    time: "09:00",
    room: "Division D",
    hearing: "Rule to show cause",
  },
  tasks: ["ride", "sitWithMe", "notes"],
  pay: { kind: "volunteer" },
  needs: "",
  longDate: "Wednesday, November 18, 2026",
};

describe("clock", () => {
  it("formats morning, noon and afternoon", () => {
    expect(clock("09:05")).toBe("9:05 AM");
    expect(clock("12:00")).toBe("12:00 PM");
    expect(clock("00:30")).toBe("12:30 AM");
    expect(clock("13:30")).toBe("1:30 PM");
  });

  it("rejects a bad time", () => {
    expect(() => clock("25:00")).toThrow();
  });
});

describe("booking", () => {
  it("meets 45 minutes early and plans for four hours", () => {
    expect(booking("09:00")).toEqual({ meet: "08:15", hours: 4, cost: undefined });
    expect(booking("13:30", 25)).toEqual({ meet: "12:45", hours: 4, cost: 100 });
  });
});

describe("supportRequest", () => {
  it("names the date, place and the help wanted", () => {
    const msg = supportRequest(base);
    expect(msg).toContain("Wednesday, November 18, 2026, hearing at 9:00 AM");
    expect(msg).toContain("Orleans Parish Civil District Court, 421 Loyola Ave, New Orleans, Division D");
    expect(msg).toContain("meet at 8:15 AM");
    expect(msg).toContain("- Drive me to the courthouse and back");
    expect(msg).toContain("looking for a volunteer");
    expect(msg).toContain("504-555-0100");
  });

  it("says it is not asking for legal advice", () => {
    expect(supportRequest(base)).toContain("not asking for legal advice or for anyone to speak for me");
  });

  it("shows the pay and day total for a paid helper", () => {
    const msg = supportRequest({ ...base, pay: { kind: "paid", hourlyRate: 30 } });
    expect(msg).toContain("$30 an hour (about $120 for the day)");
  });

  it("leaves bracketed blanks for missing details", () => {
    const msg = supportRequest({ ...base, name: "", courtDate: { ...base.courtDate, court: "", time: "" }, longDate: "" });
    expect(msg).toContain("[your name]");
    expect(msg).toContain("[court name]");
    expect(msg).toContain("When: [date], [time]");
    expect(msg).not.toMatch(/\n\n\n/);
  });
});

describe("supportAgreement", () => {
  it("lists what the helper will and won't do, with the law", () => {
    const a = supportAgreement(la, { ...base, helper: "Pat Jones" });
    expect(a).toContain("Pat Jones will go with Dana Smith");
    expect(a).toContain("meet at 8:15 AM");
    expect(a).toContain("- Take notes on what the judge says");
    expect(a).toContain("- Speak for me to the judge");
    expect(a).toContain("La. R.S. 37:212–213");
  });
});
