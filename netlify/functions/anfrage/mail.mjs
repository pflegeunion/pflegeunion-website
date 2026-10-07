/*
 * Texte der Mails (reiner Text, UTF-8): die Anfrage an MAIL_TO, die
 * Eingangsbestätigung an die anfragende Person und das Ergebnis des
 * Lohnrechners per E-Mail. Die Bestätigung wiederholt nur das Anliegen
 * (Feld 1), keine weiteren Angaben, damit keine Gesundheitsangaben aus der
 * Nachricht an eine fremde Adresse zurückgehen.
 */
import { FELDER } from './felder.mjs';
import { KONFIG, chf, ergebnis } from '../../../src/scripts/lohnrechner.js';

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
 * Ergebnis per E-Mail (Lohnrechner-Seite), Wortlaut aus Konzept V3.20, D1
 * «E-Mail mit dem Ergebnis». Die Beträge rechnet der Server selbst aus den
 * Stunden, mit KONFIG und der Rechenlogik von src/scripts/lohnrechner.js
 * (dieselbe Quelle wie Rechner und Fallback-Tabelle):
 *   - Stunden wie im Rechner geschrieben («1 Stunde», «1½ Stunden» …);
 *   - Lohn mit Kurs pro Monat und Jahr, «Bis zum Pflegehelferkurs» nur pro
 *     Monat;
 *   - bei «mehr als 3» alle Beträge mit «über», im Rechenweg «3 Stunden»
 *     und nach «Bis zum Pflegehelferkurs …» der Zusatz «Wichtig: …» als
 *     eigener Absatz, im Wortlaut des Rechners;
 *   - keine Zeile zu Versicherungen; das Kästchen ändert die Mail nicht;
 *   - der WhatsApp-Link steht allein am Zeilenende, ohne Satzzeichen danach,
 *     damit ihn Outlook, Gmail und Apple Mail als Link erkennen.
 * Keine weiteren Angaben, keine Kopie an MAIL_TO.
 */
export const BETREFF_ERGEBNIS = 'Ihre Lohnschätzung bei der Pflegeunion';

// Derselbe WhatsApp-Link wie auf der Webseite (mit vorbereiteter Nachricht).
export const WHATSAPP = 'https://wa.me/41417842655?text=Guten%20Tag%2C%20ich%20habe%20eine%20Frage%3A';

// Zusatz bei «mehr als 3 Stunden», wörtlich wie im Rechner (D1).
const WICHTIG =
  'Wichtig: Die Krankenversicherung vergütet die Grundpflege, nicht die Präsenz rund um die Uhr. ' +
  'Wie viele Stunden bei Ihnen anerkannt werden, zeigt die Abklärung – und im Gespräch zeigen wir ' +
  'Ihnen, was zusätzlich möglich ist: Betreuung, Entlastung, Hilflosenentschädigung, Ergänzungsleistungen.';

/** Mail mit dem Ergebnis an die angegebene Adresse; stufe aus pruefeErgebnis(). */
export function mailErgebnis({ stufe }) {
  const w = ergebnis(stufe);
  // «mehr als 3» rechnet mit 3 Stunden: im Rechenweg steht diese Stufe.
  const gerechnet = KONFIG.stufen.find((s) => s.stunden === stufe.stunden && !s.mehr) ?? stufe;
  const text = [
    'Guten Tag',
    '',
    'Hier ist Ihre Schätzung aus dem Lohnrechner der Pflegeunion.',
    '',
    `Grundpflege pro Tag: ${stufe.text}`,
    `Ihr Lohn mit Pflegehelferkurs: ${chf(w.monatMitKurs, w.mehr)} brutto pro Monat, ${chf(w.jahrMitKurs, w.mehr)} pro Jahr`,
    `Bis zum Pflegehelferkurs: ${chf(w.monatEinstieg, w.mehr)} brutto pro Monat`,
    ...(w.mehr ? ['', WICHTIG] : []),
    '',
    `So rechnen wir: ${gerechnet.text} × ${KONFIG.TAGE_MONAT} Tage × CHF ${KONFIG.SATZ_KURS.toFixed(2)}, gerundet auf zehn Franken. ` +
      'Wir rechnen mit sechs Einsatztagen pro Woche, weil das Gesetz einen freien Tag vorschreibt. ' +
      'Den Pflegehelferkurs bezahlen wir.',
    '',
    'Das Ergebnis ist eine Schätzung. Verbindlich wird Ihre Zahl nach der kostenlosen Abklärung bei Ihnen zu Hause.',
    '',
    'Fragen? Rufen Sie uns an: 041 784 26 55, Mo bis Fr, 08.00–17.00 Uhr.',
    `Lieber schreiben? Auf WhatsApp: ${WHATSAPP}`,
    'Oder antworten Sie einfach auf diese E-Mail.',
    '',
    'Freundliche Grüsse',
    'Pflegeunion Schweiz',
    'Grundstrasse 4b · 6343 Rotkreuz',
    '041 784 26 55 · info@pflegeunion.ch',
    '',
    'Ihre E-Mail-Adresse haben wir nur für diese Nachricht verwendet und nicht gespeichert.',
  ].join('\n');
  return { betreff: BETREFF_ERGEBNIS, text };
}
