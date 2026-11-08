/**
 * Prüft die Tabellen auf /tarife/ im Browser (nach `npm run build`): Bei
 * 390 und 360 px passt jede Tabelle in ihre Box (.tabelle-box: scrollWidth
 * höchstens clientWidth), die Seite scrollt nicht quer, und kein Betrag
 * bricht um. Läuft mit dem vorinstallierten Playwright, falls vorhanden
 * (keine Abhängigkeit des Projekts); sonst oder ohne dist/ übersprungen.
 * dist/ wird mit einem kleinen eigenen Server ausgeliefert.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
let playwright = null;
try {
  playwright = createRequire(import.meta.url)('playwright');
} catch {
  playwright = null;
}
const grund = !existsSync(join(dist, 'tarife/index.html'))
  ? 'dist/ fehlt (zuerst npm run build)'
  : !playwright
    ? 'Playwright nicht vorhanden'
    : false;

const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf' };

function server() {
  return createServer((anfrage, antwort) => {
    let pfad = normalize(decodeURIComponent(new URL(anfrage.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    let datei = join(dist, pfad);
    if (existsSync(datei) && statSync(datei).isDirectory()) datei = join(datei, 'index.html');
    if (!existsSync(datei)) {
      antwort.writeHead(404).end();
      return;
    }
    antwort.writeHead(200, { 'content-type': TYPEN[extname(datei)] ?? 'application/octet-stream' }).end(readFileSync(datei));
  });
}

test('Tabellen auf /tarife/ bei 390 und 360 px: alle Beträge ohne seitliches Wischen sichtbar', { skip: grund }, async () => {
  const srv = server();
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  const adresse = `http://127.0.0.1:${srv.address().port}/tarife/`;
  const browser = await playwright.chromium.launch();
  try {
    for (const breite of [390, 360]) {
      const seite = await browser.newPage({ viewport: { width: breite, height: 900 } });
      await seite.goto(adresse);
      const r = await seite.evaluate(() => ({
        quer: document.documentElement.scrollWidth - window.innerWidth,
        boxen: [...document.querySelectorAll('.tabelle-box')].map((b) => ({
          name: b.getAttribute('aria-label'),
          scroll: b.scrollWidth,
          client: b.clientWidth,
        })),
        betraege: [...document.querySelectorAll('.tabelle td.betrag')].map((td) => {
          const bereich = document.createRange();
          bereich.selectNodeContents(td);
          const zeilen = new Set([...bereich.getClientRects()].map((z) => Math.round(z.top)));
          const rechts = td.getBoundingClientRect().right;
          const box = td.closest('.tabelle-box').getBoundingClientRect();
          return { text: td.textContent.trim(), zeilen: zeilen.size, sichtbar: rechts <= box.right + 0.5 };
        }),
      }));
      assert.equal(r.quer, 0, `${breite} px: Seite scrollt quer`);
      assert.equal(r.boxen.length, 3);
      for (const b of r.boxen) assert.ok(b.scroll <= b.client, `${breite} px, ${b.name}: ${b.scroll} > ${b.client}`);
      assert.equal(r.betraege.length, 13);
      for (const b of r.betraege) {
        assert.equal(b.zeilen, 1, `${breite} px: «${b.text}» bricht um`);
        assert.ok(b.sichtbar, `${breite} px: «${b.text}» ausserhalb der Box`);
      }
      await seite.close();
    }
  } finally {
    await browser.close();
    srv.close();
  }
});
