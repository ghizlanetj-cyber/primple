import labelsAsset from "@/assets/prod-business-cards.png.asset.json";
import packagingAsset from "@/assets/prod-packaging.png.asset.json";
import flyersAsset from "@/assets/prod-flyers.png.asset.json";
import rollupAsset from "@/assets/prod-rollup.png.asset.json";
import businessCardsAsset from "@/assets/prod-labels.png.asset.json";
import brochuresAsset from "@/assets/prod-brochures.png.asset.json";
import menusAsset from "@/assets/prod-menus.png.asset.json";
import stickersAsset from "@/assets/prod-stickers.png.asset.json";
import postersAsset from "@/assets/prod-posters.png.asset.json";
import textile from "@/assets/prod-textile.jpg";
import largeFormatAsset from "@/assets/prod-large-format.png.asset.json";
import giftsAsset from "@/assets/prod-gifts.png.asset.json";

export const productImages: Record<string, string> = {
  "business-cards": businessCardsAsset.url,
  packaging: packagingAsset.url,
  flyers: flyersAsset.url,
  "roll-up-banners": rollupAsset.url,
  labels: labelsAsset.url,
  brochures: brochuresAsset.url,
  menus: menusAsset.url,
  stickers: stickersAsset.url,
  posters: postersAsset.url,
  "textile-printing": textile,
  "large-format": largeFormatAsset.url,
  "corporate-gifts": giftsAsset.url,
};
