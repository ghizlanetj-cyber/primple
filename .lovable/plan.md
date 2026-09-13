# Corriger les derniers points confirmés de l’audit

## Résultat attendu
- Le menu mobile s’ouvre comme un vrai panneau accessible, contient tous les liens principaux et les actions adaptées à l’état de connexion.
- Les pages de connexion et de création de compte ne montrent jamais un formulaire incohérent pendant la vérification de session.
- Une quantité personnalisée invalide ne modifie ni le prix ni le panier et affiche une erreur traduite.
- Chaque lien de facture ouvre uniquement la facture de la commande réelle du client connecté, avec un état explicite lorsque les données nécessaires manquent.
- Tous les textes concernés décrivent la même règle : acompte de 50 % confirmé manuellement, production après confirmation, solde de 50 % en espèces à la livraison, aucun paiement encaissé sur le site.
- L’adresse e-mail existante reste inchangée mais est alimentée depuis une seule source partout où elle apparaît.

## Modifications

### 1. Navigation mobile et état de connexion
- Remplacer le panneau mobile artisanal par le composant de panneau accessible déjà présent dans le projet afin d’obtenir automatiquement : focus piégé, retour du focus au bouton d’ouverture, fermeture par Échap et clic extérieur.
- Afficher dans le panneau tous les liens principaux : Services, Produits, Pourquoi Primple, Plateforme et Contact.
- Visiteur déconnecté : afficher uniquement Connexion et Créer un compte.
- Client connecté : afficher uniquement Tableau de bord et Se déconnecter.
- Corriger aussi l’en-tête de bureau, qui affiche actuellement Connexion même lorsqu’un client est connecté.
- Conserver le panier et le sélecteur FR/EN/العربية, avec libellés traduits et sens RTL.

### 2. Pages Connexion et Création de compte
- Utiliser l’état de chargement de l’authentification pour ne pas afficher brièvement un formulaire avant une redirection.
- Rediriger un client déjà connecté vers la destination sûre demandée ou son tableau de bord.
- Faire correspondre chaque URL à son contenu : `/login` reste la connexion et `/signup` reste la création de compte, avec des liens explicites entre les deux.
- Ne modifier ni Google, ni Apple, ni les réglages OAuth existants.

### 3. Validation des quantités
- Valider la saisie brute sans la nettoyer ou la convertir silencieusement : entier strictement positif, sans signe, décimale, espace parasite ou texte.
- Appliquer les limites propres au produit, définies par sa plus petite et sa plus grande quantité disponibles.
- Afficher sous le champ une erreur FR/EN/AR indiquant la plage autorisée, relier cette erreur au champ et bloquer « Ajouter au panier » tant que la valeur est invalide.
- Appliquer la même règle aux changements de quantité dans le panier en conservant la dernière quantité valide au lieu de forcer la valeur à 1.

### 4. Factures réelles et autorisées
- Conserver la page de facture protégée et la lecture limitée aux commandes du client connecté.
- Faire pointer chaque action de facture vers la référence réelle sélectionnée et distinguer clairement l’ouverture de la facture de son impression/téléchargement.
- Construire la facture uniquement avec les articles, montants, coordonnées, statut et dates déjà enregistrés sur la commande.
- Si une commande est absente ou si ses données indispensables sont incomplètes, afficher un message FR/EN/AR fidèle qui nomme le champ manquant, sans valeur inventée.
- Vérifier le rendu imprimable/téléchargeable sur ordinateur et mobile.

### 5. Règle de paiement uniforme
- Corriger uniquement les pages demandées : produits, panier, commande, aide, à propos, entreprise et pages légales.
- Remplacer les formulations contradictoires, notamment « pay when you’re happy with the setup », par la règle actuelle exacte.
- Mettre à jour les variantes FR/EN/AR utilisées par ces pages sans modifier le calcul 50/50 ni le parcours WhatsApp existant.

### 6. Adresse e-mail centralisée
- Remplacer les adresses écrites directement dans les pages légales et métadonnées concernées par la source de contact existante.
- Garder `contact@primpel.com` inchangée faute de source confirmant une autre adresse.
- Signaler dans le bilan que « primpel.com » diffère de la marque « Primple » et attend confirmation avant tout changement.

## Vérifications
- Tester les états connecté/déconnecté du menu et des pages d’authentification, y compris clavier et Échap.
- Tester les quantités valides et invalides : 0, négatif, décimal, texte, sous le minimum et au-dessus du maximum.
- Ouvrir une facture réelle du compte connecté et tester une référence absente ou inaccessible.
- Contrôler les pages touchées en FR, EN et arabe/RTL.
- Vérifier l’affichage à 390 px, 430 px, tablette et bureau, puis lancer les tests et la vérification des types.
- Ne publier ni ne déployer, et ne modifier aucune donnée client, aucun secret, aucun paiement ni aucun réglage OAuth.
