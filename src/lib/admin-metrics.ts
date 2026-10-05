/** Pure admin logic (no secrets, unit-tested). SQL `admin_order_money()` mirrors moneyOf exactly. */
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

/** A recorded cash collection at delivery (balance_collections row). */
export type BalanceCollection = { amount: number; remitted: boolean } | null | undefined;

export function isConfirmed(o: Pick<OrderMoney, "payment_status" | "deposit_paid">) {
  return o.payment_status === "paid" || o.deposit_paid;
}

/**
 * Money truth for one order. Order status never moves money: "Delivered" does not
 * mean the cash balance was collected or handed to Primple. Only a recorded
 * balance_collections row does (courier-held until remitted).
 */
export function moneyOf(o: OrderMoney, balance?: BalanceCollection) {
  if (!isConfirmed(o)) return { orderValue: 0, collected: 0, courierHeld: 0, balanceDue: 0 };
  const total = Number(o.total) || 0;
  const due = Math.max(0, Number(o.balance_amount) || 0);
  const online = due > 0 ? Number(o.deposit_amount) || 0 : total;
  if (due === 0) return { orderValue: total, collected: online, courierHeld: 0, balanceDue: 0 };
  if (!balance) {
    return { orderValue: total, collected: online, courierHeld: 0, balanceDue: o.status === "Cancelled" ? 0 : due };
  }
  const amount = Number(balance.amount) || 0;
  return balance.remitted
    ? { orderValue: total, collected: online + amount, courierHeld: 0, balanceDue: 0 }
    : { orderValue: total, collected: online, courierHeld: amount, balanceDue: 0 };
}

const round = (n: number) => Math.round(n * 100) / 100;

export function summarize(orders: (OrderMoney & { balance?: BalanceCollection })[]) {
  const s = {
    orders: orders.length,
    confirmed: 0,
    orderValue: 0,
    collected: 0,
    courierHeld: 0,
    balanceDue: 0,
    pendingPayment: 0,
    inProduction: 0,
    completed: 0,
  };
  for (const o of orders) {
    const m = moneyOf(o, o.balance);
    s.orderValue += m.orderValue;
    s.collected += m.collected;
    s.courierHeld += m.courierHeld;
    s.balanceDue += m.balanceDue;
    if (isConfirmed(o)) s.confirmed++;
    else s.pendingPayment++;
    if (["Artwork approved", "In production", "Quality check"].includes(o.status)) s.inProduction++;
    if (["Shipped", "Delivered"].includes(o.status)) s.completed++;
  }
  for (const k of ["orderValue", "collected", "courierHeld", "balanceDue"] as const) s[k] = round(s[k]);
  return s;
}

/** Normalized customer identity: lowercased trimmed email. */
export const identityOf = (email: string | null | undefined) => (email ?? "").trim().toLowerCase() || null;

/** Admin operational stage → existing customer-visible stage (null = leave unchanged). Mirrored in SQL. */
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
export const OPS_LABELS: Record<string, string> = {
  new: "Nouvelle",
  payment_confirmed: "Paiement confirmé",
  file_verification: "Vérification fichiers",
  bat_approved: "BAT validé",
  in_production: "En production",
  finishing: "Finitions",
  ready: "Prête",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};
export const QUOTE_STAGES = ["new", "qualified", "proposal", "negotiation", "won", "lost"] as const;
export const QUOTE_LABELS: Record<string, string> = {
  new: "Nouveau",
  qualified: "Qualifié",
  proposal: "Proposition",
  negotiation: "Négociation",
  won: "Gagné",
  lost: "Perdu",
};
export const CLASSIFICATIONS = ["unclassified", "quote", "sales", "support", "spam"] as const;
export const CLASS_LABELS: Record<string, string> = {
  unclassified: "Non classé",
  quote: "Devis",
  sales: "Commercial",
  support: "Support",
  spam: "Spam",
};

/** Staff capability matrix. Moderator stays payment-only; team is operational; admin has everything. */
export type StaffRole = "admin" | "team" | "moderator";
export type Capability =
  | "read_ops"
  | "write_ops"
  | "confirm_money"
  | "manage_team"
  | "manage_catalog"
  | "crm_actions"
  | "payments";
const MATRIX: Record<StaffRole, Capability[]> = {
  admin: ["read_ops", "write_ops", "confirm_money", "manage_team", "manage_catalog", "crm_actions", "payments"],
  team: ["read_ops", "write_ops"],
  moderator: ["payments"],
};
export function can(role: string | null | undefined, cap: Capability) {
  return Boolean(role && Object.hasOwn(MATRIX, role) && MATRIX[role as StaffRole].includes(cap));
}

/** CSV cell safe for spreadsheets: quotes always, neutralizes formula prefixes (= + - @ tab CR). */
export function csvCell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
export function toCsv(rows: unknown[][]) {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/** Strict ISO date range (inclusive start day, exclusive end day), max 3 years. */
export function dateRange(from?: string, to?: string) {
  const day = 86400000;
  const end = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? new Date(`${to}T00:00:00Z`).getTime() + day : Date.now() + day;
  const start = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? new Date(`${from}T00:00:00Z`).getTime() : end - 31 * day;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) throw new Error("Invalid range");
  if (end - start > 1100 * day) throw new Error("Range too long");
  return { from: new Date(start).toISOString(), to: new Date(end).toISOString() };
}
