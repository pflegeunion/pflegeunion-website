/**
 * Prüft das Menü-Skript der Kopfzeile (Inline-Skript in Header.astro):
 * neben Lohnrechner und Bewegung (bewegung.test.mjs) erlaubt, unter 1 KB.
 * Dazu die Zeile der Zeitprüfung: Beim Absenden des Anfrageformulars steht
 * die Zeit seit dem Laden (performance.now()) im versteckten Feld «dauer».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const header = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
const skripte = [...header.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map((t) => t[1]);

test('Kopfzeile hat genau ein Inline-Skript', () => {
  assert.equal(skripte.length, 1);
});

test('Menü-Skript bleibt unter 1 KB', () => {
  const groesse = Buffer.byteLength(skripte[0], 'utf8');
  assert.ok(groesse < 1024, `Menü-Skript ist ${groesse} Bytes gross`);
});

test('Zeitprüfung: beim Absenden steht die Zeit seit dem Laden im Feld dauer', () => {
  const ereignisse = {};
  const document = {
    addEventListener: (typ, f) => (ereignisse[typ] = f),
    getElementById: () => null,
  };
  // Ohne Kopfzeile bricht das Menü-Skript ab; die Zeitprüfung ist trotzdem angemeldet.
  runInNewContext(skripte[0], { document, performance: { now: () => 4321.5 } });
  const dauer = { value: '' };
  ereignisse.submit({ target: { dauer } });
  assert.equal(String(dauer.value), '4321.5');
  // Formulare ohne Feld dauer bleiben unberührt.
  assert.doesNotThrow(() => ereignisse.submit({ target: {} }));
});
