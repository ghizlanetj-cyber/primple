import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n";
import { mad } from "@/lib/format";
import { OrderAccountGuide } from "./OrderAccountGuide";

const COPY = {
  fr: {
    title: "Merci, votre paiement est confirmé !",
    body: "Votre commande est enregistrée. Primple vérifie votre fichier avant la mise en production.",
    reference: "Référence de commande",
    paid: "Montant payé",
    balance: "Solde en espèces à la livraison",
  },
  en: {
    title: "Thank you! Your payment is confirmed.",
    body: "Your order is saved. Primple will check your artwork before production.",
    reference: "Order reference",
    paid: "Amount paid",
    balance: "Cash balance at delivery",
  },
  ar: {
    title: "شكرًا، تم تأكيد الدفع!",
    body: "تم حفظ طلبك. ستراجع Primple ملفك قبل بدء الإنتاج.",
    reference: "مرجع الطلب",
    paid: "المبلغ المدفوع",
    balance: "المبلغ المتبقي نقدًا عند التسليم",
  },
};
export type ConfirmationOrder = {
  reference: string;
  paymentStatus: string;
  amountPaid: number;
  balance: number;
};

/** Render only after an authorized server response says paid, never from a widget or URL flag. */
export function OrderConfirmation({
  order,
  signedIn,
}: {
  order: ConfirmationOrder;
  signedIn: boolean;
}) {
  const { lang } = useI18n();
  if (order.paymentStatus !== "paid") return null;
  const c = COPY[lang];
  return (
    <div role="status" aria-live="polite">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/15">
        <CheckCircle2 className="size-7 text-primary" />
      </span>
      <h1 className="mt-5 text-2xl font-bold sm:text-3xl">{c.title}</h1>
      <p className="mt-3 text-muted-foreground">{c.body}</p>
      <dl className="mt-5 space-y-3 rounded-xl bg-secondary/50 p-4 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-muted-foreground">{c.reference}</dt>
          <dd className="font-bold" dir="ltr">
            {order.reference}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 font-semibold">
          <dt>{c.paid}</dt>
          <dd>{mad(order.amountPaid)}</dd>
        </div>
        {order.balance > 0 && (
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">{c.balance}</dt>
            <dd>{mad(order.balance)}</dd>
          </div>
        )}
      </dl>
      <OrderAccountGuide reference={order.reference} signedIn={signedIn} paid />
    </div>
  );
}
