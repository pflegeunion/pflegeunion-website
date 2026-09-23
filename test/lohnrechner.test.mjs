/**
 * Prüft die Rechenlogik des Lohnrechners gegen die Tabelle «Ergebniswerte
 * (zur Kontrolle der Umsetzung)» aus dem Konzept, Teil D1 (26 Tage pro
 * Monat, 312 Tage pro Jahr; Entscheid GL 22.09.2026, Art. 20 ArG):
 * sechs Stufen × Monat mit Kurs, Jahr mit Kurs, Monat Einstieg, Jahr Einstieg.
 * Dazu beide Zustände des Kästchens «Ich habe den Pflegehelferkurs noch nicht
 * abgeschlossen.» (leer: Lohn mit Kurs; angekreuzt: Lohn bis zum Kurs,
 * darunter der Lohn nach dem Kurs), Pensionskasse ab BVG-Schwelle mit dem
 * gezeigten Satz, Übergabe an das Formular, Rundung, Anzeigeformat,
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
  uebergabe,
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

// Gezeigte Werte in beiden Zuständen des Kästchens (Auftrag GL 23.09.2026,
// Boards D02/M02_Lohnrechner_Kurs_Test): Monat und Jahr als Hauptzahl bzw.
// in Zeile 2, «Nach dem Kurs …» (nur angekreuzt, immer mit Kurs) und
// Pensionskasse mit dem gezeigten Satz.
const zustaende = {
  leer: [
    ['1 Stunde', 'rund CHF 990.–', "rund CHF 11'800.–", false],
    ['1½ Stunden', "rund CHF 1'480.–", "rund CHF 17'800.–", false],
    ['2 Stunden', "rund CHF 1'970.–", "rund CHF 23'700.–", true],
    ['2½ Stunden', "rund CHF 2'470.–", "rund CHF 29'600.–", true],
    ['3 Stunden', "rund CHF 2'960.–", "rund CHF 35'500.–", true],
    ['mehr als 3 Stunden', "über CHF 2'960.–", "über CHF 35'500.–", true],
  ],
  angekreuzt: [
    ['1 Stunde', 'rund CHF 880.–', "rund CHF 10'600.–", false, 'rund CHF 990.–'],
    ['1½ Stunden', "rund CHF 1'320.–", "rund CHF 15'900.–", false, "rund CHF 1'480.–"],
    ['2 Stunden', "rund CHF 1'770.–", "rund CHF 21'200.–", false, "rund CHF 1'970.–"],
    ['2½ Stunden', "rund CHF 2'210.–", "rund CHF 26'500.–", true, "rund CHF 2'470.–"],
    ['3 Stunden', "rund CHF 2'650.–", "rund CHF 31'800.–", true, "rund CHF 2'960.–"],
    ['mehr als 3 Stunden', "über CHF 2'650.–", "über CHF 31'800.–", true, "über CHF 2'960.–"],
  ],
};

for (const [zustand, zeilen] of Object.entries(zustaende)) {
  const ohneKurs = zustand === 'angekreuzt';
  for (const [text, monat, jahr, pensionskasse, nachKurs] of zeilen) {
    test(`Kästchen ${zustand}: «${text}»`, () => {
      const w = ergebnis(KONFIG.stufen.find((s) => s.text === text), ohneKurs);
      assert.equal(chf(w.monat, w.mehr), monat, 'Monat (Hauptzahl)');
      assert.equal(chf(w.jahr, w.mehr), jahr, 'Jahr (Zeile 2)');
      assert.equal(w.pensionskasse, pensionskasse, 'Pensionskasse');
      if (ohneKurs) assert.equal(chf(w.monatMitKurs, w.mehr), nachKurs, 'Nach dem Kurs');
    });
  }
}

test('Kästchen leer entspricht dem bisherigen Ergebnis mit Kurs', () => {
  for (const s of KONFIG.stufen) {
    assert.deepEqual(ergebnis(s, false), ergebnis(s));
    assert.equal(ergebnis(s).monat, ergebnis(s).monatMitKurs);
    assert.equal(ergebnis(s).jahr, ergebnis(s).jahrMitKurs);
  }
});

test('Kästchen angekreuzt: Einstiegssatz, Tabellenwerte unverändert', () => {
  for (const s of KONFIG.stufen) {
    const w = ergebnis(s, true);
    assert.equal(w.monat, w.monatEinstieg);
    assert.equal(w.jahr, w.jahrEinstieg);
    // Die Fallback-Tabelle (fünf Spalten) bleibt in beiden Zuständen gleich.
    for (const feld of ['monatMitKurs', 'jahrMitKurs', 'monatEinstieg', 'jahrEinstieg']) {
      assert.equal(w[feld], ergebnis(s)[feld], feld);
    }
  }
});

test('Pensionskasse erst ab BVG-Schwelle (leer ab 2 Stunden, angekreuzt ab 2½ Stunden)', () => {
  const mit = (ohneKurs) =>
    KONFIG.stufen.filter((s) => ergebnis(s, ohneKurs).pensionskasse).map((s) => s.text);
  assert.deepEqual(mit(false), ['2 Stunden', '2½ Stunden', '3 Stunden', 'mehr als 3 Stunden']);
  assert.deepEqual(mit(true), ['2½ Stunden', '3 Stunden', 'mehr als 3 Stunden']);
  assert.equal(ergebnis(stufeFuer('1')).pensionskasse, false);
  assert.equal(ergebnis(stufeFuer('1.5')).pensionskasse, false);
  // 2 Stunden bis zum Kurs: 2 × 312 × 33.95 = 21'184.80, unter der Schwelle.
  assert.equal(ergebnis(stufeFuer('2'), true).pensionskasse, false);
});

// In der Zeile über dem Formular steht der Betrag ohne Umbruch (\u00a0).
test('Übergabe an das Formular, Kästchen leer', () => {
  assert.deepEqual(uebergabe(stufeFuer('2')), {
    zeile:
      "Ihre Schätzung aus dem Rechner: rund\u00a0CHF\u00a01'970.– pro Monat bei 2 Stunden pro Tag mit Pflegehelferkurs. Wir nehmen sie ins Gespräch mit.",
    ergebnis: "rund CHF 1'970.– pro Monat mit Pflegehelferkurs",
  });
  assert.deepEqual(uebergabe(stufeFuer('mehr'), false), {
    zeile:
      "Ihre Schätzung aus dem Rechner: über\u00a0CHF\u00a02'960.– pro Monat bei mehr als 3 Stunden pro Tag mit Pflegehelferkurs. Wir nehmen sie ins Gespräch mit.",
    ergebnis: "über CHF 2'960.– pro Monat mit Pflegehelferkurs",
  });
});

test('Übergabe an das Formular, Kästchen angekreuzt', () => {
  assert.deepEqual(uebergabe(stufeFuer('2'), true), {
    zeile:
      "Ihre Schätzung aus dem Rechner: rund\u00a0CHF\u00a01'770.– pro Monat bei 2 Stunden pro Tag bis zum Pflegehelferkurs. Wir nehmen sie ins Gespräch mit.",
    ergebnis: "rund CHF 1'770.– pro Monat bis zum Pflegehelferkurs",
  });
  assert.deepEqual(uebergabe(stufeFuer('mehr'), true), {
    zeile:
      "Ihre Schätzung aus dem Rechner: über\u00a0CHF\u00a02'650.– pro Monat bei mehr als 3 Stunden pro Tag bis zum Pflegehelferkurs. Wir nehmen sie ins Gespräch mit.",
    ergebnis: "über CHF 2'650.– pro Monat bis zum Pflegehelferkurs",
  });
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
