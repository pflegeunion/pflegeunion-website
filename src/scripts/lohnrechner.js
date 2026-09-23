/*
 * Lohnrechner (Baustein F, Konzept D1; Claude Design: D02/M02_Lohnrechner_A,
 * Kurs-Kästchen D02/M02_Lohnrechner_Kurs_Test). Eigenständig, ohne Framework
 * und Abhängigkeiten, unter 10 KB; speichert nichts (keine Cookies, kein
 * localStorage). Die Rechenfunktionen nutzen auch Lohnrechner.astro
 * (Fallback-Tabelle) und npm test; die Oberfläche startet nur im Browser.
 */

/* Konfiguration: Sätze, Tage, Stufen und Listen nur hier ändern */
export const KONFIG = {
  // Stundensätze brutto: mit Pflegehelferkurs und Einstieg (bis zum Kurs).
  SATZ_KURS: 37.95,
  SATZ_EINSTIEG: 33.95,
  // Sechs Einsatztage pro Woche: ein freier Tag pro Woche ist gesetzlich
  // vorgeschrieben (Entscheid GL 22.09.2026, Art. 20 ArG).
  TAGE_MONAT: 26,
  TAGE_JAHR: 312,
  // BVG-Eintrittsschwelle (Jahreslohn), Stand 2026: ab diesem Jahreslohn
  // nennt das Ergebnis auch die Pensionskasse.
  BVG_SCHWELLE: 22680,
  // Stundenstufen; «mehr als 3» rechnet mit 3 und weist «über» aus.
  stufen: [
    { wert: '1', text: '1 Stunde', stunden: 1 },
    { wert: '1.5', text: '1½ Stunden', stunden: 1.5 },
    { wert: '2', text: '2 Stunden', stunden: 2 },
    { wert: '2.5', text: '2½ Stunden', stunden: 2.5 },
    { wert: '3', text: '3 Stunden', stunden: 3 },
    { wert: 'mehr', text: 'mehr als 3 Stunden', stunden: 3, mehr: true },
  ],
  // Postleitzahlen der elf Zuger Gemeinden inkl. Ortsteile (nur vollständige
  // Fassung). VORLÄUFIGE LISTE, von der Geschäftsstelle zu prüfen (Konzept
  // Teil F, Punkt 5); 6344 Meierskappel (LU) bewusst nicht enthalten.
  plzZug: [
    6300, 6301, 6302, 6303, 6304, // Zug
    6312, // Steinhausen
    6313, // Menzingen, Edlibach, Finstersee
    6314, // Unterägeri, Neuägeri
    6315, // Oberägeri, Morgarten, Alosen
    6317, // Oberwil bei Zug
    6318, // Walchwil
    6319, // Allenwinden (Baar)
    6330, // Cham
    6331, // Hünenberg
    6332, // Hagendorn (Cham)
    6333, // Hünenberg See
    6340, 6341, 6342, // Baar
    6343, // Rotkreuz, Risch, Buonas, Holzhäusern
    6345, // Neuheim
  ],
  // Hochzählen der Rechner-Zahl.
  dauerMs: 300,
};

/* Rechenlogik (D1) */
function rundeAuf(betrag, schritt) {
  return Math.round(betrag / schritt) * schritt;
}

/** Monatslohn brutto: Stunden × 26 Tage × Satz, kaufmännisch auf CHF 10.– gerundet. */
export function monatslohn(stunden, satz) {
  return rundeAuf(stunden * KONFIG.TAGE_MONAT * satz, 10);
}

/** Jahreslohn brutto: Stunden × 312 Tage × Satz, kaufmännisch auf CHF 100.– gerundet. */
export function jahreslohn(stunden, satz) {
  return rundeAuf(stunden * KONFIG.TAGE_JAHR * satz, 100);
}

/** Ziffern mit Apostroph als Tausendertrennzeichen: 1970 → 1'970 */
export function ziffern(betrag) {
  return String(Math.round(betrag)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/** Anzeige: rund CHF 1'970.– bzw. über CHF 2'960.– */
export function chf(betrag, mehr) {
  return (mehr ? 'über' : 'rund') + ' CHF ' + ziffern(betrag) + '.–';
}

/** Ergebniswerte einer Stufe; monat, jahr: gezeigter Lohn (ohneKurs: bis zum Kurs). */
export function ergebnis(stufe, ohneKurs) {
  var h = stufe.stunden, kurs = KONFIG.SATZ_KURS, einstieg = KONFIG.SATZ_EINSTIEG;
  var satz = ohneKurs ? einstieg : kurs;
  return {
    monatMitKurs: monatslohn(h, kurs),
    jahrMitKurs: jahreslohn(h, kurs),
    monatEinstieg: monatslohn(h, einstieg),
    jahrEinstieg: jahreslohn(h, einstieg),
    monat: monatslohn(h, satz),
    jahr: jahreslohn(h, satz),
    // Pensionskasse nur ab der BVG-Schwelle (Jahreslohn mit dem gezeigten Satz).
    pensionskasse: h * KONFIG.TAGE_JAHR * satz >= KONFIG.BVG_SCHWELLE,
    mehr: !!stufe.mehr,
  };
}

export function stufeFuer(wert) {
  return KONFIG.stufen.filter(function (s) { return s.wert === wert; })[0] || KONFIG.stufen[2];
}

export function plzImKantonZug(plz) {
  return KONFIG.plzZug.indexOf(Number(plz)) !== -1;
}

/** Übergabe an das Formular: Zeile (Betrag ohne Umbruch) und Feld ergebnis. */
export function uebergabe(stufe, ohneKurs) {
  var w = ergebnis(stufe, ohneKurs);
  var betrag = chf(w.monat, w.mehr);
  var kurs = (ohneKurs ? 'bis zum' : 'mit') + ' Pflegehelferkurs';
  return {
    zeile: 'Ihre Schätzung aus dem Rechner: ' + betrag.replace(/ /g, '\u00a0') + ' pro Monat bei ' +
      stufe.text + ' pro Tag ' + kurs + '. Wir nehmen sie ins Gespräch mit.',
    ergebnis: betrag + ' pro Monat ' + kurs,
  };
}

/* Messung: leerer Hook, kein Tracking-Skript */
function melde(name, daten) {
  if (typeof window.pflegeunionTrack === 'function') window.pflegeunionTrack(name, daten || {});
}

/* Oberfläche */
function starte(wurzel) {
  var q = function (sel) { return wurzel.querySelector(sel); };
  var fallback = q('[data-rechner-fallback]');
  var ui = q('[data-rechner-ui]');
  if (!ui) return;
  if (fallback) fallback.hidden = true;
  ui.hidden = false;

  var zahl = q('[data-monat]');
  var kurs = q('[data-ohne-kurs]');
  var reduziert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var angezeigt = 0;
  var animation = 0;

  // Die Zahl zählt in 300 ms vom bisherigen Wert hoch (ohne Animation bei
  // prefers-reduced-motion). Vorgelesen wird nur der Endwert (data-vorlesen).
  function zeigeZahl(ziel) {
    var start = angezeigt;
    var beginn = 0;
    cancelAnimationFrame(animation);
    if (reduziert || !start) {
      angezeigt = ziel;
      zahl.textContent = ziffern(ziel);
      return;
    }
    function schritt(zeit) {
      if (!beginn) beginn = zeit;
      var anteil = Math.min((zeit - beginn) / KONFIG.dauerMs, 1);
      angezeigt = start + (ziel - start) * anteil;
      zahl.textContent = ziffern(anteil < 1 ? rundeAuf(angezeigt, 10) : ziel);
      if (anteil < 1) animation = requestAnimationFrame(schritt);
    }
    animation = requestAnimationFrame(schritt);
  }

  function auswahl(name) {
    var feld = wurzel.querySelector('input[name="' + name + '"]:checked');
    return feld ? feld.value : '';
  }

  var stufe, werte, ohne;

  // Angekreuzt: Hauptzahl bis zum Kurs, darunter der Lohn nach dem Kurs.
  function aktualisiere() {
    ohne = kurs.checked;
    stufe = stufeFuer(auswahl(wurzel.dataset.stunden));
    werte = ergebnis(stufe, ohne);
    q('[data-praefix]').textContent = werte.mehr ? 'über' : 'rund';
    zeigeZahl(werte.monat);
    q('[data-vorlesen]').textContent = chf(werte.monat, werte.mehr) + ' brutto pro Monat';
    q('[data-jahr]').textContent = chf(werte.jahr, werte.mehr);
    q('[data-monat-kurs]').textContent = chf(werte.monatMitKurs, werte.mehr);
    q('[data-titel-mit]').hidden = ohne;
    q('[data-titel-ohne]').hidden = q('[data-nach-kurs]').hidden = !ohne;
    q('[data-bvg]').hidden = !werte.pensionskasse;
    q('[data-mehr]').hidden = !werte.mehr;
  }

  wurzel.addEventListener('change', function (ereignis) {
    var ziel = ereignis.target;
    if (ziel === kurs) return aktualisiere();
    if (ziel.type !== 'radio') return;
    aktualisiere();
    melde('rechner_antwort', { frage: 'stunden', wert: ziel.value });
    if (werte.mehr) melde('rechner_mehr_als_3');
  });

  // Postleitzahl prüfen (nur vollständige Fassung).
  var plz = q('[data-plz]');
  if (plz) {
    var innerhalb = q('[data-plz-innerhalb]');
    var ausserhalb = q('[data-plz-ausserhalb]');
    var geprueft = '';
    plz.addEventListener('input', function () {
      var eingabe = plz.value.replace(/\D/g, '');
      var fertig = eingabe.length === 4;
      var drin = fertig && plzImKantonZug(eingabe);
      innerhalb.hidden = !drin;
      ausserhalb.hidden = !fertig || drin;
      if (fertig && geprueft !== eingabe) {
        geprueft = eingabe;
        melde('rechner_plz', { innerhalb: drin });
      }
    });
  }

  // Übergabe an das Formular (D1): «Erstgespräch vereinbaren» springt zu
  // #kontakt, belegt Anliegen und Feld 2 vor, setzt die Zeile über dem
  // Formular und füllt die versteckten Felder stunden und ergebnis.
  var erstgespraech = q('[data-erstgespraech]');
  var formular = document.querySelector('form.formular');
  if (erstgespraech && formular) {
    var zeile = formular.querySelector('[data-rechner-uebergabe]');
    // Angekreuzt «Nein, noch nicht» vorwählen, leer nur die eigene Vorwahl zurücknehmen.
    var nein = formular.querySelector('input[value="Nein, noch nicht"]');
    var vorgewaehlt = false;
    var setze = function (name, wert) {
      var feld = formular.querySelector('input[name="' + name + '"]');
      if (feld) feld.value = wert;
    };
    erstgespraech.addEventListener('click', function () {
      var anliegen = formular.querySelector('select[name="anliegen"]');
      if (anliegen) anliegen.value = 'Anstellung als pflegender Angehöriger';
      var u = uebergabe(stufe, ohne);
      setze('stunden', stufe.text);
      setze('ergebnis', u.ergebnis);
      if (nein && (ohne || vorgewaehlt)) vorgewaehlt = nein.checked = ohne;
      if (zeile) {
        zeile.querySelector('[data-uebergabe-text]').textContent = u.zeile;
        zeile.hidden = false;
      }
      melde('rechner_erstgespraech', { stunden: stufe.wert });
    });
    if (zeile) {
      zeile.querySelector('button').addEventListener('click', function () {
        zeile.hidden = true;
        setze('stunden', '');
        setze('ergebnis', '');
        var feld = formular.querySelector('select, input:not([type="hidden"])');
        if (feld) feld.focus();
      });
    }
  }

  // «Ergebnis per E-Mail erhalten»: vorerst nur Messung, Versand folgt.
  var email = q('[data-email]');
  if (email) {
    email.addEventListener('click', function () { melde('rechner_email'); });
  }

  // Sichtbarkeit einmal melden.
  if ('IntersectionObserver' in window) {
    var beobachter = new IntersectionObserver(function (eintraege) {
      if (eintraege.some(function (e) { return e.isIntersecting; })) {
        melde('rechner_gesehen');
        beobachter.disconnect();
      }
    }, { threshold: 0.5 });
    beobachter.observe(wurzel);
  }

  aktualisiere();
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-rechner]').forEach(starte);
}
