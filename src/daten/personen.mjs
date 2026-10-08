/*
 * Über uns: Teambild, Team, Vorstand und Treuhand (Claude Design, Seite
 * «Über uns»: UU_D01/UU_M01 Hero, UU_D03/UU_M03 Team, UU_D04/UU_M04
 * Vorstand und Treuhand, Variante A; Entscheide Michel Gurnari 07.10.2026).
 * Einzige Stelle für diese Angaben; die Seite /ueber-uns/ bezieht sie von
 * hier. Texte wörtlich aus den Boards.
 *
 * Fotos: `foto` ist der Basisname der WebP-Dateien unter public/bilder/, je
 * 480, 800 und 1200 px breit (wie die übrigen Bilder), z. B.
 * 'team-michel-gurnari' für /bilder/team-michel-gurnari-800.webp. Porträts
 * im Hochformat 3:4 (1200 × 1600 px), das Teambild im Hochformat wie die
 * Heros der Unterseiten (1200 × 1321 px). Alt-Text der Porträts ist der
 * Name; Herkunft und Lizenz in LIZENZEN.md. Ein Foto wird mit einer Zeile
 * ergänzt (foto: '…').
 *
 * Leer ('') zeigt die Platzhalterfläche mit dem sichtbaren Text
 * «[Teambild folgt]» bzw. «[Foto folgt]». Die übrigen Platzhalter stehen
 * wörtlich in eckigen Klammern. Go-live-Sperre (CLAUDE.md): Der Build für
 * pflegeunion.ch bricht ab, solange eine Seite Text in eckigen Klammern
 * zeigt (scripts/platzhalter.mjs).
 */

/** Teambild im Hero; mit dem Foto auch den Alt-Text ergänzen. */
export const TEAMBILD = { foto: '', alt: '' };

/** Team (UU_D03_Team): Name, Funktion, Zitat (alle drei freigegeben 07.10.2026). */
export const TEAM = [
  {
    name: 'Michel Gurnari',
    funktion: 'Geschäftsleitung',
    zitat: '«Jede Stunde, die wir der Bürokratie abnehmen, geben wir den Menschen zurück.»',
    foto: '',
  },
  {
    name: 'Cristian Fernandez',
    funktion: 'Geschäftsleitung',
    zitat: '«Wer einen Menschen pflegt, leistet jeden Tag Arbeit. Wir sorgen dafür, dass sie fair bezahlt wird.»',
    foto: '',
  },
  {
    name: 'Christoph Willi',
    funktion: 'Pflegedienstleitung, dipl. Pflegefachmann HF',
    zitat: '«Gute Pflege beginnt mit Zuhören – bei den Klienten genauso wie bei den Angehörigen.»',
    foto: '',
  },
];

/** Vorstand (UU_D04_Vorstand_A), in dieser Reihenfolge. */
export const VORSTAND = [
  { name: 'Michel Gurnari', funktion: 'Präsident', hintergrund: '[Hintergrund in einer Zeile]', foto: '' },
  { name: 'Cristian Fernandez', funktion: 'Vizepräsident', hintergrund: '[Hintergrund in einer Zeile]', foto: '' },
  { name: 'Rolf Günter', funktion: 'Mitglied', hintergrund: '[Hintergrund in einer Zeile]', foto: '' },
  { name: 'Fabian Blaser', funktion: 'Mitglied', hintergrund: '[Hintergrund in einer Zeile]', foto: '' },
  { name: 'Olivier Ruppen', funktion: 'Mitglied', hintergrund: '[Hintergrund in einer Zeile]', foto: '' },
];

/** Treuhand (UU_D04_Vorstand_A), ohne Foto. */
export const TREUHAND = [{ name: '[Name]', firma: '[Firma, Ort]', aufgabe: '[Aufgabe in einer Zeile]' }];
