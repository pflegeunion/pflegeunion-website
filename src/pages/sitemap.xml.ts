/*
 * Sitemap (/sitemap.xml) für Suchmaschinen, beim Build als statische Datei
 * erzeugt (ohne Zusatzpaket). Nur öffentliche Seiten; interne Seiten mit
 * noindex (/bausteine/) stehen nicht darin. Neue Seiten hier ergänzen.
 */
import type { APIRoute } from 'astro';

export const SEITEN = ['/', '/lohnrechner/'];

export const GET: APIRoute = ({ site }) => {
  const basis = site ?? new URL('https://pflegeunion.ch/');
  const eintraege = SEITEN.map((pfad) => `  <url><loc>${new URL(pfad, basis).href}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${eintraege}
</urlset>
`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
