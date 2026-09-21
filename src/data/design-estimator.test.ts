import { describe, expect, it } from "vitest";

import {
  DESIGN_HOURLY_RATE,
  designBriefEstimate,
  designDeliverableHours,
  designDeliverables,
  estimateDesignHours,
  type DesignBriefInput,
} from "@/data/design-service";

const base: DesignBriefInput = {
  deliverable: "adaptation",
  hasSourceFile: true,
  formats: 1,
  pages: 1,
  brief: "Short brief",
  urgent: false,
};

describe("design estimator", () => {
  it("uses the documented base hours for every deliverable", () => {
    for (const deliverable of designDeliverables) {
      expect(estimateDesignHours({ ...base, deliverable })).toBe(
        designDeliverableHours[deliverable],
      );
    }
  });

  it("adds an hour for a long brief and two for a very long one", () => {
    expect(estimateDesignHours({ ...base, brief: "x".repeat(241) })).toBe(2);
    expect(estimateDesignHours({ ...base, brief: "x".repeat(601) })).toBe(3);
  });

  it("adds up to three hours for extra formats and extra pages", () => {
    expect(estimateDesignHours({ ...base, formats: 3 })).toBe(3);
    expect(estimateDesignHours({ ...base, formats: 20 })).toBe(4);
    expect(estimateDesignHours({ ...base, pages: 5 })).toBe(2);
    expect(estimateDesignHours({ ...base, pages: 13 })).toBe(4);
    expect(estimateDesignHours({ ...base, pages: 100 })).toBe(4);
  });

  it("adds an hour without a source file and an hour when urgent", () => {
    expect(estimateDesignHours({ ...base, hasSourceFile: false })).toBe(2);
    expect(estimateDesignHours({ ...base, urgent: true })).toBe(2);
    expect(estimateDesignHours({ ...base, hasSourceFile: false, urgent: true })).toBe(3);
  });

  it("always clamps between 1 and 10 hours", () => {
    expect(
      estimateDesignHours({
        deliverable: "packaging",
        hasSourceFile: false,
        formats: 10,
        pages: 40,
        brief: "x".repeat(900),
        urgent: true,
      }),
    ).toBe(10);
    expect(estimateDesignHours({ ...base, formats: 0, pages: 0 })).toBe(1);
  });

  it("prices exactly 100 MAD an hour with no delivery", () => {
    const quote = designBriefEstimate({ ...base, deliverable: "brochure" });
    expect(quote.hours).toBe(5);
    expect(quote.subtotal).toBe(5 * DESIGN_HOURLY_RATE);
    expect(quote.delivery).toBe(0);
    expect(quote.total).toBe(quote.subtotal);
  });
});
