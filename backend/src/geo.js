// Open-source data proxy: OSRM (routing), Photon (autocomplete), Nominatim (reverse geocode),
// Overpass (cameras/lamps/shops/police/hospitals/metro), ip geolocation fallback.
// Why proxy: caching, per-IP rate limits, upstream timeouts + fallbacks, polite User-Agent, strict CSP.
import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { HttpError } from './errors.js';

const lat = z.coerce.number().min(-90).max(90);
const lon = z.coerce.number().min(-180).max(180);
const parse = (schema, data) => {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, 'Validation failed', r.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })));
  return r.data;
};
const isPrivate = ip => !ip || ip === '::1' || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|fc|fd|fe80)/i.test(ip);

export function makeGeoRouter({ fetchImpl = globalThis.fetch, contact = '' } = {}) {
  const UA = `Vylo/1.0 (safety navigation app${contact ? '; ' + contact : ''})`;
  const router = express.Router();
  const cache = new Map();
  const cached = async (key, ttlMs, loader) => {
    const hit = cache.get(key);
    if (hit && hit.exp > Date.now()) return hit.val;
    const val = await loader();
    cache.set(key, { exp: Date.now() + ttlMs, val });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    return val;
  };
  const call = async (url, init = {}, ms = 9000) => {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
    try {
      const res = await fetchImpl(url, { ...init, signal: ac.signal, headers: { 'User-Agent': UA, Accept: 'application/json', ...(init.headers || {}) } });
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      return await res.json();
    } finally { clearTimeout(t); }
  };
  const firstOk = async (attempts) => {
    for (const fn of attempts) { try { return await fn(); } catch { /* try next */ } }
    throw new HttpError(502, 'Upstream map service unavailable, please retry');
  };
  const ah = fn => (req, res, next) => fn(req, res).catch(next);

  router.use(rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many map requests, slow down' } }));

  // Place autocomplete + forward geocoding (Photon)
  router.get('/geo/photon', ah(async (req, res) => {
    const b = parse(z.object({ q: z.string().trim().min(1).max(200), lat: lat.optional(), lon: lon.optional(), limit: z.coerce.number().int().min(1).max(10).default(4) }), req.query);
    const p = new URLSearchParams({ q: b.q, limit: String(b.limit) });
    if (b.lat !== undefined && b.lon !== undefined) { p.set('lat', String(b.lat)); p.set('lon', String(b.lon)); }
    res.json(await cached('ph:' + p, 10 * 60e3, () => firstOk([() => call(`https://photon.komoot.io/api/?${p}`)])));
  }));

  // Reverse geocoding (Nominatim)
  router.get('/geo/reverse', ah(async (req, res) => {
    const b = parse(z.object({ lat, lon }), req.query);
    const key = `rv:${b.lat.toFixed(4)},${b.lon.toFixed(4)}`;
    res.json(await cached(key, 60 * 60e3, () => firstOk([() => call(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${b.lat}&lon=${b.lon}`)])));
  }));

  // Approximate location from the caller's IP (ipapi.co, fallback ipwho.is); normalised shape
  router.get('/geo/ip', ah(async (req, res) => {
    const ip = String(req.ip || '').replace(/^::ffff:/, '');
    if (isPrivate(ip)) throw new HttpError(404, 'Cannot geolocate a private or local IP');
    const out = await firstOk([
      async () => { const r = await call(`https://ipapi.co/${encodeURIComponent(ip)}/json/`); if (typeof r.latitude !== 'number') throw 0; return { lat: r.latitude, lon: r.longitude, city: r.city }; },
      async () => { const r = await call(`https://ipwho.is/${encodeURIComponent(ip)}`); if (!r.success || typeof r.latitude !== 'number') throw 0; return { lat: r.latitude, lon: r.longitude, city: r.city }; }
    ]);
    res.json({ success: true, latitude: out.lat, longitude: out.lon, city: out.city || null });
  }));

  // Road routing with alternatives (OSRM demo -> routing.openstreetmap.de fallback)
  router.get('/route', ah(async (req, res) => {
    const b = parse(z.object({ profile: z.enum(['driving', 'foot']), coords: z.string().regex(/^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?(;-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?){1,2}$/, 'coords must be lon,lat;lon,lat[;lon,lat]') }), req.query);
    for (const pair of b.coords.split(';')) { const [lo, la] = pair.split(',').map(Number); if (Math.abs(lo) > 180 || Math.abs(la) > 90) throw new HttpError(400, 'Coordinates out of range'); }
    const qs = 'alternatives=true&steps=true&overview=full&geometries=geojson';
    const ok = r => { if (r?.code !== 'Ok' || !r.routes?.length) throw new Error('no route'); return r; };
    res.json(await cached(`rt:${b.profile}:${b.coords}`, 5 * 60e3, () => firstOk([
      async () => ok(await call(`https://router.project-osrm.org/route/v1/${b.profile}/${b.coords}?${qs}`)),
      async () => ok(await call(`https://routing.openstreetmap.de/routed-${b.profile === 'driving' ? 'car' : 'foot'}/route/v1/driving/${b.coords}?${qs}`))
    ])));
  }));

  // Overpass (OpenStreetMap infrastructure queries). Body: { query }
  router.post('/overpass', ah(async (req, res) => {
    const { query } = parse(z.object({ query: z.string().trim().min(10).max(3000).regex(/^\[out:json\]/, 'query must start with [out:json]') }), req.body);
    const body = `data=${encodeURIComponent(query)}`;
    const post = host => () => call(`https://${host}/api/interpreter`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }, 12000);
    res.json(await cached('op:' + query, 2 * 60e3, () => firstOk([post('overpass-api.de'), post('overpass.kumi.systems')])));
  }));

  return router;
}
