export type OrderStage =
  | "Order placed"
  | "Artwork approved"
  | "In production"
  | "Quality check"
  | "Shipped"
  | "Delivered";

export const orderStages: OrderStage[] = [
  "Order placed",
  "Artwork approved",
  "In production",
  "Quality check",
  "Shipped",
  "Delivered",
];
