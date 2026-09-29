/*
 * Texte der beiden Mails (reiner Text, UTF-8): die Anfrage an MAIL_TO und
 * die Eingangsbestätigung an die anfragende Person. Die Bestätigung
 * wiederholt nur das Anliegen (Feld 1), keine weiteren Angaben, damit keine
 * Gesundheitsangaben aus der Nachricht an eine fremde Adresse zurückgehen.
 */
import { FELDER } from './felder.mjs';

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
