# Projektregeln: Website Pflegeunion Schweiz

Diese Regeln gelten für alle Arbeiten in diesem Repository. Sie sind verbindlich,
solange sie nicht ausdrücklich geändert werden.

## Massgebende Grundlagen

- Massgebend ist das Webseitenkonzept in seiner aktuellen Fassung (Stand
  heute: V3.20 vom 07.10.2026) und der Styleguide Pflegeunion in seiner
  aktuellen Fassung (Stand heute: V1.2). Beide liegen im Claude-Projekt
  «Webseite Pflegeunion», nicht im Repository (vertraulich); die betreffenden
  Abschnitte werden dem Auftrag angehängt. Bei Widerspruch zwischen CLAUDE.md
  und einem angehängten Konzeptauszug gilt der Auszug; melde den Widerspruch
  im Pull Request.
- **Alle Webtexte wörtlich** aus Konzept Teil C und D. Nicht
  umformulieren; wenn ein Text nicht passt, im Pull Request nachfragen.
  Texte ändern sich nur zusammen mit dem Konzept.
- **Platzhalter in eckigen Klammern** (z. B. CHF [XX.–]) bleiben sichtbar
  stehen, bis die Geschäftsleitung den Wert liefert.
- Das verbindliche Erscheinungsbild steht in `design/brand-book.md`, die
  Werte dazu in `design/tokens.json` (siehe Design-Tokens).

## Technik

- Statische Website mit **Astro** (aktuell Version 7), Ausgabe nach `dist`.
- Deploy über **Netlify**: Build-Befehl `npm run build`, Publish-Verzeichnis `dist`.
- Einzige Serverfunktionen: die **Netlify Functions** für das
  Anfrageformular (Node, ES-Module, Netlify Functions v2):
  `netlify/functions/anfrage/` (Pfad `/api/anfrage`) für den Versand über
  Microsoft Graph und `netlify/functions/anfrage-gebremst.mjs` (Pfad
  `/api/anfrage-gebremst`) als Antwort bei überschrittenem Rate Limit (siehe
  Formular). Nur `node:crypto` und `fetch`, keine Abhängigkeiten;
  `netlify.toml` nennt das Verzeichnis.
- **Keine Cookies**, **kein Cookie-Banner** und keine vergleichbare Speicherung
  im Browser (kein localStorage, kein sessionStorage).
- **Kein Tracking**, keine Tracking-Pixel, keine Analytics. Statistik
  höchstens cookielos (Plausible oder Matomo ohne Cookies) und nur auf
  ausdrücklichen Auftrag.
- **Keine externen Ressourcen**: keine externen Skripte, keine externen
  Stylesheets, keine externen Schriften (auch keine Google Fonts oder CDNs),
  keine Einbettungen von Drittanbietern. Alle Ressourcen liegen im Repository
  und werden von der eigenen Domain ausgeliefert.
- **JavaScript**: keine Client-Komponenten, keine Frameworks. Alle Inhalte
  stehen im HTML. Alles respektiert `prefers-reduced-motion`.
  - Das **Lohnrechner-Skript** (Baustein F, `src/scripts/lohnrechner.js`;
    eigenständig, unter 10 KB, ohne Framework und Abhängigkeiten) ist das
    einzige Skript mit Logik. Ohne JavaScript zeigt die Seite die
    Fallback-Tabelle.
  - Zusätzlich erlaubt ist das **Menü-Skript** in
    `src/components/Header.astro`: inline, unter 1 KB, ohne Framework, keine
    externe Datei. Das Menü ist ohne JavaScript bedienbar (die Navigation
    bleibt sichtbar, der Burger bleibt verborgen; unter 1024 px ist die
    Kopfzeile dann nicht sticky und scrollt mit der Seite weg, reines CSS
    über das fehlende `data-js` des Skripts); das Skript blendet den
    Burger ein und ergänzt nur `aria-expanded`, Schliessen per Escape-Taste
    und Schliessen beim Antippen eines Menüpunkts. Dazu die eine Zeile der
    **Zeitprüfung** des Formulars: Beim Absenden trägt sie
    `performance.now()` (Millisekunden seit dem Laden) in das versteckte
    Feld `dauer` ein; sie hört am `document`, weil das Formular erst nach
    der Kopfzeile folgt. Kein eigenes Skript für den Versand. `npm test`
    prüft Grösse (Stand: 1'012 von 1'023 Bytes) und Verhalten.
  - Zusätzlich erlaubt ist das **Bewegungs-Skript** `src/scripts/bewegung.js`
    (nur Startseite; drittes Kleinskript neben Menü und Akkordeons): unter
    1 KB, ohne Framework, getrennt vom Lohnrechner. `Basis.astro` setzt es
    mit dem Parameter `bewegung` inline in den `<head>`, ohne `defer`, damit
    die Startklasse vor dem ersten Zeichnen steht (kein Aufblitzen, das
    Hero-Bild springt nicht) und Klasse und Beobachtung immer zusammen
    ankommen. Es setzt die Startklasse `.bewegung` auf `<html>` nur, wenn
    `prefers-reduced-motion` nicht aktiv ist und IntersectionObserver
    vorhanden ist, und beendet die Beobachtung pro Element nach dem Start.
    Ohne JavaScript, bei einem Fehler, mit «Bewegung reduzieren» und beim
    Drucken ist alles sofort da und steht still. `npm test`
    (`test/bewegung.test.mjs`) prüft Grösse und Verhalten.
  - Ebenfalls erlaubt: **weiche Akkordeons** (FAQ mit `details`/`summary`,
    das Öffnen nur per CSS).
  - **Mobil-Verdichtung** unter 768 px mit `details`/`summary` (Klasse
    `.klappe` in `global.css`), ohne JavaScript, Inhalt vollständig im HTML,
    ab 768 px immer offen. Zeile zum Antippen = der bestehende Titel mit
    Plus/Minus-Icon wie im FAQ, Tippfläche mindestens 44 px.
  - Strukturierte Daten als `<script type="application/ld+json">` sind Daten,
    kein Skript, und erlaubt.
- **WhatsApp** nur als Textlink mit Sprechblasen-Icon (Lucide
  «message-circle», Tiefblau, auf Tiefblau Weiss), überall derselbe Link
  `https://wa.me/41417842655?text=…`; kein schwebender Button, kein grünes
  WhatsApp-Logo, kein Skript oder Widget von Meta.
- **Lohnrechner**: Stundensätze **37.95** (mit Kurs) und **33.95**
  (Einstieg), **26 Tage pro Monat**, **312 Tage pro Jahr** (sechs Einsatztage
  pro Woche; Entscheid GL 22.09.2026, Art. 20 ArG) und BVG-Schwelle
  **22'680** (Jahreslohn), an einer einzigen Stelle konfiguriert: im Block
  `KONFIG` von `src/scripts/lohnrechner.js` (`SATZ_KURS`, `SATZ_EINSTIEG`,
  `TAGE_MONAT`, `TAGE_JAHR`, `BVG_SCHWELLE`). Monat
  gerundet auf CHF 10, Jahr auf CHF 100. Das Ergebnis zeigt den Lohn mit
  Kurs. Unter den Stundenfeldern steht das Kästchen «Ich habe den
  Pflegehelferkurs noch nicht abgeschlossen.» (standardmässig leer);
  angekreuzt zeigt der Rechner Monat und Jahr mit `SATZ_EINSTIEG` und direkt
  unter der Zahl «Nach dem Kurs, den wir bezahlen: …» mit `SATZ_KURS`
  (Auftrag GL 23.09.2026, Boards D02/M02_Lohnrechner_Kurs_Test); unter
  768 px steht die Zeile nach dem Button «Kostenloses Erstgespräch
  vereinbaren» und dem Jahresbetrag (Entscheid GL 07.10.2026). Die
  Pensionskasse steht nur ab der BVG-Schwelle, gemessen am Jahreslohn mit
  dem gezeigten Satz (leer ab 2 Stunden, angekreuzt ab 2½ Stunden). Die Zahlen 30,4 und 365 sowie
  CHF 2'310.–, 27'700.–, 2'060.–, 1'150.–, 3'460.– und 39.90 sind überholt
  und dürfen nicht vorkommen – im Rechner, in der Fallback-Tabelle, in
  Lohnbeispielen und in allen Texten (Pfadkoordinaten in den Logo-SVG sind
  davon nicht betroffen). Referenztabelle: Tabelle 2 der Korrektur vom
  22.09.2026, eingearbeitet ins Konzept, Teil D1:

  | Auswahl | Monat, mit Kurs | Jahr, mit Kurs | Monat, Einstieg | Jahr, Einstieg |
  | --- | --- | --- | --- | --- |
  | 1 Stunde | rund CHF 990.– | rund CHF 11'800.– | rund CHF 880.– | rund CHF 10'600.– |
  | 1½ Stunden | rund CHF 1'480.– | rund CHF 17'800.– | rund CHF 1'320.– | rund CHF 15'900.– |
  | 2 Stunden | rund CHF 1'970.– | rund CHF 23'700.– | rund CHF 1'770.– | rund CHF 21'200.– |
  | 2½ Stunden | rund CHF 2'470.– | rund CHF 29'600.– | rund CHF 2'210.– | rund CHF 26'500.– |
  | 3 Stunden | rund CHF 2'960.– | rund CHF 35'500.– | rund CHF 2'650.– | rund CHF 31'800.– |
  | mehr als 3 Stunden | über CHF 2'960.– | über CHF 35'500.– | über CHF 2'650.– | über CHF 31'800.– |

- **Formular**: acht Felder, vier davon Pflicht (Anliegen, Name, Telefon,
  Postleitzahl und Ort); Feld 2 (Pflegehelferkurs) nur bei «Anstellung als
  pflegender Angehöriger», per CSS `:has()`; ist im Rechner das Kästchen
  angekreuzt, wählt die Übergabe in Feld 2 «Nein, noch nicht» vor; Spam-Schutz mit Honeypot und
  Zeitprüfung, kein Captcha; keine Speicherung der Anfragen beim Hoster;
  keine Gesundheitsangaben als Pflichtfeld; Rechnerwerte als versteckte
  Felder (`stunden`, `ergebnis`); Zugangsdaten nur über
  Umgebungsvariablen. Die Funktion des Buttons «Ergebnis per E-Mail
  erhalten» im Lohnrechner folgt in einem eigenen Pull Request.
  - **Versand** über die Netlify Function `netlify/functions/anfrage/`
    (Pull Request «Formular: Versand über Microsoft 365»). Das Formular
    sendet ohne JavaScript ganz normal (POST an `/api/anfrage`); die
    Funktion prüft, verschickt und antwortet mit 303 zurück auf die Seite,
    von der die Anfrage kam, mit `#anfrage-gesendet` (Bestätigungstext aus
    D2) oder `#anfrage-fehler`; beide Texte und die Eingangsbestätigung
    wörtlich aus Webseitenkonzept V3.20, D2. Beide Rückmeldungen stehen oben im Formular,
    erscheinen nur per `:target` und tragen `tabindex="-1"` (Fokus beim
    Sprung); der Fehler als Tiefblau-Fläche mit weisser Schrift und weissen
    Links (Telefon, WhatsApp). Rücksprung nur auf eigene Pfade (beginnt mit
    «/», kein «//», kein Protokoll, kein Backslash).
  - Prüfung auf dem Server: Pflichtfelder 1, 3, 4, 6; Feld 1, 2 und 7 nur
    mit den erlaubten Werten; Höchstlängen (Name 120, Telefon 40, E-Mail
    254, Postleitzahl und Ort 80, Nachricht 3000 Zeichen, auch als
    `maxlength` im Formular). Ungültig → Fehler-Anker.
  - Formatregeln, im Browser (`pattern`) und auf dem Server gleich
    (`MUSTER` in `felder.mjs`): **Telefon** (Feld 4) mindestens 9 Ziffern;
    Leerzeichen, +, /, -, Klammern und Punkte zählen nicht mit, andere
    Zeichen sind nicht erlaubt, ausländische Nummern bleiben erlaubt.
    **E-Mail** (Feld 5) wie bei `type="email"`, zusätzlich mit Punkt in der
    Domain und danach mindestens zwei Buchstaben («michel@g» abgewiesen).
    Meldungen wie die Pflichtfeld-Meldungen (`:user-invalid`): Telefon leer
    «Damit wir Sie erreichen können, brauchen wir noch Ihre
    Telefonnummer.», Telefon ausgefüllt, aber ungültig «Bitte geben Sie Ihre
    Telefonnummer mit Vorwahl an, damit wir Sie erreichen können.»
    (unterschieden per `:placeholder-shown`, dafür trägt das Feld
    `placeholder=" "`), E-Mail «Bitte prüfen Sie Ihre E-Mail-Adresse – oder
    lassen Sie das Feld leer.»
  - Auswahlwerte, Bezeichnungen, Längen und Formatregeln stehen an einer
    Stelle, `netlify/functions/anfrage/felder.mjs`; `Anfrage.astro` bezieht
    Auswahlwerte, Längen und Formatregeln von dort.
  - Spam-Schutz: Honeypot `webseite` (unsichtbar, nicht per Tab erreichbar,
    `aria-hidden`, `autocomplete="off"`) und Zeitprüfung (Feld `dauer` aus
    dem Menü-Skript, unter 3 Sekunden = Spam; ohne JavaScript leer, dann
    entfällt nur die Zeitprüfung). Spam erhält die Antwort wie bei Erfolg,
    verschickt wird nichts.
  - Mails über Microsoft Graph (`POST /v1.0/users/{MAIL_FROM}/sendMail`),
    reiner Text, UTF-8: die Anfrage an `MAIL_TO` (alle acht Felder mit
    Bezeichnung aus D2, leere mit «–», Rechnerwerte, Seite, Datum und Uhrzeit
    Europe/Zurich; `replyTo` die E-Mail der anfragenden Person) und, nur
    wenn Feld 5 ausgefüllt ist, die Eingangsbestätigung (von `MAIL_FROM`,
    `replyTo` `MAIL_TO`, nur das Anliegen, keine weiteren Angaben). Beide
    mit `saveToSentItems: false`: Die Anfrage liegt in `MAIL_TO`, keine
    zweite Kopie in den gesendeten Elementen von `MAIL_FROM`. Schlägt nur die Bestätigung fehl,
    gilt die Anfrage als gesendet; schlägt die Mail an `MAIL_TO` fehl,
    Fehler-Anker.
  - **Rate Limit** (Netlify, `config.rateLimit` in `anfrage.mjs`): höchstens
    5 Aufrufe von `/api/anfrage` in 60 Sekunden je IP und Domain
    (`aggregateBy` als Liste `['ip', 'domain']`, sonst zählt Netlify nur je
    Domain). Darüber leitet Netlify intern auf `/api/anfrage-gebremst` um;
    diese Funktion verschickt nichts und antwortet mit 303 und
    `#anfrage-fehler` auf die eigene Seite (Feld `quellseite`, sonst Pfad
    aus dem Referer, sonst «/»). Code-Regeln gibt es laut Netlify auf allen
    Tarifen.
  - Anmeldung: App-Registrierung mit Zertifikat, Client-Credentials mit
    eigener Client Assertion (JWT, PS256, `x5t#S256`) über `node:crypto`,
    kein Client Secret, keine MSAL-Abhängigkeit. Das Token wird nur im
    Speicher der laufenden Funktion zwischengespeichert. Senden ist nur aus
    dem Postfach `MAIL_FROM` erlaubt (Exchange RBAC for Applications).
  - **Umgebungsvariablen** (nur bei Netlify gesetzt, für Production, Deploy
    Previews und Branch deploys; nie Werte ins Repository, in Tests, Logs
    oder Pull Requests): `MS_TENANT_ID`, `MS_CLIENT_ID`,
    `MS_CERT_THUMBPRINT_SHA256` (SHA-256-Fingerabdruck, Hex),
    `MS_CERT_PRIVATE_KEY_BASE64` (geheim: privater Schlüssel als PEM, Base64
    in einer Zeile), `MAIL_FROM`, `MAIL_TO`. Fehlt oder ist eine ungültig,
    bricht die Funktion ab (Fehler-Anker) und nennt im Log nur den Namen.
  - **Logging**: nie Formularinhalte, nie Werte der Umgebung, nie
    Fehlermeldungen von Microsoft (sie können Adressen enthalten). Erlaubt
    sind nur Status (auch `gebremst`), Feldname bei ungültigen Angaben, Spam-Grund, Schritt,
    HTTP-Status, Graph- bzw. AADSTS-Fehlercode und Request-ID, als eine
    JSON-Zeile. `npm test` (`test/anfrage.test.mjs`) prüft das nach jedem
    Aufruf.
  - Nichts wird gespeichert: keine Netlify Forms (kein `data-netlify`),
    keine Drittdienste. In jeder Netlify-Vorschau gehen echte Mails an
    `MAIL_TO`.

## Schrift

- Textschrift **Lato** in den Schnitten **Regular (400)** und **Bold (700)**
  für alles unterhalb des H1 (`--font-sans`).
- Titelschrift **Playfair Display Bold (700) nur für den H1** (`.text-h1`,
  auf Unterseiten zusätzlich `.text-h1--sub`; `--font-serif`). Nie unter
  24 px einsetzen. `.text-display` aus den Tokens wird auf der Webseite derzeit
  nicht eingesetzt.
- Die Schriftdateien liegen als lokale Webfonts unter `public/fonts/`
  (WOFF2, Subsets latin und latin-ext, `font-display: swap`) und werden über
  `@font-face` in `src/styles/global.css` eingebunden.
- Die Schriften werden **nie** von Google-Servern oder einem anderen externen
  CDN geladen.
- Manrope (Schrift der Wortmarke) wird auf der Webseite nicht geladen; das
  Logo kommt immer als Bilddatei.
- Lato steht unter der SIL Open Font License 1.1, siehe
  `public/fonts/LICENSE.txt`; Playfair Display ebenfalls, siehe
  `public/fonts/LICENSE-playfair-display.txt`.

## Logo

Die Logo-Dateien liegen als SVG unter `public/logos/`:

- `logo-horizontal-de.svg`, `logo-horizontal-fr.svg`, `logo-horizontal-it.svg`
  horizontales Logo mit Schriftzug, farbig, je Sprache
- `logo-horizontal-negativ.svg` horizontales Logo für dunkle Flächen, mit
  deutschem Schriftzug. Für Französisch und Italienisch gibt es bisher keine
  Negativ-Variante.
- `bildzeichen-farbig.svg` Bildzeichen allein, farbig
- `bildzeichen-negativ.svg` Bildzeichen allein für dunkle Flächen

Logo-Farben: Tiefblau `#1E3F6E` und Ocker `#C8963C`, die Negativ-Varianten
zusätzlich Weiss.

Aus `bildzeichen-farbig.svg` erzeugt und in `src/layouts/Basis.astro` im
Seitenkopf eingebunden:

- `public/favicon-32.png` Favicon, 32 px, transparenter Hintergrund
- `public/apple-touch-icon.png` Apple-Touch-Icon, 180 px, weisse Fläche, weil
  iOS transparente Icons sonst auf Schwarz setzt

Werden die SVG-Dateien ersetzt, werden diese beiden Icons neu erzeugt.

### Einsatz

- **Header**: horizontales Logo DE, farbig. Höhe 44 bis 52 px, Breite
  mindestens 140 px. Ohne Kachel, ohne Rahmen, ohne Schatten.
- **Mobil**: stehen weniger als 140 px Breite zur Verfügung, wird nur das
  Bildzeichen gezeigt.
- **Footer**: Negativ-Logo auf Tiefblau `#1E3F6E`.
- **Favicon und Social-Vorschau**: Bildzeichen allein, nie das horizontale Logo.

### Nicht erlaubt

- **Umfärben.** Die Logo-Farben werden nie geändert, auch nicht über CSS.
- **Verzerren.** Das Seitenverhältnis bleibt immer erhalten.
- Das Logo auf eine **ockerfarbene Fläche** setzen.
- Das Logo auf ein **Foto** oder eine andere unruhige Fläche setzen.

## Gestaltung

- Farben, Schriften, Abstände und Radien **nur über Tokens** aus
  `design/tokens.json` bzw. `src/styles/tokens.css`; keine Hex-Werte in
  Komponenten (Einzelheiten unter Design-Tokens).
- **Web-Schriftgrössen gemäss Konzept Teil B5 gehen vor den Print-Werten** des
  Design-Systems; sie sind in `src/styles/global.css` dokumentiert.
- Textfarbe: `--color-schwarz` (`#1B1B19`)
- Hintergrund: `--color-weiss` (`#FFFFFF`)
- Tiefblau für Kopfzeile und Akzente: `--color-tiefblau` (`#1E3F6E`)
- **Ocker nie als Schrift** (auch nicht Übertitel, Etiketten, Schrittzahlen,
  Zahlen); Ocker `--color-ocker` (`#C8963C`) nur für Linien-Icons, Linien und
  Grafik. Übertitel und Etiketten in Tiefblau, auf Tiefblau-Flächen in Weiss.
  Rahmen von Bedienelementen in text-gedaempft, linie nur für trennende
  Haarlinien. Massgebend: Nachtrag Gestaltung vom 22.09.2026.
  - Ocker-Icons erhalten die Farbe über `stroke`, nie über `color`.
    `npm test` (`test/ocker.test.mjs`) schlägt fehl, sobald eine CSS-Regel in
    `src/` die Eigenschaft `color` auf `--color-ocker` setzt.
  - Kontrast (WCAG 2.1, nachgerechnet 22.09.2026):

    | Kombination | Kontrast | Einsatz |
    | --- | --- | --- |
    | schwarz auf weiss | 17,3:1 | |
    | schwarz auf warmgrau | 15,2:1 | |
    | tiefblau auf weiss | 10,5:1 | |
    | tiefblau auf warmgrau | 9,3:1 | |
    | weiss auf tiefblau | 10,5:1 | |
    | text-gedaempft auf weiss | 6,7:1 | |
    | ocker auf weiss | 2,7:1 | nur Grafik, nie Schrift |
    | ocker auf warmgrau | 2,4:1 | nur Grafik, nie Schrift |
    | ocker auf tiefblau | 4,0:1 | nur Grafik, nie Schrift |
    | linie auf weiss | 1,4:1 | nur trennende Linien, nie Rahmen von Eingabefeldern |
- Playfair Display Bold nur für den H1 (siehe Schrift).
- **Keine Schatten** (kein `box-shadow`, kein `text-shadow`), **keine
  Verläufe** (kein `gradient`).
- **Keine Rundungen** ausser 4 px (`--radius-sm`) bei Buttons und
  Eingabefeldern.
- Radio-Buttons sind kreisförmig (24 px, Rahmen text-gedaempft, ausgewählt
  Rahmen und Punkt Tiefblau) – die einzige Rundung ausser 4 px bei Buttons
  und Feldern und dem Ring; damit sie von Checkboxen unterscheidbar sind.
- **Checkboxen** mit derselben Rahmenbehandlung wie Radio-Buttons, aber
  eckig: 24 px, Rahmen 1 px text-gedaempft, ohne Rundung; angekreuzt Fläche
  und Rahmen Tiefblau mit weissem Häkchen; Fokus 2 px Tiefblau
  (`:focus-visible`); die ganze Zeile mit der Beschriftung ist antippbar,
  mindestens 44 px hoch. Umsetzung mit der Klasse `.kaestchen` in
  `global.css` (Board D02_Lohnrechner_Kurs_Test).
- **Kein Rot.** Fehlerhinweise in Formularen als Tiefblau-Fläche mit weisser
  Schrift.
- Ruhige, sachliche Gestaltung ohne Effekte. Keine Karussells, keine
  Slider, keine Parallax-Effekte, kein Hover-Anheben, kein Festhalten von
  Abschnitten, kein Eingriff ins Scrollen. Erlaubt gemäss Konzept B5: das
  weiche Öffnen der FAQ-Akkordeons und das Aufzählen der Rechner-Zahl,
  beides mit `prefers-reduced-motion`.
- **Sanftes Einblenden beim Scrollen** ist auf der Startseite erlaubt
  (Auftrag «Startseite: sanfte Bewegung beim Scrollen», Vorlage Variante B
  aus Claude Design): einmal pro Element, sobald es zu etwa 15 % sichtbar
  ist, 40 px von unten und von transparent auf voll in 700 ms ease-out;
  im Abschnitt gestaffelt (Übertitel, H2, Text je 80 ms; Kacheln, Schritte,
  FAQ-Fragen und Personen je 120 ms). Die Bilder «Passt es?» und Betreuung
  blenden ein und zoomen im festen Rahmen von 108 % auf 100 % (900 ms), das
  Hero-Bild beim Laden bzw. sobald es ins Bild kommt von 108 % auf 100 %
  (1,4 s) und beim Scrollen durch den Hero bis höchstens 105 %
  (`animation-timeline: view()`, eigene Ebene `.hero-ebene`). Nur
  `transform` und `opacity`, keine Layoutverschiebung. Nie bewegt: Kopf-,
  Utility- und Fusszeile, Hero-Text, Telefonnummern, WhatsApp- und
  E-Mail-Links, Buttons, Rechner-Eingaben, Kästchen, Ergebnisstreifen,
  Formular und Fehlermeldungen; enthält ein Element einen Link oder Button,
  bleibt es still. Markiert wird mit `data-bewegung` (`text`, `kachel`,
  `bild`, `hero`). Ein Vorfahre mit `overflow: hidden` verhindert die
  Zeitleiste; dort `overflow: clip` verwenden.
- Alle interaktiven Elemente mit sichtbarem Fokusring 2 px Tiefblau
  (`:focus-visible` in `global.css`). **Alle Links und Tippflächen
  mindestens 44 px** (`--tippflaeche`; Links im Fliesstext mit
  `.tippflaeche-zeile`). Auf Tiefblau-Flächen ist der Fokusring 2 px
  `--color-auf-tiefblau` (Entscheid GL 22.09.2026): zentral über die Klasse
  `.flaeche-tiefblau` in `global.css`, die jede Tiefblau-Fläche mit
  fokussierbaren Elementen trägt (Anfrage-Abschnitt links, Fusszeile).

## Design-Tokens

`design/tokens.json` ist die einzige Quelle für Farben, Schriften, Abstände
und Radien. Daraus erzeugt `scripts/build-tokens.mjs` die Datei
`src/styles/tokens.css`; das geschieht automatisch in `npm run build` (und
`npm run dev`) vor dem Astro-Build.

- Farben, Abstände, Radien und Textstile **ausschliesslich** über die
  Variablen und Klassen aus `src/styles/tokens.css` verwenden:
  `--color-<name>`, `--space-<n>`, `--radius-<name>`, `--font-serif`,
  `--font-sans` sowie `.text-display`, `.text-h1`, `.text-h2`, `.text-h3`,
  `.text-lead`, `.text-body`, `.text-small`, `.text-label`.
- **Keine Hex-Werte** und keine freien Pixelabstände im Komponenten-Code
  (Layouts, Seiten, Komponenten, `global.css`). Erlaubte feste px-Werte
  ausserhalb der Tokens: Haarlinien 1 px, Fokusrahmen 2 px, die zentral
  definierten Breakpoints, technische Werte wie das Verstecken des
  Honeypot-Felds oder `.visually-hidden`. Die Web-Werte aus B5 stehen nur im
  B5-Block von `global.css`.
- `src/styles/tokens.css` **nie von Hand bearbeiten**. Änderungen an Werten
  nur über `design/tokens.json` per Pull Request; die CSS-Datei wird beim
  Build neu erzeugt.
- Die **Web-Abweichungen gemäss Konzept, Teil B5** (Zielgruppe
  über 50) sind in `src/styles/global.css` dokumentiert und gewollt:
  grössere Textstile (`.text-h1` 56 px auf der Startseite, `.text-h1--sub`
  40 px auf Unterseiten, `.text-h2` 32/40 px, `.text-h3` 22/30 px,
  `.text-body` 18 px / 1,55, `.text-small` 15/22 px, `.text-label` 13 px),
  die zusätzlichen Klassen `.text-result` (Rechner-Zahl) und `.text-step`
  (Schrittzahlen) sowie die Button-Masse (17 px, Gesamthöhe 52 px
  inklusive 1-px-Rahmen bei 22 px Zeilenhöhe, Innenabstand 14/28 px,
  `--radius-sm`). Alle übrigen Werte kommen unverändert aus den Tokens.
- Weitere Web-Textstile in `global.css`, ebenfalls aus dem Konzept:
  `.text-menu` (Mobilmenü 24 px, B2), `.text-faq` (FAQ-Frage 20 px, B4) und
  `.text-trust` (Trust-Leiste 16 px, B4) und `.text-result-einheit` («rund»,
  «CHF» und «.–» in der Rechner-Zahl, 24 px, B5). Aus Claude Design
  (Fassung A): `.text-button` (17/22 px Bold, Auswahlfelder des Rechners),
  `.text-h3-verdichtet` und `.text-body-verdichtet` (unter 768 px 18/28 bzw.
  16/24 px, darüber wie `.text-h3` bzw. `.text-body`). Dazu `.button--sekundaer`,
  `.etikette` (Übertitel in Tiefblau), `.textspalte` (680 px),
  `.kaestchen` (Checkbox, siehe Gestaltung) und `.visually-hidden`.
- Layoutgrössen der Webseite sind keine Design-Tokens und stehen nur in
  `global.css`: `--breite-inhalt` (1200 px), `--breite-kopfzeile` (1440 px),
  `--breite-text` (680 px), `--breite-hero-text` (560 px),
  `--hoehe-kopfzeile` (72 px),
  `--hoehe-kopfzeile-mobil` (60 px), `--tippflaeche` (44 px),
  `--tippflaeche-gross` (56 px, Auswahlfelder des Lohnrechners),
  `--hoehe-menuezeile` (50 px, Menüzeile 1024–1359 px),
  `--abstand-abschnitt` (64 px, ab 1024 px 96 px), `--seitenrand` (16 px,
  ab 768 px 24 px), `--hoehe-sticky` (Höhe der sticky Kopfzeile für
  Sprungziele; 0, wenn sie ohne JavaScript unter 1024 px wegscrollt),
  `--schritt-zahl-spalte` (Spalte der Schrittzahlen).
- Die Werte der Bewegung beim Scrollen sind ebenfalls keine Design-Tokens
  und stehen nur im Abschnitt «Bewegung» von `global.css`, je eine Zeile:
  `--bewegung-weg` (40 px), `--bewegung-dauer` (700 ms), `--bewegung-kurve`,
  `--bewegung-staffel` (80 ms), `--bewegung-staffel-kachel` (120 ms),
  `--bewegung-zoom` und `--bewegung-zoom-dauer` (108 %, 900 ms),
  `--bewegung-hero-zoom`, `--bewegung-hero-dauer` und
  `--bewegung-hero-scroll` (108 %, 1,4 s, 105 %). Die Schwelle von 15 %
  steht in `bewegung.js`.
- **Breakpoints** stehen an einer einzigen Stelle, im Abschnitt «Breakpoints
  der Webseite» in `global.css`: **360, 480, 640, 768, 1024 und 1360 px**. Da
  CSS-Variablen in Media Queries nicht wirken, tragen die Komponenten die
  Zahl ein, und zwar nur diese Werte in der Schreibweise `(min-width: Xpx)`
  bzw. `(max-width: X−1 px)`. `npm test` prüft alle Media Queries in `src/`.
  Neue Breakpoints nur dort ergänzen.
- `--radius-full` auf der Webseite **nicht verwenden**; Porträts sind eckig.
- Das Dunkel-Thema aus `design/tokens.json` wird auf der Webseite nicht
  verwendet; `tokens.css` enthält nur das Hell-Thema.

## Komponenten

Die wiederkehrenden Bausteine aus dem Konzept (Teile B2, B3, B4,
D2) liegen als Astro-Komponenten unter `src/components/`. Sie werden einmal
gebaut und mehrfach eingesetzt; Texte und Beschriftungen stammen wörtlich aus
dem Konzept (siehe Massgebende Grundlagen). Komponenten verwenden
ausschliesslich Variablen und Klassen aus `tokens.css` und `global.css`;
Farben, Abstände und Schriftgrössen werden nie direkt eingetragen.

| Komponente | Zweck | Einsatz gemäss Konzept |
| --- | --- | --- |
| `Hero.astro` | Hero (C1 Abschnitt 1; Claude Design H1b_Desktop, H1b_Mobil, Entscheid GL 24.09.2026): Übertitel, H1 in Playfair, Text max. 560 px, Primär- und Sekundär-Button, Telefonzeile, WhatsApp-Zeile; Foto eckig mit `object-fit: cover`, ab 1024 px randabfallend rechts ab Rasterspalte 8 über die volle Höhe des Abschnitts (Text sieben von zwölf Spalten), unter 1024 px nach dem Text randabfallend über die volle Breite, quadratisch, direkt am Abschnittsende; Bildmitte so, dass beide Personen auf jeder Breite vollständig sichtbar bleiben; ohne Ring, ohne Ocker-Linie; Foto ohne Lazy Loading, `fetchpriority="high"`; zwischen Rahmen (`.hero-bild`) und Foto die Ebene `.hero-ebene` für den Zoom beim Scrollen; Abschnitt und Rahmen schneiden mit `overflow: hidden`, wo die Zeitleiste wirkt mit `overflow: clip` | Erster Abschnitt jeder Seite |
| `Bildflaeche.astro` | Eckige Bildfläche mit festem Seitenverhältnis (3:2 oder 4:3); ohne Foto Warmgrau mit gedämpftem Text zur Bildidee, mit Foto `<img>` mit Lazy Loading (Bild im ersten Bildschirm: `prioritaet`) | Überall, wo das Konzept ein Bild vorsieht, ausser im Hero; keine Stockbilder, keine Icons als Ersatz |
| `Karten.astro` | Karten (C1 Abschnitt 4, B5): ab 768 px zwei mal zwei auf Warmgrau, Linien-Icon Ocker, Titel `.text-h3`, Text; keine Buttons; mobil Mobil-Verdichtung (Titel sichtbar, Text ausklappbar) | Startseite «Was Sie erhalten», Betreuung «Leistungen» |
| `Schritte.astro` | Nummerierte Schritte mit Haarlinien, Zahl in `.text-step` (Tiefblau), Titel, Text; mobil Mobil-Verdichtung (Zahl und Titel sichtbar, Text ausklappbar); schema.org HowTo | Startseite «So funktioniert es» (fünf), Betreuung (drei) |
| `Header.astro` | Kopfzeile (B2): sticky, mit JavaScript auch unter 1024 px (bestätigt GL 07.10.2026); ab 1360 px eine Zeile (Logo, fünf Menüpunkte, Telefon, Primär-Button); 1024–1359 px Hauptzeile 72 px und Menüzeile 50 px, beide sticky; darüber ab 1024 px die Utility-Zeile, die wegscrollt; unter 1024 px Burger rechts mit Menü-Skript, Telefon-Icon und Button bleiben sichtbar (nie Utility-Zeile und Burger gleichzeitig); ohne JavaScript unter 1024 px nicht sticky (Navigation offen, die Kopfzeile scrollt weg) | Jede Seite über `Basis.astro`; Primär-Button je Seite automatisch: Lohnrechner-Seite «Lohn berechnen» → `#rechner`, Betreuung & Hauswirtschaft «Beratung anfragen» → `#kontakt`, alle anderen Seiten (auch die Startseite) «Lohn berechnen» → `/#lohnrechner`; Parameter `buttonText`, `buttonZiel` nur für Ausnahmen |
| `Footer.astro` | Fusszeile (B3): Negativ-Logo, drei Spalten, Vertrauenszeile, Copyright, schema.org Organization | Jede Seite über `Basis.astro` |
| `Abschnitt.astro` | Rahmen für jeden Seitenabschnitt (B5): Fläche weiss oder warmgrau, Anker, Etikette, H2, Innenbreite 1200 px | Alle Seitenabschnitte; Flächen wechseln zwischen Weiss und Warmgrau |
| `TrustLeiste.astro` | Baustein A: fünf Belege mit Linien-Icon in Ocker | Unter dem Lohnrechner der Startseite, über dem Kontaktabschnitt jeder Unterseite |
| `Anfrage.astro` | Baustein B: Anfrage-Abschnitt mit Kontaktangaben (Telefon, E-Mail, WhatsApp) und Formular (D2, acht Felder), Anker `#kontakt`; mobil E-Mail, Erreichbarkeit und Nachricht unter «Weitere Angaben (freiwillig)»; Versand an `/api/anfrage` (Netlify Function, siehe Formular), Rückmeldungen `#anfrage-gesendet` und `#anfrage-fehler` oben im Formular per `:target`; Telefon und E-Mail mit `pattern` aus `felder.mjs`; Honeypot und Feld `dauer` für die Zeitprüfung | Am Ende jeder Seite; H2 je Seite per Parameter `titel` |
| `Hinweiskasten.astro` | Baustein C: Kasten tiefblau-hell «Gut zu wissen» | Definitionen und ehrliche Grenzen, mehrfach pro Seite erlaubt |
| `Kernbotschaft.astro` | Baustein D: Kasten ocker-hell | Höchstens einer pro Seite; Startseite: Lohn-Abschnitt |
| `FAQ.astro` | Baustein E: Akkordeon mit details/summary auf allen Breiten, erste Frage offen, schema.org FAQPage | Vier bis sechs Fragen pro Seite |
| `Lohnrechner.astro` | Baustein F (C1 Abschnitt 2, D1): Warmgrau, Übertitel, H2, Einleitung; Rechner auf weisser Fläche mit einer Frage (Stunden pro Tag) als Radio-Gruppe mit sechs Auswahlfeldern (fieldset/legend, Pfeiltasten, Vorbelegung 2 Stunden; Desktop in einer Reihe, mobil drei mal zwei), direkt darunter das Kästchen «Ich habe den Pflegehelferkurs noch nicht abgeschlossen.» (standardmässig leer, nur mit JavaScript), darunter der Zusatzhinweis bei «mehr als 3 Stunden»; darunter das Ergebnis als Streifen Ocker hell und `aria-live`-Region mit Zahl in `.text-result` (leer: Lohn mit Kurs; angekreuzt: Lohn bis zum Kurs mit der Zeile «Ihr Lohn bis zum Pflegehelferkurs», darunter «Nach dem Kurs, den wir bezahlen: …» mit dem Lohn mit Kurs), Fussnote und Buttons; unter 768 px eine ruhige, vollständige Ansicht ohne klebende Elemente (Entscheid GL 07.10.2026): Abstände aus Board «Test Rechner mobil», Variante A (Auswahlfelder 56 px, Kästchen-Zeile ohne Innenabstand, weniger Luft über dem Ergebnis), und nur per CSS (`order`, die Hüllen `.eingabe`, `.ergebnis-zahl`, `.ergebnis-rest` und `.knoepfe` mit `display: contents`, die Live-Region `.ergebnis` behält ihre Box) die Reihenfolge «brutto pro Monat» · «Kostenloses Erstgespräch vereinbaren» (8 px darunter) · Ocker-Linie · Jahresbetrag · «Nach dem Kurs …» · zweiter Button («Alle Details zum Lohn») am Schluss; der Zusatzhinweis bei «mehr als 3 Stunden» steht nach dem Ergebnis, damit sich über dem Button beim Antippen nichts verschiebt (Ocker-Linie, zweiter Button am Schluss, Zusatzhinweis nach dem Ergebnis und 8 px bestätigt GL 07.10.2026); Sprungziel ist das Element `.rechner-anker` mit der id aus `anker` am Anfang der Rechnerfläche, ab 768 px am Anfang des Abschnitts (wie bisher), darunter an der Frage «Wie viele Stunden pro Tag …» (ohne JavaScript an der Tabelle), die Höhe der Kopfzeile zieht `scroll-padding-top` ab; Übergabe an das Formular (`#kontakt`, Anliegen vorbelegt, angekreuzt Feld 2 «Nein, noch nicht», versteckte Felder stunden/ergebnis, Zeile «Ihre Schätzung aus dem Rechner» mit Schaltfläche «Entfernen» in `Anfrage.astro`; angekreuzt mit «bis zum Pflegehelferkurs»). Ohne JavaScript bleibt die Fallback-Tabelle (`[data-rechner-fallback]`) sichtbar: Tabelle 2 der Korrektur vom 22.09.2026 mit fünf Spalten (Auswahl · Monat, mit Kurs · Jahr, mit Kurs · Monat, Einstieg · Jahr, Einstieg), unter 640 px als Block je Auswahl ohne Querscrollen; mit JavaScript blendet das Skript sie aus und `[data-rechner-ui]` ein. Parameter: `anker` (id des Sprungziels, Standard `lohnrechner`), `vollstaendig` (Lohnrechner-Seite: Sekundär-Button «Ergebnis per E-Mail erhalten», vorerst ohne Funktion; «Alle Details zum Lohn» entfällt). **Stundensätze, Tage, BVG-Schwelle und Stundenstufen werden nur im Konfigurationsblock `KONFIG` von `src/scripts/lohnrechner.js` geändert**; die Komponente erzeugt Rechner und Fallback-Tabelle aus derselben Rechenlogik, prüft die Kontrollwerte aus D1 beim Build, und `npm test` prüft alle Ergebniswerte der Tabelle D1, beide Zustände des Kästchens sowie die Skriptgrösse. Messung: Ereignisse aus D1 als Aufrufe von `window.pflegeunionTrack(name, daten)`, falls vorhanden; kein Tracking-Skript | Startseite Abschnitt 2 (kompakt), Lohnrechner-Seite (`anker="rechner"`, `vollstaendig`); Musterseite `/bausteine/` zeigt die vollständige Fassung |
| `Demnaechst.astro` | Baustein G: ab 768 px sechs Kacheln im Haarlinien-Raster mit Etikette «DEMNÄCHST» auf jeder Kachel; mobil hinter «6 Leistungen in Vorbereitung», Etikette einmal über der Liste | Startseite Abschnitt 10 (kompakt), Über uns (mit Text) |
| `Icon.astro` | Linien-Icons (Lucide, ISC-Lizenz in `src/components/LICENSE-lucide.txt`) als Inline-SVG, 2 px Strich | In allen Bausteinen; neue Icons werden in `Icon.astro` ergänzt |

- Die Parameter jeder Komponente sind im Kommentarkopf der Datei beschrieben.
- Der Parameter `bewegung` (Hero, Abschnitt, Lohnrechner, TrustLeiste,
  Karten, Schritte, Bildflaeche, Hinweiskasten, FAQ, Anfrage, dazu
  `Basis.astro` für das Skript) markiert die bewegten Elemente mit
  `data-bewegung`; nur die Startseite setzt ihn (siehe Gestaltung).
- Die Startseite `src/pages/index.astro` setzt die zwölf Abschnitte aus
  Konzept C1 in dieser Reihenfolge um: Hero · Lohnrechner · Trust-Leiste ·
  Was Sie erhalten · So funktioniert es (`#ablauf`) · Passt es? · Ehrlich
  gesagt · Betreuung & Hauswirtschaft · Wer dahintersteht · Demnächst ·
  Häufige Fragen · Anfrage (`#kontakt`).
- Fotos liegen als WebP unter `public/bilder/` (je 480, 800 und 1200 px
  breit, `srcset`, eckig), Herkunft und Lizenz in `LIZENZEN.md`.
  `Bildflaeche.astro` bindet sie über `bild` ein; ohne Foto zeigt sie die
  Bildidee aus der Regieanweisung. Neue Fotos: WebP, maximal 1600 px breit,
  Lizenz in `LIZENZEN.md` dokumentiert.
- **Bildregel**: Fotos zeigen echte Situationen zuhause. Daneben sind
  Naturbilder erlaubt (Garten, Spaziergang, Seeufer); ein Naturbild darf den
  Einstieg (Hero) tragen, ohne Pflege zu zeigen. Helle Bilder bevorzugt.
  Nie: Stethoskop, weisser Kittel, Händchenhalten in Nahaufnahme, Filter.
  (Entscheid GL 24.09.2026, Hero mit Naturbild kcCMWn0G9Zo.)
- Die Lohnrechner-Seite `/lohnrechner/` (Konzept C2) besteht noch nicht.
  Der Lohnrechner erhält dort `anker="rechner"`, damit der Header-Button
  (`#rechner`) ihn erreicht. Beim Bau der Seite werden diese Inhalte aus der
  Korrektur vom 22.09.2026 übernommen:
  - Tabelle «Drei Beispiele aus dem Alltag» mit den Werten rund CHF 990.– /
    880.– (ca. 1 Stunde pro Tag), rund CHF 1'970.– / 1'770.– (ca. 2 Stunden)
    und rund CHF 2'960.– / 2'650.– (ca. 3 Stunden), je mit Kurs / Einstieg.
  - Fussnote unter der Tabelle: «* Richtwerte bei CHF 37.95 (mit Kurs) bzw.
    CHF 33.95 (Einstieg) pro Stunde, gerechnet auf sechs Einsatztage pro
    Woche (26 Tage pro Monat) und auf zehn Franken gerundet. Massgebend ist
    die individuelle Abklärung; der definitive Lohn steht in Ihrem
    Arbeitsvertrag.»
  - In der Lohn-FAQ nach Frage 4 als neue Frage 5 (die bisherige Frage 5
    «Wann steht mein Lohn definitiv fest?» wird Frage 6): «Ich pflege jeden
    Tag. Warum rechnet der Lohnrechner mit sechs Tagen pro Woche?» – «Weil
    das Arbeitsgesetz für jede Anstellung einen freien Tag pro Woche
    vorschreibt – auch für Sie. An diesem Tag übernimmt unsere Vertretung
    die Grundpflege, damit die gepflegte Person versorgt bleibt und Sie eine
    echte Pause haben. Bezahlt werden die Tage, an denen Sie selbst
    pflegen.»
- Die interne Musterseite `/bausteine/` (`src/pages/bausteine.astro`) zeigt
  jeden Baustein einmal mit Beispieltext. Sie ist `noindex`, steht nicht im
  Menü und **wird vor dem Go-live entfernt**.

## Textregeln

- Schweizer Hochdeutsch, **ss statt ß**.
- Anrede **«Sie»** auf allen Seiten.
- **Keine Ausrufezeichen**, keine Superlative, keine Genderzeichen, keine
  Doppelnennungen.
- Anführungszeichen als Guillemets «…».
- Zahlenformat: CHF 15.35, CHF 2'120.– (Apostroph als Tausendertrennzeichen,
  Gedankenstrich für ganze Franken).
- Hauptbegriff **«pflegende Angehörige»**.
- **«nicht gewinnorientiert»**, niemals «gemeinnützig» oder «Non-Profit».
- Lohn: **CHF 37.95 mit Kurs immer zuerst**, CHF 33.95 danach, **nie «ab»**.
  Einzige Ausnahme: Im Lohnrechner ist nach aktivem Ankreuzen von «Ich habe
  den Pflegehelferkurs noch nicht abgeschlossen.» der Lohn mit CHF 33.95 die
  Hauptzahl; der Lohn nach dem Kurs (CHF 37.95) steht direkt darunter, unter
  768 px nach dem Button und dem Jahresbetrag (Entscheid GL 07.10.2026).
- **Kein Lohndatum** auf der Webseite (kein Auszahlungstag).
- **Krankentaggeldversicherung** überall nennen, wo Versicherungen stehen;
  **Pensionskasse nur mit Bedingung** (ab BVG-Schwelle).
- Buttons sagen, was passiert («Lohn berechnen», «Kostenloses Erstgespräch
  vereinbaren», «Anfrage senden»); nie «Mehr erfahren», «Absenden», «Jetzt …».
- **Erstgespräch immer mit «kostenlos»** (Webseitenkonzept V3.20, Entscheid
  GL 07.10.2026): Button «Kostenloses Erstgespräch vereinbaren», Link
  «Kostenloses Erstgespräch» (z. B. Fusszeile), im Satz «im kostenlosen
  Erstgespräch». Ausgenommen
  sind Schritt 1 «Erstgespräch.» (mit «Kostenlos und unverbindlich.»),
  Übertitel und Text im Anfrage-Abschnitt (nennen «kostenlos» bereits), die
  Rechnerzeile über dem Formular und Namen im Code (`data-erstgespraech`,
  `rechner_erstgespraech`).
- Sachlicher, ruhiger Ton.

## Struktur

```
design/tokens.json   Design-Tokens, einzige Quelle für Farben, Schriften,
                     Abstände und Radien
design/brand-book.md Brand Book (Corporate Design)
LIZENZEN.md          Herkunft und Lizenzen von Fotos, Schriften und Icons
scripts/             build-tokens.mjs erzeugt src/styles/tokens.css
public/fonts/        lokale Lato- und Playfair-Display-Dateien (WOFF2) und
                     Lizenzen
public/logos/        Logo-Dateien (SVG)
public/bilder/       Fotos als WebP (480, 800, 1200 px)
public/              favicon-32.png und apple-touch-icon.png
src/components/      wiederkehrende Bausteine (Header, Footer, Hero, Abschnitt,
                     Lohnrechner, TrustLeiste, Karten, Schritte, Bildflaeche,
                     Anfrage, Hinweiskasten, Kernbotschaft, FAQ, Demnaechst,
                     Icon) und die Lucide-Lizenz
src/layouts/         Layouts, z. B. Basis.astro (Kopf- und Fusszeile)
src/pages/           Seiten, eine Datei pro Seite; bausteine.astro ist die
                     interne Musterseite
src/scripts/         lohnrechner.js: Rechner-Skript mit Konfigurationsblock
                     (Sätze, Stufen), unter 10 KB;
                     bewegung.js: Bewegung beim Scrollen (Startseite),
                     unter 1 KB, inline im Kopf
test/                npm test (node:test ohne Zusatzpakete):
                     lohnrechner.test.mjs prüft die Ergebniswerte aus D1,
                     beide Zustände des Kurs-Kästchens und die mobile
                     Ansicht (nichts klebt, Reihenfolge, Sprungziel),
                     breakpoints.test.mjs die Media Queries,
                     menue.test.mjs Grösse des Menü-Skripts, die
                     Zeile der Zeitprüfung und die Kopfzeile ohne
                     JavaScript unter 1024 px (nicht sticky),
                     anfrage.test.mjs den Formularversand mit
                     gemocktem Graph, Formatregeln, Rate Limit und
                     das Log,
                     bewegung.test.mjs Grösse und Verhalten des
                     Bewegungs-Skripts und die Regeln in global.css,
                     ocker.test.mjs, dass Ocker nie als Schrift
                     (color) gesetzt wird
src/styles/          tokens.css (erzeugt, nicht bearbeiten) und global.css
                     mit Schrifteinbindung, Web-Anpassungen, Breakpoints,
                     Grundlayout und Bewegung
astro.config.mjs     Astro-Konfiguration
netlify.toml         Build- und Deploy-Einstellungen für Netlify
netlify/functions/   anfrage/: Netlify Function für den Formularversand
                     (anfrage.mjs Einstieg und Rate Limit, felder.mjs
                     Felder, Formatregeln und Prüfung, mail.mjs
                     Mailtexte, graph.mjs Anmeldung und sendMail);
                     anfrage-gebremst.mjs: Antwort bei überschrittenem
                     Rate Limit
```

## Arbeitsweise

- Änderungen auf einem eigenen Branch entwickeln und als Pull Request
  einreichen. **Claude eröffnet Pull Requests, Menschen mergen.** Nie direkt
  auf main pushen.
- **Nichts kommt auf main ohne gesehene Netlify-Vorschau.**
- **Freigabe** (Entscheid GL 07.10.2026): Michel Gurnari entscheidet und
  gibt frei, im Einverständnis mit Cristian Fernandez – auch bei Zahlen mit
  Aussenwirkung, Leistungsversprechen, Personen-Nennungen und Zitaten. Eine
  zweite Freigabe der Geschäftsleitung gibt es nicht mehr. Impressum und
  Datenschutz werden zusätzlich juristisch geprüft.
- Vor dem Commit `npm run build` und `npm test` ausführen und sicherstellen,
  dass beides fehlerfrei durchläuft. Der Build erzeugt zuerst `src/styles/tokens.css`
  aus `design/tokens.json`.
- Keine zusätzlichen Abhängigkeiten ohne Absprache.
