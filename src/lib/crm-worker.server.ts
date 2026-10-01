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

export type DbResult<T> = { data: T | null; error: { message?: string } | null };
type Row = Record<string, unknown>;
type SelectQuery = {
  eq(column: string, value: string): SelectQuery;
  maybeSingle(): PromiseLike<DbResult<Row>>;
};
/** Minimal service-role client surface used by the worker (real client or test fake). */
export type Db = {
  from(table: string): {
    select(columns: string): SelectQuery;
    upsert(row: Row, opts?: { onConflict?: string }): PromiseLike<DbResult<unknown>>;
  };
  rpc(fn: string, args: Row): PromiseLike<DbResult<unknown>>;
};

const str = (v: unknown) => (v == null || v === "" ? null : String(v));
type Item = { quantity?: unknown; name?: unknown; config?: unknown };

const closing = (iso: string | null | undefined) => (iso ?? new Date().toISOString()).slice(0, 10);

export async function loadSource(db: Db, table: string, id: string): Promise<SyncSource | null> {
  if (table === "profiles") {
    const { data } = await db
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", id)
      .maybeSingle();
    const email = normalizeEmail(data?.["email"]);
    return data
      ? {
          contact: email
            ? { email, name: str(data["full_name"]), customerId: str(data["id"]) }
            : null,
        }
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
    const email = normalizeEmail(o["email"] ?? o["guest_email"]);
    const confirmed = o["payment_status"] === "paid" || o["deposit_paid"] === true;
    const items: Item[] = Array.isArray(o["items"]) ? (o["items"] as Item[]) : [];
    return {
      contact: email
        ? {
            email,
            name: str(o["contact_name"]),
            phone: str(o["phone"]),
            company: str(o["company"]),
            customerId: str(o["user_id"]),
          }
        : null,
      deal: confirmed
        ? {
            externalId: `orders:${String(o["id"])}`,
            name: `Primple ${String(o["reference"])}`,
            stage: "Closed Won",
            amountMad: Number(o["total"]),
            closingDate: closing(str(o["paid_at"])),
            leadSource: "OnlineStore",
            adminUrl: `${ADMIN_BASE}?order=${String(o["id"])}`,
            description:
              items
                .map(
                  (i) =>
                    `${String(i.quantity ?? "")} × ${String(i.name ?? "")}${i.config ? ` (${String(i.config)})` : ""}`,
                )
                .join("\n") +
              `\nPaiement: ${String(o["payment_method"])}; encaissé en ligne: ${Number(o["deposit_amount"])} MAD`,
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
    const email = normalizeEmail(s["customer_email"]);
    return {
      contact: email
        ? {
            email,
            name: str(s["customer_name"]),
            phone: str(s["customer_phone"]),
            customerId: str(s["user_id"]),
          }
        : null,
      deal:
        s["status"] === "paid"
          ? {
              externalId: `shop_orders:${String(s["id"])}`,
              name: `Primple Shop ${String(s["reference"])}`,
              stage: "Closed Won",
              amountMad: Number(s["amount_cents"]) / 100,
              closingDate: closing(str(s["paid_at"])),
              leadSource: "OnlineStore",
              adminUrl: `${ADMIN_BASE}?shop=${String(s["id"])}`,
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
    const email = normalizeEmail(m["email"]);
    const isSale = meta["classification"] === "quote" || meta["classification"] === "sales";
    return {
      contact: email ? { email, name: str(m["name"]), company: str(m["company"]) } : null,
      deal: isSale
        ? {
            externalId: `quotes:${String(m["id"])}`,
            name: `Devis Primple – ${String(m["topic"] || m["company"] || m["name"]).slice(0, 60)}`,
            stage: QUOTE_STAGE_MAP[String(meta["quote_stage"])] ?? "Qualification",
            amountMad: null,
            closingDate: closing(new Date(Date.now() + 30 * 864e5).toISOString()),
            leadSource: "Web Download",
            adminUrl: `${ADMIN_BASE}?message=${String(m["id"])}`,
            description: "Demande reçue via le formulaire Primple.ma",
          }
        : null,
    };
  }
  return null;
}

/**
 * Processes a bounded batch. Each job is claimed (with its own lease) immediately
 * before it is processed, so later jobs never sit on an expiring lease. One Zoho
 * client (one access token) is reused for the whole batch, and the batch stops
 * claiming once its time budget is spent. Outcomes are written only through
 * crm_complete, which checks the lease owner; a lost lease writes nothing.
 */
export async function runCrmBatch(
  opts: {
    db?: Db;
    fetchFn?: FetchLike;
    limit?: number;
    budgetMs?: number;
    now?: () => number;
  } = {},
) {
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
  const now = opts.now ?? Date.now;
  const deadline = now() + Math.min(opts.budgetMs ?? 40_000, 50_000);
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);
  const owner = randomUUID();
  const results: Record<string, number> = {};
  let processed = 0;
  while (processed < limit && now() < deadline) {
    const { data, error } = await db.rpc("crm_claim", {
      _owner: owner,
      _limit: 1,
      _lease_seconds: 120,
    });
    if (error) return { status: "error" as const, processed, results, code: "claim_failed" };
    const job = (Array.isArray(data) ? data[0] : null) as Job | null;
    if (!job) break;
    processed += 1;
    let outcome: string;
    try {
      const source = await loadSource(db, job.source_table, job.source_id);
      const r = await processJob(client, job, source);
      const done = await db.rpc("crm_complete", {
        _id: job.id,
        _owner: owner,
        _ok: true,
        _zoho_id: r.zohoId,
        _account_id: r.accountId,
      });
      outcome = String(done.data ?? "done");
      // Deal jobs also sync the Contact: record that mapping, only if we still owned the job.
      if (job.entity_type === "deal" && r.contactId && outcome !== "lease_lost") {
        await db.from("crm_mappings").upsert(
          {
            entity_type: "contact",
            source_table: job.source_table,
            source_id: job.source_id,
            zoho_id: r.contactId,
            zoho_account_id: r.accountId,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "entity_type,source_table,source_id" },
        );
      }
    } catch (e) {
      const z = e instanceof ZohoError ? e : new ZohoError("internal", "Unexpected worker error");
      console.error(`[crm] job ${job.id} ${z.code}`);
      const failed = await db.rpc("crm_complete", {
        _id: job.id,
        _owner: owner,
        _ok: false,
        _error_code: z.code,
        _error: sanitize(z.message),
        _http: z.http,
        _retry_after_seconds: z.retryAfterSeconds,
        _terminal: z.terminal,
      });
      outcome = String(failed.data ?? "failed");
    }
    results[outcome] = (results[outcome] ?? 0) + 1;
  }
  return { status: "ok" as const, processed, results };
}
