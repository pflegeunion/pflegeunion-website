/**
 * Prüft das Menü-Skript der Kopfzeile (Inline-Skript in Header.astro):
 * neben dem Lohnrechner die einzige zweite Ausnahme, unter 1 KB.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
const skripte = [...header.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map((t) => t[1]);

test('Kopfzeile hat genau ein Inline-Skript', () => {
  assert.equal(skripte.length, 1);
});

test('Menü-Skript bleibt unter 1 KB', () => {
  const groesse = Buffer.byteLength(skripte[0], 'utf8');
  assert.ok(groesse < 1024, `Menü-Skript ist ${groesse} Bytes gross`);
});
