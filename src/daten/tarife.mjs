/*
 * Tarife und Kosten (Seite /tarife/, Tarifblatt; Auftrag «Tarife und
 * Einsatzgebiet», 08.11.2026, Webseitenkonzept V3.22).
 *
 * Einzige Stelle für Stand, Pfad des Tarifblatts, die Pflege-Tabelle, den
 * Eigenanteil und die Beispiele. Der Tarif der Betreuung und Hauswirtschaft
 * steht in src/daten/betreuung.mjs (TARIF). Ändern sich die gesetzlichen
 * Beiträge, werden die Werte hier und im Tarifblatt (PDF) nachgeführt.
 *
 * Beträge im Format «76.90», auf der Seite mit «CHF » davor.
 */

// Stand der Tarife, im Übertitel der Seite («STAND NOVEMBER 2026»).
export const STAND = 'November 2026';

// Tarifblatt als PDF (2 Seiten A4), unter public/downloads/.
export const TARIFBLATT = {
  pfad: '/downloads/tarifblatt-pflegeunion.pdf',
  text: 'Tarifblatt herunterladen (PDF, 2 Seiten)',
};

// Pflege: Beitrag der Krankenkasse und Ihr Anteil, Beträge pro Stunde.
// Bei Abklärung steht bewusst 15.35 (Tagesmaximum) statt rechnerisch 15.38
// (Entscheid Michel Gurnari 08.11.2026). `angebot: false` zeigt die Zeile
// gedämpft mit der Etikette «NOCH NICHT IM ANGEBOT».
export const PFLEGE = [
  {
    leistung: 'Abklärung, Beratung und Koordination',
    beschreibung: 'Bedarfsabklärung, Pflegeplanung, Anleitung · Art. 7 Abs. 2 lit. a KLV',
    krankenkasse: '76.90',
    anteil: '15.35',
    angebot: true,
  },
  {
    leistung: 'Behandlungspflege',
    beschreibung: 'Wundversorgung, Medikamente, Injektionen · Art. 7 Abs. 2 lit. b KLV',
    krankenkasse: '63.00',
    anteil: '12.60',
    angebot: false,
  },
  {
    leistung: 'Grundpflege',
    beschreibung: 'Waschen, Anziehen, Essen und Bewegen · Art. 7 Abs. 2 lit. c KLV',
    krankenkasse: '52.60',
    anteil: '10.52',
    angebot: true,
  },
];

// Eigenanteil pro Tag (Kernbotschaft «IHR EIGENANTEIL PRO TAG»).
export const EIGENANTEIL = {
  hoechstens: '15.35',
  text: '20 % des Krankenkassenbeitrags, nie mehr als CHF 15.35 pro Tag.',
};

// Beispiele für Ihren Eigenanteil (kleine Tabelle neben der Kernbotschaft).
export const BEISPIELE = [
  { fall: '1 Std. Grundpflege pro Tag', betrag: 'CHF 10.52 pro Tag' },
  { fall: '2 Std. Grundpflege pro Tag', betrag: 'CHF 15.35 pro Tag' },
  { fall: 'Pflege jeden Tag, 31 Tage', betrag: 'höchstens CHF 475.85' },
];
