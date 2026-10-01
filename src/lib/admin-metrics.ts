/** Pure admin aggregations (no secrets, unit-tested). */
export type OrderMoney = {
  total: number;
  deposit_amount: number;
  balance_amount: number;
  payment_status: string;
  deposit_paid: boolean;
  status: string;
  email: string | null;
  guest_email: string | null;
  user_id: string | null;
  created_at: string;
};

export function isConfirmed(o: Pick<OrderMoney, "payment_status" | "deposit_paid">) {
  return o.payment_status === "paid" || o.deposit_paid;
}

/** Money actually collected (online or staff-confirmed), and cash still due at delivery. */
export function moneyOf(o: OrderMoney) {
  if (!isConfirmed(o)) return { orderValue: 0, collected: 0, balanceDue: 0 };
  const total = Number(o.total) || 0;
  const balance = Math.max(0, Number(o.balance_amount) || 0);
  const delivered = o.status === "Delivered";
  const collectedNow = balance > 0 ? Number(o.deposit_amount) || 0 : total;
  return {
    orderValue: total,
    collected: delivered ? total : collectedNow,
    balanceDue: delivered ? 0 : balance,
  };
}

export function summarize(orders: OrderMoney[]) {
  const s = {
    orders: orders.length,
    confirmed: 0,
    orderValue: 0,
    collected: 0,
    balanceDue: 0,
    pendingPayment: 0,
    inProduction: 0,
    completed: 0,
  };
  for (const o of orders) {
    const m = moneyOf(o);
    s.orderValue += m.orderValue;
    s.collected += m.collected;
    s.balanceDue += m.balanceDue;
    if (isConfirmed(o)) s.confirmed++;
    else s.pendingPayment++;
    if (["Artwork approved", "In production", "Quality check"].includes(o.status)) s.inProduction++;
    if (["Shipped", "Delivered"].includes(o.status)) s.completed++;
  }
  for (const k of ["orderValue", "collected", "balanceDue"] as const)
    s[k] = Math.round(s[k] * 100) / 100;
  return s;
}

/** Groups orders by normalized email (falls back to user id), including guest orders. */
export function customersFrom(orders: (OrderMoney & { contact_name?: string | null })[]) {
  const map = new Map<
    string,
    {
      key: string;
      email: string | null;
      name: string | null;
      userIds: Set<string>;
      orders: number;
      value: number;
      collected: number;
      last: string;
    }
  >();
  for (const o of orders) {
    const email = (o.email ?? o.guest_email ?? "").trim().toLowerCase() || null;
    const key = email ?? `user:${o.user_id ?? "unknown"}`;
    const c = map.get(key) ?? {
      key,
      email,
      name: o.contact_name ?? null,
      userIds: new Set<string>(),
      orders: 0,
      value: 0,
      collected: 0,
      last: o.created_at,
    };
    if (o.user_id) c.userIds.add(o.user_id);
    c.orders++;
    const m = moneyOf(o);
    c.value += m.orderValue;
    c.collected += m.collected;
    if (o.created_at > c.last) c.last = o.created_at;
    if (!c.name && o.contact_name) c.name = o.contact_name;
    map.set(key, c);
  }
  return [...map.values()]
    .map((c) => ({ ...c, userIds: [...c.userIds] }))
    .sort((a, b) => b.last.localeCompare(a.last));
}

/** Admin operational stage → existing customer-visible stage (null = leave unchanged). */
export const OPS_TO_CUSTOMER: Record<string, string | null> = {
  new: null,
  payment_confirmed: null,
  file_verification: "Order placed",
  bat_approved: "Artwork approved",
  in_production: "In production",
  finishing: "Quality check",
  ready: "Quality check",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: null,
  refunded: null,
};
export const OPS_STAGES = Object.keys(OPS_TO_CUSTOMER);
