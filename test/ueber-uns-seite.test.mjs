/**
 * Prüft die Seite Über uns /ueber-uns/ (Claude Design, Seite «Über uns»,
 * Vorstand Variante A) im Quelltext: Reihenfolge der Abschnitte, Texte
 * wörtlich aus den Boards, Team, Vorstand und Treuhand an einer Stelle
 * (src/daten/personen.mjs), sichtbare Platzhalter, Stellen mit Anker und
 * Bewerbungs-Link, Meta-Texte, canonical, Sitemap, Organization mit Status
 * «nicht gewinnorientiert» und die Verweise von anderen Seiten.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TEAMBILD, TEAM, VORSTAND, TREUHAND } from '../src/daten/personen.mjs';
import { STELLEN } from '../src/daten/stellen.mjs';

const lies = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');
const flach = (t) => t.replace(/\s+/g, ' ');
const quelle = flach(lies('src/pages/ueber-uns.astro'));

test('Abschnitte in der Reihenfolge des Canvas', () => {
  const marken = [
    '<Hero',
    'label="Warum es uns gibt"',
    'label="Team"',
    'label="Vorstand und Treuhand"',
    'label="Grundsätze"',
    'label="Nicht gewinnorientiert"',
    'label="Qualität"',
    'label="Demnächst"',
    'label="Stellen"',
    '<TrustLeiste bewegung />',
    '<Anfrage titel="Reden wir über Ihre Situation." bewegung />',
  ];
  const stellen = marken.map((m) => quelle.indexOf(m));
  for (const [i, s] of stellen.entries()) assert.ok(s > 0, marken[i]);
  assert.deepEqual([...stellen].sort((a, b) => a - b), stellen);
  // Einziger Ocker-Kasten der Seite (Kernbotschaft), sechs Kacheln «Demnächst» wie auf der Startseite.
  assert.equal(quelle.match(/<Kernbotschaft\b/g).length, 1);
  assert.match(quelle, /<Demnaechst \/>/);
  // Formular wie auf der Startseite: nichts vorgewählt.
  assert.doesNotMatch(quelle, /anliegen=/);
});

test('Texte wörtlich aus den Boards (Claude Design, Seite «Über uns»)', () => {
  const texte = [
    // Hero (UU_D01_Hero, UU_M01_Hero)
    'ÜBER DIE PFLEGEUNION',
    'Wir glauben, dass Pflege besser geht.',
    'Besser für die Menschen, die Pflege brauchen: weil sie zu Hause bleiben können. Besser für die, die pflegen: weil sie Lohn, Wissen und Rückhalt bekommen. Und besser fürs System: weil ein nicht gewinnorientierter Verein jeden Franken dorthin lenkt, wo er wirkt. Dafür haben wir die Pflegeunion gegründet.',
    // Warum es uns gibt (UU_D02_Warum)
    'WARUM ES UNS GIBT',
    'Entstanden aus Erfahrung – und aus Überzeugung.',
    'Wer lange genug in der Spitex arbeitet, sieht zwei Dinge: viel Herz und viel Papier. Pflegefachpersonen, die Formulare statt Menschen betreuen. Familien, die längst pflegen, aber weder Anleitung noch Anerkennung erhalten. Aus dieser Erfahrung ist die Pflegeunion entstanden: eine Spitex-Organisation, die pflegende Angehörige anstellt und begleitet, die konsequent digitalisiert, was Maschinen können, und konsequent menschlich bleibt, wo es Menschen braucht. Gegründet 2026 als Verein mit Sitz in Rotkreuz, vom Kanton Zug bewilligt, tätig in allen elf Gemeinden.',
    // Team (UU_D03_Team)
    'DIE MENSCHEN DAHINTER',
    'Pflege hat bei uns ein Gesicht.',
    // Vorstand und Treuhand (UU_D04_Vorstand_A)
    'WER DEN VEREIN TRÄGT',
    'Ein Vorstand, der hinschaut. Zahlen, die jemand prüft.',
    'Der Vorstand führt den Verein strategisch und beaufsichtigt die Geschäftsleitung. Drei seiner fünf Mitglieder gehören nicht zur Geschäftsleitung. Die Mitgliederversammlung genehmigt Budget und Jahresrechnung. Unsere Buchhaltung führt eine externe Treuhänderin.',
    '>Vorstand</h3>',
    '>Treuhand</h3>',
    // Grundsätze (UU_D05_Grundsaetze)
    'WOFÜR WIR STEHEN',
    'Fünf Grundsätze, an denen Sie uns messen dürfen.',
    'Der Mensch entscheidet.',
    'Klienten und ihre Familien bestimmen mit – über Ziele, Abläufe und Grenzen.',
    'Fachlichkeit ohne Abstriche.',
    'Wir pflegen nach aktuellen Standards, bilden uns laufend weiter und lassen unsere Qualität überprüfen.',
    'Ehrliche Transparenz.',
    'Kosten, Löhne, Grenzen: Wir kommunizieren offen – auch, wenn die Antwort unbequem ist.',
    'Weniger Bürokratie, mehr Zeit.',
    'Digitale Werkzeuge nehmen uns die Administration ab. Die gewonnene Zeit gehört den Menschen.',
    'Fairness im Team.',
    'Faire Löhne, verlässliche Planung, Wertschätzung – für Pflegefachpersonen genauso wie für angestellte Angehörige.',
    // Nicht gewinnorientiert (UU_D06_Versprechen)
    'UNSER VERSPRECHEN',
    'Jeder Franken bleibt in der Pflege.',
    'Die Pflegeunion ist ein nicht gewinnorientierter Verein. Das heisst konkret: Es gibt keine Aktionäre und keine Gewinnausschüttung. Erwirtschaften wir Überschüsse, bleiben sie im Verein – für bessere Pflege, für die Aus- und Weiterbildung unserer Mitarbeitenden und für faire Anstellungsbedingungen. Das steht so in unseren Statuten.',
    // Qualität (UU_D07_Qualitaet)
    'QUALITÄT, DIE MAN PRÜFEN KANN',
    'Nicht behauptet. Belegt.',
    'Betriebsbewilligung des Kantons Zug – behördlich beaufsichtigt',
    'Abrechnung über die Krankenversicherung',
    'Bedarfsabklärung mit interRAI, dem anerkannten Schweizer Standard',
    'Instruktion, wöchentliche Begleitung in den ersten vier Wochen, danach monatliche Hausbesuche – schriftlich geregelt',
    // CIRRNET: Wortlaut gemäss Entscheid GL 07.10.2026, ohne Platzhalter (im Canvas noch die alte Fassung).
    'Angeschlossen an das nationale Fehlermeldesystem CIRRNET',
    'Digitale, lückenlose Pflegedokumentation – für Behörden prüfbar, für Sie transparent',
    // Demnächst (UU_D08_Demnaechst)
    'WIR BAUEN AUS',
    'Schritt für Schritt zur Spitex für alle Situationen.',
    'Wir haben uns entschieden, mit dem zu starten, was uns von allen anderen unterscheidet: der Anstellung und Begleitung pflegender Angehöriger, ergänzt durch Betreuung und Hauswirtschaft. Lieber ein Angebot, das vom ersten Tag an verlässlich funktioniert, als zehn, die es halb tun. Die nächsten Schritte sind in Vorbereitung; unsere Konzepte dafür liegen dem Kanton vor.',
    'Sie möchten informiert werden, sobald eine Leistung startet? Schreiben Sie uns über das Formular mit dem Stichwort «Ausbau» – wir melden uns, ohne Newsletter und ohne Werbung.',
    // Stellen (UU_D09_Stellen)
    'ARBEITEN BEI DER PFLEGEUNION',
    'Pflegen statt Formulare ausfüllen.',
    'Wir suchen diplomierte Pflegefachpersonen HF/FH, die Zeit für Menschen haben wollen – und die Freude daran haben, pflegende Angehörige anzuleiten und zu begleiten. Bei uns: eine begrenzte Zahl von Familien pro Pflegefachperson, digitale Dokumentation ohne Doppelspurigkeiten, kurze Wege zur Leitung, faire Löhne nach Branchenempfehlung und eine Organisation, die nicht auf Rendite ausgerichtet ist.',
    'Bewerbung senden',
    "Fragen zur Stelle beantwortet Christoph Willi, Pflegedienstleitung:{' '} <a class=\"tippflaeche-zeile\" href=\"tel:+41417842655\">041 784 26 55</a>",
  ];
  for (const text of texte) assert.ok(quelle.includes(text), text);
  assert.ok(!quelle.includes('[Freigabe GL ausstehend]'), 'CIRRNET-Zeile ohne Platzhalter');
});

test('Hero: ohne Button, Telefon und WhatsApp, Teambild als sichtbarer Platzhalter', () => {
  const hero = quelle.split('<Hero')[1].split('/>')[0];
  assert.doesNotMatch(hero, /primaer|sekundaer/);
  assert.match(hero, /bildIdee="\[Teambild folgt\]"/);
  assert.match(hero, /bild=\{TEAMBILD\.foto \|\| undefined\}/);
  assert.match(hero, /\bunterseite\b/);
  assert.match(hero, /\bbewegung\b/);
  assert.equal(TEAMBILD.foto, '');
  const komponente = lies('src/components/Hero.astro');
  assert.match(komponente, /primaer\?: Knopf;/);
  assert.match(komponente, /telefon = true,/);
  assert.match(komponente, /whatsapp = true,/);
  // Die Bildidee steht als Text im HTML (nicht per CSS), damit die Go-live-Sperre sie findet.
  assert.match(komponente, /<figcaption class="bild-idee text-small">\{bildIdee\}<\/figcaption>/);
});

test('Team, Vorstand und Treuhand an einer Stelle (src/daten/personen.mjs)', () => {
  assert.deepEqual(
    TEAM.map((p) => [p.name, p.funktion, p.zitat]),
    [
      ['Michel Gurnari', 'Geschäftsleitung', '«Jede Stunde, die wir der Bürokratie abnehmen, geben wir den Menschen zurück.»'],
      [
        'Cristian Fernandez',
        'Geschäftsleitung',
        '«Wer einen Menschen pflegt, leistet jeden Tag Arbeit. Wir sorgen dafür, dass sie fair bezahlt wird.»',
      ],
      [
        'Christoph Willi',
        'Pflegedienstleitung, dipl. Pflegefachmann HF',
        '«Gute Pflege beginnt mit Zuhören – bei den Klienten genauso wie bei den Angehörigen.»',
      ],
    ],
  );
  assert.deepEqual(
    VORSTAND.map((p) => [p.name, p.funktion, p.hintergrund]),
    [
      ['Michel Gurnari', 'Präsident', '[Hintergrund in einer Zeile]'],
      ['Cristian Fernandez', 'Vizepräsident', '[Hintergrund in einer Zeile]'],
      ['Rolf Günter', 'Mitglied', '[Hintergrund in einer Zeile]'],
      ['Fabian Blaser', 'Mitglied', '[Hintergrund in einer Zeile]'],
      ['Oliver Ruppen', 'Mitglied', '[Hintergrund in einer Zeile]'],
    ],
  );
  assert.deepEqual(TREUHAND, [{ name: '[Name]', firma: '[Firma, Ort]', aufgabe: '[Aufgabe in einer Zeile]' }]);
  // Fotos folgen: leer = Platzhalter; jede Person hat das Feld.
  for (const p of [...TEAM, ...VORSTAND]) assert.equal(p.foto, '', p.name);
  // Die Seite bezieht alles von dort und schreibt keine Namen selbst.
  assert.match(quelle, /import \{ TEAMBILD, TEAM, VORSTAND, TREUHAND \} from '\.\.\/daten\/personen\.mjs';/);
  const markup = lies('src/pages/ueber-uns.astro').split(/^---$/m)[2];
  for (const name of ['Michel Gurnari', 'Rolf Günter', 'Oliver Ruppen']) assert.ok(!markup.includes(name), name);
});

test('Porträts 3:4: Foto mit Alt-Text = Name, sonst «[Foto folgt]» als Text', () => {
  const portraet = flach(lies('src/components/Portraet.astro'));
  assert.match(portraet, /aspect-ratio: 3 \/ 4;/);
  assert.match(portraet, /alt=\{name\}/);
  assert.match(portraet, /width="1200" height="1600"/);
  assert.match(portraet, /loading="lazy"/);
  assert.ok(portraet.includes("breiten.map((w) => `/bilder/${foto}-${w}.webp ${w}w`)"));
  assert.ok(portraet.includes('>[Foto folgt]</span>'));
  // Kein Icon, keine Silhouette.
  assert.doesNotMatch(portraet, /<Icon|<svg/);
  // Team 96 × 128 px unter 768 px, Vorstand 84 × 112 px bzw. ab 768 px 96 × 128 px.
  const css = lies('src/styles/global.css');
  assert.match(css, /--breite-portraet: calc\(var\(--space-8\) \+ var\(--space-4\)\);/);
  assert.match(css, /--breite-portraet-klein: calc\(var\(--space-8\) \+ var\(--space-3\) - var\(--space-1\) \/ 2\);/);
  assert.match(quelle, /<Portraet foto=\{p\.foto\} name=\{p\.name\} art="vorstand"/);
});

test('Stellen: Anker #stellen, Liste aus src/daten/stellen.mjs, Bewerbung per E-Mail, kein JobPosting', () => {
  const stellen = quelle.slice(quelle.indexOf('anker="stellen"'), quelle.indexOf('<TrustLeiste'));
  assert.match(stellen, /anker="stellen"/);
  // Echter Eintrag statt Platzhalter (Entscheid GL 07.10.2026); weitere Stellen mit einer Zeile in STELLEN.
  assert.deepEqual(STELLEN, [
    {
      titel: 'Dipl. Pflegefachperson HF/FH',
      angaben: ['Pensum nach Absprache', 'Eintritt nach Vereinbarung', 'Einsätze im ganzen Kanton Zug'],
    },
  ]);
  assert.equal(STELLEN[0].angaben.join(' · '), 'Pensum nach Absprache · Eintritt nach Vereinbarung · Einsätze im ganzen Kanton Zug');
  for (const s of STELLEN) assert.doesNotMatch(s.titel + s.angaben.join(), /[[\]]/, s.titel);
  assert.match(quelle, /import \{ STELLEN \} from '\.\.\/daten\/stellen\.mjs';/);
  assert.ok(stellen.includes('<p class="stelle-titel">{s.titel}</p> <p class="stelle-angaben">{s.angaben.join(\' · \')}</p>'));
  assert.doesNotMatch(lies('src/daten/stellen.mjs'), /['"]JobPosting['"]/);
  assert.match(stellen, /<a class="button" href="mailto:info@pflegeunion\.ch">Bewerbung senden<\/a>/);
  // Darunter die Adresse als Link mit Tippfläche 44 px (Entscheid GL 07.10.2026).
  assert.match(
    stellen,
    /Bewerbung senden<\/a> <\/p> <p class="stellen-adresse"> <a class="tippflaeche-zeile" href="mailto:info@pflegeunion\.ch">info@pflegeunion\.ch<\/a> <\/p>/,
  );
  // Erst mit einer konkreten Stelle (Pensum, Eintrittsdatum) als JobPosting auszeichnen.
  assert.doesNotMatch(lies('src/pages/ueber-uns.astro'), /['"]JobPosting['"]/);
});

test('Meta-Titel, Meta-Beschreibung, canonical, Sitemap und Organization (nicht gewinnorientiert)', () => {
  assert.ok(quelle.includes('titel="Über uns – der Verein Pflegeunion Schweiz, Spitex in Rotkreuz"'));
  assert.ok(
    quelle.includes(
      'beschreibung="Die Pflegeunion ist ein nicht gewinnorientierter Verein aus Rotkreuz: Wir stellen pflegende Angehörige an, begleiten sie fachlich und nehmen der Pflege die Bürokratie ab. Team, Grundsätze, Qualität, Stellen."',
    ),
  );
  assert.ok(quelle.includes('kanonisch="/ueber-uns/"'));
  const seiten = lies('src/pages/sitemap.xml.ts').match(/export const SEITEN = \[([^\]]*)\];/)[1];
  assert.match(seiten, /'\/ueber-uns\/'/);
  // Organization aus der Fusszeile (Name, Adresse, Telefon) mit dem Status als nicht gewinnorientierter Verein.
  assert.ok(quelle.includes("organisation={{ nonprofitStatus: 'https://schema.org/NonprofitType' }}"));
  const basis = lies('src/layouts/Basis.astro');
  assert.match(basis, /<Footer organisation=\{organisation\} \/>/);
  const fusszeile = lies('src/components/Footer.astro');
  for (const teil of ["'@type': 'Organization'", "name: 'Verein Pflegeunion Schweiz'", "telephone: '+41 41 784 26 55'", "streetAddress: 'Grundstrasse 4b'", '...zusatz,']) {
    assert.ok(fusszeile.includes(teil), teil);
  }
});

test('Kopfzeile und Verweise: Menü, Startseite «Mehr über uns», Fusszeile «Über uns» und «Stellen»', () => {
  const header = lies('src/components/Header.astro');
  assert.match(header, /\{ text: 'Über uns', ziel: '\/ueber-uns\/' \}/);
  // Auf /ueber-uns/ gilt der Standard-Button «Lohn berechnen» → /#lohnrechner.
  assert.doesNotMatch(header, /'\/ueber-uns':/);
  assert.match(header, /const standardButton = buttonJeSeite\[pfad\] \?\? \{ text: 'Lohn berechnen', ziel: '\/#lohnrechner' \};/);
  assert.match(lies('src/pages/index.astro'), /href="\/ueber-uns\/">Mehr über uns<\/a>/);
  const fusszeile = lies('src/components/Footer.astro');
  assert.match(fusszeile, /\{ text: 'Über uns', ziel: '\/ueber-uns\/' \}/);
  assert.match(fusszeile, /\{ text: 'Stellen', ziel: '\/ueber-uns\/#stellen' \}/);
});
