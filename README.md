# pflegeunion-website

Website des Vereins Pflegeunion Schweiz. Statische Site mit Astro, Deploy über
Netlify.

## Entwicklung

```bash
npm install
npm run dev      # lokaler Entwicklungsserver
npm run build    # Build nach dist/
npm run preview  # gebaute Site lokal ansehen
```

## Deploy

Netlify baut mit `npm run build` und liefert den Ordner `dist` aus, siehe
`netlify.toml`.

## Regeln

Die verbindlichen Regeln zu Technik, Schrift, Gestaltung und Sprache stehen in
[CLAUDE.md](CLAUDE.md).
