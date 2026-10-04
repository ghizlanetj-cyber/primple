import { it, expect } from "vitest";
import { packs, packLineMinimum } from "@/data/packs";
it("defaults meet minimums", () => {
  const bad = packs.flatMap(p => p.lines.filter(l => l.quantity < packLineMinimum(p.slug, l.ref)).map(l => `${p.slug}:${l.ref}:${l.quantity}<${packLineMinimum(p.slug,l.ref)}`));
  expect(bad).toEqual([]);
});
