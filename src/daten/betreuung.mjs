/*
 * Betreuung & Hauswirtschaft: Tarif und Bedingungen (Konzept C3, Teil F
 * Punkt 1). Tarif entschieden 08.11.2026 (Entscheid GL, Auftrag «Tarife
 * und Einsatzgebiet»): CHF 56.– pro Stunde, ohne Zuschläge, Wegpauschale
 * CHF 10.– bei Einsätzen unter 2 Stunden. Mindestdauer, Frist und die
 * Vergleichszeile mit der öffentlichen Spitex entfallen.
 *
 * Einzige Stelle für diese Werte. Die Seite /betreuung-hauswirtschaft/
 * (Tarif-Kasten), die Startseite (Abschnitt 8, Tarif) und /tarife/
 * (Tabelle «Betreuung und Hauswirtschaft») beziehen sie von hier.
 */
export const TARIF = {
  // Stundentarif in Franken, im Text nach «CHF».
  stunde: '56.–',
  // Satzteil nach dem Gedankenstrich im Tarif-Kasten.
  zuschlaege: 'ohne Zuschläge für Abende und Wochenenden',
  // Satz zur Wegpauschale im Tarif-Kasten.
  wegpauschale: 'Bei Einsätzen unter 2 Stunden kommt eine Wegpauschale von CHF 10.– dazu, ab 2 Stunden keine.',
};
