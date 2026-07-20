// Shared logic for the one-time Supabase -> MySQL data migration.
// Used both by the standalone CLI script (migrations/seed-from-supabase.js) and by
// the temporary HTTP route (POST /internal/seed) so there is only one implementation.

const TABLES = [
  { name: 'seasons', pk: 'id', needsServiceRole: false },
  { name: 'award_categories', pk: 'id', needsServiceRole: false },
  { name: 'mentors', pk: 'id', needsServiceRole: false },
  { name: 'events', pk: 'id', needsServiceRole: false },
  { name: 'faqs', pk: 'id', needsServiceRole: false },
  { name: 'registrations', pk: 'id', needsServiceRole: false },
  { name: 'site_config', pk: 'key', needsServiceRole: false, jsonCols: ['value'] },
  { name: 'season_stats', pk: 'season_id', needsServiceRole: false },
  { name: 'awards', pk: 'id', needsServiceRole: false, jsonCols: ['category_tags'] },
  { name: 'cases', pk: 'id', needsServiceRole: false, jsonCols: ['tools_used', 'team_members', 'category_tags'] },
  { name: 'top_pick_campaigns', pk: 'id', needsServiceRole: true },
  { name: 'top_pick_cases', pk: 'case_id', needsServiceRole: true },
  { name: 'top_pick_votes', pk: 'id', needsServiceRole: true },
  { name: 'page_sessions', pk: 'session_id', needsServiceRole: true },
  { name: 'page_events', pk: 'id', needsServiceRole: true, jsonCols: ['meta'] }
];

const ISO_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

// PostgREST already unwraps jsonb columns into native JS values (string/number/bool/
// object/array) before this script ever sees them, so re-inserting into a MySQL JSON
// column needs an explicit JSON.stringify() regardless of the value's JS type — not
// just for objects/arrays. Only columns listed in a table's `jsonCols` get this.
function convertValue(v, isJsonCol) {
  if (v === null || v === undefined) return null;
  if (isJsonCol) return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'string' && ISO_TS_RE.test(v)) {
    return new Date(v).toISOString().slice(0, 19).replace('T', ' ');
  }
  return v;
}

async function fetchAllRows(supabaseUrl, anonKey, serviceRoleKey, table, needsServiceRole) {
  const key = needsServiceRole ? serviceRoleKey : anonKey;
  if (!key) {
    return { rows: [], skipped: true };
  }
  const rows = [];
  const pageSize = 1000;
  let offset = 0;
  for (;;) {
    const url = `${supabaseUrl}/rest/v1/${table}?select=*&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!res.ok) {
      return { rows, error: `HTTP ${res.status}: ${await res.text()}` };
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return { rows };
}

async function importTable(pool, table, pk, rows, jsonCols = []) {
  if (!rows.length) return 0;
  const jsonSet = new Set(jsonCols);
  let count = 0;
  for (const row of rows) {
    const cols = Object.keys(row);
    const values = cols.map(c => convertValue(row[c], jsonSet.has(c)));
    const updateCols = cols.filter(c => c !== pk);
    const sql = `INSERT INTO \`${table}\` (${cols.map(c => `\`${c}\``).join(', ')})
                 VALUES (${cols.map(() => '?').join(', ')})
                 ON DUPLICATE KEY UPDATE ${updateCols.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ') || `\`${pk}\` = \`${pk}\``}`;
    await pool.query(sql, values);
    count++;
  }
  return count;
}

/**
 * Run the full migration. Returns a per-table summary array.
 */
async function runSeed({ supabaseUrl, anonKey, serviceRoleKey, pool, log = () => {} }) {
  const summary = [];
  for (const { name, pk, needsServiceRole, jsonCols } of TABLES) {
    log(`${name}: fetching from Supabase...`);
    const { rows, error, skipped } = await fetchAllRows(supabaseUrl, anonKey, serviceRoleKey, name, needsServiceRole);

    if (skipped) {
      summary.push({ table: name, sourceCount: 0, targetCount: null, note: 'skipped (no service_role key)' });
      continue;
    }
    if (error) {
      summary.push({ table: name, sourceCount: rows.length, targetCount: null, note: `fetch error: ${error}` });
      continue;
    }

    log(`${name}: ${rows.length} rows fetched, importing...`);
    const written = await importTable(pool, name, pk, rows, jsonCols);

    const [[{ c }]] = await pool.query(`SELECT COUNT(*) as c FROM \`${name}\``);
    summary.push({ table: name, sourceCount: rows.length, targetCount: c, written });
  }
  return summary;
}

module.exports = { runSeed, TABLES };
