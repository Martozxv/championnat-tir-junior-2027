// CONTENU DU SITE : c'est le seul fichier à modifier quand le client répond.
// Règle : une valeur inconnue reste null. La page affiche alors « [À confirmer] ».
// Langues : un texte simple vaut pour toutes les langues. Pour le traduire, écrire { fr: "…", en: "…" }.
// Une langue absente de { fr, en } s'affiche comme « [À confirmer] » dans cette langue.
// Voir decouverte-client/correspondance.md pour savoir quelle question remplit quel champ.

window.CONTENU = {
  // true = bande « Prototype : données fictives » en haut. Mettre false seulement quand tout est réel.
  demo: true,

  evenement: {
    nom: { fr: "Championnat canadien junior de tir", en: "Canadian Junior Shooting Championships" },
    sigle: "CCJT 2027",
    dates: { fr: "25 au 28 mars 2027", en: "March 25–28, 2027" }, // confirmé par le client (Q3)
    lieu: null,           // Q3, ex. "Club X, Québec"
    // Début du compte à rebours de l'accueil. L'heure de la première épreuve est à confirmer : minuit en attendant.
    // Format : année-mois-jourTheure:minute:00-04:00 (heure de Québec en mars). null = pas de compte à rebours.
    debut: "2027-03-25T00:00:00-04:00",
    courriel: null,       // courriel public du comité
    langues: null         // Q2 : "fr" ou "en" = une seule langue, bouton caché. null ou "fr-en" = bouton FR/EN.
  },

  // Q4 : le client a coché Horaire, Hébergement, Règlements et Contacts (pas Lieu ni Inscription).
  // texte null = « [À confirmer] ». Retirer une ligne si le client n'en veut pas.
  infos: [
    { titre: { fr: "Horaire", en: "Schedule" }, texte: null, aide: { fr: "Épreuves par catégorie, jour par jour.", en: "Events by category, day by day." } },
    { titre: { fr: "Hébergement", en: "Accommodation" }, texte: null, aide: { fr: "Hôtels partenaires et repas.", en: "Partner hotels and meals." } },
    { titre: { fr: "Règlements", en: "Rules" }, texte: null, aide: { fr: "Catégories, disciplines et équipement.", en: "Categories, disciplines and equipment." } },
    { titre: { fr: "Contacts", en: "Contacts" }, texte: null, aide: { fr: "Comité organisateur.", en: "Organizing committee." } }
  ],

  // Noms d'épreuves tels qu'écrits dans le Google Sheet et les cartes -> traduction affichée.
  termes: {
    "Carabine à air": { en: "Air rifle" },
    "Pistolet à air": { en: "Air pistol" }
  },

  resultats: {
    // Q8 : lien CSV du Google Sheet (Fichier > Partager > Publier sur le Web > feuille > CSV).
    // Colonnes attendues sur la 1re ligne : Épreuve, Athlète, Club, Province, Total
    urlCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGMdOzxPoHOnswoEg5BPBAbXfNQe6PRRpFlmfJS5pCmQlpDt09MBBPHtpws22Gl89ANoskDnjLQi4M/pub?gid=0&single=true&output=csv",
    rafraichirSecondes: 60, // Q7 : à ajuster selon la fréquence des mises à jour
    // Utilisé seulement tant que urlCsv est null.
    exemple: [
      ["Carabine à air", "Athlète A", "Club Exemple 1", "QC", "612,4"],
      ["Carabine à air", "Athlète B", "Club Exemple 2", "ON", "609,8"],
      ["Carabine à air", "Athlète C", "Club Exemple 3", "AB", "607,1"],
      ["Pistolet à air", "Athlète F", "Club Exemple 6", "ON", "571"],
      ["Pistolet à air", "Athlète G", "Club Exemple 2", "QC", "566"]
    ]
  },

  // Q10 à Q13 : numéro de dossard -> liste de fichiers dans assets/photos/.
  // Vide = « Les photos seront publiées après le championnat. »
  // shortcut: liste écrite à la main, à générer par un script si le client a plus de 200 photos.
  photos: {
    // "47": ["assets/photos/47-01.jpg", "assets/photos/47-02.jpg"]
  },

  // Q17 : le client ajoute les cartes lui-même dans l'onglet « Athlètes » du Google Sheet.
  // Coller ici le lien CSV publié de cet onglet. Colonnes : Nom, Dossard, Province, Épreuve, Meilleur, Photo, Consentement
  // Une carte s'affiche SEULEMENT si la colonne Consentement contient « oui » (autorisation parentale reçue et conservée).
  // Photo : nom d'un fichier déposé dans assets/athletes/ (ex. 047.jpg) ou lien https direct vers l'image. Vide = case grise.
  cartesCsv: null,

  // Cartes d'exemple, utilisées seulement tant que cartesCsv est null.
  cartes: [
    { nom: "Athlète A", dossard: "047", province: "QC", epreuve: "Carabine à air", meilleur: "612,4", photo: null, consentement: true },
    { nom: "Athlète B", dossard: "112", province: "ON", epreuve: "Carabine à air", meilleur: "609,8", photo: null, consentement: true },
    { nom: "Athlète F", dossard: "023", province: "ON", epreuve: "Pistolet à air", meilleur: "571",   photo: null, consentement: true }
  ],

  // Q19, Q20 : logo = fichier dans assets/logos/, ou null pour afficher le nom.
  // N'ajouter un logo que si la permission de l'utiliser est obtenue.
  partenaires: [
    { nom: { fr: "Fédération (à confirmer)", en: "Federation (to be confirmed)" }, logo: null, url: null },
    { nom: { fr: "Commanditaire", en: "Sponsor" }, logo: null, url: null }
  ]
};
