/** Server-only YouCan Pay logic: pricing, tokenisation, order writes, webhook verification. */
import { createHmac, timingSafeEqual } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

const SHOPIFY_API_VERSION = "2025-07";
const SHOPIFY_STORE_PERMANENT_DOMAIN = "primple-3rpv2-bk0jbkjy.myshopify.com";
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = "9409a4020366395ad63aa464847f6b6d";

const VARIANTS_QUERY = `
  query variants($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        title
        availableForSale
        price { amount currencyCode }
        product { title handle }
      }
    }
  }
`;

export interface PricedLine {
  variantId: string;
  quantity: number;
  title: string;
  variantTitle: string;
  unitAmount: string;
  currency: string;
  lineAmountCents: number;
}

export interface RequestedLine {
  variantId: string;
  quantity: number;
}

function privateKey(): string {
  const key = process.env["YOUCANPAY_PRIVATE_KEY"];
  if (!key) throw new Error("YouCan Pay is not configured.");
  return key;
}

export function youCanPayPublicKey(): string {
  const key = process.env["YOUCANPAY_PUBLIC_KEY"];
  if (!key) throw new Error("YouCan Pay is not configured.");
  return key;
}

export function isSandbox(): boolean {
  return privateKey().startsWith("pri_sandbox_");
}

function tokenizeUrl(): string {
  return isSandbox() ? "https://youcanpay.com/sandbox/api/tokenize" : "https://youcanpay.com/api/tokenize";
}

/** Prices are always re-read from Shopify; the browser never decides the amount. */
export async function priceLines(lines: RequestedLine[]): Promise<PricedLine[]> {
  const ids = [...new Set(lines.map((line) => line.variantId))];
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query: VARIANTS_QUERY, variables: { ids } }),
  });

  if (!response.ok) throw new Error("Could not read product prices.");
  const payload = (await response.json()) as {
    data?: {
      nodes?: Array<{
        id: string;
        title: string;
        availableForSale: boolean;
        price: { amount: string; currencyCode: string };
        product: { title: string };
      } | null>;
    };
  };

  const nodes = payload.data?.nodes ?? [];
  return lines.map((line) => {
    const node = nodes.find((entry) => entry?.id === line.variantId);
    if (!node) throw new Error("A product in the cart is no longer available.");
    if (!node.availableForSale) throw new Error(`${node.product.title} is out of stock.`);
    const unitCents = Math.round(Number(node.price.amount) * 100);
    return {
      variantId: line.variantId,
      quantity: line.quantity,
      title: node.product.title,
      variantTitle: node.title,
      unitAmount: node.price.amount,
      currency: node.price.currencyCode,
      lineAmountCents: unitCents * line.quantity,
    };
  });
}

export function shopReference(): string {
  return `SHP-${Math.floor(10000 + Math.random() * 89999)}`;
}

/** Records a payment step for staff diagnostics. Never stores keys or card data. */
export async function logPaymentEvent(entry: {
  reference?: string | null;
  orderKind?: "print" | "shop";
  event: string;
  ok: boolean;
  tokenId?: string | null;
  transactionId?: string | null;
  httpStatus?: number | null;
  detail?: string | null;
}): Promise<void> {
  try {
    let environment = "unknown";
    try {
      environment = isSandbox() ? "sandbox" : "live";
    } catch {
      environment = "unconfigured";
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payment_events").insert({
      reference: entry.reference ?? null,
      order_kind: entry.orderKind ?? (entry.reference?.startsWith("SHP-") ? "shop" : "print"),
      event: entry.event,
      environment,
      ok: entry.ok,
      youcanpay_token_id: entry.tokenId ?? null,
      youcanpay_transaction_id: entry.transactionId ?? null,
      http_status: entry.httpStatus ?? null,
      detail: entry.detail ? entry.detail.slice(0, 500) : null,
    });
  } catch (error) {
    console.error("[YouCanPay] diagnostics log failed", error);
  }
}

export async function tokenizePayment(input: {
  reference: string;
  amountCents: number;
  currency: string;
  successUrl: string;
  errorUrl: string;
  customerEmail?: string;
}): Promise<{ tokenId: string; transactionId: string | null }> {
  const body = new FormData();
  body.append("pri_key", privateKey());
  body.append("order_id", input.reference);
  body.append("amount", String(input.amountCents));
  body.append("currency", input.currency);
  body.append("success_url", input.successUrl);
  body.append("error_url", input.errorUrl);
  body.append("metadata[type]", "primple_shop");
  body.append("metadata[reference]", input.reference);
  if (input.customerEmail) body.append("customer[email]", input.customerEmail);

  const response = await fetch(tokenizeUrl(), { method: "POST", headers: { Accept: "application/json" }, body });
  const payload = (await response.json().catch(() => null)) as
    | { token?: string | { id?: string }; transaction_id?: string; message?: string }
    | null;

  if (!response.ok || !payload?.token) {
    console.error("[YouCanPay] tokenize failed", response.status, payload?.message ?? "");
    await logPaymentEvent({
      reference: input.reference,
      event: "token_create",
      ok: false,
      httpStatus: response.status,
      detail: payload?.message ?? "No token in response",
    });
    throw new Error("The payment could not be started. Please try again.");
  }

  const tokenId = typeof payload.token === "string" ? payload.token : (payload.token.id ?? "");
  if (!tokenId) throw new Error("The payment could not be started. Please try again.");

  await logPaymentEvent({
    reference: input.reference,
    event: "token_create",
    ok: true,
    tokenId,
    transactionId: payload.transaction_id ?? null,
    httpStatus: response.status,
  });
  return { tokenId, transactionId: payload.transaction_id ?? null };
}

/** HMAC-SHA256 of the raw body keyed with the private key, constant-time compared. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", privateKey()).update(rawBody).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (received.length !== computed.length) return false;
  return timingSafeEqual(received, computed);
}

/** Reads the caller's user id from the bearer token, or null for a guest. */
export async function optionalUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  if (token.split(".").length !== 3) return null;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;

  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
      },
    },
  });

  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}
