/*
 * Felder des Anfrageformulars (Konzept D2) und ihre Prüfung auf dem Server.
 *
 * Eine Quelle für Anfrage.astro (Auswahlwerte, maxlength, pattern) und die
 * Netlify Function (Prüfung, Bezeichnungen in der Mail). Bezeichnungen und
 * Werte wörtlich aus D2; sie ändern sich nur zusammen mit dem Konzept.
 * Reihenfolge und Nummern wie in D2: Pflicht sind Feld 1, 3, 4 und 6.
 *
 * Dazu das kleine Formular «Ergebnis per E-Mail» der Lohnrechner-Seite (D1,
 * Lohnrechner.astro, Feld art=ergebnis): E-Mail (Pflicht, dieselben Regeln
 * wie Feld 5), Stunden (einer der Werte aus KONFIG.stufen) und das Kästchen
 * «ohne_kurs» (leer oder «ja»). Beträge nimmt der Server nie vom Browser.
 */
import { KONFIG } from '../../../src/scripts/lohnrechner.js';

export const ANLIEGEN = [
  'Anstellung als pflegender Angehöriger',
  'Betreuung und Hauswirtschaft',
  'Ich bin Fachperson (Arzt, Spital, Beratungsstelle)',
  'Etwas anderes',
];
export const KURS = ['Ja', 'Nein, noch nicht'];
export const ERREICHBAR = ['Vormittag', 'Nachmittag', 'Abend'];

/**
 * Formatregeln, im Browser als pattern (Anfrage.astro) und auf dem Server
 * dieselben. Der Browser setzt sie als ^(?:…)$ mit dem Flag v um, der
 * Server mit u (gleiches Ergebnis, auch auf älterem Node).
 *   telefon  mindestens 9 Ziffern; Leerzeichen, +, /, -, Klammern und
 *            Punkte zählen nicht mit; andere Zeichen nicht erlaubt
 *            (ausländische Nummern bleiben erlaubt)
 *   email    zusätzlich zur Regel von type="email": nach dem letzten Punkt
 *            der Domain mindestens zwei Buchstaben («michel@g» abgewiesen)
 */
export const MUSTER = {
  telefon: String.raw`[\s+\/\-\(\)\.]*(?:[0-9][\s+\/\-\(\)\.]*){9,}`,
  email: String.raw`.+\.[A-Za-z]{2,}`,
};

const REGEL = Object.fromEntries(
  Object.entries(MUSTER).map(([name, muster]) => [name, new RegExp(`^(?:${muster})$`, 'u')]),
);

/** Höchstlängen in Zeichen; Anfrage.astro setzt sie als maxlength. */
export const LAENGE = {
  name: 120,
  telefon: 40,
  email: 254,
  ort: 80,
  nachricht: 3000,
  // Versteckte Felder aus dem Lohnrechner.
  stunden: 40,
  ergebnis: 120,
};

export const FELDER = [
  { nr: 1, name: 'anliegen', bezeichnung: 'Ich interessiere mich für:', pflicht: true, werte: ANLIEGEN },
  { nr: 2, name: 'kurs', bezeichnung: 'Haben Sie einen Pflegehelferkurs abgeschlossen?', werte: KURS },
  { nr: 3, name: 'name', bezeichnung: 'Vorname und Name', pflicht: true },
  { nr: 4, name: 'telefon', bezeichnung: 'Telefon', pflicht: true, muster: 'telefon' },
  { nr: 5, name: 'email', bezeichnung: 'E-Mail (freiwillig)', email: true, muster: 'email' },
  { nr: 6, name: 'ort', bezeichnung: 'Postleitzahl und Ort der gepflegten Person', pflicht: true },
  { nr: 7, name: 'erreichbar', bezeichnung: 'Wann erreichen wir Sie am besten? (freiwillig)', werte: ERREICHBAR },
  { nr: 8, name: 'nachricht', bezeichnung: 'Ihre Nachricht (freiwillig)', mehrzeilig: true },
];

/** Versteckte Felder mit den Werten aus dem Lohnrechner. */
const RECHNER = ['stunden', 'ergebnis'];

/** Wert des versteckten Felds «art» beim Formular «Ergebnis per E-Mail». */
export const ART_ERGEBNIS = 'ergebnis';

/** Erlaubte Werte des Kästchens «Ich habe den Pflegehelferkurs noch nicht abgeschlossen.». */
const OHNE_KURS = 'ja';

/** Spam-Schutz (D2): Zeitprüfung ab dem Laden der Seite. */
export const MINDESTDAUER_MS = 3000;

// Gleiche Regel wie der Browser bei type="email" (HTML-Standard).
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Steuerzeichen ausser Tabulator und Zeilenumbruch.
const STEUERZEICHEN = /[\u0000-\u0008\u000B-\u001F\u007F]/g;

/** Wert säubern: einzeilige Felder ohne Umbrüche, mehrzeilige mit \n. */
function saeubere(wert, mehrzeilig) {
  const text = String(wert ?? '').normalize('NFC').replace(/\r\n?/g, '\n');
  if (mehrzeilig) return text.replace(STEUERZEICHEN, '').trim();
  return text.replace(/\s+/g, ' ').replace(STEUERZEICHEN, '').trim();
}

/**
 * Prüft die acht Felder und die Rechnerwerte. Gibt { werte } zurück oder
 * { fehler: name } mit dem Namen des ersten ungültigen Felds (nie den Wert).
 */
export function pruefe(formular) {
  const werte = {};
  for (const feld of [...FELDER, ...RECHNER.map((name) => ({ name }))]) {
    const wert = saeubere(formular.get(feld.name), feld.mehrzeilig);
    if (!wert) {
      if (feld.pflicht) return { fehler: feld.name };
    } else if (
      (feld.werte && !feld.werte.includes(wert)) ||
      (LAENGE[feld.name] && wert.length > LAENGE[feld.name]) ||
      (feld.email && !EMAIL.test(wert)) ||
      (feld.muster && !REGEL[feld.muster].test(wert))
    ) {
      return { fehler: feld.name };
    }
    werte[feld.name] = wert;
  }
  return { werte };
}

/**
 * Prüft das Formular «Ergebnis per E-Mail». Gibt { werte: { email, stufe,
 * ohneKurs } } zurück (stufe aus KONFIG.stufen) oder { fehler: name } mit
 * dem Namen des ersten ungültigen Felds (nie den Wert).
 */
export function pruefeErgebnis(formular) {
  const email = saeubere(formular.get('email'));
  if (!email || email.length > LAENGE.email || !EMAIL.test(email) || !REGEL.email.test(email)) {
    return { fehler: 'email' };
  }
  const stufe = KONFIG.stufen.find((s) => s.wert === formular.get('stunden'));
  if (!stufe) return { fehler: 'stunden' };
  const kurs = formular.get('ohne_kurs');
  if (kurs !== null && kurs !== OHNE_KURS) return { fehler: 'ohne_kurs' };
  return { werte: { email, stufe, ohneKurs: kurs === OHNE_KURS } };
}

/**
 * Rücksprung nur auf eigene Pfade: beginnt mit «/», kein «//», kein
 * Protokoll, kein Backslash, keine Abfrage und kein Anker. Sonst null.
 */
export function sichererPfad(wert) {
  if (typeof wert !== 'string' || wert.length > 200) return null;
  return /^\/[A-Za-z0-9\-._~%/]*$/.test(wert) && !wert.includes('//') ? wert : null;
}

/**
 * Spam-Schutz ohne Captcha (D2): Honeypot «webseite» gefüllt oder weniger
 * als MINDESTDAUER_MS zwischen Laden und Absenden. Das Feld «dauer» füllt
 * das Menü-Skript (Header.astro) beim Absenden mit performance.now(); ohne
 * JavaScript bleibt es leer, dann entfällt nur die Zeitprüfung.
 * Gibt den Grund zurück ('honeypot', 'zeit') oder null.
 */
export function spamGrund(formular) {
  if ((formular.get('webseite') ?? '') !== '') return 'honeypot';
  const dauer = (formular.get('dauer') ?? '').trim();
  if (dauer === '') return null;
  if (!/^\d{1,12}(\.\d{1,20})?$/.test(dauer) || Number(dauer) < MINDESTDAUER_MS) return 'zeit';
  return null;
}
