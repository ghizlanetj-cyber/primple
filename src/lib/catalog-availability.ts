import { getPack } from "@/data/packs";
export type Availability = { kind: string; slug: string; available: boolean };
export function isUnavailable(rows: Availability[], kind: "product" | "pack", slug: string) {
  if (rows.some((r) => r.kind === kind && r.slug === slug && !r.available)) return true;
  return (
    kind === "pack" &&
    Boolean(
      getPack(slug)?.lines.some(
        (l) =>
          l.kind === "product" &&
          rows.some((r) => r.kind === "product" && r.slug === l.ref && !r.available),
      ),
    )
  );
}
