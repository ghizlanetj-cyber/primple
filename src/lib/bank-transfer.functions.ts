import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type StoredLine = { slug?: string; quantity?: number; selection?: Record<string, string> };

/** Server-verified total in centimes, re-priced from the catalog. */
async function verifiedTotalCents(order: { items: unknown; total: unknown }): Promise<number> {
  const { orderTotals } = await import("@/data/pricing");
  const lines = Array.isArray(order.items) ? (order.items as StoredLine[]) : [];
  const totals = orderTotals(
    lines.map((l) => ({ slug: String(l.slug), quantity: Number(l.quantity), selection: l.selection ?? {} })),
  );
  if (!totals) throw new Error("This order can no longer be priced. Please contact Primple.");
  return totals.totalCents;
}

async function isStaff(context: { supabase: any; userId: string }) {
  const [admin, moderator] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "moderator" }),
  ]);
  return Boolean(admin.data || moderator.data);
}

/** Puts a freshly created bank-transfer order into "awaiting verification" with server amounts. */
export const requestBankTransfer = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string; claimToken?: string }) => {
    const orderId = String(input?.orderId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error("Unknown order.");
    return { orderId, claimToken: String(input?.claimToken ?? "").trim() };
  })
  .handler(async ({ data }) => {
    const { optionalUserId, logPaymentEvent } = await import("./youcanpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { canPayOrder } = await import("./order-access");
    const { isManualMethod, AWAITING_TRANSFER, onlineAmountCents } = await import("./deposit");
    const userId = await optionalUserId(getRequest()?.headers.get("authorization") ?? null);

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, claim_token, reference, items, total, payment_method, payment_status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order || !canPayOrder(order, { userId, claimToken: data.claimToken || null })) {
      throw new Error("Unknown order.");
    }
    if (!isManualMethod(order.payment_method)) throw new Error("Unknown order.");
    if (order.payment_status !== "unpaid" && order.payment_status !== AWAITING_TRANSFER) {
      throw new Error("This order is already paid.");
    }

    const totalCents = await verifiedTotalCents(order);
    if (!Number.isFinite(totalCents) || totalCents <= 0) throw new Error("The order total is invalid.");
    const advanceCents = onlineAmountCents(totalCents, order.payment_method);

    await supabaseAdmin
      .from("orders")
      .update({
        total: totalCents / 100,
        deposit_amount: advanceCents / 100,
        balance_amount: (totalCents - advanceCents) / 100,
        payment_status: AWAITING_TRANSFER,
      })
      .eq("id", order.id)
      .in("payment_status", ["unpaid", AWAITING_TRANSFER]);

    await logPaymentEvent({ reference: order.reference, event: "bank_transfer_requested", ok: true });
    return { reference: order.reference, total: totalCents / 100, advance: advanceCents / 100, balance: (totalCents - advanceCents) / 100 };
  });

/** Staff-only list of bank-transfer orders waiting for verification. */
export const listPendingTransfers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isStaff(context))) return { allowed: false as const, orders: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { AWAITING_TRANSFER } = await import("./deposit");
    const { data } = await supabaseAdmin
      .from("orders")
      .select("id, reference, created_at, contact_name, total, deposit_amount, balance_amount, payment_method")
      .eq("payment_status", AWAITING_TRANSFER)
      .order("created_at", { ascending: false })
      .limit(100);
    return { allowed: true as const, orders: data ?? [] };
  });

/** Staff-only, idempotent: confirms the manual (transfer / Cash Plus) payment and releases production. */
export const confirmBankTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderId: string }) => {
    const orderId = String(input?.orderId ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error("Unknown order.");
    return { orderId };
  })
  .handler(async ({ data, context }) => {
    if (!(await isStaff(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logPaymentEvent } = await import("./youcanpay.server");
    const { AWAITING_TRANSFER, MANUAL_METHODS } = await import("./deposit");

    const { data: updated } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", deposit_paid: true, paid_at: new Date().toISOString() })
      .eq("id", data.orderId)
      .in("payment_method", [...MANUAL_METHODS])
      .eq("payment_status", AWAITING_TRANSFER)
      .select("reference, deposit_amount")
      .maybeSingle();

    if (!updated) return { confirmed: false as const, reason: "already_confirmed_or_not_pending" };
    await logPaymentEvent({
      reference: updated.reference,
      event: "bank_transfer_confirmed",
      ok: true,
      detail: `Manual payment ${updated.deposit_amount} MAD confirmed by staff ${context.userId}`,
    });
    return { confirmed: true as const, reference: updated.reference };
  });
