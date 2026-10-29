import { describe, expect, it } from "vitest";
import { trafficSnapshot } from "./traffic-snapshot.server";
import { metricsFor, reportTotals } from "./traffic-report";
import { can } from "./admin-metrics";

describe("measured dashboard traffic", () => {
  it("agrees with measured daily visits and pageviews without counting channels twice", () => {
    expect(reportTotals(trafficSnapshot.daily)).toEqual({ visits: 254, pageviews: 499, pagesPerVisit: 1.96 });
    expect(metricsFor(trafficSnapshot, "all")?.visits).toBe(254);
  });
  it("preserves separate search and paid traffic measurements", () => {
    expect(metricsFor(trafficSnapshot, "search")?.visits).toBe(5);
    expect(metricsFor(trafficSnapshot, "ads")?.visits).toBe(39);
  });
  it("distinguishes unavailable channels from measured zero", () => {
    expect(metricsFor({ ...trafficSnapshot, channels: {} }, "ads")).toBeNull();
    expect(metricsFor(trafficSnapshot, "ai")?.visits).toBe(0);
  });
  it("keeps operational analytics accessible only to admin and team", () => {
    expect(can("admin", "read_ops")).toBe(true);
    expect(can("team", "read_ops")).toBe(true);
    expect(can("moderator", "read_ops")).toBe(false);
    expect(can(null, "read_ops")).toBe(false);
    expect(can("customer", "read_ops")).toBe(false);
  });
  it("handles no visits without an invented ratio", () => {
    expect(reportTotals([])).toEqual({ visits: 0, pageviews: 0, pagesPerVisit: 0 });
  });
});