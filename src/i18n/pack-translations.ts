import type { TranslationPair } from "./translations";

const p = (fr: string, ar: string): TranslationPair => ({ fr, ar });

/**
 * Packs, design service, guest checkout and success-page copy.
 * Every new string added in the packs/design pass lives here in FR and AR.
 */
export const packPhrases: Record<string, TranslationPair> = {
  // --- Packs: listing and teaser ---
  Packs: p("Packs", "الباقات"),
  "Labels & stickers": p("Étiquettes & stickers", "الملصقات والإستيكرات"),
  "Delivery labels": p("Étiquettes de livraison", "ملصقات التوصيل"),
  "See packs": p("Voir les packs", "عرض الباقات"),
  "Thank-you cards, stickers and labels that make every order look like your brand.": p(
    "Cartes de remerciement, stickers et étiquettes : chaque commande porte votre marque.",
    "بطاقات شكر وملصقات وإستيكرات تجعل كل طلب يحمل علامتك.",
  ),
  "Flat lay of thank-you cards, logo stickers and product labels": p(
    "Mise à plat de cartes de remerciement, stickers logo et étiquettes produit",
    "عرض مسطح لبطاقات الشكر وملصقات الشعار وملصقات المنتجات",
  ),
  "Labels, stickers and cards that make a first product run look established.": p(
    "Étiquettes, stickers et cartes pour qu'une première série de produits paraisse déjà installée.",
    "ملصقات وإستيكرات وبطاقات تمنح أول دفعة من منتجاتك مظهر علامة راسخة.",
  ),
  "Flat lay of product labels, stickers, brand cards and launch flyers": p(
    "Mise à plat d'étiquettes produit, stickers, cartes de marque et flyers de lancement",
    "عرض مسطح لملصقات المنتجات والإستيكرات وبطاقات العلامة ومطويات الإطلاق",
  ),
  "Configure your print in a few minutes. Receive a clear quote and a confirmed lead time within 4 business hours.": p(
    "Configurez votre impression en quelques minutes. Recevez un devis clair et un délai confirmé sous 4 heures ouvrées.",
    "اضبط طباعتك في دقائق. احصل على عرض سعر واضح وموعد مؤكد خلال 4 ساعات عمل.",
  ),
  "Some items are no longer available and were removed from your cart. Please review your cart before checkout.": p(
    "Certains articles ne sont plus disponibles et ont été retirés de votre panier. Vérifiez votre panier avant de payer.",
    "بعض المنتجات لم تعد متوفرة وتمت إزالتها من سلتك. يرجى مراجعة السلة قبل الدفع.",
  ),
  "New — Packs": p("Nouveau — Packs", "جديد — الباقات"),
  "Everything your business prints, in one pack.": p(
    "Tout ce que votre activité imprime, dans un seul pack.",
    "كل ما تطبعه أعمالك في باقة واحدة.",
  ),
  "Each pack bundles the pieces a business really needs and costs 20% less than ordering the same items one by one.": p(
    "Chaque pack réunit les supports vraiment utiles à une activité et coûte 20 % de moins que les mêmes articles commandés séparément.",
    "تجمع كل باقة المطبوعات التي يحتاجها النشاط فعلاً وتكلّف أقل بنسبة 20% من طلب نفس العناصر بشكل منفصل.",
  ),
  "Ready-made packs, 20% cheaper.": p("Des packs prêts à commander, 20 % moins chers.", "باقات جاهزة، أرخص بنسبة 20%."),
  "Save 20%": p("Économisez 20 %", "وفّر 20%"),
  "See what's inside": p("Voir ce qu'il contient", "شاهد محتوى الباقة"),
  "See all packs": p("Voir tous les packs", "عرض كل الباقات"),
  "What's in this pack": p("Ce que contient ce pack", "محتويات هذه الباقة"),
  "Pack price": p("Prix du pack", "سعر الباقة"),
  "Sold separately": p("Prix séparé", "السعر منفصلاً"),
  "Add the pack to my cart": p("Ajouter le pack à mon panier", "أضف الباقة إلى سلتي"),
  "Edit this pack": p("Modifier ce pack", "تعديل هذه الباقة"),
  "Change any quantity — the pack price follows immediately.": p(
    "Modifiez une quantité : le prix du pack se met à jour immédiatement.",
    "غيّر أي كمية وسيتحدث سعر الباقة فوراً.",
  ),
  "This pack doesn't exist.": p("Ce pack n'existe pas.", "هذه الباقة غير موجودة."),
  "{count} items included, delivery charged once.": p(
    "{count} articles inclus, livraison facturée une seule fois.",
    "{count} عناصر مشمولة، ورسوم التوصيل تُحتسب مرة واحدة.",
  ),

  // --- Pack names, audiences, descriptions ---
  "Primple Launch Pack": p("Pack Primple Lancement", "باقة Primple للانطلاق"),
  "Primple Beauty Pack": p("Pack Primple Beauté", "باقة Primple للتجميل"),
  "Primple Salon Pack": p("Pack Primple Salon", "باقة Primple للصالونات"),
  "Primple E-commerce Pack": p("Pack Primple E-commerce", "باقة Primple للتجارة الإلكترونية"),
  "Primple Brand Pack": p("Pack Primple Marque", "باقة Primple للعلامات"),
  "Primple BTP Pack": p("Pack Primple BTP", "باقة Primple للبناء"),
  "Primple Restaurant Pack": p("Pack Primple Restaurant", "باقة Primple للمطاعم"),
  "Primple Event Pack": p("Pack Primple Événement", "باقة Primple للفعاليات"),
  "Primple Office Pack": p("Pack Primple Bureau", "باقة Primple للمكاتب"),
  "Primple Retail Pack": p("Pack Primple Commerce", "باقة Primple للمتاجر"),

  "New businesses and startups": p("Nouvelles entreprises et startups", "الشركات الجديدة والناشئة"),
  "Beauty centres, spas and nail bars": p(
    "Centres de beauté, spas et onglerie",
    "مراكز التجميل والمنتجعات وصالونات الأظافر",
  ),
  "Hair salons and barbershops": p("Salons de coiffure et barbiers", "صالونات الحلاقة والباربر"),
  "Online shops": p("Boutiques en ligne", "المتاجر الإلكترونية"),
  "New product brands": p("Nouvelles marques produit", "العلامات التجارية الجديدة"),
  "Construction and contractors": p("Construction et entreprises du BTP", "البناء والمقاولات"),
  "Restaurants and cafés": p("Restaurants et cafés", "المطاعم والمقاهي"),
  "Openings, launches and events": p("Ouvertures, lancements et événements", "الافتتاحات والإطلاقات والفعاليات"),
  "Companies and agencies": p("Entreprises et agences", "الشركات والوكالات"),
  "Shops and boutiques": p("Magasins et boutiques", "المحلات والمتاجر"),

  "Everything a new company needs on day one, printed and ready to hand out.": p(
    "Tout ce qu'une nouvelle entreprise doit avoir le premier jour, imprimé et prêt à distribuer.",
    "كل ما تحتاجه شركة جديدة في يومها الأول، مطبوع وجاهز للتوزيع.",
  ),
  "Loyalty, appointments and service menus in one coordinated set.": p(
    "Fidélité, rendez-vous et menus de services dans un ensemble coordonné.",
    "الولاء والمواعيد وقوائم الخدمات في مجموعة منسّقة.",
  ),
  "Front-desk essentials for a salon that books out.": p(
    "L'essentiel de l'accueil pour un salon qui affiche complet.",
    "أساسيات الاستقبال لصالون محجوز بالكامل.",
  ),
  "Unboxing that looks like your brand, from the label to the tape.": p(
    "Un déballage à l'image de votre marque, de l'étiquette au ruban adhésif.",
    "تجربة فتح تعكس علامتك، من الملصق إلى الشريط اللاصق.",
  ),
  "Labels, sleeves and cards that make a first product run look established.": p(
    "Étiquettes, manchons et cartes qui donnent à une première série l'allure d'une marque installée.",
    "ملصقات وأغلفة وبطاقات تمنح أول إنتاج مظهر علامة راسخة.",
  ),
  "Site-ready printing that holds up outdoors and on the road.": p(
    "Des impressions de chantier qui résistent dehors et sur la route.",
    "مطبوعات للورش تتحمل الخارج والطريق.",
  ),
  "From the table to the delivery bag, everything carries your name.": p(
    "De la table au sac de livraison, tout porte votre nom.",
    "من الطاولة إلى كيس التوصيل، كل شيء يحمل اسمك.",
  ),
  "Invite, sign and guide your guests with one consistent set.": p(
    "Invitez, signalez et guidez vos invités avec un ensemble cohérent.",
    "ادعُ ضيوفك ووجّههم بمجموعة متناسقة.",
  ),
  "The full stationery set for meetings, proposals and onboarding.": p(
    "La papeterie complète pour les réunions, les propositions et l'intégration.",
    "مجموعة قرطاسية كاملة للاجتماعات والعروض واستقبال العملاء.",
  ),
  "Shelf, bag and counter printing for a store that sells.": p(
    "Impressions rayon, sac et comptoir pour un magasin qui vend.",
    "مطبوعات للرفوف والأكياس والكاونتر لمتجر ناجح.",
  ),

  // --- Pack image alt text ---
  "Flat lay of business cards, flyers, stickers and a roll-up banner": p(
    "Mise à plat de cartes de visite, flyers, stickers et d'un roll-up",
    "عرض مسطح لبطاقات عمل ومناشير وملصقات ولوحة رول أب",
  ),
  "Flat lay of loyalty cards, appointment cards, a service menu and gift vouchers": p(
    "Mise à plat de cartes de fidélité, cartes de rendez-vous, menu de services et bons cadeaux",
    "عرض مسطح لبطاقات الولاء وبطاقات المواعيد وقائمة الخدمات وقسائم الهدايا",
  ),
  "Flat lay of loyalty cards, a price list, flyers and window stickers": p(
    "Mise à plat de cartes de fidélité, liste de prix, flyers et stickers vitrine",
    "عرض مسطح لبطاقات الولاء ولائحة الأسعار والمناشير وملصقات الواجهة",
  ),
  "Flat lay of thank-you cards, product labels, inserts and branded packing tape": p(
    "Mise à plat de cartes de remerciement, étiquettes produit, inserts et ruban adhésif personnalisé",
    "عرض مسطح لبطاقات شكر وملصقات منتجات وإدراجات وشريط لاصق مخصص",
  ),
  "Flat lay of product labels, packaging sleeves, brand cards and launch flyers": p(
    "Mise à plat d'étiquettes produit, manchons d'emballage, cartes de marque et flyers de lancement",
    "عرض مسطح لملصقات المنتجات وأغلفة التعبئة وبطاقات العلامة ومناشير الإطلاق",
  ),
  "Flat lay of business cards, quotation folders, a site board and vehicle stickers": p(
    "Mise à plat de cartes de visite, chemises de devis, panneau de chantier et stickers véhicule",
    "عرض مسطح لبطاقات عمل وملفات عروض أسعار ولوحة ورش وملصقات مركبات",
  ),
  "Flat lay of menus, table cards, takeaway stickers and loyalty cards": p(
    "Mise à plat de menus, cartes de table, stickers à emporter et cartes de fidélité",
    "عرض مسطح لقوائم طعام وبطاقات طاولة وملصقات الطلبات الخارجية وبطاقات ولاء",
  ),
  "Flat lay of invitations, flyers, posters and a roll-up banner": p(
    "Mise à plat d'invitations, flyers, affiches et d'un roll-up",
    "عرض مسطح لدعوات ومناشير وملصقات ولوحة رول أب",
  ),
  "Flat lay of letterhead, envelopes, folders and branded notebooks": p(
    "Mise à plat de papier à en-tête, enveloppes, chemises et carnets personnalisés",
    "عرض مسطح لأوراق رسمية وأظرفة وملفات ودفاتر مخصصة",
  ),
  "Flat lay of price tags, bag stickers, loyalty cards and window stickers": p(
    "Mise à plat d'étiquettes de prix, stickers de sac, cartes de fidélité et stickers vitrine",
    "عرض مسطح لبطاقات أسعار وملصقات أكياس وبطاقات ولاء وملصقات واجهة",
  ),

  // --- Pack line labels ---
  "Business cards": p("Cartes de visite", "بطاقات العمل"),
  Flyers: p("Flyers", "مناشير"),
  Stickers: p("Stickers", "ملصقات"),
  "Roll-up banner": p("Roll-up", "لوحة رول أب"),
  "Service menus": p("Menus de services", "قوائم الخدمات"),
  Menus: p("Menus", "قوائم الطعام"),
  Posters: p("Affiches", "ملصقات إعلانية"),
  "Logo stickers": p("Stickers logo", "ملصقات الشعار"),
  "Product labels": p("Étiquettes produit", "ملصقات المنتجات"),
  "Launch flyers": p("Flyers de lancement", "مناشير الإطلاق"),
  "PVC banners": p("Bâches PVC", "لافتات PVC"),
  "Takeaway stickers": p("Stickers à emporter", "ملصقات الطلبات الخارجية"),
  "Delivery packaging labels": p("Étiquettes d'emballage livraison", "ملصقات تغليف التوصيل"),
  "Presentation brochures": p("Brochures de présentation", "كتيبات تقديمية"),
  "Letterhead A4": p("Papier à en-tête A4", "ورق رسمي A4"),
  "Printed envelopes": p("Enveloppes imprimées", "أظرفة مطبوعة"),
  "Presentation folders": p("Chemises de présentation", "ملفات تقديمية"),
  "Branded notebooks": p("Carnets personnalisés", "دفاتر مخصصة"),
  "Loyalty cards": p("Cartes de fidélité", "بطاقات الولاء"),
  "Appointment cards": p("Cartes de rendez-vous", "بطاقات المواعيد"),
  "Gift vouchers": p("Bons cadeaux", "قسائم هدايا"),
  "Thank-you cards": p("Cartes de remerciement", "بطاقات شكر"),
  "Brand story cards": p("Cartes de marque", "بطاقات العلامة"),
  "Packaging inserts": p("Inserts d'emballage", "إدراجات التغليف"),
  "Packaging sleeves": p("Manchons d'emballage", "أغلفة التعبئة"),
  "Packaging seals": p("Sceaux d'emballage", "أختام التغليف"),
  "Branded packing tape": p("Ruban adhésif personnalisé", "شريط لاصق مخصص"),
  "Price tags": p("Étiquettes de prix", "بطاقات الأسعار"),
  "Price list board": p("Liste de prix", "لوحة الأسعار"),
  "Table cards": p("Cartes de table", "بطاقات الطاولة"),
  Invitations: p("Invitations", "بطاقات دعوة"),
  "Directional signs": p("Panneaux directionnels", "لوحات إرشادية"),
  "Site boards": p("Panneaux de chantier", "لوحات الورش"),
  "Vehicle stickers": p("Stickers véhicule", "ملصقات المركبات"),
  "Quotation folders": p("Chemises de devis", "ملفات عروض الأسعار"),
  "Window stickers": p("Stickers vitrine", "ملصقات الواجهة"),
  "Shopping bag stickers": p("Stickers pour sacs", "ملصقات أكياس التسوق"),

  // --- Design service ---
  "Design service": p("Service de design", "خدمة التصميم"),
  "A designer on your file, for 100 MAD an hour.": p(
    "Un designer sur votre fichier, pour 100 MAD de l'heure.",
    "مصمم يعمل على ملفك، مقابل 100 درهم في الساعة.",
  ),
  "Book the exact number of hours you need. We lay out, adapt and prepare your artwork so it prints the way you expect.":
    p(
      "Réservez exactement le nombre d'heures dont vous avez besoin. Nous mettons en page, adaptons et préparons votre fichier pour qu'il s'imprime comme prévu.",
      "احجز عدد الساعات الذي تحتاجه بالضبط. نقوم بالتنسيق والتكييف وتحضير ملفك ليُطبع كما تتوقع.",
    ),
  "What this service covers": p("Ce que couvre ce service", "ما تشمله هذه الخدمة"),
  "Not included": p("Non inclus", "غير مشمول"),
  "Book your design hours": p("Réservez vos heures de design", "احجز ساعات التصميم"),
  Hours: p("Heures", "الساعات"),
  "What do you need designed?": p("Que devons-nous concevoir ?", "ما الذي تريد تصميمه؟"),
  "For example: adapt my A5 flyer to A4 and prepare it for printing.": p(
    "Par exemple : adapter mon flyer A5 en A4 et le préparer pour l'impression.",
    "مثال: تحويل منشوري من A5 إلى A4 وتحضيره للطباعة.",
  ),
  "Preferred start date": p("Date de début souhaitée", "تاريخ البدء المفضل"),
  "No delivery fee: this service is delivered as files.": p(
    "Pas de frais de livraison : ce service est livré sous forme de fichiers.",
    "لا توجد رسوم توصيل: تُسلّم هذه الخدمة كملفات.",
  ),
  "Add design time to my cart": p("Ajouter ces heures à mon panier", "أضف ساعات التصميم إلى سلتي"),
  "Design time added to your cart.": p(
    "Heures de design ajoutées à votre panier.",
    "تمت إضافة ساعات التصميم إلى سلتك.",
  ),
  "Tell us in a sentence or two what you need designed.": p(
    "Décrivez en une ou deux phrases ce que vous voulez faire concevoir.",
    "أخبرنا في جملة أو جملتين بما تريد تصميمه.",
  ),
  "Branding, brand strategy and logo creation are separate projects — tell us about them on the contact page.": p(
    "L'identité de marque, la stratégie et la création de logo sont des projets à part — parlez-nous-en depuis la page contact.",
    "الهوية البصرية واستراتيجية العلامة وتصميم الشعار مشاريع منفصلة — حدّثنا عنها عبر صفحة الاتصال.",
  ),
  "Layout and artwork setup for printing": p(
    "Mise en page et préparation du visuel pour l'impression",
    "التنسيق وإعداد التصميم للطباعة",
  ),
  "Adapting an existing design to a new format": p(
    "Adaptation d'un design existant à un nouveau format",
    "تكييف تصميم موجود مع مقاس جديد",
  ),
  "Print-ready file preparation, bleed and colour checks": p(
    "Préparation du fichier d'impression, fonds perdus et contrôle des couleurs",
    "تحضير ملف جاهز للطباعة مع الهوامش وفحص الألوان",
  ),
  "Fixing a file that failed our pre-print check": p(
    "Correction d'un fichier refusé lors de notre contrôle avant impression",
    "إصلاح ملف لم يجتز فحص ما قبل الطباعة",
  ),
  "Brand identity creation": p("Création d'identité de marque", "إنشاء الهوية البصرية"),
  "Logo design": p("Création de logo", "تصميم الشعار"),
  "Brand strategy and naming": p("Stratégie de marque et naming", "استراتيجية العلامة والتسمية"),
  "Need a designer? 100 MAD an hour.": p(
    "Besoin d'un designer ? 100 MAD de l'heure.",
    "تحتاج مصمماً؟ 100 درهم في الساعة.",
  ),
  "Book a designer — 100 MAD/h": p("Réserver un designer — 100 MAD/h", "احجز مصمماً — 100 درهم/ساعة"),
  "Book design time": p("Réserver des heures de design", "احجز ساعات تصميم"),
  "No print-ready file? Book a designer for": p(
    "Pas de fichier prêt à imprimer ? Réservez un designer pour",
    "لا تملك ملفاً جاهزاً للطباعة؟ احجز مصمماً مقابل",
  ),
  "an hour.": p("de l'heure.", "في الساعة."),
  "Layout, format adaptation and print file preparation. Logo creation and brand identity are not included.": p(
    "Mise en page, adaptation de format et préparation des fichiers d'impression. La création de logo et l'identité de marque ne sont pas incluses.",
    "التنسيق وتكييف المقاسات وتحضير ملفات الطباعة. تصميم الشعار والهوية البصرية غير مشمولين.",
  ),
  "Change my design hours": p("Modifier mes heures de design", "تعديل ساعات التصميم"),

  // --- Guest checkout and success page ---
  "No account needed to pay. You can create one right after payment to track this order.": p(
    "Aucun compte n'est nécessaire pour payer. Vous pourrez en créer un juste après le paiement pour suivre cette commande.",
    "لا حاجة لحساب للدفع. يمكنك إنشاء حساب مباشرة بعد الدفع لتتبع هذا الطلب.",
  ),
  "Create your account": p("Créez votre compte", "أنشئ حسابك"),
  "Follow this order until it is delivered": p(
    "Suivre cette commande jusqu'à la livraison",
    "تابع هذا الطلب حتى التسليم",
  ),
  "Keep your files for your next orders": p(
    "Conserver vos fichiers pour vos prochaines commandes",
    "احتفظ بملفاتك لطلباتك القادمة",
  ),
  "Find all your invoices in one place": p(
    "Retrouver toutes vos factures au même endroit",
    "اعثر على كل فواتيرك في مكان واحد",
  ),
  "Reorder in a couple of clicks": p("Recommander en deux clics", "أعد الطلب بنقرتين"),
  "We'll attach this order to your account once your email is confirmed.": p(
    "Nous rattacherons cette commande à votre compte dès que votre e-mail sera confirmé.",
    "سنربط هذا الطلب بحسابك بمجرد تأكيد بريدك الإلكتروني.",
  ),

  // --- Design brief estimator ---
  "Describe what you need and see the estimated hours and price update instantly, before you order.": p(
    "Décrivez votre besoin et voyez les heures estimées et le prix se mettre à jour instantanément, avant de commander.",
    "صف ما تحتاجه وشاهد الساعات المقدّرة والسعر يتحدثان فورًا قبل الطلب.",
  ),
  "Tell us about your project": p("Parlez-nous de votre projet", "أخبرنا عن مشروعك"),
  "What do you need?": p("De quoi avez-vous besoin ?", "ما الذي تحتاجه؟"),
  "Adapt an existing design to a new format": p(
    "Adapter un design existant à un nouveau format",
    "تكييف تصميم موجود مع مقاس جديد",
  ),
  "Prepare a print-ready file": p("Préparer un fichier prêt à imprimer", "تحضير ملف جاهز للطباعة"),
  "Flyer or poster": p("Flyer ou affiche", "منشور أو ملصق"),
  "Menu or price list": p("Menu ou liste de prix", "قائمة طعام أو قائمة أسعار"),
  "Brochure or catalogue": p("Brochure ou catalogue", "كتيّب أو كتالوج"),
  "Packaging artwork": p("Visuel d'emballage", "تصميم التغليف"),
  Presentation: p("Présentation", "عرض تقديمي"),
  "Something else": p("Autre chose", "شيء آخر"),
  "Do you have an editable source file?": p(
    "Avez-vous un fichier source modifiable ?",
    "هل لديك ملف مصدر قابل للتعديل؟",
  ),
  Yes: p("Oui", "نعم"),
  No: p("Non", "لا"),
  "Number of final formats": p("Nombre de formats finaux", "عدد المقاسات النهائية"),
  "Number of pages or sides": p("Nombre de pages ou de faces", "عدد الصفحات أو الأوجه"),
  "The more detail you give, the more accurate the estimate.": p(
    "Plus vous donnez de détails, plus l'estimation est précise.",
    "كلما زادت التفاصيل، كان التقدير أدق.",
  ),
  "I need it within 48 hours": p("J'en ai besoin sous 48 heures", "أحتاجه خلال 48 ساعة"),
  "Your instant estimate": p("Votre estimation immédiate", "تقديرك الفوري"),
  Estimated: p("Estimé", "تقديري"),
  "If your project turns out to need less time, you only pay the hours used.": p(
    "Si votre projet demande moins de temps, vous ne payez que les heures utilisées.",
    "إذا احتاج مشروعك وقتًا أقل، فلن تدفع سوى الساعات المستعملة.",
  ),

  // --- Designer chat ---
  "Designer chat": p("Chat designer", "محادثة المصمم"),
  "Talk directly with your Primple designer about your files and your brief.": p(
    "Échangez directement avec votre designer Primple à propos de vos fichiers et de votre brief.",
    "تواصل مباشرة مع مصمم Primple بخصوص ملفاتك وطلبك.",
  ),
  "Loading your conversation…": p("Chargement de votre conversation…", "جارٍ تحميل محادثتك…"),
  "The conversation could not be loaded.": p("La conversation n'a pas pu être chargée.", "تعذّر تحميل المحادثة."),
  "No messages yet. Send the first one and a designer will reply here.": p(
    "Aucun message pour l'instant. Envoyez le premier, un designer vous répondra ici.",
    "لا توجد رسائل بعد. أرسل أول رسالة وسيرد عليك مصمم هنا.",
  ),
  "Write your message to the designer…": p("Écrivez votre message au designer…", "اكتب رسالتك إلى المصمم…"),
  "Send message": p("Envoyer le message", "إرسال الرسالة"),
  "Your message could not be sent. Please try again.": p(
    "Votre message n'a pas pu être envoyé. Réessayez.",
    "تعذّر إرسال رسالتك. حاول مرة أخرى.",
  ),
  You: p("Vous", "أنت"),
  Designer: p("Designer", "المصمم"),
  "We will contact you soon.": p("Nous vous contacterons bientôt.", "سنتواصل معك قريبًا."),

  "Request a quote": p("Demander un devis", "اطلب عرض سعر"),
  "I have a print-ready file": p("J'ai un fichier prêt à imprimer", "لدي ملف جاهز للطباعة"),
  "I need Primple to create the design": p("Je veux que Primple crée le design", "أريد أن تصمم Primple التصميم"),
  "Design by Primple — 100 MAD/h": p("Design par Primple — 100 MAD/h", "تصميم من Primple — 100 درهم/ساعة"),
  "{hours} h of design for this product, added to your order: {price}. No file needed — a designer contacts you after the order.": p(
    "{hours} h de design pour ce produit, ajoutées à votre commande : {price}. Aucun fichier requis — un designer vous contacte après la commande.",
    "{hours} ساعة تصميم لهذا المنتج تضاف إلى طلبك: {price}. لا حاجة لملف — سيتواصل معك مصمم بعد الطلب.",
  ),
  "Branding and logo creation are not included.": p("Le branding et la création de logo ne sont pas inclus.", "الهوية البصرية وتصميم الشعار غير مشمولين."),
  "Packaging is priced on quote: send your request and we reply with a tailored price.": p(
    "L'emballage est sur devis : envoyez votre demande et nous vous répondons avec un prix sur mesure.",
    "التغليف حسب عرض السعر: أرسل طلبك وسنرد عليك بسعر مخصص.",
  ),
  Design: p("Design", "التصميم"),
};
