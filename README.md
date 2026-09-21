# pflegeunion-website

Website des Vereins Pflegeunion Schweiz. Statische Site mit Astro, Deploy über
Netlify.

## Entwicklung

```bash
npm install
npm run dev      # lokaler Entwicklungsserver
npm run tokens   # src/styles/tokens.css aus design/tokens.json erzeugen
npm run build    # Tokens erzeugen und Build nach dist/
npm run preview  # gebaute Site lokal ansehen
```

## Deploy

Netlify baut mit `npm run build` und liefert den Ordner `dist` aus, siehe
`netlify.toml`.

## Regeln

Die verbindlichen Regeln zu Technik, Schrift, Gestaltung und Sprache stehen in
[CLAUDE.md](CLAUDE.md). Das Design-System liegt unter `design/`
(`tokens.json`, `brand-book.md`), die wiederkehrenden Bausteine unter
`src/components/`. Die interne Musterseite `/bausteine/` zeigt alle
Bausteine und wird vor dem Go-live entfernt.
