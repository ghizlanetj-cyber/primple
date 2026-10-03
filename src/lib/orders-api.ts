import { orderTotals } from "@/data/pricing";
import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/store/cart";
import type { OrderStage } from "@/data/orders";
import { CARD_METHOD, splitAmounts, type PrintPaymentMethod } from "@/lib/deposit";


export type OrderItemRecord = {
  slug: string;
  name: string;
  quantity: number;
  config: string;
  /** Exact configuration, so the server can re-price the order independently. */
  selection?: Record<string, string>;
  unitPrice: number;
  subtotal: number;
  printer: string;
  productionDays: number;
};

export type OrderRecord = {
  id: string;
  reference: string;
  status: OrderStage;
  items: OrderItemRecord[];
  subtotal: number;
  delivery: number;
  total: number;
  depositAmount: number;
  balanceAmount: number;
  depositPaid: boolean;
  paymentStatus: "unpaid" | "paid" | "failed";
  city: string | null;
  /** Kept for backend compatibility with a future printer-selection update. */
  printer: string | null;
  expectedAt: string | null;
  createdAt: string;
  customerName: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
};

export type DeliveryDetails = {
  name: string;
  company?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
};

/** Primple payment terms: full payment by card in MAD via YouCan Pay. */
const PRIMPLE_PRODUCTION = "Primple";

export function itemConfigLabel(item: CartItem) {
  return item.labels.map((l) => l.value).join(" · ");
}

function toRecord(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row["id"]),
    reference: String(row["reference"]),
    status: String(row["status"]) as OrderStage,
    items: (row["items"] as OrderItemRecord[]) ?? [],
    subtotal: Number(row["subtotal"] ?? 0),
    delivery: Number(row["delivery"] ?? 0),
    total: Number(row["total"] ?? 0),
    depositAmount: Number(row["deposit_amount"] ?? 0),
    balanceAmount: Number(row["balance_amount"] ?? 0),
    depositPaid: Boolean(row["deposit_paid"]),
    paymentStatus: (row["payment_status"] as "unpaid" | "paid" | "failed") ?? "unpaid",
    city: (row["city"] as string) ?? null,
    printer: (row["printer"] as string) ?? null,
    expectedAt: (row["expected_at"] as string) ?? null,
    createdAt: String(row["created_at"]),
    customerName: (row["contact_name"] as string) ?? null,
    company: (row["company"] as string) ?? null,
    email: (row["email"] as string) ?? null,
    phone: (row["phone"] as string) ?? null,
    address: (row["address"] as string) ?? null,
    postcode: (row["postcode"] as string) ?? null,
  };
}

export async function listMyOrders(): Promise<OrderRecord[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toRecord(row as Record<string, unknown>));
}

export async function createOrder(input: {
  userId: string;
  items: CartItem[];
  totals: { subtotal: number; delivery: number; total: number };
  details: DeliveryDetails;
  paymentMethod?: PrintPaymentMethod;
}): Promise<OrderRecord> {
  const reference = `PRM-${Math.floor(10000 + Math.random() * 89999)}`;
  const maxDays = input.items.reduce((m, i) => Math.max(m, i.deliveryMax || i.productionDays), 5);
  const expected = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);
  const method: PrintPaymentMethod = input.paymentMethod ?? CARD_METHOD;
  // Reprice from the catalog; browser-held totals are never saved as-is.
  const priced = orderTotals(
    input.items.map((i) => ({ slug: i.slug, quantity: i.quantity, selection: i.selection })),
  );
  if (!priced) throw new Error("One of the items can no longer be ordered. Please review your cart.");
  const totals = {
    subtotal: priced.subtotalCents / 100,
    delivery: priced.deliveryCents / 100,
    total: priced.totalCents / 100,
  };
  // Display only: the server re-prices and rewrites these before any charge.
  const split = splitAmounts(totals.total, method);

  const payload = {
    user_id: input.userId,
    reference,
    status: "Order placed",
    items: input.items.map<OrderItemRecord>((i, index) => ({
      slug: i.slug,
      name: i.name,
      quantity: i.quantity,
      config: itemConfigLabel(i),
      selection: i.selection,
      unitPrice: priced.quotes[index]!.unitPrice,
      subtotal: priced.quotes[index]!.subtotal,
      printer: PRIMPLE_PRODUCTION,
      productionDays: i.productionDays,
    })),
    subtotal: totals.subtotal,
    delivery: totals.delivery,
    total: totals.total,
    deposit_amount: split.dueNow,
    balance_amount: split.balance,
    deposit_paid: false,
    payment_method: method,
    contact_name: input.details.name,
    company: input.details.company ?? null,
    email: input.details.email,
    phone: input.details.phone,
    address: input.details.address,
    city: input.details.city,
    postcode: input.details.postcode,
    printer: PRIMPLE_PRODUCTION,
    expected_at: expected.toISOString().slice(0, 10),
  };

  const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
  if (error) throw error;
  return toRecord(data as Record<string, unknown>);
}
