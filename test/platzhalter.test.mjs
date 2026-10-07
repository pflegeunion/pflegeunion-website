/**
 * Prüft die Go-live-Sperre für Platzhalter (scripts/platzhalter.mjs, läuft
 * in `npm run build`): «[XX» und «[X]» im HTML und jeder Text in eckigen
 * Klammern im sichtbaren Text werden gefunden; eckige Klammern in CSS,
 * Skripten und Attributen von Selektoren nicht. Mit Funden bricht der Build
 * nur mit der Netlify-Variable GO_LIVE=ja ab; ohne sie (Testseite,
 * pflegeunion.ch mit Passwortschutz, Vorschauen, lokal) nur Warnung, die
 * Adresse (URL) zählt nicht. Dazu: Die offenen Werte der Betreuung stehen an
 * einer Stelle (src/daten/betreuung.mjs).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

test('Sperre greift nur mit GO_LIVE=ja (E4 Punkt 8)', () => {
  const funde = { 'index.html': ['[XX.–]'] };
  // Abbruch: GO_LIVE=ja, unabhängig von Adresse und Kontext.
  const abbruch = [
    { GO_LIVE: 'ja' },
    { GO_LIVE: 'ja', URL: 'https://pflegeunion.ch', CONTEXT: 'production' },
    { GO_LIVE: 'ja', URL: 'https://pflegeunion-test.netlify.app', CONTEXT: 'production' },
    { GO_LIVE: 'ja', URL: 'https://pflegeunion.ch', CONTEXT: 'deploy-preview' },
    { GO_LIVE: ' Ja ' },
  ];
  for (const umgebung of abbruch) {
    const { code, zeilen } = bewerte(funde, umgebung);
    assert.equal(code, 1, JSON.stringify(umgebung));
    assert.match(zeilen.join('\n'), /abgebrochen, GO_LIVE=ja[\s\S]*index\.html: \[XX\.–\]/);
  }
  // Nur Warnung: ohne GO_LIVE=ja, auch unter der Domain pflegeunion.ch
  // (Passwortschutz vor dem Go-live), auf der Testseite, in Vorschauen und lokal.
  const warnung = [
    { URL: 'https://pflegeunion.ch', CONTEXT: 'production' },
    { URL: 'https://www.pflegeunion.ch', CONTEXT: 'production' },
    { URL: 'https://pflegeunion-test.netlify.app', CONTEXT: 'production' },
    { URL: 'https://pflegeunion.ch', CONTEXT: 'deploy-preview' },
    { GO_LIVE: 'nein', URL: 'https://pflegeunion.ch', CONTEXT: 'production' },
    { GO_LIVE: 'true' },
    { GO_LIVE: '' },
    {},
  ];
  for (const umgebung of warnung) {
    const { code, zeilen } = bewerte(funde, umgebung);
    assert.equal(code, 0, JSON.stringify(umgebung));
    assert.match(zeilen[0], /Warnung .*mit GO_LIVE=ja bricht der Build hier ab/);
    assert.match(zeilen.join('\n'), /index\.html: \[XX\.–\]/);
  }
  // Ohne Funde nie ein Abbruch.
  assert.equal(bewerte({}, { GO_LIVE: 'ja' }).code, 0);
});

test('Skript liest GO_LIVE aus der Umgebung und setzt den Exit-Code', () => {
  const skript = fileURLToPath(new URL('../scripts/platzhalter.mjs', import.meta.url));
  const ordner = mkdtempSync(join(tmpdir(), 'platzhalter-'));
  const lauf = (umgebung) => {
    const env = { ...process.env, ...umgebung };
    for (const name of ['GO_LIVE', 'URL', 'CONTEXT']) if (!(name in umgebung)) delete env[name];
    return spawnSync(process.execPath, [skript, ordner], { env, encoding: 'utf8' });
  };
  try {
    writeFileSync(join(ordner, 'index.html'), seite('<p>CHF [XX.–]</p>'));
    const ohne = lauf({ URL: 'https://pflegeunion.ch', CONTEXT: 'production' });
    assert.equal(ohne.status, 0);
    assert.match(ohne.stderr, /Warnung \(ohne GO_LIVE\)[\s\S]*index\.html: \[XX\.–\]/);
    const mit = lauf({ GO_LIVE: 'ja' });
    assert.equal(mit.status, 1);
    assert.match(mit.stderr, /abgebrochen, GO_LIVE=ja[\s\S]*index\.html: \[XX\.–\]/);
    writeFileSync(join(ordner, 'index.html'), seite('<p>CHF 52.– pro Stunde.</p>'));
    const sauber = lauf({ GO_LIVE: 'ja' });
    assert.equal(sauber.status, 0);
    assert.match(sauber.stdout, /keine eckigen Klammern/);
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
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
