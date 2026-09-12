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
  "Send your file and confirm. You know the price and the timeline before ordering.": p(
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
  "The price, the production time and the delivery date appear before you order.": p(
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
  "Artwork approval, production, delivery: every stage is visible from your account.": p(
    "Validation du fichier, production, livraison : chaque étape est visible depuis votre compte.",
    "اعتماد الملف، الإنتاج، التسليم: كل مرحلة ظاهرة من حسابك.",
  ),
  "Custom projects welcome": p("Les projets sur mesure aussi", "ومشاريع مخصصة كذلك"),
  "Specific format or material? Send your project and we work out the options with you.": p(
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
  "Yes. From your account you follow artwork approval, production and delivery for each order.": p(
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
  "Primple — professional and custom printing for brands, businesses and creatives in Morocco": p(
    "Primple — impression professionnelle et personnalisée pour les marques, les entreprises et les créatifs au Maroc",
    "Primple — طباعة احترافية ومخصصة للعلامات والشركات والمبدعين في المغرب",
  ),

  // Stats labels
  "Businesses printing with Primple": p(
    "Entreprises qui impriment avec Primple",
    "شركات تطبع مع Primple",
  ),
  "Custom printing for brands, businesses and creatives in Morocco: options explained, price shown before you order, production followed to delivery.":
    p(
      "Impression personnalisée pour les marques, les entreprises et les créatifs au Maroc : options expliquées, prix affiché avant la commande, production suivie jusqu'à la livraison.",
      "طباعة مخصصة للعلامات والشركات والمبدعين في المغرب: خيارات موضّحة، وسعر يظهر قبل الطلب، وإنتاج متابَع حتى التسليم.",
    ),

  // Checkout + payment terms
  "Advance now (50%)": p("Acompte maintenant (50 %)", "الدفعة المقدمة الآن (50٪)"),
  "Cash on delivery (50%)": p("Paiement à la livraison (50 %)", "الدفع عند الاستلام (50٪)"),
  "Advance paid (50%)": p("Acompte payé (50 %)", "الدفعة المقدمة المدفوعة (50٪)"),
  "Paid to the courier when your order arrives.": p(
    "À régler au livreur à la réception de votre commande.",
    "يُدفع لمندوب التوصيل عند وصول طلبك.",
  ),
  "Confirms your order and releases it to the printer.": p(
    "Confirme votre commande et la transmet à l'imprimeur.",
    "يؤكد طلبك ويرسله إلى المطبعة.",
  ),
  "Pay 50% advance": p("Payer l'acompte de 50 %", "ادفع مقدمًا 50٪"),
  "Placing your order…": p("Enregistrement de votre commande…", "جارٍ تسجيل طلبك…"),
  "Order confirmed. 50% advance received.": p(
    "Commande confirmée. Acompte de 50 % reçu.",
    "تم تأكيد الطلب. تم استلام دفعة 50٪.",
  ),
  "We couldn't place your order.": p(
    "Nous n'avons pas pu enregistrer votre commande.",
    "لم نتمكن من تسجيل طلبك.",
  ),
  "Please sign in above so we can save this order to your dashboard.": p(
    "Connectez-vous ci-dessus pour que nous puissions enregistrer cette commande dans votre espace client.",
    "سجّل الدخول أعلاه حتى نتمكن من حفظ هذا الطلب في لوحتك.",
  ),
  "Pay 50% now to start production. The remaining 50% is paid in cash on delivery.": p(
    "Payez 50 % maintenant pour lancer la production. Les 50 % restants sont réglés en espèces à la livraison.",
    "ادفع 50٪ الآن لبدء الإنتاج، وتُدفع الـ50٪ المتبقية نقدًا عند التسليم.",
  ),
  "Card number for the 50% advance": p(
    "Numéro de carte pour l'acompte de 50 %",
    "رقم البطاقة لدفع 50٪ مقدمًا",
  ),
  "Within 5 working days": p("Sous 5 jours ouvrés", "خلال 5 أيام عمل"),
  "Primple partner network": p("Réseau de partenaires Primple", "شبكة شركاء Primple"),

  // Account gate at checkout
  "An account is required to confirm and pay for your order.": p(
    "Un compte est nécessaire pour confirmer et payer votre commande.",
    "يلزم وجود حساب لتأكيد طلبك ودفعه.",
  ),
  "Sign in to continue": p("Se connecter pour continuer", "سجّل الدخول للمتابعة"),
  "You can review your items now, but you'll need to log in or create an account before the payment step.":
    p(
      "Vous pouvez vérifier vos articles maintenant, mais vous devrez vous connecter ou créer un compte avant l'étape de paiement.",
      "يمكنك مراجعة عناصرك الآن، لكن عليك تسجيل الدخول أو إنشاء حساب قبل خطوة الدفع.",
    ),

  // Catalog search + configurator
  "Add to cart": p("Ajouter au panier", "أضف إلى السلة"),
  "Clear search": p("Effacer la recherche", "مسح البحث"),
  "Clear the search": p("Effacer la recherche", "مسح البحث"),
  "Choose a quantity": p("Choisissez une quantité", "اختر الكمية"),
  "Or enter your own quantity": p("Ou saisissez votre quantité", "أو أدخل كميتك الخاصة"),

  // Account, auth and dashboard
  "Continue with Google": p("Continuer avec Google", "المتابعة باستخدام Google"),
  "Continue with Apple": p("Continuer avec Apple", "المتابعة باستخدام Apple"),
  "Log out": p("Se déconnecter", "تسجيل الخروج"),
  "Last updated": p("Dernière mise à jour", "آخر تحديث"),
  "Welcome back": p("Bon retour", "مرحبًا بعودتك"),
  "Loading your orders…": p("Chargement de vos commandes…", "جارٍ تحميل طلباتك…"),
  "No orders yet": p("Aucune commande pour l'instant", "لا توجد طلبات بعد"),
  "Order placed": p("Commande passée", "تم تسجيل الطلب"),
  "Artwork approved": p("Fichier validé", "تمت الموافقة على الملف"),
  "In production": p("En production", "قيد الإنتاج"),
  "Quality check": p("Contrôle qualité", "مراقبة الجودة"),
  Shipped: p("Expédiée", "تم الشحن"),
  Delivered: p("Livrée", "تم التسليم"),
  "Delivered orders": p("Commandes livrées", "الطلبات المسلَّمة"),
  "Across your Primple account": p("Sur votre compte Primple", "على حسابك في Primple"),
  "Not provided": p("Non renseigné", "غير محدد"),
  "Once you place a print job it appears here with live production tracking.": p(
    "Dès que vous lancez une impression, elle apparaît ici avec le suivi de production en direct.",
    "بمجرد إطلاق طلب طباعة، سيظهر هنا مع تتبع الإنتاج المباشر.",
  ),
  "Start a print job": p("Lancer une impression", "ابدأ طلب طباعة"),
  "Check your inbox to confirm your email address.": p(
    "Consultez votre boîte mail pour confirmer votre adresse e-mail.",
    "تحقق من بريدك الإلكتروني لتأكيد عنوانك.",
  ),
  "or use your email": p("ou utilisez votre e-mail", "أو استخدم بريدك الإلكتروني"),
  "or sign up with email": p("ou inscrivez-vous par e-mail", "أو سجّل عبر البريد الإلكتروني"),
  "Welcome to Primple.": p("Bienvenue chez Primple.", "مرحبًا بك في Primple."),
  "Your printing account, in a minute.": p(
    "Votre compte d'impression, en une minute.",
    "حسابك للطباعة، في دقيقة واحدة.",
  ),
  "Track every job, keep your invoices in one place and reorder past prints in one click.": p(
    "Suivez chaque commande, gardez vos factures au même endroit et recommandez une impression en un clic.",
    "تابع كل طلب، واحتفظ بفواتيرك في مكان واحد، وأعد الطلب بنقرة واحدة.",
  ),
  "Already have an account?": p("Vous avez déjà un compte ?", "هل لديك حساب بالفعل؟"),
  "By creating an account you agree to our": p(
    "En créant un compte, vous acceptez nos",
    "بإنشاء حساب فإنك توافق على",
  ),
  Terms: p("Conditions", "الشروط"),
  and: p("et", "و"),
  "Privacy Policy": p("Politique de confidentialité", "سياسة الخصوصية"),

  // Checkout account gate
  "Sign in to finish your order": p(
    "Connectez-vous pour finaliser votre commande",
    "سجّل الدخول لإتمام طلبك",
  ),
  "Your cart, configuration and prices are saved while you log in or create your account.": p(
    "Votre panier, votre configuration et vos prix sont conservés pendant que vous vous connectez ou créez votre compte.",
    "يتم حفظ سلتك وإعداداتك وأسعارك أثناء تسجيل الدخول أو إنشاء حسابك.",
  ),
  "Log in or create an account": p("Se connecter ou créer un compte", "تسجيل الدخول أو إنشاء حساب"),

  // Contact and lead forms
  "Message sent. We reply within one working day.": p(
    "Message envoyé. Nous répondons sous un jour ouvré.",
    "تم إرسال الرسالة. نرد خلال يوم عمل واحد.",
  ),
  "We couldn't send your message. Please try again.": p(
    "Nous n'avons pas pu envoyer votre message. Veuillez réessayer.",
    "تعذّر إرسال رسالتك. يرجى المحاولة مرة أخرى.",
  ),
  "Thanks — your message is in.": p(
    "Merci — votre message est bien reçu.",
    "شكرًا — وصلتنا رسالتك.",
  ),
  "Our team will get back to you within one working day.": p(
    "Notre équipe vous répond sous un jour ouvré.",
    "سيعاود فريقنا التواصل معك خلال يوم عمل واحد.",
  ),
  "What is it about?": p("De quoi s'agit-il ?", "ما موضوع طلبك؟"),
  "Quote, order, partnership…": p("Devis, commande, partenariat…", "عرض سعر، طلب، شراكة…"),
  Message: p("Message", "الرسالة"),
  "Sending…": p("Envoi…", "جارٍ الإرسال…"),
  "Send message": p("Envoyer le message", "إرسال الرسالة"),
  "Reach us directly": p("Nous joindre directement", "تواصل معنا مباشرة"),
  "Monday to Friday, 9:00–18:00. Urgent jobs? Message us on WhatsApp.": p(
    "Du lundi au vendredi, 9h00–18h00. Commande urgente ? Écrivez-nous sur WhatsApp.",
    "من الاثنين إلى الجمعة، 9:00–18:00. طلب عاجل؟ راسلنا على واتساب.",
  ),
  "Contact us on WhatsApp": p("Nous contacter sur WhatsApp", "تواصل معنا عبر واتساب"),
  "Talk to us": p("Parlons-en", "تحدث إلينا"),
  "Talk to sales": p("Parler à un conseiller", "تحدث إلى فريق المبيعات"),
  "Contact support": p("Contacter le support", "اتصل بالدعم"),
  "Ask a security question": p("Poser une question de sécurité", "اطرح سؤالًا حول الأمان"),
  "Tell us what you print. We'll come back within two working days.": p(
    "Dites-nous ce que vous imprimez. Nous revenons vers vous sous deux jours ouvrés.",
    "أخبرنا بما تطبعه. سنعاود التواصل خلال يومَي عمل.",
  ),
  "Let's get your capacity working.": p(
    "Mettons votre capacité de production au travail.",
    "لنستثمر طاقتك الإنتاجية.",
  ),

  // Blog and designers
  "Want a guide on something specific?": p(
    "Vous voulez un guide sur un sujet précis ?",
    "هل تريد دليلًا حول موضوع معيّن؟",
  ),
  "Tell us the topic and our production team will write it.": p(
    "Dites-nous le sujet et notre équipe de production l'écrira.",
    "أخبرنا بالموضوع وسيكتبه فريق الإنتاج لدينا.",
  ),
  "Suggest a topic": p("Proposer un sujet", "اقترح موضوعًا"),
  "Create a designer account": p("Créer un compte designer", "إنشاء حساب مصمم"),
  "Start your next client job with Primple.": p(
    "Lancez votre prochain projet client avec Primple.",
    "ابدأ مشروع عميلك التالي مع Primple.",
  ),
  "Create your designer account in a minute — no subscription, no minimum volume.": p(
    "Créez votre compte designer en une minute — sans abonnement, sans volume minimum.",
    "أنشئ حساب المصمم الخاص بك في دقيقة — دون اشتراك ودون حد أدنى للكمية.",
  ),
};
