import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const CONTACT_TOPICS = ["quote", "order", "artwork", "partnership", "other"] as const;

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(150).optional().default(""),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(5).max(3000),
  // Honeypot: real visitors never fill this hidden field.
  website: z.string().max(0).optional().default(""),
});

/**
 * Saves a contact or quote request. Only this server path may classify a
 * message as a quote, which is what routes it into the CRM outbox.
 */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Simple abuse limit: at most 3 messages per email every 10 minutes.
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("email", data.email.toLowerCase())
      .gte("created_at", since);
    if ((count ?? 0) >= 3) throw new Error("Too many messages. Please try again in a few minutes.");
    const { data: row, error } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        name: data.name,
        email: data.email.toLowerCase(),
        company: data.company || null,
        topic: data.topic,
        message: data.message,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("Message could not be saved.");
    if (data.topic === "quote") {
      await supabaseAdmin
        .from("message_meta")
        .upsert(
          { message_id: row.id, classification: "quote", classified_by: "system:quote_form" },
          { onConflict: "message_id" },
        );
    }
    return { ok: true };
  });
