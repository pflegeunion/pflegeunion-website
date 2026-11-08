/**
 * Prüft die Seite Tarife und Kosten /tarife/ (Webseitenkonzept V3.22,
 * Auftrag «Tarife und Einsatzgebiet» vom 08.11.2026) im Quelltext und in
 * den Daten: Reihenfolge und Flächen der Abschnitte, Texte wörtlich,
 * Tabellenwerte, Tabellen in scrollbaren Boxen, beide Buttons auf das
 * Tarifblatt, Tarifblatt (PDF, zwei Seiten), Kopfzeile mit aktivem
 * Menüpunkt, Anfrage mit eigener Etikette, Meta-Texte, canonical und
 * Sitemap. Nach `npm run build` zusätzlich das gebaute HTML.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { STAND, TARIFBLATT, PFLEGE, EIGENANTEIL, BEISPIELE } from '../src/daten/tarife.mjs';
import { TARIF } from '../src/daten/betreuung.mjs';
import { GEMEINDEN } from '../src/daten/einsatzgebiet.mjs';

const lies = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');
const flach = (t) => t.replace(/\s+/g, ' ');
const roh = lies('src/pages/tarife.astro');
const quelle = flach(roh);
const dist = new URL('../dist/tarife/index.html', import.meta.url);

test('Abschnitte in der Reihenfolge des Auftrags, Flächen abwechselnd', () => {
  const marken = [
    '<Hero',
    '<Abschnitt label="Pflege"',
    '<Abschnitt flaeche="warmgrau" label="Betreuung und Hauswirtschaft"',
    '<Abschnitt label="Gut zu wissen"',
    '<Abschnitt flaeche="warmgrau" label="Wo, wann und wie wir pflegen"',
    '<TrustLeiste />',
    '<Anfrage etikette="FRAGEN ZU KOSTEN? KOSTENLOSES ERSTGESPRÄCH" />',
  ];
  const stellen = marken.map((m) => quelle.indexOf(m));
  for (const [i, s] of stellen.entries()) assert.ok(s > 0, marken[i]);
  assert.deepEqual([...stellen].sort((a, b) => a - b), stellen);
  // Einziger Ocker-Kasten der Seite.
  assert.equal(quelle.match(/<Kernbotschaft\b/g).length, 1);
  assert.doesNotMatch(quelle, /<Hinweiskasten\b/);
});

test('Ohne Bewegung beim Scrollen (sachliche Seite)', () => {
  assert.doesNotMatch(roh, /\bbewegung\b/);
  assert.doesNotMatch(roh, /data-bewegung/);
});

test('Meta-Titel, Meta-Beschreibung, canonical und Sitemap', () => {
  assert.ok(quelle.includes('titel="Tarife und Kosten | Pflegeunion Schweiz"'));
  assert.ok(
    quelle.includes(
      'beschreibung="Was Pflege zu Hause im Kanton Zug kostet: Eigenanteil höchstens CHF 15.35 pro Tag, Betreuung und Hauswirtschaft CHF 56.– pro Stunde. Mit Tarifblatt zum Herunterladen."',
    ),
  );
  assert.ok(quelle.includes('kanonisch="/tarife/"'));
  const seiten = lies('src/pages/sitemap.xml.ts').match(/export const SEITEN = \[([^\]]*)\];/)[1];
  assert.match(seiten, /'\/tarife\/'/);
});

test('Kopfzeile: Menüpunkt «Tarife» aktiv, Button «Lohn berechnen» → /#lohnrechner', () => {
  const header = lies('src/components/Header.astro');
  const menue = header.match(/const menue = \[([\s\S]*?)\];/)[1];
  const punkte = [...menue.matchAll(/text: '([^']+)'/g)].map((t) => t[1]);
  assert.deepEqual(punkte, ['So funktioniert es', 'Lohnrechner', 'Betreuung & Hauswirtschaft', 'Tarife', 'Über uns', 'Kontakt']);
  assert.match(menue, /\{ text: 'Tarife', ziel: '\/tarife\/' \}/);
  // aria-current über den Pfad (aktuell = '/tarife/'); kein eigener Button für /tarife/.
  assert.match(header, /aria-current=\{punkt\.ziel === aktuell \? 'page' : undefined\}/);
  assert.doesNotMatch(header, /'\/tarife':/);
  assert.doesNotMatch(header, /fünf Menüpunkte/);
});

test('Hero: Texte wörtlich, Button auf das Tarifblatt (PDF), ohne Bild', () => {
  assert.equal(STAND, 'November 2026');
  const hero = quelle.split('<Hero')[1].split('/>')[0];
  assert.ok(hero.includes('etikette={`TARIFE UND KOSTEN · STAND ${STAND.toUpperCase()}`}'));
  assert.ok(hero.includes('titel="Was Sie bei uns bezahlen."'));
  assert.ok(
    hero.includes(
      'text="Pflege bezahlen zum grössten Teil Ihre Krankenversicherung und Ihre Wohngemeinde. Ihr Eigenanteil ist gesetzlich begrenzt. Betreuung und Hauswirtschaft sind private Leistungen."',
    ),
  );
  assert.ok(hero.includes("primaer={{ text: TARIFBLATT.text, ziel: TARIFBLATT.pfad, typ: 'application/pdf' }}"));
  assert.match(hero, /\bunterseite\b/);
  assert.doesNotMatch(hero, /\bbild/);
  assert.match(lies('src/components/Hero.astro'), /<a class="button" href=\{primaer\.ziel\} type=\{primaer\.typ\}>/);
});

test('Beide Buttons zeigen auf das Tarifblatt', () => {
  assert.deepEqual(TARIFBLATT, {
    pfad: '/downloads/tarifblatt-pflegeunion.pdf',
    text: 'Tarifblatt herunterladen (PDF, 2 Seiten)',
  });
  assert.ok(quelle.includes('<a class="button" href={TARIFBLATT.pfad} type="application/pdf">{TARIFBLATT.text}</a>'));
  // Normaler Link im selben Fenster.
  assert.doesNotMatch(roh, /target=/);
});

test('Tarifblatt: vorhanden, beginnt mit %PDF, zwei Seiten', () => {
  const datei = new URL('../public/downloads/tarifblatt-pflegeunion.pdf', import.meta.url);
  const pdf = readFileSync(datei);
  assert.equal(pdf.subarray(0, 4).toString('latin1'), '%PDF');
  const text = pdf.toString('latin1');
  const seiten = text.match(/\/Type\s*\/Page(?!s)/g) ?? [];
  assert.equal(seiten.length, 2);
  assert.match(text, /\/Type\s*\/Pages[\s\S]{0,200}?\/Count 2\b|\/Count 2\b[\s\S]{0,200}?\/Type\s*\/Pages/);
  assert.ok(statSync(datei).size < 200 * 1024);
});

test('Pflege: Tabelle mit Beiträgen und Ihrem Anteil', () => {
  assert.ok(quelle.includes("titel={'Pflege: zahlen Kranken\\u00ADversicherung und Gemeinde'}"));
  assert.deepEqual(
    PFLEGE.map((z) => [z.leistung, z.krankenkasse, z.anteil, z.angebot]),
    [
      ['Abklärung, Beratung und Koordination', '76.90', '15.35', true],
      ['Behandlungspflege', '63.00', '12.60', false],
      ['Grundpflege', '52.60', '10.52', true],
    ],
  );
  assert.deepEqual(
    PFLEGE.map((z) => z.beschreibung),
    [
      'Bedarfsabklärung, Pflegeplanung, Anleitung · Art. 7 Abs. 2 lit. a KLV',
      'Wundversorgung, Medikamente, Injektionen · Art. 7 Abs. 2 lit. b KLV',
      'Waschen, Anziehen, Essen und Bewegen · Art. 7 Abs. 2 lit. c KLV',
    ],
  );
  for (const text of [
    '<caption class="visually-hidden">Pflege: Beitrag der Krankenkasse und Ihr Anteil, Beträge pro Stunde</caption>',
    '<th scope="col" class="text-label">LEISTUNG · BETRÄGE PRO STUNDE</th>',
    '<th scope="col" class="text-label betrag">KRANKENKASSE</th>',
    '<th scope="col" class="text-label betrag">IHR ANTEIL</th>',
    '<th scope="row">',
    '<span class="text-label noch-nicht">NOCH NICHT IM ANGEBOT</span>',
    '<td class="betrag">CHF {z.krankenkasse}</td>',
    '<td class="betrag anteil">CHF {z.anteil}</td>',
  ]) {
    assert.ok(quelle.includes(text), text);
  }
  // Bei Abklärung bewusst 15.35 (Tagesmaximum), nie 15.38.
  for (const datei of ['src/pages/tarife.astro', 'src/daten/tarife.mjs']) {
    assert.doesNotMatch(lies(datei).replace(/\/\/.*$/gm, ''), /15\.38/, datei);
  }
});

test('Eigenanteil: Kernbotschaft und Beispiele, Absatz darunter', () => {
  assert.equal(EIGENANTEIL.hoechstens, '15.35');
  assert.equal(EIGENANTEIL.text, '20 % des Krankenkassenbeitrags, nie mehr als CHF 15.35 pro Tag.');
  assert.ok(quelle.includes('<Kernbotschaft etikette="IHR EIGENANTEIL PRO TAG" titel={`höchstens CHF ${EIGENANTEIL.hoechstens}`} seitlich>'));
  assert.ok(quelle.includes('<p slot="kopf">{EIGENANTEIL.text}</p>'));
  assert.ok(quelle.includes('<caption class="visually-hidden">Beispiele für Ihren Eigenanteil</caption>'));
  assert.deepEqual(BEISPIELE, [
    { fall: '1 Std. Grundpflege pro Tag', betrag: 'CHF 10.52 pro Tag' },
    { fall: '2 Std. Grundpflege pro Tag', betrag: 'CHF 15.35 pro Tag' },
    { fall: 'Pflege jeden Tag, 31 Tage', betrag: 'höchstens CHF 475.85' },
  ]);
  assert.ok(
    quelle.includes(
      'Die übrigen Pflegekosten trägt Ihre Wohngemeinde; wir rechnen direkt mit Krankenversicherung und Gemeinde ab. Kinder und Jugendliche bis 18 Jahre bezahlen keinen Eigenanteil. Franchise und Selbstbehalt (10 %) erhebt Ihre Krankenversicherung wie bei jeder ärztlichen Leistung. Wir verrechnen die effektive Pflegezeit in 5-Minuten-Einheiten.',
    ),
  );
  // Kernbotschaft: Slot «kopf» links unter dem Titel.
  assert.match(lies('src/components/Kernbotschaft.astro'), /<slot name="kopf" \/>/);
});

test('Betreuung und Hauswirtschaft: Text, Tabelle aus TARIF, Absatz', () => {
  assert.equal(TARIF.stunde, '56.–');
  for (const text of [
    'titel="Betreuung und Hauswirtschaft: bezahlen Sie privat"',
    'Einkaufen, Kochen, Reinigung, Wäsche, Begleitung zum Arzt, Gesellschaft und Entlastung für Angehörige. Die Krankenversicherung bezahlt diese Leistungen nicht.',
    '<caption class="visually-hidden">Betreuung und Hauswirtschaft: Tarif</caption>',
    "{ text: 'Betreuung und Hauswirtschaft', betrag: `CHF ${TARIF.stunde} pro Std.`, haupt: true },",
    "{ text: 'Wegpauschale bei Einsätzen unter 2 Stunden', betrag: 'CHF 10.– pro Einsatz' },",
    "{ text: 'Wegpauschale bei Einsätzen ab 2 Stunden', betrag: 'keine' },",
    "{ text: 'Zuschläge für Abende, Wochenenden und Feiertage', betrag: 'keine' },",
    'Wir verrechnen die effektive Zeit im 15-Minuten-Takt. Vor dem ersten Einsatz erhalten Sie eine schriftliche Offerte.',
  ]) {
    assert.ok(quelle.includes(text), text);
  }
});

test('Tabellen: th für Kopf- und Zeilenbeschriftung, rechtsbündige Beträge, scrollbare Boxen', () => {
  const tabellen = roh.match(/<table class=/g).length;
  assert.equal(tabellen, 3);
  const boxen = [...roh.matchAll(/<div class="tabelle-box[^"]*" role="region" aria-label="([^"]+)" tabindex="0">\s*<table/g)];
  assert.equal(boxen.length, tabellen);
  assert.equal(roh.match(/<caption class="visually-hidden">/g).length, tabellen);
  const stil = flach(roh.split('<style>')[1]);
  assert.ok(stil.includes('.tabelle { font-variant-numeric: tabular-nums; }'));
  assert.match(stil, /\.tabelle \.betrag \{ text-align: right; white-space: nowrap; \}/);
  const css = flach(lies('src/styles/global.css'));
  assert.ok(css.includes('.tabelle-box { max-width: 100%; overflow-x: auto; }'));
  // Keine Schatten, keine Verläufe, keine Hex-Werte.
  assert.doesNotMatch(stil, /shadow|gradient|#[0-9a-f]{3,6}\b/i);
});

test('Gut zu wissen: sechs Einträge wörtlich, Titel als H3', () => {
  const eintraege = [
    ['Erstgespräch und Offerte', 'Kostenlos und unverbindlich. Die pflegerische Bedarfsabklärung bei Ihnen zu Hause ist eine Pflegeleistung und wird wie oben abgerechnet.'],
    ['Rechnung', 'Sie erhalten monatlich eine Rechnung für Ihren Eigenanteil und allfällige private Leistungen, zahlbar innert 30 Tagen.'],
    ['Absagen', 'Pflege: keine Absagekosten. Betreuung und Hauswirtschaft: bis 24 Std. vorher kostenlos, danach die geplante Zeit, höchstens 1 Std. Nie bei Spitaleintritt oder Todesfall.'],
    ['Pflegematerial', 'Wir verkaufen kein Material. Was wir bei der Pflege verwenden, rechnen wir nach den gesetzlichen Vorgaben mit der Krankenversicherung ab.'],
    ['Finanzielle Hilfen', 'Ergänzungsleistungen, Hilflosenentschädigung und manche Zusatzversicherungen helfen mit. Wir prüfen Ihre Ansprüche im kostenlosen Erstgespräch.'],
    ['Mehrwertsteuer', 'Auf unseren Leistungen erheben wir keine Mehrwertsteuer. Gesetzliche Beiträge können sich ändern; es gilt das aktuelle Tarifblatt.'],
  ];
  for (const [titel, text] of eintraege) {
    assert.ok(quelle.includes(`titel: '${titel}', text: '${text}',`), titel);
  }
  assert.ok(quelle.includes('<h3 class="text-h3">{w.titel}</h3>'));
  assert.doesNotMatch(roh, /class="klappe"/);
});

test('Wo, wann und wie wir pflegen: Definitionsliste, Gemeinden, Notfallnummern', () => {
  const dl = quelle.split('<dl class="bereich">')[1].split('</dl>')[0];
  const begriffe = [...dl.matchAll(/<dt class="text-label">([^<]+)<\/dt>/g)].map((t) => t[1]);
  assert.deepEqual(begriffe, ['EINSATZGEBIET', 'EINSATZZEITEN', 'LEISTUNGEN', 'PERSONAL']);
  for (const text of [
    'Ganzer Kanton Zug, alle elf Gemeinden',
    '<Gemeinden />',
    "Täglich 06.00–22.00 Uhr, auch an Wochenenden und Feiertagen. Geschäftsstelle Mo bis Fr, 08.00–17.00 Uhr. Kein 24-Stunden-Pikett; im Notfall: Sanität{' '} <a class=\"tippflaeche-zeile\" href=\"tel:144\">144</a>, Ärztlicher Notfalldienst{' '} <a class=\"tippflaeche-zeile notfall\" href=\"tel:+41900008008\">0900 008 008</a>.",
    'Abklärung und Beratung, Grundpflege, Betreuung und Hauswirtschaft. Behandlungspflege noch nicht; wir klären mit Ihnen, wer sie übernimmt.',
    'Diplomierte Pflegefachpersonen mit Berufsausübungsbewilligung des Kantons Zug klären ab, planen und leiten an. Angestellte pflegende Angehörige leisten die Grundpflege, Betreuungspersonen Betreuung und Hauswirtschaft.',
  ]) {
    assert.ok(dl.includes(text), text);
  }
  assert.equal(GEMEINDEN.length, 11);
});

test('Anfrage: neuer Parameter etikette, Standard unverändert, nichts vorgewählt', () => {
  const anfrage = lies('src/components/Anfrage.astro');
  assert.match(anfrage, /etikette = 'ERSTGESPRÄCH KOSTENLOS · ANTWORT INNERT 24 STUNDEN',/);
  assert.match(anfrage, /<p class="text-label etikette etikette--weiss" data-bewegung=\{bw\}>\{etikette\}<\/p>/);
  const aufruf = quelle.split('<Anfrage')[1].split('/>')[0];
  assert.doesNotMatch(aufruf, /anliegen=|titel=/);
});

test('Gebaute Seite (nach npm run build): Texte, Werte, kein 15.38, keine Platzhalter', { skip: !existsSync(dist) }, () => {
  const html = readFileSync(dist, 'utf8');
  const text = flach(html.replace(/<(style|script)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/­/g, ''));
  for (const t of [
    'TARIFE UND KOSTEN · STAND NOVEMBER 2026',
    'Was Sie bei uns bezahlen.',
    'Pflege: zahlen Krankenversicherung und Gemeinde',
    'CHF 76.90',
    'CHF 15.35',
    'CHF 63.00',
    'CHF 12.60',
    'CHF 52.60',
    'CHF 10.52',
    'höchstens CHF 475.85',
    'CHF 56.– pro Std.',
    'CHF 10.– pro Einsatz',
    'FRAGEN ZU KOSTEN? KOSTENLOSES ERSTGESPRÄCH',
    'Reden wir über Ihre Situation.',
    'Sanität 144 , Ärztlicher Notfalldienst 0900 008 008',
  ]) {
    assert.ok(text.includes(t), t);
  }
  assert.doesNotMatch(html, /15\.38/);
  assert.doesNotMatch(html, /\[XX|\[X\]/);
  assert.equal(html.match(/href="\/downloads\/tarifblatt-pflegeunion\.pdf" type="application\/pdf"/g).length, 2);
  assert.match(html, /<a class="menue-link text-menu" href="\/tarife\/" aria-current="page"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+\/tarife\/">/);
});
