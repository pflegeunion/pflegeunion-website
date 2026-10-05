/**
 * Prüft das Menü-Skript der Kopfzeile (Inline-Skript in Header.astro):
 * neben Lohnrechner und Bewegung (bewegung.test.mjs) erlaubt, unter 1 KB.
 * Dazu die Zeile der Zeitprüfung: Beim Absenden des Anfrageformulars steht
 * die Zeit seit dem Laden (performance.now()) im versteckten Feld «dauer».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const header = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
const skripte = [...header.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map((t) => t[1]);

test('Kopfzeile hat genau ein Inline-Skript', () => {
  assert.equal(skripte.length, 1);
});

test('Menü-Skript bleibt unter 1 KB', () => {
  const groesse = Buffer.byteLength(skripte[0], 'utf8');
  assert.ok(groesse < 1024, `Menü-Skript ist ${groesse} Bytes gross`);
});

test('Zeitprüfung: beim Absenden steht die Zeit seit dem Laden im Feld dauer', () => {
  const ereignisse = {};
  const document = {
    addEventListener: (typ, f) => (ereignisse[typ] = f),
    getElementById: () => null,
  };
  // Ohne Kopfzeile bricht das Menü-Skript ab; die Zeitprüfung ist trotzdem angemeldet.
  runInNewContext(skripte[0], { document, performance: { now: () => 4321.5 } });
  const dauer = { value: '' };
  ereignisse.submit({ target: { dauer } });
  assert.equal(String(dauer.value), '4321.5');
  // Formulare ohne Feld dauer bleiben unberührt.
  assert.doesNotThrow(() => ereignisse.submit({ target: {} }));
});

/** Inhalt aller Blöcke, die mit `kopf` beginnen (z. B. eine Media Query). */
function bloecke(text, kopf) {
  const inhalte = [];
  for (let beginn = text.indexOf(kopf); beginn >= 0; beginn = text.indexOf(kopf, beginn + 1)) {
    let tiefe = 0;
    let ende = text.indexOf('{', beginn);
    for (; ende < text.length; ende += 1) {
      if (text[ende] === '{') tiefe += 1;
      if (text[ende] === '}' && --tiefe === 0) break;
    }
    inhalte.push(text.slice(text.indexOf('{', beginn) + 1, ende));
  }
  return inhalte.join('\n');
}

test('Ohne Menü-Skript scrollt die Kopfzeile unter 1024 px mit, sonst bleibt sie sticky', () => {
  const globalCss = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  const stil = header.split('<style>')[1];
  // Grundregel unverändert sticky (mit JavaScript auf allen Breiten, ohne ab 1024 px).
  assert.match(stil, /\n {2}\.kopfzeile \{[^}]*position: sticky;/);
  // Nur unter 1024 px und nur ohne data-js (das Menü-Skript setzt es) nicht sticky.
  assert.match(bloecke(stil, '@media (max-width: 1023px)'), /\.kopfzeile:not\(\[data-js\]\) \{\s*position: static;/);
  assert.equal(stil.match(/:not\(\[data-js\]\) \{\s*position:/g).length, 1);
  // Dann hält auch der Seitenkopf keinen Platz für Sprungziele frei.
  assert.match(
    bloecke(globalCss, '@media (max-width: 1023px)'),
    /:root:has\(\.kopfzeile:not\(\[data-js\]\)\) \{\s*--hoehe-sticky: 0px;/,
  );
  assert.match(skripte[0], /kopfzeile\.setAttribute\('data-js', ''\)/);
});
