import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/store/cart";
import type { OrderStage } from "@/data/orders";
import { fromCents, toCents } from "@/lib/format";

export type OrderItemRecord = {
  slug: string;
  name: string;
  quantity: number;
  config: string;
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

/** Primple payment terms: 50% advance now, 50% cash on delivery. */
export const DEPOSIT_RATE = 0.5;

/** Single Primple-managed production path until printer selection ships. */
export const PRIMPLE_PRODUCTION = "Primple";

/** Deposit rounded to the centime, balance taken by difference: deposit + balance === total. */
export function splitPayment(total: number) {
  const totalCents = toCents(total);
  const depositCents = Math.round(totalCents * DEPOSIT_RATE);
  return { deposit: fromCents(depositCents), balance: fromCents(totalCents - depositCents) };
}

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
}): Promise<OrderRecord> {
  const { deposit, balance } = splitPayment(input.totals.total);
  const reference = `PRM-${Math.floor(10000 + Math.random() * 89999)}`;
  const maxDays = input.items.reduce((m, i) => Math.max(m, i.deliveryMax || i.productionDays), 5);
  const expected = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);

  const payload = {
    user_id: input.userId,
    reference,
    status: "Order placed",
    items: input.items.map<OrderItemRecord>((i) => ({
      slug: i.slug,
      name: i.name,
      quantity: i.quantity,
      config: itemConfigLabel(i),
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
      printer: PRIMPLE_PRODUCTION,
      productionDays: i.productionDays,
    })),
    subtotal: input.totals.subtotal,
    delivery: input.totals.delivery,
    total: input.totals.total,
    deposit_amount: deposit,
    balance_amount: balance,
    deposit_paid: false,
    payment_method: "deposit_50_cod_50",
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
