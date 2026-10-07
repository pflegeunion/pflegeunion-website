/*
 * Go-live-Sperre für Platzhalter (CLAUDE.md, «Massgebende Grundlagen»):
 * Läuft in `npm run build` nach dem Astro-Build und prüft jede HTML-Seite
 * in dist/ auf Platzhalter in eckigen Klammern:
 *   - «[XX» und «[X]» irgendwo im HTML (auch in Attributen und JSON-LD),
 *   - jeder andere Text in eckigen Klammern im sichtbaren Text, z. B.
 *     «[ohne Zuschläge für Abende und Wochenenden]» (CSS und Skripte zählen
 *     nicht, dort sind eckige Klammern Code).
 *
 * Die Sperre greift erst mit der Netlify-Umgebungsvariable GO_LIVE=ja
 * (Go-live-Bedingung E4 Punkt 8; Entscheid GL 07.10.2026): Dann bricht der
 * Build mit Exit-Code 1 ab und Netlify veröffentlicht ihn nicht. Ohne diese
 * Variable nur Warnung: Testseite, pflegeunion.ch mit Passwortschutz,
 * Deploy Previews, Branch deploys und lokal. Die Adresse (URL) zählt nicht.
 * Vor dem Go-live in Netlify GO_LIVE=ja setzen und das Passwort entfernen.
 *
 * Aufruf: node scripts/platzhalter.mjs [ordner] (Standard: dist).
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

/** Ist die Sperre eingeschaltet (Netlify-Variable GO_LIVE=ja)? */
export function goLive({ GO_LIVE: wert } = {}) {
  return String(wert ?? '').trim().toLowerCase() === 'ja';
}

/**
 * Bewertet die Funde für die Build-Umgebung (Variable GO_LIVE). Gibt
 * { code, zeilen } zurück: code 1 (Abbruch) nur mit GO_LIVE=ja und Funden,
 * sonst 0.
 */
export function bewerte(funde, umgebung = {}) {
  const seiten = Object.entries(funde);
  if (!seiten.length) return { code: 0, zeilen: ['Platzhalter: keine eckigen Klammern im HTML.'] };
  const sperre = goLive(umgebung);
  const wert = umgebung.GO_LIVE ? `GO_LIVE=${umgebung.GO_LIVE}` : 'ohne GO_LIVE';
  const zeilen = [
    sperre
      ? 'Platzhalter: Build abgebrochen, GO_LIVE=ja (Go-live-Sperre, CLAUDE.md; Go-live-Bedingung E4 Punkt 8). Noch offen:'
      : `Platzhalter: Warnung (${wert}); mit GO_LIVE=ja bricht der Build hier ab. Noch offen:`,
    ...seiten.map(([seite, liste]) => `  ${seite}: ${liste.join(' · ')}`),
  ];
  return { code: sperre ? 1 : 0, zeilen };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ordner = process.argv[2] ?? fileURLToPath(new URL('../dist', import.meta.url));
  const funde = pruefeOrdner(ordner);
  const { code, zeilen } = bewerte(funde, { GO_LIVE: process.env.GO_LIVE });
  const ausgabe = code ? console.error : Object.keys(funde).length ? console.warn : console.log;
  ausgabe(zeilen.join('\n'));
  process.exitCode = code;
}
