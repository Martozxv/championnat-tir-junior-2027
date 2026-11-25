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
