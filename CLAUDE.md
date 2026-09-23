# Projektregeln: Website Pflegeunion Schweiz

Diese Regeln gelten für alle Arbeiten in diesem Repository. Sie sind verbindlich,
solange sie nicht ausdrücklich geändert werden.

## Massgebende Grundlagen

- Massgebend ist das Webseitenkonzept in seiner aktuellen Fassung (Stand
  heute: V3.3 vom 22.09.2026) und der Styleguide Pflegeunion in seiner
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
    bleibt sichtbar, der Burger bleibt verborgen); das Skript blendet den
    Burger ein und ergänzt nur `aria-expanded`, Schliessen per Escape-Taste
    und Schliessen beim Antippen eines Menüpunkts. `npm test` prüft die
    Grösse.
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
  gerundet auf CHF 10, Jahr auf CHF 100. Das Ergebnis zeigt immer den Lohn
  mit Kurs; die Pensionskasse steht nur ab der BVG-Schwelle (ab 2 Stunden). Die Zahlen 30,4 und 365 sowie
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
  pflegender Angehöriger», per CSS `:has()`; Spam-Schutz mit Honeypot und
  Zeitprüfung, kein Captcha; keine Speicherung der Anfragen beim Hoster;
  keine Gesundheitsangaben als Pflichtfeld; Rechnerwerte als versteckte
  Felder (`stunden`, `ergebnis`); Zugangsdaten nur über
  Umgebungsvariablen. Stand: Das Formular hat noch kein Versandziel;
  Versand, Eingangsbestätigung und Zeitprüfung folgen in einem eigenen Pull
  Request. Damit kommt auch die Funktion des Buttons «Ergebnis per E-Mail
  erhalten» im Lohnrechner.

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
  Kommt eine Checkbox dazu: eckig, 4 px Radius, Rahmen text-gedaempft,
  ausgewählt Tiefblau.
- **Kein Rot.** Fehlerhinweise in Formularen als Tiefblau-Fläche mit weisser
  Schrift.
- Ruhige, sachliche Gestaltung ohne Effekte. Keine Karussells, keine
  Parallax-Effekte, kein Hover-Anheben. Erlaubt gemäss Konzept B5: das
  weiche Öffnen der FAQ-Akkordeons und das Aufzählen der Rechner-Zahl,
  beides mit `prefers-reduced-motion`.
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
  `.etikette` (Übertitel in Tiefblau), `.textspalte` (680 px) und
  `.visually-hidden`.
- Layoutgrössen der Webseite sind keine Design-Tokens und stehen nur in
  `global.css`: `--breite-inhalt` (1200 px), `--breite-kopfzeile` (1440 px),
  `--breite-text` (680 px), `--breite-hero-text` (560 px),
  `--hoehe-kopfzeile` (72 px),
  `--hoehe-kopfzeile-mobil` (60 px), `--tippflaeche` (44 px),
  `--tippflaeche-gross` (56 px, Auswahlfelder des Lohnrechners),
  `--hoehe-menuezeile` (50 px, Menüzeile 1024–1359 px),
  `--abstand-abschnitt` (64 px, ab 1024 px 96 px), `--seitenrand` (16 px,
  ab 768 px 24 px), `--hoehe-sticky` (Höhe der sticky Kopfzeile für
  Sprungziele), `--schritt-zahl-spalte` (Spalte der Schrittzahlen).
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
| `Hero.astro` | Hero (C1 Abschnitt 1): Übertitel, H1 in Playfair, Text max. 560 px, Primär- und Sekundär-Button, Telefonzeile, WhatsApp-Zeile, Bildfläche 3:2 mit dem Ring aus dem Logo dahinter; der Ring überdeckt auf keiner Breite Text, Telefonzeile oder Buttons (unter 1024 px beginnt er unter dem Textblock) | Erster Abschnitt jeder Seite; der Ring nur einmal pro Seite |
| `Bildflaeche.astro` | Eckige Bildfläche mit festem Seitenverhältnis (3:2 oder 4:3); ohne Foto Warmgrau mit gedämpftem Text zur Bildidee, mit Foto `<img>` mit Lazy Loading (Hero: `prioritaet`) | Überall, wo das Konzept ein Bild vorsieht; keine Stockbilder, keine Icons als Ersatz |
| `Karten.astro` | Karten (C1 Abschnitt 4, B5): ab 768 px zwei mal zwei auf Warmgrau, Linien-Icon Ocker, Titel `.text-h3`, Text; keine Buttons; mobil Mobil-Verdichtung (Titel sichtbar, Text ausklappbar) | Startseite «Was Sie erhalten», Betreuung «Leistungen» |
| `Schritte.astro` | Nummerierte Schritte mit Haarlinien, Zahl in `.text-step` (Tiefblau), Titel, Text; mobil Mobil-Verdichtung (Zahl und Titel sichtbar, Text ausklappbar); schema.org HowTo | Startseite «So funktioniert es» (fünf), Betreuung (drei) |
| `Header.astro` | Kopfzeile (B2): sticky; ab 1360 px eine Zeile (Logo, fünf Menüpunkte, Telefon, Primär-Button); 1024–1359 px Hauptzeile 72 px und Menüzeile 50 px, beide sticky; darüber ab 1024 px die Utility-Zeile, die wegscrollt; unter 1024 px Burger rechts mit Menü-Skript, Telefon-Icon und Button bleiben sichtbar (nie Utility-Zeile und Burger gleichzeitig) | Jede Seite über `Basis.astro`; Primär-Button je Seite automatisch: Lohnrechner-Seite «Lohn berechnen» → `#rechner`, Betreuung & Hauswirtschaft «Beratung anfragen» → `#kontakt`, alle anderen Seiten (auch die Startseite) «Lohn berechnen» → `/#lohnrechner`; Parameter `buttonText`, `buttonZiel` nur für Ausnahmen |
| `Footer.astro` | Fusszeile (B3): Negativ-Logo, drei Spalten, Vertrauenszeile, Copyright, schema.org Organization | Jede Seite über `Basis.astro` |
| `Abschnitt.astro` | Rahmen für jeden Seitenabschnitt (B5): Fläche weiss oder warmgrau, Anker, Etikette, H2, Innenbreite 1200 px | Alle Seitenabschnitte; Flächen wechseln zwischen Weiss und Warmgrau |
| `TrustLeiste.astro` | Baustein A: fünf Belege mit Linien-Icon in Ocker | Unter dem Lohnrechner der Startseite, über dem Kontaktabschnitt jeder Unterseite |
| `Anfrage.astro` | Baustein B: Anfrage-Abschnitt mit Kontaktangaben (Telefon, E-Mail, WhatsApp) und Formular (D2, acht Felder), Anker `#kontakt`; mobil E-Mail, Erreichbarkeit und Nachricht unter «Weitere Angaben (freiwillig)» | Am Ende jeder Seite; H2 je Seite per Parameter `titel` |
| `Hinweiskasten.astro` | Baustein C: Kasten tiefblau-hell «Gut zu wissen» | Definitionen und ehrliche Grenzen, mehrfach pro Seite erlaubt |
| `Kernbotschaft.astro` | Baustein D: Kasten ocker-hell | Höchstens einer pro Seite; Startseite: Lohn-Abschnitt |
| `FAQ.astro` | Baustein E: Akkordeon mit details/summary auf allen Breiten, erste Frage offen, schema.org FAQPage | Vier bis sechs Fragen pro Seite |
| `Lohnrechner.astro` | Baustein F (C1 Abschnitt 2, D1): Warmgrau, Übertitel, H2, Einleitung; Rechner auf weisser Fläche mit einer Frage (Stunden pro Tag) als Radio-Gruppe mit sechs Auswahlfeldern (fieldset/legend, Pfeiltasten, Vorbelegung 2 Stunden; Desktop in einer Reihe, mobil drei mal zwei), darunter das Ergebnis als Streifen Ocker hell und `aria-live`-Region mit Zahl in `.text-result` (immer Lohn mit Kurs), Zusatzhinweis bei «mehr als 3 Stunden», Fussnote und Buttons; Übergabe an das Formular (`#kontakt`, Anliegen vorbelegt, versteckte Felder stunden/ergebnis, Zeile «Ihre Schätzung aus dem Rechner» mit Schaltfläche «Entfernen» in `Anfrage.astro`). Ohne JavaScript bleibt die Fallback-Tabelle (`[data-rechner-fallback]`) sichtbar: Tabelle 2 der Korrektur vom 22.09.2026 mit fünf Spalten (Auswahl · Monat, mit Kurs · Jahr, mit Kurs · Monat, Einstieg · Jahr, Einstieg), unter 640 px als Block je Auswahl ohne Querscrollen; mit JavaScript blendet das Skript sie aus und `[data-rechner-ui]` ein. Parameter: `anker` (Standard `lohnrechner`), `vollstaendig` (Lohnrechner-Seite: zusätzlich Frage 3 Postleitzahl mit den Meldungen aus D1 und Sekundär-Button «Ergebnis per E-Mail erhalten», vorerst ohne Funktion; «Alle Details zum Lohn» entfällt). **Stundensätze, Tage, BVG-Schwelle, Stundenstufen und Postleitzahlen werden nur im Konfigurationsblock `KONFIG` von `src/scripts/lohnrechner.js` geändert**; die Komponente erzeugt Rechner und Fallback-Tabelle aus derselben Rechenlogik, prüft die Kontrollwerte aus D1 beim Build, und `npm test` prüft alle Ergebniswerte der Tabelle D1 sowie die Skriptgrösse. Messung: Ereignisse aus D1 als Aufrufe von `window.pflegeunionTrack(name, daten)`, falls vorhanden; kein Tracking-Skript | Startseite Abschnitt 2 (kompakt, ohne Postleitzahl), Lohnrechner-Seite (`anker="rechner"`, `vollstaendig`); Musterseite `/bausteine/` zeigt die vollständige Fassung |
| `Demnaechst.astro` | Baustein G: ab 768 px sechs Kacheln im Haarlinien-Raster mit Etikette «DEMNÄCHST» auf jeder Kachel; mobil hinter «6 Leistungen in Vorbereitung», Etikette einmal über der Liste | Startseite Abschnitt 10 (kompakt), Über uns (mit Text) |
| `Icon.astro` | Linien-Icons (Lucide, ISC-Lizenz in `src/components/LICENSE-lucide.txt`) als Inline-SVG, 2 px Strich | In allen Bausteinen; neue Icons werden in `Icon.astro` ergänzt |

- Die Parameter jeder Komponente sind im Kommentarkopf der Datei beschrieben.
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
- Die Postleitzahl-Liste `KONFIG.plzZug` in `src/scripts/lohnrechner.js` ist
  eine **vorläufige Liste** der elf Zuger Gemeinden inklusive Ortsteile, ohne
  6344 Meierskappel (LU); sie ist von der Geschäftsstelle zu prüfen (Konzept
  Teil F, Punkt 5).
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
- **Kein Lohndatum** auf der Webseite (kein Auszahlungstag).
- **Krankentaggeldversicherung** überall nennen, wo Versicherungen stehen;
  **Pensionskasse nur mit Bedingung** (ab BVG-Schwelle).
- Buttons sagen, was passiert («Lohn berechnen», «Erstgespräch vereinbaren»,
  «Anfrage senden»); nie «Mehr erfahren», «Absenden», «Jetzt …».
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
                     (Sätze, Stufen, Postleitzahlen), unter 10 KB
test/                npm test (node:test ohne Zusatzpakete):
                     lohnrechner.test.mjs prüft die Ergebniswerte aus D1,
                     breakpoints.test.mjs die Media Queries,
                     menue.test.mjs die Grösse des Menü-Skripts,
                     ocker.test.mjs, dass Ocker nie als Schrift
                     (color) gesetzt wird
src/styles/          tokens.css (erzeugt, nicht bearbeiten) und global.css
                     mit Schrifteinbindung, Web-Anpassungen, Breakpoints und
                     Grundlayout
astro.config.mjs     Astro-Konfiguration
netlify.toml         Build- und Deploy-Einstellungen für Netlify
```

## Arbeitsweise

- Änderungen auf einem eigenen Branch entwickeln und als Pull Request
  einreichen. **Claude eröffnet Pull Requests, Menschen mergen.** Nie direkt
  auf main pushen.
- **Nichts kommt auf main ohne gesehene Netlify-Vorschau.**
- Zahlen mit Aussenwirkung, Leistungsversprechen, Personen-Nennungen,
  Impressum und Datenschutz brauchen eine **zweite Freigabe der
  Geschäftsleitung** im Pull Request.
- Vor dem Commit `npm run build` und `npm test` ausführen und sicherstellen,
  dass beides fehlerfrei durchläuft. Der Build erzeugt zuerst `src/styles/tokens.css`
  aus `design/tokens.json`.
- Keine zusätzlichen Abhängigkeiten ohne Absprache.
