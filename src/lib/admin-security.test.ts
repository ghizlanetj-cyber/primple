import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");

/** Static security checks on the admin API, worker route and migration (not a live DB test). */
describe("admin and worker security", () => {
  const admin = read("./admin.functions.ts");
  const route = read("../routes/api/public/crm-worker.ts");
  const sql = read("../../drizzle/migrations/0017_crm_admin_outbox_schema.sql");

  it("every admin server function requires auth and a staff capability before the service client", () => {
    const fns = admin.split("createServerFn(").slice(1);
    expect(fns.length).toBeGreaterThanOrEqual(20);
    for (const fn of fns) {
      expect(fn).toContain("requireSupabaseAuth");
      // adminMe only reports the caller's own role; it never loads the service client.
      if (fn.includes("my_staff_role")) expect(fn).not.toContain("requireStaff(");
      else expect(fn).toMatch(/requireStaff\(context, "[a-z_]+"\)/);
    }
    const helper = admin.slice(admin.indexOf("async function requireStaff"), admin.indexOf("const ERRORS"));
    expect(helper.indexOf("my_staff_role")).toBeLessThan(helper.indexOf("client.server"));
    expect(helper).toContain("can(role, cap)");
    expect(admin.match(/client\.server/g)).toHaveLength(1);
    expect(admin).not.toMatch(/claim_token|youcanpay_token_id|user_metadata/);
  });

  it("privileged actions need admin-only capabilities", () => {
    const capOf = (name: string) => {
      const start = admin.indexOf(`export const ${name} `);
      const body = admin.slice(start, admin.indexOf("export const", start + 10));
      return body.match(/requireStaff\(context, "([a-z_]+)"\)/)?.[1];
    };
    expect(capOf("adminGrantMember")).toBe("manage_team");
    expect(capOf("adminRevokeMember")).toBe("manage_team");
    expect(capOf("adminSetAvailability")).toBe("manage_catalog");
    expect(capOf("adminRecordBalance")).toBe("confirm_money");
    expect(capOf("adminRunCrmWorker")).toBe("crm_actions");
    expect(capOf("adminRetryCrmJob")).toBe("crm_actions");
    expect(capOf("adminCrm")).toBe("crm_actions");
    expect(capOf("adminUpdateOrder")).toBe("write_ops");
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
