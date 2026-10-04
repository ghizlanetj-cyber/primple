import { describe, expect, it } from "vitest";
import { addWorkingDays, estimatedArrival } from "@/lib/delivery";

describe("delivery estimate", () => {
  it("skips weekends", () => {
    // Friday 2 Oct 2026 + 1 working day = Monday 5 Oct.
    expect(addWorkingDays(new Date("2026-10-02T10:00:00Z"), 1).toISOString().slice(0, 10)).toBe("2026-10-05");
  });
  it("adds production and delivery instead of taking the max", () => {
    // Monday + (3 production + 2 delivery) working days = next Monday.
    expect(estimatedArrival(new Date("2026-10-05T10:00:00Z"), 3, 2)).toBe("2026-10-12");
  });
});
