# Passe design et contenu Primple

## Résultat attendu
- Réorganiser l’en-tête partagé selon la hiérarchie demandée, avec une bulle vitrée plus compacte sur ordinateur, tablette et mobile, sans masquer les titres.
- Ajouter une recherche locale accessible couvrant produits, services, FAQ et libellés du blog, avec résultats utiles, navigation clavier et libellés FR/EN/AR.
- Afficher et calculer des frais de livraison fixes de 30 DH partout où l’interface indiquait auparavant une livraison incluse, sans modifier les prix produits ni la règle de paiement.
- Conserver une seule action de facture localisée, qui ouvre le comportement de téléchargement/impression déjà sécurisé.
- Échanger uniquement les images associées aux cartes de visite et aux étiquettes, sans modifier leurs liens ni leurs prix.
- Remplacer les statistiques marketing non vérifiées par une section qualitative « Pourquoi les marques choisissent Primple » avec quatre bénéfices concis et localisés.

## Vérification
- Contrôler l’en-tête à 390 px, tablette et ordinateur, y compris menu mobile et absence de chevauchement.
- Tester la recherche au clavier et à la souris en français, anglais et arabe, avec RTL.
- Vérifier le panier/configurateur, la facture, l’échange des deux images et la nouvelle section d’accueil.
- Exécuter les tests ciblés et la vérification TypeScript. Ne rien publier ni déployer.

## Détails techniques
- Réutiliser les composants, routes, données publiques et assets existants uniquement.
- La recherche restera entièrement côté navigateur, sans nouveau service ni modification de données.
- Le forfait livraison sera centralisé pour éviter les divergences entre calculs et textes.
