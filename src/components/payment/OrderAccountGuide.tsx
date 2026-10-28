import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n, type Lang } from "@/i18n";
import { dashboardOrderPath } from "@/lib/payment-status";
import { readGuestClaim } from "@/lib/guest-claim";

const COPY = {
  fr: {
    title: "Suivez votre commande dans votre compte",
    body: "Retrouvez le suivi de votre commande, vos fichiers et vos factures dans votre espace Primple.",
    account: "Accéder à mon compte et suivre ma commande",
    guest:
      "Vous avez commandé sans compte ? Créez votre compte avec la même adresse e-mail que votre commande.",
    email: "E-mail de la commande",
    steps: [
      "Créez votre compte ou connectez-vous avec l'e-mail de votre commande.",
      "Si vous créez un compte, confirmez votre e-mail depuis votre boîte de réception.",
      "Ouvrez votre espace pour suivre la vérification du fichier, la production et la livraison.",
    ],
    signup: "Créer mon compte et suivre ma commande",
    signin: "J'ai déjà un compte",
    pendingNote:
      "Créer un compte ne confirme pas le paiement. Notre équipe mettra à jour son statut après vérification.",
    note: "Votre commande sera rattachée à votre compte après vérification de votre e-mail. Créer un compte ne vous fait pas payer une seconde fois.",
  },
  en: {
    title: "Track your order from your account",
    body: "Find order updates, your files and invoices in your Primple account.",
    account: "Go to my account and track my order",
    guest: "Ordered as a guest? Create your account using the same email address as your order.",
    email: "Order email",
    steps: [
      "Create an account or sign in using your order email.",
      "If you create an account, confirm your email from your inbox.",
      "Open your account to follow artwork review, production and delivery.",
    ],
    signup: "Create my account and track my order",
    signin: "I already have an account",
    pendingNote:
      "Creating an account does not confirm payment. Our team will update its status after verification.",
    note: "Your order will be linked to your account after your email is verified. Creating an account does not charge you again.",
  },
  ar: {
    title: "تتبع طلبك من حسابك",
    body: "ستجد تحديثات طلبك وملفاتك وفواتيرك في حسابك على Primple.",
    account: "الدخول إلى حسابي وتتبع طلبي",
    guest: "طلبت دون حساب؟ أنشئ حسابك باستخدام نفس البريد الإلكتروني المسجل في الطلب.",
    email: "بريد الطلب الإلكتروني",
    steps: [
      "أنشئ حسابًا أو سجّل الدخول باستخدام بريد الطلب الإلكتروني.",
      "عند إنشاء حساب، أكّد بريدك الإلكتروني من الرسالة التي تصلك.",
      "افتح حسابك لمتابعة مراجعة الملف والإنتاج والتوصيل.",
    ],
    signup: "إنشاء حسابي وتتبع طلبي",
    signin: "لدي حساب بالفعل",
    pendingNote: "إنشاء حساب لا يؤكد الدفع. سيحدّث فريقنا حالة الدفع بعد التحقق.",
    note: "سيُربط الطلب بحسابك بعد تأكيد بريدك الإلكتروني. إنشاء حساب لا يخصم منك أي مبلغ إضافي.",
  },
} satisfies Record<Lang, unknown>;

export function OrderAccountGuide({
  reference,
  signedIn,
  paid = false,
}: {
  reference: string;
  signedIn: boolean;
  paid?: boolean;
}) {
  const { lang } = useI18n();
  const c = COPY[lang];
  const destination = dashboardOrderPath(reference, paid);
  const [email, setEmail] = useState("");
  useEffect(() => {
    const claim = readGuestClaim();
    setEmail(!signedIn && claim?.reference === reference ? claim.email : "");
  }, [reference, signedIn]);
  return (
    <section
      className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-5 sm:p-6"
      aria-label={c.title}
    >
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <Package className="size-5 shrink-0 text-primary" />
        {c.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{signedIn ? c.body : c.guest}</p>
      {!signedIn && (
        <>
          {email && (
            <p className="mt-3 break-all text-sm">
              <span className="text-muted-foreground">{c.email} : </span>
              <strong dir="ltr">{email}</strong>
            </p>
          )}
          <ol className="mt-4 list-decimal space-y-2 ps-5 text-sm">
            {c.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </>
      )}
      <div className="mt-5 flex flex-col gap-3 sm:items-start">
        {signedIn ? (
          <Button
            asChild
            size="lg"
            className="h-auto min-h-11 w-full whitespace-normal rounded-full px-5 py-3 sm:w-auto"
          >
            <a href={destination}>
              {c.account}
              <ArrowRight className="size-4 shrink-0 rtl:rotate-180" />
            </a>
          </Button>
        ) : (
          <>
            <Button
              asChild
              size="lg"
              className="h-auto min-h-11 w-full whitespace-normal rounded-full px-5 py-3 sm:w-auto"
            >
              <Link to="/signup" search={{ redirect: destination }}>
                {c.signup}
                <ArrowRight className="size-4 shrink-0 rtl:rotate-180" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto min-h-10 w-full whitespace-normal rounded-full px-5 py-2 sm:w-auto"
            >
              <Link to="/login" search={{ redirect: destination }}>
                {c.signin}
              </Link>
            </Button>
          </>
        )}
      </div>
      {!signedIn && (
        <p className="mt-4 text-xs text-muted-foreground">{paid ? c.note : c.pendingNote}</p>
      )}
    </section>
  );
}
