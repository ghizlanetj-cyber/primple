import { fromCents } from "@/lib/format";

/** Booked design help, billed by the hour. Branding and logo creation are excluded. */
export const DESIGN_SERVICE_SLUG = "design-service";
export const DESIGN_HOURLY_RATE = 100;
export const DESIGN_MIN_HOURS = 1;
export const DESIGN_MAX_HOURS = 10;

export function clampDesignHours(hours: number) {
  const n = Math.floor(Number(hours));
  if (!Number.isFinite(n)) return DESIGN_MIN_HOURS;
  return Math.min(DESIGN_MAX_HOURS, Math.max(DESIGN_MIN_HOURS, n));
}

/** A digital service: never charged delivery. */
export function designServiceQuote(hours: number) {
  const billableHours = clampDesignHours(hours);
  const subtotal = fromCents(DESIGN_HOURLY_RATE * 100 * billableHours);
  return {
    hours: billableHours,
    unitPrice: DESIGN_HOURLY_RATE,
    subtotal,
    delivery: 0,
    total: subtotal,
  };
}

export const designServiceIncludes = [
  "Layout and artwork setup for printing",
  "Adapting an existing design to a new format",
  "Print-ready file preparation, bleed and colour checks",
  "Fixing a file that failed our pre-print check",
];

export const designServiceExcludes = [
  "Brand identity creation",
  "Logo design",
  "Brand strategy and naming",
];
