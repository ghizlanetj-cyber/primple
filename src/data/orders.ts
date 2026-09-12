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

export type Order = {
  id: string;
  product: string;
  productSlug: string;
  config: string;
  quantity: number;
  total: number;
  printer: string;
  city: string;
  placed: string;
  expected: string;
  stage: OrderStage;
  progress: number;
  artwork: string;
};

export const orders: Order[] = [
  {
    id: "PRM-4821",
    product: "Business Cards",
    productSlug: "business-cards",
    config: "Premium 400g · Soft touch · Double-sided · Rounded",
    quantity: 500,
    total: 1250,
    printer: "Atlas Print Studio",
    city: "Casablanca",
    placed: "September 8, 2026",
    expected: "September 18, 2026",
    stage: "In production",
    progress: 65,
    artwork: "primpel-cards-v3.pdf",
  },
  {
    id: "PRM-4799",
    product: "Stickers",
    productSlug: "stickers",
    config: "Vinyl · Custom shape · Gloss",
    quantity: 1000,
    total: 690,
    printer: "Medina Graphics",
    city: "Rabat",
    placed: "September 5, 2026",
    expected: "September 15, 2026",
    stage: "Quality check",
    progress: 82,
    artwork: "sticker-set-final.pdf",
  },
  {
    id: "PRM-4760",
    product: "Flyers",
    productSlug: "flyers",
    config: "A5 · Standard 300g · Double-sided",
    quantity: 2500,
    total: 1480,
    printer: "Kasbah Press",
    city: "Marrakech",
    placed: "August 29, 2026",
    expected: "September 6, 2026",
    stage: "Delivered",
    progress: 100,
    artwork: "autumn-promo.pdf",
  },
  {
    id: "PRM-4712",
    product: "Roll-up Banners",
    productSlug: "roll-up-banners",
    config: "100 × 200 cm · Premium base",
    quantity: 2,
    total: 1790,
    printer: "Atlas Print Studio",
    city: "Casablanca",
    placed: "August 21, 2026",
    expected: "August 27, 2026",
    stage: "Delivered",
    progress: 100,
    artwork: "expo-banner.pdf",
  },
];

export type Quote = {
  id: string;
  product: string;
  quantity: number;
  printer: string;
  city: string;
  rating: number;
  price: number;
  production: string;
  delivery: string;
  notes: string;
  status: "Open" | "Accepted" | "Declined";
};

export const quotes: Quote[] = [
  {
    id: "Q-2291",
    product: "Packaging — mailer boxes",
    quantity: 500,
    printer: "Atlas Print Studio",
    city: "Casablanca",
    rating: 4.9,
    price: 7250,
    production: "5–6 days",
    delivery: "2 days",
    notes: "Includes one physical sample before the full run.",
    status: "Open",
  },
  {
    id: "Q-2290",
    product: "Packaging — mailer boxes",
    quantity: 500,
    printer: "Medina Graphics",
    city: "Rabat",
    rating: 4.8,
    price: 6840,
    production: "6–7 days",
    delivery: "3 days",
    notes: "Recycled kraft in stock this week.",
    status: "Open",
  },
  {
    id: "Q-2288",
    product: "Textile — 120 polos",
    quantity: 120,
    printer: "Kasbah Press",
    city: "Marrakech",
    rating: 4.7,
    price: 12400,
    production: "4 days",
    delivery: "2 days",
    notes: "Embroidery on left chest, size breakdown confirmed.",
    status: "Open",
  },
];

export type Invoice = {
  id: string;
  order: string;
  date: string;
  amount: number;
  status: "Paid" | "Due";
};

export const invoices: Invoice[] = [
  { id: "INV-10442", order: "PRM-4821", date: "September 8, 2026", amount: 1250, status: "Paid" },
  { id: "INV-10430", order: "PRM-4799", date: "September 5, 2026", amount: 690, status: "Paid" },
  { id: "INV-10399", order: "PRM-4760", date: "August 29, 2026", amount: 1480, status: "Paid" },
  { id: "INV-10377", order: "PRM-4712", date: "August 21, 2026", amount: 1790, status: "Due" },
];
