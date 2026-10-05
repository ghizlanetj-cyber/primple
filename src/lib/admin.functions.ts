import { createServerFn } from "@tanstack/react-start";

import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { can, type Capability, type StaffRole } from "./admin-metrics";

/**
 * Internal team API. Every handler is authenticated, then freshly checks the
 * caller's capability through my_staff_role() (user-scoped client, RLS applies)
 * BEFORE the service-role client is loaded. Database functions re-check the
 * actor's role again, so a missed check here still cannot escalate.
 */
type Ctx = { supabase: SupabaseClient<Database>; userId: string };
async function requireStaff(context: Ctx, cap: Capability) {
  const { data, error } = await context.supabase.rpc("my_staff_role");
  if (error) throw new Error("Vérification des droits impossible");
  const role = (data ?? null) as StaffRole | null;
  if (!can(role, cap)) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return { db: supabaseAdmin, role: role as StaffRole };
}

const ERRORS: Record<string, string> = {
  forbidden: "Action non autorisée",
  not_found: "Élément introuvable",
  conflict: "Cet élément a été modifié entre-temps. Rechargez puis réessayez.",
  invalid_assignee: "Ce membre n'est pas actif dans l'équipe",
  invalid_stage: "Étape invalide",
  invalid_classification: "Classification invalide",
  advance_not_confirmed: "L'avance n'est pas encore confirmée",
  no_balance: "Aucun solde espèces sur cette commande",
  already_remitted: "Le solde a déjà été reversé",
  no_confirmed_user: "Aucun compte confirmé avec cet e-mail",
  invalid_role: "Rôle invalide",
  last_admin: "Impossible de retirer le dernier administrateur",
};
function fail(error: { message?: string } | null, fallback = "Erreur de base de données"): never {
  const key = Object.keys(ERRORS).find((k) => error?.message?.includes(k));
  throw new Error(key ? ERRORS[key] : fallback);
}
function must<T>(r: { data: T; error: { message?: string } | null }, what = "lecture"): T {
  if (r.error) fail(r.error, `Erreur de ${what}`);
  return r.data;
}

const obj = (i: unknown) => (i && typeof i === "object" ? (i as Record<string, unknown>) : {});
const uuid = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) throw new Error("Identifiant invalide");
  return s;
};
const optUuid = (v: unknown) => (v == null || v === "" ? null : uuid(v));
const pageOf = (v: unknown) => Math.min(Math.max(Math.floor(Number(v) || 0), 0), 100000);
const text = (v: unknown, max = 4000) => (v == null || v === "" ? null : String(v).slice(0, max));
const search = (v: unknown) =>
  String(v ?? "")
    .replace(/[%_\\]/g, "")
    .trim()
    .slice(0, 80);
const oneOf = <T extends string>(v: unknown, list: readonly T[]) =>
  v == null || v === "" ? null : list.includes(v as T) ? (v as T) : (() => { throw new Error("Filtre invalide"); })();
const isoDay = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

const ORDER_COLUMNS =
  "id, reference, status, items, subtotal, delivery, total, deposit_amount, balance_amount, deposit_paid, payment_method, payment_status, paid_at, contact_name, company, email, phone, address, city, postcode, printer, expected_at, created_at, updated_at, user_id, guest_email";
const PAGE = 25;
const ORDER_STATUSES = ["Order placed", "Artwork approved", "In production", "Quality check", "Shipped", "Delivered", "Cancelled"] as const;
const PAYMENT_STATUSES = ["unpaid", "awaiting_transfer", "paid", "failed", "refunded"] as const;

/* ---------- identity ---------- */

export const adminMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("my_staff_role");
    if (error) throw new Error("Vérification des droits impossible");
    const role = (data ?? null) as StaffRole | null;
    const email = typeof context.claims?.["email"] === "string" ? (context.claims["email"] as string) : null;
    return {
      role,
      email,
      caps: (["read_ops", "write_ops", "confirm_money", "manage_team", "manage_catalog", "crm_actions", "payments"] as Capability[]).filter((c) => can(role, c)),
    };
  });

/* ---------- overview, queue, reports ---------- */

export const adminReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ from: isoDay(obj(i)["from"]), to: isoDay(obj(i)["to"]) }))
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const { dateRange } = await import("./admin-metrics");
    const range = dateRange(data.from, data.to);
    const report = must(await db.rpc("admin_report", { _from: range.from, _to: range.to }), "rapport");
    return { range, report: report as unknown as Report };
  });

export type Report = {
  orders: number;
  confirmed: number;
  orderValue: number;
  collected: number;
  courierHeld: number;
  outstanding: number;
  quotes: number;
  late: number;
  byStatus: Record<string, number>;
  byPayment: Record<string, number>;
  byMethod: Record<string, number>;
  byProduction: Record<string, number>;
  byQuoteStage: Record<string, number>;
  daily: { day: string; orders: number; orderValue: number; collected: number }[];
};

export type ActionQueue = {
  unread: { id: string; name: string; topic: string | null; created_at: string }[];
  unreadCount: number;
  staleQuotes: { id: string; name: string; quote_stage: string; since: string }[];
  awaitingPayment: { id: string; reference: string; payment_method: string; created_at: string }[];
  awaitingPaymentCount: number;
  late: { id: string; reference: string; expected_at: string }[];
  missingFiles: { id: string; reference: string; created_at: string }[];
  courierCash: { id: string; reference: string; amount: number; recorded_at: string }[];
  crmProblems: number;
};

export const adminQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db, role } = await requireStaff(context, "read_ops");
    const q = must(await db.rpc("admin_action_queue"), "file d'actions") as unknown as ActionQueue;
    // CRM health is an admin concern only.
    return role === "admin" ? q : { ...q, crmProblems: 0 };
  });

export const adminRecentActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const [audit, orders] = await Promise.all([
      db.from("admin_audit_log").select("id, actor_id, action, entity_type, entity_key, changes, at").order("at", { ascending: false }).limit(15),
      db.from("orders").select("id, reference, contact_name, total, payment_status, created_at").order("created_at", { ascending: false }).limit(8),
    ]);
    return { audit: must(audit), orders: must(orders) };
  });

/* ---------- staff directory / team ---------- */

export const adminStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const rows = must(await db.rpc("admin_staff_directory"), "équipe");
    return rows ?? [];
  });

export const adminGrantMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = obj(i);
    const email = String(o["email"] ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error("E-mail invalide");
    const role = oneOf(o["role"], ["team", "admin"] as const);
    if (!role) throw new Error("Rôle invalide");
    return { email, role, name: text(o["name"], 120) };
  })
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "manage_team");
    const r = await db.rpc("admin_grant_member", { _actor: context.userId, _email: data.email, _role: data.role, _name: data.name ?? "" });
    if (r.error) fail(r.error);
    return { ok: true };
  });

export const adminRevokeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = obj(i);
    const role = oneOf(o["role"], ["team", "admin"] as const);
    if (!role) throw new Error("Rôle invalide");
    return { userId: uuid(o["userId"]), role };
  })
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "manage_team");
    const r = await db.rpc("admin_revoke_member", { _actor: context.userId, _target: data.userId, _role: data.role });
    if (r.error) fail(r.error);
    return { ok: true };
  });

/* ---------- orders ---------- */

export const adminOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = obj(i);
    return {
      page: pageOf(o["page"]),
      q: search(o["q"]),
      status: oneOf(o["status"], ORDER_STATUSES),
      payment: oneOf(o["payment"], PAYMENT_STATUSES),
      stage: oneOf(o["stage"], ["new", "payment_confirmed", "file_verification", "bat_approved", "in_production", "finishing", "ready", "shipped", "delivered", "cancelled", "refunded"] as const),
      assignee: optUuid(o["assignee"]),
      from: isoDay(o["from"]),
      to: isoDay(o["to"]),
    };
  })
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const day = 86400000;
    const ids = must(
      await db.rpc("admin_orders_page", {
        _q: data.q,
        _status: data.status as string,
        _payment: data.payment as string,
        _stage: data.stage as string,
        _assignee: data.assignee as string,
        _from: data.from ? new Date(`${data.from}T00:00:00Z`).toISOString() : (null as unknown as string),
        _to: data.to ? new Date(new Date(`${data.to}T00:00:00Z`).getTime() + day).toISOString() : (null as unknown as string),
        _limit: PAGE,
        _offset: data.page * PAGE,
      }),
      "commandes",
    ) ?? [];
    const total = Number(ids[0]?.total_count ?? 0);
    const list = ids.map((r) => r.order_id);
    if (!list.length) return { total, pageSize: PAGE, orders: [] };
    const [orders, ops, balances, files] = await Promise.all([
      db.from("orders").select("id, reference, status, total, deposit_amount, balance_amount, deposit_paid, payment_method, payment_status, contact_name, company, email, guest_email, expected_at, created_at").in("id", list),
      db.from("order_ops").select("order_id, ops_stage, assigned_to, version").in("order_id", list),
      db.from("balance_collections").select("order_id, amount, remitted").in("order_id", list),
      db.from("order_files").select("order_id").in("order_id", list),
    ]);
    const rows = must(orders) ?? [];
    const opsRows = must(ops) ?? [];
    const bal = must(balances) ?? [];
    const fileRows = must(files) ?? [];
    const { moneyOf } = await import("./admin-metrics");
    return {
      total,
      pageSize: PAGE,
      orders: list
        .map((id) => rows.find((r) => r.id === id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
        .map((o) => {
          const b = bal.find((x) => x.order_id === o.id);
          return {
            ...o,
            ops: opsRows.find((x) => x.order_id === o.id) ?? null,
            files: fileRows.filter((f) => f.order_id === o.id).length,
            money: moneyOf({ ...o, user_id: null }, b ?? null),
            balance: b ?? null,
          };
        }),
    };
  });

export const adminOrderDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: uuid(obj(i)["id"]) }))
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const order = must(await db.from("orders").select(ORDER_COLUMNS).eq("id", data.id).maybeSingle());
    if (!order) throw new Error("Commande introuvable");
    const [ops, files, balance, notes, history, crm] = await Promise.all([
      db.from("order_ops").select("*").eq("order_id", data.id).maybeSingle(),
      db.from("order_files").select("id, file_name, mime_type, size_bytes, status, created_at").eq("order_id", data.id).order("created_at"),
      db.from("balance_collections").select("amount, remitted, note, recorded_at").eq("order_id", data.id).maybeSingle(),
      db.from("admin_notes").select("id, body, author_id, created_at").eq("entity_type", "order").eq("entity_key", data.id).order("created_at", { ascending: false }),
      db.from("admin_audit_log").select("id, actor_id, action, changes, at").eq("entity_type", "order").eq("entity_key", data.id).order("at", { ascending: false }).limit(100),
      db.from("crm_outbox").select("entity_type, status, last_error_code, updated_at").eq("source_table", "orders").eq("source_id", data.id),
    ]);
    const { stripSensitive } = await import("./crm-core");
    const { moneyOf } = await import("./admin-metrics");
    const b = must(balance);
    return {
      order: stripSensitive(order),
      ops: must(ops),
      files: must(files) ?? [],
      balance: b,
      money: moneyOf(order, b),
      notes: must(notes) ?? [],
      history: must(history) ?? [],
      crm: must(crm) ?? [],
    };
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = obj(input);
    const f = obj(i["fields"]);
    const out: Record<string, unknown> = {};
    if (f["ops_stage"] !== undefined) {
      out["ops_stage"] = oneOf(f["ops_stage"], ["new", "payment_confirmed", "file_verification", "bat_approved", "in_production", "finishing", "ready", "shipped", "delivered", "cancelled", "refunded"] as const);
      if (!out["ops_stage"]) throw new Error("Étape invalide");
    }
    if (f["assigned_to"] !== undefined) out["assigned_to"] = optUuid(f["assigned_to"]);
    if (f["supplier"] !== undefined) out["supplier"] = text(f["supplier"], 200);
    if (f["cost_mad"] !== undefined) {
      const c = f["cost_mad"] === "" || f["cost_mad"] == null ? null : Number(f["cost_mad"]);
      if (c != null && (!Number.isFinite(c) || c < 0 || c > 10_000_000)) throw new Error("Coût invalide");
      out["cost_mad"] = c;
    }
    for (const k of ["delivery_notes", "production_notes"]) if (f[k] !== undefined) out[k] = text(f[k]);
    const version = i["version"] == null ? null : Math.floor(Number(i["version"]));
    return { orderId: uuid(i["orderId"]), version: Number.isFinite(version) ? version : null, fields: out };
  })
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "write_ops");
    const r = await db.rpc("admin_update_order_ops", {
      _actor: context.userId,
      _order: data.orderId,
      _expected: data.version as number,
      _f: data.fields as never,
    });
    if (r.error) fail(r.error, "Enregistrement impossible");
    return { ok: true, version: r.data };
  });

export const adminAddNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = obj(input);
    const type = oneOf(i["type"], ["order", "customer", "message"] as const);
    if (!type) throw new Error("Type invalide");
    const body = String(i["body"] ?? "").trim().slice(0, 4000);
    if (!body) throw new Error("Note vide");
    const key = type === "customer" ? String(i["key"] ?? "").trim().toLowerCase().slice(0, 254) : uuid(i["key"]);
    if (!key) throw new Error("Client invalide");
    return { type, key, body };
  })
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "write_ops");
    const r = await db.rpc("admin_add_note", { _actor: context.userId, _type: data.type, _key: data.key, _body: data.body });
    if (r.error) fail(r.error, "Note non enregistrée");
    return { ok: true };
  });

/** Cash balance collected at delivery. Admin only; amount is the stored server-verified balance. */
export const adminRecordBalance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = obj(input);
    return { orderId: uuid(i["orderId"]), remitted: i["remitted"] === true, note: text(i["note"], 500) };
  })
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "confirm_money");
    const r = await db.rpc("admin_record_balance", { _actor: context.userId, _order: data.orderId, _remitted: data.remitted, _note: data.note ?? "" });
    if (r.error) fail(r.error, "Enregistrement impossible");
    return { ok: true, amount: Number(r.data) };
  });

/** 5-minute signed URL for an order's artwork; ownership is the order association. */
export const adminFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ fileId: uuid(obj(i)["fileId"]) }))
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const f = must(await db.from("order_files").select("bucket, path, order_id").eq("id", data.fileId).maybeSingle());
    if (!f || f.bucket !== "client-artwork" || !f.order_id) throw new Error("Fichier introuvable");
    const { data: signed, error } = await db.storage.from("client-artwork").createSignedUrl(f.path, 300);
    if (error || !signed) throw new Error("Lien de téléchargement indisponible");
    return { url: signed.signedUrl as string };
  });

/* ---------- customers ---------- */

export const adminCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ page: pageOf(obj(i)["page"]), q: search(obj(i)["q"]) }))
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const rows = must(await db.rpc("admin_customers", { _q: data.q, _limit: PAGE, _offset: data.page * PAGE }), "clients") ?? [];
    return { total: Number(rows[0]?.total_count ?? 0), pageSize: PAGE, customers: rows };
  });

export const adminCustomerDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const key = String(obj(i)["key"] ?? "").trim().toLowerCase();
    if (!/^[^\s@,()]+@[^\s@,()]+$/.test(key) || key.length > 254) throw new Error("Client invalide");
    return { key };
  })
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const k = data.key;
    // Exact (case-insensitive) identity matches only: no wildcards, no cross-customer bleed.
    const [profiles, byEmail, byGuest, messages, notes] = await Promise.all([
      db.from("profiles").select("id, full_name, email, created_at").ilike("email", k),
      db.from("orders").select("id, reference, status, total, deposit_amount, balance_amount, deposit_paid, payment_status, payment_method, created_at, contact_name, company, phone, city, user_id, email, guest_email").ilike("email", k),
      db.from("orders").select("id, reference, status, total, deposit_amount, balance_amount, deposit_paid, payment_status, payment_method, created_at, contact_name, company, phone, city, user_id, email, guest_email").ilike("guest_email", k),
      db.from("contact_messages").select("id, name, company, topic, message, created_at").ilike("email", k).order("created_at", { ascending: false }),
      db.from("admin_notes").select("id, body, author_id, created_at").eq("entity_type", "customer").eq("entity_key", k).order("created_at", { ascending: false }),
    ]);
    const prof = must(profiles) ?? [];
    const map = new Map<string, NonNullable<ReturnType<typeof must<typeof byEmail.data>>>[number]>();
    for (const o of [...(must(byEmail) ?? []), ...(must(byGuest) ?? [])]) map.set(o.id, o);
    // Orders of the matched account(s) placed under another contact email.
    if (prof.length) {
      const extra = must(await db.from("orders").select("id, reference, status, total, deposit_amount, balance_amount, deposit_paid, payment_status, payment_method, created_at, contact_name, company, phone, city, user_id, email, guest_email").in("user_id", prof.map((p) => p.id)));
      for (const o of extra ?? []) map.set(o.id, o);
    }
    const orders = [...map.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const ids = orders.map((o) => o.id);
    const bal = ids.length ? must(await db.from("balance_collections").select("order_id, amount, remitted").in("order_id", ids)) ?? [] : [];
    const msgs = must(messages) ?? [];
    const meta = msgs.length ? must(await db.from("message_meta").select("message_id, classification, quote_stage, is_read").in("message_id", msgs.map((m) => m.id))) ?? [] : [];
    const { moneyOf } = await import("./admin-metrics");
    const withMoney = orders.map((o) => ({ ...o, money: moneyOf(o, bal.find((b) => b.order_id === o.id) ?? null) }));
    const sum = (key: "orderValue" | "collected" | "courierHeld" | "balanceDue") =>
      Math.round(withMoney.reduce((s, o) => s + o.money[key], 0) * 100) / 100;
    const latest = withMoney[0];
    return {
      key: k,
      profile: prof[0] ?? null,
      name: prof[0]?.full_name ?? latest?.contact_name ?? msgs[0]?.name ?? null,
      company: withMoney.find((o) => o.company)?.company ?? msgs.find((m) => m.company)?.company ?? null,
      phone: withMoney.find((o) => o.phone)?.phone ?? null,
      lastActivity: [latest?.created_at, msgs[0]?.created_at, prof[0]?.created_at].filter(Boolean).sort().reverse()[0] ?? null,
      totals: { orders: withMoney.length, orderValue: sum("orderValue"), collected: sum("collected"), courierHeld: sum("courierHeld"), outstanding: sum("balanceDue") },
      orders: withMoney.map(({ user_id: _u, ...o }) => o),
      messages: msgs.map((m) => ({ ...m, meta: meta.find((x) => x.message_id === m.id) ?? null })),
      notes: must(notes) ?? [],
    };
  });

/* ---------- inbox & quotes ---------- */

export const adminMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => {
    const o = obj(i);
    return {
      page: pageOf(o["page"]),
      q: search(o["q"]),
      classification: oneOf(o["classification"], ["unclassified", "quote", "sales", "support", "spam"] as const),
      unread: o["unread"] === true,
      quotes: o["quotes"] === true,
      stage: oneOf(o["stage"], ["new", "qualified", "proposal", "negotiation", "won", "lost"] as const),
      assignee: optUuid(o["assignee"]),
    };
  })
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const ids = must(
      await db.rpc("admin_messages_page", {
        _q: data.q,
        _classification: data.classification as string,
        _unread: data.unread,
        _quotes: data.quotes,
        _stage: data.stage as string,
        _assignee: data.assignee as string,
        _limit: PAGE,
        _offset: data.page * PAGE,
      }),
      "messages",
    ) ?? [];
    const total = Number(ids[0]?.total_count ?? 0);
    const list = ids.map((r) => r.message_id);
    const stageCounts = data.quotes ? (must(await db.rpc("admin_quote_stage_counts")) as Record<string, number>) : null;
    if (!list.length) return { total, pageSize: PAGE, messages: [], stageCounts };
    const [rows, meta] = await Promise.all([
      db.from("contact_messages").select("id, name, email, company, topic, message, created_at").in("id", list),
      db.from("message_meta").select("message_id, classification, quote_stage, is_read, assigned_to, version, classified_by").in("message_id", list),
    ]);
    const r = must(rows) ?? [];
    const m = must(meta) ?? [];
    return {
      total,
      pageSize: PAGE,
      stageCounts,
      messages: list
        .map((id) => r.find((x) => x.id === id))
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .map((x) => ({ ...x, meta: m.find((y) => y.message_id === x.id) ?? null })),
    };
  });

export const adminMessageDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: uuid(obj(i)["id"]) }))
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "read_ops");
    const msg = must(await db.from("contact_messages").select("id, name, email, company, topic, message, created_at").eq("id", data.id).maybeSingle());
    if (!msg) throw new Error("Message introuvable");
    const [meta, notes, history] = await Promise.all([
      db.from("message_meta").select("classification, quote_stage, is_read, assigned_to, version, classified_by, stage_changed_at").eq("message_id", data.id).maybeSingle(),
      db.from("admin_notes").select("id, body, author_id, created_at").eq("entity_type", "message").eq("entity_key", data.id).order("created_at", { ascending: false }),
      db.from("admin_audit_log").select("id, actor_id, action, changes, at").eq("entity_type", "message").eq("entity_key", data.id).order("at", { ascending: false }).limit(100),
    ]);
    return { message: msg, meta: must(meta), notes: must(notes) ?? [], history: must(history) ?? [] };
  });

export const adminUpdateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = obj(input);
    const f = obj(i["fields"]);
    const out: Record<string, unknown> = {};
    if (f["classification"] !== undefined) {
      out["classification"] = oneOf(f["classification"], ["unclassified", "quote", "sales", "support", "spam"] as const);
      if (!out["classification"]) throw new Error("Classification invalide");
    }
    if (f["quote_stage"] !== undefined) {
      out["quote_stage"] = oneOf(f["quote_stage"], ["new", "qualified", "proposal", "negotiation", "won", "lost"] as const);
      if (!out["quote_stage"]) throw new Error("Étape invalide");
    }
    if (f["is_read"] !== undefined) out["is_read"] = f["is_read"] === true;
    if (f["assigned_to"] !== undefined) out["assigned_to"] = optUuid(f["assigned_to"]);
    const version = i["version"] == null ? null : Math.floor(Number(i["version"]));
    return { id: uuid(i["id"]), version: Number.isFinite(version) ? version : null, fields: out };
  })
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "write_ops");
    const r = await db.rpc("admin_update_message", { _actor: context.userId, _msg: data.id, _expected: data.version as number, _f: data.fields as never });
    if (r.error) fail(r.error, "Enregistrement impossible");
    return { ok: true, version: r.data };
  });

/* ---------- catalog availability ---------- */

export const adminCatalogAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db } = await requireStaff(context, "read_ops");
    return must(await db.from("catalog_availability").select("kind, slug, available, note, updated_at")) ?? [];
  });

export const adminSetAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = obj(input);
    const kind = oneOf(i["kind"], ["product", "pack"] as const);
    const slug = String(i["slug"] ?? "");
    if (!kind || !/^[a-z0-9-]{1,60}$/.test(slug)) throw new Error("Article invalide");
    return { kind, slug, available: i["available"] === true, note: text(i["note"], 300) };
  })
  .handler(async ({ data, context }) => {
    const { getProduct } = await import("@/data/products");
    const { getPack } = await import("@/data/packs");
    if (data.kind === "product" ? !getProduct(data.slug) : !getPack(data.slug)) throw new Error("Article inconnu");
    const { db } = await requireStaff(context, "manage_catalog");
    const r = await db.rpc("admin_set_availability", { _actor: context.userId, _kind: data.kind, _slug: data.slug, _available: data.available, _note: data.note ?? "" });
    if (r.error) fail(r.error);
    return { ok: true };
  });

/* ---------- CRM (admin only) ---------- */

export const adminCrm = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db } = await requireStaff(context, "crm_actions");
    const { crmReadiness } = await import("./crm-worker.server");
    const [counts, problems, enqueueErrors, attempts] = await Promise.all([
      db.from("crm_outbox").select("status"),
      db.from("crm_outbox").select("id, entity_type, source_table, source_id, status, attempts, last_error_code, last_error, next_attempt_at, updated_at").in("status", ["failed", "dead", "blocked"]).order("updated_at", { ascending: false }).limit(50),
      db.from("crm_enqueue_errors").select("id, at, source_table, error_code").order("at", { ascending: false }).limit(20),
      db.from("crm_sync_attempts").select("id, at, ok, http_status, error_code, summary").order("at", { ascending: false }).limit(20),
    ]);
    const c: Record<string, number> = {};
    for (const r of must(counts) ?? []) c[r.status] = (c[r.status] ?? 0) + 1;
    return { readiness: crmReadiness(), counts: c, problems: must(problems) ?? [], enqueueErrors: must(enqueueErrors) ?? [], attempts: must(attempts) ?? [] };
  });

export const adminRetryCrmJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ({ id: uuid(obj(i)["id"]) }))
  .handler(async ({ data, context }) => {
    const { db } = await requireStaff(context, "crm_actions");
    const { error } = await db.rpc("crm_retry", { _id: data.id });
    if (error) throw new Error("Relance impossible");
    return { ok: true };
  });

export const adminRunCrmWorker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context, "crm_actions");
    const { runCrmBatch } = await import("./crm-worker.server");
    return runCrmBatch({ limit: 10 });
  });
