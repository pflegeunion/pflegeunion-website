// Erzeugt src/styles/tokens.css aus design/tokens.json.
//
// design/tokens.json ist die einzige Quelle für Farben, Schriften, Abstände
// und Radien. Diese Datei wird vor jedem Astro-Build ausgeführt
// (siehe "build" in package.json). tokens.css nie von Hand bearbeiten.
//
// Ausgabe:
//   --color-<name>      Farben, Hell-Thema (das Dunkel-Thema wird auf der
//                       Webseite nicht verwendet); Aliasse wie "{tiefblau}"
//                       werden zu var(--color-tiefblau)
//   --font-serif, --font-sans
//                       Schriftfamilien; die Logo-Familie (Manrope) wird nicht
//                       ausgegeben, das Logo kommt als Bilddatei
//   --space-<n>         Abstandsstufen
//   --radius-<name>     Radien
//   .text-<name>        Textstile der Gruppen "serif" und "sans" mit
//                       font-family, font-size, line-height, font-weight,
//                       letter-spacing und text-transform

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quelle = resolve(wurzel, 'design/tokens.json');
const ziel = resolve(wurzel, 'src/styles/tokens.css');

const THEMA = 'light';
const FAMILIEN = ['serif', 'sans'];

const tokens = JSON.parse(await readFile(quelle, 'utf8'));

/** Wert eines Farb-Tokens im Hell-Thema oder als Verweis auf eine andere Farbe. */
function farbwert(value) {
  const roh = typeof value === 'string' ? value : value[THEMA];
  if (roh === undefined) {
    throw new Error(`Farb-Token ohne Wert für Thema "${THEMA}"`);
  }
  const alias = roh.match(/^\{([a-z0-9-]+)\}$/);
  return alias ? `var(--color-${alias[1]})` : roh.toLowerCase();
}

/** camelCase -> kebab-case, z. B. fontSize -> font-size. */
function cssName(name) {
  return name.replace(/[A-Z]/g, (b) => `-${b.toLowerCase()}`);
}

const zeilen = [];
const schreibe = (...z) => zeilen.push(...z);

schreibe(
  '/*',
  ' * AUTOMATISCH ERZEUGT aus design/tokens.json durch scripts/build-tokens.mjs.',
  ' * Nicht von Hand bearbeiten. Werte nur in design/tokens.json ändern.',
  ` * Design-System «${tokens.name}», Version ${tokens.version}.`,
  ' */',
  '',
  ':root {',
);

schreibe('  /* Farben (Hell-Thema) */');
for (const t of tokens.color.tokens) {
  schreibe(`  --color-${t.name}: ${farbwert(t.value)};`);
}

schreibe('', '  /* Schriftfamilien */');
for (const f of FAMILIEN) {
  const familie = tokens.type.families[f];
  if (!familie) throw new Error(`Schriftfamilie "${f}" fehlt in tokens.json`);
  schreibe(`  --font-${f}: ${familie};`);
}

schreibe('', `  /* Abstände: ${tokens.spacing.note} */`);
for (const t of tokens.spacing.tokens) {
  schreibe(`  --${t.name}: ${t.value};`);
}

schreibe('', `  /* Radien: ${tokens.radius.note} */`);
for (const t of tokens.radius.tokens) {
  schreibe(`  --${t.name}: ${t.value};`);
}

schreibe('}');

const EIGENSCHAFTEN = ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing', 'textTransform'];

for (const gruppe of tokens.type.groups) {
  if (!FAMILIEN.includes(gruppe.family)) continue;
  schreibe('', `/* ${gruppe.name}: ${gruppe.note} */`);
  for (const stil of gruppe.styles) {
    schreibe('', `/* ${stil.usage} */`, `.text-${stil.name} {`, `  font-family: var(--font-${gruppe.family});`);
    for (const e of EIGENSCHAFTEN) {
      if (stil[e] !== undefined) schreibe(`  ${cssName(e)}: ${stil[e]};`);
    }
    schreibe('}');
  }
}

await mkdir(dirname(ziel), { recursive: true });
await writeFile(ziel, zeilen.join('\n') + '\n', 'utf8');
console.log(`tokens.css erzeugt: ${ziel}`);
