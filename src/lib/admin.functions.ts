import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only management API. Every handler checks the admin role server-side
 * before loading the service-role client. Moderators keep payment tools only.
 */
async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

const uuid = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(s)) throw new Error("Invalid id");
  return s;
};
const page = (v: unknown) => Math.min(Math.max(Math.floor(Number(v) || 0), 0), 500);
const text = (v: unknown, max = 4000) => (v == null || v === "" ? null : String(v).slice(0, max));

const ORDER_COLUMNS =
  "id, reference, status, items, subtotal, delivery, total, deposit_amount, balance_amount, deposit_paid, payment_method, payment_status, paid_at, contact_name, company, email, phone, address, city, postcode, expected_at, created_at, updated_at, user_id, guest_email";
const MONEY_COLUMNS =
  "total, deposit_amount, balance_amount, payment_status, deposit_paid, status, email, guest_email, user_id, created_at, contact_name";

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await requireAdmin(context);
    const { summarize } = await import("./admin-metrics");
    const { crmReadiness } = await import("./crm-worker.server");
    const [orders, unread, quotes, outbox, problems, enqueueErrors] = await Promise.all([
      db.from("orders").select(MONEY_COLUMNS).limit(5000),
      db
        .from("message_meta")
        .select("message_id", { count: "exact", head: true })
        .eq("is_read", false),
      db
        .from("message_meta")
        .select("message_id", { count: "exact", head: true })
        .in("classification", ["quote", "sales"])
        .not("quote_stage", "in", "(won,lost)"),
      db.from("crm_outbox").select("status"),
      db
        .from("crm_outbox")
        .select(
          "id, entity_type, source_table, source_id, status, attempts, last_error_code, last_error, next_attempt_at, updated_at",
        )
        .in("status", ["failed", "dead", "blocked"])
        .order("updated_at", { ascending: false })
        .limit(25),
      db
        .from("crm_enqueue_errors")
        .select("id, at, source_table, error_code")
        .order("at", { ascending: false })
        .limit(10),
    ]);
    const counts: Record<string, number> = {};
    for (const r of outbox.data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return {
      summary: {
        ...summarize(orders.data ?? []),
        unreadMessages: unread.count ?? 0,
        openQuotes: quotes.count ?? 0,
      },
      crm: {
        readiness: crmReadiness(),
        counts,
        problems: problems.data ?? [],
        enqueueErrors: enqueueErrors.data ?? [],
      },
    };
  });

export const adminOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { page?: number; orderId?: string; q?: string }) => ({
    page: page(i?.page),
    orderId: i?.orderId ? uuid(i.orderId) : null,
    q: String(i?.q ?? "")
      .replace(/[^\w@.\- ]/g, "")
      .slice(0, 60),
  }))
  .handler(async ({ data, context }) => {
    const db = await requireAdmin(context);
    const size = 20;
    let query = db
      .from("orders")
      .select(ORDER_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false });
    if (data.orderId) query = query.eq("id", data.orderId);
    else if (data.q)
      query = query.or(
        `reference.ilike.%${data.q}%,email.ilike.%${data.q}%,contact_name.ilike.%${data.q}%`,
      );
    const { data: rows, count } = await query.range(data.page * size, data.page * size + size - 1);
    const ids = (rows ?? []).map((r: any) => r.id);
    const [ops, files, crm] = ids.length
      ? await Promise.all([
          db.from("order_ops").select("*").in("order_id", ids),
          db
            .from("order_files")
            .select("id, order_id, file_name, mime_type, size_bytes, status, created_at")
            .in("order_id", ids),
          db
            .from("crm_outbox")
            .select("source_id, entity_type, status, last_error_code")
            .eq("source_table", "orders")
            .in("source_id", ids),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];
    const { stripSensitive } = await import("./crm-core");
    return {
      total: count ?? 0,
      pageSize: size,
      orders: (rows ?? []).map((o: any) => ({
        ...stripSensitive(o),
        ops: (ops.data ?? []).find((x: any) => x.order_id === o.id) ?? null,
        files: (files.data ?? []).filter((f: any) => f.order_id === o.id),
        crm: (crm.data ?? []).filter((c: any) => c.source_id === o.id),
      })),
    };
  });

export const adminUpdateOrderOps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: any) => {
    const { OPS_STAGES } = {
      OPS_STAGES: [
        "new",
        "payment_confirmed",
        "file_verification",
        "bat_approved",
        "in_production",
        "finishing",
        "ready",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
    };
    if (!OPS_STAGES.includes(i?.ops_stage)) throw new Error("Invalid stage");
    const cost = i?.cost_mad === "" || i?.cost_mad == null ? null : Number(i.cost_mad);
    if (cost != null && (!Number.isFinite(cost) || cost < 0)) throw new Error("Invalid cost");
    return {
      orderId: uuid(i.orderId),
      ops_stage: String(i.ops_stage),
      internal_notes: text(i.internal_notes),
      supplier: text(i.supplier, 200),
      cost_mad: cost,
      delivery_notes: text(i.delivery_notes),
      production_notes: text(i.production_notes),
    };
  })
  .handler(async ({ data, context }) => {
    const db = await requireAdmin(context);
    const { OPS_TO_CUSTOMER } = await import("./admin-metrics");
    const { orderId, ...fields } = data;
    const { error } = await db.from("order_ops").upsert({
      order_id: orderId,
      ...fields,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Could not save");
    const customerStage = OPS_TO_CUSTOMER[data.ops_stage];
    if (customerStage) await db.from("orders").update({ status: customerStage }).eq("id", orderId);
    return { ok: true };
  });

export const adminFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { fileId: string }) => ({ fileId: uuid(i?.fileId) }))
  .handler(async ({ data, context }) => {
    const db = await requireAdmin(context);
    const { data: f } = await db
      .from("order_files")
      .select("bucket, path, order_id")
      .eq("id", data.fileId)
      .maybeSingle();
    if (!f || f.bucket !== "client-artwork") throw new Error("Unknown file");
    const { data: signed, error } = await db.storage
      .from("client-artwork")
      .createSignedUrl(f.path, 300);
    if (error) throw new Error("Could not sign");
    return { url: signed.signedUrl as string };
  });

export const adminCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await requireAdmin(context);
    const { customersFrom } = await import("./admin-metrics");
    const [orders, messages] = await Promise.all([
      db.from("orders").select(MONEY_COLUMNS).limit(5000),
      db.from("contact_messages").select("email").limit(5000),
    ]);
    const msgCount = new Map<string, number>();
    for (const m of messages.data ?? []) {
      const e = String(m.email ?? "").toLowerCase();
      msgCount.set(e, (msgCount.get(e) ?? 0) + 1);
    }
    return customersFrom(orders.data ?? [])
      .slice(0, 200)
      .map((c) => ({ ...c, messages: c.email ? (msgCount.get(c.email) ?? 0) : 0 }));
  });

export const adminMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { page?: number }) => ({ page: page(i?.page) }))
  .handler(async ({ data, context }) => {
    const db = await requireAdmin(context);
    const size = 25;
    const { data: rows, count } = await db
      .from("contact_messages")
      .select("id, name, email, company, topic, message, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(data.page * size, data.page * size + size - 1);
    const ids = (rows ?? []).map((r: any) => r.id);
    const { data: meta } = ids.length
      ? await db.from("message_meta").select("*").in("message_id", ids)
      : { data: [] };
    return {
      total: count ?? 0,
      pageSize: size,
      messages: (rows ?? []).map((m: any) => ({
        ...m,
        meta: (meta ?? []).find((x: any) => x.message_id === m.id) ?? null,
      })),
    };
  });

export const adminUpdateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: any) => {
    const cls = ["unclassified", "quote", "sales", "support", "spam"];
    const stages = ["new", "qualified", "proposal", "negotiation", "won", "lost"];
    const out: Record<string, unknown> = { id: uuid(i?.id) };
    if (i?.classification !== undefined) {
      if (!cls.includes(i.classification)) throw new Error("Invalid classification");
      out["classification"] = i.classification;
    }
    if (i?.quote_stage !== undefined) {
      if (!stages.includes(i.quote_stage)) throw new Error("Invalid stage");
      out["quote_stage"] = i.quote_stage;
    }
    if (i?.is_read !== undefined) out["is_read"] = Boolean(i.is_read);
    return out as { id: string; classification?: string; quote_stage?: string; is_read?: boolean };
  })
  .handler(async ({ data, context }) => {
    const db = await requireAdmin(context);
    const { id, ...fields } = data;
    const { error } = await db.from("message_meta").upsert({
      message_id: id,
      ...fields,
      ...(fields.classification ? { classified_by: "admin" } : {}),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error("Could not save");
    return { ok: true };
  });

export const adminRetryCrmJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { id: string }) => ({ id: uuid(i?.id) }))
  .handler(async ({ data, context }) => {
    const db = await requireAdmin(context);
    const { error } = await db.rpc("crm_retry", { _id: data.id });
    if (error) throw new Error("Could not retry");
    return { ok: true };
  });

export const adminRunCrmWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { runCrmBatch } = await import("./crm-worker.server");
    return runCrmBatch({ limit: 10 });
  });
