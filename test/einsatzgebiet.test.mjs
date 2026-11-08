/**
 * Prüft das Einsatzgebiet (Auftrag «Tarife und Einsatzgebiet» vom
 * 08.11.2026, Art. 51 KVV): die elf Gemeinden an einer Stelle, den neuen
 * Abschnitt «Einsatzgebiet» der Startseite mit Karte direkt vor «Häufige
 * Fragen» (jetzt Weiss), die Verweise auf /tarife/ (Startseite, Betreuung,
 * Kopf- und Fusszeile), die Fusszeile auf jeder Seite und das JSON-LD
 * (areaServed mit elf City). Nach `npm run build` zusätzlich das gebaute
 * HTML jeder Seite.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { GEMEINDEN } from '../src/daten/einsatzgebiet.mjs';

const lies = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');
const flach = (t) => t.replace(/\s+/g, ' ');
const start = flach(lies('src/pages/index.astro'));
const karte = lies('src/components/KarteZug.astro');
const fusszeile = lies('src/components/Footer.astro');

const ELF = ['Baar', 'Cham', 'Hünenberg', 'Menzingen', 'Neuheim', 'Oberägeri', 'Risch-Rotkreuz', 'Steinhausen', 'Unterägeri', 'Walchwil', 'Zug'];

test('Gemeinden an einer Stelle, genau diese Schreibweise und Reihenfolge', () => {
  assert.deepEqual(GEMEINDEN, ELF);
  // Startseite, /tarife/, Fusszeile und JSON-LD lesen die Gemeinden nur von dort.
  for (const datei of ['src/components/Gemeinden.astro', 'src/components/Footer.astro']) {
    assert.match(lies(datei), /import \{ GEMEINDEN \} from '\.\.\/daten\/einsatzgebiet\.mjs';/, datei);
  }
  for (const datei of ['src/pages/index.astro', 'src/pages/tarife.astro']) {
    const quelle = lies(datei);
    assert.match(quelle, /<Gemeinden\b/, datei);
    assert.doesNotMatch(quelle, /'Menzingen'|'Walchwil'|'Unterägeri'/, datei);
  }
});

test('Startseite: dreizehn Abschnitte, «Einsatzgebiet» direkt vor «Häufige Fragen», Flächen', () => {
  const marken = [
    '<Hero',
    '<Lohnrechner',
    '<TrustLeiste',
    'label="Was Sie erhalten"',
    'label="So funktioniert es"',
    'label="Passt es?"',
    'label="Ehrlich gesagt"',
    'label="Betreuung und Hauswirtschaft"',
    'label="Wer dahintersteht"',
    'label="Demnächst"',
    'label="Einsatzgebiet"',
    'label="Häufige Fragen"',
    '<Anfrage',
  ];
  const stellen = marken.map((m) => start.indexOf(m));
  for (const [i, s] of stellen.entries()) assert.ok(s > 0, marken[i]);
  assert.deepEqual([...stellen].sort((a, b) => a - b), stellen);
  // Einsatzgebiet auf Warmgrau mit Anker, Häufige Fragen jetzt auf Weiss.
  assert.ok(start.includes('<Abschnitt flaeche="warmgrau" anker="einsatzgebiet" label="Einsatzgebiet">'));
  const faq = start.split('<!-- 12 Häufige Fragen -->')[1].split('>')[0];
  assert.doesNotMatch(faq, /flaeche=/);
  assert.match(faq, /anker="fragen"/);
  const demnaechst = start.split('label="Demnächst"')[0].split('<Abschnitt').pop();
  assert.doesNotMatch(demnaechst, /warmgrau/);
});

test('Startseite, Einsatzgebiet: Texte, Etiketten, Karte, Link; Bewegung ohne den Link', () => {
  const abschnitt = start.split('label="Einsatzgebiet">')[1].split('</Abschnitt>')[0];
  for (const text of [
    '<p class="text-label etikette" data-bewegung="text">EINSATZGEBIET</p>',
    '<h2 class="text-h2" data-bewegung="text">Im ganzen Kanton Zug.</h2>',
    'Wir pflegen und betreuen in allen elf Zuger Gemeinden, täglich von 06.00 bis 22.00 Uhr.',
    '<KarteZug bewegung />',
    '<Gemeinden class="einsatz-gemeinden" bewegung />',
    '<p class="einsatz-link"> <a class="textlink" href="/tarife/">Tarife und Kosten</a> </p>',
  ]) {
    assert.ok(abschnitt.includes(text), text);
  }
  // Raster mit Bereichen, ohne JavaScript.
  const stil = flach(lies('src/pages/index.astro').split('<style>')[1]);
  assert.match(stil, /\.einsatzgebiet \{ display: grid; grid-template-areas: 'kopf' 'karte' 'gemeinden' 'link'; \}/);
  assert.match(stil, /@media \(min-width: 1024px\) \{[\s\S]*\.einsatzgebiet \{ grid-template-columns: repeat\(12, minmax\(0, 1fr\)\);/);
  assert.match(stil, /\.einsatz-karte \{ grid-area: karte; width: 100%; max-width: var\(--breite-karte\);/);
});

test('Karte: Inline-SVG mit elf Gemeindeflächen, zugänglich, Farben über Tokens', () => {
  const bfs = [...karte.matchAll(/data-bfs="(\d+)"/g)].map((t) => Number(t[1]));
  assert.deepEqual(bfs, [1701, 1702, 1703, 1704, 1705, 1706, 1707, 1708, 1709, 1710, 1711]);
  assert.match(karte, /role="img"\s+aria-labelledby="karte-zug-titel"/);
  assert.ok(karte.includes('<title id="karte-zug-titel">Karte des Kantons Zug mit seinen elf Gemeinden</title>'));
  assert.ok(karte.includes('<g class="karte-namen" aria-hidden="true">'));
  const namen = [...karte.matchAll(/<text [^>]*>(.*?)<\/text>/g)].map((t) => t[1].replace(/<[^>]+>/g, ''));
  assert.deepEqual(namen, ['Baar', 'Cham', 'Hünenberg', 'Menzingen', 'Neuheim', 'Oberägeri', 'Risch-Rotkreuz', 'Steinhausen', 'Unterägeri', 'Walchwil', 'Zug']);
  // Keine externen Ressourcen, kein Skript, keine Hex-Werte.
  assert.doesNotMatch(karte, /<script|<image|href=|#[0-9a-f]{3,6}\b/i);
  const stil = flach(karte.split('<style>')[1]);
  for (const regel of [
    '.karte-zug { display: block; width: 100%; height: auto; }',
    '.karte-see { fill: var(--color-tiefblau-hell);',
    '.karte-gemeinden path { fill: var(--color-weiss); stroke: var(--color-linie); stroke-width: 1px; }',
    '.karte-umriss { fill: none; stroke: var(--color-tiefblau); stroke-width: 1.5px; }',
    'vector-effect: non-scaling-stroke; stroke-linejoin: round;',
    'font-size: 17px; fill: var(--color-tiefblau); text-anchor: middle; dominant-baseline: central;',
    '@media (max-width: 639px) { .karte-namen { display: none; } }',
  ]) {
    assert.ok(stil.includes(regel), regel);
  }
  assert.match(lies('LIZENZEN.md'), /Karte Kanton Zug \(`src\/components\/KarteZug\.astro`\): Gemeindegrenzen und Seen aus swiss-maps 4\.7\.0/);
});

test('Gemeinden als Etiketten: Liste ohne Links, Tiefblau auf Tiefblau hell, Bold', () => {
  const komponente = lies('src/components/Gemeinden.astro');
  assert.match(komponente, /<ul class:list=\{\['gemeinden liste-blank', klasse\]\}/);
  assert.match(komponente, /\{GEMEINDEN\.map\(\(g\) => <li class="gemeinde text-small">\{g\}<\/li>\)\}/);
  assert.doesNotMatch(komponente, /<a\b/);
  const stil = flach(komponente.split('<style>')[1]);
  assert.match(stil, /\.gemeinde \{[^}]*background-color: var\(--color-tiefblau-hell\);[^}]*color: var\(--color-tiefblau\);[^}]*font-weight: 700;/);
  assert.doesNotMatch(stil, /text-transform|border-radius: var\(--radius-sm\)/);
});

test('Startseite: Tarif der Betreuung CHF 56.–, Links auf /tarife/ in Abschnitt 7 und 8', () => {
  assert.ok(
    start.includes(
      'Private Leistung zu einem festen Stundentarif von CHF {TARIF.stunde}, ohne Zuschläge. Ergänzungsleistungen und Zusatzversicherungen können sich beteiligen – wir prüfen das mit Ihnen. </p> <p class="tarife-link"> <a class="textlink" href="/tarife/">Tarife und Kosten</a> </p> <p class="knopfzeile knopfzeile--nach-link"> <a class="button button--sekundaer" href="/betreuung-hauswirtschaft/">',
    ),
  );
  // «Ehrlich gesagt»: Wortlaut unverändert, Teil als Link; der Absatz steht still (enthält einen Link).
  assert.ok(
    start.includes(
      "<p> <strong>Für die gepflegte Person</strong> ändert sich finanziell wenig: Sie bezahlt den{' '} <a class=\"tippflaeche-inline\" href=\"/tarife/\">gesetzlichen Eigenanteil von höchstens CHF 15.35 pro Tag</a>{' '} – gleich viel wie bei jeder anderen Spitex-Organisation. Ansprüche wie die Hilflosenentschädigung bleiben bestehen. </p>",
    ),
  );
  assert.equal(start.match(/href="\/tarife\/"/g).length, 3);
});

test('Fusszeile: «Tarife und Kosten» im Angebot, Einsatzgebiet als erste Zeile unten', () => {
  assert.match(
    fusszeile,
    /\{ text: 'Betreuung & Hauswirtschaft', ziel: '\/betreuung-hauswirtschaft\/' \},\s*\{ text: 'Tarife und Kosten', ziel: '\/tarife\/' \},/,
  );
  const basis = flach(fusszeile.split('<div class="basis">')[1]).trim();
  assert.ok(basis.startsWith("<p class=\"basis-einsatzgebiet\">Einsatzgebiet: ganzer Kanton Zug – {GEMEINDEN.join(', ')}</p> <p>Kantonal bewilligte Spitex-Organisation"));
});

test('JSON-LD: areaServed mit den elf Gemeinden als City im Kanton Zug, ohne priceRange', () => {
  assert.ok(
    flach(fusszeile).includes(
      "areaServed: GEMEINDEN.map((name) => ({ '@type': 'City', name, containedInPlace: { '@type': 'AdministrativeArea', name: 'Kanton Zug' }, })),",
    ),
  );
  assert.doesNotMatch(fusszeile, /areaServed: 'Kanton Zug'/);
  assert.doesNotMatch(fusszeile, /^\s*priceRange:/m);
});

const seiten = ['index.html', 'lohnrechner/index.html', 'betreuung-hauswirtschaft/index.html', 'tarife/index.html', 'ueber-uns/index.html'];
const gebaut = existsSync(new URL('../dist/index.html', import.meta.url));

test('Gebaute Seiten (nach npm run build): Fusszeile und JSON-LD auf jeder Seite', { skip: !gebaut }, () => {
  const zeile = `Einsatzgebiet: ganzer Kanton Zug – ${ELF.join(', ')}`;
  for (const seite of seiten) {
    const html = readFileSync(new URL(`../dist/${seite}`, import.meta.url), 'utf8');
    assert.ok(html.includes(zeile), seite);
    assert.match(html, /<a href="\/tarife\/"[^>]*>Tarife und Kosten<\/a>/, seite);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema\.org","@type":"Organization"[\s\S]*?)<\/script>/)[1]);
    assert.equal(ld.areaServed.length, 11, seite);
    assert.deepEqual(ld.areaServed.map((o) => o.name), ELF);
    for (const ort of ld.areaServed) {
      assert.deepEqual(ort, { '@type': 'City', name: ort.name, containedInPlace: { '@type': 'AdministrativeArea', name: 'Kanton Zug' } });
    }
  }
  const start = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const abschnitt = start.split('id="einsatzgebiet"')[1].split('</section>')[0];
  assert.equal(abschnitt.match(/<li class="gemeinde text-small"/g).length, 11);
  assert.equal(abschnitt.match(/data-bfs="17(0[1-9]|1[01])"/g).length, 11);
  // «Einsatzgebiet» steht direkt vor «Häufige Fragen».
  const labels = [...start.matchAll(/<section[^>]*aria-label="([^"]+)"/g)].map((t) => t[1]);
  assert.equal(labels[labels.indexOf('Einsatzgebiet') + 1], 'Häufige Fragen');
});
