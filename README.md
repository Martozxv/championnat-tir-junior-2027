# Championnat canadien junior de tir 2027 (prototype)

Site d'une page : informations, résultats en direct, photos et cartes des athlètes. Français et anglais.
Les données affichées sont fictives tant que `demo: true` dans `contenu.js`.

## Modifier le contenu
- `contenu.js` : dates, lieu, blocs d'information, liens des Google Sheets, partenaires.
- `i18n.js` : textes fixes de la page, en français et en anglais.
- `site.js` et `index.html` : le code. Pas besoin d'y toucher pour changer un texte.

## Tester
- Ouvrir `index.html` dans un navigateur.
- `node tests/csv.test.js` doit afficher « CSV OK », « CARTES OK » et « I18N OK ».

## Sécurité
- Le site est statique : pas de serveur, pas de connexion, pas de base de données, aucun secret dans le code.
- Une politique de sécurité (CSP, dans `index.html`) n'autorise que les scripts et les styles du site. Ne pas ajouter de `style="…"`, de `<script>` en ligne ni de `onclick` : ils seraient bloqués.
- Tout texte venu du Google Sheet passe par `esc()` dans `site.js` avant d'être affiché. Les liens d'images doivent commencer par `https://`.
- Les onglets publiés du Google Sheet sont lisibles par tous : n'y mettre que ce qui doit paraître sur le site.
- Essai de sécurité : générer `tests/hostile.html` (voir `tests/contenu-hostile.js`) et vérifier qu'aucun code des feuilles `tests/hostile-*.csv` ne s'exécute.
