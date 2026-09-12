import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/store/cart";
import type { OrderStage } from "@/data/orders";

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
  printer: string | null;
  expectedAt: string | null;
  createdAt: string;
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

export function splitPayment(total: number) {
  const deposit = Math.round(total * DEPOSIT_RATE * 100) / 100;
  return { deposit, balance: Math.round((total - deposit) * 100) / 100 };
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
  };
}

export async function listMyOrders(): Promise<OrderRecord[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
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
      printer: i.printer ?? "Primple partner network",
      productionDays: i.productionDays,
    })),
    subtotal: input.totals.subtotal,
    delivery: input.totals.delivery,
    total: input.totals.total,
    deposit_amount: deposit,
    balance_amount: balance,
    deposit_paid: true,
    payment_method: "deposit_50_cod_50",
    contact_name: input.details.name,
    company: input.details.company ?? null,
    email: input.details.email,
    phone: input.details.phone,
    address: input.details.address,
    city: input.details.city,
    postcode: input.details.postcode,
    printer: input.items[0]?.printer ?? "Primple partner network",
    expected_at: expected.toISOString().slice(0, 10),
  };

  const { data, error } = await supabase.from("orders").insert(payload).select("*").single();
  if (error) throw error;
  return toRecord(data as Record<string, unknown>);
}
