# Paiement YouCanPay à la place du checkout Shopify

Objectif : garder Shopify comme catalogue produits (fiches, images, prix, variantes), mais encaisser les paiements par carte via YouCanPay en mode sandbox, en dirhams, sans jamais quitter Primple pour un checkout Shopify.

## Ce que verra le client

1. Il ajoute des articles au panier depuis la Boutique (inchangé).
2. Dans le panier, le bouton « Payer avec Shopify » devient « Payer par carte ».
3. Une page de paiement Primple affiche le récapitulatif et le formulaire carte YouCanPay (sandbox : cartes de test uniquement, aucun argent réel).
4. Après paiement, il arrive sur une page de confirmation avec le numéro de commande, puis reçoit son résumé dans son tableau de bord.
5. En cas d'échec ou d'abandon, il revient au panier avec un message clair et son panier intact.

Le tout en français, anglais et arabe (RTL).

## Sécurité des clés

- La clé publique sandbox peut vivre dans le code (elle est prévue pour le navigateur).
- La clé privée doit être enregistrée comme secret côté serveur. Je l'ajouterai via le formulaire sécurisé de secrets ; ne la recolle pas dans le chat. Pour la sécurité, considère la clé privée collée ici comme exposée : à régénérer côté YouCanPay avant tout passage en production.
- Aucune donnée de carte ne transite par Primple ni n'est stockée : le formulaire est hébergé/tokenisé par YouCanPay.

## Détails techniques

**Base de données** — nouvelle table `public.shop_orders` :
`id`, `user_id` (nullable pour invité), `reference`, `items` (jsonb : titre, variante, quantité, prix), `amount_cents`, `currency` (MAD), `status` (`pending` / `paid` / `failed`), `youcanpay_token_id`, `youcanpay_transaction_id`, `customer_email`, `created_at`, `paid_at`.
RLS : lecture uniquement par le propriétaire (`auth.uid() = user_id`), écriture réservée au rôle service. GRANT explicites. Aucune écriture de statut depuis le navigateur.

**Serveur**
- `src/lib/youcanpay.functions.ts` — `createPaymentToken` : recalcule le montant côté serveur à partir des prix Shopify (jamais le montant envoyé par le client), crée la commande `pending`, appelle `POST https://youcanpay.com/api/tokenize` avec la clé privée lue dans le handler, renvoie le `token.id` et la référence.
- `src/routes/api/public/youcanpay-webhook.ts` — reçoit la notification de paiement, vérifie la signature/clé partagée YouCanPay, passe la commande à `paid` ou `failed`. Source de vérité du statut.
- `src/lib/youcanpay.ts` — clé publique, constantes sandbox, helpers de formatage.

**Frontend**
- `src/routes/shop/checkout.tsx` — récapitulatif + formulaire YouCanPay (SDK chargé via `<script>` dans `__root.tsx`, monté après hydratation), URLs de retour `success` / `error` vers Primple.
- `src/routes/shop/confirmation.tsx` — statut lu depuis la commande en base (pas depuis l'URL).
- `CartDrawer.tsx` / `src/store/shopify-cart.ts` — `getCheckoutUrl` et la création de panier Shopify sont retirées ; le panier local reste, vidé seulement après confirmation serveur.
- Traductions FR/EN/AR ajoutées dans `commercial-translations.ts`.

**Conservé** : catalogue, fiches produit, panier, images, prix Shopify ; le flux d'impression sur devis via WhatsApp (50/50) reste inchangé et séparé.

## Vérification

Commande test sandbox de bout en bout au navigateur (carte de test, succès et échec), contrôle du statut en base, vérification mobile/RTL, `tsgo --noEmit` et tests. Aucune publication ni déploiement.
