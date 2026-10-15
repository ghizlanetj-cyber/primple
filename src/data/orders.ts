export type OrderStage =
  | "Order placed"
  | "Artwork approved"
  | "In production"
  | "Quality check"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export const orderStages: OrderStage[] = [
  "Order placed",
  "Artwork approved",
  "In production",
  "Quality check",
  "Shipped",
  "Delivered",
];
