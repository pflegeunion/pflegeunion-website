/*
 * Go-live-Sperre für Platzhalter (CLAUDE.md, «Massgebende Grundlagen»):
 * Läuft in `npm run build` nach dem Astro-Build und prüft jede HTML-Seite
 * in dist/ auf Platzhalter in eckigen Klammern:
 *   - «[XX» und «[X]» irgendwo im HTML (auch in Attributen und JSON-LD),
 *   - jeder andere Text in eckigen Klammern im sichtbaren Text, z. B.
 *     «[ohne Zuschläge für Abende und Wochenenden]» (CSS und Skripte zählen
 *     nicht, dort sind eckige Klammern Code).
 *
 * Die Sperre greift mit der Domain pflegeunion.ch (Go-live-Bedingung E4
 * Punkt 8; Entscheid 07.10.2026): Nur wenn Netlify die Seite für die echte
 * Domain baut, bricht der Build mit Exit-Code 1 ab und Netlify
 * veröffentlicht ihn nicht. Das ist der Fall, wenn die Netlify-Variable URL
 * (Hauptadresse der Website) https://pflegeunion.ch oder
 * https://www.pflegeunion.ch ist und CONTEXT=production. URL ist bei Netlify
 * in allen Kontexten dieselbe; ohne CONTEXT=production würden nach dem
 * Wechsel auf die Domain auch Deploy Previews abbrechen. In allen anderen
 * Fällen nur Warnung: Testseite pflegeunion-test.netlify.app (heute der
 * Production-Kontext), Deploy Previews, Branch deploys und lokal.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Hauptadressen, unter denen die Sperre greift. */
export const DOMAINS = ['https://pflegeunion.ch', 'https://www.pflegeunion.ch'];

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

/** Baut Netlify die Seite für die echte Domain (Production unter pflegeunion.ch)? */
export function echteDomain({ URL: adresse, CONTEXT: kontext } = {}) {
  const hauptadresse = String(adresse ?? '').trim().toLowerCase().replace(/\/+$/, '');
  return kontext === 'production' && DOMAINS.includes(hauptadresse);
}

/**
 * Bewertet die Funde für die Build-Umgebung (Netlify-Variablen URL und
 * CONTEXT). Gibt { code, zeilen } zurück: code 1 (Abbruch) nur für die
 * echte Domain mit Funden, sonst 0.
 */
export function bewerte(funde, umgebung = {}) {
  const seiten = Object.entries(funde);
  if (!seiten.length) return { code: 0, zeilen: ['Platzhalter: keine eckigen Klammern im HTML.'] };
  const sperre = echteDomain(umgebung);
  const wo = umgebung.URL ? `${umgebung.URL}, Kontext ${umgebung.CONTEXT || 'ohne'}` : 'lokal';
  const zeilen = [
    sperre
      ? `Platzhalter: Build für ${umgebung.URL} abgebrochen (Go-live-Sperre, CLAUDE.md; Go-live-Bedingung E4 Punkt 8). Noch offen:`
      : `Platzhalter: Warnung (${wo}); unter der Domain pflegeunion.ch bricht der Build hier ab. Noch offen:`,
    ...seiten.map(([seite, liste]) => `  ${seite}: ${liste.join(' · ')}`),
  ];
  return { code: sperre ? 1 : 0, zeilen };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = fileURLToPath(new URL('../dist', import.meta.url));
  const funde = pruefeOrdner(dist);
  const { code, zeilen } = bewerte(funde, { URL: process.env.URL, CONTEXT: process.env.CONTEXT });
  const ausgabe = code ? console.error : Object.keys(funde).length ? console.warn : console.log;
  ausgabe(zeilen.join('\n'));
  process.exitCode = code;
}
