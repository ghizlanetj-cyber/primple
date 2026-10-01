import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

/** Static security checks on the admin API, worker route and migration (not a live DB test). */
describe("admin and worker security", () => {
  const admin = read("./admin.functions.ts");
  const route = read("../routes/api/public/crm-worker.ts");
  const sql = read("../../drizzle/migrations/0017_crm_admin_outbox_schema.sql");

  it("every admin server function requires auth and the admin role before the service client", () => {
    const fns = admin.split("createServerFn(").slice(1);
    expect(fns.length).toBeGreaterThanOrEqual(9);
    for (const fn of fns) {
      expect(fn).toContain("requireSupabaseAuth");
      expect(fn).toContain("requireAdmin(context)");
    }
    expect(admin.indexOf('_role: "admin"')).toBeLessThan(admin.indexOf("client.server"));
    expect(admin).not.toMatch(/claim_token|youcanpay_token_id/);
  });

  it("worker route authenticates before importing the worker / admin client", () => {
    expect(route.indexOf("authenticateCronRequest(request)")).toBeLessThan(
      route.indexOf('import("@/lib/crm-worker.server")'),
    );
    expect(route).not.toContain("client.server");
  });

  it("migration locks sidecars and RPCs to the service role", () => {
    for (const t of [
      "order_ops",
      "message_meta",
      "crm_outbox",
      "crm_mappings",
      "crm_sync_attempts",
    ]) {
      expect(sql).toContain(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`);
      expect(sql).not.toMatch(
        new RegExp(`GRANT [A-Z, ]+ ON public\\.${t} TO (anon|authenticated)`),
      );
    }
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.crm_claim[^;]+FROM PUBLIC, anon, authenticated/,
    );
    expect(sql).toContain("FOR UPDATE SKIP LOCKED");
  });

  it("customers cannot reassign orders, items, claim identity or attach files to others' orders", () => {
    for (const col of ["user_id", "items", "claim_token", "guest_email", "reference"]) {
      expect(sql).toContain(`NEW.${col} IS DISTINCT FROM OLD.${col}`);
    }
    expect(sql).toContain("Files can only be attached to your own orders");
    expect(sql).toContain("File ownership cannot be changed");
  });
});
