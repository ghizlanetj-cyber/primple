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

/** What the customer needs designed. Drives the base number of hours. */
export type DesignDeliverable =
  | "adaptation"
  | "print-file"
  | "flyer"
  | "menu"
  | "brochure"
  | "packaging"
  | "presentation"
  | "other";

export const designDeliverableHours: Record<DesignDeliverable, number> = {
  adaptation: 1,
  "print-file": 2,
  flyer: 2,
  menu: 4,
  brochure: 5,
  packaging: 6,
  presentation: 6,
  other: 3,
};

export const designDeliverableLabels: Record<DesignDeliverable, string> = {
  adaptation: "Adapt an existing design to a new format",
  "print-file": "Prepare a print-ready file",
  flyer: "Flyer or poster",
  menu: "Menu or price list",
  brochure: "Brochure or catalogue",
  packaging: "Packaging artwork",
  presentation: "Presentation",
  other: "Something else",
};

export const designDeliverables = Object.keys(designDeliverableHours) as DesignDeliverable[];

export type DesignBriefInput = {
  deliverable: DesignDeliverable;
  /** Does the customer already have an editable source file? */
  hasSourceFile: boolean;
  /** Number of final formats to deliver. */
  formats: number;
  /** Number of pages or sides in the final piece. */
  pages: number;
  brief: string;
  urgent: boolean;
};

function positive(value: number, fallback = 1) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Transparent estimate: one rule per answer, always between 1 and 10 hours,
 * so the customer sees exactly why the price moves.
 */
export function estimateDesignHours(input: DesignBriefInput): number {
  const base = designDeliverableHours[input.deliverable] ?? designDeliverableHours.other;
  const brief = String(input.brief ?? "");
  const briefExtra = brief.length > 600 ? 2 : brief.length > 240 ? 1 : 0;
  const formatExtra = Math.min(3, Math.max(0, positive(input.formats) - 1));
  const pageExtra = Math.min(3, Math.max(0, Math.ceil((positive(input.pages) - 1) / 4)));
  const sourceExtra = input.hasSourceFile ? 0 : 1;
  const urgentExtra = input.urgent ? 1 : 0;
  return clampDesignHours(base + briefExtra + formatExtra + pageExtra + sourceExtra + urgentExtra);
}

/** Estimated hours plus the matching price, at exactly 100 MAD an hour, no delivery. */
export function designBriefEstimate(input: DesignBriefInput) {
  return designServiceQuote(estimateDesignHours(input));
}


/**
 * "I need a design" add-on for a print product: design hours sized to the
 * product being printed, billed at the same 100 MAD/h. Stored on the cart line
 * as selection.design = "primple", so it can never be added twice.
 */
export const DESIGN_ADDON_KEY = "design";
export const DESIGN_ADDON_VALUE = "primple";

export const productDesignHours: Record<string, number> = {
  "business-cards": 1,
  stickers: 1,
  labels: 2,
  flyers: 2,
  posters: 2,
  "textile-printing": 2,
  "roll-up-banners": 3,
  "large-format": 3,
  menus: 4,
  brochures: 5,
  books: 5,
  packaging: 6,
};

export function hasDesignAddon(selection: Record<string, string> | undefined) {
  return selection?.[DESIGN_ADDON_KEY] === DESIGN_ADDON_VALUE;
}

export function designAddonQuote(slug: string) {
  const hours = clampDesignHours(productDesignHours[slug] ?? designDeliverableHours.other);
  return designServiceQuote(hours);
}
