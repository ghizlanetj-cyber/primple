export type Printer = {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviews: number;
  turnaround: string;
  distanceKm: number;
  capability: string;
  priceFactor: number;
  note: string;
};

export const printers: Printer[] = [
  {
    id: "atlas",
    name: "Atlas Print Studio",
    city: "Casablanca",
    rating: 4.9,
    reviews: 318,
    turnaround: "2–3 day production",
    distanceKm: 4,
    capability: "Offset & digital, soft touch, spot UV",
    priceFactor: 1,
    note: "Sends a digital proof within two hours.",
  },
  {
    id: "medina",
    name: "Medina Graphics",
    city: "Rabat",
    rating: 4.8,
    reviews: 204,
    turnaround: "3–4 day production",
    distanceKm: 88,
    capability: "Digital, die-cutting, labels",
    priceFactor: 0.93,
    note: "Best price on runs above 1,000 units.",
  },
  {
    id: "kasbah",
    name: "Kasbah Press",
    city: "Marrakech",
    rating: 4.7,
    reviews: 141,
    turnaround: "1–2 day production",
    distanceKm: 240,
    capability: "Fast digital, large format",
    priceFactor: 1.12,
    note: "Fastest option when you need it this week.",
  },
];
