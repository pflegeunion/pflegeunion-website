# Projektregeln: Website Pflegeunion Schweiz

Diese Regeln gelten für alle Arbeiten in diesem Repository. Sie sind verbindlich,
solange sie nicht ausdrücklich geändert werden.

## Technik

- Statische Website mit **Astro** (aktuell Version 7), Ausgabe nach `dist`.
- Deploy über **Netlify**: Build-Befehl `npm run build`, Publish-Verzeichnis `dist`.
- **Kein JavaScript** im Browser. Keine Client-Komponenten, keine Frameworks.
  Einzige Ausnahmen, gemäss Webseitenkonzept V3.0: das Burger-Menü in
  `src/components/Header.astro` (kleines Inline-Skript ohne Abhängigkeiten,
  ohne JavaScript bleibt die Navigation sichtbar) und später der Lohnrechner
  (Baustein F). Strukturierte Daten als `<script type="application/ld+json">`
  sind Daten, kein Skript, und erlaubt.
- **Kein Tracking**, keine Analytics, keine externen Skripte, keine externen
  Stylesheets, keine Einbettungen von Drittanbietern.
- **Keine Cookies** und keine vergleichbare Speicherung im Browser.
- Alle Ressourcen liegen im Repository und werden von der eigenen Domain
  ausgeliefert.

## Schrift

- Textschrift **Lato** in den Schnitten **Regular (400)** und **Bold (700)**
  für alles unterhalb der obersten Titelebene (`--font-sans`).
- Titelschrift **Playfair Display Bold (700)** nur für `.text-display` und
  `.text-h1` (`--font-serif`). Nie unter 24 px einsetzen.
- Die Schriftdateien liegen als lokale Webfonts unter `public/fonts/`
  (WOFF2, Subsets latin und latin-ext) und werden über `@font-face` in
  `src/styles/global.css` eingebunden.
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

- Textfarbe: `--color-schwarz` (`#1B1B19`)
- Hintergrund: `--color-weiss` (`#FFFFFF`)
- Tiefblau für Kopfzeile und Akzente: `--color-tiefblau` (`#1E3F6E`)
- Ocker `--color-ocker` (`#C8963C`) nur als Akzent und für Schrift ab 24 px,
  nie für Fliesstext.
- **Keine Schatten** (kein `box-shadow`, kein `text-shadow`).
- **Keine abgerundeten Ecken.** Einzige Ausnahme: `--radius-sm` (4 px) bei
  Buttons und Eingabefeldern.
- Ruhige, sachliche Gestaltung ohne Effekte. Keine Karussells, keine
  Parallax-Effekte, kein Hover-Anheben. Erlaubt gemäss Konzept V3 B5: das
  weiche Öffnen der FAQ-Akkordeons und später das Aufzählen der Rechner-Zahl,
  beides mit `prefers-reduced-motion`.
- Alle interaktiven Elemente mit sichtbarem Fokusring 2 px Tiefblau
  (`:focus-visible` in `global.css`) und Tippflächen von mindestens 44 px
  (`--tippflaeche`).
- Fehlerhinweise in Formularen als Tiefblau-Fläche mit weisser Schrift, kein
  Rot.
- Die verbindliche Beschreibung des Erscheinungsbilds steht in
  `design/brand-book.md`.

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
  (Layouts, Seiten, Komponenten, `global.css`).
- `src/styles/tokens.css` **nie von Hand bearbeiten**. Änderungen an Werten
  nur über `design/tokens.json` per Pull Request; die CSS-Datei wird beim
  Build neu erzeugt.
- Die **Web-Abweichungen gemäss Webseitenkonzept V3.0, Teil B5** (Zielgruppe
  über 50) sind in `src/styles/global.css` dokumentiert und gewollt:
  grössere Textstile (`.text-h1` 56 px auf der Startseite, `.text-h1--sub`
  40 px auf Unterseiten, `.text-h2` 32/40 px, `.text-h3` 22/30 px,
  `.text-body` 18 px / 1,55, `.text-small` 15/22 px, `.text-label` 13 px),
  die zusätzlichen Klassen `.text-result` (Rechner-Zahl) und `.text-step`
  (Schrittzahlen) sowie die Button-Masse (17 px, Höhe 52 px, Innenabstand
  14/28 px, `--radius-sm`). Alle übrigen Werte kommen unverändert aus den
  Tokens.
- Weitere Web-Textstile in `global.css`, ebenfalls aus dem Konzept:
  `.text-menu` (Mobilmenü 24 px, B2), `.text-faq` (FAQ-Frage 20 px, B4) und
  `.text-trust` (Trust-Leiste 16 px, B4). Dazu `.button--sekundaer`,
  `.etikette` (Übertitel in Ocker), `.textspalte` (680 px) und
  `.visually-hidden`.
- Layoutgrössen der Webseite sind keine Design-Tokens und stehen nur in
  `global.css`: `--breite-inhalt` (1200 px), `--breite-kopfzeile` (1440 px),
  `--breite-text` (680 px), `--hoehe-kopfzeile` (72 px),
  `--hoehe-kopfzeile-mobil` (60 px), `--tippflaeche` (44 px).
- `--radius-full` auf der Webseite **nicht verwenden**; Porträts sind eckig.
- Das Dunkel-Thema aus `design/tokens.json` wird auf der Webseite nicht
  verwendet; `tokens.css` enthält nur das Hell-Thema.

## Komponenten

Die wiederkehrenden Bausteine aus Webseitenkonzept V3.0 (Teile B2, B3, B4,
D2) liegen als Astro-Komponenten unter `src/components/`. Sie werden einmal
gebaut und mehrfach eingesetzt; Texte und Beschriftungen stammen wörtlich aus
dem Konzept. Komponenten verwenden ausschliesslich Variablen und Klassen aus
`tokens.css` und `global.css`; Farben, Abstände und Schriftgrössen werden nie
direkt eingetragen.

| Komponente | Zweck | Einsatz gemäss Konzept |
| --- | --- | --- |
| `Header.astro` | Kopfzeile (B2): sticky, Logo, fünf Menüpunkte, Telefon, Primär-Button, Burger-Menü, Utility-Zeile | Jede Seite über `Basis.astro`; Button per Parameter (`buttonText`, `buttonZiel`), auf Betreuung & Hauswirtschaft «Beratung anfragen» → `#kontakt` |
| `Footer.astro` | Fusszeile (B3): Negativ-Logo, drei Spalten, Vertrauenszeile, Copyright, schema.org Organization | Jede Seite über `Basis.astro` |
| `Abschnitt.astro` | Rahmen für jeden Seitenabschnitt (B5): Fläche weiss oder warmgrau, Anker, Etikette, H2, Innenbreite 1200 px | Alle Seitenabschnitte; Flächen wechseln zwischen Weiss und Warmgrau |
| `TrustLeiste.astro` | Baustein A: fünf Belege mit Linien-Icon in Ocker | Unter dem Lohnrechner der Startseite, über dem Kontaktabschnitt jeder Unterseite |
| `Anfrage.astro` | Baustein B: Anfrage-Abschnitt mit Formular (D2), Anker `#kontakt` | Am Ende jeder Seite; H2 je Seite per Parameter `titel` |
| `Hinweiskasten.astro` | Baustein C: Kasten tiefblau-hell «Gut zu wissen» | Definitionen und ehrliche Grenzen, mehrfach pro Seite erlaubt |
| `Kernbotschaft.astro` | Baustein D: Kasten ocker-hell | Höchstens einer pro Seite; Startseite: Lohn-Abschnitt |
| `FAQ.astro` | Baustein E: Akkordeon mit details/summary und schema.org FAQPage | Vier bis sechs Fragen pro Seite |
| Baustein F | Lohnrechner-Modul (D1) | Startseite Abschnitt 2, Lohnrechner-Seite. **Noch nicht gebaut**, folgt in einem eigenen Pull Request als `Lohnrechner.astro` |
| `Demnaechst.astro` | Baustein G: sechs Kacheln im Haarlinien-Raster mit Etikette «DEMNÄCHST» | Startseite Abschnitt 10 (kompakt), Über uns (mit Text) |
| `Icon.astro` | Linien-Icons (Lucide, ISC-Lizenz in `src/components/LICENSE-lucide.txt`) als Inline-SVG, 2 px Strich | In allen Bausteinen; neue Icons werden in `Icon.astro` ergänzt |

- Die Parameter jeder Komponente sind im Kommentarkopf der Datei beschrieben.
- Das Anfrageformular hat noch kein Versandziel; Versand, Eingangsbestätigung
  und Zeitprüfung folgen in einem eigenen Pull Request.
- Die interne Musterseite `/bausteine/` (`src/pages/bausteine.astro`) zeigt
  jeden Baustein einmal mit Beispieltext. Sie ist `noindex`, steht nicht im
  Menü und **wird vor dem Go-live entfernt**.

## Sprache

- Deutsch in **Schweizer Rechtschreibung**: immer `ss` statt `ß`.
- **Keine Ausrufezeichen.**
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
src/components/      wiederkehrende Bausteine (Header, Footer, Abschnitt,
                     TrustLeiste, Anfrage, Hinweiskasten, Kernbotschaft, FAQ,
                     Demnaechst, Icon) und die Lucide-Lizenz
src/layouts/         Layouts, z. B. Basis.astro (Kopf- und Fusszeile)
src/pages/           Seiten, eine Datei pro Seite; bausteine.astro ist die
                     interne Musterseite
src/styles/          tokens.css (erzeugt, nicht bearbeiten) und global.css
                     mit Schrifteinbindung, Web-Anpassungen und Grundlayout
astro.config.mjs     Astro-Konfiguration
netlify.toml         Build- und Deploy-Einstellungen für Netlify
```

## Arbeitsweise

- Änderungen auf einem eigenen Branch entwickeln und als Pull Request einreichen.
- Vor dem Commit `npm run build` ausführen und sicherstellen, dass der Build
  fehlerfrei durchläuft. Der Build erzeugt zuerst `src/styles/tokens.css`
  aus `design/tokens.json`.
- Keine zusätzlichen Abhängigkeiten ohne Absprache.
