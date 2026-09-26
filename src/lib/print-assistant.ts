import { packs } from "@/data/packs";
import { products } from "@/data/products";

/** Pure helpers for the Primple print assistant (no network, testable). */
export const MAX_QUESTIONS = 3;

export type AssistantTurn = { role: "user" | "assistant"; text: string };

export type AssistantReply =
  | { type: "question"; text: string }
  | {
      type: "recommendation";
      kind: "product" | "pack" | "quote";
      slug: string | null;
      name: string;
      quantity: number | null;
      direction: string;
      why: string;
      href: string;
    };

/** Catalogue summary given to the model: names, slugs, option categories, quantity steps. No prices. */
export function catalogueSummary() {
  const p = products
    .filter((x) => !x.quoteOnly)
    .map(
      (x) =>
        `product:${x.slug} | ${x.name} | options: ${x.options
          .map((g) => `${g.label} (${g.choices.map((c) => c.label).join("/")})`)
          .join("; ")} | quantities: ${x.quantities.join(",")}`,
    );
  const k = packs.map((x) => `pack:${x.slug} | ${x.name} | for: ${x.audience}`);
  return [...p, ...k].join("\n");
}

function clean(s: unknown, max = 240) {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * Validate the model's JSON against the real catalogue. Anything unknown,
 * quote-only (packaging) or malformed falls back to the quote/contact flow.
 */
export function parseAssistantReply(raw: string, questionsAsked: number): AssistantReply {
  let obj: Record<string, unknown> = {};
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    obj = m ? JSON.parse(m[0]) : {};
  } catch {
    obj = {};
  }
  if (obj["type"] === "question" && questionsAsked < MAX_QUESTIONS && clean(obj["text"])) {
    return { type: "question", text: clean(obj["text"], 200) };
  }
  const kind = obj["kind"];
  const slug = clean(obj["slug"], 60);
  const direction = clean(obj["direction"]);
  const why = clean(obj["why"], 200);
  const qty = Number(obj["quantity"]);
  const quantity = Number.isFinite(qty) && qty > 0 && qty <= 100000 ? Math.round(qty) : null;
  if (kind === "product") {
    const prod = products.find((x) => x.slug === slug);
    if (prod && !prod.quoteOnly) {
      return { type: "recommendation", kind: "product", slug, name: prod.name, quantity, direction, why, href: `/products/${slug}` };
    }
  }
  if (kind === "pack") {
    const pack = packs.find((x) => x.slug === slug);
    if (pack) {
      return { type: "recommendation", kind: "pack", slug, name: pack.name, quantity: null, direction, why, href: `/packs/${slug}` };
    }
  }
  return { type: "recommendation", kind: "quote", slug: null, name: "Custom quote", quantity: null, direction, why, href: "/contact" };
}
