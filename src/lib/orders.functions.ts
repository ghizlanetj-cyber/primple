import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GuestOrderLineInput = {
  slug: string;
  quantity: number;
  selection: Record<string, string>;
  config?: string;
  artworkPath?: string;
  artworkGuestToken?: string;
};

export type GuestOrderInput = {
  lines: GuestOrderLineInput[];
  paymentMethod?: "card_youcanpay" | "deposit_50_cod" | "bank_transfer_50";
  details: {
    name: string;
    company?: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postcode: string;
  };
};

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function validateGuestOrder(input: GuestOrderInput): GuestOrderInput {
  if (!Array.isArray(input?.lines) || input.lines.length === 0) throw new Error("Your cart is empty.");
  if (input.lines.length > 30) throw new Error("Too many items in the cart.");

  const lines = input.lines.map((line) => {
    const quantity = Number(line?.quantity);
    if (!line?.slug || typeof line.slug !== "string") throw new Error("Invalid cart item.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99999) {
      throw new Error("Invalid quantity.");
    }
    const selection: Record<string, string> = {};
    for (const [key, value] of Object.entries(line.selection ?? {})) {
      selection[text(key, 40)] = text(value, 2000);
    }
    const artworkPath = text(line.artworkPath, 500);
    const artworkGuestToken = text(line.artworkGuestToken, 60);
    if ((artworkPath || artworkGuestToken) && !artworkPath.startsWith(`guests/${artworkGuestToken}/`)) {
      throw new Error("Invalid artwork upload.");
    }
    return {
      slug: text(line.slug, 80),
      quantity,
      selection,
      ...(artworkPath && artworkGuestToken ? { artworkPath, artworkGuestToken } : {}),
    };
  });

  const email = text(input.details?.email, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");

  return {
    lines,
    paymentMethod:
      input.paymentMethod === "deposit_50_cod" || input.paymentMethod === "bank_transfer_50"
        ? input.paymentMethod
        : "card_youcanpay",
    details: {
      name: text(input.details?.name, 120),
      company: text(input.details?.company, 120),
      email,
      phone: text(input.details?.phone, 40),
      address: text(input.details?.address, 240),
      city: text(input.details?.city, 80),
      postcode: text(input.details?.postcode, 20),
    },
  };
}

/**
 * Places an order for a visitor who is not signed in. Every amount is priced
 * from the catalog on the server; nothing about money comes from the browser.
 * The returned claim token lets the customer attach the order to an account
 * they create afterwards.
 */
export const createGuestOrder = createServerFn({ method: "POST" })
  .inputValidator(validateGuestOrder)
  .handler(async ({ data }) => {
    const { orderTotals } = await import("@/data/pricing");
    const { onlineAmountCents } = await import("./deposit");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const totals = orderTotals(data.lines);
    if (!totals) throw new Error("One of the items is no longer available.");
    const { subtotalCents, deliveryCents, totalCents } = totals;
    const maxDays = Math.max(3, totals.deliveryMax);
    const items = data.lines.map((line, index) => {
      const quote = totals.quotes[index]!;
      return {
        slug: line.slug,
        name: line.slug,
        quantity: line.quantity,
        config: Object.values(line.selection).join(" · ").slice(0, 300),
        selection: line.selection,
        unitPrice: quote.unitPrice,
        subtotal: quote.subtotal,
        printer: "Primple",
        productionDays: quote.productionDays,
      };
    });

    if (totalCents <= 0) throw new Error("The order total is invalid.");

    const reference = `PRM-${Math.floor(10000 + Math.random() * 89999)}`;
    const claimToken = crypto.randomUUID();
    const expected = new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: null,
        reference,
        status: "Order placed",
        items: JSON.parse(JSON.stringify(items)),
        subtotal: subtotalCents / 100,
        delivery: deliveryCents / 100,
        total: totalCents / 100,
        deposit_amount: onlineAmountCents(totalCents, data.paymentMethod) / 100,
        balance_amount: (totalCents - onlineAmountCents(totalCents, data.paymentMethod)) / 100,
        deposit_paid: false,
        payment_method: data.paymentMethod ?? "card_youcanpay",
        contact_name: data.details.name,
        company: data.details.company || null,
        email: data.details.email,
        guest_email: data.details.email,
        claim_token: claimToken,
        phone: data.details.phone,
        address: data.details.address,
        city: data.details.city,
        postcode: data.details.postcode,
        printer: "Primple",
        expected_at: expected.toISOString().slice(0, 10),
      })
      .select("id, reference, total, expected_at")
      .single();

    if (error || !order) {
      console.error("[orders] guest order insert failed", error?.message);
      throw new Error("The order could not be saved. Please try again.");
    }

    for (const line of data.lines) {
      if (!line.artworkPath || !line.artworkGuestToken) continue;
      const { error: fileError } = await supabaseAdmin
        .from("order_files")
        .update({ order_id: order.id, order_reference: order.reference, status: "attached" })
        .eq("path", line.artworkPath)
        .eq("guest_token", line.artworkGuestToken)
        .is("user_id", null)
        .is("order_id", null);
      if (fileError) throw new Error("The artwork could not be attached to the order.");
    }

    return {
      id: order.id,
      reference: order.reference,
      total: Number(order.total),
      expectedAt: order.expected_at,
      claimToken,
    };
  });

/**
 * Attaches a guest order to the signed-in account. Supabase only creates the
 * session once the email is verified, so this runs on a verified identity.
 * The order is only moved when the claim token matches and the email is the
 * one the order was placed with.
 */
export const claimGuestOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reference: string; claimToken: string }) => {
    const reference = text(input?.reference, 20);
    const claimToken = text(input?.claimToken, 60);
    if (!/^PRM-\d{4,8}$/.test(reference)) throw new Error("Unknown order.");
    if (!/^[0-9a-f-]{36}$/i.test(claimToken)) throw new Error("Unknown order.");
    return { reference, claimToken };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { canClaimOrder } = await import("./order-access");
    const email = (context.claims as { email?: string } | null)?.email ?? "";

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, guest_email, claim_token")
      .eq("reference", data.reference)
      .maybeSingle();

    if (!canClaimOrder(order, { userId: context.userId, email, claimToken: data.claimToken })) {
      return { claimed: false };
    }
    if (!order) return { claimed: false };

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        user_id: context.userId,
        claimed_at: new Date().toISOString(),
        claim_token: null,
      })
      .eq("id", order.id)
      .is("user_id", null);

    if (error) return { claimed: false };

    // Transfer only artwork already secured to this claimed order.
    await supabaseAdmin
      .from("order_files")
      .update({ user_id: context.userId, guest_token: null })
      .eq("order_id", order.id)
      .eq("order_reference", data.reference)
      .is("user_id", null);

    return { claimed: true };
  });
