// Contenu d'essai : des feuilles remplies de code malveillant. Rien ne doit s'exécuter.
window.CONTENU = {
  demo: true,
  evenement: { nom: "<script>window.__xss=20</script>", dates: "<img src=x onerror=window.__xss=21>", lieu: "\"><svg onload=window.__xss=22>", debut: null, courriel: null, langues: null },
  infos: [{ titre: "<b onclick=window.__xss=23>T</b>", texte: "<script>window.__xss=24</script>", aide: "" }],
  termes: {},
  resultats: { urlCsv: "hostile-resultats.csv", rafraichirSecondes: 60, exemple: [] },
  photosCsv: "hostile-photos.csv",
  photos: {},
  cartesCsv: "hostile-athletes.csv",
  cartes: [],
  partenaires: []
};
