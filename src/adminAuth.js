const crypto = require('crypto');
const pool = require('./db');

// The old gate compared the password in the browser, so the password shipped inside
// every copy of the admin page and hiding the overlay was enough to walk past it.
// Verification now happens here, and the page is not served without a valid cookie.
//
// The secret cannot live in the environment — this platform injects DATABASE_URL and
// nothing else — so the scrypt hash and the cookie signing key are rows in site_config.
// Those two keys must never be readable through the REST shim; see SECRET_CONFIG_KEYS.
const PASSWORD_KEY = 'admin_password_scrypt';
const SIGNING_KEY = 'admin_session_secret';
const COOKIE = 'nhai_admin';
const SESSION_MS = 12 * 60 * 60 * 1000;

const SECRET_CONFIG_KEYS = new Set([PASSWORD_KEY, SIGNING_KEY]);

async function readConfig(key) {
  const [rows] = await pool.query('SELECT value FROM site_config WHERE `key` = ?', [key]);
  if (!rows[0]) return null;
  const raw = rows[0].value;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

async function writeConfig(key, value) {
  await pool.query(
    'INSERT INTO site_config (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
    [key, JSON.stringify(value)]
  );
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password, stored) {
  if (!stored || !stored.salt || !stored.hash) return false;
  const { hash } = hashPassword(password, stored.salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(stored.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function signingSecret() {
  let s = await readConfig(SIGNING_KEY);
  if (!s) {
    s = crypto.randomBytes(32).toString('hex');
    await writeConfig(SIGNING_KEY, s);
  }
  return s;
}

async function issueToken() {
  const expires = Date.now() + SESSION_MS;
  const payload = `${expires}`;
  const sig = crypto.createHmac('sha256', await signingSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

async function tokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (!/^\d+$/.test(payload) || Number(payload) < Date.now()) return false;
  const expected = crypto.createHmac('sha256', await signingSecret()).update(payload).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

async function isAuthed(req) {
  return tokenValid(readCookie(req, COOKIE));
}

async function passwordIsSet() {
  return !!(await readConfig(PASSWORD_KEY));
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

module.exports = {
  PASSWORD_KEY, SIGNING_KEY, SECRET_CONFIG_KEYS,
  readConfig, writeConfig, hashPassword, verifyPassword,
  issueToken, isAuthed, passwordIsSet, setSessionCookie, clearSessionCookie
};
