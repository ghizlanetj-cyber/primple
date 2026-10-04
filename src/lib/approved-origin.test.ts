import { describe, expect, it } from "vitest";
import { approvedOrigin } from "@/lib/youcanpay.functions";

describe("approvedOrigin", () => {
  it("keeps Primple origins", () => {
    expect(approvedOrigin("https://www.primple.ma/checkout")).toBe("https://www.primple.ma");
    expect(approvedOrigin("https://primple.lovable.app")).toBe("https://primple.lovable.app");
  });
  it("replaces foreign or malformed origins", () => {
    expect(approvedOrigin("https://evil.example")).toBe("https://primple.ma");
    expect(approvedOrigin("http://primple.ma")).toBe("https://primple.ma");
    expect(approvedOrigin("nope")).toBe("https://primple.ma");
    expect(approvedOrigin(null)).toBe("https://primple.ma");
  });
});
