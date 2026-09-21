/**
 * Prüft die Rechenlogik des Lohnrechners gegen die Tabelle «Ergebniswerte
 * (zur Kontrolle der Umsetzung)» aus Webseitenkonzept V3.0, Teil D1:
 * sechs Stufen × Monat mit Kurs, Jahr mit Kurs, Monat Einstieg, Jahr Einstieg.
 * Dazu Rundung, Anzeigeformat, Skriptgrösse und Postleitzahl-Liste.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import {
  KONFIG,
  ergebnis,
  chf,
  ziffern,
  monatslohn,
  jahreslohn,
  stufeFuer,
  plzImKantonZug,
} from '../src/scripts/lohnrechner.js';

// Kontrollwerte wörtlich aus Konzept D1.
const tabelle = [
  ['1 Stunde', "rund CHF 1'150.–", "rund CHF 13'900.–", "rund CHF 1'030.–", "rund CHF 12'400.–"],
  ['1½ Stunden', "rund CHF 1'730.–", "rund CHF 20'800.–", "rund CHF 1'550.–", "rund CHF 18'600.–"],
  ['2 Stunden', "rund CHF 2'310.–", "rund CHF 27'700.–", "rund CHF 2'060.–", "rund CHF 24'800.–"],
  ['2½ Stunden', "rund CHF 2'880.–", "rund CHF 34'600.–", "rund CHF 2'580.–", "rund CHF 31'000.–"],
  ['3 Stunden', "rund CHF 3'460.–", "rund CHF 41'600.–", "rund CHF 3'100.–", "rund CHF 37'200.–"],
  ['mehr als 3 Stunden', "über CHF 3'460.–", "über CHF 41'600.–", "über CHF 3'100.–", "über CHF 37'200.–"],
];

test('Konfiguration entspricht D1', () => {
  assert.equal(KONFIG.satzMitKurs, 37.95);
  assert.equal(KONFIG.satzEinstieg, 33.95);
  assert.equal(KONFIG.tageProMonat, 30.4);
  assert.equal(KONFIG.tageProJahr, 365);
  assert.deepEqual(
    KONFIG.stufen.map((s) => s.text),
    tabelle.map((z) => z[0]),
  );
});

for (const [text, monatKurs, jahrKurs, monatEinstieg, jahrEinstieg] of tabelle) {
  test(`Ergebniswerte «${text}»`, () => {
    const stufe = KONFIG.stufen.find((s) => s.text === text);
    const w = ergebnis(stufe);
    assert.equal(chf(w.monatMitKurs, w.mehr), monatKurs, 'Monat mit Kurs');
    assert.equal(chf(w.jahrMitKurs, w.mehr), jahrKurs, 'Jahr mit Kurs');
    assert.equal(chf(w.monatEinstieg, w.mehr), monatEinstieg, 'Monat Einstieg');
    assert.equal(chf(w.jahrEinstieg, w.mehr), jahrEinstieg, 'Jahr Einstieg');
  });
}

test('Rundung kaufmännisch auf CHF 10.– bzw. CHF 100.–', () => {
  assert.equal(monatslohn(2, 37.95), 2310); // 2307.36
  assert.equal(monatslohn(2.5, 37.95), 2880); // 2884.20
  assert.equal(jahreslohn(1, 37.95), 13900); // 13851.75
  assert.equal(jahreslohn(2.5, 33.95), 31000); // 30979.375
});

test('Anzeigeformat mit Apostroph und «.–»', () => {
  assert.equal(ziffern(2310), "2'310");
  assert.equal(ziffern(27700), "27'700");
  assert.equal(ziffern(950), '950');
  assert.equal(ziffern(1234567), "1'234'567");
  assert.equal(chf(2310, false), "rund CHF 2'310.–");
  assert.equal(chf(3460, true), "über CHF 3'460.–");
});

test('Vorbelegung 2 Stunden, «mehr als 3» rechnet mit 3', () => {
  assert.equal(stufeFuer('2').stunden, 2);
  assert.equal(stufeFuer('unbekannt').wert, '2');
  const mehr = stufeFuer('mehr');
  assert.equal(mehr.stunden, 3);
  assert.equal(mehr.mehr, true);
});

test('Postleitzahl-Liste Kanton Zug', () => {
  assert.equal(plzImKantonZug('6300'), true, 'Zug');
  assert.equal(plzImKantonZug('6343'), true, 'Rotkreuz');
  assert.equal(plzImKantonZug(6344), false, 'Meierskappel (LU) ausgeschlossen');
  assert.equal(plzImKantonZug('8000'), false, 'Zürich');
  assert.equal(plzImKantonZug(''), false);
  assert.equal(KONFIG.plzZug.includes(6344), false);
  assert.ok(KONFIG.plzZug.every((p) => p >= 6300 && p <= 6349));
});

test('Skriptdatei bleibt unter 10 KB', () => {
  const groesse = statSync(new URL('../src/scripts/lohnrechner.js', import.meta.url)).size;
  assert.ok(groesse < 10 * 1024, `lohnrechner.js ist ${groesse} Bytes gross`);
});
