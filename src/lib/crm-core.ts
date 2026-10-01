/**
 * Pure Zoho CRM sync logic (no env, no database). Network access is injected so
 * the whole flow is unit-testable with a mock Zoho. Never logs tokens or payloads.
 */
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/** Loosely-shaped Zoho JSON; every field is validated where it is read. */
export type ZohoJson = {
  data?: unknown[];
  org?: unknown[];
  code?: unknown;
  [key: string]: unknown;
};
type Rec = Record<string, unknown>;
export const asRec = (v: unknown): Rec =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Rec) : {};
const rows = (json: ZohoJson | null | undefined): Rec[] =>
  Array.isArray(json?.data) ? json.data.map(asRec) : [];

export const ACCOUNTS_HOSTS = [
  "accounts.zoho.com",
  "accounts.zoho.eu",
  "accounts.zoho.in",
  "accounts.zoho.com.au",
  "accounts.zoho.jp",
  "accounts.zohocloud.ca",
  "accounts.zoho.sa",
  "accounts.zoho.uk",
  "accounts.zoho.com.cn",
];
export const API_HOSTS = [
  "www.zohoapis.com",
  "www.zohoapis.eu",
  "www.zohoapis.in",
  "www.zohoapis.com.au",
  "www.zohoapis.jp",
  "www.zohoapis.ca",
  "www.zohoapis.sa",
  "www.zohoapis.uk",
  "www.zohoapis.com.cn",
];

export const ZOHO_STAGES = [
  "Qualification",
  "Needs Analysis",
  "Value Proposition",
  "Id. Decision Makers",
  "Proposal/Price Quote",
  "Negotiation/Review",
  "Closed Won",
  "Closed Lost",
  "Closed Lost to Competition",
] as const;
export type ZohoStage = (typeof ZOHO_STAGES)[number];

export const QUOTE_STAGE_MAP: Record<string, ZohoStage> = {
  new: "Qualification",
  qualified: "Needs Analysis",
  proposal: "Proposal/Price Quote",
  negotiation: "Negotiation/Review",
  won: "Closed Won",
  lost: "Closed Lost",
};

export type ZohoConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accountsDomain: string;
  apiDomain: string;
};

export class ZohoError extends Error {
  constructor(
    public code: string,
    message: string,
    public http: number | null = null,
    public retryAfterSeconds: number | null = null,
    public terminal: "dead" | "blocked" | null = null,
  ) {
    super(message);
  }
}

/** Accepts only an allowlisted Zoho host; returns https://host. */
export function allowlistedOrigin(input: string | undefined, hosts: string[]): string {
  const raw = String(input ?? "").trim();
  if (!raw) throw new ZohoError("not_configured", "Zoho domain missing", null, null, "blocked");
  let host: string;
  try {
    host = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch {
    throw new ZohoError("bad_domain", "Zoho domain invalid", null, null, "blocked");
  }
  if (!hosts.includes(host))
    throw new ZohoError("bad_domain", "Zoho domain not allowlisted", null, null, "blocked");
  return `https://${host}`;
}

/** Strips anything that looks like an email, token or long id from a diagnostic string. */
export function sanitize(text: unknown): string {
  return String(text ?? "")
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/1000\.[\w.]+/g, "[token]")
    .replace(/\b(Bearer|Zoho-oauthtoken)\s+\S+/gi, "$1 [token]")
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[redacted]")
    .slice(0, 200);
}

function retryAfter(res: Response): number | null {
  const v = res.headers.get("retry-after");
  if (!v) return null;
  const n = Number(v);
  if (Number.isFinite(n)) return Math.min(Math.max(Math.round(n), 1), 3600);
  const t = Date.parse(v);
  return Number.isFinite(t)
    ? Math.min(Math.max(Math.round((t - Date.now()) / 1000), 1), 3600)
    : null;
}

export class ZohoClient {
  private token: string | null = null;
  private tokenExp = 0;
  private apiOrigin: string;
  private accountsOrigin: string;

  constructor(
    private cfg: ZohoConfig,
    private fetchFn: FetchLike,
    private timeoutMs = 10000,
  ) {
    this.accountsOrigin = allowlistedOrigin(cfg.accountsDomain, ACCOUNTS_HOSTS);
    this.apiOrigin = allowlistedOrigin(cfg.apiDomain, API_HOSTS);
  }

  private async timed(url: string, init: RequestInit): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      return await this.fetchFn(url, { ...init, signal: ctrl.signal });
    } catch {
      throw new ZohoError("network", "Zoho unreachable or timed out");
    } finally {
      clearTimeout(timer);
    }
  }

  async accessToken(force = false): Promise<string> {
    if (!force && this.token && Date.now() < this.tokenExp) return this.token;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      refresh_token: this.cfg.refreshToken,
    });
    const res = await this.timed(`${this.accountsOrigin}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json().catch(() => null)) as {
      access_token?: string;
      expires_in?: number;
      api_domain?: string;
      error?: string;
    } | null;
    if (!res.ok || !json?.access_token) {
      if (res.status === 429)
        throw new ZohoError("rate_limited", "Zoho token rate limited", 429, retryAfter(res));
      throw new ZohoError(
        "auth_failed",
        `Token refresh failed: ${sanitize(json?.error ?? res.status)}`,
        res.status,
        null,
        "blocked",
      );
    }
    if (json.api_domain) this.apiOrigin = allowlistedOrigin(json.api_domain, API_HOSTS);
    this.token = json.access_token;
    this.tokenExp = Date.now() + Math.max(60, (json.expires_in ?? 3600) - 120) * 1000;
    return this.token;
  }

  async request(method: string, path: string, body?: unknown, retried = false): Promise<ZohoJson> {
    const token = await this.accessToken();
    const res = await this.timed(`${this.apiOrigin}${path}`, {
      method,
      headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status === 401 && !retried) {
      await this.accessToken(true);
      return this.request(method, path, body, true);
    }
    if (res.status === 204) return { data: [] };
    const json = asRec(await res.json().catch(() => null)) as ZohoJson;
    if (res.status === 429)
      throw new ZohoError("rate_limited", "Zoho rate limited", 429, retryAfter(res) ?? 60);
    if (res.status >= 500)
      throw new ZohoError(`http_${res.status}`, "Zoho server error", res.status);
    if (!res.ok) {
      const code = sanitize(json.code ?? rows(json)[0]?.["code"] ?? `http_${res.status}`);
      const scope = code === "OAUTH_SCOPE_MISMATCH" || res.status === 401 || res.status === 403;
      throw new ZohoError(
        code,
        `Zoho rejected request (${res.status})`,
        res.status,
        null,
        scope ? "blocked" : "dead",
      );
    }
    return json;
  }
}

/** Zoho can answer HTTP 200/201/202 with a per-record failure. */
export function recordResult(json: ZohoJson | null | undefined): {
  id: string;
  action: string | null;
} {
  const rec = rows(json)[0];
  if (!rec) throw new ZohoError("empty_response", "Zoho returned no record", null, null, "dead");
  const details = asRec(rec["details"]);
  if (rec["status"] !== "success" || !details["id"]) {
    const field = details["api_name"] ? ` on ${sanitize(details["api_name"])}` : "";
    throw new ZohoError(
      sanitize(rec["code"] ?? "record_error"),
      `Record rejected${field}`,
      null,
      null,
      "dead",
    );
  }
  return {
    id: String(details["id"]),
    action: typeof rec["action"] === "string" ? rec["action"] : null,
  };
}

export function recordId(json: ZohoJson | null | undefined): string {
  return recordResult(json).id;
}

export type ContactSource = {
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  customerId?: string | null;
};

export type DealSource = {
  externalId: string;
  name: string;
  stage: ZohoStage;
  amountMad: number | null;
  closingDate: string;
  leadSource: "OnlineStore" | "Web Download";
  adminUrl: string;
  description?: string | null;
};

export type SyncSource = { contact: ContactSource | null; deal?: DealSource | null };

export function normalizeEmail(email: unknown): string | null {
  const e = String(email ?? "")
    .trim()
    .toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

function splitName(name: string | null | undefined) {
  const n = String(name ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!n) return { first: null, last: null };
  const i = n.lastIndexOf(" ");
  return i > 0 ? { first: n.slice(0, i), last: n.slice(i + 1) } : { first: null, last: n };
}

/**
 * Identity fields only, non-empty values only: a sync never blanks an existing Zoho
 * field and never touches sales-owned fields (Description, Lead_Source, Owner…).
 */
export function contactFields(src: ContactSource, creating: boolean): Record<string, string> {
  const out: Record<string, string> = {};
  const email = normalizeEmail(src.email);
  if (email) out["Email"] = email;
  const { first, last } = splitName(src.name);
  if (last) out["Last_Name"] = last;
  if (first) out["First_Name"] = first;
  if (creating && !out["Last_Name"])
    out["Last_Name"] = email ? email.split("@")[0]! : "Client Primple";
  if (src.phone?.trim()) out["Phone"] = src.phone.trim();
  return out;
}

/** Set once, only on a Contact this sync actually inserted. */
export function newContactExtras(src: ContactSource): Record<string, string> {
  const out: Record<string, string> = { Lead_Source: "OnlineStore" };
  if (src.customerId) out["Description"] = `Primple customer ID: ${src.customerId}`;
  return out;
}

const normName = (v: unknown) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

/** Zoho criteria: backslash-escape \ ( ) , instead of deleting punctuation. */
export function escapeCriteria(value: string): string {
  return value.replace(/[\\(),]/g, (c) => `\\${c}`);
}

/**
 * Exact-name search, then atomic upsert keyed on Account_Name so two concurrent jobs
 * cannot both create the Account. Several exact matches → no link (never merge).
 */
export async function findOrCreateAccount(
  client: ZohoClient,
  company: string,
): Promise<string | null> {
  const name = company.trim().replace(/\s+/g, " ").slice(0, 200);
  if (!name) return null;
  const criteria = encodeURIComponent(`(Account_Name:equals:${escapeCriteria(name)})`);
  const found = await client.request("GET", `/crm/v8/Accounts/search?criteria=${criteria}`);
  const exact = rows(found).filter((r) => normName(r["Account_Name"]) === normName(name));
  if (exact.length === 1) return String(exact[0]!["id"]);
  if (exact.length > 1) return null;
  return recordId(
    await client.request("POST", "/crm/v8/Accounts/upsert", {
      data: [{ Account_Name: name }],
      duplicate_check_fields: ["Account_Name"],
    }),
  );
}

export async function syncContact(
  client: ZohoClient,
  src: ContactSource,
): Promise<{ contactId: string; accountId: string | null }> {
  const email = normalizeEmail(src.email);
  if (!email)
    throw new ZohoError("invalid_email", "Contact has no valid email", null, null, "dead");
  const found = rows(
    await client.request("GET", `/crm/v8/Contacts/search?email=${encodeURIComponent(email)}`),
  );
  if (found.length > 1)
    throw new ZohoError(
      "ambiguous_contact",
      "Several Zoho contacts share this email",
      null,
      null,
      "blocked",
    );
  const existing = found[0];
  const existingAccount = existing ? asRec(existing["Account_Name"])["id"] : undefined;
  let accountId = existingAccount ? String(existingAccount) : null;
  if (!accountId && src.company) accountId = await findOrCreateAccount(client, src.company);
  const fields: Record<string, unknown> = contactFields({ ...src, email }, !existing);
  if (accountId && !existingAccount) fields["Account_Name"] = { id: accountId };
  let contactId: string;
  if (existing) {
    contactId = String(existing["id"]);
    recordId(
      await client.request("PUT", "/crm/v8/Contacts", { data: [{ id: contactId, ...fields }] }),
    );
  } else {
    const r = recordResult(
      await client.request("POST", "/crm/v8/Contacts/upsert", {
        data: [fields],
        duplicate_check_fields: ["Email"],
      }),
    );
    contactId = r.id;
    // A concurrent job may have created it first ("update"): leave its sales fields alone.
    if (r.action === "insert")
      recordId(
        await client.request("PUT", "/crm/v8/Contacts", {
          data: [{ id: contactId, ...newContactExtras(src) }],
        }),
      );
  }
  return { contactId, accountId };
}

/** Amounts are only sent when Zoho's org currency is verified MAD. Fails closed otherwise. */
export async function assertMadCurrency(client: ZohoClient): Promise<void> {
  let org: ZohoJson;
  try {
    org = await client.request("GET", "/crm/v8/org");
  } catch (e) {
    const code = e instanceof ZohoError ? e.code : "unknown";
    if (e instanceof ZohoError && !e.terminal) throw e;
    throw new ZohoError(
      "currency_unverified",
      `Org currency could not be read (${code})`,
      null,
      null,
      "blocked",
    );
  }
  const o = asRec(Array.isArray(org.org) ? org.org[0] : null);
  const iso = String(o["iso_code"] ?? o["currency"] ?? "").toUpperCase();
  if (!/\bMAD\b/.test(iso))
    throw new ZohoError(
      "currency_mismatch",
      "Zoho base currency is not MAD",
      null,
      null,
      "blocked",
    );
}

export function dealFields(deal: DealSource, contactId: string | null, accountId: string | null) {
  const out: Record<string, unknown> = {
    Deal_Name: deal.name.slice(0, 120),
    Stage: deal.stage,
    Closing_Date: deal.closingDate,
    Lead_Source: deal.leadSource,
    Primple_External_ID: deal.externalId,
    Primple_Source: "Primple.ma",
    Primple_Admin_URL: deal.adminUrl,
  };
  if (deal.amountMad != null) out["Amount"] = Math.round(deal.amountMad * 100) / 100;
  if (deal.description) out["Description"] = deal.description.slice(0, 2000);
  if (contactId) out["Contact_Name"] = { id: contactId };
  if (accountId) out["Account_Name"] = { id: accountId };
  return out;
}

export async function syncDeal(
  client: ZohoClient,
  deal: DealSource,
  contactId: string | null,
  accountId: string | null,
) {
  if (!ZOHO_STAGES.includes(deal.stage))
    throw new ZohoError("bad_stage", "Unknown stage", null, null, "dead");
  if (deal.amountMad != null) await assertMadCurrency(client);
  return recordId(
    await client.request("POST", "/crm/v8/Deals/upsert", {
      data: [dealFields(deal, contactId, accountId)],
      duplicate_check_fields: ["Primple_External_ID"],
    }),
  );
}

export type Job = {
  id: string;
  entity_type: "contact" | "deal";
  source_table: string;
  source_id: string;
};

export async function processJob(client: ZohoClient, job: Job, source: SyncSource | null) {
  if (!source) throw new ZohoError("source_missing", "Source record not found", null, null, "dead");
  if (job.entity_type === "contact") {
    if (!source.contact)
      throw new ZohoError("invalid_email", "No contact email", null, null, "dead");
    const r = await syncContact(client, source.contact);
    return { zohoId: r.contactId, accountId: r.accountId, contactId: r.contactId };
  }
  if (!source.deal)
    throw new ZohoError("not_deal", "Record is not a confirmed sale", null, null, "dead");
  const c = source.contact ? await syncContact(client, source.contact) : null;
  const id = await syncDeal(client, source.deal, c?.contactId ?? null, c?.accountId ?? null);
  return { zohoId: id, accountId: c?.accountId ?? null, contactId: c?.contactId ?? null };
}

/** Strips internal/secret columns before anything reaches a browser. */
const SECRET_KEYS = [
  "claim_token",
  "youcanpay_token_id",
  "youcanpay_transaction_id",
  "guest_token",
  "lease_owner",
];
export function stripSensitive<T extends Record<string, unknown>>(row: T): Omit<T, "claim_token"> {
  const copy: Record<string, unknown> = { ...row };
  for (const k of SECRET_KEYS) delete copy[k];
  return copy as Omit<T, "claim_token">;
}
