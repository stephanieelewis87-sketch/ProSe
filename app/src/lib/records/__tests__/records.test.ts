import { describe, expect, it } from "vitest";
import { recordTitle, timeline, type MedicalRecord } from "../store";
import { crc32, zip } from "../zip";

const rec = (over: Partial<MedicalRecord>): MedicalRecord => ({
  id: "x", fileName: "a.pdf", mimeType: "application/pdf", size: 1, provider: "", date: "",
  kind: "chart", notes: "", addedAt: "", ...over,
});

describe("records", () => {
  it("orders by date of service with undated records last", () => {
    const t = timeline([rec({ id: "1", date: "" }), rec({ id: "2", date: "2026-03-12" }), rec({ id: "3", date: "2026-03-10" })]);
    expect(t.map((r) => r.id)).toEqual(["3", "2", "1"]);
  });

  it("titles a record for an exhibit list", () => {
    expect(recordTitle(rec({ provider: "Ochsner", date: "2026-03-10" }))).toBe("Ochsner, chart, 2026-03-10 (a.pdf)");
  });
});

describe("zip", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("writes a valid archive layout", () => {
    const out = zip([{ name: "a.txt", data: new TextEncoder().encode("hi") }]);
    const v = new DataView(out.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint32(out.length - 22, true)).toBe(0x06054b50);
    expect(v.getUint16(out.length - 22 + 10, true)).toBe(1);
  });
});
