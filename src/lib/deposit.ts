/**
 * Print orders only.
 * Full: card (online), bank transfer / Cash Plus (manual, staff-confirmed).
 * Cash on delivery: 50% advance by card, transfer or Cash Plus + 50% cash to the courier.
 */
export const CARD_METHOD = "card_youcanpay";
export const BANK_FULL_METHOD = "bank_transfer";
export const CASHPLUS_FULL_METHOD = "cashplus";
/** COD with a 50% card advance (historic name kept for existing orders). */
export const DEPOSIT_METHOD = "deposit_50_cod";
export const BANK_ADVANCE_METHOD = "cod_advance_bank";
export const CASHPLUS_ADVANCE_METHOD = "cod_advance_cashplus";
/** Legacy: earlier 50% bank-transfer advance. Treated like BANK_ADVANCE_METHOD. */
export const BANK_METHOD = "bank_transfer_50";
/** Manual order waiting for staff to verify the transfer / Cash Plus payment. */
export const AWAITING_TRANSFER = "awaiting_transfer";

export const PRINT_METHODS = [
  CARD_METHOD,
  BANK_FULL_METHOD,
  CASHPLUS_FULL_METHOD,
  DEPOSIT_METHOD,
  BANK_ADVANCE_METHOD,
  CASHPLUS_ADVANCE_METHOD,
  BANK_METHOD,
] as const;
export type PrintPaymentMethod = (typeof PRINT_METHODS)[number];

export const MANUAL_METHODS: readonly string[] = [
  BANK_FULL_METHOD,
  CASHPLUS_FULL_METHOD,
  BANK_ADVANCE_METHOD,
  CASHPLUS_ADVANCE_METHOD,
  BANK_METHOD,
];
const HALF_METHODS: readonly string[] = [DEPOSIT_METHOD, BANK_ADVANCE_METHOD, CASHPLUS_ADVANCE_METHOD, BANK_METHOD];

export function isPrintMethod(m: unknown): m is PrintPaymentMethod {
  return typeof m === "string" && (PRINT_METHODS as readonly string[]).includes(m);
}
export function isManualMethod(m: string | null | undefined): boolean {
  return Boolean(m) && MANUAL_METHODS.includes(m as string);
}
export function isCashPlusMethod(m: string | null | undefined): boolean {
  return m === CASHPLUS_FULL_METHOD || m === CASHPLUS_ADVANCE_METHOD;
}
export function isHalfMethod(m: string | null | undefined): boolean {
  return Boolean(m) && HALF_METHODS.includes(m as string);
}

/** Amount due before production, in centimes. Anything unknown pays in full. */
export function onlineAmountCents(totalCents: number, method: string | null | undefined): number {
  return isHalfMethod(method) ? Math.ceil(totalCents / 2) : totalCents;
}

export function splitAmounts(total: number, method: string) {
  const totalCents = Math.round(total * 100);
  const due = onlineAmountCents(totalCents, method);
  return { dueNow: due / 100, balance: (totalCents - due) / 100 };
}
