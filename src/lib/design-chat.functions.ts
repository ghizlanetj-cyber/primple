import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DesignChatMessage = {
  id: string;
  body: string;
  senderRole: "client" | "designer";
  createdAt: string;
};

type Ctx = { supabase: any; userId: string };

/** One conversation per customer, created the first time the chat opens. */
async function ensureConversation(context: Ctx): Promise<string> {
  const { data: existing } = await context.supabase
    .from("design_conversations")
    .select("id")
    .eq("user_id", context.userId)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: created, error } = await context.supabase
    .from("design_conversations")
    .insert({ user_id: context.userId })
    .select("id")
    .single();
  if (error || !created) throw new Error("The conversation could not be opened.");
  return created.id as string;
}

export const getDesignChat = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const conversationId = await ensureConversation(context as Ctx);
    const { data, error } = await (context as Ctx).supabase
      .from("design_messages")
      .select("id, body, sender_role, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error("The conversation could not be loaded.");
    const messages: DesignChatMessage[] = (data ?? []).map((row: any) => ({
      id: row.id,
      body: row.body,
      senderRole: row.sender_role === "designer" ? "designer" : "client",
      createdAt: row.created_at,
    }));
    return { conversationId, messages };
  });

export const sendDesignMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { body: string }) => {
    const body = String(input?.body ?? "").trim();
    if (body.length < 1) throw new Error("Write a message first.");
    if (body.length > 2000) throw new Error("Message is too long (2000 characters max).");
    return { body };
  })
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const conversationId = await ensureConversation(ctx);
    const { error } = await ctx.supabase.from("design_messages").insert({
      conversation_id: conversationId,
      sender_id: ctx.userId,
      sender_role: "client",
      body: data.body,
    });
    if (error) throw new Error("The message could not be sent.");
    await ctx.supabase
      .from("design_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    return { sent: true };
  });
