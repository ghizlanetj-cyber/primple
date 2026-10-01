import { createFileRoute } from "@tanstack/react-router";

import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/** Constant-time check of the dedicated worker bearer (shared with the DB schedule). */
async function workerSecretMatches(request: Request): Promise<boolean> {
  const secret = process.env["CRM_WORKER_SECRET"];
  const token = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!secret || !token) return false;
  const { createHash, timingSafeEqual } = await import("node:crypto");
  const d = (v: string) => createHash("sha256").update(v, "utf8").digest();
  return timingSafeEqual(d(token), d(secret));
}

export const Route = createFileRoute("/api/public/crm-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Authenticate before any admin client or worker module is loaded.
        if (!(await workerSecretMatches(request))) {
          const denied = await authenticateCronRequest(request);
          if (denied) return new Response("Unauthorized", { status: 401 });
        }
        const { runCrmBatch } = await import("@/lib/crm-worker.server");
        const result = await runCrmBatch({ limit: 20 });
        return Response.json(result, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
