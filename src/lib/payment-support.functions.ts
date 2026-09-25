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
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: `You help customers of Primple, a Moroccan print shop, whose card payment via YouCan Pay (MAD) failed. Reply in ${language} in at most 4 short sentences: the single most likely cause and one concrete next step (e.g. check card enabled for online/3-D Secure payments, bank limit, retry with the "Retry payment" button, try another card). Their order is saved and they are never charged twice for a failed payment. Never ask for card numbers, CVV or codes. If unresolved, suggest contacting Primple support.`,
        input: data.issue,
      }),
    });

    if (response.status === 429) throw new Error("Too many requests. Please try again in a minute.");
    if (response.status === 402 || response.status === 403) throw new Error("The assistant is not available right now.");
    if (!response.ok || !response.body) throw new Error("The assistant could not answer. Please try again.");

    // Consume the SSE stream server-side and keep only the final text.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const evt = JSON.parse(raw) as { type?: string; delta?: string };
          if (evt.type === "response.output_text.delta" && evt.delta) text += evt.delta;
          if (evt.type === "response.refusal.delta" || evt.type === "response.failed" || evt.type === "error") refused = true;
        } catch {
          /* ignore partial frames */
        }
      }
    }
    if (refused || !text.trim()) throw new Error("The assistant could not answer. Please try again.");
    return { suggestion: text.trim() };
  });

/** Staff-only pre-publish checklist. Reports presence/shape of keys only — never their values. */
export const getPaymentSetupChecklist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [admin, moderator] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "moderator" }),
    ]);
    if (!admin.data && !moderator.data) return { allowed: false as const, checks: [] };

    const pub = process.env["YOUCANPAY_PUBLIC_KEY"] ?? "";
    const pri = process.env["YOUCANPAY_PRIVATE_KEY"] ?? "";
    const pubEnv = pub.startsWith("pub_sandbox_") ? "sandbox" : pub.startsWith("pub_") ? "live" : null;
    const priEnv = pri.startsWith("pri_sandbox_") ? "sandbox" : pri.startsWith("pri_") ? "live" : null;

    const webhookUrl = "https://primple.ma/api/public/youcanpay-webhook";
    let webhookReachable = false;
    try {
      const r = await fetch(webhookUrl, { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
      webhookReachable = r.status === 401 || r.status === 400; // route live and rejecting unsigned calls
    } catch {
      webhookReachable = false;
    }

    const { data: confirmations } = await supabase
      .from("payment_events")
      .select("created_at, environment, event")
      .in("event", ["confirmation_paid", "confirmation_failed"])
      .order("created_at", { ascending: false })
      .limit(1);
    const lastConfirmation = confirmations?.[0] ?? null;

    const { data: tokens } = await supabase
      .from("payment_events")
      .select("created_at, ok, detail")
      .eq("event", "token_create")
      .order("created_at", { ascending: false })
      .limit(1);
    const lastToken = tokens?.[0] ?? null;

    type Status = "ok" | "fail" | "manual";
    const checks: Array<{ id: string; label: string; status: Status; detail: string }> = [
      { id: "public", label: "Public key saved", status: pubEnv ? "ok" : "fail", detail: pubEnv ? `Mode: ${pubEnv}` : "Add YOUCANPAY_PUBLIC_KEY in secrets." },
      { id: "private", label: "Private key saved (server only)", status: priEnv ? "ok" : "fail", detail: priEnv ? `Mode: ${priEnv}` : "Add YOUCANPAY_PRIVATE_KEY in secrets." },
      { id: "match", label: "Keys use the same mode", status: pubEnv && priEnv && pubEnv === priEnv ? "ok" : "fail", detail: pubEnv && priEnv ? (pubEnv === priEnv ? `Both ${pubEnv}` : "One key is sandbox, the other live.") : "Both keys are needed." },
      { id: "webhook", label: "Notification address online", status: webhookReachable ? "ok" : "fail", detail: webhookUrl },
      { id: "confirmation", label: "YouCan Pay notification received", status: lastConfirmation ? "ok" : "manual", detail: lastConfirmation ? `${lastConfirmation.environment} · ${new Date(lastConfirmation.created_at).toLocaleString()}` : `Set ${webhookUrl} in YouCan Pay, then place a test payment.` },
      { id: "domains", label: "Allowed domains accepted", status: lastToken?.ok ? "ok" : "manual", detail: lastToken?.ok ? "Last payment form was created successfully." : "Add primple.ma and www.primple.ma in YouCan Pay, then place a test payment." },
    ];
    return { allowed: true as const, checks };
  });
