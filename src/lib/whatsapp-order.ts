import { contact } from "@/config/contact";
import { mad } from "@/lib/format";
import { itemConfigLabel } from "@/lib/orders-api";
import type { DeliveryDetails } from "@/lib/orders-api";
import type { CartItem } from "@/store/cart";
import type { Lang } from "@/i18n";

type Labels = {
  intro: string;
  reference: string;
  items: string;
  config: string;
  qty: string;
  subtotal: string;
  delivery: string;
  total: string;
  advance: string;
  balance: string;
  customer: string;
  phone: string;
  email: string;
  address: string;
  outro: string;
};

const LABELS: Record<Lang, Labels> = {
  fr: {
    intro: "Bonjour Primple, je souhaite finaliser ma commande d'impression.",
    reference: "Référence",
    items: "Articles",
    config: "Configuration",
    qty: "Quantité",
    subtotal: "Sous-total",
    delivery: "Livraison",
    total: "Total",
    advance: "Acompte 50 %",
    balance: "Solde à la livraison 50 %",
    customer: "Client",
    phone: "Téléphone",
    email: "E-mail",
    address: "Adresse de livraison",
    outro: "Merci de me confirmer la commande et les modalités de l'acompte.",
  },
  en: {
    intro: "Hello Primple, I would like to finalise my print order.",
    reference: "Reference",
    items: "Items",
    config: "Configuration",
    qty: "Quantity",
    subtotal: "Subtotal",
    delivery: "Delivery",
    total: "Total",
    advance: "Advance 50%",
    balance: "Balance on delivery 50%",
    customer: "Customer",
    phone: "Phone",
    email: "Email",
    address: "Delivery address",
    outro: "Please confirm the order and how to arrange the advance.",
  },
  ar: {
    intro: "مرحبًا Primple، أود إتمام طلب الطباعة الخاص بي.",
    reference: "المرجع",
    items: "المنتجات",
    config: "الإعداد",
    qty: "الكمية",
    subtotal: "المجموع الفرعي",
    delivery: "التوصيل",
    total: "المجموع",
    advance: "العربون 50%",
    balance: "الباقي عند التسليم 50%",
    customer: "العميل",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    address: "عنوان التوصيل",
    outro: "يرجى تأكيد الطلب وطريقة دفع العربون.",
  },
};

export function buildWhatsAppOrderMessage(input: {
  lang: Lang;
  items: CartItem[];
  totals: { subtotal: number; delivery: number; total: number };
  split: { deposit: number; balance: number };
  reference?: string | null;
  details?: DeliveryDetails | null;
}): string {
  const l = LABELS[input.lang] ?? LABELS.fr;
  const lines: string[] = [l.intro, ""];

  if (input.reference) lines.push(`${l.reference}: ${input.reference}`, "");

  lines.push(`${l.items}:`);
  input.items.forEach((item, index) => {
    const config = itemConfigLabel(item);
    lines.push(`${index + 1}. ${item.name}`);
    if (config) lines.push(`   ${l.config}: ${config}`);
    lines.push(`   ${l.qty}: ${item.quantity} — ${mad(item.subtotal)}`);
  });

  lines.push(
    "",
    `${l.subtotal}: ${mad(input.totals.subtotal)}`,
    `${l.delivery}: ${mad(input.totals.delivery)}`,
    `${l.total}: ${mad(input.totals.total)}`,
    `${l.advance}: ${mad(input.split.deposit)}`,
    `${l.balance}: ${mad(input.split.balance)}`,
  );

  const d = input.details;
  if (d && (d.name || d.phone || d.email || d.address)) {
    lines.push("");
    if (d.name) lines.push(`${l.customer}: ${d.name}${d.company ? ` (${d.company})` : ""}`);
    if (d.phone) lines.push(`${l.phone}: ${d.phone}`);
    if (d.email) lines.push(`${l.email}: ${d.email}`);
    const addr = [d.address, d.postcode, d.city].filter(Boolean).join(", ");
    if (addr) lines.push(`${l.address}: ${addr}`);
  }

  lines.push("", l.outro);
  return lines.join("\n");
}

export function whatsAppOrderUrl(message: string): string {
  return `${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
