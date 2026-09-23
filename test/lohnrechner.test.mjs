/**
 * Prüft die Rechenlogik des Lohnrechners gegen die Tabelle «Ergebniswerte
 * (zur Kontrolle der Umsetzung)» aus dem Konzept, Teil D1 (26 Tage pro
 * Monat, 312 Tage pro Jahr; Entscheid GL 22.09.2026, Art. 20 ArG):
 * sechs Stufen × Monat mit Kurs, Jahr mit Kurs, Monat Einstieg, Jahr Einstieg.
 * Dazu Pensionskasse ab BVG-Schwelle, Übergabezeile, Rundung, Anzeigeformat,
 * Skriptgrösse und Postleitzahl-Liste.
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
  uebergabeText,
} from '../src/scripts/lohnrechner.js';

// Kontrollwerte wörtlich aus Konzept D1.
const tabelle = [
  ['1 Stunde', 'rund CHF 990.–', "rund CHF 11'800.–", 'rund CHF 880.–', "rund CHF 10'600.–"],
  ['1½ Stunden', "rund CHF 1'480.–", "rund CHF 17'800.–", "rund CHF 1'320.–", "rund CHF 15'900.–"],
  ['2 Stunden', "rund CHF 1'970.–", "rund CHF 23'700.–", "rund CHF 1'770.–", "rund CHF 21'200.–"],
  ['2½ Stunden', "rund CHF 2'470.–", "rund CHF 29'600.–", "rund CHF 2'210.–", "rund CHF 26'500.–"],
  ['3 Stunden', "rund CHF 2'960.–", "rund CHF 35'500.–", "rund CHF 2'650.–", "rund CHF 31'800.–"],
  ['mehr als 3 Stunden', "über CHF 2'960.–", "über CHF 35'500.–", "über CHF 2'650.–", "über CHF 31'800.–"],
];

test('Konfiguration entspricht D1', () => {
  assert.equal(KONFIG.SATZ_KURS, 37.95);
  assert.equal(KONFIG.SATZ_EINSTIEG, 33.95);
  // Sechs Einsatztage pro Woche (Entscheid GL 22.09.2026, Art. 20 ArG).
  assert.equal(KONFIG.TAGE_MONAT, 26);
  assert.equal(KONFIG.TAGE_JAHR, 312);
  assert.equal(KONFIG.BVG_SCHWELLE, 22680);
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

test('Pensionskasse erst ab BVG-Schwelle (ab 2 Stunden)', () => {
  const mit = KONFIG.stufen.filter((s) => ergebnis(s).pensionskasse).map((s) => s.text);
  assert.deepEqual(mit, ['2 Stunden', '2½ Stunden', '3 Stunden', 'mehr als 3 Stunden']);
  assert.equal(ergebnis(stufeFuer('1')).pensionskasse, false);
  assert.equal(ergebnis(stufeFuer('1.5')).pensionskasse, false);
});

test('Übergabezeile über dem Formular', () => {
  assert.equal(
    uebergabeText(stufeFuer('2')),
    "Ihre Schätzung aus dem Rechner: rund CHF 1'970.– pro Monat bei 2 Stunden pro Tag mit Pflegehelferkurs. Wir nehmen sie ins Gespräch mit.",
  );
  assert.equal(
    uebergabeText(stufeFuer('mehr')),
    "Ihre Schätzung aus dem Rechner: über CHF 2'960.– pro Monat bei mehr als 3 Stunden pro Tag mit Pflegehelferkurs. Wir nehmen sie ins Gespräch mit.",
  );
});

test('Rundung kaufmännisch auf CHF 10.– bzw. CHF 100.–', () => {
  assert.equal(monatslohn(2, 37.95), 1970); // 1973.40
  assert.equal(monatslohn(2.5, 37.95), 2470); // 2466.75
  assert.equal(jahreslohn(1, 37.95), 11800); // 11840.40
  assert.equal(jahreslohn(2.5, 33.95), 26500); // 26481.00
});

test('Anzeigeformat mit Apostroph und «.–»', () => {
  assert.equal(ziffern(1970), "1'970");
  assert.equal(ziffern(23700), "23'700");
  assert.equal(ziffern(990), '990');
  assert.equal(ziffern(1234567), "1'234'567");
  assert.equal(chf(1970, false), "rund CHF 1'970.–");
  assert.equal(chf(2960, true), "über CHF 2'960.–");
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
