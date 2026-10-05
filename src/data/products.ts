import { fromCents, toCents } from "@/lib/format";

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

/** Market reference: this exact configuration costs exactly `subtotal` MAD. */
export type PriceAnchor = {
  quantity: number;
  subtotal: number;
  selection?: Record<string, string>;
};

export type DimensionSpec = {
  defaultWidth: number;
  defaultHeight: number;
  min: number;
  max: number;
};

/** Explicit quantity break: at `quantity` the base unit price is multiplied by `factor`. */
export type QuantityBreak = { quantity: number; factor: number };


/**
 * Page-priced products: share of the reference price that does not scale with the
 * page count (cover, binding, setup). The rest scales linearly with interior pages.
 */
export type Product = {
  slug: string;
  name: string;
  category: string;
  benefit: string;
  heroHeadline: string;
  heroCopy: string;
  description: string;
  /** Market-anchored reference price: the exact subtotal for this configuration. */
  anchor: PriceAnchor;
  /** Area-priced products (m2) expose width and height in metres. */
  dimensions?: DimensionSpec;
  quantities: number[];
  /** Ascending, strictly decreasing factors. Interpolated between tiers. */
  quantityBreaks?: QuantityBreak[];
  baseProductionDays: number;
  rating?: number;
  reviews?: number;
  pageRange?: { min: number; max: number; default: number };
  /** 0–1: part of the price that is fixed per copy regardless of interior pages. */
  pageFixedShare?: number;
  bulkQuoteAt?: number;
  /** Sold on quote only: no fixed price is ever shown or charged. */
  quoteOnly?: boolean;
  /** The anchor applies to the cheapest configuration (flat per-unit price). */
  anchorCheapest?: boolean;
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

/** Business cards: the standard is double-sided with matte lamination included. */
const cardSides: OptionGroup = {
  id: "printing",
  label: "Printing",
  choices: [
    { id: "double", label: "Double-sided", factor: 1 },
    { id: "single", label: "Single-sided", note: "Same price as double-sided", factor: 1 },
  ],
};

const cardFinish: OptionGroup = {
  id: "finish",
  label: "Finish",
  help: "Matte lamination is included in the standard price.",
  choices: [
    { id: "matte", label: "Matte lamination", note: "Included", factor: 1 },
    { id: "gloss", label: "Gloss lamination", factor: 1.05 },
    { id: "soft-touch", label: "Soft touch", factor: 1.22, days: 1 },
    { id: "spot-uv", label: "Spot UV", factor: 1.35, days: 2 },
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
    { id: "standard", label: "Standard", note: "3–5 days · 30 DH", flat: 30 },
    { id: "express", label: "Express", note: "1–2 days · 120 DH", flat: 120, days: -1 },
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

    quantities: [100, 250, 500, 1000, 2500, 5000],
    // Approved standard: 0.60 MAD per finished card at every quantity (no volume curve).
    quantityBreaks: [
      { quantity: 100, factor: 1 },
      { quantity: 5000, factor: 1 },
    ],
    // Standard 85 × 55 mm, standard paper, double-sided, matte lamination included.
    anchor: { quantity: 100, subtotal: 60 },
    baseProductionDays: 2,
    keywords: ["business card printing", "premium business cards", "print business cards Morocco"],
    options: [size, paper, cardFinish, cardSides, corners, deliveryGroup],
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
    slug: "flyers",
    name: "Flyers",
    category: "Marketing",
    benefit: "Get the word out this week.",
    heroHeadline: "Flyers printed and delivered while the offer is still on.",
    heroCopy: "Choose size, paper and quantity. See the price and the delivery date instantly.",
    description:
      "A5, A4 and DL flyers on coated or uncoated stock, printed in as little as one working day by partners near you.",
    quantities: [250, 500, 1000, 2500, 5000],
    // 1.40 MAD per flyer, flat: every quantity is 1.40 x quantity (cheapest configuration).
    anchor: { quantity: 250, subtotal: 350 },
    anchorCheapest: true,
    quantityBreaks: [{ quantity: 1, factor: 1 }],
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
    quantities: [1, 2, 5, 10],
    // 850 MAD per roll-up, flat: every quantity is 850 x quantity (cheapest configuration).
    anchor: { quantity: 1, subtotal: 850 },
    anchorCheapest: true,
    quantityBreaks: [{ quantity: 1, factor: 1 }],
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
    category: "Labels & stickers",
    benefit: "Label every batch on time.",
    heroHeadline: "Labels that stay on the product.",
    heroCopy: "Choose shape, material and quantity — pricing and production time update as you go.",
    description:
      "Roll or sheet labels on paper, transparent or waterproof material, die-cut to shape.",
    quantities: [500, 1000, 2500, 5000, 10000],
    anchor: { quantity: 500, subtotal: 449, selection: { shape: "circle", material: "paper", finish: "matte" } },
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
    quantities: [100, 200, 500, 1000, 2500],
    anchor: { quantity: 100, subtotal: 849, selection: { pages: "4", fold: "stitched" } },
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
    slug: "books",
    name: "Books",
    category: "Publishing",
    benefit: "Print one copy or a complete edition.",
    heroHeadline: "Books made for reading, sharing and keeping.",
    heroCopy: "Choose the page count, format, print, paper and binding. Your price updates instantly.",
    description:
      "Books from 24 to 400 interior pages, printed in black and white or colour with a 350g laminated cover and file review before production. Reference: 1 A5 book, 132 interior pages (66 double-sided sheets), black and white on 80g offset, 350g laminated cover, perfect bound — 73 MAD before delivery.",
    quantities: [1, 5, 10, 25, 50, 100, 250],
    // The two largest runs are cut by 30% against the previous curve.
    quantityBreaks: [
      { quantity: 1, factor: 1 },
      { quantity: 5, factor: 0.95 },
      { quantity: 10, factor: 0.9 },
      { quantity: 25, factor: 0.85 },
      { quantity: 50, factor: 0.8 },
      { quantity: 100, factor: 0.525 },
      { quantity: 250, factor: 0.49 },
    ],
    // Approved reference: 1 copy, 132 interior pages (cover not counted), A5, black and
    // white, 80g offset, double-sided, 350g laminated cover, perfect bound = 73 MAD.
    anchor: { quantity: 1, subtotal: 73 },
    pageRange: { min: 24, max: 400, default: 132 },
    // Assumption: 30% of the reference covers the cover, binding and setup.
    pageFixedShare: 0.3,
    bulkQuoteAt: 500,
    baseProductionDays: 5,
    keywords: ["book printing", "print books Morocco", "livres", "impression livre", "كتب", "طباعة الكتب"],
    options: [
      group("format", "Format", [
        { id: "a5", label: "A5", factor: 1 },
        { id: "16x24", label: "16 × 24 cm", factor: 1.08 },
        { id: "a4", label: "A4", factor: 1.5 },
      ]),
      group("colour", "Interior printing", [
        { id: "black-white", label: "Black & white", factor: 1 },
        { id: "colour", label: "Colour", factor: 2.2 },
      ]),
      group("inside-paper", "Interior paper", [
        { id: "offset-80", label: "80g offset", factor: 1 },
        { id: "offset-90", label: "90g offset", factor: 1.08 },
        { id: "coated-135", label: "135g coated", factor: 1.35 },
      ]),
      group(
        "cover",
        "Cover",
        [{ id: "350-laminated", label: "350g laminated cover", note: "Included, not counted as interior pages", factor: 1 }],
        "Send the cover as a separate file from the interior PDF.",
      ),
      group("binding", "Binding", [
        { id: "perfect-bound", label: "Perfect bound", factor: 1 },
        { id: "hardcover", label: "Hardcover", factor: 1.8, days: 2 },
        { id: "saddle-stitched", label: "Saddle stitched (24–64 pages)", factor: 0.9 },
        { id: "metal-spiral", label: "Metal spiral", factor: 1.25 },
        { id: "plastic-spiral", label: "Plastic spiral", factor: 1.15 },
      ]),
      deliveryGroup,
    ],
    faqs: [
      {
        q: "What file should I send for a book?",
        a: "Send two files: the interior PDF with every interior page in reading order, and a separate cover file (front, spine and back). We review both before production.",
      },
      {
        q: "When is saddle stitching available?",
        a: "Saddle stitching is available for compatible books from 24 to 64 pages.",
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
    quantities: [25, 50, 100, 250],
    anchor: { quantity: 50, subtotal: 675, selection: { size: "a4", protection: "laminate" } },
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
    category: "Labels & stickers",
    benefit: "Brand every box and bag.",
    heroHeadline: "Stickers cut to whatever shape you need.",
    heroCopy: "Choose material, shape and quantity — the price updates as you choose.",
    description: "Die-cut vinyl and paper stickers in sheets or rolls, indoor or outdoor rated.",
    quantities: [250, 500, 1000, 2500, 5000],
    anchor: { quantity: 500, subtotal: 495, selection: { shape: "custom" } },
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
    heroCopy: "Choose size, paper and quantity and see the price with the fixed 30 DH delivery fee.",
    description: "A3 to B0 posters on satin, matte or heavy art paper.",
    quantities: [10, 25, 50, 100, 250],
    anchor: { quantity: 10, subtotal: 270, selection: { size: "a3" } },
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
    quantities: [10, 25, 50, 100, 250],
    anchor: { quantity: 10, subtotal: 1790, selection: { garment: "tshirt", method: "dtf" } },
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
    quantities: [1, 2, 5, 10, 25],
    anchor: { quantity: 1, subtotal: 109, selection: { material: "pvc", finishing: "hem", width: "1", height: "1" } },
    dimensions: { defaultWidth: 1, defaultHeight: 1, min: 0.1, max: 20 },
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
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export type Selection = Record<string, string>;

export function defaultSelection(product: Product): Selection {
  const sel: Selection = {};
  for (const g of product.options) sel[g.id] = g.choices[0]!.id;
  if (product.pageRange) sel["pages"] = String(product.pageRange.default);
  if (product.dimensions) {
    sel["width"] = String(product.dimensions.defaultWidth);
    sel["height"] = String(product.dimensions.defaultHeight);
  }
  return sel;
}

export type Quote = {
  /** Product price per unit, delivery excluded. */
  unitPrice: number;
  subtotal: number;
  delivery: number;
  total: number;
  productionDays: number;
  deliveryMin: number;
  deliveryMax: number;
  savingsPercent: number;
  /** Printed surface in m2 for area-priced products, otherwise null. */
  area: number | null;
};

/** Quantity breaks: bigger runs cost less per unit. */
function quantityFactor(product: Product, quantity: number) {
  const breaks = product.quantityBreaks;
  if (breaks && breaks.length > 0) {
    const qty = Math.max(quantity, 1);
    const first = breaks[0]!;
    const last = breaks[breaks.length - 1]!;
    if (qty <= first.quantity) return first.factor;
    if (qty >= last.quantity) return last.factor;
    for (let i = 1; i < breaks.length; i += 1) {
      const low = breaks[i - 1]!;
      const high = breaks[i]!;
      if (qty <= high.quantity) {
        // Log-linear interpolation keeps the unit price monotonically decreasing.
        const t =
          (Math.log(qty) - Math.log(low.quantity)) /
          (Math.log(high.quantity) - Math.log(low.quantity));
        return low.factor + t * (high.factor - low.factor);
      }
    }
    return last.factor;
  }
  const base = product.quantities[0]!;
  const ratio = Math.max(quantity, 1) / base;
  return Math.max(0.45, Math.pow(ratio, -0.16));
}

/** Option, page-count and variant multipliers. Quantity and surface excluded. */
function configFactor(product: Product, selection: Selection) {
  let factor = 1;
  for (const g of product.options) {
    if (g.id === "delivery") continue;
    const choice = g.choices.find((c) => c.id === selection[g.id]) ?? g.choices[0]!;
    factor *= choice.factor ?? 1;
  }
  if (product.pageRange) {
    const pages = Number(selection["pages"] ?? product.pageRange.default);
    const valid =
      Number.isInteger(pages) && pages >= product.pageRange.min && pages <= product.pageRange.max;
    const ratio = (valid ? pages : product.pageRange.default) / product.pageRange.default;
    const fixed = product.pageFixedShare ?? 0;
    factor *= fixed + (1 - fixed) * ratio;
  }
  return factor;
}

function positive(value: string | undefined, fallback: number, spec: DimensionSpec) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.max(n, spec.min), spec.max);
}

/** Printed surface in m2. Always 1 for products that are not priced by area. */
export function selectionArea(product: Product, selection: Selection) {
  const spec = product.dimensions;
  if (!spec) return null;
  const width = positive(selection["width"], spec.defaultWidth, spec);
  const height = positive(selection["height"], spec.defaultHeight, spec);
  return Math.round(width * height * 10000) / 10000;
}

const unitBaseCache = new Map<string, number>();

/**
 * Single calibration point: the unit price (per unit, or per m2 for area-priced
 * products) that makes the market anchor subtotal come out exact.
 */
function unitBase(product: Product) {
  const cached = unitBaseCache.get(product.slug);
  if (cached !== undefined) return cached;
  const anchor = product.anchor;
  const selection: Selection = {
    ...(product.anchorCheapest ? cheapestSelection(product) : defaultSelection(product)),
    ...(anchor.selection ?? {}),
  };
  const denominator =
    anchor.quantity *
    configFactor(product, selection) *
    quantityFactor(product, anchor.quantity) *
    (selectionArea(product, selection) ?? 1);
  const value = anchor.subtotal / denominator;
  unitBaseCache.set(product.slug, value);
  return value;
}

export function priceQuote(product: Product, quantity: number, selection: Selection): Quote {
  const qty = Math.max(1, Math.floor(quantity) || 1);
  let flat = 0;
  let extraDays = 0;
  for (const g of product.options) {
    const choice = g.choices.find((c) => c.id === selection[g.id]) ?? g.choices[0]!;
    flat += choice.flat ?? 0;
    extraDays += choice.days ?? 0;
  }

  const area = selectionArea(product, selection);
  const qFactor = quantityFactor(product, qty);
  const rawUnit = unitBase(product) * configFactor(product, selection) * qFactor * (area ?? 1);
  // Money is settled on integer centimes so subtotal + delivery always equals total.
  const subtotalCents = Math.max(0, Math.round(rawUnit * 100 * qty));
  const deliveryCents = toCents(flat);
  const productionDays = Math.max(1, product.baseProductionDays + extraDays);
  const express = selection["delivery"] === "express";
  const smallestQuantity = Math.min(...product.quantities);
  const referenceFactor = quantityFactor(product, smallestQuantity);
  const savings = referenceFactor > 0 ? 1 - qFactor / referenceFactor : 0;

  return {
    unitPrice: fromCents(subtotalCents) / qty,
    subtotal: fromCents(subtotalCents),
    delivery: fromCents(deliveryCents),
    total: fromCents(subtotalCents + deliveryCents),
    productionDays,
    deliveryMin: express ? 1 : 3,
    deliveryMax: express ? 2 : 5,
    savingsPercent: Math.max(0, Math.round(savings * 100)),
    area,
  };
}

/** Binding/page rules shared by the configurator and the server quotation. */
export function bindingError(product: Product, selection: Selection): string | null {
  if (!product.pageRange) return null;
  const pages = Number(selection["pages"] ?? product.pageRange.default);
  if (!Number.isInteger(pages) || pages < product.pageRange.min || pages > product.pageRange.max)
    return "Unsupported page count";
  if (selection["binding"] === "saddle-stitched" && (pages > 64 || pages % 4 !== 0))
    return "Saddle stitching needs 24–64 pages in multiples of 4";
  return null;
}

export function selectionLabels(product: Product, selection: Selection) {
  const labels = product.options.map((g) => {
    const choice = g.choices.find((c) => c.id === selection[g.id]) ?? g.choices[0]!;
    return { group: g.label, value: choice.label };
  });
  return product.pageRange
    ? [{ group: "Pages", value: `${selection["pages"] ?? product.pageRange.default} pages` }, ...labels]
    : labels;
}

/** The genuinely cheapest configuration of a product, delivery excluded. */
export function cheapestSelection(product: Product): Selection {
  const selection: Selection = {};
  for (const g of product.options) {
    if (g.id === "delivery") {
      selection[g.id] = g.choices[0]!.id;
      continue;
    }
    const cheapest = g.choices.reduce((best, c) =>
      (c.factor ?? 1) < (best.factor ?? 1) ? c : best,
    );
    selection[g.id] = cheapest.id;
  }
  if (product.pageRange) selection["pages"] = String(product.pageRange.min);
  if (product.dimensions) {
    selection["width"] = String(product.dimensions.defaultWidth);
    selection["height"] = String(product.dimensions.defaultHeight);
  }
  return selection;
}

/**
 * The real basis of the "From" price: the smallest listed quantity with the
 * cheapest option of every group, priced by the same engine. Delivery excluded.
 */
export function fromPriceBasis(product: Product) {
  const quantity = Math.min(...product.quantities);
  const selection = cheapestSelection(product);
  const quote = priceQuote(product, quantity, selection);
  return {
    quantity,
    selection,
    /** Order value for that quantity, before delivery. */
    amount: quote.subtotal,
    unitPrice: quote.unitPrice,
    labels: selectionLabels(product, selection).filter((l) => l.group !== "Delivery"),
  };
}
