/** Print orders only: 50% card deposit online, balance in cash at delivery. */
export const DEPOSIT_METHOD = "deposit_50_cod";
export const CARD_METHOD = "card_youcanpay";

export type PrintPaymentMethod = typeof DEPOSIT_METHOD | typeof CARD_METHOD;

/** Amount charged online, in centimes. Anything but the exact deposit method pays in full. */
export function onlineAmountCents(totalCents: number, method: string | null | undefined): number {
  if (method !== DEPOSIT_METHOD) return totalCents;
  return Math.ceil(totalCents / 2);
}

export function splitAmounts(total: number, method: PrintPaymentMethod) {
  const totalCents = Math.round(total * 100);
  const due = onlineAmountCents(totalCents, method);
  return { dueNow: due / 100, balance: (totalCents - due) / 100 };
}
