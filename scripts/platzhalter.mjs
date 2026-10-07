/*
 * Go-live-Sperre für Platzhalter (CLAUDE.md, «Massgebende Grundlagen»):
 * Läuft in `npm run build` nach dem Astro-Build und prüft jede HTML-Seite
 * in dist/ auf Platzhalter in eckigen Klammern:
 *   - «[XX» und «[X]» irgendwo im HTML (auch in Attributen und JSON-LD),
 *   - jeder andere Text in eckigen Klammern im sichtbaren Text, z. B.
 *     «[ohne Zuschläge für Abende und Wochenenden]» (CSS und Skripte zählen
 *     nicht, dort sind eckige Klammern Code).
 *
 * Im Production-Build von Netlify (Umgebungsvariable CONTEXT=production)
 * bricht der Build mit Exit-Code 1 ab; Netlify veröffentlicht ihn dann
 * nicht. In Deploy Previews, Branch deploys und lokal gibt es nur eine
 * Warnung.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** «[XX» bis zur schliessenden Klammer (z. B. «[XX.–]») und «[X]». */
const KURZ = /\[XX[^\]<"]{0,20}\]?|\[X\]/g;

/** Text in eckigen Klammern im sichtbaren Text. */
const KLAMMER = /\[[^\[\]<>]{1,200}\]/g;

/** Sichtbarer Text einer Seite: ohne style, script, Kommentare und Tags. */
export function sichtbarerText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

/** Alle Platzhalter einer Seite, jeder einmal, in der Reihenfolge des Vorkommens. */
export function platzhalterIn(html) {
  const funde = [...html.matchAll(KURZ), ...sichtbarerText(html).matchAll(KLAMMER)].map((t) => t[0]);
  return [...new Set(funde)];
}

/** HTML-Dateien eines Ordners (rekursiv). */
function htmlDateien(ordner) {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    const pfad = join(ordner, e.name);
    if (e.isDirectory()) return htmlDateien(pfad);
    return e.name.endsWith('.html') ? [pfad] : [];
  });
}

/** { 'betreuung-hauswirtschaft/index.html': ['[XX.–]', …], … } nur für Seiten mit Funden. */
export function pruefeOrdner(ordner) {
  const ergebnis = {};
  for (const datei of htmlDateien(ordner).sort()) {
    const funde = platzhalterIn(readFileSync(datei, 'utf8'));
    if (funde.length) ergebnis[relative(ordner, datei)] = funde;
  }
  return ergebnis;
}

/**
 * Bewertet die Funde für den Build-Kontext. Gibt { code, zeilen } zurück:
 * code 1 (Abbruch) nur im Production-Build mit Funden, sonst 0.
 */
export function bewerte(funde, kontext) {
  const seiten = Object.entries(funde);
  if (!seiten.length) return { code: 0, zeilen: ['Platzhalter: keine eckigen Klammern im HTML.'] };
  const production = kontext === 'production';
  const zeilen = [
    production
      ? 'Platzhalter: Production-Build abgebrochen (Go-live-Sperre, CLAUDE.md). Noch offen:'
      : `Platzhalter: Warnung (Kontext ${kontext || 'lokal'}); ein Production-Build bricht hier ab. Noch offen:`,
    ...seiten.map(([seite, liste]) => `  ${seite}: ${liste.join(' · ')}`),
  ];
  return { code: production ? 1 : 0, zeilen };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = fileURLToPath(new URL('../dist', import.meta.url));
  const funde = pruefeOrdner(dist);
  const { code, zeilen } = bewerte(funde, process.env.CONTEXT);
  const ausgabe = code ? console.error : Object.keys(funde).length ? console.warn : console.log;
  ausgabe(zeilen.join('\n'));
  process.exitCode = code;
}
