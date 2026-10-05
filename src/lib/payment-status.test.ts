import { describe, expect, it } from "vitest";

import {
  dashboardOrderPath,
  pollDelay,
  safeInternalPath,
  verifyView,
  VERIFY_TIMEOUT_MS,
} from "./payment-status";

describe("verifyView", () => {
  it("confirms only on server paid status", () => {
    expect(verifyView("paid", 0)).toBe("confirmed");
    expect(verifyView("pending", 0)).toBe("verifying");
    expect(verifyView(null, 0)).toBe("verifying");
  });
  it("reports failure from the server", () => {
    expect(verifyView("failed", 0)).toBe("failed");
  });
  it("switches to delayed after the timeout but never to failed", () => {
    expect(verifyView("pending", VERIFY_TIMEOUT_MS)).toBe("delayed");
    expect(verifyView("pending", VERIFY_TIMEOUT_MS * 10)).toBe("delayed");
  });
  it("a late paid status still confirms", () => {
    expect(verifyView("paid", VERIFY_TIMEOUT_MS * 10)).toBe("confirmed");
  });
  it("keeps polling while pending, stops when settled", () => {
    expect(pollDelay("verifying")).toBeGreaterThan(0);
    expect(pollDelay("delayed")).toBeGreaterThan(pollDelay("verifying")!);
    expect(pollDelay("confirmed")).toBeNull();
    expect(pollDelay("failed")).toBeNull();
  });
});

describe("safeInternalPath", () => {
  it("keeps same-origin paths with query", () => {
    expect(safeInternalPath("/dashboard?order=PRM-1234&paid=1")).toBe("/dashboard?order=PRM-1234&paid=1");
  });
  it("rejects external and protocol-relative targets", () => {
    expect(safeInternalPath("//evil.com")).toBe("/dashboard");
    expect(safeInternalPath("https://evil.com")).toBe("/dashboard");
    expect(safeInternalPath("/\\evil.com")).toBe("/dashboard");
    expect(safeInternalPath(undefined)).toBe("/dashboard");
  });
});

describe("dashboardOrderPath", () => {
  it("selects the order and flags the payment", () => {
    expect(dashboardOrderPath("PRM-1234")).toBe("/dashboard?order=PRM-1234&paid=1");
    expect(dashboardOrderPath("PRM-1234", false)).toBe("/dashboard?order=PRM-1234");
  });
});
