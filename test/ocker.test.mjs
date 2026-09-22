/**
 * Prüft, dass Ocker nie als Schrift erscheint (Nachtrag Gestaltung vom
 * 22.09.2026): keine CSS-Regel in src/ setzt die Eigenschaft `color` auf
 * --color-ocker. Erfasst werden <style>-Blöcke, CSS-Dateien, style-Attribute
 * und Skripte, auch über eine eigene Variable, die auf Ocker verweist, und
 * über den Farbwert selbst. Ocker bleibt erlaubt für Linien-Icons (stroke,
 * fill), Linien (border) und Grafik.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = fileURLToPath(new URL('..', import.meta.url));
const src = join(wurzel, 'src');

// Ocker als Variable, als Hex-Wert aus design/tokens.json oder als RGB-Wert.
const tokens = JSON.parse(readFileSync(join(wurzel, 'design/tokens.json'), 'utf8'));
const ockerHex = tokens.color.tokens.find((t) => t.name === 'ocker').value.toLowerCase();
const ockerRgb = [1, 3, 5].map((i) => parseInt(ockerHex.slice(i, i + 2), 16));

function dateien(ordner) {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const pfad = join(ordner, e.name);
    if (e.isDirectory()) return dateien(pfad);
    return /\.(astro|css|js|mjs|ts)$/.test(e.name) ? [pfad] : [];
  });
}

/** Kommentare entfernen, damit erklärende Texte nicht als Regel zählen. */
function ohneKommentare(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

/** Verweist der Wert auf Ocker (Variable, Alias-Variable, Hex oder RGB)? */
function istOcker(wert, aliasse) {
  const w = wert.toLowerCase();
  const variablen = [...w.matchAll(/var\(\s*(--[\w-]+)/g)].map((t) => t[1]);
  if (variablen.some((v) => v === '--color-ocker' || aliasse.has(v))) return true;
  if (new RegExp(`${ockerHex}(?![0-9a-f])`).test(w)) return true;
  const rgb = w.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  return Boolean(rgb) && rgb.slice(1, 4).every((z, i) => Number(z) === ockerRgb[i]);
}

/** Eigene Variablen (z. B. --akzent: var(--color-ocker)), die auf Ocker verweisen. */
function ockerAliasse(texte) {
  const aliasse = new Set();
  let neu = true;
  while (neu) {
    neu = false;
    for (const text of texte) {
      for (const [, name, wert] of text.matchAll(/(--[\w-]+)\s*:\s*([^;}"'`]+)/g)) {
        if (name !== '--color-ocker' && !aliasse.has(name) && istOcker(wert, aliasse)) {
          aliasse.add(name);
          neu = true;
        }
      }
    }
  }
  return aliasse;
}

/**
 * Alle Stellen, an denen `color` auf Ocker gesetzt wird: CSS-Deklarationen
 * (auch in style-Attributen) sowie style.color bzw. setProperty('color') in Skripten.
 */
function ockerSchrift(text, aliasse) {
  const funde = [];
  const muster = [
    /(?<![\w-])color\s*:\s*([^;}"'`]+)/g,
    /\.style\.color\s*=\s*([^;\n]+)/g,
    /setProperty\(\s*['"]color['"]\s*,\s*([^)]+)\)/g,
  ];
  for (const m of muster) {
    for (const treffer of text.matchAll(m)) {
      if (istOcker(treffer[1], aliasse)) funde.push(treffer[0].trim());
    }
  }
  return funde;
}

test('Erkennung: color auf Ocker wird gefunden, stroke, fill und Linien nicht', () => {
  const aliasse = ockerAliasse(['.a { --akzent: var(--color-ocker); }']);
  const gefunden = [
    '.a { color: var(--color-ocker); }',
    '.a{color:var( --color-ocker )}',
    `.a { color: ${ockerHex.toUpperCase()}; }`,
    `.a { color: rgb(${ockerRgb.join(', ')}); }`,
    '.a { color: var(--akzent); }',
    '<span style="color: var(--color-ocker)">',
    "el.style.color = 'var(--color-ocker)';",
    "el.style.setProperty('color', 'var(--color-ocker)');",
  ];
  const erlaubt = [
    '.a { stroke: var(--color-ocker); }',
    '.a { fill: var(--color-ocker); }',
    '.a { border-top: 1px solid var(--color-ocker); }',
    '.a { background-color: var(--color-ocker-hell); }',
    '.a { border-color: var(--color-ocker); }',
    '.a { color: var(--color-tiefblau); }',
    '.a { color: var(--color-ocker-hell); }',
  ];
  for (const t of gefunden) assert.equal(ockerSchrift(t, aliasse).length, 1, t);
  for (const t of erlaubt) assert.deepEqual(ockerSchrift(t, aliasse), [], t);
});

test('Keine CSS-Regel in src/ setzt color auf --color-ocker', () => {
  const inhalte = dateien(src).map((datei) => ({
    name: relative(wurzel, datei),
    text: ohneKommentare(readFileSync(datei, 'utf8')),
  }));
  assert.ok(inhalte.length > 0, 'keine Dateien in src/ gefunden');
  const aliasse = ockerAliasse(inhalte.map((d) => d.text));
  const fehler = inhalte.flatMap(({ name, text }) => ockerSchrift(text, aliasse).map((f) => `${name}: ${f}`));
  assert.deepEqual(fehler, []);
});
