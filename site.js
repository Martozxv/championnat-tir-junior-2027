// Affiche le contenu de contenu.js dans la langue choisie. Ne pas modifier pour changer un texte :
// textes fixes -> i18n.js, données de l'événement -> contenu.js.
(function () {
  var C = window.CONTENU || {}, T = window.TEXTES || { fr: {} };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

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
  function val(v) { v = tr(v); return v === null || v === '' ? '<span class="todo">' + esc(t('aConfirmer')) + '</span>' : esc(v); }
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
    return lignes;
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
      var photo = v(k.photo);
      // Un nom de fichier seul est cherché dans assets/athletes/ ; un lien https est pris tel quel.
      if (photo && !/^https:\/\//i.test(photo)) photo = 'assets/athletes/' + photo.replace(/^.*[\\/]/, '');
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
    $('meta').innerHTML = val(ev.lieu) + ' · ' + val(ev.dates);
    $('infos-grid').innerHTML = (C.infos || []).map(function (b) {
      var texte = tr(b.texte);
      return '<div><h3>' + val(b.titre) + '</h3><p>' + (texte ? esc(texte) : val(null) + ' ' + esc(tr(b.aide) || '')) + '</p></div>';
    }).join('');
    $('contact').innerHTML = esc(t('comite')) + ' · ' + (ev.courriel ? '<a href="mailto:' + esc(ev.courriel) + '">' + esc(ev.courriel) + '</a>' : val(null));
    $('partners').innerHTML = (C.partenaires || []).map(function (p) {
      var nom = tr(p.nom) || '';
      var dedans = p.logo ? '<img src="' + esc(p.logo) + '" alt="' + esc(nom) + '">' : esc(nom);
      return p.url ? '<a href="' + esc(p.url) + '" rel="noopener">' + dedans + '</a>' : '<span>' + dedans + '</span>';
    }).join('');
  }
  function contient(q, champs) { q = norm(q); return !q || champs.some(function (x) { return norm(x).indexOf(q) >= 0; }); }
  var listeCartes = C.cartes || [];
  function afficherCartes() {
    var toutes = listeCartes.filter(function (c) { return c.consentement === true; });
    var q = $('cartes-q').value;
    $('cartes-q').hidden = toutes.length < 2;
    var cartes = toutes.filter(function (c) { return contient(q, [c.nom, c.province, c.dossard, terme(c.epreuve)]); });
    $('cards').innerHTML = !toutes.length ? '<p class="lead">' + esc(t('cartes.bientot')) + '</p>'
      : !cartes.length ? '<p class="lead">' + esc(t('cartes.aucune')) + '</p>' : cartes.map(function (c) {
      var pic = c.photo ? ' style="background:url(\'' + esc(encodeURI(c.photo)) + '\') center/cover"' : '';
      return '<article class="card"><div class="pic"' + pic + '>' + (c.photo ? '' : esc(t('cartes.photo'))) + '<span class="num">' + esc(c.dossard) + '</span></div>' +
        '<div class="body"><h3>' + esc(c.nom) + '</h3><dl><dt>' + esc(t('cartes.province')) + '</dt><dd>' + esc(c.province) + '</dd><dt>' + esc(t('cartes.epreuve')) + '</dt><dd>' + esc(terme(c.epreuve)) + '</dd><dt>' + esc(t('cartes.meilleur')) + '</dt><dd>' + esc(c.meilleur) + '</dd></dl></div></article>';
    }).join('');
  }

  // --- Résultats ---
  var R = C.resultats || {}, lignes = [], choisie = null, etat = 'exemple', derniereMaj = null;
  function afficherResultats() {
    var epreuves = [];
    lignes.forEach(function (r) { if (epreuves.indexOf(r[0]) < 0) epreuves.push(r[0]); });
    if (epreuves.indexOf(choisie) < 0) choisie = epreuves[0] || null;
    $('chips').innerHTML = epreuves.map(function (e) {
      return '<button class="chip" type="button" aria-pressed="' + (e === choisie) + '">' + esc(terme(e)) + '</button>';
    }).join('');
    Array.prototype.forEach.call($('chips').children, function (b, i) {
      b.addEventListener('click', function () { choisie = epreuves[i]; afficherResultats(); });
    });
    var q = $('res-q').value;
    var tous = lignes.filter(function (r) { return r[0] === choisie; })
      .sort(function (a, b) { return nombre(b[4]) - nombre(a[4]); })
      .map(function (r, i) { return r.concat(i + 1); });
    var rangs = tous.filter(function (r) { return contient(q, [r[1], r[2], r[3]]); });
    $('rows').innerHTML = rangs.length ? rangs.map(function (r) {
      return '<tr><td class="rank">' + r[5] + '</td><td>' + esc(r[1]) + '</td><td class="hide-sm">' + esc(r[2]) + '</td><td>' + esc(r[3]) + '</td><td class="score">' + esc(r[4]) + '</td></tr>';
    }).join('') : '<tr><td colspan="5">' + esc(t(tous.length ? 'res.aucun' : 'res.vide')) + '</td></tr>';
    $('updated').textContent = etat === 'ok' ? t('res.majA', { h: heure(derniereMaj) })
      : etat === 'perdu' ? t('res.perdu', { h: heure(derniereMaj) })
      : etat === 'indispo' ? t('res.indispo') : t('res.exemple');
  }
  function charger() {
    fetch(R.urlCsv + (R.urlCsv.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store' })
      .then(function (rep) { if (!rep.ok) throw new Error('HTTP ' + rep.status); return rep.text(); })
      .then(function (texte) { lignes = lignesDepuisCsv(texte); derniereMaj = new Date(); etat = 'ok'; })
      .catch(function () { etat = derniereMaj ? 'perdu' : 'indispo'; })
      .then(function () {
        afficherResultats();
        var s = Number(R.rafraichirSecondes);
        setTimeout(charger, (Number.isFinite(s) && s >= 15 ? s : 60) * 1000);
      });
  }

  // --- Photos ---
  var photos = C.photos || {}, bib = $('bib'), err = $('bib-error'), grille = $('photo-grid');
  bib.addEventListener('input', function () { err.textContent = ''; });
  $('photo-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = bib.value.trim();
    grille.innerHTML = '';
    if (!/^\d{1,4}$/.test(v)) { err.textContent = t('photos.erreur'); return; }
    err.textContent = '';
    if (!Object.keys(photos).length) { err.textContent = t('photos.apres'); return; }
    var cle = Object.keys(photos).filter(function (k) { return Number(k) === Number(v); })[0];
    var liste = cle && Array.isArray(photos[cle]) ? photos[cle] : [];
    if (!liste.length) { err.textContent = t('photos.aucune'); return; }
    grille.innerHTML = liste.map(function (src, i) {
      return '<a href="' + esc(src) + '" download style="background:url(\'' + esc(encodeURI(src)) + '\') center/cover">' + esc(t('photos.lien', { n: i + 1 })) + '</a>';
    }).join('');
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

  function toutAfficher() { traduirePage(); afficherContenu(); afficherCartes(); afficherResultats(); err.textContent = ''; grille.innerHTML = ''; }
  $('lang').addEventListener('click', function () {
    langue = permises.filter(function (l) { return l !== langue; })[0] || langue;
    try { localStorage.setItem('langue', langue); } catch (e) { /* stockage bloqué : la langue ne sera pas retenue */ }
    try { var url = new URL(location.href); url.searchParams.set('lang', langue); history.replaceState(null, '', url); } catch (e) { /* file:// sur certains navigateurs */ }
    toutAfficher();
  });

  // Cartes lues dans le Google Sheet si cartesCsv est rempli. En cas d'échec, aucune carte n'est affichée.
  function chargerCartes() {
    fetch(C.cartesCsv, { cache: 'no-store' })
      .then(function (rep) { if (!rep.ok) throw new Error('HTTP ' + rep.status); return rep.text(); })
      .then(function (texte) { listeCartes = cartesDepuisCsv(texte); afficherCartes(); })
      // Google échoue parfois une première fois : nouvel essai 30 s plus tard.
      .catch(function () { listeCartes = []; afficherCartes(); setTimeout(chargerCartes, 30000); });
  }
  if (C.cartesCsv) { listeCartes = []; chargerCartes(); }
  if (R.urlCsv) { traduirePage(); afficherContenu(); afficherCartes(); charger(); }
  else { lignes = R.exemple || []; toutAfficher(); }

  window.SITE = { parseCsv: parseCsv, lignesDepuisCsv: lignesDepuisCsv, cartesDepuisCsv: cartesDepuisCsv, t: t };
})();
