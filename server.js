const express = require('express');
const fs = require('fs');
const path = require('path');

const pool = require('./src/db');
const restShim = require('./src/restShim');
const topPickVote = require('./src/topPickVote');
const siteAnalytics = require('./src/siteAnalytics');
const { runSeed } = require('./src/seedCore');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

app.use('/rest/v1', restShim);
app.all('/api/top-pick-vote', topPickVote);
app.post('/api/site-analytics', siteAnalytics);

// One-time, manually-triggered data import from Supabase. Not linked from anywhere in the
// UI. Keys are supplied per-request in the body (never stored/committed). Safe to leave in
// place after use — it only writes via ON DUPLICATE KEY UPDATE, matching the app's existing
// no-real-auth security posture (every /rest/v1 route is equally open today).
app.post('/internal/seed', async (req, res) => {
  const { supabaseUrl, anonKey, serviceRoleKey } = req.body || {};
  if (!supabaseUrl || !anonKey) {
    return res.status(400).json({ ok: false, message: 'supabaseUrl and anonKey are required in the body.' });
  }
  try {
    const summary = await runSeed({ supabaseUrl, anonKey, serviceRoleKey, pool });
    res.json({ ok: true, summary });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.use(express.static(__dirname));

async function runSchemaMigration() {
  const sqlFile = path.join(__dirname, 'migrations', '001_schema.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  console.log(`Schema migration: ${statements.length} statements applied (idempotent).`);
}

runSchemaMigration()
  .catch(e => console.error('Schema migration failed:', e.message))
  .finally(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`NHAI DAY server listening on port ${PORT}`);
    });
  });
