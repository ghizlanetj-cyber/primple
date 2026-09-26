import { describe, expect, it } from "vitest";

import {
  askedQuestions,
  catalogueSummary,
  guardOptions,
  MAX_QUESTIONS,
  parseAssistantReply,
  whatsappPlanUrl,
} from "./print-assistant";

const plan = (items: unknown[], summary = "") => JSON.stringify({ type: "plan", summary, items });

describe("print assistant", () => {
  it("keeps multi-turn context and lists prior questions so none repeat", () => {
    const turns = [
      { role: "user" as const, text: "Café à Casablanca" },
      { role: "assistant" as const, text: "Combien de tables ?" },
      { role: "user" as const, text: "12" },
      { role: "assistant" as const, text: "Livraison ou sur place ?" },
    ];
    expect(askedQuestions(turns)).toEqual(["Combien de tables ?", "Livraison ou sur place ?"]);
    expect(parseAssistantReply('{"type":"question","text":"Menus ?"}', 2).type).toBe("question");
    expect(parseAssistantReply('{"type":"question","text":"Menus ?"}', MAX_QUESTIONS).type).toBe("plan");
  });

  it("drops invented options and keeps exact catalogue ones", () => {
    const opts = guardOptions("business-cards", [
      { group: "Finish", choice: "Matte" },
      { group: "Finish", choice: "Lamination lavable" },
      { group: "Coating", choice: "Gloss" },
    ]);
    expect(opts).toEqual([{ group: "Finish", choice: "Matte" }]);
  });

  it("routes real products/packs to their pages and unknowns/packaging to quote", () => {
    const r = parseAssistantReply(
      plan([
        { kind: "product", slug: "menus", purpose: "Carte" },
        { kind: "pack", slug: "launch" },
        { kind: "product", slug: "packaging" },
        { kind: "product", slug: "mugs" },
      ]),
      0,
    );
    if (r.type !== "plan") throw new Error();
    expect(r.items.map((i) => i.href)).toEqual(["/products/menus", "/packs/launch", "/contact"]);
    expect(parseAssistantReply("garbage", 0)).toMatchObject({ type: "plan", items: [{ kind: "quote" }] });
  });

  it("never invents quantities, prices or dates", () => {
    const r = parseAssistantReply(plan([{ kind: "product", slug: "flyers", quantity: 777, price: 99, delivery: "demain" }]), 0);
    if (r.type !== "plan") throw new Error();
    expect(r.items[0]?.quantity).toBeNull();
    expect(JSON.stringify(r)).not.toMatch(/99|demain/);
    expect(catalogueSummary()).not.toMatch(/MAD|DH|days/i);
  });

  it("WhatsApp summary carries only product names, quantities and options", () => {
    const r = parseAssistantReply(plan([{ kind: "product", slug: "flyers", purpose: "Tel 0612345678 email a@b.c" }]), 0);
    if (r.type !== "plan") throw new Error();
    const url = decodeURIComponent(whatsappPlanUrl(r.items, "Plan:"));
    expect(url).toContain("wa.me/212631577677");
    expect(url).toContain("Flyers");
    expect(url).not.toMatch(/0612345678|a@b\.c/);
  });
});
