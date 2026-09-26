import { createServerFn } from "@tanstack/react-start";

import { catalogueSummary, MAX_QUESTIONS, parseAssistantReply, type AssistantTurn } from "./print-assistant";

/** Stateless print-project assistant. Advice only: never writes options, orders or payments. */
export const askPrintAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: { turns: AssistantTurn[]; lang?: string; context?: string }) => {
    const turns = (Array.isArray(input?.turns) ? input.turns : [])
      .slice(-8)
      .map((t) => ({ role: t?.role === "assistant" ? "assistant" : "user", text: String(t?.text ?? "").slice(0, 600) }) as AssistantTurn)
      .filter((t) => t.text.trim());
    if (!turns.length || turns[turns.length - 1]?.role !== "user") throw new Error("Please describe your project.");
    const lang = ["fr", "en", "ar"].includes(String(input?.lang)) ? String(input.lang) : "fr";
    const context = String(input?.context ?? "").slice(0, 60);
    return { turns, lang, context };
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("The assistant is not available right now.");
    const language = data.lang === "ar" ? "Arabic" : data.lang === "en" ? "English" : "French";
    const asked = data.turns.filter((t) => t.role === "assistant").length;
    const mustRecommend = asked >= MAX_QUESTIONS;

    const instructions = `You are "Assistant Primple" for a Moroccan print shop. Write all text in ${language}.
Catalogue (the ONLY items you may recommend):
${catalogueSummary()}
${data.context ? `The customer is viewing: ${data.context}.` : ""}
Rules: ask at most ${MAX_QUESTIONS} very short questions (one at a time, under 15 words) in total (already asked: ${asked}). ${mustRecommend ? "You MUST recommend now." : "Recommend as soon as you have enough information."}
Never state or estimate prices, stock, availability, production or delivery dates, material specs beyond the option names above, and never create artwork. Never ask for card, bank or payment details. Packaging, boxes or anything not in the catalogue => kind "quote".
Reply with ONLY one JSON object, no markdown:
{"type":"question","text":"..."}
or {"type":"recommendation","kind":"product"|"pack"|"quote","slug":"<slug from catalogue or empty>","quantity":<number from its quantities or null>,"why":"<one short sentence: why it fits>","direction":"<one short sentence: support/finish direction using option names>"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions,
        input: data.turns.map((t) => ({ role: t.role, content: t.text })),
      }),
    });
    if (response.status === 429) throw new Error("Too many requests. Please try again in a minute.");
    if (response.status === 402 || response.status === 403) throw new Error("The assistant is not available right now.");
    if (!response.ok || !response.body) throw new Error("The assistant could not answer. Please try again.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let failed = false;
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
          if (evt.type === "response.refusal.delta" || evt.type === "response.failed" || evt.type === "error") failed = true;
        } catch {
          /* partial frame */
        }
      }
    }
    if (failed || !text.trim()) throw new Error("The assistant could not answer. Please try again.");
    return parseAssistantReply(text, asked);
  });
