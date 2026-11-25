import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from './errors.js';
import { makeGeoRouter } from './geo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) { console.error('FATAL: JWT_SECRET (>=32 chars) is required'); process.exit(1); }
const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const ORIGINS = (process.env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const FRONTEND = path.resolve(process.env.FRONTEND_DIR || path.join(__dirname, '../../frontend/dist'));
const SERVE_FRONTEND = process.env.SERVE_FRONTEND !== 'false';
const SAMESITE = ['strict', 'lax', 'none'].includes(process.env.COOKIE_SAMESITE) ? process.env.COOKIE_SAMESITE : 'strict';
const DB_PATH = process.env.DB_PATH || './data/vylo.db';
if (DB_PATH !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(DB_PATH)), { recursive: true });

// ---------- Database ----------
const db = new DatabaseSync(DB_PATH);
db.exec(`
PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, pass_hash TEXT NOT NULL, theme TEXT NOT NULL DEFAULT 'light', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS contacts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, phone TEXT NOT NULL, relation TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, corridor TEXT NOT NULL, route_key TEXT NOT NULL, rating INTEGER NOT NULL, tags TEXT NOT NULL DEFAULT '[]', is_woman INTEGER NOT NULL DEFAULT 0, comment TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_reviews ON reviews(corridor, route_key, id DESC);
CREATE TABLE IF NOT EXISTS circle_posts(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL DEFAULT 'post', text TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS sos_events(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, lat REAL NOT NULL, lon REAL NOT NULL, corridor TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);
const q = {
  userByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  userById: db.prepare('SELECT id,email,name,theme FROM users WHERE id = ?'),
  insUser: db.prepare('INSERT INTO users(email,name,pass_hash) VALUES(?,?,?)'),
  setTheme: db.prepare('UPDATE users SET theme = ? WHERE id = ?'),
  contacts: db.prepare('SELECT id,name,phone,relation FROM contacts WHERE user_id = ? ORDER BY id'),
  contactCount: db.prepare('SELECT COUNT(*) c FROM contacts WHERE user_id = ?'),
  insContact: db.prepare('INSERT INTO contacts(user_id,name,phone,relation) VALUES(?,?,?,?)'),
  delContact: db.prepare('DELETE FROM contacts WHERE id = ? AND user_id = ?'),
  reviews: db.prepare(`SELECT r.id,u.name AS author,r.rating,r.comment AS text,r.is_woman,r.tags,r.created_at FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.corridor=? AND r.route_key=? ORDER BY r.id DESC LIMIT ? OFFSET ?`),
  reviewStats: db.prepare('SELECT COUNT(*) n, AVG(rating) avg, SUM(is_woman) women FROM reviews WHERE corridor=? AND route_key=?'),
  insReview: db.prepare('INSERT INTO reviews(user_id,corridor,route_key,rating,tags,is_woman,comment) VALUES(?,?,?,?,?,?,?)'),
  circle: db.prepare('SELECT id,user_id,kind,text,created_at FROM circle_posts ORDER BY id DESC LIMIT ? OFFSET ?'),
  insCircle: db.prepare('INSERT INTO circle_posts(user_id,kind,text) VALUES(?,?,?)'),
  insSos: db.prepare('INSERT INTO sos_events(user_id,lat,lon,corridor) VALUES(?,?,?,?)')
};

// ---------- Helpers ----------
const clean = s => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
const txt = (min, max) => z.string().transform(clean).pipe(z.string().min(min).max(max));
const parse = (schema, data) => {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, 'Validation failed', r.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })));
  return r.data;
};
const idParam = v => { const n = Number(v); if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Invalid id'); return n; };
const page = req => parse(z.object({ limit: z.coerce.number().int().min(1).max(50).default(20), offset: z.coerce.number().int().min(0).max(10000).default(0) }), req.query);
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

const Email = z.string().transform(s => s.trim().toLowerCase()).pipe(z.string().email().max(254));
const Phone = z.string().transform(clean).pipe(z.string().regex(/^\+?[0-9 ()-]{7,18}$/, 'Invalid phone number'));
const schemas = {
  register: z.object({ email: Email, name: txt(1, 60), password: z.string().min(8).max(128) }),
  login: z.object({ email: Email, password: z.string().min(1).max(128) }),
  contact: z.object({ name: txt(1, 40), phone: Phone, relation: z.enum(['Parents', 'Family', 'Partner', 'Friend']) }),
  review: z.object({ corridor: txt(3, 160), routeKey: z.enum(['safe', 'unsafe']), rating: z.number().int().min(1).max(5), tags: z.array(txt(1, 30)).max(8).default([]), isWoman: z.boolean().default(false), comment: txt(0, 500) }),
  post: z.object({ text: txt(1, 280), kind: z.enum(['post', 'check']).default('post') }),
  sos: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180), corridor: txt(0, 200).optional() }),
  prefs: z.object({ theme: z.enum(['light', 'dark']) })
};

// ---------- App ----------
const app = express();
app.disable('x-powered-by');
if (PROD) app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https://*.arcgisonline.com'],
    connectSrc: ["'self'", ...ORIGINS],
    frameAncestors: ["'none'"], objectSrc: ["'none'"], baseUri: ["'self'"]
  } },
  hsts: PROD
}));
app.use(cors({ origin: ORIGINS, credentials: true })); // explicit allow-list only; never '*'
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts, try again later' } });
const writeLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, slow down' } });
const readLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, slow down' } });

const api = express.Router();
api.use(readLimiter);
// CSRF defence in depth (cookie is SameSite=Strict): mutations must carry a custom header.
api.use((req, res, next) => (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.get('x-requested-with') === 'vylo') ? next() : next(new HttpError(403, 'Missing X-Requested-With header')));
api.use(['/auth/login', '/auth/register'], authLimiter);
api.use((req, res, next) => (req.method === 'GET' ? next() : writeLimiter(req, res, next)));

const requireAuth = (req, res, next) => {
  try {
    const payload = jwt.verify(req.cookies?.vylo_token || '', SECRET, { algorithms: ['HS256'] });
    const user = q.userById.get(payload.sub);
    if (!user) throw new Error('gone');
    req.user = user; next();
  } catch { next(new HttpError(401, 'Authentication required')); }
};
const issue = (res, id) => {
  const token = jwt.sign({ sub: id }, SECRET, { algorithm: 'HS256', expiresIn: '7d' });
  res.cookie('vylo_token', token, { httpOnly: true, secure: PROD || SAMESITE === 'none', sameSite: SAMESITE, maxAge: 7 * 864e5, path: '/' });
};

api.get('/health', (req, res) => res.json({ ok: true }));
api.post('/auth/register', (req, res) => {
  const b = parse(schemas.register, req.body);
  if (q.userByEmail.get(b.email)) throw new HttpError(409, 'Email already registered');
  const r = q.insUser.run(b.email, b.name, bcrypt.hashSync(b.password, 12));
  issue(res, Number(r.lastInsertRowid));
  res.status(201).json({ user: q.userById.get(Number(r.lastInsertRowid)) });
});
api.post('/auth/login', (req, res) => {
  const b = parse(schemas.login, req.body);
  const u = q.userByEmail.get(b.email);
  const ok = bcrypt.compareSync(b.password, u ? u.pass_hash : DUMMY_HASH);
  if (!u || !ok) throw new HttpError(401, 'Invalid email or password');
  issue(res, u.id);
  res.json({ user: q.userById.get(u.id) });
});
api.post('/auth/logout', (req, res) => { res.clearCookie('vylo_token', { path: '/' }); res.json({ ok: true }); });
api.get('/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));
api.put('/prefs', requireAuth, (req, res) => { const b = parse(schemas.prefs, req.body); q.setTheme.run(b.theme, req.user.id); res.json({ theme: b.theme }); });

api.get('/contacts', requireAuth, (req, res) => res.json({ contacts: q.contacts.all(req.user.id) }));
api.post('/contacts', requireAuth, (req, res) => {
  const b = parse(schemas.contact, req.body);
  if (q.contactCount.get(req.user.id).c >= 20) throw new HttpError(409, 'Contact limit (20) reached');
  const r = q.insContact.run(req.user.id, b.name, b.phone, b.relation);
  res.status(201).json({ contact: { id: Number(r.lastInsertRowid), ...b } });
});
api.delete('/contacts/:id', requireAuth, (req, res) => {
  const r = q.delContact.run(idParam(req.params.id), req.user.id); // ownership enforced in SQL
  if (!r.changes) throw new HttpError(404, 'Contact not found');
  res.json({ ok: true });
});

api.get('/reviews', requireAuth, (req, res) => {
  const { corridor, routeKey } = parse(z.object({ corridor: txt(3, 160), routeKey: z.enum(['safe', 'unsafe']) }), req.query);
  const { limit, offset } = page(req);
  const s = q.reviewStats.get(corridor, routeKey);
  res.json({ stats: { count: s.n, avg: s.avg ? +s.avg.toFixed(1) : null, women: s.women || 0 },
    reviews: q.reviews.all(corridor, routeKey, limit, offset).map(r => ({ ...r, tags: JSON.parse(r.tags), is_woman: !!r.is_woman })) });
});
api.post('/reviews', requireAuth, (req, res) => {
  const b = parse(schemas.review, req.body);
  const r = q.insReview.run(req.user.id, b.corridor, b.routeKey, b.rating, JSON.stringify(b.tags), b.isWoman ? 1 : 0, b.comment || 'Verified route.');
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

api.get('/circle', requireAuth, (req, res) => {
  const { limit, offset } = page(req);
  res.json({ posts: q.circle.all(limit, offset).map(p => ({ id: p.id, alias: p.user_id === req.user.id ? 'You (Masked Member)' : `Member #${1000 + p.user_id}`, kind: p.kind, text: p.text, created_at: p.created_at })) });
});
api.post('/circle', requireAuth, (req, res) => {
  const b = parse(schemas.post, req.body);
  const r = q.insCircle.run(req.user.id, b.kind, b.text);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});
api.post('/sos', requireAuth, (req, res) => {
  const b = parse(schemas.sos, req.body);
  const r = q.insSos.run(req.user.id, b.lat, b.lon, b.corridor || null);
  res.status(201).json({ id: Number(r.lastInsertRowid), contacts: q.contacts.all(req.user.id) });
});
api.use(makeGeoRouter({ contact: process.env.UPSTREAM_CONTACT || '' }));
api.use((req, res, next) => next(new HttpError(404, 'Route not found')));
app.use('/api', api);

// ---------- Frontend (React build in ../frontend/dist; set SERVE_FRONTEND=false to host it elsewhere) ----------
if (SERVE_FRONTEND) {
  app.use(express.static(FRONTEND, { index: false, maxAge: PROD ? '1h' : 0 }));
  app.get(/^\/(?!api\/).*/, (req, res, next) => {           // SPA fallback
    const f = path.join(FRONTEND, 'index.html');
    if (!fs.existsSync(f)) return next(new HttpError(500, 'Frontend not built. Run: cd frontend && npm install && npm run build'));
    res.sendFile(f);
  });
}

// ---------- Error handling ----------
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') err = new HttpError(400, 'Malformed JSON');
  if (err.type === 'entity.too.large') err = new HttpError(413, 'Payload too large');
  const status = err instanceof HttpError ? err.status : 500;
  if (status === 500) console.error('[error]', err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message, ...(err.details ? { details: err.details } : {}) });
});
process.on('unhandledRejection', e => console.error('[unhandledRejection]', e));
process.on('uncaughtException', e => console.error('[uncaughtException]', e));

export { app };
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = app.listen(PORT, () => console.log(`Vylo running on http://localhost:${PORT}`));
  const stop = () => server.close(() => { db.close(); process.exit(0); });
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
