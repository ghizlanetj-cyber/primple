import type { Lang } from "@/i18n";
import type { OrderRecord } from "@/lib/orders-api";

export function invoiceNumber(order: Pick<OrderRecord, "reference">) {
  return `INV-${order.reference.replace("PRM-", "")}`;
}

export type InvoiceLabels = {
  invoice: string;
  invoiceNo: string;
  order: string;
  date: string;
  billedTo: string;
  notProvided: string;
  item: string;
  config: string;
  qty: string;
  unit: string;
  amount: string;
  subtotal: string;
  delivery: string;
  total: string;
  advance: string;
  balance: string;
  paymentStatus: string;
  orderStatus: string;
  pendingPayment: string;
  advancePaid: string;
  terms: string;
  download: string;
  print: string;
  back: string;
  title: string;
  notFound: string;
};

export const invoiceLabels: Record<Lang, InvoiceLabels> = {
  fr: {
    invoice: "Facture",
    invoiceNo: "N° de facture",
    order: "Commande",
    date: "Date",
    billedTo: "Facturé à",
    notProvided: "Non renseigné",
    item: "Article",
    config: "Configuration",
    qty: "Qté",
    unit: "Prix unitaire",
    amount: "Montant",
    subtotal: "Sous-total",
    delivery: "Livraison",
    total: "Total",
    advance: "Acompte (50 %)",
    balance: "Solde à la livraison (50 %)",
    paymentStatus: "Statut du paiement",
    orderStatus: "Statut de la commande",
    pendingPayment: "En attente : acompte à confirmer avec Primple",
    advancePaid: "Acompte de 50 % reçu · solde à la livraison",
    terms: "Paiement : 50 % d'acompte, 50 % à la livraison. Montants en MAD.",
    download: "Télécharger la facture (PDF)",
    print: "Imprimer",
    back: "Retour au tableau de bord",
    title: "Facture",
    notFound: "Facture introuvable pour cette commande.",
  },
  en: {
    invoice: "Invoice",
    invoiceNo: "Invoice no.",
    order: "Order",
    date: "Date",
    billedTo: "Billed to",
    notProvided: "Not provided",
    item: "Item",
    config: "Configuration",
    qty: "Qty",
    unit: "Unit price",
    amount: "Amount",
    subtotal: "Subtotal",
    delivery: "Delivery",
    total: "Total",
    advance: "Advance (50%)",
    balance: "Balance on delivery (50%)",
    paymentStatus: "Payment status",
    orderStatus: "Order status",
    pendingPayment: "Pending: advance to be confirmed with Primple",
    advancePaid: "50% advance received · balance on delivery",
    terms: "Payment terms: 50% advance, 50% on delivery. Amounts in MAD.",
    download: "Download invoice (PDF)",
    print: "Print",
    back: "Back to dashboard",
    title: "Invoice",
    notFound: "No invoice found for this order.",
  },
  ar: {
    invoice: "فاتورة",
    invoiceNo: "رقم الفاتورة",
    order: "الطلب",
    date: "التاريخ",
    billedTo: "فوترة إلى",
    notProvided: "غير محدد",
    item: "المنتج",
    config: "الخيارات",
    qty: "الكمية",
    unit: "سعر الوحدة",
    amount: "المبلغ",
    subtotal: "المجموع الفرعي",
    delivery: "التوصيل",
    total: "المجموع",
    advance: "الدفعة المقدمة (50٪)",
    balance: "الرصيد عند التسليم (50٪)",
    paymentStatus: "حالة الدفع",
    orderStatus: "حالة الطلب",
    pendingPayment: "قيد الانتظار: تأكيد الدفعة المقدمة مع Primple",
    advancePaid: "تم استلام 50٪ · الباقي عند التسليم",
    terms: "شروط الدفع: 50٪ مقدمًا و50٪ عند التسليم. المبالغ بالدرهم المغربي.",
    download: "تحميل الفاتورة (PDF)",
    print: "طباعة",
    back: "العودة إلى لوحة التحكم",
    title: "فاتورة",
    notFound: "لا توجد فاتورة لهذا الطلب.",
  },
};
