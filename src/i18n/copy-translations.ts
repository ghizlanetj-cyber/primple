import type { TranslationPair } from "./translations";

const p = (fr: string, ar: string): TranslationPair => ({ fr, ar });

/** Copy rewritten for conversion + SEO (French-first site). */
export const copyPhrases: Record<string, TranslationPair> = {
  // Hero microcopy
  "Clear answer. No commitment.": p(
    "Réponse claire. Sans engagement.",
    "إجابة واضحة. دون أي التزام.",
  ),

  // Problem / How it works
  "Printing shouldn't become a second project.": p(
    "Imprimer ne devrait pas devenir un deuxième projet.",
    "لا ينبغي أن تتحول الطباعة إلى مشروع ثانٍ.",
  ),
  "Choosing the right material, understanding finishes, comparing options, preparing files, waiting for the result. Primple makes each step simple.":
    p(
      "Choisir le bon support, comprendre les finitions, comparer les options, préparer les fichiers, attendre le résultat. Primple simplifie chaque étape.",
      "اختيار الخامة المناسبة، فهم التشطيبات، مقارنة الخيارات، تجهيز الملفات، وانتظار النتيجة. Primple يبسّط كل خطوة.",
    ),
  "Four steps to your print": p("Quatre étapes jusqu'à votre impression", "أربع خطوات حتى طباعتك"),
  "Describe your project": p("Décrivez votre projet", "صف مشروعك"),
  "Tell us what you want to print. We show you the products that fit.": p(
    "Dites-nous ce que vous voulez imprimer. Nous vous montrons les produits adaptés.",
    "أخبرنا بما تريد طباعته، ونعرض لك المنتجات المناسبة.",
  ),
  "Choose your options": p("Choisissez vos options", "اختر خياراتك"),
  "Format, paper, finish, quantity — with the price updated as you go.": p(
    "Format, papier, finition, quantité — avec le prix qui se met à jour au fur et à mesure.",
    "المقاس والورق والتشطيب والكمية — مع تحديث السعر أثناء اختيارك.",
  ),
  "Validate your print": p("Validez votre impression", "أكّد طباعتك"),
  "Send your file and confirm. You know the price and the timeline before ordering.":
    p(
      "Envoyez votre fichier et confirmez. Vous connaissez le prix et le délai avant de commander.",
      "أرسل ملفك وأكّد الطلب. تعرف السعر والمدة قبل الطلب.",
    ),
  "Receive your order": p("Recevez votre commande", "استلم طلبك"),
  "Production starts, you follow each stage until delivery.": p(
    "La production démarre, vous suivez chaque étape jusqu'à la livraison.",
    "يبدأ الإنتاج، وتتابع كل مرحلة حتى التسليم.",
  ),

  // Products section
  "Know your price before you print.": p(
    "Connaissez votre prix avant d'imprimer.",
    "اعرف سعرك قبل الطباعة.",
  ),
  "Configure a product, see the price, the production time and the delivery date on the same screen.":
    p(
      "Configurez un produit et voyez le prix, le délai de production et la date de livraison sur le même écran.",
      "اضبط منتجك وشاهد السعر ومدة الإنتاج وتاريخ التسليم على الشاشة نفسها.",
    ),
  "See all products": p("Voir tous les produits", "عرض جميع المنتجات"),
  "Get a price": p("Obtenir un prix", "احصل على السعر"),

  // Why Primple
  "Why Primple": p("Pourquoi Primple", "لماذا Primple"),
  "A print partner, not just a supplier.": p(
    "Un partenaire d'impression, pas un simple fournisseur.",
    "شريك طباعة، لا مجرد مورّد.",
  ),
  "Ideas, design, print, physical impact — the same workflow from first question to delivered box.":
    p(
      "Idée, conception, impression, impact physique : un seul parcours, de la première question au carton livré.",
      "الفكرة، التصميم، الطباعة، الأثر الملموس: مسار واحد من أول سؤال حتى تسليم الطلب.",
    ),
  "A simpler process": p("Un processus plus simple", "مسار أبسط"),
  "Configure, order and follow your print without chasing anyone by phone.": p(
    "Configurez, commandez et suivez votre impression sans relancer personne par téléphone.",
    "اضبط واطلب وتابع طباعتك دون الحاجة إلى متابعة أحد عبر الهاتف.",
  ),
  "Prices you can see": p("Des prix visibles", "أسعار واضحة"),
  "The price, the production time and the delivery date appear before you order.":
    p(
      "Le prix, le délai de production et la date de livraison s'affichent avant la commande.",
      "يظهر السعر ومدة الإنتاج وتاريخ التسليم قبل الطلب.",
    ),
  "Guidance on your options": p("Un accompagnement sur vos choix", "إرشاد في خياراتك"),
  "Paper, finish, format: each option is explained where you choose it.": p(
    "Papier, finition, format : chaque option est expliquée à l'endroit où vous la choisissez.",
    "الورق والتشطيب والمقاس: كل خيار مشروح في مكان اختياره.",
  ),
  "Printing that carries your brand": p(
    "Une impression qui porte votre marque",
    "طباعة تعكس علامتك",
  ),
  "Reorder the same setup so your materials stay consistent over time.": p(
    "Recommandez la même configuration pour garder des supports cohérents dans le temps.",
    "أعد الطلب بالإعدادات نفسها ليبقى مظهر موادك متناسقًا مع الوقت.",
  ),
  "Orders you can follow": p("Des commandes que vous suivez", "طلبات يمكنك تتبعها"),
  "Artwork approval, production, delivery: every stage is visible from your account.":
    p(
      "Validation du fichier, production, livraison : chaque étape est visible depuis votre compte.",
      "اعتماد الملف، الإنتاج، التسليم: كل مرحلة ظاهرة من حسابك.",
    ),
  "Custom projects welcome": p("Les projets sur mesure aussi", "ومشاريع مخصصة كذلك"),
  "Specific format or material? Send your project and we work out the options with you.":
    p(
      "Format ou matière spécifique ? Envoyez votre projet, nous étudions les options avec vous.",
      "مقاس أو خامة خاصة؟ أرسل مشروعك وندرس الخيارات معك.",
    ),

  // Final CTA
  "Your next print starts here.": p(
    "Votre prochaine impression commence ici.",
    "طباعتك القادمة تبدأ من هنا.",
  ),
  "Tell us what you want to create. We help you choose the right options and turn your idea into a printed piece.":
    p(
      "Dites-nous ce que vous voulez créer. Nous vous aidons à choisir les bonnes options et à transformer votre idée en support imprimé.",
      "أخبرنا بما تريد إنشاءه. نساعدك على اختيار الخيارات المناسبة وتحويل فكرتك إلى مطبوع.",
    ),
  "Talk about my project": p("Parler de mon projet", "تحدث عن مشروعي"),
  "See the products": p("Voir les produits", "عرض المنتجات"),

  // Homepage FAQ
  "Questions before printing": p("Les questions avant d'imprimer", "أسئلة قبل الطباعة"),
  "How do I order a print on Primple?": p(
    "Comment commander une impression sur Primple ?",
    "كيف أطلب طباعة عبر Primple؟",
  ),
  "Choose your product, set the format, paper, finish and quantity, upload your file and confirm. The price, production time and delivery date are shown before payment.":
    p(
      "Choisissez votre produit, réglez le format, le papier, la finition et la quantité, importez votre fichier puis confirmez. Le prix, le délai de production et la date de livraison sont affichés avant le paiement.",
      "اختر منتجك، وحدّد المقاس والورق والتشطيب والكمية، وارفع ملفك ثم أكّد. يظهر السعر ومدة الإنتاج وتاريخ التسليم قبل الدفع.",
    ),
  "I don't know which paper or finish to choose. Can you help?": p(
    "Je ne sais pas quel papier ni quelle finition choisir. Pouvez-vous m'aider ?",
    "لا أعرف أي ورق أو تشطيب أختار. هل يمكنكم مساعدتي؟",
  ),
  "Each paper and finish is described where you select it, with its effect on price and production time. If you still hesitate, send us your project and we go through the options with you.":
    p(
      "Chaque papier et chaque finition est décrit à l'endroit où vous le sélectionnez, avec son effet sur le prix et le délai. Si vous hésitez encore, envoyez-nous votre projet et nous passons les options en revue avec vous.",
      "كل نوع ورق وتشطيب موصوف في مكان اختياره مع أثره على السعر والمدة. وإن بقي التردد، أرسل مشروعك ونستعرض الخيارات معك.",
    ),
  "How do I know how much my print will cost?": p(
    "Comment savoir combien va coûter mon impression ?",
    "كيف أعرف تكلفة طباعتي؟",
  ),
  "The price updates as you configure your product, so you see the total for your exact options and quantity before ordering.":
    p(
      "Le prix se met à jour pendant que vous configurez votre produit : vous voyez le total pour vos options et votre quantité exactes avant de commander.",
      "يتحدّث السعر أثناء ضبط منتجك، فترى الإجمالي لخياراتك وكميتك بالضبط قبل الطلب.",
    ),
  "How do I prepare my file for printing?": p(
    "Comment préparer mon fichier pour l'impression ?",
    "كيف أجهّز ملفي للطباعة؟",
  ),
  "Send a print-ready PDF with your artwork at final size. If your file needs adjusting, we tell you what to change before production starts.":
    p(
      "Envoyez un PDF prêt à imprimer, à la taille finale. Si votre fichier doit être ajusté, nous vous disons quoi corriger avant le lancement de la production.",
      "أرسل ملف PDF جاهزًا للطباعة بالمقاس النهائي. وإذا احتاج الملف إلى تعديل، نخبرك بما يجب تصحيحه قبل بدء الإنتاج.",
    ),
  "Can I order a custom format or material?": p(
    "Puis-je commander un format ou une matière sur mesure ?",
    "هل يمكنني طلب مقاس أو خامة مخصصة؟",
  ),
  "Yes. Request a quote with your specifications and we come back with the options and the price for your project.":
    p(
      "Oui. Demandez un devis en précisant vos spécifications et nous revenons vers vous avec les options et le prix de votre projet.",
      "نعم. اطلب عرض سعر مع مواصفاتك ونعود إليك بالخيارات والسعر الخاص بمشروعك.",
    ),
  "Can I follow my order?": p("Puis-je suivre ma commande ?", "هل يمكنني تتبع طلبي؟"),
  "Yes. From your account you follow artwork approval, production and delivery for each order.":
    p(
      "Oui. Depuis votre compte, vous suivez la validation du fichier, la production et la livraison de chaque commande.",
      "نعم. من حسابك تتابع اعتماد الملف والإنتاج والتسليم لكل طلب.",
    ),
  "Can I reorder the same print?": p(
    "Puis-je recommander la même impression ?",
    "هل يمكنني إعادة طلب الطباعة نفسها؟",
  ),
  "Yes. Reorder a previous job with the same configuration and file, and change the quantity if you need to.":
    p(
      "Oui. Recommandez un travail précédent avec la même configuration et le même fichier, en modifiant la quantité si besoin.",
      "نعم. أعد طلب عمل سابق بالإعدادات والملف نفسه، مع تغيير الكمية عند الحاجة.",
    ),

  // Screen-reader summary
  "Primple — professional and custom printing for brands, businesses and creatives in Morocco":
    p(
      "Primple — impression professionnelle et personnalisée pour les marques, les entreprises et les créatifs au Maroc",
      "Primple — طباعة احترافية ومخصصة للعلامات والشركات والمبدعين في المغرب",
    ),

  // Stats labels
  "Businesses printing with Primple": p(
    "Entreprises qui impriment avec Primple",
    "شركات تطبع مع Primple",
  ),,
  "Custom printing for brands, businesses and creatives in Morocco: options explained, price shown before you order, production followed to delivery.":
    p(
      "Impression personnalisée pour les marques, les entreprises et les créatifs au Maroc : options expliquées, prix affiché avant la commande, production suivie jusqu'à la livraison.",
      "طباعة مخصصة للعلامات والشركات والمبدعين في المغرب: خيارات موضّحة، وسعر يظهر قبل الطلب، وإنتاج متابَع حتى التسليم.",
    ),
};
