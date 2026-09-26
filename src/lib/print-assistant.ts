import { contact } from "@/config/contact";
import { DESIGN_SERVICE_SLUG } from "@/data/design-service";
import { packs } from "@/data/packs";
import { products } from "@/data/products";

/** Pure helpers for the Primple print assistant (no network, testable). */

/** Safety stop only (prevents endless loops); the model decides when it knows enough. */
export const MAX_QUESTIONS = 6;

export type AssistantTurn = { role: "user" | "assistant"; text: string };

export type PlanItem = {
  kind: "product" | "pack" | "service" | "quote";
  slug: string | null;
  name: string;
  purpose: string;
  /** Only a quantity step that exists in the product data. */
  quantity: number | null;
  /** Only exact option choices that exist for that product. */
  options: { group: string; choice: string }[];
  href: string;
};

export type AssistantReply =
  | { type: "question"; text: string }
  | { type: "plan"; summary: string; items: PlanItem[] };

/** Catalogue context for the model: names, slugs, exact option names, quantity steps. No prices or dates. */
export function catalogueSummary() {
  const p = products
    .filter((x) => !x.quoteOnly)
    .map(
      (x) =>
        `product:${x.slug} | ${x.name} | options: ${x.options
          .map((g) => `${g.label} = ${g.choices.map((c) => c.label).join(" / ")}`)
          .join("; ")} | quantities: ${x.quantities.join(",")}`,
    );
  const q = products.filter((x) => x.quoteOnly).map((x) => `quote-only:${x.slug} | ${x.name} (use kind "quote")`);
  const k = packs.map((x) => `pack:${x.slug} | ${x.name} | for: ${x.audience}`);
  const s = `service:${DESIGN_SERVICE_SLUG} | Design help billed by the hour (adapting/preparing artwork; no logo creation)`;
  return [...p, ...q, ...k, s].join("\n");
}

function clean(s: unknown, max = 240) {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

/** Keep only option choices that exist verbatim (case/accents-insensitive) on the product. */
export function guardOptions(slug: string, raw: unknown): PlanItem["options"] {
  const prod = products.find((x) => x.slug === slug);
  if (!prod || !Array.isArray(raw)) return [];
  const out: PlanItem["options"] = [];
  for (const o of raw.slice(0, 4)) {
    const g = prod.options.find((x) => norm(x.label) === norm(String((o as { group?: unknown })?.group ?? "")));
    const c = g?.choices.find((x) => norm(x.label) === norm(String((o as { choice?: unknown })?.choice ?? "")));
    if (g && c) out.push({ group: g.label, choice: c.label });
  }
  return out;
}

function toItem(o: Record<string, unknown>): PlanItem {
  const kind = o["kind"];
  const slug = clean(o["slug"], 60);
  const purpose = clean(o["purpose"], 160);
  if (kind === "product") {
    const prod = products.find((x) => x.slug === slug);
    if (prod && !prod.quoteOnly) {
      const q = Number(o["quantity"]);
      const quantity = prod.quantities.includes(q) ? q : null;
      return { kind, slug, name: prod.name, purpose, quantity, options: guardOptions(slug, o["options"]), href: `/products/${slug}` };
    }
  }
  if (kind === "pack") {
    const pack = packs.find((x) => x.slug === slug);
    if (pack) return { kind, slug, name: pack.name, purpose, quantity: null, options: [], href: `/packs/${slug}` };
  }
  if (kind === "service" && slug === DESIGN_SERVICE_SLUG) {
    return { kind, slug, name: "Design service", purpose, quantity: null, options: [], href: "/design-services" };
  }
  return { kind: "quote", slug: null, name: "Custom quote", purpose, quantity: null, options: [], href: "/contact" };
}

/** Validate the model's JSON against the real catalogue. Unknown or malformed → quote. */
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
  const rawItems = Array.isArray(obj["items"]) ? (obj["items"] as Record<string, unknown>[]) : [];
  const items: PlanItem[] = [];
  for (const r of rawItems.slice(0, 4)) {
    const it = toItem(r ?? {});
    // one quote line is enough; no duplicate products
    if (items.some((x) => (x.kind === "quote" && it.kind === "quote") || (x.slug && x.slug === it.slug))) continue;
    items.push(it);
  }
  if (!items.length) items.push(toItem({}));
  return { type: "plan", summary: clean(obj["summary"], 200), items };
}

/** Prior assistant questions, sent back so the model never repeats them. */
export function askedQuestions(turns: AssistantTurn[]) {
  return turns.filter((t) => t.role === "assistant").map((t) => t.text);
}

/** WhatsApp text: product names, quantities and option names only — no personal or payment data. */
export function whatsappPlanUrl(items: PlanItem[], heading: string) {
  const lines = items.map((i) => {
    const bits = [i.name];
    if (i.quantity) bits.push(`× ${i.quantity}`);
    if (i.options.length) bits.push(`(${i.options.map((o) => o.choice).join(", ")})`);
    return `- ${bits.join(" ")}`;
  });
  return `${contact.whatsapp}?text=${encodeURIComponent([heading, ...lines].join("\n"))}`;
}
