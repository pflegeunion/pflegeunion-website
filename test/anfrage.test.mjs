/**
 * Prüft den Versand des Anfrageformulars (Konzept D2) über die Netlify
 * Function netlify/functions/anfrage/ mit gemocktem Microsoft Graph: keine
 * echten Mails, keine echten Zugangsdaten (Testschlüssel wird hier erzeugt).
 * Nach jedem Aufruf wird geprüft, dass das Log keine Formularinhalte und
 * keine Werte der Umgebung enthält.
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { constants, createHash, generateKeyPairSync, verify } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { bearbeite, config } from '../netlify/functions/anfrage/anfrage.mjs';
import { FELDER, LAENGE, sichererPfad } from '../netlify/functions/anfrage/felder.mjs';
import { VARIABLEN, leereTokenSpeicher } from '../netlify/functions/anfrage/graph.mjs';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });
const FINGERABDRUCK = createHash('sha256').update('Testzertifikat').digest('hex');

const ENV = {
  MS_TENANT_ID: 'test-tenant',
  MS_CLIENT_ID: 'test-client-id',
  MS_CERT_THUMBPRINT_SHA256: FINGERABDRUCK,
  MS_CERT_PRIVATE_KEY_BASE64: Buffer.from(PEM).toString('base64'),
  MAIL_FROM: 'absender@beispiel.test',
  MAIL_TO: 'empfang@beispiel.test',
};

const FORMULAR = {
  anliegen: 'Anstellung als pflegender Angehöriger',
  kurs: 'Nein, noch nicht',
  name: 'Anna Beispielname',
  telefon: '079 555 12 34',
  email: '',
  ort: '6300 Zug',
  erreichbar: 'Vormittag',
  nachricht: 'Erste Zeile der Nachricht\r\nZweite Zeile der Nachricht',
  stunden: '2 Stunden',
  ergebnis: "rund CHF 1'770.– pro Monat bis zum Pflegehelferkurs",
  quellseite: '/',
  dauer: '5234.5',
  webseite: '',
};

// 29.09.2026, 12:05 UTC = 14:05 Uhr in Zürich (Sommerzeit).
const JETZT = Date.UTC(2026, 8, 29, 12, 5);
const GESENDET = '/#anfrage-gesendet';
const FEHLER = '/#anfrage-fehler';

const BESTAETIGUNG = `Guten Tag

Vielen Dank. Ihre Anfrage ist bei uns eingegangen. Eine Fachperson meldet sich innert 24 Stunden an Werktagen bei Ihnen. Wenn es dringend ist: 041 784 26 55.

Ihr Anliegen: Anstellung als pflegender Angehöriger

Freundliche Grüsse
Pflegeunion Schweiz
Grundstrasse 4b · 6343 Rotkreuz
041 784 26 55 · info@pflegeunion.ch

Diese Nachricht wurde automatisch versendet. Wenn Sie darauf antworten, erreicht Ihre Nachricht info@pflegeunion.ch.`;

/**
 * Gemockter Microsoft Graph. token, anfrage und bestaetigung: HTTP-Status
 * oder 'netz' (Verbindungsfehler). Fehlermeldungen enthalten absichtlich
 * Inhalte, die nie ins Log dürfen.
 */
function graph({ token = 200, anfrage = 202, bestaetigung = 202 } = {}) {
  const aufrufe = [];
  const fetch = async (url, init) => {
    aufrufe.push({ url: String(url), init });
    if (String(url).startsWith('https://login.microsoftonline.com/')) {
      if (token === 'netz') throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
      if (token !== 200) {
        return Response.json(
          {
            error: 'invalid_client',
            error_description: `AADSTS700027: Client assertion invalid. Client ${ENV.MS_CLIENT_ID}.`,
            error_codes: [700027],
            trace_id: 'trace-0001',
            correlation_id: 'korrelation-0001',
          },
          { status: token },
        );
      }
      return Response.json({ token_type: 'Bearer', expires_in: 3599, access_token: 'test-token-geheim' });
    }
    const daten = JSON.parse(init.body);
    const status = daten.message.subject === 'Ihre Anfrage bei der Pflegeunion' ? bestaetigung : anfrage;
    if (status === 'netz') throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
    if (status === 202) return new Response(null, { status: 202 });
    const empfaenger = daten.message.toRecipients[0].emailAddress.address;
    return Response.json(
      { error: { code: 'ErrorAccessDenied', message: `Access denied for ${empfaenger}: ${daten.message.subject}` } },
      { status, headers: { 'request-id': 'graph-request-0001' } },
    );
  };
  const tokenAufrufe = () => aufrufe.filter((a) => a.url.startsWith('https://login.microsoftonline.com/'));
  const mails = () => aufrufe.filter((a) => a.url.endsWith('/sendMail')).map((a) => JSON.parse(a.init.body));
  return { fetch, aufrufe, tokenAufrufe, mails };
}

const alleLogZeilen = [];

/** Werte, die nie im Log stehen dürfen: Formularinhalte, Umgebung, Token. */
function geheim(daten, env) {
  const texte = [
    ...Object.entries(daten)
      .filter(([name]) => !['quellseite', 'dauer'].includes(name))
      .flatMap(([, wert]) => String(wert).split(/\r?\n/)),
    ...Object.values(env).map(String),
    'test-token-geheim',
  ];
  return texte.map((t) => t.trim()).filter((t) => t.length >= 4);
}

/** Schickt ein Formular an die Funktion; Konsole und Log werden mitgeschrieben. */
async function sende(felder = {}, optionen = {}) {
  const { env = ENV, g = graph(), jetzt = () => JETZT, methode = 'POST', typ = 'application/x-www-form-urlencoded', koerper } =
    optionen;
  const daten = Object.fromEntries(Object.entries({ ...FORMULAR, ...felder }).filter(([, w]) => w !== undefined));
  const req = new Request('https://pflegeunion.ch/api/anfrage', {
    method: methode,
    headers: { 'content-type': typ },
    body: methode === 'POST' ? (koerper ?? new URLSearchParams(daten).toString()) : undefined,
  });
  const zeilen = [];
  const log = Object.fromEntries(['log', 'info', 'warn', 'error'].map((art) => [art, (text) => zeilen.push(text)]));
  // Auch direkte Ausgaben auf die Konsole zählen (dürfte es nicht geben).
  const konsole = { ...console };
  for (const art of ['log', 'info', 'warn', 'error', 'debug']) console[art] = (...a) => zeilen.push(a.join(' '));
  let antwort;
  try {
    antwort = await bearbeite(req, { env, fetch: g.fetch, jetzt, log });
  } finally {
    Object.assign(console, konsole);
  }
  for (const zeile of zeilen) {
    for (const wert of geheim(daten, env)) {
      assert.ok(!zeile.includes(wert), `Log enthält einen Formular- oder Umgebungswert: ${zeile}`);
    }
  }
  alleLogZeilen.push(...zeilen);
  return { antwort, ort: antwort.headers.get('location'), g, zeilen, mails: g.mails() };
}

const logEintraege = (zeilen) => zeilen.map((z) => JSON.parse(z));

beforeEach(() => leereTokenSpeicher());

test('Funktion liegt unter /api/anfrage', () => {
  assert.equal(config.path, '/api/anfrage');
});

test('Erfolg ohne E-Mail: nur Mail an MAIL_TO, 303 auf #anfrage-gesendet', async () => {
  const { antwort, ort, g, mails, zeilen } = await sende();
  assert.equal(antwort.status, 303);
  assert.equal(ort, GESENDET);
  assert.equal(antwort.headers.get('cache-control'), 'no-store');
  assert.equal(mails.length, 1);

  const [token] = g.tokenAufrufe();
  assert.equal(token.url, 'https://login.microsoftonline.com/test-tenant/oauth2/v2.0/token');
  const parameter = new URLSearchParams(token.init.body);
  assert.equal(parameter.get('grant_type'), 'client_credentials');
  assert.equal(parameter.get('client_id'), ENV.MS_CLIENT_ID);
  assert.equal(parameter.get('scope'), 'https://graph.microsoft.com/.default');
  assert.equal(parameter.get('client_assertion_type'), 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
  assert.equal(parameter.has('client_secret'), false);

  const aufruf = g.aufrufe.find((a) => a.url.endsWith('/sendMail'));
  assert.equal(aufruf.url, 'https://graph.microsoft.com/v1.0/users/absender@beispiel.test/sendMail');
  assert.equal(aufruf.init.headers.authorization, 'Bearer test-token-geheim');

  const [mail] = mails;
  assert.equal(mail.saveToSentItems, true);
  assert.equal(mail.message.subject, 'Anfrage Webseite: Anstellung als pflegender Angehöriger – Anna Beispielname');
  assert.equal(mail.message.body.contentType, 'Text');
  assert.deepEqual(mail.message.toRecipients, [{ emailAddress: { address: ENV.MAIL_TO } }]);
  assert.equal(mail.message.replyTo, undefined);

  const text = mail.message.body.content;
  for (const feld of FELDER) assert.ok(text.includes(feld.bezeichnung), feld.bezeichnung);
  for (const zeile of [
    'Ich interessiere mich für: Anstellung als pflegender Angehöriger',
    'Haben Sie einen Pflegehelferkurs abgeschlossen? Nein, noch nicht',
    'Vorname und Name: Anna Beispielname',
    'Telefon: 079 555 12 34',
    'E-Mail (freiwillig): –',
    'Postleitzahl und Ort der gepflegten Person: 6300 Zug',
    'Wann erreichen wir Sie am besten? (freiwillig): Vormittag',
    'Ihre Nachricht (freiwillig):\nErste Zeile der Nachricht\nZweite Zeile der Nachricht',
    'Stunden pro Tag: 2 Stunden',
    "Schätzung: rund CHF 1'770.– pro Monat bis zum Pflegehelferkurs",
    'Kästchen «Ich habe den Pflegehelferkurs noch nicht abgeschlossen.»: angekreuzt',
    'Seite: https://pflegeunion.ch/',
    'Eingegangen: 29.09.2026, 14:05 Uhr',
    'Keine E-Mail-Adresse angegeben. Bitte telefonisch antworten.',
  ]) {
    assert.ok(text.includes(zeile), zeile);
  }
  assert.equal(text.includes('\r'), false);
  // Reihenfolge der Felder wie in D2 (Feld 1 bis 8).
  const positionen = FELDER.map((f) => text.indexOf(f.bezeichnung));
  assert.deepEqual([...positionen].sort((a, b) => a - b), positionen);

  assert.deepEqual(logEintraege(zeilen), [{ anfrage: 'gesendet', bestaetigung: 'keine' }]);
});

test('Erfolg mit E-Mail: Anfrage mit replyTo, Bestätigung an die Person', async () => {
  const email = 'anna.beispiel@beispiel.test';
  const { ort, g, mails, zeilen } = await sende({ email, quellseite: '/lohnrechner/' });
  assert.equal(ort, '/lohnrechner/#anfrage-gesendet');
  assert.equal(mails.length, 2);
  assert.equal(g.tokenAufrufe().length, 1, 'ein Token für beide Mails');

  const [anfrage, bestaetigung] = mails;
  assert.deepEqual(anfrage.message.replyTo, [{ emailAddress: { address: email } }]);
  assert.ok(anfrage.message.body.content.includes(`E-Mail (freiwillig): ${email}`));
  assert.ok(anfrage.message.body.content.includes('Seite: https://pflegeunion.ch/lohnrechner/'));
  assert.ok(anfrage.message.body.content.includes('Mit «Antworten» schreiben Sie direkt an die anfragende Person.'));

  assert.equal(bestaetigung.message.subject, 'Ihre Anfrage bei der Pflegeunion');
  assert.equal(bestaetigung.message.body.contentType, 'Text');
  assert.equal(bestaetigung.message.body.content, BESTAETIGUNG);
  assert.deepEqual(bestaetigung.message.toRecipients, [{ emailAddress: { address: email } }]);
  assert.deepEqual(bestaetigung.message.replyTo, [{ emailAddress: { address: ENV.MAIL_TO } }]);
  // Die Bestätigung wiederholt keine weiteren Angaben (keine Gesundheitsangaben zurück).
  for (const wert of [FORMULAR.name, FORMULAR.telefon, FORMULAR.ort, 'Erste Zeile', FORMULAR.stunden]) {
    assert.equal(bestaetigung.message.body.content.includes(wert), false, wert);
  }
  assert.deepEqual(logEintraege(zeilen), [{ anfrage: 'gesendet', bestaetigung: 'gesendet' }]);
});

test('Leere freiwillige Felder stehen mit «–», Kästchen leer als «nicht angekreuzt»', async () => {
  const leer = await sende({ kurs: undefined, erreichbar: undefined, nachricht: '', stunden: '', ergebnis: '' });
  const text = leer.mails[0].message.body.content;
  for (const zeile of [
    'Haben Sie einen Pflegehelferkurs abgeschlossen? –',
    'E-Mail (freiwillig): –',
    'Wann erreichen wir Sie am besten? (freiwillig): –',
    'Ihre Nachricht (freiwillig): –',
    'Stunden pro Tag: –',
    'Schätzung: –',
    'Kästchen «Ich habe den Pflegehelferkurs noch nicht abgeschlossen.»: –',
  ]) {
    assert.ok(text.includes(zeile), zeile);
  }
  const mitKurs = await sende({ ergebnis: "rund CHF 1'970.– pro Monat mit Pflegehelferkurs" });
  assert.ok(
    mitKurs.mails[0].message.body.content.includes(
      'Kästchen «Ich habe den Pflegehelferkurs noch nicht abgeschlossen.»: nicht angekreuzt',
    ),
  );
});

test('Pflichtfeld fehlt: Fehler-Anker, nichts gesendet', async () => {
  for (const name of ['anliegen', 'name', 'telefon', 'ort']) {
    for (const wert of [undefined, '', '   ']) {
      const { ort, g, zeilen } = await sende({ [name]: wert });
      assert.equal(ort, FEHLER, `${name}=${JSON.stringify(wert)}`);
      assert.equal(g.aufrufe.length, 0);
      assert.deepEqual(logEintraege(zeilen), [{ anfrage: 'ungueltig', feld: name }]);
    }
  }
});

test('Ungültige Werte (Feld 1, 2, 7, E-Mail, Längen): Fehler-Anker, nichts gesendet', async () => {
  const faelle = {
    anliegen: ['Werbung', 'Etwas anderes '.repeat(2)],
    kurs: ['Vielleicht'],
    erreichbar: ['Nachts'],
    email: ['keine-adresse', 'a@b@c', 'anna beispiel@beispiel.test'],
    name: ['x'.repeat(LAENGE.name + 1)],
    telefon: ['1'.repeat(LAENGE.telefon + 1)],
    ort: ['x'.repeat(LAENGE.ort + 1)],
    nachricht: ['x'.repeat(LAENGE.nachricht + 1)],
    stunden: ['x'.repeat(LAENGE.stunden + 1)],
    ergebnis: ['x'.repeat(LAENGE.ergebnis + 1)],
  };
  for (const [name, werte] of Object.entries(faelle)) {
    for (const wert of werte) {
      const { ort, g, zeilen } = await sende({ [name]: wert });
      assert.equal(ort, FEHLER, `${name}=${wert.slice(0, 30)}`);
      assert.equal(g.aufrufe.length, 0);
      assert.deepEqual(logEintraege(zeilen), [{ anfrage: 'ungueltig', feld: name }]);
    }
  }
});

test('Höchstlängen genau erreicht: wird gesendet (Zeilenumbruch zählt als ein Zeichen)', async () => {
  const nachricht = `${'x'.repeat(LAENGE.nachricht - 2)}\r\ny`;
  const { ort, mails } = await sende({ name: 'n'.repeat(LAENGE.name), nachricht, email: `${'e'.repeat(64)}@beispiel.test` });
  assert.equal(ort, GESENDET);
  assert.equal(mails.length, 2);
});

test('Betreff ohne Zeilenumbrüche', async () => {
  const { mails } = await sende({ name: 'Anna\r\nBcc: x@beispiel.test\nBeispiel' });
  assert.equal(/[\r\n]/.test(mails[0].message.subject), false);
  assert.equal(mails[0].message.subject, 'Anfrage Webseite: Anstellung als pflegender Angehöriger – Anna Bcc: x@beispiel.test Beispiel');
});

test('Honeypot gefüllt: Antwort wie bei Erfolg, nichts gesendet', async () => {
  const { ort, g, zeilen } = await sende({ webseite: 'https://spam.beispiel.test' });
  assert.equal(ort, GESENDET);
  assert.equal(g.aufrufe.length, 0);
  assert.deepEqual(logEintraege(zeilen), [{ anfrage: 'spam', grund: 'honeypot' }]);
});

test('Zu schnell abgeschickt (unter 3 Sekunden): Antwort wie bei Erfolg, nichts gesendet', async () => {
  for (const dauer of ['0', '2999.9', 'abc', '-5000', '1e9']) {
    const { ort, g, zeilen } = await sende({ dauer });
    assert.equal(ort, GESENDET, dauer);
    assert.equal(g.aufrufe.length, 0, dauer);
    assert.deepEqual(logEintraege(zeilen), [{ anfrage: 'spam', grund: 'zeit' }]);
  }
  // Ab 3 Sekunden und ohne JavaScript (Feld leer oder fehlt) wird gesendet.
  for (const dauer of ['3000', '3000.1', '86400000', '', undefined]) {
    const { ort, mails } = await sende({ dauer });
    assert.equal(ort, GESENDET, String(dauer));
    assert.equal(mails.length, 1, String(dauer));
  }
});

test('Graph-Fehler bei der Mail an MAIL_TO: Fehler-Anker, keine Bestätigung', async () => {
  const email = 'anna.beispiel@beispiel.test';
  const { ort, mails, zeilen } = await sende({ email }, { g: graph({ anfrage: 403 }) });
  assert.equal(ort, FEHLER);
  assert.equal(mails.length, 1, 'keine Bestätigung, wenn die Anfrage nicht ankam');
  const [eintrag] = logEintraege(zeilen);
  assert.equal(eintrag.anfrage, 'fehler');
  assert.equal(eintrag.schritt, 'anfrage');
  assert.equal(eintrag.httpStatus, 403);
  assert.equal(eintrag.code, 'ErrorAccessDenied');
  assert.equal(eintrag.requestId, 'graph-request-0001');
  assert.match(eintrag.clientRequestId, /^[0-9a-f-]{36}$/);
  assert.equal(zeilen.length, 1);
});

test('Anmeldung bei Microsoft schlägt fehl: Fehler-Anker, Code und Trace-ID im Log', async () => {
  const { ort, mails, zeilen } = await sende({}, { g: graph({ token: 401 }) });
  assert.equal(ort, FEHLER);
  assert.equal(mails.length, 0);
  const [eintrag] = logEintraege(zeilen);
  assert.deepEqual(
    { ...eintrag, clientRequestId: undefined },
    { anfrage: 'fehler', schritt: 'token', httpStatus: 401, code: 'invalid_client AADSTS700027', requestId: 'trace-0001', clientRequestId: undefined },
  );
});

test('Verbindungsfehler zu Graph: Fehler-Anker, nur Fehlername und Code im Log', async () => {
  for (const g of [graph({ token: 'netz' }), graph({ anfrage: 'netz' })]) {
    const { ort, zeilen } = await sende({}, { g });
    assert.equal(ort, FEHLER);
    const [eintrag] = logEintraege(zeilen);
    assert.equal(eintrag.fehler, 'TypeError');
    assert.equal(eintrag.code, 'ECONNRESET');
  }
});

test('Graph-Fehler nur bei der Bestätigung: Anfrage gilt als gesendet', async () => {
  for (const bestaetigung of [500, 'netz']) {
    const { ort, mails, zeilen } = await sende({ email: 'anna.beispiel@beispiel.test' }, { g: graph({ bestaetigung }) });
    assert.equal(ort, GESENDET);
    assert.equal(mails.length, 2);
    const eintraege = logEintraege(zeilen);
    assert.equal(eintraege[0].anfrage, 'fehler');
    assert.equal(eintraege[0].schritt, 'bestaetigung');
    assert.deepEqual(eintraege[1], { anfrage: 'gesendet', bestaetigung: 'fehler' });
  }
});

test('Offener Redirect abgewiesen: Rücksprung nur auf eigene Pfade', async () => {
  for (const quellseite of [
    'https://boese.beispiel.test/',
    '//boese.beispiel.test/',
    '/\\boese.beispiel.test',
    '\\\\boese.beispiel.test',
    'javascript:alert(1)',
    '/seite?x=https://boese.beispiel.test',
    '/seite#x',
    '/a//b',
    ' /',
    'seite/',
    '',
    undefined,
    `/${'a'.repeat(200)}`,
  ]) {
    const { ort, g, zeilen } = await sende({ quellseite });
    assert.equal(ort, FEHLER, String(quellseite));
    assert.equal(g.aufrufe.length, 0);
    assert.deepEqual(logEintraege(zeilen), [{ anfrage: 'ungueltig', feld: 'quellseite' }]);
  }
  // Auch bei Spam führt der Rücksprung nie nach aussen.
  const spam = await sende({ quellseite: '//boese.beispiel.test/', webseite: 'x' });
  assert.equal(spam.ort, GESENDET);
  for (const pfad of ['/', '/lohnrechner/', '/betreuung-hauswirtschaft/', '/ueber-uns/', '/bausteine/']) {
    assert.equal(sichererPfad(pfad), pfad);
  }
});

test('Fehlende Umgebungsvariable: Fehler-Anker, Log nennt den Namen, nie Werte', async () => {
  for (const name of VARIABLEN) {
    for (const wert of [undefined, '  ']) {
      const env = { ...ENV, [name]: wert };
      const { ort, g, zeilen } = await sende({}, { env });
      assert.equal(ort, FEHLER, name);
      assert.equal(g.aufrufe.length, 0, name);
      assert.deepEqual(logEintraege(zeilen), [{ anfrage: 'fehler', meldung: `Umgebungsvariable fehlt: ${name}` }]);
    }
  }
  const ohneAlle = await sende({}, { env: {} });
  assert.deepEqual(logEintraege(ohneAlle.zeilen), [
    { anfrage: 'fehler', meldung: `Umgebungsvariable fehlt: ${VARIABLEN.join(', ')}` },
  ]);
});

test('Ungültiger Fingerabdruck oder Schlüssel: Fehler-Anker, Log nennt die Variable', async () => {
  const faelle = [
    ['MS_CERT_THUMBPRINT_SHA256', 'abc123'],
    ['MS_CERT_PRIVATE_KEY_BASE64', Buffer.from('kein Schlüssel').toString('base64')],
  ];
  for (const [name, wert] of faelle) {
    const { ort, g, zeilen } = await sende({}, { env: { ...ENV, [name]: wert } });
    assert.equal(ort, FEHLER);
    assert.equal(g.aufrufe.length, 0);
    const [eintrag] = logEintraege(zeilen);
    assert.equal(eintrag.anfrage, 'fehler');
    assert.ok(eintrag.meldung.startsWith(`Umgebungsvariable ${name}:`), eintrag.meldung);
  }
  // Fingerabdruck mit Doppelpunkten und PEM ohne Base64 werden ebenfalls gelesen.
  const doppelpunkte = FINGERABDRUCK.toUpperCase().match(/../g).join(':');
  const { ort } = await sende({}, { env: { ...ENV, MS_CERT_THUMBPRINT_SHA256: doppelpunkte, MS_CERT_PRIVATE_KEY_BASE64: PEM } });
  assert.equal(ort, GESENDET);
});

test('Client Assertion: PS256, x5t#S256, Signatur mit dem Zertifikatsschlüssel', async () => {
  const { g } = await sende();
  const assertion = new URLSearchParams(g.tokenAufrufe()[0].init.body).get('client_assertion');
  const [kopf, inhalt, signatur] = assertion.split('.');
  const lies = (teil) => JSON.parse(Buffer.from(teil, 'base64url').toString('utf8'));
  assert.deepEqual(lies(kopf), {
    alg: 'PS256',
    typ: 'JWT',
    'x5t#S256': Buffer.from(FINGERABDRUCK, 'hex').toString('base64url'),
  });
  const claims = lies(inhalt);
  assert.equal(claims.aud, 'https://login.microsoftonline.com/test-tenant/oauth2/v2.0/token');
  assert.equal(claims.iss, ENV.MS_CLIENT_ID);
  assert.equal(claims.sub, ENV.MS_CLIENT_ID);
  assert.equal(claims.nbf, JETZT / 1000);
  assert.equal(claims.exp - claims.nbf, 600);
  assert.match(claims.jti, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const gueltig = verify(
    'sha256',
    Buffer.from(`${kopf}.${inhalt}`),
    { key: publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 },
    Buffer.from(signatur, 'base64url'),
  );
  assert.equal(gueltig, true);
});

test('Token wird innerhalb der Funktion zwischengespeichert, bis kurz vor Ablauf', async () => {
  const g = graph();
  await sende({}, { g });
  await sende({}, { g, jetzt: () => JETZT + (3599 - 301) * 1000 });
  assert.equal(g.tokenAufrufe().length, 1);
  await sende({}, { g, jetzt: () => JETZT + (3599 - 299) * 1000 });
  assert.equal(g.tokenAufrufe().length, 2);
});

test('Graph antwortet 401: Token wird verworfen und beim nächsten Mal neu geholt', async () => {
  const abgelehnt = graph({ anfrage: 401 });
  assert.equal((await sende({}, { g: abgelehnt })).ort, FEHLER);
  const g = graph();
  await sende({}, { g });
  assert.equal(g.tokenAufrufe().length, 1);
});

test('Nur POST mit Formularinhalt: GET 405, anderer Typ oder zu gross Fehler-Anker', async () => {
  const get = await sende({}, { methode: 'GET' });
  assert.equal(get.antwort.status, 405);
  assert.equal(get.antwort.headers.get('allow'), 'POST');
  assert.equal(get.g.aufrufe.length, 0);

  const json = await sende({}, { typ: 'application/json', koerper: JSON.stringify(FORMULAR) });
  assert.equal(json.ort, FEHLER);
  assert.equal(json.g.aufrufe.length, 0);

  const gross = await sende({}, { koerper: `${new URLSearchParams(FORMULAR)}&x=${'a'.repeat(70 * 1024)}` });
  assert.equal(gross.ort, FEHLER);
  assert.equal(gross.g.aufrufe.length, 0);
});

test('Log: nur feste Angaben als JSON, keine Formularinhalte', () => {
  assert.ok(alleLogZeilen.length > 50, `nur ${alleLogZeilen.length} Logzeilen`);
  const erlaubt = new Set(['anfrage', 'bestaetigung', 'feld', 'grund', 'schritt', 'httpStatus', 'code', 'requestId', 'clientRequestId', 'meldung', 'fehler']);
  for (const zeile of alleLogZeilen) {
    const eintrag = JSON.parse(zeile);
    for (const schluessel of Object.keys(eintrag)) assert.ok(erlaubt.has(schluessel), `${schluessel} in ${zeile}`);
    for (const wert of Object.values(eintrag)) {
      assert.ok(typeof wert === 'number' || String(wert).length <= 200, zeile);
    }
  }
  // Übersicht der vorkommenden Logzeilen (ohne Request-IDs) für den Pull Request.
  const muster = [...new Set(alleLogZeilen.map((z) => z.replace(/"clientRequestId":"[^"]+"/, '"clientRequestId":"…"')))];
  if (process.env.LOG_ZEIGEN) console.log(muster.join('\n'));
});

test('Formular: Versandziel, Honeypot, Feld dauer und Rückmeldungen aus D2', () => {
  const quelle = readFileSync(new URL('../src/components/Anfrage.astro', import.meta.url), 'utf8');
  assert.match(quelle, /<form class="formular" method="post" action="\/api\/anfrage"/);
  assert.doesNotMatch(quelle, /data-netlify|netlify-honeypot|\snetlify[\s>]/);
  for (const feld of FELDER) assert.ok(quelle.includes(feld.bezeichnung), feld.bezeichnung);
  for (const name of ['name', 'telefon', 'email', 'ort', 'nachricht']) {
    assert.ok(quelle.includes(`maxlength={LAENGE.${name}}`), name);
  }
  assert.match(
    quelle,
    /<div class="honeypot" aria-hidden="true">\s*<label[^>]*>[^<]*<\/label>\s*<input type="text" id="anfrage-webseite" name="webseite" tabindex="-1" autocomplete="off" \/>/,
  );
  assert.match(quelle, /<input type="hidden" name="dauer" value="" \/>/);

  /** Text einer Rückmeldung aus dem Quelltext (Tags entfernt, Leerraum zusammengefasst). */
  const text = (id) =>
    quelle
      .split(`id="${id}"`)[1]
      .split('</div>')[0]
      .replace(/^[^>]*>/, '')
      .replace(/\{' '\}/g, ' ')
      .replace(/\{telefon\.text\}/g, '041 784 26 55')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/ ([,.])/g, '$1')
      .trim();
  assert.equal(
    text('anfrage-gesendet'),
    'Vielen Dank. Ihre Anfrage ist bei uns eingegangen. Eine Fachperson meldet sich innert 24 Stunden an Werktagen bei Ihnen. Wenn es dringend ist: 041 784 26 55.',
  );
  assert.equal(
    text('anfrage-fehler'),
    'Ihre Anfrage konnte gerade nicht gesendet werden. Bitte rufen Sie uns an: 041 784 26 55, schreiben Sie uns auf WhatsApp oder versuchen Sie es in ein paar Minuten nochmals.',
  );
  assert.match(quelle, /id="anfrage-gesendet" tabindex="-1"/);
  assert.match(quelle, /class="rueckmeldung rueckmeldung--fehler flaeche-tiefblau" id="anfrage-fehler" tabindex="-1"/);
  const fehlerBlock = quelle.split('id="anfrage-fehler"')[1].split('</div>')[0];
  assert.match(fehlerBlock, /href=\{telefon\.href\}/);
  assert.match(fehlerBlock, /href=\{whatsapp\}><Icon name="message-circle"[^>]*\/>auf WhatsApp<\/a>/);
  assert.match(quelle, /const whatsapp = 'https:\/\/wa\.me\/41417842655\?text=/);
  assert.match(quelle, /const telefon = \{ text: '041 784 26 55', href: 'tel:\+41417842655' \};/);
  // Anzeige nur per :target; Fehler als Tiefblau-Fläche mit weisser Schrift.
  assert.match(quelle, /\.rueckmeldung:not\(:target\) \{\s*display: none;\s*\}/);
  assert.match(
    quelle,
    /\.rueckmeldung--fehler \{\s*background-color: var\(--color-tiefblau\);\s*color: var\(--color-auf-tiefblau\);\s*\}/,
  );
  assert.match(quelle, /\.rueckmeldung--fehler a \{\s*color: var\(--color-auf-tiefblau\);\s*\}/);
});
