// Affiche le contenu de contenu.js dans la langue choisie. Ne pas modifier pour changer un texte :
// textes fixes -> i18n.js, données de l'événement -> contenu.js.
(function () {
  var C = window.CONTENU || {}, T = window.TEXTES || { fr: {} };
  function $(id) { return document.getElementById(id); }
  // Aucun HTML n'est assemblé par chaînes : la page est construite avec des nœuds, et tout texte venu du
  // Google Sheet ou de contenu.js y entre comme du texte pur. Il ne peut donc jamais devenir du code.
  // n('a', { href: 'x' }, ['texte', autreNoeud]) crée <a href="x">texte…</a>.
  function n(balise, attributs, enfants) {
    var e = document.createElement(balise);
    Object.keys(attributs || {}).forEach(function (k) { e.setAttribute(k, attributs[k]); });
    return remplir(e, enfants);
  }
  // Remplace le contenu d'un élément. Une chaîne devient un nœud de texte ; null et false sont ignorés.
  function remplir(parent, enfants) {
    parent.textContent = '';
    [].concat(enfants === undefined ? [] : enfants).forEach(function (x) {
      if (x !== null && x !== undefined && x !== false) parent.append(typeof x === 'object' ? x : String(x));
    });
    return parent;
  }

  // --- Langue ---
  var LANGUES = Object.keys(T);
  var permises = C.evenement && C.evenement.langues === 'fr' ? ['fr']
    : C.evenement && C.evenement.langues === 'en' ? ['en'] : LANGUES; // null ou "fr-en" : les deux
  function lireLangue() {
    var demandee = new URLSearchParams(location.search).get('lang');
    if (!demandee) { try { demandee = localStorage.getItem('langue'); } catch (e) { demandee = null; } }
    if (!demandee && /^en\b/i.test(navigator.language || '')) demandee = 'en';
    return permises.indexOf(demandee) >= 0 ? demandee : permises[0];
  }
  var langue = lireLangue();

  // t('cle', {n: 2}) : texte fixe dans la langue courante, version française si la traduction manque.
  function t(cle, vars) {
    var s = (T[langue] && Object.hasOwn(T[langue], cle)) ? T[langue][cle] : (T.fr && T.fr[cle]) || cle;
    return vars ? s.replace(/\{(\w+)\}/g, function (m, k) { return Object.hasOwn(vars, k) ? vars[k] : m; }) : s;
  }
  // tr(valeur) : donnée de contenu.js. Une chaîne vaut pour toutes les langues ; {fr, en} est choisi selon la langue.
  function tr(v) {
    if (v && typeof v === 'object') return Object.hasOwn(v, langue) ? v[langue] : null;
    return v === undefined ? null : v;
  }
  // terme('Carabine à air') : nom d'épreuve traduit avec contenu.js > termes, sinon inchangé.
  function terme(s) { var x = (C.termes || {})[s]; return x && x[langue] ? x[langue] : s; }
  function val(v) { v = tr(v); return v === null || v === '' ? n('span', { class: 'todo' }, t('aConfirmer')) : String(v); }
  function heure(d) { return langue === 'fr' ? d.getHours() + ' h ' + String(d.getMinutes()).padStart(2, '0') : d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' }); }

  // --- Lecteur CSV (gère les guillemets et les virgules dans les cellules) ---
  function parseCsv(texte) {
    var lignes = [], ligne = [], cell = '', q = false;
    texte = texte.replace(/^﻿/, '');
    for (var i = 0; i < texte.length; i++) {
      var c = texte[i];
      if (q) {
        if (c === '"' && texte[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { ligne.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && texte[i + 1] === '\n') i++;
        ligne.push(cell); cell = '';
        if (ligne.some(function (x) { return x.trim() !== ''; })) lignes.push(ligne);
        ligne = [];
      } else cell += c;
    }
    ligne.push(cell);
    if (ligne.some(function (x) { return x.trim() !== ''; })) lignes.push(ligne);
    // Bornes : au plus 2000 lignes et 500 caractères par cellule, pour qu'une feuille anormale ne fige pas la page.
    return lignes.slice(0, 2001).map(function (r) { return r.slice(0, 20).map(function (x) { return x.slice(0, 500); }); });
  }
  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase(); }
  // Retourne des lignes [epreuve, athlete, club, province, total] à partir du CSV du Google Sheet.
  function lignesDepuisCsv(texte) {
    var tab = parseCsv(texte);
    if (tab.length < 2) return [];
    var tete = tab[0].map(norm);
    var cols = ['epreuve', 'athlete', 'club', 'province', 'total'].map(function (n) { return tete.indexOf(n); });
    if (cols[0] < 0 || cols[1] < 0 || cols[4] < 0) throw new Error('Colonnes manquantes : il faut au moins Épreuve, Athlète et Total.');
    return tab.slice(1).map(function (r) {
      return cols.map(function (k) { return k < 0 ? '' : (r[k] || '').trim(); });
    }).filter(function (r) { return r[0] && r[1]; });
  }
  // image('047.jpg', 'assets/athletes/') -> { src: adresse à afficher, lien: adresse à ouvrir }, ou null si vide.
  // Accepte un nom de fichier (cherché dans le dossier), un lien https direct, ou un lien de partage Google Drive.
  function image(v, dossier) {
    v = String(v || '').trim();
    if (!v) return null;
    if (!/^https:\/\//i.test(v)) { var f = dossier + v.replace(/^.*[\\/]/, ''); return { src: f, lien: f }; }
    var drive = v.match(/^https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[\w=]+&)*id=)([\w-]{20,})/i);
    // Un lien de partage Drive n'est pas une image : on affiche sa vignette et on ouvre le fichier au clic.
    return drive ? { src: 'https://drive.google.com/thumbnail?id=' + drive[1] + '&sz=w1200', lien: v } : { src: v, lien: v };
  }
  // Retourne { dossard: [images] } à partir du CSV de l'onglet Photos (colonnes Dossard et Photo).
  function photosDepuisCsv(texte) {
    var tab = parseCsv(texte), sortie = {};
    if (tab.length < 2) return sortie;
    var tete = tab[0].map(norm), d = tete.indexOf('dossard'), p = tete.indexOf('photo');
    if (d < 0 || p < 0) throw new Error('Colonnes manquantes : il faut Dossard et Photo.');
    tab.slice(1).forEach(function (r) {
      var n = Number((r[d] || '').trim()), img = image(r[p], 'assets/photos/');
      if (!(r[d] || '').trim() || !Number.isInteger(n) || n < 0 || !img) return;
      (sortie[n] = sortie[n] || []).push(img);
    });
    return sortie;
  }
  // Retourne des cartes à partir du CSV de l'onglet Athlètes. Une ligne sans « oui » dans Consentement est ignorée.
  function cartesDepuisCsv(texte) {
    var tab = parseCsv(texte);
    if (tab.length < 2) return [];
    var tete = tab[0].map(norm);
    function col(n) { return tete.indexOf(n); }
    var k = { nom: col('nom'), dossard: col('dossard'), province: col('province'), epreuve: col('epreuve'), meilleur: col('meilleur'), photo: col('photo'), consentement: col('consentement') };
    if (k.nom < 0 || k.consentement < 0) throw new Error('Colonnes manquantes : il faut au moins Nom et Consentement.');
    return tab.slice(1).map(function (r) {
      function v(i) { return i < 0 ? '' : (r[i] || '').trim(); }
      var img = image(v(k.photo), 'assets/athletes/'), photo = img && img.src;
      return { nom: v(k.nom), dossard: v(k.dossard), province: v(k.province), epreuve: v(k.epreuve), meilleur: v(k.meilleur),
        photo: photo || null, consentement: ['oui', 'yes'].indexOf(norm(v(k.consentement))) >= 0 };
    }).filter(function (c) { return c.nom; });
  }
  function nombre(s) { var n = Number(String(s).replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : -Infinity; }

  // --- Textes fixes (attributs data-i18n de index.html) ---
  function traduirePage() {
    document.documentElement.lang = langue;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) { el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel)); });
    var b = $('lang'), autre = permises.filter(function (l) { return l !== langue; })[0];
    b.hidden = !autre;
    if (autre) { b.textContent = t('langue.bouton'); b.setAttribute('aria-label', t('langue.aria')); b.lang = autre; }
  }

  // --- Contenu de l'événement ---
  var ev = C.evenement || {};
  function afficherContenu() {
    if (C.demo === false && $('demo')) $('demo').remove();
    remplir($('meta'), [val(ev.lieu), ' · ', val(ev.dates)]);
    remplir($('infos-grid'), (C.infos || []).map(function (b) {
      var texte = tr(b.texte);
      return n('div', {}, [n('h3', {}, val(b.titre)), n('p', {}, texte ? texte : [val(null), ' ', tr(b.aide) || ''])]);
    }));
    remplir($('contact'), [t('comite'), ' · ', ev.courriel ? n('a', { href: 'mailto:' + ev.courriel }, ev.courriel) : val(null)]);
    remplir($('partners'), (C.partenaires || []).map(function (p) {
      var nom = tr(p.nom) || '';
      var dedans = p.logo ? n('img', { src: p.logo, alt: nom }) : nom;
      // Un lien de partenaire doit commencer par https:// ; sinon le nom s'affiche sans lien.
      return /^https:\/\//i.test(p.url || '') ? n('a', { href: p.url, rel: 'noopener noreferrer' }, dedans) : n('span', {}, dedans);
    }));
  }
  function contient(q, champs) { q = norm(q); return !q || champs.some(function (x) { return norm(x).indexOf(q) >= 0; }); }
  var listeCartes = C.cartes || [];
  function afficherCartes() {
    var toutes = listeCartes.filter(function (c) { return c.consentement === true; });
    var q = $('cartes-q').value;
    $('cartes-q').hidden = toutes.length < 2;
    var cartes = toutes.filter(function (c) { return contient(q, [c.nom, c.province, c.dossard, terme(c.epreuve)]); });
    remplir($('cards'), !toutes.length ? n('p', { class: 'lead' }, t('cartes.bientot'))
      : !cartes.length ? n('p', { class: 'lead' }, t('cartes.aucune')) : cartes.map(function (c) {
      var pic = c.photo ? n('img', { src: c.photo, alt: '', loading: 'lazy' }) : t('cartes.photo');
      return n('article', { class: 'card' }, [
        n('div', { class: 'pic' }, [pic, n('span', { class: 'num' }, c.dossard)]),
        n('div', { class: 'body' }, [n('h3', {}, c.nom), n('dl', {}, [
          n('dt', {}, t('cartes.province')), n('dd', {}, c.province),
          n('dt', {}, t('cartes.epreuve')), n('dd', {}, terme(c.epreuve)),
          n('dt', {}, t('cartes.meilleur')), n('dd', {}, c.meilleur)])])]);
    }));
  }

  // Lit un CSV publié. Sans cookies (credentials: 'omit'), et jusqu'à 3 essais d'affilée : dans un navigateur,
  // Google redirige de temps en temps une lecture vers sa page de connexion, ce qui la fait échouer (environ 1 sur 10 mesurée).
  function lireCsv(url, essai) {
    essai = essai || 1;
    if (!/^https:\/\/docs\.google\.com\//.test(url) && /^[a-z]+:/i.test(url)) return Promise.reject(new Error('Adresse refusée'));
    return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store', credentials: 'omit' })
      .then(function (rep) { if (!rep.ok) throw new Error('HTTP ' + rep.status); return rep.text(); })
      .catch(function (e) {
        if (essai >= 3) throw e;
        return new Promise(function (ok) { setTimeout(ok, 800); }).then(function () { return lireCsv(url, essai + 1); });
      });
  }
  // --- Résultats ---
  var R = C.resultats || {}, lignes = [], choisie = null, etat = 'exemple', derniereMaj = null;
  function afficherResultats() {
    var epreuves = [];
    lignes.forEach(function (r) { if (epreuves.indexOf(r[0]) < 0) epreuves.push(r[0]); });
    if (epreuves.indexOf(choisie) < 0) choisie = epreuves[0] || null;
    remplir($('chips'), epreuves.map(function (e) {
      var b = n('button', { class: 'chip', type: 'button', 'aria-pressed': String(e === choisie) }, terme(e));
      b.addEventListener('click', function () { choisie = e; afficherResultats(); });
      return b;
    }));
    var q = $('res-q').value;
    var tous = lignes.filter(function (r) { return r[0] === choisie; })
      .sort(function (a, b) { return nombre(b[4]) - nombre(a[4]); })
      .map(function (r, i) { return r.concat(i + 1); });
    var rangs = tous.filter(function (r) { return contient(q, [r[1], r[2], r[3]]); });
    remplir($('rows'), rangs.length ? rangs.map(function (r) {
      return n('tr', {}, [n('td', { class: 'rank' }, r[5]), n('td', {}, r[1]), n('td', { class: 'hide-sm' }, r[2]), n('td', {}, r[3]), n('td', { class: 'score' }, r[4])]);
    }) : n('tr', {}, n('td', { colspan: '5' }, t(tous.length ? 'res.aucun' : 'res.vide'))));
    $('updated').textContent = etat === 'ok' ? t('res.majA', { h: heure(derniereMaj) })
      : etat === 'perdu' ? t('res.perdu', { h: heure(derniereMaj) })
      : etat === 'indispo' ? t('res.indispo') : t('res.exemple');
  }
  function charger() {
    lireCsv(R.urlCsv)
      .then(function (texte) { lignes = lignesDepuisCsv(texte); derniereMaj = new Date(); etat = 'ok'; })
      .catch(function () { etat = derniereMaj ? 'perdu' : 'indispo'; })
      .then(function () {
        afficherResultats();
        var s = Number(R.rafraichirSecondes);
        setTimeout(charger, (Number.isFinite(s) && s >= 15 ? s : 60) * 1000);
      });
  }

  // --- Photos ---
  // Photos écrites dans contenu.js : mêmes règles que celles du Google Sheet.
  var photos = {};
  Object.keys(C.photos || {}).forEach(function (k) {
    var n = Number(k), liste = Array.isArray(C.photos[k]) ? C.photos[k] : [];
    if (Number.isInteger(n)) photos[n] = liste.map(function (x) { return image(x, 'assets/photos/'); }).filter(Boolean);
  });
  function chargerPhotos() {
    lireCsv(C.photosCsv)
      .then(function (texte) { photos = photosDepuisCsv(texte); })
      .catch(function () { setTimeout(chargerPhotos, 30000); });
  }
  if (C.photosCsv) { photos = {}; chargerPhotos(); }
  var bib = $('bib'), err = $('bib-error'), grille = $('photo-grid');
  bib.addEventListener('input', function () { err.textContent = ''; });
  $('photo-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = bib.value.trim();
    remplir(grille, []);
    if (!/^\d{1,4}$/.test(v)) { err.textContent = t('photos.erreur'); return; }
    err.textContent = '';
    if (!Object.keys(photos).length) { err.textContent = t('photos.apres'); return; }
    var liste = photos[Number(v)] || [];
    if (!liste.length) { err.textContent = t('photos.aucune'); return; }
    remplir(grille, liste.map(function (img, i) {
      var externe = /^https:/i.test(img.lien);
      var attributs = externe ? { href: img.lien, target: '_blank', rel: 'noopener noreferrer' } : { href: img.lien, download: '' };
      return n('a', attributs, [n('img', { src: img.src, alt: '', loading: 'lazy' }), n('span', {}, t('photos.lien', { n: i + 1 }))]);
    }));
  });

  // --- Changement de langue : tout est réaffiché, sans recharger la page ---
  $('res-q').addEventListener('input', afficherResultats);
  $('cartes-q').addEventListener('input', afficherCartes);

  // --- Repère dans le menu : la section visible est soulignée ---
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (vus) {
      vus.forEach(function (v) {
        if (!v.isIntersecting) return;
        document.querySelectorAll('nav a').forEach(function (a) {
          if (a.getAttribute('href') === '#' + v.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (sec) { io.observe(sec); });
  }

  // --- Compte à rebours : caché si la date manque, est invalide ou est passée ---
  function compteARebours() {
    if (!$('compte')) return; // ancienne page encore en cache
    var reste = Date.parse(ev.debut) - Date.now();
    if (!Number.isFinite(reste) || reste <= 0) { $('compte').hidden = true; return; }
    var min = Math.floor(reste / 60000);
    $('c-j').textContent = Math.floor(min / 1440);
    $('c-h').textContent = String(Math.floor(min / 60) % 24).padStart(2, '0');
    $('c-m').textContent = String(min % 60).padStart(2, '0');
    $('compte').hidden = false;
    setTimeout(compteARebours, 30000);
  }
  compteARebours();

  function toutAfficher() { traduirePage(); afficherContenu(); afficherCartes(); afficherResultats(); err.textContent = ''; remplir(grille, []); }
  $('lang').addEventListener('click', function () {
    langue = permises.filter(function (l) { return l !== langue; })[0] || langue;
    try { localStorage.setItem('langue', langue); } catch (e) { /* stockage bloqué : la langue ne sera pas retenue */ }
    try { var url = new URL(location.href); url.searchParams.set('lang', langue); history.replaceState(null, '', url); } catch (e) { /* file:// sur certains navigateurs */ }
    toutAfficher();
  });

  // Cartes lues dans le Google Sheet si cartesCsv est rempli. En cas d'échec, aucune carte n'est affichée.
  function chargerCartes() {
    lireCsv(C.cartesCsv)
      .then(function (texte) { listeCartes = cartesDepuisCsv(texte); afficherCartes(); })
      // Google échoue parfois une première fois : nouvel essai 30 s plus tard.
      .catch(function () { listeCartes = []; afficherCartes(); setTimeout(chargerCartes, 30000); });
  }
  if (C.cartesCsv) { listeCartes = []; chargerCartes(); }
  if (R.urlCsv) { traduirePage(); afficherContenu(); afficherCartes(); charger(); }
  else { lignes = R.exemple || []; toutAfficher(); }

  window.SITE = { parseCsv: parseCsv, lignesDepuisCsv: lignesDepuisCsv, cartesDepuisCsv: cartesDepuisCsv, photosDepuisCsv: photosDepuisCsv, image: image, t: t };
})();
