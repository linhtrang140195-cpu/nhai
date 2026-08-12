/**
 * One-off: fetch full description from Supabase nhai_submissions,
 * update MySQL cases.short_description with the complete text.
 *
 * Run: node migrations/patch-full-desc.js
 * Env: DATABASE_URL  (already set in demo-system)
 */
const mysql = require('mysql2/promise');

const SB_URL = 'https://xmtxdfeengpbapgudprx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdHhkZmVlbmdwYmFwZ3VkcHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDg0MTAsImV4cCI6MjA5OTE4NDQxMH0.NNePCWoFDuRWmeDI01FK5XOF9IbQq4E3H6wJEju-tRY';

async function sbFetch(table, params = '') {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function main() {
  const pool = mysql.createPool(process.env.DATABASE_URL);

  // 1. Get all DAY #2 cases from MySQL
  const [myCases] = await pool.query(
    `SELECT id, title, short_description FROM cases WHERE season_id LIKE '%-02' OR season_id LIKE '%02%'`
  );
  console.log(`MySQL DAY#2 cases: ${myCases.length}`);

  // 2. Fetch all submissions from Supabase (try nhai_submissions, then cases)
  let subs = [];
  try {
    subs = await sbFetch('nhai_submissions', 'select=id,title,desc,season_id,email&order=id');
    console.log(`Supabase nhai_submissions: ${subs.length} rows`);
  } catch (e) {
    console.warn('nhai_submissions failed:', e.message);
  }

  // 3. Also fetch Supabase cases with full text columns
  let sbCases = [];
  try {
    sbCases = await sbFetch('cases', 'select=id,title,short_description,full_description&season_id=like.*02*');
    console.log(`Supabase cases (day02): ${sbCases.length} rows`);
  } catch (e) {
    console.warn('Supabase cases fetch failed:', e.message);
  }

  // 4. Build lookup: case id → full description text
  const descMap = {};

  // From Supabase cases (full_description or longer short_description)
  for (const c of sbCases) {
    const full = (c.full_description || c.short_description || '').trim();
    if (full) descMap[c.id] = full;
  }

  // From submissions (desc field, matched by id or title)
  for (const s of subs) {
    if (!s.desc) continue;
    // Try to match to a MySQL case by id
    if (s.id && descMap[s.id] === undefined) descMap[s.id] = s.desc;
  }

  console.log(`\nDesc map entries: ${Object.keys(descMap).length}`);

  // 5. Update MySQL cases
  let updated = 0;
  for (const c of myCases) {
    const newDesc = descMap[c.id];
    if (!newDesc) {
      console.log(`  SKIP ${c.id}: no mapping found`);
      continue;
    }
    if (newDesc === c.short_description) {
      console.log(`  SAME ${c.id}: no change`);
      continue;
    }
    console.log(`  UPDATE ${c.id}: ${newDesc.length} chars (was ${(c.short_description||'').length})`);
    await pool.query(`UPDATE cases SET short_description=?, full_description=? WHERE id=?`, [
      newDesc, newDesc, c.id,
    ]);
    updated++;
  }

  console.log(`\nDone — updated ${updated} cases.`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
