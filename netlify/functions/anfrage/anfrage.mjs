/*
 * Netlify Function: Anfrageformular (Konzept D2) über Microsoft Graph
 * versenden. Erreichbar unter /api/anfrage (config.path).
 *
 * Ablauf: Das Formular in Anfrage.astro sendet ohne JavaScript ganz normal
 * (POST, application/x-www-form-urlencoded). Die Funktion prüft die Felder,
 * schickt die Anfrage an MAIL_TO und, wenn eine E-Mail angegeben ist, eine
 * Eingangsbestätigung. Sie antwortet mit 303 zurück auf die Seite, von der
 * die Anfrage kam: #anfrage-gesendet oder #anfrage-fehler (Anzeige per
 * :target in Anfrage.astro). Rücksprung nur auf eigene Pfade.
 *
 * Spam (Honeypot gefüllt oder schneller als 3 Sekunden): Antwort wie bei
 * Erfolg, es wird nichts verschickt. Schlägt nur die Bestätigung fehl, gilt
 * die Anfrage als gesendet; schlägt die Mail an MAIL_TO fehl, Fehler.
 *
 * Rate Limit (Netlify, config.rateLimit): höchstens 5 Aufrufe pro Minute je
 * IP und Domain. Darüber leitet Netlify die Anfrage intern auf
 * /api/anfrage-gebremst um (netlify/functions/anfrage-gebremst.mjs), die mit
 * dem Fehler-Anker antwortet; diese Funktion läuft dann nicht.
 *
 * Datenschutz: Nichts wird gespeichert (keine Netlify Forms, keine
 * Drittdienste). Das Log enthält nie Formularinhalte oder Werte der
 * Umgebung, nur Status, Feldnamen, Graph-Fehlercode und Request-ID.
 */
import { pruefe, sichererPfad, spamGrund } from './felder.mjs';
import { mailAnfrage, mailBestaetigung } from './mail.mjs';
import { GraphFehler, KonfigFehler, leseUmgebung, sendeMail } from './graph.mjs';

// Netlify liest config statisch aus dem Quelltext: nur Literale verwenden.
// aggregateBy muss eine Liste sein, sonst zählt Netlify nur je Domain.
export const config = {
  path: '/api/anfrage',
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
    action: 'rewrite',
    to: '/api/anfrage-gebremst',
  },
};

export const GESENDET = 'anfrage-gesendet';
export const FEHLER = 'anfrage-fehler';

// Obergrenze für den Formularinhalt (3000 Zeichen Nachricht, kodiert).
const MAX_BYTES = 64 * 1024;

// Zeitlimits je Aufruf; zusammen unter den 10 Sekunden einer Netlify Function.
const ZEIT = { token: 3000, anfrage: 3500, bestaetigung: 2000 };

/** 303 zurück auf die Seite, mit Anker. */
export function zurueck(pfad, anker) {
  return new Response(null, {
    status: 303,
    headers: { location: `${pfad}#${anker}`, 'cache-control': 'no-store' },
  });
}

/** Eine Zeile ins Log, nur mit festen Angaben (nie Formularinhalte). */
export function protokoll(log, art, { status, ...angaben }) {
  log[art](JSON.stringify({ anfrage: status, ...angaben }));
}

/** Fehler fürs Log: nur Schritt, Status, Code und Request-ID bzw. Name der Variable. */
function fehlerEintrag(fehler, schritt) {
  if (fehler instanceof GraphFehler) {
    const { status, code, requestId, clientRequestId } = fehler;
    return { status: 'fehler', schritt: fehler.schritt, httpStatus: status, code, requestId, clientRequestId };
  }
  if (fehler instanceof KonfigFehler) return { status: 'fehler', schritt, meldung: fehler.message };
  const code = fehler?.cause?.code ?? fehler?.code;
  return {
    status: 'fehler',
    schritt,
    fehler: typeof fehler?.name === 'string' ? fehler.name.slice(0, 40) : 'unbekannt',
    code: typeof code === 'string' ? code.slice(0, 40) : undefined,
  };
}

/** Formularinhalt (urlencoded, höchstens MAX_BYTES) oder null. */
export async function leseFormular(req) {
  const typ = (req.headers.get('content-type') ?? '').toLowerCase();
  if (!typ.startsWith('application/x-www-form-urlencoded')) return null;
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES) return null;
  const text = await req.text();
  if (Buffer.byteLength(text) > MAX_BYTES) return null;
  return new URLSearchParams(text);
}

/**
 * Bearbeitet eine Anfrage. Umgebung, fetch, Uhr und Log lassen sich für
 * Tests ersetzen (gemockter Graph, keine echten Mails).
 */
export async function bearbeite(req, { env = process.env, fetch = globalThis.fetch, jetzt = Date.now, log = console } = {}) {
  if (req.method !== 'POST') {
    return new Response('Nur POST.', { status: 405, headers: { allow: 'POST', 'cache-control': 'no-store' } });
  }
  let ziel = '/';
  let schritt = 'formular';
  try {
    const formular = await leseFormular(req);
    if (!formular) {
      protokoll(log, 'info', { status: 'ungueltig', feld: 'formular' });
      return zurueck(ziel, FEHLER);
    }

    const pfad = sichererPfad(formular.get('quellseite'));
    if (pfad) ziel = pfad;

    const spam = spamGrund(formular);
    if (spam) {
      protokoll(log, 'info', { status: 'spam', grund: spam });
      return zurueck(ziel, GESENDET);
    }

    if (!pfad) {
      protokoll(log, 'info', { status: 'ungueltig', feld: 'quellseite' });
      return zurueck(ziel, FEHLER);
    }

    const { werte, fehler: ungueltig } = pruefe(formular);
    if (ungueltig) {
      protokoll(log, 'info', { status: 'ungueltig', feld: ungueltig });
      return zurueck(ziel, FEHLER);
    }

    const { konfig, fehlend } = leseUmgebung(env);
    if (fehlend) {
      protokoll(log, 'error', { status: 'fehler', meldung: `Umgebungsvariable fehlt: ${fehlend.join(', ')}` });
      return zurueck(ziel, FEHLER);
    }

    const zeit = jetzt();
    const seite = `${new URL(req.url).origin}${pfad}`;
    const optionen = { fetch, jetzt, zeitTokenMs: ZEIT.token };

    schritt = 'anfrage';
    await sendeMail(
      konfig,
      { ...mailAnfrage(werte, { seite, zeit }), an: konfig.mailTo, antwortAn: werte.email },
      { ...optionen, schritt, zeitMs: ZEIT.anfrage },
    );

    let bestaetigung = 'keine';
    if (werte.email) {
      schritt = 'bestaetigung';
      try {
        await sendeMail(
          konfig,
          { ...mailBestaetigung(werte), an: werte.email, antwortAn: konfig.mailTo },
          { ...optionen, schritt, zeitMs: ZEIT.bestaetigung },
        );
        bestaetigung = 'gesendet';
      } catch (fehler) {
        protokoll(log, 'error', fehlerEintrag(fehler, schritt));
        bestaetigung = 'fehler';
      }
    }

    protokoll(log, 'info', { status: 'gesendet', bestaetigung });
    return zurueck(ziel, GESENDET);
  } catch (fehler) {
    protokoll(log, 'error', fehlerEintrag(fehler, schritt));
    return zurueck(ziel, FEHLER);
  }
}

export default (req) => bearbeite(req);
