/** Server-only CRM outbox worker. Reads Zoho credentials from runtime secrets only. */
import { randomUUID } from "node:crypto";

import {
  QUOTE_STAGE_MAP,
  ZohoClient,
  ZohoError,
  normalizeEmail,
  processJob,
  sanitize,
  type FetchLike,
  type Job,
  type SyncSource,
  type ZohoConfig,
} from "./crm-core";

const ADMIN_BASE = "https://primple.ma/admin";

export function zohoConfig(): ZohoConfig | null {
  const env = process.env;
  const cfg = {
    clientId: env["ZOHO_CLIENT_ID"] ?? "",
    clientSecret: env["ZOHO_CLIENT_SECRET"] ?? "",
    refreshToken: env["ZOHO_REFRESH_TOKEN"] ?? "",
    accountsDomain: env["ZOHO_ACCOUNTS_DOMAIN"] ?? "",
    apiDomain: env["ZOHO_API_DOMAIN"] ?? "",
  };
  return Object.values(cfg).every(Boolean) ? cfg : null;
}

export function crmReadiness() {
  const names = [
    "ZOHO_CLIENT_ID",
    "ZOHO_CLIENT_SECRET",
    "ZOHO_REFRESH_TOKEN",
    "ZOHO_ACCOUNTS_DOMAIN",
    "ZOHO_API_DOMAIN",
    "CRM_WORKER_SECRET",
  ];
  return names.map((n) => ({ name: n, present: Boolean(process.env[n]) }));
}

type Db = { from: (t: string) => any; rpc: (fn: string, args?: any) => any };

const closing = (iso: string | null | undefined) => (iso ?? new Date().toISOString()).slice(0, 10);

export async function loadSource(db: Db, table: string, id: string): Promise<SyncSource | null> {
  if (table === "profiles") {
    const { data } = await db
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", id)
      .maybeSingle();
    const email = normalizeEmail(data?.email);
    return data
      ? { contact: email ? { email, name: data.full_name, customerId: data.id } : null }
      : null;
  }
  if (table === "orders") {
    const { data: o } = await db
      .from("orders")
      .select(
        "id, reference, user_id, email, guest_email, contact_name, phone, company, total, deposit_amount, payment_status, deposit_paid, payment_method, paid_at, items",
      )
      .eq("id", id)
      .maybeSingle();
    if (!o) return null;
    const email = normalizeEmail(o.email ?? o.guest_email);
    const confirmed = o.payment_status === "paid" || o.deposit_paid;
    const items = Array.isArray(o.items) ? o.items : [];
    return {
      contact: email
        ? { email, name: o.contact_name, phone: o.phone, company: o.company, customerId: o.user_id }
        : null,
      deal: confirmed
        ? {
            externalId: `orders:${o.id}`,
            name: `Primple ${o.reference}`,
            stage: "Closed Won",
            amountMad: Number(o.total),
            closingDate: closing(o.paid_at),
            leadSource: "OnlineStore",
            adminUrl: `${ADMIN_BASE}?order=${o.id}`,
            description:
              items
                .map((i: any) => `${i.quantity} × ${i.name}${i.config ? ` (${i.config})` : ""}`)
                .join("\n") +
              `\nPaiement: ${o.payment_method}; encaissé en ligne: ${Number(o.deposit_amount)} MAD`,
          }
        : null,
    };
  }
  if (table === "shop_orders") {
    const { data: s } = await db
      .from("shop_orders")
      .select(
        "id, reference, user_id, customer_email, customer_name, customer_phone, amount_cents, status, paid_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (!s) return null;
    const email = normalizeEmail(s.customer_email);
    return {
      contact: email
        ? { email, name: s.customer_name, phone: s.customer_phone, customerId: s.user_id }
        : null,
      deal:
        s.status === "paid"
          ? {
              externalId: `shop_orders:${s.id}`,
              name: `Primple Shop ${s.reference}`,
              stage: "Closed Won",
              amountMad: Number(s.amount_cents) / 100,
              closingDate: closing(s.paid_at),
              leadSource: "OnlineStore",
              adminUrl: `${ADMIN_BASE}?shop=${s.id}`,
            }
          : null,
    };
  }
  if (table === "contact_messages") {
    const [{ data: m }, { data: meta }] = await Promise.all([
      db
        .from("contact_messages")
        .select("id, name, email, company, topic, created_at")
        .eq("id", id)
        .maybeSingle(),
      db
        .from("message_meta")
        .select("classification, quote_stage")
        .eq("message_id", id)
        .maybeSingle(),
    ]);
    if (!m || !meta) return null;
    const email = normalizeEmail(m.email);
    const isSale = meta.classification === "quote" || meta.classification === "sales";
    return {
      contact: email ? { email, name: m.name, company: m.company } : null,
      deal: isSale
        ? {
            externalId: `quotes:${m.id}`,
            name: `Devis Primple – ${String(m.topic || m.company || m.name).slice(0, 60)}`,
            stage: QUOTE_STAGE_MAP[meta.quote_stage] ?? "Qualification",
            amountMad: null,
            closingDate: closing(new Date(Date.now() + 30 * 864e5).toISOString()),
            leadSource: "Web Download",
            adminUrl: `${ADMIN_BASE}?message=${m.id}`,
            description: "Demande reçue via le formulaire Primple.ma",
          }
        : null,
    };
  }
  return null;
}

/** Processes one bounded batch. Returns a non-secret summary. */
export async function runCrmBatch(opts: { db?: Db; fetchFn?: FetchLike; limit?: number } = {}) {
  const cfg = zohoConfig();
  if (!cfg) return { status: "pending_configuration" as const, processed: 0 };
  const db: Db =
    opts.db ??
    ((await import("@/integrations/supabase/client.server")).supabaseAdmin as unknown as Db);
  let client: ZohoClient;
  try {
    client = new ZohoClient(cfg, opts.fetchFn ?? fetch);
  } catch (e) {
    return {
      status: "blocked" as const,
      processed: 0,
      code: e instanceof ZohoError ? e.code : "config",
    };
  }
  const owner = randomUUID();
  const { data: jobs, error } = await db.rpc("crm_claim", {
    _owner: owner,
    _limit: opts.limit ?? 10,
    _lease_seconds: 120,
  });
  if (error) return { status: "error" as const, processed: 0, code: "claim_failed" };
  const results: Record<string, number> = {};
  for (const job of (jobs ?? []) as Job[]) {
    let outcome: string;
    try {
      const source = await loadSource(db, job.source_table, job.source_id);
      const r = await processJob(client, job, source);
      const { data } = await db.rpc("crm_complete", {
        _id: job.id,
        _owner: owner,
        _ok: true,
        _zoho_id: r.zohoId,
        _account_id: r.accountId,
      });
      outcome = String(data ?? "done");
    } catch (e) {
      const z = e instanceof ZohoError ? e : new ZohoError("internal", "Unexpected worker error");
      console.error(`[crm] job ${job.id} ${z.code}`);
      const { data } = await db.rpc("crm_complete", {
        _id: job.id,
        _owner: owner,
        _ok: false,
        _error_code: z.code,
        _error: sanitize(z.message),
        _http: z.http,
        _retry_after_seconds: z.retryAfterSeconds,
        _terminal: z.terminal,
      });
      outcome = String(data ?? "failed");
    }
    results[outcome] = (results[outcome] ?? 0) + 1;
  }
  return { status: "ok" as const, processed: (jobs ?? []).length, results };
}
