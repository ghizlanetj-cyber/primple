import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { phrases, authPhrases } from "./translations";
import { productPhrases } from "./product-translations";
import { commercialPhrases } from "./commercial-translations";
import { copyPhrases } from "./copy-translations";
import { frenchPagePhrases } from "./fr-page-translations";
import { homePhrases } from "./home-translations";
import { setMoneyLocale } from "@/lib/format";

export const languages = ["en", "fr", "ar"] as const;
export type Lang = (typeof languages)[number];

export const languageLabels: Record<Lang, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

type Dict = Record<string, string>;

const en: Dict = {
  "nav.products": "Products",
  "nav.solutions": "Services",
  "nav.why": "Why Primple",
  "nav.work": "Platform",
  "nav.contact": "Contact",
  "nav.platform": "Platform",
  "nav.pricing": "Pricing",
  "nav.partners": "Become a Print Partner",
  "nav.dashboard": "Dashboard",
  "nav.login": "Login",
  "cta.start": "Get my price",
  "cta.talk": "Talk about my project",
  "cta.partner": "Explore products",
  "cta.getQuote": "Get a quote",
  "cta.cart": "Cart",
  "cta.menu": "Open menu",
  "cta.close": "Close menu",
  "cta.language": "Language",

  "hero.eyebrow": "Turning ideas into tangible impact",
  "hero.title": "More than\nprinting.",
  "hero.titleAccent": "Ideas taking\nshape.",
  "hero.sub":
    "Professional, custom printing for brands, businesses and creatives in Morocco: choose your options, see the price, we produce and deliver.",
  "hero.f1": "Options explained before you choose",
  "hero.f2": "Price and lead time shown before you order",
  "hero.f3": "Every stage tracked until delivery",
  "hero.note": "Clear answer. No commitment.",
  "hero.alt": "Collection of PRIMPLE printed pieces in a bright studio",
  "hero.w1": "Ideas",
  "hero.w2": "People",
  "hero.w3": "Brands",
  "hero.w4": "Printed",
  "hero.b1": "Printing",
  "hero.b2": "Human",
  "hero.b3": "Possibilities",
  "hero.sign": "Printing a brighter future",

  "dash.eyebrow": "Your account",
  "dash.title": "Every print job,",
  "dash.titleAccent": "in one place.",
  "dash.welcome": "Welcome back, Salma. Here's what's moving right now.",
  "dash.new": "Start a new print",
  "dash.kpi.progress": "Jobs in progress",
  "dash.kpi.progressHint": "Live production",
  "dash.kpi.quotes": "Open quotes",
  "dash.kpi.quotesHint": "Waiting on you",
  "dash.kpi.spend": "Total spend",
  "dash.kpi.spendHint": "Last 90 days",
  "dash.kpi.onTime": "On-time delivery",
  "dash.kpi.onTimeHint": "Across your printers",
  "dash.tab.orders": "Orders",
  "dash.tab.quotes": "Quotes",
  "dash.tab.invoices": "Invoices",
  "dash.orders.title": "Your jobs",
  "dash.happening": "Happening now at",
  "dash.printer": "Printer",
  "dash.city": "Produced in",
  "dash.expected": "Expected",
  "dash.artwork": "Artwork",
  "dash.reorder": "Reorder this job",
  "dash.invoice": "Download invoice",
  "dash.accept": "Accept quote",
  "dash.message": "Message printer",
  "dash.units": "units",
  "dash.production": "production",
  "dash.delivery": "delivery",
  "dash.inv.invoice": "Invoice",
  "dash.inv.order": "Order",
  "dash.inv.date": "Date",
  "dash.inv.amount": "Amount",
  "dash.inv.status": "Status",
  "dash.nav.overview": "Overview",
  "dash.nav.orders": "Orders",
  "dash.nav.quotes": "Quotes",
  "dash.nav.invoices": "Invoices",
  "dash.nav.catalog": "Order something new",
  "dash.support": "Need help with a job?",
  "dash.supportBody": "Our print specialists answer in under an hour on business days.",
  "dash.supportCta": "Talk to us",

  "footer.tagline": "Printing, finally built like software.",
  "footer.products": "Products",
  "footer.company": "Company",
  "footer.resources": "Resources",
  "footer.legal": "Legal",
  "footer.rights": "All rights reserved.",
};

const fr: Dict = {
  "nav.products": "Produits",
  "nav.solutions": "Services",
  "nav.why": "Pourquoi Primple",
  "nav.work": "Plateforme",
  "nav.contact": "Contact",
  "nav.platform": "Plateforme",
  "nav.pricing": "Tarifs",
  "nav.partners": "Devenir imprimeur partenaire",
  "nav.dashboard": "Tableau de bord",
  "nav.login": "Connexion",
  "cta.start": "Obtenir mon prix",
  "cta.talk": "Parler de mon projet",
  "cta.partner": "Découvrir nos produits",
  "cta.getQuote": "Obtenir un devis",
  "cta.cart": "Panier",
  "cta.menu": "Ouvrir le menu",
  "cta.close": "Fermer le menu",
  "cta.language": "Langue",

  "hero.eyebrow": "Des idées transformées en impact réel",
  "hero.title": "Plus que\nde l'impression.",
  "hero.titleAccent": "Des idées qui\nprennent forme.",
  "hero.sub":
    "Impression professionnelle et personnalisée pour les marques, les entreprises et les créatifs au Maroc : vous choisissez vos options, vous voyez le prix, nous produisons et livrons.",
  "hero.f1": "Options expliquées avant de choisir",
  "hero.f2": "Prix et délai affichés avant de commander",
  "hero.f3": "Chaque étape suivie jusqu'à la livraison",
  "hero.note": "Réponse claire. Sans engagement.",
  "hero.alt": "Collection de supports imprimés PRIMPLE dans un studio lumineux",
  "hero.w1": "Idées",
  "hero.w2": "Personnes",
  "hero.w3": "Marques",
  "hero.w4": "Imprimées",
  "hero.b1": "Impression",
  "hero.b2": "Humain",
  "hero.b3": "Possibilités",
  "hero.sign": "Imprimer un avenir plus lumineux",

  "dash.eyebrow": "Votre compte",
  "dash.title": "Toutes vos impressions,",
  "dash.titleAccent": "au même endroit.",
  "dash.welcome": "Bon retour, Salma. Voici ce qui avance en ce moment.",
  "dash.new": "Nouvelle impression",
  "dash.kpi.progress": "Travaux en cours",
  "dash.kpi.progressHint": "Production en direct",
  "dash.kpi.quotes": "Devis ouverts",
  "dash.kpi.quotesHint": "En attente de vous",
  "dash.kpi.spend": "Dépenses totales",
  "dash.kpi.spendHint": "90 derniers jours",
  "dash.kpi.onTime": "Livraison à l'heure",
  "dash.kpi.onTimeHint": "Tous imprimeurs confondus",
  "dash.tab.orders": "Commandes",
  "dash.tab.quotes": "Devis",
  "dash.tab.invoices": "Factures",
  "dash.orders.title": "Vos travaux",
  "dash.happening": "En cours chez",
  "dash.printer": "Imprimeur",
  "dash.city": "Produit à",
  "dash.expected": "Prévu",
  "dash.artwork": "Fichier",
  "dash.reorder": "Recommander ce travail",
  "dash.invoice": "Télécharger la facture",
  "dash.accept": "Accepter le devis",
  "dash.message": "Contacter l'imprimeur",
  "dash.units": "unités",
  "dash.production": "production",
  "dash.delivery": "livraison",
  "dash.inv.invoice": "Facture",
  "dash.inv.order": "Commande",
  "dash.inv.date": "Date",
  "dash.inv.amount": "Montant",
  "dash.inv.status": "Statut",
  "dash.nav.overview": "Aperçu",
  "dash.nav.orders": "Commandes",
  "dash.nav.quotes": "Devis",
  "dash.nav.invoices": "Factures",
  "dash.nav.catalog": "Commander du nouveau",
  "dash.support": "Besoin d'aide sur un travail ?",
  "dash.supportBody": "Nos spécialistes répondent en moins d'une heure les jours ouvrés.",
  "dash.supportCta": "Nous contacter",

  "footer.tagline": "L'impression, enfin conçue comme un logiciel.",
  "footer.products": "Produits",
  "footer.company": "Entreprise",
  "footer.resources": "Ressources",
  "footer.legal": "Légal",
  "footer.rights": "Tous droits réservés.",
};

const ar: Dict = {
  "nav.products": "المنتجات",
  "nav.solutions": "الحلول",
  "nav.why": "لماذا Primple",
  "nav.work": "أعمالنا",
  "nav.contact": "اتصل بنا",
  "nav.platform": "المنصة",
  "nav.pricing": "الأسعار",
  "nav.partners": "كن مطبعة شريكة",
  "nav.dashboard": "لوحة التحكم",
  "nav.login": "تسجيل الدخول",
  "cta.start": "احصل على سعري",
  "cta.talk": "تحدث عن مشروعي",
  "cta.partner": "استكشف المنتجات",
  "cta.getQuote": "احصل على عرض سعر",
  "cta.cart": "السلة",
  "cta.menu": "فتح القائمة",
  "cta.close": "إغلاق القائمة",
  "cta.language": "اللغة",

  "hero.eyebrow": "أفكار تتحول إلى أثر ملموس",
  "hero.title": "مستقبل الطباعة",
  "hero.titleAccent": "يبدأ من هنا.",
  "hero.sub":
    "طباعة احترافية ومخصصة للعلامات والشركات والمبدعين في المغرب: اختر خياراتك، وشاهد السعر، ونحن ننتج ونسلّم.",
  "hero.f1": "خيارات موضّحة قبل الاختيار",
  "hero.f2": "السعر والمدة قبل الطلب",
  "hero.f3": "متابعة كل مرحلة حتى التسليم",
  "hero.note": "إجابة واضحة. دون أي التزام.",
  "hero.alt": "مجموعة من مطبوعات PRIMPLE داخل استوديو مضيء",
  "hero.w1": "أفكار",
  "hero.w2": "أشخاص",
  "hero.w3": "علامات",
  "hero.w4": "مطبوعة",
  "hero.b1": "الطباعة",
  "hero.b2": "الإنسان",
  "hero.b3": "الإمكانات",
  "hero.sign": "نطبع مستقبلًا أكثر إشراقًا",

  "dash.eyebrow": "حسابك",
  "dash.title": "كل أعمال الطباعة",
  "dash.titleAccent": "في مكان واحد.",
  "dash.welcome": "مرحبًا بعودتك، سلمى. هذا ما يجري الآن.",
  "dash.new": "طلب طباعة جديد",
  "dash.kpi.progress": "أعمال قيد التنفيذ",
  "dash.kpi.progressHint": "إنتاج مباشر",
  "dash.kpi.quotes": "عروض أسعار مفتوحة",
  "dash.kpi.quotesHint": "في انتظار ردك",
  "dash.kpi.spend": "إجمالي المصروف",
  "dash.kpi.spendHint": "آخر 90 يومًا",
  "dash.kpi.onTime": "التسليم في الوقت",
  "dash.kpi.onTimeHint": "لدى جميع المطابع",
  "dash.tab.orders": "الطلبات",
  "dash.tab.quotes": "عروض الأسعار",
  "dash.tab.invoices": "الفواتير",
  "dash.orders.title": "أعمالك",
  "dash.happening": "يجري الآن في",
  "dash.printer": "المطبعة",
  "dash.city": "أُنتج في",
  "dash.expected": "متوقع",
  "dash.artwork": "الملف",
  "dash.reorder": "أعد هذا الطلب",
  "dash.invoice": "تحميل الفاتورة",
  "dash.accept": "قبول العرض",
  "dash.message": "مراسلة المطبعة",
  "dash.units": "وحدة",
  "dash.production": "الإنتاج",
  "dash.delivery": "التسليم",
  "dash.inv.invoice": "الفاتورة",
  "dash.inv.order": "الطلب",
  "dash.inv.date": "التاريخ",
  "dash.inv.amount": "المبلغ",
  "dash.inv.status": "الحالة",
  "dash.nav.overview": "نظرة عامة",
  "dash.nav.orders": "الطلبات",
  "dash.nav.quotes": "عروض الأسعار",
  "dash.nav.invoices": "الفواتير",
  "dash.nav.catalog": "اطلب شيئًا جديدًا",
  "dash.support": "تحتاج مساعدة في طلب؟",
  "dash.supportBody": "يجيب مختصو الطباعة لدينا في أقل من ساعة في أيام العمل.",
  "dash.supportCta": "تواصل معنا",

  "footer.tagline": "الطباعة، أخيرًا مبنية كبرمجية.",
  "footer.products": "المنتجات",
  "footer.company": "الشركة",
  "footer.resources": "المصادر",
  "footer.legal": "قانوني",
  "footer.rights": "جميع الحقوق محفوظة.",
};

const dictionaries: Record<Lang, Dict> = { en, fr, ar };

type I18nValue = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  tr: (text: string) => string;
  number: (value: number) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = "primpel-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && languages.includes(stored)) setLangState(stored);
  }, []);

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  setMoneyLocale(lang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      t: (key: string) => dictionaries[lang][key] ?? en[key] ?? key,
      tr: (text: string) =>
        lang === "en"
          ? text
          : lang === "fr"
            ? (homePhrases[text]?.fr ??
              frenchPagePhrases[text] ??
              phrases[text]?.fr ??
              authPhrases[text]?.fr ??
              productPhrases[text]?.fr ??
              commercialPhrases[text]?.fr ??
              copyPhrases[text]?.fr ??
              text)
            : (homePhrases[text]?.ar ??
              phrases[text]?.ar ??
              authPhrases[text]?.ar ??
              productPhrases[text]?.ar ??
              commercialPhrases[text]?.ar ??
              copyPhrases[text]?.ar ??
              text),
      number: (value: number) =>
        value.toLocaleString(lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-MA" : "en-US"),
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  return {
    lang: "en",
    dir: "ltr",
    setLang: () => {},
    t: (key: string) => en[key] ?? key,
    tr: (text: string) => text,
    number: (value: number) => value.toLocaleString("en-US"),
  };
}
