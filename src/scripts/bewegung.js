/* Bewegung beim Scrollen; Werte in global.css */
(function (d) {
  if (!window.IntersectionObserver || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var klasse = d.documentElement.classList, o;
  klasse.add('bewegung');
  function sicher(f) {
    return function (x) { try { f(x); } catch (e) { klasse.remove('bewegung'); } };
  }
  function zeige(e) {
    if (!e.isIntersecting) return;
    var el = e.target, a = el.closest('section'), jetzt = e.time;
    var v = parseFloat(getComputedStyle(el).getPropertyValue('--bewegung-versatz')) || 0;
    a.zuletzt = Math.max(jetzt, (a.zuletzt || -1e4) + v);
    el.style.transitionDelay = a.zuletzt - jetzt + 'ms';
    el.classList.add('bewegt');
    o.unobserve(el);
  }
  d.addEventListener('DOMContentLoaded', sicher(function () {
    o = new IntersectionObserver(sicher(function (l) { l.forEach(zeige); }), { threshold: 0.15 });
    d.querySelectorAll('[data-bewegung]').forEach(o.observe, o);
  }));
})(document);
