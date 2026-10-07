/**
 * Prüft die Seite Betreuung & Hauswirtschaft /betreuung-hauswirtschaft/
 * (Konzept C3, Claude Design Seite «Betreuung & Hauswirtschaft») im
 * Quelltext: Reihenfolge der Abschnitte, Texte wörtlich aus den Boards,
 * Hero-Bild, Kopfzeile mit «Beratung anfragen» und aktivem Menüpunkt,
 * Formular mit vorgewähltem Anliegen (ohne JavaScript), Meta-Texte,
 * canonical, Sitemap und Verweise von anderen Seiten.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { ANLIEGEN } from '../netlify/functions/anfrage/felder.mjs';

const lies = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');
const flach = (t) => t.replace(/\s+/g, ' ');
const quelle = flach(lies('src/pages/betreuung-hauswirtschaft.astro'));

test('Abschnitte in der Reihenfolge von C3', () => {
  const marken = [
    '<Hero',
    'label="Leistungen"',
    'label="Für wen"',
    'label="Tarif"',
    'label="Finanzielle Hilfen"',
    'label="So funktioniert es"',
    'label="Häufige Fragen"',
    '<TrustLeiste bewegung />',
    '<Anfrage titel="Reden wir darüber, was Ihnen den Alltag erleichtert." anliegen="Betreuung und Hauswirtschaft" bewegung />',
  ];
  const stellen = marken.map((m) => quelle.indexOf(m));
  for (const [i, s] of stellen.entries()) assert.ok(s > 0, marken[i]);
  assert.deepEqual([...stellen].sort((a, b) => a - b), stellen);
  // Einziger Ocker-Kasten der Seite (Kernbotschaft), ein Hinweiskasten.
  assert.equal(quelle.match(/<Kernbotschaft\b/g).length, 1);
  assert.equal(quelle.match(/<Hinweiskasten\b/g).length, 1);
});

test('Texte wörtlich aus den Boards (Claude Design, Seite «Betreuung & Hauswirtschaft»)', () => {
  const texte = [
    // Hero (BH_D01_Hero, BH_M01_Hero)
    'BETREUUNG & HAUSWIRTSCHAFT · IM GANZEN KANTON ZUG',
    'Manchmal braucht es keine Pflege, sondern jemanden, der da ist.',
    'Ein Einkauf, der zu schwer geworden ist. Ein Mittagessen, das allein nicht mehr schmeckt. Ein Arzttermin, zu dem niemand begleiten kann. Unsere Betreuungspersonen packen an, hören zu und bringen Struktur in den Tag – regelmässig, verlässlich, mit festen Bezugspersonen.',
    "primaer={{ text: 'Beratung anfragen', ziel: '#kontakt' }}",
    // Leistungen (BH_D02_Leistungen)
    'WAS WIR ÜBERNEHMEN',
    'Alltag, der wieder funktioniert.',
    'Haushalt.',
    'Einkaufen, Kochen, Reinigen, Wäsche – so, wie es bei Ihnen zu Hause üblich ist.',
    'Begleitung.',
    'Zum Arzt, zur Therapie, zur Bank, zum Coiffeur – oder einfach an die frische Luft.',
    'Gesellschaft und Aktivierung.',
    'Gespräche, Spiele, Spaziergänge, gemeinsames Kochen. Jemand, der zuhört und Zeit hat.',
    'Entlastung für pflegende Angehörige.',
    'Ein paar Stunden pro Woche, damit auch Sie einmal durchatmen, einkaufen oder eigene Termine wahrnehmen können.',
    // Für wen (BH_D03_Fuer_wen)
    'FÜR WEN',
    'Zwei Wege – einer passt zu Ihnen.',
    'Sie pflegen bereits mit uns',
    'Sie sind bei der Pflegeunion als pflegender Angehöriger angestellt oder werden es bald? Dann ergänzt Betreuung und Hauswirtschaft Ihre Pflege dort, wo die Krankenversicherung nicht zahlt: Haushalt, Begleitung, Gesellschaft – und Entlastung für Sie selbst. Ihre Pflegefachperson plant das mit Ihnen.',
    'Sie brauchen Unterstützung im Alltag',
    'Sie oder Ihre Eltern leben im Kanton Zug und brauchen regelmässig jemanden, der einkauft, kocht, begleitet oder Gesellschaft leistet – ohne dass Pflege nötig ist? Auch dann kommen wir. Sobald Pflege dazukommt, sagen wir Ihnen ehrlich, was wir heute leisten und was noch nicht.',
    // Tarif (BH_D04_Tarif); Werte aus src/daten/betreuung.mjs
    'EIN TARIF, KEINE ÜBERRASCHUNGEN',
    'titel={`CHF ${TARIF.stunde} pro Stunde. Das ist alles.`}',
    'Betreuung und Hauswirtschaft sind private Leistungen; die Krankenversicherung übernimmt sie nicht. Bei uns gilt ein einziger Stundentarif von CHF {TARIF.stunde} – {TARIF.zuschlaege}. Einsätze dauern mindestens {TARIF.mindestdauer}. Sie erhalten vor dem ersten Einsatz eine schriftliche Offerte; was darin steht, gilt.',
    '{TARIF.vergleich && <p data-bewegung="text">{TARIF.vergleich}</p>}',
    // Finanzielle Hilfen (BH_D05_Hilfen)
    'Diese Unterstützungen stehen Ihnen möglicherweise zu.',
    'Ergänzungsleistungen (EL):',
    'Wenn Rente und Einkommen nicht reichen, übernimmt die EL zusätzliche Krankheits- und Behinderungskosten – auch Beiträge an Betreuung und Haushaltshilfe.',
    'Hilflosenentschädigung:',
    'Wer im Alltag regelmässig auf Hilfe angewiesen ist, hat Anspruch auf einen monatlichen Beitrag der AHV/IV – unabhängig von Einkommen und Vermögen.',
    'Zusatzversicherungen:',
    'Manche Zusatzversicherungen beteiligen sich an Betreuung und Haushaltshilfe. Wir helfen Ihnen beim Nachfragen.',
    'Wir prüfen diese Ansprüche im kostenlosen Erstgespräch mit. Das gehört bei uns zur Beratung.',
    // So funktioniert es (BH_D06_Schritte)
    'IN DREI SCHRITTEN',
    'Vom Anruf zum ersten Einsatz.',
    'Erstgespräch.',
    'Sie erzählen, was Sie brauchen – am Telefon oder bei Ihnen zu Hause. Kostenlos und unverbindlich. Wir melden uns innert 24 Stunden an Werktagen.',
    'Offerte.',
    'Sie erhalten schriftlich, welche Leistungen wir in welchem Umfang erbringen, wer kommt und was es kostet.',
    'Start.',
    'Ihre Betreuungsperson kommt zu den vereinbarten Zeiten. Passt etwas nicht, sagen Sie es uns – wir passen an.',
    // Häufige Fragen (BH_D07_FAQ)
    'titel="Häufige Fragen"',
    'Kommt immer dieselbe Person?',
    'Wir planen mit festen Bezugspersonen und stellen Ihnen Ihr Team vor. Bei Ferien oder Krankheit informieren wir Sie vorher, wer kommt.',
    'Wie kurzfristig kann ich buchen oder absagen?',
    'Regelmässige Einsätze planen wir mit Ihnen fest. Änderungen melden Sie bis ${TARIF.frist} am Vortag; die Details stehen in Ihrer Offerte.',
    'Meine Mutter braucht auch Hilfe beim Duschen. Übernehmen Sie das?',
    'Hilfe bei der Körperpflege ist Grundpflege und wird über die Krankenversicherung vergütet. Wenn ein Angehöriger sie leisten kann, stellen wir ihn dafür an. Pflege durch unser eigenes Fachpersonal bieten wir demnächst an – rufen Sie an, wir sagen Ihnen den Stand.',
    'Muss ich die Leistungen vorstrecken?',
    'Sie erhalten von uns monatlich eine Rechnung über die geleisteten Stunden. Beiträge von Ergänzungsleistungen oder Zusatzversicherungen beantragen wir mit Ihnen; die Rückerstattung läuft je nach Stelle direkt an Sie.',
  ];
  for (const text of texte) assert.ok(quelle.includes(text), text);
  // Häufige Fragen ohne Übertitel.
  const faq = quelle.split('label="Häufige Fragen"')[1].split('>')[0];
  assert.doesNotMatch(faq, /etikette=/);
});

test('Meta-Titel und Meta-Beschreibung aus C3, canonical und Sitemap', () => {
  assert.ok(quelle.includes('titel="Betreuung und Haushaltshilfe zu Hause im Kanton Zug | Pflegeunion Schweiz"'));
  assert.ok(
    quelle.includes(
      'beschreibung="Einkauf, Mahlzeiten, Begleitung, Gesellschaft, Entlastung für Angehörige: Betreuung und Hauswirtschaft der Pflegeunion im ganzen Kanton Zug. Fester Stundentarif, Erstgespräch kostenlos."',
    ),
  );
  assert.ok(quelle.includes('kanonisch="/betreuung-hauswirtschaft/"'));
  assert.match(lies('src/layouts/Basis.astro'), /<link rel="canonical" href=\{kanonischeAdresse\} \/>/);
  // Sitemap (src/pages/sitemap.xml.ts, als Text gelesen: läuft auch ohne TypeScript in Node).
  const seiten = lies('src/pages/sitemap.xml.ts').match(/export const SEITEN = \[([^\]]*)\];/)[1];
  assert.match(seiten, /'\/betreuung-hauswirtschaft\/'/);
  assert.doesNotMatch(seiten, /bausteine/);
  // FAQPage aus denselben Daten wie die sichtbaren Antworten (FAQ.astro).
  assert.match(lies('src/components/FAQ.astro'), /'@type': 'FAQPage'[\s\S]*acceptedAnswer: \{ '@type': 'Answer', text: f\.antwort \}/);
});

test('Hero-Bild: WebP 480/800/1200, Alt-Text, ohne Lazy Loading, Lizenz dokumentiert', () => {
  const hero = quelle.split('<Hero')[1].split('/>')[0];
  assert.match(hero, /bild="betreuung-rosengarten"/);
  assert.match(hero, /bildHoehe=\{1321\}/);
  assert.match(
    hero,
    /bildAlt="Eine junge Frau begleitet eine ältere Frau mit Rollator durch einen blühenden Rosengarten; beide lachen\."/,
  );
  assert.match(hero, /\bunterseite\b/);
  assert.doesNotMatch(hero, /sekundaer/);
  for (const breite of [480, 800, 1200]) {
    const groesse = statSync(new URL(`../public/bilder/betreuung-rosengarten-${breite}.webp`, import.meta.url)).size;
    assert.ok(groesse < 150 * 1024, `${breite}: ${groesse} Bytes`);
  }
  const komponente = lies('src/components/Hero.astro');
  assert.match(komponente, /loading="eager"/);
  assert.match(komponente, /fetchpriority="high"/);
  const lizenzen = lies('LIZENZEN.md');
  assert.match(lizenzen, /`betreuung-rosengarten` \| ohkIw4iyoWs \|/);
  assert.ok(lizenzen.includes('https://unsplash.com/photos/ohkIw4iyoWs'));
});

test('Kopfzeile: «Beratung anfragen» → #kontakt, aktiver Menüpunkt, eng unter 480 px', () => {
  const header = lies('src/components/Header.astro');
  assert.match(header, /'\/betreuung-hauswirtschaft': \{ text: 'Beratung anfragen', ziel: '#kontakt', breit: true \}/);
  assert.match(header, /\{ text: 'Betreuung & Hauswirtschaft', ziel: '\/betreuung-hauswirtschaft\/' \}/);
  assert.match(header, /aria-current=\{punkt\.ziel === aktuell \? 'page' : undefined\}/);
  assert.match(header, /\.menue-link\[aria-current='page'\] \{\s*text-decoration: underline;\s*text-decoration-thickness: 2px;/);
  assert.match(header, /class:list=\{\['kopfzeile', \{ 'kopfzeile--breiter-button': breiterButton \}\]\}/);
  // Unter 360 px: Seitenrand 4 px und Button-Innenabstand 12 px, 360–479 px ohne Zwischenräume.
  const stil = flach(header.split('<style>')[1]);
  assert.ok(
    stil.includes(
      '@media (max-width: 359px) { .kopfzeile--breiter-button .kopfzeile-inhalt { padding-inline: calc(var(--space-1) / 2); } .kopfzeile--breiter-button .kopf-button { padding-inline: calc(var(--space-1) * 1.5); } }',
    ),
  );
  assert.ok(stil.includes('@media (min-width: 360px) and (max-width: 479px) { .kopfzeile--breiter-button .kopfzeile-inhalt { gap: 0; } }'));
  // Schrift des Buttons bleibt 17 px (global.css).
  assert.doesNotMatch(stil, /kopf-button[^}]*font-size/);
});

test('Formular: «Betreuung und Hauswirtschaft» im HTML vorgewählt, Feld 2 dann verborgen', () => {
  const anfrage = lies('src/components/Anfrage.astro');
  assert.ok(ANLIEGEN.includes('Betreuung und Hauswirtschaft'));
  assert.match(anfrage, /<option value=\{a\} selected=\{a === vorgewaehlt\}>\{a\}<\/option>/);
  assert.match(anfrage, /if \(vorgewaehlt !== undefined && !ANLIEGEN\.includes\(vorgewaehlt\)\)/);
  assert.match(
    anfrage,
    /\.formular:not\(:has\(option\[value='Anstellung als pflegender Angehöriger'\]:checked\)\) \.feld--kurs \{\s*display: none;/,
  );
  // Rücksprung auf diese Seite: quellseite ist der aktuelle Pfad.
  assert.match(anfrage, /quellseite = Astro\.url\.pathname,/);
  // Nur diese Seite wählt vor; alle anderen Seiten bleiben wie bisher.
  for (const datei of ['src/pages/index.astro', 'src/pages/bausteine.astro']) {
    assert.doesNotMatch(lies(datei), /anliegen=/, datei);
  }
});

test('Verweise auf die Seite: Menü, Startseite Abschnitt 8, Fusszeile', () => {
  assert.match(lies('src/pages/index.astro'), /href="\/betreuung-hauswirtschaft\/">Betreuung & Hauswirtschaft ansehen<\/a>/);
  assert.match(lies('src/components/Footer.astro'), /\{ text: 'Betreuung & Hauswirtschaft', ziel: '\/betreuung-hauswirtschaft\/' \}/);
});
