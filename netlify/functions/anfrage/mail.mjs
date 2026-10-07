/*
 * Texte der Mails (reiner Text, UTF-8): die Anfrage an MAIL_TO, die
 * Eingangsbestätigung an die anfragende Person und das Ergebnis des
 * Lohnrechners per E-Mail. Die Bestätigung wiederholt nur das Anliegen
 * (Feld 1), keine weiteren Angaben, damit keine Gesundheitsangaben aus der
 * Nachricht an eine fremde Adresse zurückgehen.
 */
import { FELDER } from './felder.mjs';
import { chf, ergebnis } from '../../../src/scripts/lohnrechner.js';

const LEER = '–';
const KAESTCHEN = '«Ich habe den Pflegehelferkurs noch nicht abgeschlossen.»';

/** Datum und Uhrzeit in Europe/Zurich, z. B. «29.09.2026, 14:05 Uhr». */
export function zeitpunkt(ms) {
  const text = new Intl.DateTimeFormat('de-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
  return `${text} Uhr`;
}

/** «Bezeichnung: Wert»; endet die Bezeichnung auf «:» oder «?», ohne zweiten Doppelpunkt. */
function zeile(bezeichnung, wert) {
  return /[:?]$/.test(bezeichnung) ? `${bezeichnung} ${wert}` : `${bezeichnung}: ${wert}`;
}

/** Stand des Kurs-Kästchens im Rechner, abgelesen am Feld «ergebnis». */
function kaestchen(ergebnis) {
  if (/bis zum Pflegehelferkurs$/.test(ergebnis)) return 'angekreuzt';
  if (/mit Pflegehelferkurs$/.test(ergebnis)) return 'nicht angekreuzt';
  return LEER;
}

/** Mail an MAIL_TO: alle acht Felder, Rechnerwerte, Seite, Zeitpunkt. */
export function mailAnfrage(werte, { seite, zeit }) {
  const felder = FELDER.map((feld) => {
    const wert = werte[feld.name] || LEER;
    return feld.mehrzeilig && werte[feld.name] ? `${feld.bezeichnung}:\n${wert}` : zeile(feld.bezeichnung, wert);
  });
  const text = [
    'Neue Anfrage über das Formular der Webseite.',
    '',
    ...felder,
    '',
    'Aus dem Lohnrechner',
    `Stunden pro Tag: ${werte.stunden || LEER}`,
    `Schätzung: ${werte.ergebnis || LEER}`,
    `Kästchen ${KAESTCHEN}: ${kaestchen(werte.ergebnis)}`,
    '',
    `Seite: ${seite}`,
    `Eingegangen: ${zeitpunkt(zeit)}`,
    '',
    werte.email
      ? 'Mit «Antworten» schreiben Sie direkt an die anfragende Person.'
      : 'Keine E-Mail-Adresse angegeben. Bitte telefonisch antworten.',
  ].join('\n');
  const betreff = `Anfrage Webseite: ${werte.anliegen} – ${werte.name}`.replace(/[\r\n]+/g, ' ');
  return { betreff, text };
}

/** Eingangsbestätigung (nur wenn Feld 5 ausgefüllt ist). */
export function mailBestaetigung(werte) {
  const text = [
    'Guten Tag',
    '',
    'Vielen Dank. Ihre Anfrage ist bei uns eingegangen. Eine Fachperson meldet sich innert 24 Stunden an Werktagen bei Ihnen. Wenn es dringend ist: 041 784 26 55.',
    '',
    `Ihr Anliegen: ${werte.anliegen}`,
    '',
    'Freundliche Grüsse',
    'Pflegeunion Schweiz',
    'Grundstrasse 4b · 6343 Rotkreuz',
    '041 784 26 55 · info@pflegeunion.ch',
    '',
    'Diese Nachricht wurde automatisch versendet. Wenn Sie darauf antworten, erreicht Ihre Nachricht info@pflegeunion.ch.',
  ].join('\n');
  return { betreff: 'Ihre Anfrage bei der Pflegeunion', text };
}

/*
 * Ergebnis per E-Mail (Lohnrechner-Seite, Konzept D1 «E-Mail mit dem
 * Ergebnis»). Die Beträge rechnet der Server selbst aus Stunden und Kästchen,
 * mit KONFIG und der Rechenlogik von src/scripts/lohnrechner.js (dieselbe
 * Quelle wie Rechner und Fallback-Tabelle): Lohn mit Kurs und die Zeile «Bis
 * zum Pflegehelferkurs: …» immer, bei «mehr als 3» «über» statt «rund» und
 * der Zusatz «Wichtig: …», Pensionskasse nur ab der BVG-Schwelle (Jahreslohn
 * mit dem gezeigten Satz). Keine weiteren Angaben, keine Kopie an MAIL_TO.
 *
 * OFFEN: Der Wortlaut aus D1 «E-Mail mit dem Ergebnis» (Webseitenkonzept
 * V3.20) lag bei der Umsetzung nicht vor. Die Stellen dafür stehen als
 * Platzhalter in eckigen Klammern und bleiben sichtbar, bis der Text aus dem
 * Konzept eingesetzt ist (Textregel: nicht erfinden).
 */
export const BETREFF_ERGEBNIS = 'Ihre Lohnschätzung bei der Pflegeunion';

// Zusatz bei «mehr als 3 Stunden», wörtlich wie im Rechner (D1).
const WICHTIG =
  'Wichtig: Die Krankenversicherung vergütet die Grundpflege, nicht die Präsenz rund um die Uhr. ' +
  'Wie viele Stunden bei Ihnen anerkannt werden, zeigt die Abklärung – und im Gespräch zeigen wir ' +
  'Ihnen, was zusätzlich möglich ist: Betreuung, Entlastung, Hilflosenentschädigung, Ergänzungsleistungen.';

/** Mail mit dem Ergebnis an die angegebene Adresse; werte aus pruefeErgebnis(). */
export function mailErgebnis({ stufe, ohneKurs }) {
  const w = ergebnis(stufe, ohneKurs);
  const text = [
    '[Anrede und Einleitung: Wortlaut aus Konzept D1 «E-Mail mit dem Ergebnis»]',
    '',
    `[Bezeichnung aus D1: Stunden pro Tag] ${stufe.text} pro Tag`,
    `[Bezeichnung aus D1: Lohn mit Pflegehelferkurs] ${chf(w.monatMitKurs, w.mehr)} brutto pro Monat, ${chf(w.jahrMitKurs, w.mehr)} pro Jahr`,
    `Bis zum Pflegehelferkurs: ${chf(w.monatEinstieg, w.mehr)} brutto pro Monat, ${chf(w.jahrEinstieg, w.mehr)} pro Jahr`,
    ...(ohneKurs ? ['[Satz aus D1, wenn «Ich habe den Pflegehelferkurs noch nicht abgeschlossen.» angekreuzt ist]'] : []),
    w.pensionskasse
      ? '[Versicherungen aus D1, mit Pensionskasse: Jahreslohn ab der BVG-Schwelle]'
      : '[Versicherungen aus D1, ohne Pensionskasse: Jahreslohn unter der BVG-Schwelle]',
    ...(w.mehr ? ['', WICHTIG] : []),
    '',
    '[Rechenweg und Hinweis auf die Abklärung: Wortlaut aus D1]',
    '',
    '[Gruss, Telefon 041 784 26 55 und Absender: Wortlaut aus D1]',
  ].join('\n');
  return { betreff: BETREFF_ERGEBNIS, text };
}
