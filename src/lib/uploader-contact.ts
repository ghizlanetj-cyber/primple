import { z } from "zod";

/**
 * Contact a guest gives before uploading artwork. Customer-supplied and
 * unverified: used only so the team can follow up on the file.
 */
export type UploaderContact = { name: string; email: string; phone: string };

/** Keeps a leading + and digits only. Returns null when not a plausible phone number. */
export function normalizePhone(raw: string): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed || /[^\d\s+().-]/.test(trimmed)) return null;
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return plus ? `+${digits}` : digits;
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export const uploaderContactSchema = z.object({
  name: z.string().trim().min(2, "name").max(120, "name"),
  email: z
    .string()
    .trim()
    .max(160, "email")
    .transform((v) => v.toLowerCase())
    .refine((v) => EMAIL.test(v), "email"),
  phone: z
    .string()
    .trim()
    .max(40, "phone")
    .refine((v) => normalizePhone(v) !== null, "phone")
    .transform((v) => normalizePhone(v) as string),
});

export function parseUploaderContact(input: unknown): UploaderContact {
  const result = uploaderContactSchema.safeParse(input);
  if (!result.success) {
    const field = result.error.issues[0]?.message ?? "contact";
    throw new Error(
      field === "email"
        ? "Enter a valid email address."
        : field === "phone"
          ? "Enter a valid phone number."
          : "Enter your full name.",
    );
  }
  return result.data;
}

/** Safe mailto/tel/WhatsApp targets; null when the value cannot be used. */
export function contactLinks(email: string | null | undefined, phone: string | null | undefined) {
  const e = String(email ?? "").trim().toLowerCase();
  const p = phone ? normalizePhone(phone) : null;
  // WhatsApp wants international digits; Moroccan local 0XXXXXXXXX becomes 212XXXXXXXXX.
  let wa: string | null = null;
  if (p) {
    const digits = p.replace(/\D/g, "");
    wa = p.startsWith("+") ? digits : /^0\d{9}$/.test(digits) ? `212${digits.slice(1)}` : digits.startsWith("00") ? digits.slice(2) : null;
  }
  return {
    mailto: EMAIL.test(e) ? `mailto:${encodeURIComponent(e).replace(/%40/g, "@")}` : null,
    tel: p ? `tel:${p}` : null,
    whatsapp: wa && wa.length >= 8 ? `https://wa.me/${wa}` : null,
  };
}

export type ContactSource = "order" | "guest_form" | "account" | "none";

/**
 * Picks the contact staff should use for a file or order: the order's own
 * contact first, then the guest upload form, then the account profile.
 * Returns "none" when nothing was ever collected; never guesses.
 */
export function resolveContact(input: {
  order?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  upload?: { name?: string | null; email?: string | null; phone?: string | null; source?: string | null } | null;
  account?: { name?: string | null; email?: string | null } | null;
}): { source: ContactSource; name: string | null; email: string | null; phone: string | null } {
  const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
  const o = input.order;
  if (o && (clean(o.email) || clean(o.phone))) {
    return { source: "order", name: clean(o.name), email: clean(o.email), phone: clean(o.phone) };
  }
  const u = input.upload;
  if (u && u.source === "guest_form" && (clean(u.email) || clean(u.phone))) {
    return { source: "guest_form", name: clean(u.name), email: clean(u.email), phone: clean(u.phone) };
  }
  const a = input.account;
  if (a && clean(a.email)) return { source: "account", name: clean(a.name), email: clean(a.email), phone: null };
  return { source: "none", name: null, email: null, phone: null };
}
