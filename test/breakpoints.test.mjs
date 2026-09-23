/**
 * Prüft, dass alle Media Queries in src/ nur die Breakpoints verwenden, die
 * in src/styles/global.css (Abschnitt «Breakpoints der Webseite») festgelegt
 * sind: «ab X» als (min-width: Xpx), «unter X» als (max-width: X - 1 px).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = fileURLToPath(new URL('..', import.meta.url));
const src = join(wurzel, 'src');
const globalCss = readFileSync(join(src, 'styles/global.css'), 'utf8');

/** Die Liste aus global.css: Zeilen der Form « *    768 px  Tablet: …». */
function breakpoints() {
  const block = globalCss.split('Breakpoints der Webseite')[1]?.split('*/')[0] ?? '';
  return [...block.matchAll(/^\s*\*\s+(\d{3,4}) px\s/gm)].map((t) => Number(t[1]));
}

function dateien(ordner) {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const pfad = join(ordner, e.name);
    if (e.isDirectory()) return dateien(pfad);
    return /\.(astro|css|js)$/.test(e.name) && e.name !== 'tokens.css' ? [pfad] : [];
  });
}

test('Breakpoints sind in global.css festgelegt', () => {
  assert.deepEqual(breakpoints(), [360, 480, 640, 768, 1024, 1360]);
});

test('Media Queries verwenden nur die festgelegten Breakpoints', () => {
  const liste = breakpoints();
  const fehler = [];
  let anzahl = 0;
  for (const datei of dateien(src)) {
    const name = relative(wurzel, datei);
    for (const abfrage of readFileSync(datei, 'utf8').matchAll(/@media([^{]*)\{|matchMedia\(([^)]*)\)/g)) {
      const text = abfrage[1] ?? abfrage[2];
      if (/\b(width|height)\s*[<>=]/.test(text)) fehler.push(`${name}: Bereichsschreibweise in «${text.trim()}»`);
      for (const [, art, wert, einheit] of text.matchAll(/(min|max)-width:\s*([\d.]+)([a-z]*)/g)) {
        anzahl += 1;
        const px = Number(wert);
        const erlaubt = einheit === 'px' && (art === 'min' ? liste.includes(px) : liste.includes(px + 1));
        if (!erlaubt) fehler.push(`${name}: (${art}-width: ${wert}${einheit})`);
      }
    }
  }
  assert.ok(anzahl > 0, 'keine Media Queries gefunden');
  assert.deepEqual(fehler, []);
});
