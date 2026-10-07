/**
 * Prüft die Bewegung beim Scrollen (Startseite und Unterseiten): src/scripts/bewegung.js
 * bleibt unter 1 KB, setzt die Startklasse nur mit IntersectionObserver und
 * ohne «Bewegung reduzieren», staffelt je Abschnitt, beendet die
 * Beobachtung pro Element und nimmt die Startklasse bei einem Fehler zurück.
 * Dazu: Das Skript steht nur auf Startseite, Lohnrechner-, Betreuung- und Über-uns-Seite im Kopf, alle Werte stehen
 * in global.css an einer Stelle, und die Regeln, die etwas verstecken,
 * wirken nur mit der Startklasse, am Bildschirm und ohne «Bewegung
 * reduzieren».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const lies = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');
const skript = lies('src/scripts/bewegung.js');
const globalCss = lies('src/styles/global.css');

function klassen() {
  const menge = new Set();
  return {
    add: (k) => menge.add(k),
    remove: (k) => menge.delete(k),
    contains: (k) => menge.has(k),
  };
}

/** Führt das Skript mit einem nachgebildeten Browser aus. */
function starte({ observer = true, reduziert = false, fehler = false } = {}) {
  const html = { classList: klassen() };
  const ereignisse = {};
  const abschnitte = [{}, {}];
  const elemente = [
    ['80ms', 0],
    ['80ms', 0],
    ['120ms', 0],
    ['120ms', 0],
    ['80ms', 1],
  ].map(([versatz, a]) => ({ versatz, abschnitt: abschnitte[a], style: {}, classList: klassen() }));
  elemente.forEach((el) => (el.closest = (sel) => (sel === 'section' ? el.abschnitt : null)));
  const beobachter = { beobachtet: new Set() };
  class IntersectionObserver {
    constructor(rueckruf, optionen) {
      if (fehler) throw new Error('Testfehler');
      beobachter.rueckruf = rueckruf;
      beobachter.optionen = optionen;
    }
    observe(el) {
      beobachter.beobachtet.add(el);
    }
    unobserve(el) {
      beobachter.beobachtet.delete(el);
    }
  }
  const fenster = {
    document: {
      documentElement: html,
      addEventListener: (typ, f) => (ereignisse[typ] = f),
      querySelectorAll: (sel) => (sel === '[data-bewegung]' ? elemente : []),
    },
    matchMedia: (abfrage) => ({ matches: reduziert && abfrage === '(prefers-reduced-motion: reduce)' }),
    getComputedStyle: (el) => ({
      getPropertyValue: (name) => (name === '--bewegung-versatz' ? el.versatz : ''),
    }),
  };
  if (observer) fenster.IntersectionObserver = IntersectionObserver;
  fenster.window = fenster;
  runInNewContext(skript, fenster);
  return { html, ereignisse, elemente, beobachter };
}

const sichtbar = (el, time) => ({ target: el, isIntersecting: true, time });

test('bewegung.js bleibt unter 1 KB', () => {
  const groesse = Buffer.byteLength(skript, 'utf8');
  assert.ok(groesse < 1024, `bewegung.js ist ${groesse} Bytes gross`);
});

test('ohne IntersectionObserver keine Startklasse', () => {
  const { html, ereignisse } = starte({ observer: false });
  assert.equal(html.classList.contains('bewegung'), false);
  assert.equal(ereignisse.DOMContentLoaded, undefined);
});

test('mit «Bewegung reduzieren» keine Startklasse', () => {
  const { html, ereignisse } = starte({ reduziert: true });
  assert.equal(html.classList.contains('bewegung'), false);
  assert.equal(ereignisse.DOMContentLoaded, undefined);
});

test('Startklasse sofort, Beobachtung ab DOMContentLoaded bei etwa 15 %', () => {
  const { html, ereignisse, elemente, beobachter } = starte();
  assert.equal(html.classList.contains('bewegung'), true);
  assert.equal(beobachter.beobachtet.size, 0);
  ereignisse.DOMContentLoaded();
  assert.equal(beobachter.optionen.threshold, 0.15);
  assert.deepEqual([...beobachter.beobachtet], elemente);
});

test('Staffelung je Abschnitt, einmal pro Element', () => {
  const { ereignisse, elemente: [a, b, c, d, e], beobachter } = starte();
  ereignisse.DOMContentLoaded();
  const unsichtbar = { target: d, isIntersecting: false, time: 1000 };
  beobachter.rueckruf([sichtbar(a, 1000), sichtbar(b, 1000), sichtbar(c, 1000), unsichtbar, sichtbar(e, 1000)]);
  // Text 80 ms nach dem Vorgänger, Kachel 120 ms; der zweite Abschnitt beginnt bei 0.
  assert.deepEqual([a, b, c, e].map((el) => el.style.transitionDelay), ['0ms', '80ms', '200ms', '0ms']);
  assert.deepEqual([a, b, c, e].map((el) => el.classList.contains('bewegt')), [true, true, true, true]);
  assert.equal(d.classList.contains('bewegt'), false);
  assert.deepEqual([...beobachter.beobachtet], [d]);
  // Später sichtbar: kein Rückstand mehr, sofort.
  beobachter.rueckruf([sichtbar(d, 5000)]);
  assert.equal(d.style.transitionDelay, '0ms');
  assert.equal(beobachter.beobachtet.size, 0);
});

test('bei einem Fehler nimmt das Skript die Startklasse zurück', () => {
  const beimStart = starte({ fehler: true });
  beimStart.ereignisse.DOMContentLoaded();
  assert.equal(beimStart.html.classList.contains('bewegung'), false);

  const imRueckruf = starte();
  imRueckruf.ereignisse.DOMContentLoaded();
  imRueckruf.beobachter.rueckruf([{ target: {}, isIntersecting: true, time: 1 }]);
  assert.equal(imRueckruf.html.classList.contains('bewegung'), false);
});

test('Skript nur auf Startseite, Lohnrechner-, Betreuung- und Über-uns-Seite, inline im Kopf', () => {
  const basis = lies('src/layouts/Basis.astro');
  const kopf = basis.split('<head>')[1].split('</head>')[0];
  assert.match(kopf, /\{bewegung && <script is:inline set:html=\{bewegungSkript\} \/>\}/);
  assert.match(basis, /import bewegungSkript from '\.\.\/scripts\/bewegung\.js\?raw';/);
  const seiten = readdirSync(new URL('../src/pages/', import.meta.url)).filter((n) => n.endsWith('.astro'));
  const mitBewegung = seiten.filter((n) => /<Basis\s[^>]*\bbewegung\b/.test(lies(`src/pages/${n}`)));
  // Lohnrechner-Seite (Entscheid GL 07.10.2026), Betreuung & Hauswirtschaft (Auftrag Phase 6.2) und
  // Über uns (Auftrag Phase 6.3): Bewegung wie auf der Startseite.
  assert.deepEqual(mitBewegung, ['betreuung-hauswirtschaft.astro', 'index.astro', 'lohnrechner.astro', 'ueber-uns.astro']);
});

test('Werte der Bewegung stehen in global.css an einer Stelle', () => {
  const namen = [...globalCss.matchAll(/^\s*(--bewegung-[\w-]+)\s*:/gm)].map((t) => t[1]);
  const werte = [
    '--bewegung-weg',
    '--bewegung-dauer',
    '--bewegung-kurve',
    '--bewegung-staffel',
    '--bewegung-staffel-kachel',
    '--bewegung-zoom',
    '--bewegung-zoom-dauer',
    '--bewegung-hero-zoom',
    '--bewegung-hero-dauer',
    '--bewegung-hero-scroll',
  ];
  for (const name of werte) assert.equal(namen.filter((n) => n === name).length, 1, name);
  for (const datei of ['src/components', 'src/pages', 'src/layouts']) {
    for (const name of readdirSync(new URL(`../${datei}/`, import.meta.url))) {
      if (!name.endsWith('.astro')) continue;
      assert.doesNotMatch(lies(`${datei}/${name}`), /--bewegung-[\w-]+\s*:/, `${datei}/${name} setzt einen Bewegungswert`);
    }
  }
});

test('Verstecken nur mit Startklasse, am Bildschirm und ohne «Bewegung reduzieren»', () => {
  const kopf = '@media screen and (prefers-reduced-motion: no-preference) {';
  const beginn = globalCss.indexOf(kopf);
  assert.ok(beginn > 0, 'Media Query der Bewegung fehlt');
  // Ende des Blocks über die Klammern bestimmen.
  let tiefe = 0;
  let ende = beginn + kopf.length - 1;
  for (; ende < globalCss.length; ende += 1) {
    if (globalCss[ende] === '{') tiefe += 1;
    if (globalCss[ende] === '}' && --tiefe === 0) break;
  }
  const innen = globalCss.slice(beginn + kopf.length, ende);
  const aussen = globalCss.slice(0, beginn) + globalCss.slice(ende + 1);
  const ohneKommentare = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');
  // Innen: jede Regel beginnt mit der Startklasse.
  const selektoren = [...ohneKommentare(innen).matchAll(/([^{};]+)\{/g)]
    .map((t) => t[1].trim())
    .filter((s) => s && !s.startsWith('@'));
  assert.ok(selektoren.length > 0);
  for (const s of selektoren) {
    for (const teil of s.split(/,(?![^(]*\))/)) assert.match(teil.trim(), /^\.bewegung /, s);
  }
  // Aussen: keine Regel zu data-bewegung setzt opacity, transform, transition oder animation.
  for (const [, sel, rumpf] of ohneKommentare(aussen).matchAll(/([^{}]*data-bewegung[^{}]*)\{([^}]*)\}/g)) {
    assert.doesNotMatch(rumpf, /\b(opacity|transform|transition|animation)\b/, sel.trim());
  }
});
