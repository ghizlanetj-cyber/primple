import { createServerFn } from "@tanstack/react-start";

import { askedQuestions, catalogueSummary, MAX_QUESTIONS, parseAssistantReply, type AssistantTurn } from "./print-assistant";

/** Stateless print-project assistant. Advice only: never writes options, orders or payments. */
export const askPrintAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: { turns: AssistantTurn[]; lang?: string }) => {
    const turns = (Array.isArray(input?.turns) ? input.turns : [])
      .slice(-16)
      .map((t) => ({ role: t?.role === "assistant" ? "assistant" : "user", text: String(t?.text ?? "").slice(0, 600) }) as AssistantTurn)
      .filter((t) => t.text.trim());
    if (!turns.length || turns[turns.length - 1]?.role !== "user") throw new Error("Please describe your project.");
    const lang = ["fr", "en", "ar"].includes(String(input?.lang)) ? String(input.lang) : "fr";
    return { turns, lang };
  })
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("The assistant is not available right now.");
    const language = data.lang === "ar" ? "Arabic" : data.lang === "en" ? "English" : "French";
    const previous = askedQuestions(data.turns);
    const asked = previous.length;
    const mustRecommend = asked >= MAX_QUESTIONS;

    const instructions = `You are "Expert Designer Primple", a calm creative-studio advisor for a Moroccan print shop. Reply in the visitor's language (default ${language}).
Your job: turn a rough idea into a concise design/print brief covering business or event, target audience, goal, mood/style, essential content, and needed printed supports.
Catalogue — the ONLY products, packs and services you may recommend:
${catalogueSummary()}
Conversation rules: read the whole conversation. Ask only the single next useful short question (under 15 words), only if needed; stop once you can write a useful brief. Never ask anything already answered or already asked: ${previous.length ? previous.map((q) => `"${q}"`).join(", ") : "none"}. ${mustRecommend ? "You MUST give the brief now." : ""}
Rules: product options must be copied EXACTLY from the lists above or omitted; quantity must be one of the listed quantities or null. The design service only covers what is listed as included — never promise logo creation or brand identity. Custom packaging, special materials or fully bespoke projects => kind "quote". Never state prices, stock, availability, turnaround or delivery dates, guarantees, or approve artwork. Never ask for payment, card or bank data.
Reply with ONLY one JSON object, no markdown:
{"type":"question","text":"..."}
or {"type":"plan","goal":"<one sentence>","direction":"<one sentence: visual mood/style>","checklist":["<essential content item>", "..."],"next":"design"|"quote"|"configure","items":[{"kind":"product"|"pack"|"service"|"quote","slug":"<catalogue slug or empty>","purpose":"<one short sentence>","quantity":<number or null>,"options":[{"group":"<exact>","choice":"<exact>"}]}]} with 1 to 4 items and up to 6 checklist items.`;

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
