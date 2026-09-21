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

- Schriftfamilie **Lato** in den Schnitten **Regular (400)** und **Bold (700)**.
- Die Schriftdateien liegen als lokale Webfonts unter `public/fonts/`
  (WOFF2) und werden über `@font-face` in `src/styles/global.css` eingebunden.
- Die Schrift wird **nie** von Google-Servern oder einem anderen externen CDN
  geladen.
- Lato steht unter der SIL Open Font License 1.1, siehe
  `public/fonts/LICENSE.txt`.

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

- Textfarbe: `#1B1B19`
- Hintergrund: Weiss (`#FFFFFF`)
- Tiefblau für Kopfzeile und Akzente: `#1E3F6E`
- **Keine Schatten** (kein `box-shadow`, kein `text-shadow`).
- **Keine abgerundeten Ecken.** Einzige Ausnahme: **4 px** bei Buttons.
- Ruhige, sachliche Gestaltung ohne Effekte und ohne Animationen.

## Sprache

- Deutsch in **Schweizer Rechtschreibung**: immer `ss` statt `ß`.
- **Keine Ausrufezeichen.**
- Sachlicher, ruhiger Ton.

## Struktur

```
public/fonts/        lokale Lato-Dateien (WOFF2) und Lizenz
public/logos/        Logo-Dateien (SVG)
public/              favicon-32.png und apple-touch-icon.png
src/layouts/         Layouts, z. B. Basis.astro
src/pages/           Seiten, eine Datei pro Seite
src/styles/          global.css mit Farben, Schrift und Grundlayout
astro.config.mjs     Astro-Konfiguration
netlify.toml         Build- und Deploy-Einstellungen für Netlify
```

## Arbeitsweise

- Änderungen auf einem eigenen Branch entwickeln und als Pull Request einreichen.
- Vor dem Commit `npm run build` ausführen und sicherstellen, dass der Build
  fehlerfrei durchläuft.
- Keine zusätzlichen Abhängigkeiten ohne Absprache.
