import businessCardsAsset from "@/assets/insert-card-modern-outpaint.png.asset.json";
import packagingAsset from "@/assets/rigid-product-boxes-outpaint.png.asset.json";
import flyersAsset from "@/assets/flyer-your-brand-outpaint.png.asset.json";
import rollupAsset from "@/assets/rollup-your-brand-outpaint.png.asset.json";
import labelsAsset from "@/assets/label-your-brand-outpaint.png.asset.json";
import brochuresAsset from "@/assets/magazine-outpaint.png.asset.json";
import menusAsset from "@/assets/menu-your-brand-outpaint.png.asset.json";
import stickersAsset from "@/assets/label-sticker-system-outpaint.png.asset.json";
import postersAsset from "@/assets/poster-outpaint.png.asset.json";
import textile from "@/assets/prod-textile.jpg";
import largeFormatAsset from "@/assets/billboard-modern-outpaint.png.asset.json";
import giftsAsset from "@/assets/business-items-outpaint.png.asset.json";
import books from "@/assets/product-books.jpg";

export const productImages: Record<string, string> = {
  "business-cards": labelsAsset.url,
  packaging: packagingAsset.url,
  flyers: flyersAsset.url,
  "roll-up-banners": rollupAsset.url,
  labels: businessCardsAsset.url,
  brochures: brochuresAsset.url,
  books,
  menus: menusAsset.url,
  stickers: stickersAsset.url,
  posters: postersAsset.url,
  "textile-printing": textile,
  "large-format": largeFormatAsset.url,
  "corporate-gifts": giftsAsset.url,
};
