import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Staff-only list of payment steps. Keys and card data are never recorded. */
export const getPaymentDiagnostics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [admin, moderator] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "moderator" }),
    ]);
    if (!admin.data && !moderator.data) return { allowed: false as const, events: [] };

    const { data, error } = await supabase
      .from("payment_events")
      .select(
        "id, created_at, reference, order_kind, event, environment, ok, youcanpay_token_id, youcanpay_transaction_id, http_status, detail",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Diagnostics could not be loaded.");
    return { allowed: true as const, events: data ?? [] };
  });

/** Order details for a failed payment, only for its owner or the guest holding the claim token. */
export const getRetryableOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { reference: string; claimToken?: string }) => {
    const reference = String(input?.reference ?? "").trim();
    if (!/^PRM-\d{4,8}$/.test(reference)) throw new Error("Unknown order.");
    const claimToken = String(input?.claimToken ?? "").trim().slice(0, 200);
    return { reference, claimToken };
  })
  .handler(async ({ data }) => {
    const { optionalUserId } = await import("./youcanpay.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { canPayOrder } = await import("./order-access");
    const userId = await optionalUserId(getRequest()?.headers.get("authorization") ?? null);

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select(
        "id, user_id, claim_token, reference, items, subtotal, delivery, total, deposit_amount, balance_amount, payment_status",
      )
      .eq("reference", data.reference)
      .maybeSingle();
    if (!order || !canPayOrder(order, { userId, claimToken: data.claimToken || null })) return null;

    const items = (Array.isArray(order.items) ? order.items : []) as Array<{ name?: string; quantity?: number }>;
    return {
      id: order.id,
      reference: order.reference,
      items: items.map((i) => ({ name: String(i.name ?? ""), quantity: Number(i.quantity ?? 1) })),
      subtotal: Number(order.subtotal),
      delivery: Number(order.delivery),
      total: Number(order.total),
      deposit: Number(order.deposit_amount),
      balance: Number(order.balance_amount),
      paymentStatus: order.payment_status,
    };
  });

/** AI suggestion for the next troubleshooting step. Advice only — it never changes an order. */
export const suggestPaymentStep = createServerFn({ method: "POST" })
  .inputValidator((input: { issue: string; lang?: string }) => {
    const issue = String(input?.issue ?? "").trim().slice(0, 1500);
    if (issue.length < 5) throw new Error("Please describe the problem.");
    const lang = ["fr", "en", "ar"].includes(String(input?.lang)) ? String(input.lang) : "fr";
    return { issue, lang };
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("The assistant is not available right now.");
    const language = data.lang === "ar" ? "Arabic" : data.lang === "en" ? "English" : "French";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning: { effort: "low" },
        instructions: `You help customers of Primple, a Moroccan print shop, whose card payment via YouCan Pay (MAD) failed. Reply in ${language} in at most 4 short sentences: the single most likely cause and one concrete next step (e.g. check card enabled for online/3-D Secure payments, bank limit, retry with the "Retry payment" button, try another card). Their order is saved and they are never charged twice for a failed payment. Never ask for card numbers, CVV or codes. If unresolved, suggest contacting Primple support.`,
        input: data.issue,
      }),
    });

    if (response.status === 429) throw new Error("Too many requests. Please try again in a minute.");
    if (response.status === 402 || response.status === 403) throw new Error("The assistant is not available right now.");
    if (!response.ok) throw new Error("The assistant could not answer. Please try again.");

    const payload = (await response.json()) as {
      output_text?: string;
      output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
    };
    const text =
      payload.output_text ??
      (payload.output ?? [])
        .flatMap((o) => o.content ?? [])
        .filter((c) => c.type === "output_text")
        .map((c) => c.text ?? "")
        .join("\n");
    if (!text.trim()) throw new Error("The assistant could not answer. Please try again.");
    return { suggestion: text.trim() };
  });
