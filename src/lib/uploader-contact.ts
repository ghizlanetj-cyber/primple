import { z } from "zod";
export type UploaderContact = { name: string; email: string; phone: string };

/** Customer-supplied contact is for follow-up, never proof of identity. */
export function normalizePhone(raw: string): string | null {
  const value = String(raw ?? "").trim();
  if (!/^\+?[\d\s().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return value.startsWith("+")
    ? "+" + digits
    : digits.startsWith("00")
      ? "+" + digits.slice(2)
      : digits;
}
const emailSchema = z
  .string()
  .trim()
  .max(160)
  .email()
  .transform((v) => v.toLowerCase());
export const uploaderContactSchema = z.object({
  name: z.string().trim().min(2, "name").max(120, "name"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => normalizePhone(v) !== null, "phone")
    .transform((v) => normalizePhone(v)!),
});
export function parseUploaderContact(input: unknown): UploaderContact {
  const result = uploaderContactSchema.safeParse(input);
  if (result.success) return result.data;
  const field = result.error.issues[0]?.path[0];
  throw new Error(
    field === "email"
      ? "Enter a valid email address."
      : field === "phone"
        ? "Enter a valid phone number."
        : "Enter your full name.",
  );
}
export function contactLinks(email: string | null | undefined, phone: string | null | undefined) {
  const e = emailSchema.safeParse(email);
  const p = normalizePhone(phone ?? "");
  const digits = p?.replace(/\D/g, "") ?? "";
  const wa = p?.startsWith("+") ? digits : /^0\d{9}$/.test(digits) ? "212" + digits.slice(1) : null;
  return {
    mailto: e.success ? "mailto:" + encodeURIComponent(e.data).replace(/%40/g, "@") : null,
    tel: p ? "tel:" + p : null,
    whatsapp: wa && wa.length >= 8 ? "https://wa.me/" + wa : null,
  };
}
export type ContactSource = "order" | "guest_form" | "account" | "none";
export type ResolvedContact = {
  source: ContactSource;
  name: string | null;
  email: string | null;
  phone: string | null;
};
export function resolveContact(input: {
  order?: { name?: string | null; email?: string | null; phone?: string | null } | null;
  upload?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
  } | null;
  account?: { name?: string | null; email?: string | null } | null;
}): ResolvedContact {
  const clean = (v: string | null | undefined) => v?.trim() || null;
  const o = input.order,
    u = input.upload,
    a = input.account;
  if (o && (clean(o.email) || clean(o.phone)))
    return { source: "order", name: clean(o.name), email: clean(o.email), phone: clean(o.phone) };
  if (u?.source === "guest_form" && (clean(u.email) || clean(u.phone)))
    return {
      source: "guest_form",
      name: clean(u.name),
      email: clean(u.email),
      phone: clean(u.phone),
    };
  if (clean(a?.email))
    return { source: "account", name: clean(a?.name), email: clean(a?.email), phone: null };
  return { source: "none", name: clean(o?.name), email: null, phone: null };
}

