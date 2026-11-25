process.env.JWT_SECRET = 'x'.repeat(48); process.env.DB_PATH = ':memory:';
import express from 'express'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; 
const { makeGeoRouter } = await import('../src/geo.js');
let pass = 0, fail = 0; const t = (n, ok) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}`); };

// --- proxy with stubbed upstreams ---
const calls = []; let osrmDown = false;
const fake = async (url, init = {}) => {
  calls.push(url); const u = String(url);
  const ok = j => ({ ok: true, status: 200, json: async () => j });
  if (u.includes('photon')) return ok({ features: [{ properties: { name: 'Hauz Khas' }, geometry: { coordinates: [77.2, 28.54] } }] });
  if (u.includes('nominatim')) return ok({ display_name: 'Saket, New Delhi' });
  if (u.includes('router.project-osrm') && osrmDown) return { ok: false, status: 503, json: async () => ({}) };
  if (u.includes('osrm') || u.includes('routing.openstreetmap.de')) return ok({ code: 'Ok', routes: [{ distance: 1000, duration: 60, geometry: { coordinates: [[77, 28]] }, legs: [] }] });
  if (u.includes('overpass-api')) return { ok: false, status: 504, json: async () => ({}) };
  if (u.includes('kumi')) return ok({ elements: [{ type: 'node', lat: 28.5, lon: 77.2, tags: { amenity: 'police' } }] });
  if (u.includes('ipapi')) return { ok: false, status: 429, json: async () => ({}) };
  if (u.includes('ipwho')) return ok({ success: true, latitude: 28.6, longitude: 77.2, city: 'Delhi' });
  return { ok: false, status: 500, json: async () => ({}) };
};
const app = express(); app.set('trust proxy', 1); app.use(express.json());
app.use('/api', makeGeoRouter({ fetchImpl: fake }));
app.use((e, req, res, n) => res.status(e.status || 500).json({ error: e.message, details: e.details }));
const srv = app.listen(0); const B = `http://127.0.0.1:${srv.address().port}/api`;
const g = (p, h = {}) => fetch(B + p, { headers: h }); const post = (p, b) => fetch(B + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });

let r = await g('/geo/photon?q=hauz&lat=28.5&lon=77.2'); t('photon proxy 200', r.status === 200 && (await r.json()).features.length === 1);
const n0 = calls.length; await g('/geo/photon?q=hauz&lat=28.5&lon=77.2'); t('photon cached (no 2nd upstream call)', calls.length === n0);
t('photon missing q -> 400', (await g('/geo/photon')).status === 400);
t('photon bad lat -> 400', (await g('/geo/photon?q=a&lat=999&lon=0')).status === 400);
r = await g('/geo/reverse?lat=28.5&lon=77.2'); t('reverse geocode 200', (await r.json()).display_name === 'Saket, New Delhi');
t('reverse invalid -> 400', (await g('/geo/reverse?lat=x&lon=1')).status === 400);
r = await g('/route?profile=foot&coords=77.24,28.56;77.16,28.58'); t('route 200 (OSRM)', (await r.json()).code === 'Ok');
osrmDown = true; r = await g('/route?profile=driving&coords=77.1,28.5;77.2,28.6'); t('route falls back to OSM Germany when OSRM down', r.status === 200 && calls.some(u => u.includes('routing.openstreetmap.de')));
t('route bad profile (SSRF guard) -> 400', (await g('/route?profile=../../x&coords=1,1;2,2')).status === 400);
t('route bad coords -> 400', (await g('/route?profile=foot&coords=abc')).status === 400);
t('route out-of-range -> 400', (await g('/route?profile=foot&coords=999,1;2,2')).status === 400);
r = await post('/overpass', { query: '[out:json][timeout:8];node["amenity"="police"](around:500,28.5,77.2);out body;' }); const j = await r.json();
t('overpass falls back to mirror, returns elements', r.status === 200 && j.elements.length === 1);
t('overpass non-[out:json] query -> 400', (await post('/overpass', { query: 'node(1);out;' + ' '.repeat(10) })).status === 400);
t('overpass oversize query -> 400', (await post('/overpass', { query: '[out:json];' + 'a'.repeat(3100) })).status === 400);
t('ip geolocation falls back ipapi -> ipwho, normalised', (await (await g('/geo/ip', { 'X-Forwarded-For': '8.8.8.8' })).json()).city === 'Delhi');
t('ip private/localhost -> 404', (await g('/geo/ip')).status === 404);
srv.close();

// --- backend serves React build with SPA fallback; API 404s stay JSON ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-')); fs.writeFileSync(tmp + '/index.html', '<html><body><div id="root"></div></body></html>');
process.env.FRONTEND_DIR = tmp; const { app: full } = await import('../src/server.js'); const s2 = full.listen(0); const U = `http://127.0.0.1:${s2.address().port}`;
t('SPA: / serves index.html', (await (await fetch(U + '/')).text()).includes('id="root"'));
t('SPA: deep link falls back to index.html', (await (await fetch(U + '/some/deep/link')).text()).includes('id="root"'));
r = await fetch(U + '/api/nope'); t('API 404 stays JSON (not swallowed by SPA)', r.status === 404 && (await r.json()).error === 'Route not found');
const csp = (await fetch(U + '/')).headers.get('content-security-policy');
t("CSP: scripts 'self' only, no third-party API origins", /script-src 'self'(;|$)/.test(csp) && !/overpass|osrm|photon|unpkg|tailwind/.test(csp));
s2.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
