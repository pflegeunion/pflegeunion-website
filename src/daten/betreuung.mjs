/*
 * Betreuung & Hauswirtschaft: Tarif und Bedingungen (Konzept C3, Teil F
 * Punkt 1; Entscheide der Geschäftsleitung offen).
 *
 * Einzige Stelle für diese Werte. Die Seite /betreuung-hauswirtschaft/
 * (Tarif-Kasten, FAQ) und die Startseite (Abschnitt 8, Tarif) beziehen sie
 * von hier. Liegt ein Entscheid vor, wird die betreffende Zeile ersetzt.
 *
 * Bis dahin stehen die Platzhalter aus C3 wörtlich und sichtbar in eckigen
 * Klammern. Go-live-Sperre (CLAUDE.md): Der Production-Build bricht ab,
 * solange eine Seite «[XX» oder «[X]» enthält (scripts/platzhalter.mjs).
 */
export const TARIF = {
  // Stundentarif in Franken, im Text nach «CHF», z. B. '52.–'.
  stunde: '[XX.–]',
  // Satzteil nach dem Gedankenstrich im Tarif-Kasten, z. B.
  // 'ohne Zuschläge für Abende und Wochenenden'.
  zuschlaege: '[ohne Zuschläge für Abende und Wochenenden]',
  // Mindestdauer eines Einsatzes, im Satz «Einsätze dauern mindestens …», z. B. '1 Stunde'.
  mindestdauer: '[X] Stunden',
  // Frist für Änderungen, im Satz «Änderungen melden Sie bis … am Vortag», z. B. '12 Uhr'.
  frist: '[X] Uhr',
  // Vergleichszeile im Tarif-Kasten; null blendet sie aus. Nur zeigen, wenn
  // unser Tarif nicht über CHF 36.– liegt (Regieanweisung C3).
  vergleich: 'Zum Vergleich: Die öffentliche Spitex im Kanton Zug verrechnet für Hauswirtschaft CHF 36.– pro Stunde.',
};
