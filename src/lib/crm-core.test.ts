import { describe, expect, it } from "vitest";

import {
  ZohoClient,
  ZohoError,
  allowlistedOrigin,
  API_HOSTS,
  contactFields,
  processJob,
  recordId,
  sanitize,
  stripSensitive,
  type FetchLike,
  type SyncSource,
} from "./crm-core";
import { customersFrom, moneyOf, summarize } from "./admin-metrics";
import { loadSource, runCrmBatch } from "./crm-worker.server";

const cfg = {
  clientId: "cid",
  clientSecret: "csecret",
  refreshToken: "1000.refresh",
  accountsDomain: "accounts.zoho.eu",
  apiDomain: "https://www.zohoapis.eu",
};

/** In-memory mock Zoho: contacts unique by email, deals unique by Primple_External_ID. */
function mockZoho(opts: { currency?: string; outage?: number; rateLimitOnce?: boolean; recordError?: boolean } = {}) {
  const contacts: Record<string, any> = {};
  const deals: Record<string, any> = {};
  const accounts: Record<string, any> = {};
  let n = 0;
  let limited = false;
  const calls: string[] = [];
  const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
  const ok = (id: string) => json(200, { data: [{ status: "success", code: "SUCCESS", details: { id } }] });
  const fetchFn: FetchLike = async (url, init) => {
    const u = new URL(url);
    calls.push(`${init.method} ${u.pathname}`);
    if (u.pathname === "/oauth/v2/token") return json(200, { access_token: "1000.access", expires_in: 3600 });
    if (opts.outage) return json(opts.outage, { code: "INTERNAL_ERROR" });
    if (opts.rateLimitOnce && !limited) { limited = true; return json(429, { code: "TOO_MANY_REQUESTS" }, { "retry-after": "42" }); }
    const body = init.body ? JSON.parse(String(init.body)) : null;
    if (u.pathname === "/crm/v8/org") return json(200, { org: [{ iso_code: opts.currency ?? "MAD" }] });
    if (u.pathname === "/crm/v8/Contacts/search") {
      const e = u.searchParams.get("email")!;
      return contacts[e] ? json(200, { data: [contacts[e]] }) : new Response(null, { status: 204 });
    }
    if (u.pathname === "/crm/v8/Contacts/upsert" || u.pathname === "/crm/v8/Contacts") {
      const rec = body.data[0];
      const existing = rec.id ? Object.values(contacts).find((c: any) => c.id === rec.id) : contacts[rec.Email];
      const c = existing ?? { id: `c${++n}` };
      Object.assign(c, rec);
      contacts[c.Email] = c;
      return ok(c.id);
    }
    if (u.pathname === "/crm/v8/Accounts/search") return new Response(null, { status: 204 });
    if (u.pathname === "/crm/v8/Accounts") { const id = `a${++n}`; accounts[id] = body.data[0]; return ok(id); }
    if (u.pathname === "/crm/v8/Deals/upsert") {
      if (opts.recordError) return json(202, { data: [{ status: "error", code: "INVALID_DATA", details: { api_name: "Stage" } }] });
      const rec = body.data[0];
      const d = deals[rec.Primple_External_ID] ?? { id: `d${++n}` };
      Object.assign(d, rec);
      deals[rec.Primple_External_ID] = d;
      return ok(d.id);
    }
    return json(404, { code: "NOT_FOUND" });
  };
  return { fetchFn, contacts, deals, accounts, calls };
}

const orderSource = (id: string, email = "Client@Example.ma"): SyncSource => ({
  contact: { email, name: "Sara El Amrani", phone: "+212600000000", company: "Café Atlas", customerId: "u1" },
  deal: {
    externalId: `orders:${id}`, name: "Primple PRM-1", stage: "Closed Won", amountMad: 330,
    closingDate: "2026-10-01", leadSource: "OnlineStore", adminUrl: `https://primple.ma/admin?order=${id}`,
  },
});

describe("Zoho sync (mock Zoho, no live CRM)", () => {
  it("new paid order creates a Contact and a Deal keyed by external id", async () => {
    const z = mockZoho();
    const client = new ZohoClient(cfg, z.fetchFn);
    const r = await processJob(client, { id: "j", entity_type: "deal", source_table: "orders", source_id: "o1" }, orderSource("o1"));
    expect(r.zohoId).toMatch(/^d/);
    expect(z.contacts["client@example.ma"].Last_Name).toBe("Amrani");
    expect(z.deals["orders:o1"].Contact_Name.id).toBe(z.contacts["client@example.ma"].id);
    expect(z.deals["orders:o1"].Primple_Source).toBe("Primple.ma");
    expect(z.deals["orders:o1"].Amount).toBe(330);
  });

  it("same email reuses the existing Contact and never blanks fields", async () => {
    const z = mockZoho();
    const client = new ZohoClient(cfg, z.fetchFn);
    await processJob(client, { id: "1", entity_type: "contact", source_table: "orders", source_id: "o1" }, orderSource("o1"));
    await processJob(client, { id: "2", entity_type: "contact", source_table: "profiles", source_id: "p" }, {
      contact: { email: "client@example.ma", name: null, phone: "" },
    });
    expect(Object.values(z.contacts).length).toBe(1);
    expect(z.contacts["client@example.ma"].Phone).toBe("+212600000000");
    expect(z.contacts["client@example.ma"].Last_Name).toBe("Amrani");
  });

  it("retries/concurrent runs do not duplicate the Deal", async () => {
    const z = mockZoho();
    const client = new ZohoClient(cfg, z.fetchFn);
    const job = { id: "j", entity_type: "deal" as const, source_table: "orders", source_id: "o1" };
    await Promise.all([processJob(client, job, orderSource("o1")), processJob(client, job, orderSource("o1"))]);
    await processJob(client, job, orderSource("o1"));
    expect(Object.keys(z.deals)).toEqual(["orders:o1"]);
  });

  it("quote deal has no amount, uses an existing stage and quotes: id", async () => {
    const z = mockZoho({ currency: "USD" });
    const client = new ZohoClient(cfg, z.fetchFn);
    await processJob(client, { id: "q", entity_type: "deal", source_table: "contact_messages", source_id: "m1" }, {
      contact: { email: "b@x.ma", name: "B" },
      deal: { externalId: "quotes:m1", name: "Devis", stage: "Qualification", amountMad: null, closingDate: "2026-11-01", leadSource: "Web Download", adminUrl: "https://primple.ma/admin?message=m1" },
    });
    expect(z.deals["quotes:m1"].Stage).toBe("Qualification");
    expect(z.deals["quotes:m1"].Amount).toBeUndefined();
  });

  it("blocks amount sync when Zoho currency is not MAD (fails closed)", async () => {
    const z = mockZoho({ currency: "USD" });
    const client = new ZohoClient(cfg, z.fetchFn);
    await expect(processJob(client, { id: "j", entity_type: "deal", source_table: "orders", source_id: "o1" }, orderSource("o1")))
      .rejects.toMatchObject({ code: "currency_mismatch", terminal: "blocked" });
    expect(Object.keys(z.deals)).toHaveLength(0);
  });

  it("treats HTTP 2xx record-level failures as errors", async () => {
    const z = mockZoho({ recordError: true });
    const client = new ZohoClient(cfg, z.fetchFn);
    await expect(processJob(client, { id: "j", entity_type: "deal", source_table: "orders", source_id: "o1" }, orderSource("o1")))
      .rejects.toMatchObject({ code: "INVALID_DATA", terminal: "dead" });
    expect(() => recordId({ data: [{ status: "error", code: "DUPLICATE_DATA", details: {} }] })).toThrow(ZohoError);
  });

  it("outage and 429 are retryable with Retry-After", async () => {
    const down = new ZohoClient(cfg, mockZoho({ outage: 503 }).fetchFn);
    await expect(processJob(down, { id: "j", entity_type: "contact", source_table: "orders", source_id: "o" }, orderSource("o")))
      .rejects.toMatchObject({ code: "http_503", terminal: null });
    const limited = new ZohoClient(cfg, mockZoho({ rateLimitOnce: true }).fetchFn);
    await expect(processJob(limited, { id: "j", entity_type: "contact", source_table: "orders", source_id: "o" }, orderSource("o")))
      .rejects.toMatchObject({ code: "rate_limited", retryAfterSeconds: 42 });
  });

  it("only allowlisted Zoho domains are accepted", () => {
    expect(allowlistedOrigin("www.zohoapis.eu", API_HOSTS)).toBe("https://www.zohoapis.eu");
    expect(() => allowlistedOrigin("https://evil.example.com", API_HOSTS)).toThrow(ZohoError);
    expect(() => new ZohoClient({ ...cfg, apiDomain: "zohoapis.eu.evil.com" }, fetch)).toThrow(ZohoError);
  });

  it("sanitizes diagnostics and strips sensitive columns", () => {
    const s = sanitize("Bearer 1000.abc.def failed for jane@doe.ma token abcdefghijklmnopqrstuvwxyz0123456789");
    expect(s).not.toContain("jane@doe.ma");
    expect(s).not.toContain("1000.abc");
    expect(s).not.toMatch(/abcdefghijklmnopqrstuvwxyz0123456789/);
    const row = stripSensitive({ id: "1", claim_token: "x", youcanpay_token_id: "t", youcanpay_transaction_id: "y", total: 1 });
    expect(row).toEqual({ id: "1", total: 1 });
  });

  it("contact creation always has Last_Name; updates omit blanks", () => {
    expect(contactFields({ email: "a@b.ma" }, true)["Last_Name"]).toBe("a");
    expect(contactFields({ email: "a@b.ma", name: "", phone: " " }, false)).toEqual({ Email: "a@b.ma" });
  });
});

/** Fake DB implementing the claim/complete contract (leases, owner tokens, version bump). */
function fakeDb(rows: any[], sources: Record<string, any>) {
  const jobs = rows.map((r) => ({ processed_version: 0, attempts: 0, status: "pending", version: 1, ...r }));
  const db = {
    jobs,
    rpc: async (fn: string, a: any) => {
      if (fn === "crm_claim") {
        const due = jobs.filter((j) => j.status === "pending" || j.status === "failed").slice(0, a._limit);
        due.forEach((j) => Object.assign(j, { status: "processing", lease_owner: a._owner, claimed_version: j.version, attempts: j.attempts + 1 }));
        return { data: due.map((j) => ({ ...j })), error: null };
      }
      if (fn === "crm_complete") {
        const j = jobs.find((x) => x.id === a._id && x.lease_owner === a._owner && x.status === "processing");
        if (!j) return { data: "lease_lost", error: null };
        j.lease_owner = null;
        if (a._ok) { j.status = j.version > j.claimed_version ? "pending" : "done"; j.zoho = a._zoho_id; }
        else { j.status = a._terminal ?? "failed"; j.code = a._error_code; j.err = a._error; }
        return { data: j.status, error: null };
      }
      return { data: null, error: null };
    },
    from: (t: string) => {
      const q: any = { _id: null };
      q.select = () => q; q.eq = (_c: string, v: string) => { q._id = v; return q; };
      q.maybeSingle = async () => ({ data: sources[`${t}:${q._id}`] ?? null });
      return q;
    },
  };
  return db;
}

describe("worker batch with fake outbox", () => {
  const env = process.env;
  const withEnv = async (fn: () => Promise<void>) => {
    const saved = { ...env };
    Object.assign(process.env, { ZOHO_CLIENT_ID: "c", ZOHO_CLIENT_SECRET: "s", ZOHO_REFRESH_TOKEN: "1000.r", ZOHO_ACCOUNTS_DOMAIN: "accounts.zoho.eu", ZOHO_API_DOMAIN: "www.zohoapis.eu" });
    try { await fn(); } finally { process.env = saved; }
  };
  const paidOrder = { id: "o1", reference: "PRM-1", user_id: null, email: "g@x.ma", contact_name: "Guest User", total: 200, deposit_amount: 100, payment_status: "paid", deposit_paid: true, payment_method: "deposit_50_cod", paid_at: null, items: [{ quantity: 100, name: "Flyers", config: "A5" }] };

  it("is disabled (pending configuration) without credentials and touches nothing", async () => {
    const saved = { ...process.env };
    delete process.env["ZOHO_CLIENT_ID"];
    const db = fakeDb([{ id: "j1", entity_type: "deal", source_table: "orders", source_id: "o1" }], {});
    expect(await runCrmBatch({ db, fetchFn: mockZoho().fetchFn })).toMatchObject({ status: "pending_configuration" });
    expect(db.jobs[0].status).toBe("pending");
    process.env = saved;
  });

  it("guest paid order → Contact + Deal; outage leaves job retryable", () =>
    withEnv(async () => {
      const ok = fakeDb([{ id: "j1", entity_type: "deal", source_table: "orders", source_id: "o1" }], { "orders:o1": paidOrder });
      const z = mockZoho();
      await runCrmBatch({ db: ok, fetchFn: z.fetchFn });
      expect(ok.jobs[0].status).toBe("done");
      expect(z.deals["orders:o1"].Description).toContain("encaissé en ligne: 100 MAD");

      const down = fakeDb([{ id: "j1", entity_type: "deal", source_table: "orders", source_id: "o1" }], { "orders:o1": paidOrder });
      await runCrmBatch({ db: down, fetchFn: mockZoho({ outage: 500 }).fetchFn });
      expect(down.jobs[0]).toMatchObject({ status: "failed", code: "http_500" });
      expect(down.jobs[0].err).not.toContain("g@x.ma");
    }));

  it("a new event during processing keeps the job pending (version protection)", () =>
    withEnv(async () => {
      const db = fakeDb([{ id: "j1", entity_type: "contact", source_table: "orders", source_id: "o1" }], { "orders:o1": paidOrder });
      const z = mockZoho();
      const orig = z.fetchFn;
      const bump: FetchLike = async (u, i) => { db.jobs[0].version = 2; return orig(u, i); };
      await runCrmBatch({ db, fetchFn: bump });
      expect(db.jobs[0].status).toBe("pending");
    }));

  it("unpaid orders never produce a Deal", async () => {
    const db = fakeDb([], { "orders:o2": { ...paidOrder, id: "o2", payment_status: "unpaid", deposit_paid: false } });
    const src = await loadSource(db, "orders", "o2");
    expect(src?.deal).toBeNull();
    expect(src?.contact?.email).toBe("g@x.ma");
  });
});

describe("admin metrics", () => {
  const base = { email: "a@b.ma", guest_email: null, user_id: null, created_at: "2026-10-01", deposit_paid: false };
  it("distinguishes order value, collected advance and balance due", () => {
    const deposit = { ...base, total: 200, deposit_amount: 100, balance_amount: 100, payment_status: "paid", status: "In production" };
    const card = { ...base, total: 150, deposit_amount: 150, balance_amount: 0, payment_status: "paid", status: "Order placed" };
    const unpaid = { ...base, total: 999, deposit_amount: 999, balance_amount: 0, payment_status: "unpaid", status: "Order placed" };
    expect(moneyOf(deposit)).toEqual({ orderValue: 200, collected: 100, balanceDue: 100 });
    const s = summarize([deposit, card, unpaid]);
    expect(s).toMatchObject({ orderValue: 350, collected: 250, balanceDue: 100, pendingPayment: 1, inProduction: 1 });
    expect(customersFrom([deposit, card, { ...unpaid, email: "A@B.ma" }])).toHaveLength(1);
  });
});
