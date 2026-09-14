import type { Lang } from "@/i18n";
import type { OrderRecord } from "@/lib/orders-api";

export function invoiceNumber(order: Pick<OrderRecord, "reference">) {
  return `INV-${order.reference.replace("PRM-", "")}`;
}

const requiredInvoiceFields = [
  ["items", "orders.items"],
  ["createdAt", "orders.created_at"],
  ["customerName", "orders.contact_name"],
  ["email", "orders.email"],
  ["phone", "orders.phone"],
  ["address", "orders.address"],
  ["city", "orders.city"],
] as const;

export function missingInvoiceFields(order: OrderRecord): string[] {
  return requiredInvoiceFields.flatMap(([key, field]) => {
    const value = order[key];
    return value === null || value === "" || (Array.isArray(value) && value.length === 0)
      ? [field]
      : [];
  });
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
  incomplete: string;
  missingFields: string;
  open: string;
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
    pendingPayment: "En attente : paiement par carte non finalisé",
    advancePaid: "Payée en totalité par carte (YouCan Pay)",
    terms: "Paiement intégral par carte via YouCan Pay. Montants en MAD.",
    download: "Télécharger la facture",
    print: "Imprimer",
    back: "Retour au tableau de bord",
    title: "Facture",
    notFound: "Facture introuvable pour cette commande.",
    incomplete: "Cette facture ne peut pas être générée avec les données enregistrées.",
    missingFields: "Champs manquants dans la commande",
    open: "Télécharger la facture",
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
    pendingPayment: "Pending: card payment not completed",
    advancePaid: "Paid in full by card (YouCan Pay)",
    terms: "Paid in full by card via YouCan Pay. Amounts in MAD.",
    download: "Download invoice",
    print: "Print",
    back: "Back to dashboard",
    title: "Invoice",
    notFound: "No invoice found for this order.",
    incomplete: "This invoice cannot be generated from the recorded order data.",
    missingFields: "Missing order fields",
    open: "Download invoice",
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
    pendingPayment: "قيد الانتظار: لم يكتمل الدفع بالبطاقة",
    advancePaid: "مدفوعة بالكامل بالبطاقة (YouCan Pay)",
    terms: "الدفع الكامل بالبطاقة عبر YouCan Pay. المبالغ بالدرهم المغربي.",
    download: "تحميل الفاتورة",
    print: "طباعة",
    back: "العودة إلى لوحة التحكم",
    title: "فاتورة",
    notFound: "لا توجد فاتورة لهذا الطلب.",
    incomplete: "لا يمكن إنشاء هذه الفاتورة من بيانات الطلب المسجلة.",
    missingFields: "حقول الطلب الناقصة",
    open: "تحميل الفاتورة",
  },
};
