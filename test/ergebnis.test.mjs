/**
 * Prüft «Ergebnis per E-Mail» der Lohnrechner-Seite (Konzept D1): das kleine
 * Formular beim Rechner (Lohnrechner.astro, vollständige Fassung) und seine
 * Bearbeitung in der Netlify Function /api/anfrage mit art=ergebnis, mit
 * gemocktem Microsoft Graph (keine echten Mails, Testschlüssel wird hier
 * erzeugt). Der Server rechnet die Beträge selbst; für alle sechs Auswahlen
 * und beide Zustände des Kästchens stehen in der Mail dieselben Beträge wie
 * in der Ergebnistabelle D1 (und damit im Rechner), im Wortlaut aus Konzept
 * V3.20, D1 «E-Mail mit dem Ergebnis». Nach jedem Aufruf wird
 * geprüft, dass das Log weder die E-Mail-Adresse noch andere Formular- oder
 * Umgebungswerte enthält.
 *
 * Mit MAIL_ZEIGEN=1 gibt der letzte Test den Wortlaut der Mails für
 * 2 Stunden und «mehr als 3» aus (für den Pull Request).
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { bearbeite, ERGEBNIS_FEHLER, ERGEBNIS_GESENDET } from '../netlify/functions/anfrage/anfrage.mjs';
import { bearbeite as bearbeiteGebremst } from '../netlify/functions/anfrage-gebremst.mjs';
import { ART_ERGEBNIS, LAENGE } from '../netlify/functions/anfrage/felder.mjs';
import { BETREFF_ERGEBNIS, WHATSAPP, mailErgebnis } from '../netlify/functions/anfrage/mail.mjs';
import { leereTokenSpeicher } from '../netlify/functions/anfrage/graph.mjs';
import { KONFIG } from '../src/scripts/lohnrechner.js';

const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });

const ENV = {
  MS_TENANT_ID: 'test-tenant',
  MS_CLIENT_ID: 'test-client-id',
  MS_CERT_THUMBPRINT_SHA256: createHash('sha256').update('Testzertifikat').digest('hex'),
  MS_CERT_PRIVATE_KEY_BASE64: Buffer.from(PEM).toString('base64'),
  MAIL_FROM: 'absender@beispiel.test',
  MAIL_TO: 'empfang@beispiel.test',
};

const ADRESSE = 'anna.beispielname@meine-adresse.test';
const FORMULAR = {
  art: 'ergebnis',
  email: ADRESSE,
  stunden: '2',
  quellseite: '/lohnrechner/',
  dauer: '5234.5',
  webseite: '',
};

const GESENDET = '/lohnrechner/#ergebnis-gesendet';
const FEHLER = '/lohnrechner/#ergebnis-fehler';

// Ergebnistabelle aus Konzept D1 (Kontrollwerte, wörtlich): Auswahl, Monat und
// Jahr mit Kurs, Monat und Jahr Einstieg.
const TABELLE_D1 = [
  ['1', '1 Stunde', 'rund CHF 990.–', "rund CHF 11'800.–", 'rund CHF 880.–', "rund CHF 10'600.–"],
  ['1.5', '1½ Stunden', "rund CHF 1'480.–", "rund CHF 17'800.–", "rund CHF 1'320.–", "rund CHF 15'900.–"],
  ['2', '2 Stunden', "rund CHF 1'970.–", "rund CHF 23'700.–", "rund CHF 1'770.–", "rund CHF 21'200.–"],
  ['2.5', '2½ Stunden', "rund CHF 2'470.–", "rund CHF 29'600.–", "rund CHF 2'210.–", "rund CHF 26'500.–"],
  ['3', '3 Stunden', "rund CHF 2'960.–", "rund CHF 35'500.–", "rund CHF 2'650.–", "rund CHF 31'800.–"],
  ['mehr', 'mehr als 3 Stunden', "über CHF 2'960.–", "über CHF 35'500.–", "über CHF 2'650.–", "über CHF 31'800.–"],
];

/** Gemockter Graph; Fehlermeldungen enthalten absichtlich die Adresse, die nie ins Log darf. */
function graph({ token = 200, mail = 202 } = {}) {
  const aufrufe = [];
  const fetch = async (url, init) => {
    aufrufe.push({ url: String(url), init });
    if (String(url).startsWith('https://login.microsoftonline.com/')) {
      if (token !== 200) {
        return Response.json(
          { error: 'invalid_client', error_description: 'AADSTS700027', error_codes: [700027], trace_id: 'trace-0002' },
          { status: token },
        );
      }
      return Response.json({ token_type: 'Bearer', expires_in: 3599, access_token: 'test-token-geheim' });
    }
    if (mail === 'netz') throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
    if (mail === 202) return new Response(null, { status: 202 });
    const daten = JSON.parse(init.body);
    return Response.json(
      { error: { code: 'ErrorAccessDenied', message: `Access denied for ${daten.message.toRecipients[0].emailAddress.address}` } },
      { status: mail, headers: { 'request-id': 'graph-request-0002' } },
    );
  };
  const mails = () => aufrufe.filter((a) => a.url.endsWith('/sendMail')).map((a) => JSON.parse(a.init.body));
  return { fetch, aufrufe, mails };
}

const alleLogZeilen = [];

/** Werte, die nie im Log stehen dürfen: Adresse (auch Teile), Formularinhalte, Umgebung, Token. */
function geheim(daten, env) {
  const email = String(daten.email ?? '');
  const texte = [
    email,
    ...email.split('@'),
    ...Object.entries(daten)
      .filter(([name]) => !['art', 'quellseite', 'dauer', 'stunden'].includes(name))
      .map(([, wert]) => String(wert)),
    ...Object.values(env).map(String),
    'test-token-geheim',
  ];
  return texte.map((t) => t.trim()).filter((t) => t.length >= 4);
}

/** Schickt das Formular an die Funktion; Log und Konsole werden mitgeschrieben und geprüft. */
async function sende(felder = {}, { env = ENV, g = graph(), funktion = bearbeite, adresse } = {}) {
  const daten = Object.fromEntries(Object.entries({ ...FORMULAR, ...felder }).filter(([, w]) => w !== undefined));
  const req = new Request(adresse ?? 'https://pflegeunion.ch/api/anfrage', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(daten).toString(),
  });
  const zeilen = [];
  const log = Object.fromEntries(['log', 'info', 'warn', 'error'].map((art) => [art, (text) => zeilen.push(text)]));
  const konsole = { ...console };
  for (const art of ['log', 'info', 'warn', 'error', 'debug']) console[art] = (...a) => zeilen.push(a.join(' '));
  let antwort;
  try {
    antwort = await funktion(req, { env, fetch: g.fetch, jetzt: () => Date.UTC(2026, 9, 7, 8, 0), log });
  } finally {
    Object.assign(console, konsole);
  }
  for (const zeile of zeilen) {
    for (const wert of geheim(daten, env)) {
      assert.ok(!zeile.includes(wert), `Log enthält einen Formular- oder Umgebungswert: ${zeile}`);
    }
  }
  alleLogZeilen.push(...zeilen);
  return { antwort, ort: antwort.headers.get('location'), g, mails: g.mails(), log: zeilen.map((z) => JSON.parse(z)) };
}

/** Zeilen der Mail mit den Beträgen. */
const betraege = (text) => text.split('\n').filter((z) => /^(Ihr Lohn mit Pflegehelferkurs|Bis zum Pflegehelferkurs):/.test(z));

// Wortlaut aus Konzept V3.20, D1 «E-Mail mit dem Ergebnis», Beispiel 2 Stunden;
// der WhatsApp-Link wie auf der Webseite, mit der vorbereiteten Nachricht.
const WORTLAUT_2_STUNDEN = `Guten Tag

Hier ist Ihre Schätzung aus dem Lohnrechner der Pflegeunion.

Grundpflege pro Tag: 2 Stunden
Ihr Lohn mit Pflegehelferkurs: rund CHF 1'970.– brutto pro Monat, rund CHF 23'700.– pro Jahr
Bis zum Pflegehelferkurs: rund CHF 1'770.– brutto pro Monat

So rechnen wir: 2 Stunden × 26 Tage × CHF 37.95, gerundet auf zehn Franken. Wir rechnen mit sechs Einsatztagen pro Woche, weil das Gesetz einen freien Tag vorschreibt. Den Pflegehelferkurs bezahlen wir.

Das Ergebnis ist eine Schätzung. Verbindlich wird Ihre Zahl nach der kostenlosen Abklärung bei Ihnen zu Hause.

Fragen? Rufen Sie uns an: 041 784 26 55, Mo bis Fr, 08.00–17.00 Uhr.
Lieber schreiben? Auf WhatsApp: https://wa.me/41417842655?text=Guten%20Tag%2C%20ich%20habe%20eine%20Frage%3A
Oder antworten Sie einfach auf diese E-Mail.

Freundliche Grüsse
Pflegeunion Schweiz
Grundstrasse 4b · 6343 Rotkreuz
041 784 26 55 · info@pflegeunion.ch

Ihre E-Mail-Adresse haben wir nur für diese Nachricht verwendet und nicht gespeichert.`;

/** Zusatz bei «mehr als 3» aus dem Rechner (Lohnrechner.astro), Leerraum zusammengefasst. */
function zusatzImRechner() {
  const quelle = readFileSync(new URL('../src/components/Lohnrechner.astro', import.meta.url), 'utf8');
  return quelle.split('data-mehr hidden>')[1].split('</p>')[0].replace(/\s+/g, ' ').trim();
}

beforeEach(() => leereTokenSpeicher());

test('Erfolg (2 Stunden): Wortlaut D1, nur an die angegebene Adresse, Antwort an MAIL_TO, keine Kopie', async () => {
  const { antwort, ort, mails, log, g } = await sende();
  assert.equal(antwort.status, 303);
  assert.equal(ort, GESENDET);
  assert.equal(antwort.headers.get('cache-control'), 'no-store');
  // Genau eine Mail: keine Kopie an MAIL_TO, keine Bestätigung.
  assert.equal(mails.length, 1);
  const [mail] = mails;
  assert.equal(g.aufrufe.find((a) => a.url.endsWith('/sendMail')).url, 'https://graph.microsoft.com/v1.0/users/absender@beispiel.test/sendMail');
  assert.deepEqual(mail.message.toRecipients, [{ emailAddress: { address: ADRESSE } }]);
  assert.deepEqual(mail.message.replyTo, [{ emailAddress: { address: ENV.MAIL_TO } }]);
  assert.equal(mail.message.ccRecipients, undefined);
  assert.equal(mail.message.bccRecipients, undefined);
  assert.equal(mail.saveToSentItems, false, 'keine Kopie in den gesendeten Elementen');
  assert.equal(mail.message.subject, 'Ihre Lohnschätzung bei der Pflegeunion');
  assert.equal(mail.message.body.contentType, 'Text');
  assert.equal(mail.message.body.content, WORTLAUT_2_STUNDEN);
  // Keine Angabe der Person ausser der Adresse als Empfänger.
  assert.ok(!mail.message.body.content.includes(ADRESSE));
  assert.deepEqual(log, [{ anfrage: 'gesendet', art: 'ergebnis' }]);
});

for (const [wert, text, monatKurs, jahrKurs, monatEinstieg] of TABELLE_D1) {
  for (const ohneKurs of [false, true]) {
    test(`Beträge wie Tabelle D1: «${text}», Kästchen ${ohneKurs ? 'angekreuzt' : 'leer'}`, async () => {
      const { ort, mails } = await sende({ stunden: wert, ohne_kurs: ohneKurs ? 'ja' : undefined });
      assert.equal(ort, GESENDET);
      const inhalt = mails[0].message.body.content;
      const zeilen = inhalt.split('\n');
      // Stunden wie im Rechner geschrieben.
      assert.ok(zeilen.includes(`Grundpflege pro Tag: ${text}`), text);
      // Lohn mit Kurs pro Monat und Jahr, «Bis zum Pflegehelferkurs» nur pro Monat.
      assert.deepEqual(betraege(inhalt), [
        `Ihr Lohn mit Pflegehelferkurs: ${monatKurs} brutto pro Monat, ${jahrKurs} pro Jahr`,
        `Bis zum Pflegehelferkurs: ${monatEinstieg} brutto pro Monat`,
      ]);
      // Rechenweg mit den Stunden der Stufe, bei «mehr als 3» mit 3 Stunden.
      const gerechnet = wert === 'mehr' ? '3 Stunden' : text;
      assert.ok(inhalt.includes(`So rechnen wir: ${gerechnet} × 26 Tage × CHF 37.95, gerundet auf zehn Franken.`), gerechnet);
      // Zusatz nur bei «mehr als 3», als eigener Absatz nach «Bis zum Pflegehelferkurs …».
      const bis = zeilen.findIndex((z) => z.startsWith('Bis zum Pflegehelferkurs:'));
      if (wert === 'mehr') assert.deepEqual(zeilen.slice(bis + 1, bis + 4), ['', zusatzImRechner(), '']);
      else assert.doesNotMatch(inhalt, /Wichtig:/);
      // Keine Zeile zu Versicherungen; das Kästchen ändert die Mail nicht.
      assert.doesNotMatch(inhalt, /versichert|Pensionskasse|AHV|Krankentaggeld/);
      assert.equal(inhalt, mailErgebnis({ stufe: KONFIG.stufen.find((s) => s.wert === wert) }).text);
    });
  }
}

test('«mehr als 3»: «über» statt «rund», Rechenweg mit 3 Stunden, Zusatz «Wichtig: …» wie im Rechner', async () => {
  const { mails } = await sende({ stunden: 'mehr' });
  const inhalt = mails[0].message.body.content;
  const hinweis = zusatzImRechner();
  assert.ok(hinweis.startsWith('Wichtig: '));
  assert.equal(
    inhalt,
    WORTLAUT_2_STUNDEN.replace('Grundpflege pro Tag: 2 Stunden', 'Grundpflege pro Tag: mehr als 3 Stunden')
      .replace("rund CHF 1'970.– brutto pro Monat, rund CHF 23'700.– pro Jahr", "über CHF 2'960.– brutto pro Monat, über CHF 35'500.– pro Jahr")
      .replace("Bis zum Pflegehelferkurs: rund CHF 1'770.– brutto pro Monat", `Bis zum Pflegehelferkurs: über CHF 2'650.– brutto pro Monat\n\n${hinweis}`)
      .replace('So rechnen wir: 2 Stunden', 'So rechnen wir: 3 Stunden'),
  );
  assert.doesNotMatch(betraege(inhalt).join('\n'), /rund/);
});

test('Kästchen angekreuzt: dieselbe Mail, kein zusätzlicher Satz', async () => {
  const leer = (await sende({ stunden: '2' })).mails[0].message.body.content;
  const angekreuzt = (await sende({ stunden: '2', ohne_kurs: 'ja' })).mails[0].message.body.content;
  assert.equal(angekreuzt, leer);
});

test('WhatsApp-Link wie auf der Webseite, allein am Zeilenende', () => {
  const anfrage = readFileSync(new URL('../src/components/Anfrage.astro', import.meta.url), 'utf8');
  const link = anfrage.match(/const whatsapp = '([^']+)';/)[1];
  assert.equal(WHATSAPP, link);
  const zeile = mailErgebnis({ stufe: KONFIG.stufen[0] }).text.split('\n').find((z) => z.includes('wa.me'));
  assert.equal(zeile, `Lieber schreiben? Auf WhatsApp: ${link}`);
  assert.ok(zeile.endsWith(link), 'kein Satzzeichen nach dem Link');
});

test('Beträge kommen nie vom Browser', async () => {
  const { mails } = await sende({ ergebnis: "rund CHF 9'999.–", monat: '9999', jahr: '99999', satz: '99.95' });
  const inhalt = mails[0].message.body.content;
  assert.doesNotMatch(inhalt, /9'999|99'999|99\.95/);
  assert.equal(inhalt, WORTLAUT_2_STUNDEN);
});

test('Ungültige E-Mail (wie im Anfrageformular): Fehler-Anker, nichts gesendet', async () => {
  const ungueltig = [
    undefined,
    '',
    '   ',
    'michel@g',
    'michel@g.c',
    'michel@gmail.c0',
    'kein-at-zeichen.ch',
    'zwei@@beispiel.ch',
    'anna@beispiel.test\r\nBcc: dritte@beispiel.test',
    `${'a'.repeat(LAENGE.email - 7)}@beis.ch`,
  ];
  for (const email of ungueltig) {
    const { ort, g, log } = await sende({ email });
    assert.equal(ort, FEHLER, String(email));
    assert.equal(g.aufrufe.length, 0, String(email));
    assert.deepEqual(log, [{ anfrage: 'ungueltig', feld: 'email', art: 'ergebnis' }]);
  }
  // Höchstlänge genau erreicht und gängige Adressen: wird gesendet.
  for (const email of [`${'a'.repeat(LAENGE.email - 12)}@beispiel.ch`, 'michel@gmail.com', 'vorname.name@beispiel-firma.ch']) {
    assert.equal((await sende({ email })).ort, GESENDET, email);
  }
});

test('Ungültige Stunden oder Kästchen: Fehler-Anker, nichts gesendet', async () => {
  for (const [felder, feld] of [
    [{ stunden: undefined }, 'stunden'],
    [{ stunden: '' }, 'stunden'],
    [{ stunden: '4' }, 'stunden'],
    [{ stunden: '2 Stunden' }, 'stunden'],
    [{ stunden: 'mehr als 3' }, 'stunden'],
    [{ ohne_kurs: 'nein' }, 'ohne_kurs'],
    [{ ohne_kurs: 'on' }, 'ohne_kurs'],
  ]) {
    const { ort, g, log } = await sende(felder);
    assert.equal(ort, FEHLER, JSON.stringify(felder));
    assert.equal(g.aufrufe.length, 0);
    assert.deepEqual(log, [{ anfrage: 'ungueltig', feld, art: 'ergebnis' }]);
  }
});

test('Honeypot gefüllt: Antwort wie bei Erfolg, nichts gesendet', async () => {
  const { ort, g, log } = await sende({ webseite: 'https://werbung.beispiel.test' });
  assert.equal(ort, GESENDET);
  assert.equal(g.aufrufe.length, 0);
  assert.deepEqual(log, [{ anfrage: 'spam', grund: 'honeypot', art: 'ergebnis' }]);
});

test('Zu schnell abgeschickt (unter 3 Sekunden): Antwort wie bei Erfolg, nichts gesendet', async () => {
  const { ort, g, log } = await sende({ dauer: '1200' });
  assert.equal(ort, GESENDET);
  assert.equal(g.aufrufe.length, 0);
  assert.deepEqual(log, [{ anfrage: 'spam', grund: 'zeit', art: 'ergebnis' }]);
  // Ohne JavaScript bleibt «dauer» leer: dann entfällt nur die Zeitprüfung.
  assert.equal((await sende({ dauer: '' })).mails.length, 1);
});

test('Graph-Fehler beim Versand: Fehler-Anker, im Log nur Status, Code und Request-ID', async () => {
  const { ort, log } = await sende({}, { g: graph({ mail: 500 }) });
  assert.equal(ort, FEHLER);
  assert.equal(log.length, 1);
  const { clientRequestId, ...eintrag } = log[0];
  assert.match(clientRequestId, /^[0-9a-f-]{36}$/);
  assert.deepEqual(eintrag, {
    anfrage: 'fehler',
    schritt: 'ergebnis',
    httpStatus: 500,
    code: 'ErrorAccessDenied',
    requestId: 'graph-request-0002',
    art: 'ergebnis',
  });
});

test('Anmeldung oder Verbindung schlägt fehl: Fehler-Anker', async () => {
  const token = await sende({}, { g: graph({ token: 401 }) });
  assert.equal(token.ort, FEHLER);
  assert.equal(token.log[0].schritt, 'token');
  assert.equal(token.log[0].code, 'invalid_client AADSTS700027');
  const netz = await sende({}, { g: graph({ mail: 'netz' }) });
  assert.equal(netz.ort, FEHLER);
  assert.deepEqual(netz.log, [{ anfrage: 'fehler', schritt: 'ergebnis', fehler: 'TypeError', code: 'ECONNRESET', art: 'ergebnis' }]);
});

test('Fehlende Umgebungsvariable: Fehler-Anker, Log nennt nur den Namen', async () => {
  const { ort, g, log } = await sende({}, { env: { ...ENV, MAIL_TO: '' } });
  assert.equal(ort, FEHLER);
  assert.equal(g.aufrufe.length, 0);
  assert.deepEqual(log, [{ anfrage: 'fehler', meldung: 'Umgebungsvariable fehlt: MAIL_TO', art: 'ergebnis' }]);
});

test('Rücksprung nur auf eigene Pfade, mit dem Anker beim Rechner', async () => {
  assert.equal((await sende({ quellseite: '/bausteine/' })).ort, '/bausteine/#ergebnis-gesendet');
  for (const quellseite of ['//boese.beispiel.test/', 'https://boese.beispiel.test/', '/\\boese', '/lohnrechner/?x=1', undefined]) {
    const { ort, g } = await sende({ quellseite });
    assert.equal(ort, '/#ergebnis-fehler', String(quellseite));
    assert.equal(g.aufrufe.length, 0);
  }
});

test('Unbekannte Art: Fehler-Anker des Anfrageformulars, nichts gesendet', async () => {
  const { ort, g, log } = await sende({ art: 'irgendwas' });
  assert.equal(ort, '/lohnrechner/#anfrage-fehler');
  assert.equal(g.aufrufe.length, 0);
  assert.deepEqual(log, [{ anfrage: 'ungueltig', feld: 'art' }]);
});

test('Rate Limit überschritten: #ergebnis-fehler beim Rechner, nichts gesendet', async () => {
  const { antwort, ort, g, log } = await sende({}, { funktion: bearbeiteGebremst, adresse: 'https://pflegeunion.ch/api/anfrage-gebremst' });
  assert.equal(antwort.status, 303);
  assert.equal(ort, FEHLER);
  assert.equal(g.aufrufe.length, 0);
  assert.deepEqual(log, [{ anfrage: 'gebremst', art: 'ergebnis' }]);
});

test('Log: nur feste Angaben als JSON, nie die E-Mail-Adresse', () => {
  assert.ok(alleLogZeilen.length > 30, `nur ${alleLogZeilen.length} Logzeilen`);
  const erlaubt = new Set(['anfrage', 'art', 'feld', 'grund', 'schritt', 'httpStatus', 'code', 'requestId', 'clientRequestId', 'meldung', 'fehler']);
  for (const zeile of alleLogZeilen) {
    assert.doesNotMatch(zeile, /@/, zeile);
    const eintrag = JSON.parse(zeile);
    for (const schluessel of Object.keys(eintrag)) assert.ok(erlaubt.has(schluessel), `${schluessel} in ${zeile}`);
    if ('art' in eintrag) assert.equal(eintrag.art, ART_ERGEBNIS);
  }
  if (process.env.LOG_ZEIGEN) console.log([...new Set(alleLogZeilen.map((z) => z.replace(/"clientRequestId":"[^"]+"/, '"clientRequestId":"…"')))].join('\n'));
});

test('Formular beim Rechner: Ziel, Felder, Spam-Schutz und Rückmeldungen', () => {
  const quelle = readFileSync(new URL('../src/components/Lohnrechner.astro', import.meta.url), 'utf8');
  const markup = quelle.split('<style>')[0];
  const ohneUmbruch = markup.replace(/\s+/g, ' ');
  assert.match(markup, /<form\s+class="mail-formular"\s+id=\{mailFormular\}\s+method="post"\s+action="\/api\/anfrage"/);
  assert.doesNotMatch(markup, /data-netlify|netlify-honeypot/);
  assert.match(markup, /<input type="hidden" name="art" value="ergebnis" \/>/);
  assert.equal(ART_ERGEBNIS, 'ergebnis');
  assert.match(markup, /<input type="hidden" name="quellseite" value=\{Astro\.url\.pathname\} \/>/);
  assert.match(markup, /<input type="hidden" name="dauer" value="" \/>/);
  assert.match(markup, /<div class="honeypot" aria-hidden="true">\s*<label[^>]*>[^<]*<\/label>\s*<input type="text" id=\{`\$\{id\}-mail-webseite`\} name="webseite" tabindex="-1" autocomplete="off" \/>/);
  // E-Mail-Feld mit denselben Regeln wie Feld 5 des Anfrageformulars, hier Pflicht.
  assert.match(markup, /type="email"\s+id=\{`\$\{id\}-mail`\}\s+name="email"\s+autocomplete="email"\s+maxlength=\{LAENGE\.email\}\s+pattern=\{MUSTER\.email\}\s+required/);
  // Stundenfelder und Kästchen gehören über das Attribut form zum Formular (ohne neues JavaScript).
  assert.match(markup, /type="radio"\s+name=\{nameStunden\}\s+value=\{z\.wert\}\s+checked=\{z\.wert === vorbelegung\}\s+form=\{mailFormular\}/);
  assert.match(markup, /type="checkbox"\s+data-ohne-kurs\s+name=\{vollstaendig \? 'ohne_kurs' : undefined\}\s+value=\{vollstaendig \? 'ja' : undefined\}\s+form=\{mailFormular\}/);
  assert.match(quelle, /const nameStunden = vollstaendig \? 'stunden' : `\$\{id\}-stunden`;/);
  assert.match(quelle, /const mailFormular = vollstaendig \? `\$\{id\}-mail-formular` : undefined;/);
  // Das Anfrageformular bleibt unberührt: andere Klasse, das Rechner-Skript findet weiter form.formular.
  assert.doesNotMatch(markup, /class="formular"/);
  // Zeile zum Antippen (details/summary), Texte wörtlich aus D1.
  assert.match(markup, /<details class="mail">\s*<summary class="button button--sekundaer" data-email aria-controls=\{mailFormular\}>\s*Ergebnis per E-Mail erhalten\s*<\/summary>\s*<\/details>/);
  assert.ok(ohneUmbruch.includes('<label for={`${id}-mail`}>Ihre E-Mail-Adresse</label>'));
  assert.ok(ohneUmbruch.includes('<button type="submit" class="button">Ergebnis senden</button>'));
  assert.ok(ohneUmbruch.includes('Wir senden Ihnen nur diese eine E-Mail und speichern Ihre Adresse nicht.'));
  // Rückmeldungen: Anker wie in der Function, sichtbar per :target, Fokus beim Sprung.
  assert.match(markup, new RegExp(`class="mail-rueckmeldung mail-rueckmeldung--fehler flaeche-tiefblau" id="${ERGEBNIS_FEHLER}" tabindex="-1"`));
  assert.match(markup, new RegExp(`class="mail-rueckmeldung mail-rueckmeldung--gesendet" id="${ERGEBNIS_GESENDET}" tabindex="-1"`));
  const text = (id) =>
    markup
      .split(`id="${id}"`)[1]
      .replace(/^[^>]*>/, '')
      .split(/<\/(div|p)>/)[0]
      .replace(/\{' '\}/g, ' ')
      .replace(/\{telefon\.text\}/g, '041 784 26 55')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/ ([,.])/g, '$1')
      .trim();
  assert.equal(text(ERGEBNIS_GESENDET), 'Die E-Mail ist unterwegs. Falls sie nicht ankommt, schauen Sie bitte im Spam-Ordner nach.');
  assert.equal(
    text(ERGEBNIS_FEHLER),
    'Die E-Mail konnte gerade nicht gesendet werden. Bitte rufen Sie uns an: 041 784 26 55, schreiben Sie uns auf WhatsApp oder versuchen Sie es in ein paar Minuten nochmals.',
  );
  const stil = quelle.split('<style>')[1];
  // Formular offen mit dem <details> oder nach einem Fehler; Rückmeldungen nur per :target.
  assert.match(stil, /\.mail\[open\] \+ \.mail-bereich > \.mail-formular,\s*\.mail-rueckmeldung--fehler:target \+ \.mail-formular \{\s*display: block;/);
  assert.match(stil, /\.mail-rueckmeldung:not\(:target\),/);
  assert.match(stil, /\.mail-rueckmeldung--fehler \{\s*background-color: var\(--color-tiefblau\);\s*color: var\(--color-auf-tiefblau\);/);
  // Das Rechner-Skript bleibt unverändert (Entscheid GL 06.10.2026).
  const skript = readFileSync(new URL('../src/scripts/lohnrechner.js', import.meta.url));
  assert.equal(skript.length, 10094);
  assert.equal(createHash('sha256').update(skript).digest('hex').slice(0, 12), SKRIPT_SHA256);
});

// Fingerabdruck (SHA-256, Anfang) von src/scripts/lohnrechner.js auf main, 10'094 Bytes.
const SKRIPT_SHA256 = '5a67a070129f';

test('Wortlaut der Mails für 2 Stunden und «mehr als 3»', () => {
  const zwei = mailErgebnis({ stufe: KONFIG.stufen[2] });
  const mehr = mailErgebnis({ stufe: KONFIG.stufen[5] });
  assert.equal(zwei.betreff, BETREFF_ERGEBNIS);
  assert.equal(mehr.betreff, BETREFF_ERGEBNIS);
  assert.equal(zwei.text, WORTLAUT_2_STUNDEN);
  if (process.env.MAIL_ZEIGEN) {
    for (const [titel, m] of [['2 Stunden', zwei], ['mehr als 3', mehr]]) {
      console.log(`--- ${titel}\nBetreff: ${m.betreff}\n\n${m.text}\n`);
    }
  }
});
