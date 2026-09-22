# Projektregeln: Website Pflegeunion Schweiz

Diese Regeln gelten für alle Arbeiten in diesem Repository. Sie sind verbindlich,
solange sie nicht ausdrücklich geändert werden.

## Massgebende Grundlagen

- **Webseitenkonzept V3.1 vom 22.09.2026** (V3.0 mit eingearbeiteter Korrektur
  Lohnrechner, 26 Tage pro Monat). Bei Widerspruch gilt die **Korrektur
  Lohnrechner vom 22.09.2026**. V3.0 nicht mehr verwenden.
- **Alle Webtexte wörtlich** aus Konzept V3.1 Teil C und D. Nicht
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
  - Strukturierte Daten als `<script type="application/ld+json">` sind Daten,
    kein Skript, und erlaubt.
- **Lohnrechner**: Stundensätze **37.95** (mit Kurs) und **33.95**
  (Einstieg), **26 Tage pro Monat**, **312 Tage pro Jahr** (sechs Einsatztage
  pro Woche; Entscheid GL 22.09.2026, Art. 20 ArG), an einer einzigen Stelle
  konfiguriert: im Block `KONFIG` von `src/scripts/lohnrechner.js`. Monat
  gerundet auf CHF 10, Jahr auf CHF 100. Die Zahlen 30,4 und 365 sowie
  CHF 2'310.–, 27'700.–, 2'060.–, 1'150.–, 3'460.– und 39.90 sind überholt
  und dürfen nicht vorkommen – im Rechner, in der Fallback-Tabelle, in
  Lohnbeispielen und in allen Texten (Pfadkoordinaten in den Logo-SVG sind
  davon nicht betroffen). Referenztabelle: Tabelle 2 der Korrektur vom
  22.09.2026, eingearbeitet in Webseitenkonzept V3.1, Teil D1:

  | Auswahl | Monat, mit Kurs | Jahr, mit Kurs | Monat, Einstieg | Jahr, Einstieg |
  | --- | --- | --- | --- | --- |
  | 1 Stunde | rund CHF 990.– | rund CHF 11'800.– | rund CHF 880.– | rund CHF 10'600.– |
  | 1½ Stunden | rund CHF 1'480.– | rund CHF 17'800.– | rund CHF 1'320.– | rund CHF 15'900.– |
  | 2 Stunden | rund CHF 1'970.– | rund CHF 23'700.– | rund CHF 1'770.– | rund CHF 21'200.– |
  | 2½ Stunden | rund CHF 2'470.– | rund CHF 29'600.– | rund CHF 2'210.– | rund CHF 26'500.– |
  | 3 Stunden | rund CHF 2'960.– | rund CHF 35'500.– | rund CHF 2'650.– | rund CHF 31'800.– |
  | mehr als 3 Stunden | über CHF 2'960.– | über CHF 35'500.– | über CHF 2'650.– | über CHF 31'800.– |

- **Formular**: sieben Felder, vier davon Pflicht (Anliegen, Name, Telefon,
  Postleitzahl und Ort); Spam-Schutz mit Honeypot und Zeitprüfung, kein
  Captcha; keine Speicherung der Anfragen beim Hoster; keine
  Gesundheitsangaben als Pflichtfeld; Rechnerwerte als versteckte Felder
  (`stunden`, `kurs`, `ergebnis`); Zugangsdaten nur über
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
- **Web-Schriftgrössen gemäss V3.1 Teil B5 gehen vor den Print-Werten** des
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
  Parallax-Effekte, kein Hover-Anheben. Erlaubt gemäss Konzept V3.1 B5: das
  weiche Öffnen der FAQ-Akkordeons und das Aufzählen der Rechner-Zahl,
  beides mit `prefers-reduced-motion`.
- Alle interaktiven Elemente mit sichtbarem Fokusring 2 px Tiefblau
  (`:focus-visible` in `global.css`) und Tippflächen von mindestens 44 px
  (`--tippflaeche`). Auf Tiefblau-Flächen ist der Fokusring 2 px
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
- Die **Web-Abweichungen gemäss Webseitenkonzept V3.1, Teil B5** (Zielgruppe
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
  «CHF» und «.–» in der Rechner-Zahl, 24 px, B5). Dazu `.button--sekundaer`,
  `.etikette` (Übertitel in Tiefblau), `.textspalte` (680 px) und
  `.visually-hidden`.
- Layoutgrössen der Webseite sind keine Design-Tokens und stehen nur in
  `global.css`: `--breite-inhalt` (1200 px), `--breite-kopfzeile` (1440 px),
  `--breite-text` (680 px), `--breite-hero-text` (560 px),
  `--hoehe-kopfzeile` (72 px),
  `--hoehe-kopfzeile-mobil` (60 px), `--tippflaeche` (44 px),
  `--tippflaeche-gross` (56 px, Auswahlfelder des Lohnrechners).
- **Breakpoints** stehen an einer einzigen Stelle, im Abschnitt «Breakpoints
  der Webseite» in `global.css`: **480, 640, 768, 1024 und 1360 px**. Da
  CSS-Variablen in Media Queries nicht wirken, tragen die Komponenten die
  Zahl ein, und zwar nur diese Werte in der Schreibweise `(min-width: Xpx)`
  bzw. `(max-width: X−1 px)`. `npm test` prüft alle Media Queries in `src/`.
  Neue Breakpoints nur dort ergänzen.
- `--radius-full` auf der Webseite **nicht verwenden**; Porträts sind eckig.
- Das Dunkel-Thema aus `design/tokens.json` wird auf der Webseite nicht
  verwendet; `tokens.css` enthält nur das Hell-Thema.

## Komponenten

Die wiederkehrenden Bausteine aus Webseitenkonzept V3.1 (Teile B2, B3, B4,
D2) liegen als Astro-Komponenten unter `src/components/`. Sie werden einmal
gebaut und mehrfach eingesetzt; Texte und Beschriftungen stammen wörtlich aus
dem Konzept (siehe Massgebende Grundlagen). Komponenten verwenden
ausschliesslich Variablen und Klassen aus `tokens.css` und `global.css`;
Farben, Abstände und Schriftgrössen werden nie direkt eingetragen.

| Komponente | Zweck | Einsatz gemäss Konzept |
| --- | --- | --- |
| `Hero.astro` | Hero (C1 Abschnitt 1): Übertitel, H1 in Playfair, Text max. 560 px, Primär- und Sekundär-Button, Telefonzeile, Bildfläche 3:2 mit dem Ring aus dem Logo dahinter; der Ring überdeckt auf keiner Breite Text, Telefonzeile oder Buttons (unter 1024 px beginnt er unter dem Textblock) | Erster Abschnitt jeder Seite; der Ring nur einmal pro Seite |
| `Bildflaeche.astro` | Eckige Bildfläche mit festem Seitenverhältnis (3:2 oder 4:3); ohne Foto Warmgrau mit gedämpftem Text zur Bildidee, mit Foto `<img>` mit Lazy Loading (Hero: `prioritaet`) | Überall, wo das Konzept ein Bild vorsieht; keine Stockbilder, keine Icons als Ersatz |
| `Karten.astro` | Karten (C1 Abschnitt 4, B5): Warmgrau mit Haarlinie, Linien-Icon Ocker, Titel `.text-h3`, Text; keine Buttons | Startseite «Was Sie erhalten», Betreuung «Leistungen» |
| `Schritte.astro` | Nummerierte Schritte mit Zahl in `.text-step` (Tiefblau), Titel, Text; schema.org HowTo | Startseite «So funktioniert es» (fünf), Betreuung (drei) |
| `Header.astro` | Kopfzeile (B2): sticky, Logo, fünf Menüpunkte, Telefon, Primär-Button, Burger-Menü unter 1360 px mit Menü-Skript, Utility-Zeile nur ab 1360 px zusammen mit der Desktop-Navigation (nie gleichzeitig mit dem Burger) | Jede Seite über `Basis.astro`; Primär-Button je Seite automatisch: Lohnrechner-Seite «Lohn berechnen» → `#rechner`, Betreuung & Hauswirtschaft «Beratung anfragen» → `#kontakt`, alle anderen Seiten (auch die Startseite) «Lohn berechnen» → `/#lohnrechner`; Parameter `buttonText`, `buttonZiel` nur für Ausnahmen |
| `Footer.astro` | Fusszeile (B3): Negativ-Logo, drei Spalten, Vertrauenszeile, Copyright, schema.org Organization | Jede Seite über `Basis.astro` |
| `Abschnitt.astro` | Rahmen für jeden Seitenabschnitt (B5): Fläche weiss oder warmgrau, Anker, Etikette, H2, Innenbreite 1200 px | Alle Seitenabschnitte; Flächen wechseln zwischen Weiss und Warmgrau |
| `TrustLeiste.astro` | Baustein A: fünf Belege mit Linien-Icon in Ocker | Unter dem Lohnrechner der Startseite, über dem Kontaktabschnitt jeder Unterseite |
| `Anfrage.astro` | Baustein B: Anfrage-Abschnitt mit Formular (D2), Anker `#kontakt` | Am Ende jeder Seite; H2 je Seite per Parameter `titel` |
| `Hinweiskasten.astro` | Baustein C: Kasten tiefblau-hell «Gut zu wissen» | Definitionen und ehrliche Grenzen, mehrfach pro Seite erlaubt |
| `Kernbotschaft.astro` | Baustein D: Kasten ocker-hell | Höchstens einer pro Seite; Startseite: Lohn-Abschnitt |
| `FAQ.astro` | Baustein E: Akkordeon mit details/summary und schema.org FAQPage | Vier bis sechs Fragen pro Seite |
| `Lohnrechner.astro` | Baustein F (C1 Abschnitt 2, D1): Warmgrau, Übertitel, H2, Einleitung; Rechner auf weisser Fläche mit zwei Fragen als Radio-Gruppen (fieldset/legend, Pfeiltasten, Vorbelegung 2 Stunden / «Nein, noch nicht»), Ergebnis als `aria-live`-Region mit Zahl in `.text-result`, Hinweiskasten bei «mehr als 3 Stunden», Fussnote und Buttons; Übergabe an das Formular (`#kontakt`, Anliegen vorbelegt, versteckte Felder stunden/kurs/ergebnis, Zeile «Ihre Schätzung aus dem Rechner» mit Schliessen-Button in `Anfrage.astro`). Ohne JavaScript bleibt die Fallback-Tabelle (`[data-rechner-fallback]`) sichtbar: Tabelle 2 der Korrektur vom 22.09.2026 mit fünf Spalten (Auswahl · Monat, mit Kurs · Jahr, mit Kurs · Monat, Einstieg · Jahr, Einstieg), unter 640 px als Block je Auswahl ohne Querscrollen; mit JavaScript blendet das Skript sie aus und `[data-rechner-ui]` ein. Parameter: `anker` (Standard `lohnrechner`), `vollstaendig` (Lohnrechner-Seite: zusätzlich Frage 3 Postleitzahl mit den Meldungen aus D1 und Sekundär-Button «Ergebnis per E-Mail erhalten», vorerst ohne Funktion; «Alle Details zum Lohn» entfällt). **Stundensätze, Tage, Stundenstufen und Postleitzahlen werden nur im Konfigurationsblock `KONFIG` von `src/scripts/lohnrechner.js` geändert**; die Komponente erzeugt Rechner und Fallback-Tabelle aus derselben Rechenlogik, prüft die Kontrollwerte aus D1 beim Build, und `npm test` prüft alle Ergebniswerte der Tabelle D1 sowie die Skriptgrösse. Messung: Ereignisse aus D1 als Aufrufe von `window.pflegeunionTrack(name, daten)`, falls vorhanden; kein Tracking-Skript | Startseite Abschnitt 2 (kompakt, ohne Postleitzahl), Lohnrechner-Seite (`anker="rechner"`, `vollstaendig`); Musterseite `/bausteine/` zeigt die vollständige Fassung |
| `Demnaechst.astro` | Baustein G: sechs Kacheln im Haarlinien-Raster mit Etikette «DEMNÄCHST» | Startseite Abschnitt 10 (kompakt), Über uns (mit Text) |
| `Icon.astro` | Linien-Icons (Lucide, ISC-Lizenz in `src/components/LICENSE-lucide.txt`) als Inline-SVG, 2 px Strich | In allen Bausteinen; neue Icons werden in `Icon.astro` ergänzt |

- Die Parameter jeder Komponente sind im Kommentarkopf der Datei beschrieben.
- Die Startseite `src/pages/index.astro` setzt die zwölf Abschnitte aus
  Konzept C1 in dieser Reihenfolge um: Hero · Lohnrechner · Trust-Leiste ·
  Was Sie erhalten · So funktioniert es (`#ablauf`) · Passt es? · Ehrlich
  gesagt · Betreuung & Hauswirtschaft · Wer dahintersteht · Demnächst ·
  Häufige Fragen · Anfrage (`#kontakt`).
- Bilder liegen noch nicht vor. `Bildflaeche.astro` zeigt bis dahin die
  Bildidee aus der Regieanweisung; sobald Fotos vorliegen, werden `src` und
  `alt` gesetzt (WebP, maximal 1600 px breit, Lizenz dokumentiert).
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
- Buttons sagen, was passiert («Lohn berechnen», «Erstgespräch vereinbaren»,
  «Anfrage senden»); nie «Mehr erfahren», «Absenden», «Jetzt …».
- Sachlicher, ruhiger Ton.

## Struktur

```
design/tokens.json   Design-Tokens, einzige Quelle für Farben, Schriften,
                     Abstände und Radien
design/brand-book.md Brand Book (Corporate Design)
scripts/             build-tokens.mjs erzeugt src/styles/tokens.css
public/fonts/        lokale Lato- und Playfair-Display-Dateien (WOFF2) und
                     Lizenzen
public/logos/        Logo-Dateien (SVG)
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
