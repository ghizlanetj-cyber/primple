import { artworkRefs } from "./artwork-attach";
export function checkoutIdentity(
  pricingKey: string | null,
  userId: string | null,
  items: {
    slug: string;
    quantity: number;
    selection: Record<string, string>;
    artworkPath?: string;
    artworkGuestToken?: string;
  }[],
) {
  return JSON.stringify([
    pricingKey,
    userId,
    items.map((i) => [i.slug, i.quantity, i.selection, artworkRefs([i])]),
  ]);
}

