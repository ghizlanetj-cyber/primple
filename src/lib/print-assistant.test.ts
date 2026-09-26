import { describe, expect, it } from "vitest";

import { catalogueSummary, parseAssistantReply } from "./print-assistant";

describe("print assistant", () => {
  it("accepts a known product and links to its configurator", () => {
    const r = parseAssistantReply('{"type":"recommendation","kind":"product","slug":"flyers","quantity":500,"direction":"Matte"}', 1);
    expect(r).toMatchObject({ kind: "product", href: "/products/flyers", quantity: 500 });
  });
  it("routes unknown or packaging to quote", () => {
    expect(parseAssistantReply('{"kind":"product","slug":"mugs"}', 0)).toMatchObject({ kind: "quote", href: "/contact" });
    expect(parseAssistantReply('{"kind":"product","slug":"packaging"}', 0)).toMatchObject({ kind: "quote" });
    expect(parseAssistantReply("not json", 0)).toMatchObject({ kind: "quote" });
  });
  it("stops asking after 3 questions", () => {
    expect(parseAssistantReply('{"type":"question","text":"Size?"}', 2).type).toBe("question");
    expect(parseAssistantReply('{"type":"question","text":"Size?"}', 3).type).toBe("recommendation");
  });
  it("links packs and gives no prices to the model", () => {
    expect(parseAssistantReply('{"kind":"pack","slug":"launch"}', 0)).toMatchObject({ href: "/packs/launch" });
    expect(catalogueSummary()).not.toMatch(/MAD|DH/);
  });
});
