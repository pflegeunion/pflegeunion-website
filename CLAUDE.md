# Projektregeln: Website Pflegeunion Schweiz

Diese Regeln gelten für alle Arbeiten in diesem Repository. Sie sind verbindlich,
solange sie nicht ausdrücklich geändert werden.

## Technik

- Statische Website mit **Astro** (aktuell Version 7), Ausgabe nach `dist`.
- Deploy über **Netlify**: Build-Befehl `npm run build`, Publish-Verzeichnis `dist`.
- **Kein JavaScript** im Browser. Keine Client-Komponenten, keine Inline-Skripte,
  keine `<script>`-Tags.
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
- Ruhige, sachliche Gestaltung ohne Effekte und ohne Animationen.
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
- `--radius-full` auf der Webseite **nicht verwenden**; Porträts sind eckig.
- Das Dunkel-Thema aus `design/tokens.json` wird auf der Webseite nicht
  verwendet; `tokens.css` enthält nur das Hell-Thema.

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
src/layouts/         Layouts, z. B. Basis.astro
src/pages/           Seiten, eine Datei pro Seite
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
