/*
 * Lohnrechner (Baustein F, Webseitenkonzept V3.0 Teil D1).
 * Eigenständig, ohne Framework, ohne Abhängigkeiten, unter 10 KB.
 * Speichert nichts: keine Cookies, kein localStorage.
 *
 * Die Rechenfunktionen werden auch von Lohnrechner.astro (Fallback-Tabelle)
 * und vom Test (npm test) importiert; die Oberfläche startet nur im Browser.
 */

/* ---------- Konfiguration: Sätze und Listen nur hier ändern ---------- */
export const KONFIG = {
  satzMitKurs: 37.95,
  satzEinstieg: 33.95,
  // Sechs Einsatztage pro Woche: ein freier Tag pro Woche ist gesetzlich
  // vorgeschrieben (Entscheid GL 22.09.2026, Art. 20 ArG).
  tageProMonat: 26,
  tageProJahr: 312,
  // Stundenstufen; «mehr als 3» rechnet mit 3 und weist «über» aus.
  stufen: [
    { wert: '1', text: '1 Stunde', stunden: 1 },
    { wert: '1.5', text: '1½ Stunden', stunden: 1.5 },
    { wert: '2', text: '2 Stunden', stunden: 2 },
    { wert: '2.5', text: '2½ Stunden', stunden: 2.5 },
    { wert: '3', text: '3 Stunden', stunden: 3 },
    { wert: 'mehr', text: 'mehr als 3 Stunden', stunden: 3, mehr: true },
  ],
  // Postleitzahlen der elf Gemeinden des Kantons Zug inklusive Ortsteile.
  // VORLÄUFIGE LISTE, von der Geschäftsstelle zu prüfen (Konzept Teil F,
  // Punkt 5). 6344 Meierskappel (LU) ist bewusst nicht enthalten.
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
  dauerMs: 300,
};

/* ---------- Rechenlogik (D1) ---------- */
function rundeAuf(betrag, schritt) {
  return Math.round(betrag / schritt) * schritt;
}

/** Monatslohn brutto: Stunden × 26 Tage × Satz, kaufmännisch auf CHF 10.– gerundet. */
export function monatslohn(stunden, satz) {
  return rundeAuf(stunden * KONFIG.tageProMonat * satz, 10);
}

/** Jahreslohn brutto: Stunden × 312 Tage × Satz, kaufmännisch auf CHF 100.– gerundet. */
export function jahreslohn(stunden, satz) {
  return rundeAuf(stunden * KONFIG.tageProJahr * satz, 100);
}

/** Ziffern mit Apostroph als Tausendertrennzeichen: 1970 → 1'970 */
export function ziffern(betrag) {
  return String(Math.round(betrag)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/** Anzeige: rund CHF 1'970.– bzw. über CHF 2'960.– */
export function chf(betrag, mehr) {
  return (mehr ? 'über' : 'rund') + ' CHF ' + ziffern(betrag) + '.–';
}

/** Alle Ergebniswerte einer Stufe. */
export function ergebnis(stufe) {
  return {
    monatMitKurs: monatslohn(stufe.stunden, KONFIG.satzMitKurs),
    jahrMitKurs: jahreslohn(stufe.stunden, KONFIG.satzMitKurs),
    monatEinstieg: monatslohn(stufe.stunden, KONFIG.satzEinstieg),
    jahrEinstieg: jahreslohn(stufe.stunden, KONFIG.satzEinstieg),
    mehr: !!stufe.mehr,
  };
}

export function stufeFuer(wert) {
  return KONFIG.stufen.filter(function (s) { return s.wert === wert; })[0] || KONFIG.stufen[2];
}

export function plzImKantonZug(plz) {
  return KONFIG.plzZug.indexOf(Number(plz)) !== -1;
}

/* ---------- Messung: leerer Hook, kein Tracking-Skript ---------- */
function melde(name, daten) {
  if (typeof window.pflegeunionTrack === 'function') window.pflegeunionTrack(name, daten || {});
}

/* ---------- Oberfläche ---------- */
function starte(wurzel) {
  var q = function (sel) { return wurzel.querySelector(sel); };
  var fallback = q('[data-rechner-fallback]');
  var ui = q('[data-rechner-ui]');
  if (!ui) return;
  if (fallback) fallback.hidden = true;
  ui.hidden = false;

  var zahl = q('[data-monat]');
  var vorlesen = q('[data-vorlesen]');
  var reduziert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var angezeigt = 0;
  var animation = 0;

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
      zahl.textContent = ziffern(angezeigt);
      if (anteil < 1) animation = requestAnimationFrame(schritt);
    }
    animation = requestAnimationFrame(schritt);
  }

  function auswahl(name) {
    var feld = wurzel.querySelector('input[name="' + name + '"]:checked');
    return feld ? feld.value : '';
  }

  var stufe, werte, kurs;

  function aktualisiere() {
    stufe = stufeFuer(auswahl(wurzel.dataset.stunden));
    kurs = auswahl(wurzel.dataset.kurs) === 'ja';
    werte = ergebnis(stufe);

    q('[data-titel]').textContent = kurs
      ? 'Ihr Lohn'
      : 'Ihr Lohn nach dem Pflegehelferkurs, den wir bezahlen';
    q('[data-praefix]').textContent = werte.mehr ? 'über' : 'rund';
    zeigeZahl(werte.monatMitKurs);
    vorlesen.textContent = chf(werte.monatMitKurs, werte.mehr) + ' brutto pro Monat';
    q('[data-jahr]').textContent = chf(werte.jahrMitKurs, werte.mehr);
    q('[data-einstieg]').textContent = chf(werte.monatEinstieg, werte.mehr);
    q('[data-zeile3]').hidden = kurs;
    q('[data-mehr]').hidden = !werte.mehr;
  }

  wurzel.addEventListener('change', function (ereignis) {
    var ziel = ereignis.target;
    if (ziel.type !== 'radio') return;
    aktualisiere();
    melde('rechner_antwort', { frage: ziel.name === wurzel.dataset.kurs ? 'kurs' : 'stunden', wert: ziel.value });
    if (ziel.name === wurzel.dataset.stunden && werte.mehr) melde('rechner_mehr_als_3');
  });

  // Frage 3 (nur vollständige Fassung): Postleitzahl prüfen.
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

  // Übergabe an das Formular (D1): Klick auf «Erstgespräch vereinbaren».
  var erstgespraech = q('[data-erstgespraech]');
  var formular = document.querySelector('form.formular');
  if (erstgespraech && formular) {
    var zeile = formular.querySelector('[data-rechner-uebergabe]');
    var setze = function (name, wert) {
      var feld = formular.querySelector('input[name="' + name + '"]');
      if (feld) feld.value = wert;
    };
    var loesche = function () {
      if (zeile) zeile.hidden = true;
      setze('stunden', '');
      setze('kurs', '');
      setze('ergebnis', '');
    };
    erstgespraech.addEventListener('click', function () {
      var monat = chf(werte.monatMitKurs, werte.mehr);
      var einstieg = chf(werte.monatEinstieg, werte.mehr);
      var anliegen = formular.querySelector('select[name="anliegen"]');
      if (anliegen) anliegen.value = 'Anstellung als pflegender Angehöriger';
      setze('stunden', stufe.text);
      setze('kurs', kurs ? 'Ja' : 'Nein, noch nicht');
      setze('ergebnis', monat + ' pro Monat mit Kurs' + (kurs ? '' : ', ' + einstieg + ' bis zum Kursabschluss'));
      if (zeile) {
        zeile.querySelector('[data-uebergabe-text]').textContent =
          'Ihre Schätzung aus dem Rechner: ' + monat + ' pro Monat bei ' + stufe.text +
          ' pro Tag mit Pflegehelferkurs' + (kurs ? '' : ', ' + einstieg + ' bis zum Kursabschluss') +
          '. Wir nehmen sie ins Gespräch mit.';
        zeile.hidden = false;
      }
      melde('rechner_erstgespraech', { stunden: stufe.wert, kurs: kurs });
    });
    if (zeile) {
      var schliessen = zeile.querySelector('button');
      if (schliessen) schliessen.addEventListener('click', loesche);
    }
  }

  // Sekundär-Button «Ergebnis per E-Mail erhalten»: vorerst nur Messung,
  // der Versand folgt mit dem Formularversand.
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
