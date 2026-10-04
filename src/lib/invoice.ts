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

type PaymentCopy = {
  methods: Record<"card" | "bank" | "cashplus" | "codCard" | "codBank" | "codCashplus", string>;
  paidFull: string;
  advanceReceived: string;
  manualPending: string;
  cardPending: string;
  refunded: string;
  cancelled: string;
  method: string;
  received: string;
  balance: string;
  balanceCash: string;
  terms: string;
};

const paymentCopy: Record<Lang, PaymentCopy> = {
  fr: {
    methods: {
      card: "Carte bancaire (100 %)",
      bank: "Virement bancaire (100 %)",
      cashplus: "Cash Plus (100 %)",
      codCard: "Paiement à la livraison — avance de 50 % par carte",
      codBank: "Paiement à la livraison — avance de 50 % par virement",
      codCashplus: "Paiement à la livraison — avance de 50 % par Cash Plus",
    },
    paidFull: "Payée en totalité",
    advanceReceived: "Avance de 50 % reçue",
    manualPending: "Commande enregistrée — confirmation du paiement en attente",
    cardPending: "En attente : paiement par carte non finalisé",
    refunded: "Remboursée",
    cancelled: "Commande annulée",
    method: "Mode de paiement",
    received: "Montant reçu",
    balance: "Reste à payer",
    balanceCash: "Solde en espèces à la livraison",
    terms: "Montants en MAD. La production démarre après confirmation du paiement requis et validation du fichier.",
  },
  en: {
    methods: {
      card: "Card (100%)",
      bank: "Bank transfer (100%)",
      cashplus: "Cash Plus (100%)",
      codCard: "Cash on delivery — 50% advance by card",
      codBank: "Cash on delivery — 50% advance by bank transfer",
      codCashplus: "Cash on delivery — 50% advance by Cash Plus",
    },
    paidFull: "Paid in full",
    advanceReceived: "50% advance received",
    manualPending: "Order recorded — payment confirmation pending",
    cardPending: "Pending: card payment not completed",
    refunded: "Refunded",
    cancelled: "Order cancelled",
    method: "Payment method",
    received: "Amount received",
    balance: "Balance due",
    balanceCash: "Cash balance due at delivery",
    terms: "Amounts in MAD. Production starts once the required payment is confirmed and the artwork is approved.",
  },
  ar: {
    methods: {
      card: "بطاقة بنكية (100٪)",
      bank: "تحويل بنكي (100٪)",
      cashplus: "كاش بلوس (100٪)",
      codCard: "الدفع عند التسليم — دفعة مسبقة 50٪ بالبطاقة",
      codBank: "الدفع عند التسليم — دفعة مسبقة 50٪ بالتحويل",
      codCashplus: "الدفع عند التسليم — دفعة مسبقة 50٪ عبر كاش بلوس",
    },
    paidFull: "مدفوعة بالكامل",
    advanceReceived: "تم استلام دفعة مسبقة 50٪",
    manualPending: "تم تسجيل الطلب — في انتظار تأكيد الدفع",
    cardPending: "قيد الانتظار: لم يكتمل الدفع بالبطاقة",
    refunded: "تم الاسترداد",
    cancelled: "تم إلغاء الطلب",
    method: "طريقة الدفع",
    received: "المبلغ المستلم",
    balance: "المبلغ المتبقي",
    balanceCash: "الرصيد نقداً عند التسليم",
    terms: "المبالغ بالدرهم المغربي. يبدأ الإنتاج بعد تأكيد الدفع المطلوب والموافقة على التصميم.",
  },
};

function methodKey(method: string): keyof PaymentCopy["methods"] {
  switch (method) {
    case "bank_transfer":
      return "bank";
    case "cashplus":
      return "cashplus";
    case "deposit_50_cod":
      return "codCard";
    case "cod_advance_bank":
    case "bank_transfer_50":
      return "codBank";
    case "cod_advance_cashplus":
      return "codCashplus";
    default:
      return "card";
  }
}

/**
 * Truthful payment summary for invoices and the dashboard: real method, what
 * was actually received, what remains, never "paid in full" for an advance.
 */
export function paymentSummary(
  order: Pick<OrderRecord, "paymentMethod" | "paymentStatus" | "depositPaid" | "depositAmount" | "total" | "status">,
  lang: Lang,
) {
  const c = paymentCopy[lang];
  const key = methodKey(order.paymentMethod);
  const half = key.startsWith("cod");
  const manual = key === "bank" || key === "cashplus" || key === "codBank" || key === "codCashplus";
  const status = String(order.status).toLowerCase();
  const total = order.total;
  let label: string;
  let received = 0;
  if (status.includes("refund")) {
    label = c.refunded;
  } else if (status.includes("cancel")) {
    label = c.cancelled;
  } else if (order.paymentStatus === "paid" && !half) {
    label = c.paidFull;
    received = total;
  } else if (order.depositPaid || (half && order.paymentStatus === "paid")) {
    label = c.advanceReceived;
    received = order.depositAmount > 0 ? order.depositAmount : Math.ceil(total * 50) / 100;
  } else {
    label = manual ? c.manualPending : c.cardPending;
  }
  const balance = Math.max(0, Math.round((total - received) * 100) / 100);
  return {
    label,
    method: c.methods[key],
    received,
    balance,
    balanceLabel: half ? c.balanceCash : c.balance,
    labels: { method: c.method, received: c.received },
    terms: c.terms,
  };
}
