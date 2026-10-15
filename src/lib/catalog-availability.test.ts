import { describe, expect, it } from "vitest";
import { isUnavailable } from "./catalog-availability";
describe("pack constituent availability", () => {
  it("blocks a pack containing an unavailable canonical product", () => {
    const rows = [{ kind: "product", slug: "business-cards", available: false }];
    expect(isUnavailable(rows, "pack", "launch")).toBe(true);
    expect(isUnavailable(rows, "product", "flyers")).toBe(false);
  });
  it("respects pack overrides and empty defaults", () => {
    expect(
      isUnavailable([{ kind: "pack", slug: "launch", available: false }], "pack", "launch"),
    ).toBe(true);
    expect(isUnavailable([], "pack", "launch")).toBe(false);
    expect(
      isUnavailable([{ kind: "product", slug: "flyers", available: true }], "pack", "launch"),
    ).toBe(false);
  });
});
