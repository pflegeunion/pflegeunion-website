/*
 * Netlify Function: Antwort, wenn das Rate Limit von /api/anfrage
 * überschritten ist (config.rateLimit in anfrage/anfrage.mjs, 5 pro Minute
 * je IP und Domain). Netlify leitet die Anfrage dann intern hierher um.
 * Verschickt nichts und antwortet mit 303 auf die Seite, von der die
 * Anfrage kam, mit #anfrage-fehler. Die Seite stammt aus dem Feld
 * «quellseite», sonst aus dem Referer, sonst «/»; Rücksprung nur auf eigene
 * Pfade. Log ohne Inhalte.
 */
import { FEHLER, leseFormular, protokoll, zurueck } from './anfrage/anfrage.mjs';
import { sichererPfad } from './anfrage/felder.mjs';

export const config = { path: '/api/anfrage-gebremst' };

/** Pfad aus dem Referer (nur der Pfad, nie Host oder Protokoll). */
function refererPfad(req) {
  try {
    return new URL(req.headers.get('referer') ?? '').pathname;
  } catch {
    return null;
  }
}

export async function bearbeite(req, { log = console } = {}) {
  let formular = null;
  try {
    if (req.method === 'POST') formular = await leseFormular(req);
  } catch {
    formular = null;
  }
  const pfad = sichererPfad(formular?.get('quellseite')) ?? sichererPfad(refererPfad(req)) ?? '/';
  protokoll(log, 'info', { status: 'gebremst' });
  return zurueck(pfad, FEHLER);
}

export default (req) => bearbeite(req);
