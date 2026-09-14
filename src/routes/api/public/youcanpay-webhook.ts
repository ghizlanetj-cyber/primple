import { createFileRoute } from "@tanstack/react-router";

interface WebhookPayload {
  event_name?: string;
  payload?: {
    token?: { id?: string };
    transaction?: { id?: string; order_id?: string; status?: number };
  };
}

export const Route = createFileRoute("/api/public/youcanpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const { verifyWebhookSignature } = await import("@/lib/youcanpay.server");

        if (!verifyWebhookSignature(rawBody, request.headers.get("x-youcanpay-signature"))) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: WebhookPayload;
        try {
          event = JSON.parse(rawBody) as WebhookPayload;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const reference = event.payload?.transaction?.order_id;
        const tokenId = event.payload?.token?.id;
        if (!reference && !tokenId) return new Response("ok");

        const paid = event.event_name === "transaction.paid";
        const failed = event.event_name === "transaction.failed";
        if (!paid && !failed) return new Response("ok");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let query = supabaseAdmin
          .from("shop_orders")
          .update({
            status: paid ? "paid" : "failed",
            paid_at: paid ? new Date().toISOString() : null,
            youcanpay_transaction_id: event.payload?.transaction?.id ?? null,
          })
          .eq("status", "pending");

        query = reference ? query.eq("reference", reference) : query.eq("youcanpay_token_id", tokenId!);

        const { error } = await query;
        if (error) {
          console.error("[YouCanPay] webhook update failed", error.message);
          return new Response("Update failed", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
