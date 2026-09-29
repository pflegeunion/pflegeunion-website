/*
 * Versand über Microsoft Graph (sendMail) mit App-Anmeldung per Zertifikat.
 *
 * Anmeldung: Client-Credentials mit Client Assertion (RFC 7523), ohne
 * Client Secret. Die Assertion ist ein JWT, signiert mit PS256 und dem
 * privaten Schlüssel des Zertifikats; im Kopf steht der SHA-256-
 * Fingerabdruck als x5t#S256 (wie MSAL mit clientCertificate.thumbprintSha256).
 * Nur node:crypto und fetch, keine Abhängigkeiten.
 *
 * Das Token wird innerhalb der laufenden Funktion zwischengespeichert (im
 * Speicher, bis 5 Minuten vor Ablauf), nicht darüber hinaus.
 *
 * Fehler tragen nur Schritt, HTTP-Status, Fehlercode und Request-ID, nie
 * Formularinhalte, Fehlermeldungen von Microsoft oder Werte der Umgebung.
 */
import { constants, createPrivateKey, randomUUID, sign } from 'node:crypto';

/** Umgebungsvariablen (nur Namen; Werte stehen nur bei Netlify). */
export const VARIABLEN = [
  'MS_TENANT_ID',
  'MS_CLIENT_ID',
  'MS_CERT_THUMBPRINT_SHA256',
  'MS_CERT_PRIVATE_KEY_BASE64',
  'MAIL_FROM',
  'MAIL_TO',
];

const SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH = 'https://graph.microsoft.com/v1.0';
const ASSERTION_S = 600;
const PUFFER_S = 300;

/** Fehler bei Microsoft (Token oder sendMail). */
export class GraphFehler extends Error {
  constructor(schritt, { status, code, requestId, clientRequestId } = {}) {
    super(`Microsoft Graph: ${schritt} fehlgeschlagen`);
    this.name = 'GraphFehler';
    Object.assign(this, { schritt, status, code, requestId, clientRequestId });
  }
}

/** Ungültige Umgebungsvariable: nennt den Namen, nie den Wert. */
export class KonfigFehler extends Error {
  constructor(variable, grund) {
    super(`Umgebungsvariable ${variable}: ${grund}`);
    this.name = 'KonfigFehler';
  }
}

/** Liest die Umgebung; { fehlend: [Namen] } oder { konfig }. */
export function leseUmgebung(env) {
  const fehlend = VARIABLEN.filter((name) => !String(env[name] ?? '').trim());
  if (fehlend.length) return { fehlend };
  const wert = (name) => String(env[name]).trim();
  return {
    konfig: {
      tenantId: wert('MS_TENANT_ID'),
      clientId: wert('MS_CLIENT_ID'),
      fingerabdruck: wert('MS_CERT_THUMBPRINT_SHA256'),
      schluesselBase64: wert('MS_CERT_PRIVATE_KEY_BASE64'),
      mailFrom: wert('MAIL_FROM'),
      mailTo: wert('MAIL_TO'),
    },
  };
}

function base64url(daten) {
  return Buffer.from(daten).toString('base64url');
}

/** Privater Schlüssel aus MS_CERT_PRIVATE_KEY_BASE64 (PEM, Base64 in einer Zeile). */
function privaterSchluessel(base64) {
  const pem = base64.includes('-----BEGIN') ? base64 : Buffer.from(base64, 'base64').toString('utf8');
  let schluessel;
  try {
    schluessel = createPrivateKey(pem);
  } catch {
    throw new KonfigFehler('MS_CERT_PRIVATE_KEY_BASE64', 'kein lesbarer privater Schlüssel (PEM, unverschlüsselt)');
  }
  if (schluessel.asymmetricKeyType !== 'rsa') {
    throw new KonfigFehler('MS_CERT_PRIVATE_KEY_BASE64', 'kein RSA-Schlüssel');
  }
  return schluessel;
}

/** SHA-256-Fingerabdruck (Hex) als base64url für x5t#S256. */
function x5tS256(hex) {
  const rein = hex.replace(/[\s:]/g, '');
  if (!/^[0-9a-fA-F]{64}$/.test(rein)) {
    throw new KonfigFehler('MS_CERT_THUMBPRINT_SHA256', 'kein SHA-256-Fingerabdruck (64 Hex-Zeichen)');
  }
  return base64url(Buffer.from(rein, 'hex'));
}

/** Tokenadresse des Tenants (v2.0), zugleich aud der Assertion. */
export function tokenAdresse(tenantId) {
  return `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
}

/** Client Assertion: JWT mit PS256, x5t#S256, 10 Minuten gültig. */
export function clientAssertion(konfig, jetztMs) {
  const kopf = { alg: 'PS256', typ: 'JWT', 'x5t#S256': x5tS256(konfig.fingerabdruck) };
  const iat = Math.floor(jetztMs / 1000);
  const inhalt = {
    aud: tokenAdresse(konfig.tenantId),
    iss: konfig.clientId,
    sub: konfig.clientId,
    jti: randomUUID(),
    iat,
    nbf: iat,
    exp: iat + ASSERTION_S,
  };
  const daten = `${base64url(JSON.stringify(kopf))}.${base64url(JSON.stringify(inhalt))}`;
  const signatur = sign('sha256', Buffer.from(daten), {
    key: privaterSchluessel(konfig.schluesselBase64),
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
  });
  return `${daten}.${base64url(signatur)}`;
}

let tokenSpeicher = null;

/** Zwischenspeicher leeren (nach 401 von Graph und in Tests). */
export function leereTokenSpeicher() {
  tokenSpeicher = null;
}

/** Kurzer Fehlercode aus einer Antwort (nie die Meldung). */
function kurz(wert) {
  return typeof wert === 'string' || typeof wert === 'number' ? String(wert).slice(0, 80) : undefined;
}

async function json(antwort) {
  try {
    return await antwort.json();
  } catch {
    return {};
  }
}

async function holeToken(konfig, { fetch, jetzt, zeitMs }) {
  const kennung = `${konfig.tenantId}|${konfig.clientId}|${konfig.fingerabdruck}`;
  if (tokenSpeicher && tokenSpeicher.kennung === kennung && tokenSpeicher.ablauf > jetzt()) {
    return tokenSpeicher.token;
  }
  const clientRequestId = randomUUID();
  const antwort = await fetch(tokenAdresse(konfig.tenantId), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'client-request-id': clientRequestId },
    body: new URLSearchParams({
      client_id: konfig.clientId,
      scope: SCOPE,
      grant_type: 'client_credentials',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: clientAssertion(konfig, jetzt()),
    }).toString(),
    signal: AbortSignal.timeout(zeitMs),
  });
  const daten = await json(antwort);
  if (!antwort.ok || typeof daten.access_token !== 'string') {
    const aadsts = Array.isArray(daten.error_codes) && daten.error_codes.length ? ` AADSTS${daten.error_codes[0]}` : '';
    throw new GraphFehler('token', {
      status: antwort.status,
      code: kurz(`${daten.error ?? 'ohne Code'}${aadsts}`),
      requestId: kurz(daten.trace_id),
      clientRequestId,
    });
  }
  const gueltigS = Math.max(0, (Number(daten.expires_in) || 0) - PUFFER_S);
  tokenSpeicher = { kennung, token: daten.access_token, ablauf: jetzt() + gueltigS * 1000 };
  return daten.access_token;
}

/**
 * Sendet eine Mail aus MAIL_FROM (reiner Text). schritt benennt den Versand
 * in Fehlern ('anfrage' oder 'bestaetigung'). Wirft GraphFehler oder
 * KonfigFehler; bei Erfolg (202) ohne Rückgabe.
 */
export async function sendeMail(konfig, mail, { fetch, jetzt, schritt, zeitTokenMs, zeitMs }) {
  const token = await holeToken(konfig, { fetch, jetzt, zeitMs: zeitTokenMs });
  const clientRequestId = randomUUID();
  const absender = encodeURIComponent(konfig.mailFrom).replace(/%40/g, '@');
  const nachricht = {
    subject: mail.betreff,
    body: { contentType: 'Text', content: mail.text },
    toRecipients: [{ emailAddress: { address: mail.an } }],
  };
  if (mail.antwortAn) nachricht.replyTo = [{ emailAddress: { address: mail.antwortAn } }];
  const antwort = await fetch(`${GRAPH}/users/${absender}/sendMail`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json; charset=utf-8',
      'client-request-id': clientRequestId,
      'return-client-request-id': 'true',
    },
    body: JSON.stringify({ message: nachricht, saveToSentItems: mail.speichern }),
    signal: AbortSignal.timeout(zeitMs),
  });
  if (antwort.ok) return;
  const daten = await json(antwort);
  // Abgelaufenes oder widerrufenes Token: beim nächsten Aufruf neu holen.
  if (antwort.status === 401) leereTokenSpeicher();
  throw new GraphFehler(schritt, {
    status: antwort.status,
    code: kurz(daten?.error?.code),
    requestId: kurz(antwort.headers.get('request-id') ?? daten?.error?.innerError?.['request-id']),
    clientRequestId,
  });
}
