// Test du lecteur CSV et des traductions de site.js, sans navigateur : node tests/csv.test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const el = () => ({ innerHTML: '', textContent: '', children: [], dataset: {}, value: '', addEventListener() {}, setAttribute() {}, remove() {} });
global.window = {};
eval(fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8'));
global.document = { getElementById: el, querySelectorAll: () => [], documentElement: {} };
global.location = { search: '?lang=en', href: 'http://x/' };
global.localStorage = { getItem: () => null, setItem() {} };
window.CONTENU = { resultats: {} };
eval(fs.readFileSync(path.join(__dirname, '..', 'site.js'), 'utf8'));
const S = window.SITE;

const csv = '﻿Épreuve,Athlète,Club,Province,Total\r\n"Carabine à air","Dupont, Léa",Club X,QC,"612,4"\r\nCarabine à air,Martin,Club Y,ON,609.8\r\n,,,,\r\nPistolet à air,"Il dit ""go""",Club Z,AB,571\r\n';
const r = S.lignesDepuisCsv(csv);
assert.strictEqual(r.length, 3);
assert.deepStrictEqual(r[0], ['Carabine à air', 'Dupont, Léa', 'Club X', 'QC', '612,4']);
assert.strictEqual(r[2][1], 'Il dit "go"');
assert.throws(() => S.lignesDepuisCsv('Nom,Score\nA,1'));
assert.deepStrictEqual(S.lignesDepuisCsv('Epreuve,Athlete,Total\nC,A,1'), [['C', 'A', '', '', '1']]);
console.log('CSV OK');

// Cartes : consentement obligatoire, photo en fichier local ou en lien https, lignes sans nom ignorées.
const cartes = S.cartesDepuisCsv('Nom,Dossard,Province,Épreuve,Meilleur,Photo,Consentement\nLéa,047,QC,Carabine à air,"612,4",047.jpg,Oui\nMax,112,ON,Pistolet à air,571,https://exemple.ca/max.jpg,non\nZoé,5,AB,Carabine à air,600,,\n,,,,,,oui\nAnn,9,BC,Carabine à air,590,../../secret.jpg,YES\n');
assert.strictEqual(cartes.length, 4);
assert.deepStrictEqual(cartes.map(c => c.consentement), [true, false, false, true]);
assert.strictEqual(cartes[0].photo, 'assets/athletes/047.jpg');
assert.strictEqual(cartes[1].photo, 'https://exemple.ca/max.jpg');
assert.strictEqual(cartes[2].photo, null);
assert.strictEqual(cartes[3].photo, 'assets/athletes/secret.jpg');
assert.throws(() => S.cartesDepuisCsv('Nom,Dossard\nA,1'));
console.log('CARTES OK');

// Photos : regroupées par dossard (047 = 47), lien Drive converti en vignette, lignes incomplètes ignorées.
const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
const ph = S.photosDepuisCsv('Dossard,Photo\n047,47-01.jpg\n47,https://drive.google.com/file/d/' + ID + '/view?usp=sharing\n112,https://exemple.ca/a.jpg\n,orphelin.jpg\nabc,x.jpg\n9,\n');
assert.deepStrictEqual(Object.keys(ph), ['47', '112']);
assert.strictEqual(ph[47].length, 2);
assert.deepStrictEqual(ph[47][0], { src: 'assets/photos/47-01.jpg', lien: 'assets/photos/47-01.jpg' });
assert.strictEqual(ph[47][1].src, 'https://drive.google.com/thumbnail?id=' + ID + '&sz=w1200');
assert.ok(ph[47][1].lien.includes('/file/d/' + ID));
assert.strictEqual(ph[112][0].src, 'https://exemple.ca/a.jpg');
assert.strictEqual(S.image('', 'x/'), null);
assert.strictEqual(S.image('https://drive.google.com/open?id=' + ID, 'x/').src, 'https://drive.google.com/thumbnail?id=' + ID + '&sz=w1200');
assert.throws(() => S.photosDepuisCsv('Numéro,Image\n1,a.jpg'));
console.log('PHOTOS OK');

// Bornes : une feuille géante est coupée à 2000 lignes de données et 500 caractères par cellule.
const gros = 'Épreuve,Athlète,Total\n' + Array.from({ length: 5000 }, (_, i) => 'C,' + 'A'.repeat(900) + i + ',1').join('\n');
const g = S.lignesDepuisCsv(gros);
assert.strictEqual(g.length, 2000);
assert.strictEqual(g[0][1].length, 500);
// Un lien qui n'est pas https n'est jamais gardé comme lien : il devient un nom de fichier local.
for (const mauvais of ['javascript:alert(1)', 'data:text/html,x', 'http://exemple.ca/a.jpg', '//exemple.ca/a.jpg']) {
  const im = S.image(mauvais, 'assets/photos/');
  assert.ok(im.src.startsWith('assets/photos/') && im.lien.startsWith('assets/photos/'), mauvais);
}
console.log('SECURITE OK');

// Langue lue dans ?lang=en, variables remplacées, clés identiques dans chaque langue.
assert.strictEqual(S.t('photos.lien', { n: 2 }), 'Photo 2 · download');
const fr = Object.keys(window.TEXTES.fr);
for (const l of Object.keys(window.TEXTES)) assert.deepStrictEqual(Object.keys(window.TEXTES[l]).filter(k => !fr.includes(k)), [], l);
for (const l of Object.keys(window.TEXTES)) assert.deepStrictEqual(fr.filter(k => !Object.hasOwn(window.TEXTES[l], k)), [], 'clés manquantes en ' + l);
console.log('I18N OK');
