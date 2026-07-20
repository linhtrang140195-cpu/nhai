const express = require('express');
const crypto = require('crypto');
const pool = require('./db');

const router = express.Router();

// table -> { pk: primary key column name, columns: [known column names] }
const TABLES = {
  seasons: { pk: 'id', columns: ['id', 'name', 'display_order', 'is_current', 'status', 'created_at'] },
  mentors: { pk: 'id', columns: ['id', 'name', 'role', 'tag', 'avatar_url', 'is_active', 'display_order', 'created_at'] },
  events: { pk: 'id', columns: ['id', 'season_id', 'name', 'date', 'city', 'status', 'recap_url', 'description', 'display_order', 'created_at'] },
  faqs: { pk: 'id', columns: ['id', 'question', 'answer', 'is_active', 'display_order', 'created_at'] },
  registrations: {
    pk: 'id',
    columns: ['id', 'season_id', 'full_name', 'email', 'city', 'team', 'registration_type',
      'member2_name', 'member2_email', 'member2_team', 'member3_name', 'member3_email', 'member3_team',
      'team_matching_note', 'problem_to_solve', 'ai_level', 'expected_output', 'need_laptop', 'is_imported', 'created_at']
  },
  site_config: { pk: 'key', columns: ['key', 'value', 'updated_at'] },
  season_stats: {
    pk: 'season_id',
    columns: ['season_id', 'total_participants', 'total_teams', 'hn_participants', 'hcm_participants',
      'avg_experience', 'avg_mentor', 'pct_has_demo', 'pct_want_continue', 'pct_will_participate',
      'feedback_count', 'feedback_sheet_url', 'updated_at']
  },
  awards: {
    pk: 'id',
    columns: ['id', 'season_id', 'category_id', 'city', 'winner_case_id', 'winner_name', 'winner_team',
      'winner_description', 'category_tags', 'status', 'votes_count', 'created_at']
  },
  award_categories: { pk: 'id', columns: ['id', 'name', 'description', 'prize_amount', 'icon', 'display_order'] },
  cases: {
    pk: 'id',
    columns: ['id', 'season_id', 'campaign_id', 'city', 'title', 'short_description', 'full_description',
      'purpose', 'tools_used', 'demo_url', 'sticker', 'owner_name', 'owner_email', 'owner_team',
      'team_members', 'category_tags', 'is_active', 'display_order', 'created_at']
  },
  top_pick_campaigns: { pk: 'id', columns: ['id', 'name', 'max_votes_per_device', 'is_active', 'opens_at', 'closes_at', 'created_at'] },
  top_pick_cases: { pk: 'case_id', columns: ['case_id', 'campaign_id', 'city', 'title', 'is_active', 'created_at'] },
  top_pick_votes: { pk: 'id', columns: ['id', 'campaign_id', 'case_id', 'device_id', 'created_at'] },
  page_sessions: {
    pk: 'session_id',
    columns: ['session_id', 'device_id', 'entry_path', 'page_title', 'user_agent', 'started_at', 'ended_at', 'duration_seconds', 'last_event_at']
  },
  page_events: {
    pk: 'id',
    columns: ['id', 'session_id', 'device_id', 'event_name', 'event_value', 'meta', 'created_at']
  }
};

function coerceFilterValue(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  return raw;
}

function encodeWriteValue(v) {
  if (v !== null && typeof v === 'object') return JSON.stringify(v);
  return v;
}

// Parse the PostgREST-style query string this app actually sends:
//   col=eq.value   order=col[.asc|.desc]   limit=N   select=col1,col2
function parseQuery(table, query) {
  const def = TABLES[table];
  const known = new Set(def.columns);

  const filters = [];
  for (const [key, rawVal] of Object.entries(query)) {
    if (key === 'order' || key === 'limit' || key === 'select') continue;
    if (!known.has(key)) continue;
    const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
    if (typeof val !== 'string' || !val.startsWith('eq.')) continue;
    filters.push({ col: key, val: coerceFilterValue(val.slice(3)) });
  }

  let orderBy = '';
  if (query.order) {
    const raw = Array.isArray(query.order) ? query.order[0] : query.order;
    const parts = raw.split('.');
    let col = parts[0];
    let dir = 'ASC';
    if (parts.length > 1 && (parts[1] === 'asc' || parts[1] === 'desc')) {
      dir = parts[1].toUpperCase();
    }
    if (known.has(col)) orderBy = `ORDER BY \`${col}\` ${dir}`;
  }

  let limit = '';
  if (query.limit) {
    const n = parseInt(Array.isArray(query.limit) ? query.limit[0] : query.limit, 10);
    if (Number.isFinite(n) && n > 0) limit = `LIMIT ${n}`;
  }

  let projection = '*';
  if (query.select) {
    const raw = Array.isArray(query.select) ? query.select[0] : query.select;
    const cols = raw.split(',').map(c => c.trim()).filter(c => known.has(c));
    if (cols.length) projection = cols.map(c => `\`${c}\``).join(', ');
  }

  return { filters, orderBy, limit, projection };
}

router.all('/:table', async (req, res) => {
  const { table } = req.params;
  const def = TABLES[table];
  if (!def) return res.status(400).json({ message: `Unknown table: ${table}` });

  try {
    const { filters, orderBy, limit, projection } = parseQuery(table, req.query);
    const whereSql = filters.length
      ? 'WHERE ' + filters.map(f => `\`${f.col}\` = ?`).join(' AND ')
      : '';
    const whereParams = filters.map(f => f.val);

    if (req.method === 'GET') {
      const sql = `SELECT ${projection} FROM \`${table}\` ${whereSql} ${orderBy} ${limit}`.trim();
      const [rows] = await pool.query(sql, whereParams);
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const body = { ...req.body };
      if (!body[def.pk]) {
        if (def.pk === 'id') body.id = crypto.randomUUID();
        else return res.status(400).json({ message: `Missing required field: ${def.pk}` });
      }
      const cols = Object.keys(body).filter(c => def.columns.includes(c));
      const values = cols.map(c => encodeWriteValue(body[c]));
      const sql = `INSERT INTO \`${table}\` (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
      await pool.query(sql, values);

      const [rows] = await pool.query(
        `SELECT * FROM \`${table}\` WHERE \`${def.pk}\` = ?`,
        [body[def.pk]]
      );
      return res.status(201).json(rows);
    }

    if (req.method === 'PATCH') {
      if (!filters.length) return res.status(400).json({ message: 'PATCH requires at least one eq. filter' });
      const cols = Object.keys(req.body).filter(c => def.columns.includes(c) && c !== def.pk);
      if (!cols.length) return res.status(400).json({ message: 'No updatable fields in body' });
      const setSql = cols.map(c => `\`${c}\` = ?`).join(', ');
      const setParams = cols.map(c => encodeWriteValue(req.body[c]));
      const sql = `UPDATE \`${table}\` SET ${setSql} ${whereSql}`;
      await pool.query(sql, [...setParams, ...whereParams]);

      const [rows] = await pool.query(`SELECT * FROM \`${table}\` ${whereSql}`, whereParams);
      return res.json(rows);
    }

    if (req.method === 'DELETE') {
      if (!filters.length) return res.status(400).json({ message: 'DELETE requires at least one eq. filter' });
      const sql = `DELETE FROM \`${table}\` ${whereSql}`;
      await pool.query(sql, whereParams);
      return res.status(200).json([]);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (e) {
    console.error('restShim error:', table, req.method, e.message);
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;
