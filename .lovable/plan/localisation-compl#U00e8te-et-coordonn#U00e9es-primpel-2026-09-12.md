# Localisation complète et coordonnées Primpel

## Objectif
Conserver l’interface et les fonctionnalités actuelles tout en rendant toute l’application disponible en anglais, français et arabe, avec une vraie présentation RTL en arabe.

## Modifications prévues

1. **Centraliser les contenus traduits**
   - Étendre le système i18n existant avec des traductions professionnelles EN/FR/AR pour chaque texte visible : navigation, accueil, catalogue, fiches produits, configurateur, panier, paiement, tableau de bord, connexion, plateforme, tarifs, partenaires, formulaires, confirmations, erreurs, notifications, FAQ, textes alternatifs et libellés d’accessibilité.
   - Localiser les noms, descriptions, options et FAQ des produits sans dupliquer les pages.
   - Adapter nombres, dates et montants à la langue active sans provoquer d’écart entre le rendu initial et l’affichage navigateur.

2. **Renforcer le changement de langue**
   - Afficher clairement Français, العربية et la langue anglaise existante dans le sélecteur, sur ordinateur et mobile.
   - Conserver la préférence entre les pages et les visites.
   - Mettre à jour `lang` et `dir` sur la page, avec RTL global pour l’arabe.

3. **Adapter l’interface arabe sans refaire le design**
   - Utiliser les propriétés logiques RTL pour les alignements et espacements nécessaires.
   - Inverser uniquement les flèches et éléments directionnels concernés.
   - Vérifier menus, cartes, formulaires, tableaux, panier et paiement sur mobile et ordinateur.

4. **Centraliser les coordonnées**
   - Créer une source unique contenant : `Contact@primpel.com`, `+2126-31577677`, `Casablanca, Maroc` et le lien WhatsApp correspondant.
   - Remplacer toutes les anciennes occurrences, ainsi que les liens `mailto:`, `tel:` et WhatsApp.
   - Ajouter un bouton WhatsApp fixe en bas à droite, visible pendant le défilement et correctement positionné en RTL.

5. **SEO localisé**
   - Localiser titres et descriptions selon la langue active lorsque possible avec l’architecture actuelle.
   - Maintenir les attributs `lang="fr" dir="ltr"` et `lang="ar" dir="rtl"`.
   - Localiser les textes alternatifs et données structurées liées aux produits.

6. **Vérification**
   - Rechercher les textes anglais résiduels dans les parcours français et arabe.
   - Tester navigation, catalogue, configurateur, panier, paiement et tableau de bord en FR et AR.
   - Vérifier les écrans ordinateur et mobile, les débordements, les erreurs console et la compilation.
   - Vérifier qu’aucune ancienne coordonnée ne subsiste.

## Tarifs
Les prix actuels resteront inchangés tant qu’aucune nouvelle grille tarifaire exacte n’est fournie. Aucun tarif ne sera inventé.

## Détails techniques
- Une seule application et une seule source de contenu, avec clés i18n et données traduites par identifiant stable.
- Aucun changement volontaire des couleurs, polices, images, animations ou structure visuelle.
- Correction du formatage localisé actuel qui provoque une différence de rendu entre serveur et navigateur.
