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

// Langue lue dans ?lang=en, variables remplacées, clés identiques dans chaque langue.
assert.strictEqual(S.t('photos.lien', { n: 2 }), 'Photo 2 · download');
const fr = Object.keys(window.TEXTES.fr);
for (const l of Object.keys(window.TEXTES)) assert.deepStrictEqual(Object.keys(window.TEXTES[l]).filter(k => !fr.includes(k)), [], l);
for (const l of Object.keys(window.TEXTES)) assert.deepStrictEqual(fr.filter(k => !Object.hasOwn(window.TEXTES[l], k)), [], 'clés manquantes en ' + l);
console.log('I18N OK');
