/** Print orders only. Card = full online; COD = 50% card online + 50% cash; bank = 50% transfer + 50% cash. */
export const DEPOSIT_METHOD = "deposit_50_cod";
export const CARD_METHOD = "card_youcanpay";
export const BANK_METHOD = "bank_transfer_50";
/** Bank-transfer order waiting for staff to verify the transfer. */
export const AWAITING_TRANSFER = "awaiting_transfer";

export type PrintPaymentMethod = typeof DEPOSIT_METHOD | typeof CARD_METHOD | typeof BANK_METHOD;

/** Advance due before production, in centimes. Anything unknown pays in full. */
export function onlineAmountCents(totalCents: number, method: string | null | undefined): number {
  if (method !== DEPOSIT_METHOD && method !== BANK_METHOD) return totalCents;
  return Math.ceil(totalCents / 2);
}

export function splitAmounts(total: number, method: PrintPaymentMethod) {
  const totalCents = Math.round(total * 100);
  const due = onlineAmountCents(totalCents, method);
  return { dueNow: due / 100, balance: (totalCents - due) / 100 };
}
