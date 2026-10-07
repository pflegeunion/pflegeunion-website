/**
 * Prüft die Lohnrechner-Seite /lohnrechner/ (Konzept C2, Claude Design Seite
 * «Lohnrechner») im Quelltext: Reihenfolge der Abschnitte, Texte wörtlich
 * aus den Boards, Rechner in der vollständigen Fassung unter #rechner,
 * Beispiele aus der Rechenlogik, Kopfzeile mit aktivem Menüpunkt, canonical,
 * Sitemap und Verweise von anderen Seiten. Dazu: Die überholten Zahlen
 * kommen in src/ und netlify/ nirgends vor.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KONFIG, chf, ergebnis, stufeFuer } from '../src/scripts/lohnrechner.js';

const lies = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');
const seite = lies('src/pages/lohnrechner.astro');
const flach = (t) => t.replace(/\s+/g, ' ');
const quelle = flach(seite);

test('Abschnitte in der Reihenfolge von C2', () => {
  const marken = [
    '<Hero',
    '<Lohnrechner anker="rechner" vollstaendig kopf={false} bewegung />',
    'label="So entsteht Ihr Lohn"',
    'label="Drei Beispiele aus dem Alltag"',
    'label="Was vom Brutto abgeht"',
    'label="Was nicht vergütet wird"',
    'label="Häufige Fragen zum Lohn"',
    '<TrustLeiste bewegung />',
    '<Anfrage titel="Bereit für den ersten Schritt?" bewegung />',
  ];
  const stellen = marken.map((m) => quelle.indexOf(flach(m)));
  for (const [i, s] of stellen.entries()) assert.ok(s > 0, marken[i]);
  assert.deepEqual([...stellen].sort((a, b) => a - b), stellen);
});

test('Hero mit Bild (WoLeTwKGzms), H1 der Unterseite, «Zum Rechner» auf #rechner', () => {
  const hero = quelle.split('<Hero')[1].split('/>')[0];
  assert.match(hero, /bild="lohnrechner-umarmung"/);
  assert.match(hero, /bildHoehe=\{1321\}/);
  assert.match(hero, /bildAlt="Eine erwachsene Tochter und ihre Mutter umarmen sich zu Hause und lächeln\."/);
  // Oben ausgerichtet: beide Köpfe bleiben im Hochformat ab 1024 px und im Quadrat darunter ganz sichtbar.
  assert.match(hero, /bildPosition="50% 0%"/);
  assert.match(hero, /bildPositionMobil="50% 0%"/);
  assert.match(hero, /\bbewegung\b/);
  assert.match(hero, /primaer=\{\{ text: 'Zum Rechner', ziel: '#rechner' \}\}/);
  assert.match(hero, /\bunterseite\b/);
  assert.doesNotMatch(hero, /sekundaer/);
  for (const breite of [480, 800, 1200]) {
    const groesse = statSync(new URL(`../public/bilder/lohnrechner-umarmung-${breite}.webp`, import.meta.url)).size;
    assert.ok(groesse < 150 * 1024, `${breite}: ${groesse} Bytes`);
  }
  const komponente = lies('src/components/Hero.astro');
  assert.match(komponente, /const mitBild = Boolean\(bild \|\| bildIdee\);/);
  assert.match(komponente, /class:list=\{\['text-h1', \{ 'text-h1--sub': unterseite \}\]\}/);
  assert.match(komponente, /object-position: var\(--bild-position-mobil, 50% 100%\);/);
  const lizenzen = lies('LIZENZEN.md');
  assert.match(lizenzen, /`lohnrechner-umarmung` \| WoLeTwKGzms \|/);
  assert.ok(lizenzen.includes('https://unsplash.com/photos/WoLeTwKGzms'));
});

test('Texte wörtlich aus den Boards (Claude Design, Seite «Lohnrechner»)', () => {
  const texte = [
    // Hero (LR_D01_Hero, LR_M01_Hero)
    'CHF 37.95 PRO STUNDE MIT PFLEGEHELFERKURS · IN 60 SEKUNDEN BERECHNET',
    'Ihr Lohn für die Pflege von Angehörigen.',
    'Wer einen nahestehenden Menschen pflegt, leistet Arbeit – und Arbeit verdient Lohn. Hier sehen Sie, wie sich Ihr Lohn bei der Pflegeunion zusammensetzt, was typischerweise herauskommt und was vom Brutto abgeht. Ohne Kleingedrucktes.',
    // So entsteht Ihr Lohn (LR_D03_Prinzip)
    'DAS PRINZIP',
    'Drei Faktoren bestimmen Ihren Lohn.',
    'Die anerkannten Pflegestunden.',
    'Unsere Pflegefachperson erfasst den Bedarf bei Ihnen zu Hause mit interRAI, dem anerkannten Schweizer Abklärungsinstrument. Vergütet wird die Grundpflege – Hilfe bei Körperpflege, Anziehen, Essen und Trinken, Bewegen. Typisch sind, je nach Situation, ein bis drei Stunden pro Tag.',
    'Ihr Stundenlohn.',
    'CHF 37.95 brutto pro Stunde mit abgeschlossenem Pflegehelferkurs – das ist der Regel-Lohn, denn den Kurs holen alle im ersten Jahr nach, und wir bezahlen ihn. Bis dahin gelten CHF 33.95. Der Lohn ist für alle gleich – unabhängig davon, ob Sie Ihre Mutter, Ihren Partner oder Ihren Bruder pflegen.',
    'Die Sozialversicherungen.',
    'AHV/IV/EO, Arbeitslosen-, Unfall- und Krankentaggeldversicherung sowie Pensionskasse rechnen wir wie in jeder Anstellung ab. Sie erhalten monatlich eine Lohnabrechnung und jährlich einen Lohnausweis.',
    // Drei Beispiele (LR_D04_Beispiele)
    'WAS DAS KONKRET HEISST',
    'Drei Beispiele aus dem Alltag.',
    "'Situation', 'Anerkannte Grundpflege', 'Brutto pro Monat, mit Kurs*', 'Brutto pro Monat, Einstieg*'",
    'Ein Ehemann unterstützt seine Frau morgens und abends bei Körperpflege und Anziehen',
    'ca. 1 Stunde pro Tag',
    'Eine Tochter pflegt ihre Mutter täglich: Körperpflege, Essen, Bewegen, Toilettengang',
    'ca. 2 Stunden pro Tag',
    'Intensive Situation, zum Beispiel nach einem Schlaganfall',
    'ca. 3 Stunden pro Tag',
    // Was vom Brutto abgeht (LR_D05_Brutto)
    'Brutto, netto – und was Sie dafür bekommen.',
    'Von Ihrem Bruttolohn ziehen wir wie jeder Arbeitgeber Ihre Anteile an AHV/IV/EO, Arbeitslosenversicherung, Nichtberufsunfall- und Krankentaggeldversicherung ab – zusammen rund 8 %. Ab der gesetzlichen Eintrittsschwelle kommt Ihr Beitrag an die Pensionskasse dazu. Dafür sind Sie versichert wie in jedem anderen Job, und jede Pflegestunde zählt für Ihre eigene Rente.',
    // Die Grenzen (LR_D06_Grenzen)
    'FAIRERWEISE DAZUGESAGT',
    'Die Grenzen – klar benannt.',
    'Gesellschaft leisten, beaufsichtigen, nachts anwesend sein: Das ist wertvoll, aber keine Pflege im Sinn der Krankenversicherung – bei keinem Anbieter. Als Betreuung buchbar.',
    'Haushalt, Einkauf und Administratives sind keine Pflegeleistungen. Als Hauswirtschaft buchbar.',
    'Medizinische Pflege (Medikamente, Wunden, Injektionen) bieten wir zurzeit noch nicht an und rechnen sie deshalb auch nicht ab.',
    'Wenn Ihnen jemand verspricht, «alles» werde bezahlt: Seien Sie skeptisch. Wir rechnen Ihnen lieber ehrlich vor, was möglich ist. Das trägt länger.',
    // FAQ (LR_D07_FAQ)
    'titel="Häufige Fragen zum Lohn"',
    'Was passiert, wenn ich selbst krank werde?',
    'Dann sind Sie über unsere Krankentaggeldversicherung abgesichert: Sie erhalten 80 % Ihres Lohns, bis zu 730 Tage lang. In den ersten 30 Tagen gilt die gesetzliche Lohnfortzahlung. Die Prämie teilen wir mit Ihnen je zur Hälfte. Die Pflege übernimmt in dieser Zeit unsere Vertretung.',
    'Im kostenlosen Erstgespräch zeigen wir Ihnen, was zusätzlich möglich ist',
  ];
  for (const t of texte) assert.ok(quelle.includes(t), t);
  // Kein Lohndatum (Textregel), keine Ausrufezeichen (ausser in Code), kein ß.
  assert.doesNotMatch(seite, /Folgemonat|spätestens am|ß/);
  const ohneCode = seite.replace(/<!--[\s\S]*?-->/g, '').replace(/!==?|![\w(]/g, '');
  assert.doesNotMatch(ohneCode, /!/);
});

test('Sieben Fragen, H2 ohne Übertitel, Antworten im HTML', () => {
  const fragen = seite.split('const fragen = [')[1].split('];')[0];
  assert.equal((fragen.match(/frage: '/g) || []).length, 7);
  assert.equal((fragen.match(/antwort:/g) || []).length, 7);
  const faq = quelle.split('label="Häufige Fragen zum Lohn"')[1].split('>')[0];
  assert.doesNotMatch(faq, /etikette=/);
});

test('Beispiele und Fussnote aus der Rechenlogik (Korrektur vom 22.09.2026)', () => {
  const werte = ['1', '2', '3'].map((s) => {
    const w = ergebnis(stufeFuer(s));
    return [chf(w.monatMitKurs, w.mehr), chf(w.monatEinstieg, w.mehr)];
  });
  assert.deepEqual(werte, [
    ['rund CHF 990.–', 'rund CHF 880.–'],
    ["rund CHF 1'970.–", "rund CHF 1'770.–"],
    ["rund CHF 2'960.–", "rund CHF 2'650.–"],
  ]);
  // Keine Beträge von Hand in der Tabelle, Sätze und Tage aus KONFIG.
  assert.match(seite, /mitKurs: chf\(w\.monatMitKurs, w\.mehr\), einstieg: chf\(w\.monatEinstieg, w\.mehr\)/);
  assert.match(seite, /KONFIG\.SATZ_KURS\.toFixed\(2\)/);
  assert.match(seite, /KONFIG\.TAGE_MONAT/);
  const fussnote =
    `* Richtwerte bei CHF ${KONFIG.SATZ_KURS.toFixed(2)} (mit Kurs) bzw. CHF ${KONFIG.SATZ_EINSTIEG.toFixed(2)} (Einstieg) pro Stunde, ` +
    `gerechnet auf sechs Einsatztage pro Woche (${KONFIG.TAGE_MONAT} Tage pro Monat) und auf zehn Franken gerundet. ` +
    'Massgebend ist die individuelle Abklärung; der definitive Lohn steht in Ihrem Arbeitsvertrag.';
  assert.equal(
    fussnote,
    '* Richtwerte bei CHF 37.95 (mit Kurs) bzw. CHF 33.95 (Einstieg) pro Stunde, gerechnet auf sechs Einsatztage pro Woche (26 Tage pro Monat) und auf zehn Franken gerundet. Massgebend ist die individuelle Abklärung; der definitive Lohn steht in Ihrem Arbeitsvertrag.',
  );
  // Unter 768 px je Situation ein Block (kein Querscrollen).
  assert.match(seite, /@media \(max-width: 767px\) \{\s*\.beispiele,\s*\.beispiele tbody,\s*\.beispiele tr,\s*\.beispiele th,\s*\.beispiele td \{\s*display: block;/);
});

test('Kopf der Seite: Meta-Titel, Beschreibung, canonical, Bewegung', () => {
  assert.match(seite, /titel="Lohnrechner: Lohn für pflegende Angehörige im Kanton Zug \| Pflegeunion Schweiz"/);
  assert.match(
    seite,
    /beschreibung="Wie viel verdienen pflegende Angehörige\? CHF 37\.95 pro Stunde mit Pflegehelferkurs, CHF 33\.95 zum Einstieg\. Rechnen Sie Ihren Monatslohn in 60 Sekunden aus – ohne Registrierung\. Mit Beispielen und allen Abzügen\."/,
  );
  assert.match(seite, /kanonisch="\/lohnrechner\/"/);
  const basis = lies('src/layouts/Basis.astro');
  assert.match(basis, /\{kanonischeAdresse && <link rel="canonical" href=\{kanonischeAdresse\} \/>\}/);
});

test('Kopfzeile: «Lohnrechner» aktiv, «Lohn berechnen» auf #rechner', () => {
  const header = lies('src/components/Header.astro');
  assert.match(header, /'\/lohnrechner': \{ text: 'Lohn berechnen', ziel: '#rechner' \}/);
  assert.match(header, /aria-current=\{punkt\.ziel === aktuell \? 'page' : undefined\}/);
  assert.match(header, /const aktuell = `\$\{pfad\}\/`;/);
  assert.match(header, /\.menue-link\[aria-current='page'\] \{\s*text-decoration: underline;\s*text-decoration-thickness: 2px;/);
});

test('Sitemap und Verweise auf /lohnrechner/', () => {
  // Sitemap (src/pages/sitemap.xml.ts, als Text gelesen: läuft auch ohne TypeScript in Node).
  assert.match(lies('src/pages/sitemap.xml.ts'), /export const SEITEN = \[[^\]]*'\/lohnrechner\/'/);
  for (const datei of ['src/components/Header.astro', 'src/components/Footer.astro', 'src/components/Lohnrechner.astro']) {
    assert.match(lies(datei), /'\/lohnrechner\/'|href="\/lohnrechner\/"/, datei);
  }
  // «Alle Details zum Lohn» (Startseite) führt auf die Seite.
  assert.match(lies('src/components/Lohnrechner.astro'), /<a class="button button--sekundaer" href="\/lohnrechner\/">\s*Alle Details zum Lohn\s*<\/a>/);
});

test('Überholte Zahlen kommen nirgends vor', () => {
  const wurzel = fileURLToPath(new URL('..', import.meta.url));
  const dateien = (ordner) =>
    readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
      const pfad = join(ordner, e.name);
      if (e.isDirectory()) return dateien(pfad);
      return /\.(astro|css|js|mjs|ts|md)$/.test(e.name) && e.name !== 'tokens.css' ? [pfad] : [];
    });
  const treffer = [];
  for (const datei of [...dateien(join(wurzel, 'src')), ...dateien(join(wurzel, 'netlify'))]) {
    const text = readFileSync(datei, 'utf8');
    for (const alt of ['30,4', '30.4 Tage', "2'310", "27'700", "2'060", "1'150", "3'460", '39.90', '365 Tage']) {
      if (text.includes(alt)) treffer.push(`${datei}: ${alt}`);
    }
  }
  assert.deepEqual(treffer, []);
});
