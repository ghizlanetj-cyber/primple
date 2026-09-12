export type OptionChoice = {
  id: string;
  label: string;
  note?: string;
  /** multiplier applied to the base unit price */
  factor?: number;
  /** flat addition to the order total */
  flat?: number;
  /** extra production days */
  days?: number;
};

export type OptionGroup = {
  id: string;
  label: string;
  help?: string;
  choices: OptionChoice[];
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  benefit: string;
  heroHeadline: string;
  heroCopy: string;
  description: string;
  fromPrice: number;
  /** price per unit at the reference quantity */
  unitPrice: number;
  quantities: number[];
  baseProductionDays: number;
  rating: number;
  reviews: number;
  keywords: string[];
  options: OptionGroup[];
  faqs: { q: string; a: string }[];
};

const paper: OptionGroup = {
  id: "paper",
  label: "Paper",
  help: "The feel of the finished print.",
  choices: [
    { id: "standard", label: "Standard", note: "300g coated", factor: 1 },
    { id: "premium", label: "Premium", note: "400g uncoated", factor: 1.28 },
    { id: "recycled", label: "Recycled", note: "350g natural", factor: 1.18 },
    { id: "textured", label: "Textured", note: "350g felt", factor: 1.36, days: 1 },
  ],
};

const finish: OptionGroup = {
  id: "finish",
  label: "Finish",
  help: "How light reacts to the surface.",
  choices: [
    { id: "matte", label: "Matte", factor: 1 },
    { id: "gloss", label: "Gloss", factor: 1.05 },
    { id: "soft-touch", label: "Soft touch", factor: 1.22, days: 1 },
    { id: "spot-uv", label: "Spot UV", factor: 1.35, days: 2 },
  ],
};

const sides: OptionGroup = {
  id: "printing",
  label: "Printing",
  choices: [
    { id: "single", label: "Single-sided", factor: 1 },
    { id: "double", label: "Double-sided", factor: 1.15 },
  ],
};

const size: OptionGroup = {
  id: "size",
  label: "Size",
  choices: [
    { id: "standard", label: "Standard", note: "85 × 55 mm", factor: 1 },
    { id: "square", label: "Square", note: "55 × 55 mm", factor: 1.08 },
    { id: "custom", label: "Custom", note: "Tell us your size", factor: 1.2, days: 1 },
  ],
};

const corners: OptionGroup = {
  id: "corners",
  label: "Corners",
  choices: [
    { id: "square", label: "Square", factor: 1 },
    { id: "rounded", label: "Rounded", factor: 1.1 },
  ],
};

export const deliveryGroup: OptionGroup = {
  id: "delivery",
  label: "Delivery",
  help: "Express moves your job to the front of the queue.",
  choices: [
    { id: "standard", label: "Standard", note: "3–5 days", flat: 0 },
    { id: "express", label: "Express", note: "1–2 days", flat: 120, days: -1 },
  ],
};

function group(id: string, label: string, choices: OptionChoice[], help?: string): OptionGroup {
  return help ? { id, label, choices, help } : { id, label, choices };
}

export const products: Product[] = [
  {
    slug: "business-cards",
    name: "Business Cards",
    category: "Stationery",
    benefit: "Make the first impression count.",
    heroHeadline: "Business cards that look as good as your brand.",
    heroCopy:
      "Choose your paper, finish and quantity. Upload your artwork and get your printing options instantly.",
    description:
      "Printed by verified partners on premium stock, checked before production and delivered with tracking. Order 100 cards for a new hire or 5,000 for the whole team — the price is on screen before you commit.",
    fromPrice: 61,
    unitPrice: 0.61,

    quantities: [100, 250, 500, 1000, 2500],
    baseProductionDays: 2,
    rating: 4.9,
    reviews: 412,
    keywords: ["business card printing", "premium business cards", "print business cards Morocco"],
    options: [size, paper, finish, sides, corners, deliveryGroup],
    faqs: [
      {
        q: "Can I print two different card designs in one order?",
        a: "Yes. Add each design as its own item in the cart — your printer receives them as one job.",
      },
      {
        q: "What file should I upload?",
        a: "A PDF with 3 mm bleed works best. We check resolution and bleed before production and tell you if anything needs attention.",
      },
    ],
  },
  {
    slug: "packaging",
    name: "Packaging",
    category: "Packaging",
    benefit: "Boxes your customers keep.",
    heroHeadline: "Packaging that survives shipping and sells your product.",
    heroCopy:
      "Pick your box format, material and finish. Get production times and pricing without waiting for a supplier reply.",
    description:
      "Mailer boxes, folding cartons and sleeves produced by partners with die-cutting capability. Structural files and mockups reviewed before production starts.",
    fromPrice: 1450,
    unitPrice: 14.5,
    quantities: [100, 250, 500, 1000],
    baseProductionDays: 6,
    rating: 4.8,
    reviews: 128,
    keywords: ["custom packaging printing", "mailer boxes", "folding cartons"],
    options: [
      group("format", "Format", [
        { id: "mailer", label: "Mailer box", factor: 1 },
        { id: "carton", label: "Folding carton", factor: 0.85 },
        { id: "sleeve", label: "Sleeve", factor: 0.62 },
      ]),
      group("material", "Material", [
        { id: "kraft", label: "Kraft", factor: 1 },
        { id: "white", label: "White board", factor: 1.12 },
        { id: "rigid", label: "Rigid board", factor: 1.6, days: 3 },
      ]),
      finish,
      deliveryGroup,
    ],
    faqs: [
      {
        q: "Do you provide a dieline?",
        a: "Yes. Choose your format and we send the dieline template before you upload artwork.",
      },
      {
        q: "Can I order a sample first?",
        a: "Most packaging partners produce a single physical sample before the full run. Request it in the quote.",
      },
    ],
  },
  {
    slug: "flyers",
    name: "Flyers",
    category: "Marketing",
    benefit: "Get the word out this week.",
    heroHeadline: "Flyers printed and delivered while the offer is still on.",
    heroCopy: "Choose size, paper and quantity. See the price and the delivery date instantly.",
    description:
      "A5, A4 and DL flyers on coated or uncoated stock, printed in as little as one working day by partners near you.",
    fromPrice: 108,
    unitPrice: 0.43,
    quantities: [250, 500, 1000, 2500, 5000],
    baseProductionDays: 1,
    rating: 4.8,
    reviews: 306,
    keywords: ["flyer printing", "cheap flyers", "A5 flyer print"],
    options: [
      group("size", "Size", [
        { id: "a6", label: "A6", factor: 0.59 },
        { id: "a5", label: "A5", factor: 1 },
        { id: "a4", label: "A4", factor: 2 },
        { id: "dl", label: "DL", factor: 1 },
      ]),

      paper,
      sides,
      deliveryGroup,
    ],
    faqs: [
      {
        q: "How fast can flyers be printed?",
        a: "Standard production is one working day with express delivery available in most cities.",
      },
      { q: "Can I split the delivery?", a: "Yes — add a second address at checkout." },
    ],
  },
  {
    slug: "roll-up-banners",
    name: "Roll-up Banners",
    category: "Large Format",
    benefit: "Show up ready at every event.",
    heroHeadline: "Roll-up banners that set up in seconds.",
    heroCopy: "Choose size and base quality, upload artwork and see your price with delivery.",
    description:
      "Printed on anti-curl banner media with aluminium cassettes and a carry bag included.",
    fromPrice: 690,
    unitPrice: 690,
    quantities: [1, 2, 5, 10],
    baseProductionDays: 2,
    rating: 4.7,
    reviews: 94,
    keywords: ["roll up banner printing", "pull up banner", "event banner"],
    options: [
      group("size", "Size", [
        { id: "80", label: "80 × 200 cm", factor: 1 },
        { id: "100", label: "100 × 200 cm", factor: 1.18 },
        { id: "150", label: "150 × 200 cm", factor: 1.55 },
      ]),
      group("base", "Base", [
        { id: "standard", label: "Standard", factor: 1 },
        { id: "premium", label: "Premium", note: "Heavier, quieter mechanism", factor: 1.3 },
      ]),
      deliveryGroup,
    ],
    faqs: [
      {
        q: "Is the stand included?",
        a: "Yes — cassette, pole and carry bag come with every banner.",
      },
      {
        q: "Can I reprint just the graphic later?",
        a: "Yes. Reorder the graphic only from your dashboard.",
      },
    ],
  },
  {
    slug: "labels",
    name: "Labels",
    category: "Packaging",
    benefit: "Label every batch on time.",
    heroHeadline: "Labels that stay on the product.",
    heroCopy: "Choose shape, material and quantity — pricing and production time update as you go.",
    description:
      "Roll or sheet labels on paper, transparent or waterproof material, die-cut to shape.",
    fromPrice: 280,
    unitPrice: 0.28,
    quantities: [500, 1000, 2500, 5000, 10000],
    baseProductionDays: 3,
    rating: 4.9,
    reviews: 187,
    keywords: ["label printing", "waterproof labels", "roll labels"],
    options: [
      group("shape", "Shape", [
        { id: "circle", label: "Circle", factor: 1 },
        { id: "square", label: "Square", factor: 0.96 },
        { id: "custom", label: "Custom die-cut", factor: 1.25, days: 2 },
      ]),
      group("material", "Material", [
        { id: "paper", label: "Paper", factor: 1 },
        { id: "waterproof", label: "Waterproof", factor: 1.3 },
        { id: "transparent", label: "Transparent", factor: 1.35 },
      ]),
      finish,
      deliveryGroup,
    ],
    faqs: [
      { q: "Rolls or sheets?", a: "Both. Choose rolls if you apply labels with a machine." },
      {
        q: "Are they fridge and freezer safe?",
        a: "Choose waterproof material for cold and humid storage.",
      },
    ],
  },
  {
    slug: "brochures",
    name: "Brochures",
    category: "Marketing",
    benefit: "Explain your offer properly.",
    heroHeadline: "Brochures that hold their shape and their story.",
    heroCopy: "Pick pages, fold and paper. Price and production time update instantly.",
    description:
      "Folded leaflets and stitched brochures from 4 to 32 pages, printed and trimmed to size.",
    fromPrice: 540,
    unitPrice: 2.7,
    quantities: [200, 500, 1000, 2500],
    baseProductionDays: 3,
    rating: 4.8,
    reviews: 121,
    keywords: ["brochure printing", "folded leaflet", "company brochure print"],
    options: [
      group("pages", "Pages", [
        { id: "4", label: "4 pages", factor: 1 },
        { id: "8", label: "8 pages", factor: 1.6 },
        { id: "16", label: "16 pages", factor: 2.4, days: 1 },
      ]),
      group("fold", "Fold / binding", [
        { id: "half", label: "Half fold", factor: 1 },
        { id: "tri", label: "Tri fold", factor: 1.06 },
        { id: "stitched", label: "Saddle stitched", factor: 1.2, days: 1 },
      ]),
      paper,
      deliveryGroup,
    ],
    faqs: [
      {
        q: "Do you print page numbers?",
        a: "Only what's in your artwork — we print exactly what you upload.",
      },
      {
        q: "Can I get a digital proof?",
        a: "Yes, a PDF proof is sent for approval before production.",
      },
    ],
  },
  {
    slug: "menus",
    name: "Menus",
    category: "Hospitality",
    benefit: "Change your prices without a reprint headache.",
    heroHeadline: "Menus built for daily service.",
    heroCopy: "Choose size, material and laminate. See the price before you print.",
    description:
      "Wipe-clean laminated menus, folded card menus and daily inserts for restaurants and cafés.",
    fromPrice: 220,
    unitPrice: 8.8,
    quantities: [25, 50, 100, 250],
    baseProductionDays: 2,
    rating: 4.9,
    reviews: 78,
    keywords: ["menu printing", "restaurant menu print", "laminated menus"],
    options: [
      group("size", "Size", [
        { id: "a4", label: "A4", factor: 1 },
        { id: "a3", label: "A3 folded", factor: 1 },

        { id: "long", label: "Long menu", factor: 1.15 },
      ]),
      group("protection", "Protection", [
        { id: "none", label: "None", factor: 1 },
        { id: "laminate", label: "Wipe-clean laminate", factor: 1.25 },
        { id: "synthetic", label: "Synthetic paper", factor: 1.45, days: 1 },
      ]),
      deliveryGroup,
    ],
    faqs: [
      { q: "Can I order a small run?", a: "Yes — from 25 menus." },
      {
        q: "Can I reorder with new prices?",
        a: "Reorder from your dashboard and upload the updated file.",
      },
    ],
  },
  {
    slug: "stickers",
    name: "Stickers",
    category: "Packaging",
    benefit: "Brand every box and bag.",
    heroHeadline: "Stickers cut to whatever shape you need.",
    heroCopy: "Choose material, shape and quantity — the price updates as you choose.",
    description: "Die-cut vinyl and paper stickers in sheets or rolls, indoor or outdoor rated.",
    fromPrice: 240,
    unitPrice: 0.24,
    quantities: [250, 500, 1000, 2500, 5000],
    baseProductionDays: 2,
    rating: 4.9,
    reviews: 264,
    keywords: ["sticker printing", "die cut stickers", "vinyl stickers"],
    options: [
      group("material", "Material", [
        { id: "paper", label: "Paper", factor: 1 },
        { id: "vinyl", label: "Vinyl", factor: 1.3 },
        { id: "holographic", label: "Holographic", factor: 1.7, days: 1 },
      ]),
      group("shape", "Shape", [
        { id: "circle", label: "Circle", factor: 1 },
        { id: "rect", label: "Rectangle", factor: 0.98 },
        { id: "custom", label: "Custom shape", factor: 1.2, days: 1 },
      ]),
      finish,
      deliveryGroup,
    ],
    faqs: [
      {
        q: "Will they survive outdoors?",
        a: "Choose vinyl — it's rated for two to three years outdoors.",
      },
      { q: "Minimum order?", a: "250 stickers." },
    ],
  },
  {
    slug: "posters",
    name: "Posters",
    category: "Large Format",
    benefit: "Fill the window by the weekend.",
    heroHeadline: "Posters printed sharp, delivered flat or rolled.",
    heroCopy: "Choose size, paper and quantity and see the price with delivery included.",
    description: "A3 to B0 posters on satin, matte or heavy art paper.",
    fromPrice: 180,
    unitPrice: 18,
    quantities: [10, 25, 50, 100, 250],
    baseProductionDays: 2,
    rating: 4.8,
    reviews: 143,
    keywords: ["poster printing", "large poster print", "A1 poster"],
    options: [
      group("size", "Size", [
        { id: "a3", label: "A3", factor: 1 },
        { id: "a2", label: "A2", factor: 1.5 },
        { id: "a1", label: "A1", factor: 2.2 },
        { id: "b0", label: "B0", factor: 3.4 },
      ]),
      paper,
      deliveryGroup,
    ],
    faqs: [
      {
        q: "Flat or rolled?",
        a: "Rolled in a tube as standard; flat delivery is available on request.",
      },
      { q: "Can I mix sizes?", a: "Yes — add each size as its own cart item." },
    ],
  },
  {
    slug: "textile-printing",
    name: "Textile Printing",
    category: "Textile",
    benefit: "Kit out the whole team.",
    heroHeadline: "T-shirts, polos and workwear printed to your brand.",
    heroCopy: "Choose garment, print method and sizes. Pricing and production time update live.",
    description: "Screen printing, DTF and embroidery on shirts, hoodies, aprons and caps.",
    fromPrice: 890,
    unitPrice: 89,
    quantities: [10, 25, 50, 100, 250],
    baseProductionDays: 4,
    rating: 4.7,
    reviews: 96,
    keywords: ["t-shirt printing", "custom workwear", "embroidery printing"],
    options: [
      group("garment", "Garment", [
        { id: "tshirt", label: "T-shirt", factor: 1 },
        { id: "polo", label: "Polo", factor: 1.35 },
        { id: "hoodie", label: "Hoodie", factor: 2.1 },
        { id: "cap", label: "Cap", factor: 0.8 },
      ]),
      group("method", "Print method", [
        { id: "dtf", label: "DTF transfer", factor: 1 },
        { id: "screen", label: "Screen print", factor: 1.1 },
        { id: "embroidery", label: "Embroidery", factor: 1.4, days: 2 },
      ]),
      deliveryGroup,
    ],
    faqs: [
      { q: "Can I mix sizes in one order?", a: "Yes — give the size breakdown after upload." },
      { q: "Will the print last?", a: "All methods are tested for at least 40 domestic washes." },
    ],
  },
  {
    slug: "large-format",
    name: "Large Format",
    category: "Large Format",
    benefit: "Own the storefront and the stand.",
    heroHeadline: "Large format printing sized for the space you have.",
    heroCopy:
      "Enter your dimensions, choose material and finishing, and see the price immediately.",
    description: "PVC banners, mesh, forex boards, window vinyl and exhibition graphics.",
    fromPrice: 240,
    unitPrice: 240,
    quantities: [1, 2, 5, 10, 25],
    baseProductionDays: 3,
    rating: 4.8,
    reviews: 87,
    keywords: ["large format printing", "PVC banner", "window vinyl print"],
    options: [
      group("material", "Material", [
        { id: "pvc", label: "PVC banner", factor: 1 },
        { id: "mesh", label: "Mesh", factor: 1.15 },
        { id: "forex", label: "Forex board", factor: 1.5 },
        { id: "vinyl", label: "Window vinyl", factor: 1.3 },
      ]),
      group("finishing", "Finishing", [
        { id: "hem", label: "Hem & eyelets", factor: 1 },
        { id: "pole", label: "Pole pockets", factor: 1.12 },
        { id: "none", label: "Trim only", factor: 0.92 },
      ]),
      deliveryGroup,
    ],
    faqs: [
      {
        q: "Can you install it?",
        a: "Some partners offer installation — it appears in their offer when available.",
      },
      { q: "Is it weatherproof?", a: "Yes, all outdoor materials are UV and rain rated." },
    ],
  },
  {
    slug: "corporate-gifts",
    name: "Corporate Gifts",
    category: "Gifts",
    benefit: "Say thank you with your logo on it.",
    heroHeadline: "Corporate gifts your clients actually use.",
    heroCopy: "Choose the item, branding method and quantity, then see the price with delivery.",
    description: "Notebooks, bottles, tote bags, pens and gift sets branded with your identity.",
    fromPrice: 1200,
    unitPrice: 24,
    quantities: [50, 100, 250, 500],
    baseProductionDays: 5,
    rating: 4.7,
    reviews: 63,
    keywords: ["corporate gifts printing", "branded merchandise", "company gifts"],
    options: [
      group("item", "Item", [
        { id: "notebook", label: "Notebook", factor: 1 },
        { id: "bottle", label: "Bottle", factor: 1.6 },
        { id: "tote", label: "Tote bag", factor: 0.9 },
        { id: "giftset", label: "Gift set", factor: 2.6 },
      ]),
      group("branding", "Branding", [
        { id: "print", label: "Print", factor: 1 },
        { id: "engrave", label: "Engraving", factor: 1.25, days: 2 },
        { id: "emboss", label: "Embossing", factor: 1.2, days: 1 },
      ]),
      deliveryGroup,
    ],
    faqs: [
      { q: "Can I get a branded sample?", a: "Yes, request one in the quote before the full run." },
      { q: "Can you deliver to several offices?", a: "Yes — add multiple addresses at checkout." },
    ],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export type Selection = Record<string, string>;

export function defaultSelection(product: Product): Selection {
  const sel: Selection = {};
  for (const g of product.options) sel[g.id] = g.choices[0]!.id;
  return sel;
}

export type Quote = {
  unitPrice: number;
  subtotal: number;
  delivery: number;
  total: number;
  productionDays: number;
  deliveryMin: number;
  deliveryMax: number;
  savingsPercent: number;
};

/** Quantity breaks: bigger runs cost less per unit. */
function quantityFactor(product: Product, quantity: number) {
  const base = product.quantities[0]!;
  const ratio = quantity / base;
  return Math.max(0.45, Math.pow(ratio, -0.16));
}

export function priceQuote(product: Product, quantity: number, selection: Selection): Quote {
  let factor = 1;
  let flat = 0;
  let extraDays = 0;

  for (const g of product.options) {
    const choice = g.choices.find((c) => c.id === selection[g.id]) ?? g.choices[0]!;
    factor *= choice.factor ?? 1;
    flat += choice.flat ?? 0;
    extraDays += choice.days ?? 0;
  }

  const qFactor = quantityFactor(product, quantity);
  const unitPrice = product.unitPrice * factor * qFactor;
  const subtotal = unitPrice * quantity;
  const delivery = flat;
  const productionDays = Math.max(1, product.baseProductionDays + extraDays);
  const express = selection["delivery"] === "express";

  return {
    unitPrice,
    subtotal,
    delivery,
    total: subtotal + delivery,
    productionDays,
    deliveryMin: express ? 1 : 3,
    deliveryMax: express ? 2 : 5,
    savingsPercent: Math.round((1 - qFactor) * 100),
  };
}

export function selectionLabels(product: Product, selection: Selection) {
  return product.options.map((g) => {
    const choice = g.choices.find((c) => c.id === selection[g.id]) ?? g.choices[0]!;
    return { group: g.label, value: choice.label };
  });
}
