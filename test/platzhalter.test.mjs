/**
 * Prüft die Go-live-Sperre für Platzhalter (scripts/platzhalter.mjs, läuft
 * in `npm run build`): «[XX» und «[X]» im HTML und jeder Text in eckigen
 * Klammern im sichtbaren Text werden gefunden; eckige Klammern in CSS,
 * Skripten und Attributen von Selektoren nicht. Der Production-Build
 * (CONTEXT=production) bricht mit Funden ab, Vorschauen und lokale Builds
 * warnen nur. Dazu: Die offenen Werte der Betreuung stehen an einer Stelle
 * (src/daten/betreuung.mjs).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bewerte, platzhalterIn, pruefeOrdner } from '../scripts/platzhalter.mjs';
import { TARIF } from '../src/daten/betreuung.mjs';

const seite = (inhalt) =>
  `<!doctype html><html><head><style>.a[data-js]{x:y}.b:has(option[value='x']:checked){}</style>` +
  `<script type="application/ld+json">{"liste":["a","b"]}</script></head><body>${inhalt}</body></html>`;

test('findet [XX…], [X] und Text in eckigen Klammern', () => {
  const html = seite(
    '<h2>CHF [XX.–] pro Stunde.</h2><p>mindestens [X] Stunden, bis [X] Uhr – [ohne Zuschläge für Abende und Wochenenden].</p>',
  );
  assert.deepEqual(platzhalterIn(html), ['[XX.–]', '[X]', '[ohne Zuschläge für Abende und Wochenenden]']);
});

test('findet Platzhalter auch in Attributen und JSON-LD', () => {
  assert.deepEqual(platzhalterIn('<meta name="description" content="Tarif CHF [XX.–]">'), ['[XX.–]']);
  assert.deepEqual(platzhalterIn('<script type="application/ld+json">{"text":"bis [X] Uhr"}</script>'), ['[X]']);
});

test('eckige Klammern in CSS, Skripten und Selektoren zählen nicht', () => {
  assert.deepEqual(platzhalterIn(seite('<p>Alles entschieden: CHF 52.– pro Stunde.</p>')), []);
});

test('Production-Build bricht ab, Vorschau und lokal nur Warnung', () => {
  const funde = { 'index.html': ['[XX.–]'] };
  assert.equal(bewerte(funde, 'production').code, 1);
  assert.match(bewerte(funde, 'production').zeilen.join('\n'), /abgebrochen[\s\S]*index\.html: \[XX\.–\]/);
  for (const kontext of ['deploy-preview', 'branch-deploy', undefined]) {
    assert.equal(bewerte(funde, kontext).code, 0);
    assert.match(bewerte(funde, kontext).zeilen[0], /Warnung/);
  }
  assert.equal(bewerte({}, 'production').code, 0);
});

test('prüft alle HTML-Seiten eines Ordners', () => {
  const ordner = mkdtempSync(join(tmpdir(), 'platzhalter-'));
  try {
    mkdirSync(join(ordner, 'betreuung-hauswirtschaft'));
    writeFileSync(join(ordner, 'index.html'), seite('<p>CHF [XX.–]</p>'));
    writeFileSync(join(ordner, 'betreuung-hauswirtschaft', 'index.html'), seite('<p>bis [X] Uhr</p>'));
    writeFileSync(join(ordner, 'sitemap.xml'), '<x>[XX.–]</x>');
    assert.deepEqual(pruefeOrdner(ordner), {
      'betreuung-hauswirtschaft/index.html': ['[X]'],
      'index.html': ['[XX.–]'],
    });
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
});

test('Build ruft die Prüfung nach dem Astro-Build auf', () => {
  const paket = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(paket.scripts.build, /astro build && node scripts\/platzhalter\.mjs$/);
});

test('Tarif der Betreuung an einer Stelle, Seiten tragen die Werte nicht selbst ein', () => {
  assert.deepEqual(Object.keys(TARIF), ['stunde', 'zuschlaege', 'mindestdauer', 'frist', 'vergleich']);
  for (const datei of ['src/pages/betreuung-hauswirtschaft.astro', 'src/pages/index.astro']) {
    const quelle = readFileSync(new URL(`../${datei}`, import.meta.url), 'utf8');
    assert.doesNotMatch(quelle, /\[XX|\[X\]|\[ohne Zuschläge|CHF 36\.–/, datei);
  }
});
