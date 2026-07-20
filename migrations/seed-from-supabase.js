/**
 * One-time data migration: Supabase (Postgres/PostgREST) -> MySQL.
 * Run locally once, right before cutover: `node migrations/seed-from-supabase.js`
 * (Only usable from a machine that can reach both Supabase and the target MySQL host —
 * if the managed MySQL instance isn't network-reachable from here, use the equivalent
 * POST /internal/seed route on the deployed app instead, which runs from inside the
 * platform's own network.)
 *
 * Required environment variables:
 *   SUPABASE_URL                  e.g. https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY              the existing public anon key (works for 10 of 15 tables)
 *   SUPABASE_SERVICE_ROLE_KEY      Dashboard -> Settings -> API (required for the 5
 *                                  RLS-protected tables: top_pick_campaigns, top_pick_cases,
 *                                  top_pick_votes, page_sessions, page_events)
 *   DATABASE_URL                   MySQL connection string for the target managed database
 *
 * Safe to re-run: every insert uses ON DUPLICATE KEY UPDATE.
 */

const mysql = require('mysql2/promise');
const { runSeed } = require('../src/seedCore');

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || !ANON_KEY || !DATABASE_URL) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not set — the 5 RLS-protected tables will be skipped.');
}

async function main() {
  const pool = mysql.createPool(DATABASE_URL);
  const summary = await runSeed({
    supabaseUrl: SUPABASE_URL,
    anonKey: ANON_KEY,
    serviceRoleKey: SERVICE_KEY,
    pool,
    log: msg => console.log(msg)
  });
  await pool.end();

  console.log('\n--- Summary ---');
  summary.forEach(s => {
    console.log(`${s.table}: source=${s.sourceCount} target=${s.targetCount ?? '-'}${s.note ? ' [' + s.note + ']' : ''}`);
  });
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
