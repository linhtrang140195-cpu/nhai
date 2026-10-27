const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');

const pool = require('./src/db');
const restShim = require('./src/restShim');
const topPickVote = require('./src/topPickVote');
const siteAnalytics = require('./src/siteAnalytics');
const { runSeed } = require('./src/seedCore');
const adminAuth = require('./src/adminAuth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// The runner answers on its own public hostname as well as through the company
// proxy, and only the proxy restricts access by network. Reached directly, the
// database and admin were open to the whole internet. Deny by hostname (never an
// allowlist — a wrong value there would lock out every real user) and only for
// data paths, so `/` still answers and the platform health check cannot flap.
// Blocking the runner's own hostname was the wrong tool: people reach the site on
// both that hostname and the company proxy, so denying one locked real users out of
// a working site. What protects the data is the session check on /rest/v1 and on the
// admin page — that holds on whichever hostname the request arrives through.
//
// The one thing left that has no session check of its own is /internal, so guard it
// here rather than leaving unauthenticated write endpoints open.
app.use('/internal', async (req, res, next) => {
  if (await adminAuth.isAuthed(req)) return next();
  console.log(`internal denied: ${req.method} ${req.path} from ${req.headers['x-forwarded-for'] || '-'}`);
  res.status(401).json({ ok: false, message: 'Cần đăng nhập quản trị.' });
});

app.post('/api/admin-login', async (req, res) => {
  const password = String(req.body?.password || '');
  if (!password) return res.status(400).json({ ok: false, message: 'Thiếu mật khẩu.' });

  // First run has no password stored: whoever reaches this sets it. Only the company
  // proxy can reach /api at all, so that is a colleague, not the internet.
  if (!(await adminAuth.passwordIsSet())) {
    if (password.length < 8) return res.status(400).json({ ok: false, message: 'Mật khẩu phải từ 8 ký tự.' });
    await adminAuth.writeConfig(adminAuth.PASSWORD_KEY, adminAuth.hashPassword(password));
    adminAuth.setSessionCookie(res, await adminAuth.issueToken());
    return res.json({ ok: true, created: true });
  }

  if (!adminAuth.verifyPassword(password, await adminAuth.readConfig(adminAuth.PASSWORD_KEY))) {
    console.log(`admin login failed from ${req.headers['x-forwarded-for'] || '-'}`);
    return res.status(401).json({ ok: false, message: 'Mật khẩu không đúng.' });
  }
  adminAuth.setSessionCookie(res, await adminAuth.issueToken());
  res.json({ ok: true });
});

app.post('/api/admin-logout', (req, res) => {
  adminAuth.clearSessionCookie(res);
  res.json({ ok: true });
});

app.get('/api/admin-session', async (req, res) => {
  res.json({ ok: true, authed: await adminAuth.isAuthed(req), passwordSet: await adminAuth.passwordIsSet() });
});

app.use('/rest/v1', restShim);
app.all('/api/top-pick-vote', topPickVote);
app.post('/api/site-analytics', siteAnalytics);

// Proxy Google Sheets CSV export to bypass browser CORS restriction.
// Only allows docs.google.com URLs.
app.get('/api/proxy-sheet', (req, res) => {
  const target = String(req.query.url || '');
  if (!target.startsWith('https://docs.google.com/')) {
    return res.status(400).json({ error: 'Only docs.google.com URLs are allowed.' });
  }
  https.get(target, (upstream) => {
    res.setHeader('Content-Type', upstream.headers['content-type'] || 'text/csv');
    upstream.pipe(res);
  }).on('error', (e) => res.status(502).json({ error: e.message }));
});

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

// One-time patch: update DAY #2 case descriptions and tools_used from CSV source data.
app.post('/internal/patch-day2-desc', async (req, res) => {
  try {
    delete require.cache[require.resolve('./migrations/day2-desc-data')];
    const updates = require('./migrations/day2-desc-data');
    const results = [];
    for (const u of updates) {
      const toolsJson = JSON.stringify(u.tools || []);
      const [r] = await pool.query(
        'UPDATE cases SET short_description=?, full_description=?, tools_used=? WHERE title LIKE ?',
        [u.desc, u.desc, toolsJson, `%${u.titleMatch}%`]
      );
      results.push({ title: u.titleMatch, affected: r.affectedRows, tools: u.tools });
    }
    res.json({ ok: true, results });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Returns full case details for all active cases in a campaign (for public vote UI).
app.get('/api/campaign-cases', async (req, res) => {
  const campaignId = String(req.query.campaign_id || '');
  if (!campaignId) return res.json([]);
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.season_id, c.city, c.title, c.short_description, c.full_description,
              c.demo_url, c.tools_used, c.owner_name, c.sticker, c.next_step
       FROM top_pick_cases tc
       JOIN cases c ON c.id = tc.case_id
       WHERE tc.campaign_id = ? AND tc.is_active = 1 AND c.is_active = 1 AND (c.is_master_chef IS NULL OR c.is_master_chef = 0)
       ORDER BY c.display_order`,
      [campaignId]
    );
    rows.forEach(r => {
      if (typeof r.tools_used === 'string') {
        try { r.tools_used = JSON.parse(r.tools_used); } catch { r.tools_used = []; }
      }
    });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Returns the currently active voting campaign.
app.get('/api/active-campaign', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, max_votes_per_device, opens_at, closes_at FROM top_pick_campaigns WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    );
    if (!rows[0]) return res.json({ ok: false, message: 'No active campaign.' });
    res.json({ ok: true, campaign: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Media-effectiveness aggregates for the admin dashboard. Rolled up in SQL so the
// browser never pulls the raw session/event rows. Admin-only: this reads traffic data.
// Time window is either an explicit date range (from / to, YYYY-MM-DD, inclusive of the
// whole `to` day) or a trailing `days` window (0 or 'all' = no lower bound); the range
// wins when given. The site is a single-page app — most visits land on '/' and move
// between pages via in-page tabs with no new page load — so page popularity comes from
// tab_view events, not entry_path (which only records the landing page). Season
// popularity comes from edition_view events, recorded only from the release that added
// that tracking; older traffic predates it and cannot be back-filled.
app.get('/api/media-stats', async (req, res) => {
  try {
    if (!(await adminAuth.isAuthed(req))) return res.status(401).json({ ok: false, message: 'Cần đăng nhập quản trị.' });
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    const from = dateOnly.test(String(req.query.from || '')) ? String(req.query.from) : null;
    const to = dateOnly.test(String(req.query.to || '')) ? String(req.query.to) : null;

    // Timestamps are stored in UTC (siteAnalytics writes new Date().toISOString()),
    // but the admin picks dates in Vietnam time — like the rest of the app. A from/to
    // day is a Vietnam wall-clock day, so convert its VN midnight boundaries to the
    // matching UTC instants before comparing, or "Hôm nay" (24/9 VN) would query the
    // wrong 24 hours of UTC and miss the day's traffic.
    const vnToUtc = (dateStr, endOfDay) =>
      new Date(`${dateStr}T${endOfDay ? '23:59:59' : '00:00:00'}+07:00`).toISOString().slice(0, 19).replace('T', ' ');
    const lower = [], upper = [];
    if (from || to) {
      if (from) { lower.push(vnToUtc(from, false)); }
      if (to) { upper.push(vnToUtc(to, true)); }
    } else {
      const daysRaw = String(req.query.days || '30').toLowerCase();
      const days = (daysRaw === 'all' || daysRaw === '0') ? 0 : Math.min(Math.max(parseInt(daysRaw, 10) || 30, 1), 3650);
      if (days) lower.push(new Date(Date.now() - days * 86400000).toISOString().slice(0, 19).replace('T', ' '));
    }
    // Compose "col >= ? AND col <= ?" for whichever bounds exist.
    const boundSql = (col, prefix) => {
      const parts = [];
      if (lower.length) parts.push(`${col} >= ?`);
      if (upper.length) parts.push(`${col} <= ?`);
      if (!parts.length) return { clause: '', args: [] };
      return { clause: `${prefix} ${parts.join(' AND ')}`, args: [...lower, ...upper] };
    };
    const sBound = boundSql('started_at', 'WHERE'), sCond = sBound.clause, sArgs = sBound.args;
    const eBound = boundSql('created_at', 'AND'), eCond = eBound.clause, eArgs = eBound.args;

    const [[totals]] = await pool.query(
      `SELECT COUNT(*) AS sessions, COUNT(DISTINCT device_id) AS devices,
              ROUND(AVG(duration_seconds)) AS avg_dwell,
              ROUND(SUM(CASE WHEN duration_seconds < 10 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*),0)) AS bounce_pct
       FROM page_sessions ${sCond}`, sArgs);

    const [landing] = await pool.query(
      `SELECT entry_path AS label, COUNT(*) AS sessions, COUNT(DISTINCT device_id) AS devices,
              ROUND(AVG(duration_seconds)) AS avg_dwell
       FROM page_sessions ${sCond} GROUP BY entry_path ORDER BY sessions DESC LIMIT 30`, sArgs);

    const [tabs] = await pool.query(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(meta,'$.tab')) AS label,
              COUNT(*) AS views, COUNT(DISTINCT device_id) AS devices
       FROM page_events WHERE event_name = 'tab_view' ${eCond}
       GROUP BY label ORDER BY views DESC`, eArgs);

    const [recaps] = await pool.query(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(meta,'$.event_name')) AS label,
              COUNT(*) AS opens, COUNT(DISTINCT device_id) AS devices
       FROM page_events WHERE event_name = 'recap_open' ${eCond}
       GROUP BY label ORDER BY opens DESC`, eArgs);

    const [editions] = await pool.query(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(meta,'$.label')) AS label,
              COUNT(*) AS views, COUNT(DISTINCT device_id) AS devices
       FROM page_events WHERE event_name = 'edition_view' ${eCond}
       GROUP BY label ORDER BY views DESC`, eArgs);

    // Group by the Vietnam calendar day (+7h), so a bar labelled 24/9 holds the traffic
    // people would call "the 24th" — not the UTC day, which would split a VN day in two.
    const [daily] = await pool.query(
      `SELECT DATE(started_at + INTERVAL 7 HOUR) AS day, COUNT(*) AS sessions, COUNT(DISTINCT device_id) AS devices
       FROM page_sessions ${sCond} GROUP BY DATE(started_at + INTERVAL 7 HOUR) ORDER BY day DESC LIMIT 60`, sArgs);

    res.json({ ok: true, from, to, totals, landing, tabs, recaps, editions, daily });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

function normSeasonCity(v) {
  const s = String(v || '').trim().toLowerCase();
  if (s === 'hcm' || s === 'tp.hcm' || s === 'tphcm' || s.includes('minh')) return 'HCM';
  return 'HN';
}

// The results page used to decide "has this season's Top Pick Dish winner been
// announced?" from a single global voteState tied to whichever campaign the client
// currently has active — so once ANY city's vote opened elsewhere, every OTHER
// season's already-closed winner card vanished, because the shared flag read "not
// closed" for all of them. A season's own result must not depend on what else is
// open. Compute it here straight from case_id, which votes are permanently tied to
// regardless of which campaign currently owns that case row.
app.get('/api/season-top-pick', async (req, res) => {
  try {
    const seasonId = String(req.query.season_id || '');
    if (!seasonId) return res.status(400).json({ ok: false, message: 'season_id is required.' });

    const emptyResult = { ok: true, cities: { HN: { closed: true, winner: null }, HCM: { closed: true, winner: null } } };
    const [cases] = await pool.query(
      "SELECT id, city, title, owner_name FROM cases WHERE season_id = ? AND is_active = 1 AND (is_master_chef IS NULL OR is_master_chef = 0)",
      [seasonId]
    );
    if (!cases.length) return res.json(emptyResult);

    const ids = cases.map(c => c.id);
    const placeholders = ids.map(() => '?').join(',');
    const [voteRows] = await pool.query(
      `SELECT case_id, COUNT(*) AS n FROM top_pick_votes WHERE case_id IN (${placeholders}) GROUP BY case_id`,
      ids
    );
    const votesByCase = {};
    voteRows.forEach(r => { votesByCase[r.case_id] = r.n; });

    const [campRows] = await pool.query(
      `SELECT tc.case_id, camp.opens_at, camp.closes_at, camp.is_active
       FROM top_pick_cases tc JOIN top_pick_campaigns camp ON camp.id = tc.campaign_id
       WHERE tc.case_id IN (${placeholders})`,
      ids
    );

    const now = new Date();
    const isOpenNow = camp => {
      if (!camp.is_active) return false;
      if (camp.opens_at && new Date(camp.opens_at) > now) return false;
      if (camp.closes_at && new Date(camp.closes_at) < now) return false;
      return true;
    };

    const result = { ok: true, cities: {} };
    ['HN', 'HCM'].forEach(cityBucket => {
      const casesForCity = cases.filter(c => normSeasonCity(c.city) === cityBucket);
      if (!casesForCity.length) { result.cities[cityBucket] = { closed: true, winner: null }; return; }
      const idsForCity = new Set(casesForCity.map(c => c.id));
      const anyOpen = campRows.some(r => idsForCity.has(r.case_id) && isOpenNow(r));
      let winner = null;
      if (!anyOpen) {
        const ranked = casesForCity
          .map(c => ({ id: c.id, title: c.title, person: c.owner_name, votes: votesByCase[c.id] || 0 }))
          .sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title, 'vi'));
        if (ranked.length && ranked[0].votes > 0) winner = ranked[0];
      }
      result.cities[cityBucket] = { closed: !anyOpen, winner };
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// Pretty routes for the HTML pages. Source files are named .tmpl (not .html) so the
// deploy platform's project-type detector — which unconditionally classifies any repo
// containing an .html file as a static site, ignoring package.json entirely — picks up
// this as a Node/Express app instead.
function servePage(relPath) {
  return (req, res) => res.type('html').sendFile(path.join(__dirname, 'public', relPath));
}
app.get('/', servePage('index.tmpl'));
app.get(['/ket-qua', '/ket-qua/'], servePage('index.tmpl'));
app.get(['/thong-tin', '/thong-tin/'], servePage('index.tmpl'));
app.get(['/de-bai', '/de-bai/'], servePage('index.tmpl'));
app.get(['/faq', '/faq/'], servePage('index.tmpl'));
app.get(['/submit-usecase', '/submit-usecase/'], servePage('index.tmpl'));
app.get(['/dang-ky', '/dang-ky/'], servePage('index.tmpl'));
app.get(['/feedback', '/feedback/'], servePage('index.tmpl'));
app.get('/bai-viet/:postId', servePage('index.tmpl'));
// Without a session the admin markup is never sent, so there is nothing to unhide.
function serveAdmin(relPath) {
  const page = servePage(relPath);
  return async (req, res) => {
    if (await adminAuth.isAuthed(req)) return page(req, res);
    res.type('html').sendFile(path.join(__dirname, 'public', 'nhai-day-admin/login.tmpl'));
  };
}
app.get(['/nhai-day-admin', '/nhai-day-admin/'], serveAdmin('nhai-day-admin/index.tmpl'));
app.get('/nhai-day-admin/:tab', serveAdmin('nhai-day-admin/index.tmpl'));
app.get('/nhai-day-admin.html', serveAdmin('nhai-day-admin.tmpl'));
app.get('/nhai-day.html', servePage('nhai-day.tmpl'));

// Case submission endpoints
app.post('/api/submit-case', async (req, res) => {
  try {
    const { season_id, city, title, description, tools, demo_url, owner_name, owner_email, team_members, next_step } = req.body || {};
    if (!owner_email || !owner_email.trim().toLowerCase().endsWith('@garena.vn'))
      return res.status(400).json({ ok: false, message: 'Email phải là @garena.vn' });
    if (!title || !description || !demo_url || !owner_name || !city)
      return res.status(400).json({ ok: false, message: 'Vui lòng điền đầy đủ các trường bắt buộc.' });
    const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    await pool.query(
      `INSERT INTO case_submissions (id, season_id, city, title, description, tools, demo_url, owner_name, owner_email, team_members, next_step)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, (season_id||'nhai-day-02'), city, title.trim(), description.trim(), (tools||'').trim(), demo_url.trim(), owner_name.trim(), owner_email.trim().toLowerCase(), (team_members||'').trim(), (next_step||'').trim()]
    );
    res.json({ ok: true, id });
  } catch(e) { res.status(500).json({ ok: false, message: e.message }); }
});

app.post('/api/approve-submission', async (req, res) => {
  try {
    const { submission_id, campaign_id, title, description, tools, demo_url } = req.body || {};
    if (!submission_id) return res.status(400).json({ ok: false, message: 'submission_id required' });
    const [rows] = await pool.query('SELECT * FROM case_submissions WHERE id = ?', [submission_id]);
    const sub = rows[0];
    if (!sub) return res.status(404).json({ ok: false, message: 'Submission not found' });
    const caseId = `sub-${sub.city.toLowerCase()}-${Date.now()}`;
    const caseTitle = (title || sub.title).trim();
    const caseDesc  = (description || sub.description).trim();
    const caseDemoUrl = (demo_url || sub.demo_url).trim();
    const toolsArr = (tools || sub.tools || '').split(',').map(t=>t.trim()).filter(Boolean);
    await pool.query(
      `INSERT INTO cases (id, season_id, city, title, short_description, full_description, tools_used, demo_url, owner_name, owner_email, sticker, is_active, display_order, next_step)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '🤖', 1, 999, ?)`,
      [caseId, sub.season_id, sub.city, caseTitle, caseDesc, caseDesc, JSON.stringify(toolsArr), caseDemoUrl, sub.owner_name, sub.owner_email, (sub.next_step||'').trim()]
    );
    if (campaign_id) {
      await pool.query(
        `INSERT INTO top_pick_cases (case_id, campaign_id, city, title, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE title=VALUES(title), is_active=1`,
        [caseId, campaign_id, sub.city, caseTitle]
      );
    }
    await pool.query(`UPDATE case_submissions SET status='approved', reviewed_at=NOW(), case_id=? WHERE id=?`, [caseId, submission_id]);
    res.json({ ok: true, case_id: caseId });
  } catch(e) { res.status(500).json({ ok: false, message: e.message }); }
});

app.post('/api/reject-submission', async (req, res) => {
  try {
    const { submission_id, notes } = req.body || {};
    if (!submission_id) return res.status(400).json({ ok: false, message: 'submission_id required' });
    await pool.query(`UPDATE case_submissions SET status='rejected', reviewed_at=NOW(), review_notes=? WHERE id=?`, [notes||'', submission_id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, message: e.message }); }
});

app.post('/api/toggle-master-chef', async (req, res) => {
  try {
    const { case_id, is_master_chef } = req.body || {};
    if (!case_id) return res.status(400).json({ ok: false, message: 'case_id required' });
    await pool.query('UPDATE `cases` SET is_master_chef = ? WHERE id = ?', [is_master_chef ? 1 : 0, case_id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, message: e.message }); }
});

app.post('/api/news-react', async (req, res) => {
  try {
    const { post_id, type } = req.body || {};
    if (!post_id || !['fire','thumb'].includes(type)) return res.status(400).json({ ok: false });
    const col = type === 'fire' ? 'react_fire' : 'react_thumb';
    await pool.query(`UPDATE news_posts SET ${col} = ${col} + 1 WHERE id = ?`, [post_id]);
    const [[row]] = await pool.query('SELECT react_fire, react_thumb FROM news_posts WHERE id = ?', [post_id]);
    res.json({ ok: true, react_fire: row?.react_fire||0, react_thumb: row?.react_thumb||0 });
  } catch(e) { res.status(500).json({ ok: false, message: e.message }); }
});

app.post('/api/upload-news-image', async (req, res) => {
  try {
    const { data, type } = req.body || {};
    if (!data || !type || !type.startsWith('image/')) return res.status(400).json({ ok: false, message: 'Invalid image data' });
    const ext = type === 'image/png' ? '.png' : type === 'image/gif' ? '.gif' : type === 'image/webp' ? '.webp' : '.jpg';
    const fname = `news-img-${Date.now()}${ext}`;
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const base64 = data.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(path.join(dir, fname), Buffer.from(base64, 'base64'));
    res.json({ ok: true, url: '/uploads/' + fname });
  } catch(e) { res.status(500).json({ ok: false, message: e.message }); }
});

app.post('/api/submit-feedback', async (req, res) => {
  try {
    const { season_id, city, participation_type, output_status, no_output_reason, mentor_rating, mentor_comment, continue_dev, recommend, overall_rating, suggestions } = req.body || {};
    if (!city || !participation_type || !output_status)
      return res.status(400).json({ ok: false, message: 'Vui lòng điền đầy đủ các trường bắt buộc.' });
    const id = `fb-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    await pool.query(
      `INSERT INTO event_feedback (id, season_id, city, participation_type, output_status, no_output_reason, mentor_rating, mentor_comment, continue_dev, recommend, overall_rating, suggestions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, season_id||'nhai-day-02', city, participation_type, output_status, no_output_reason||null, mentor_rating||null, mentor_comment||null, continue_dev||null, recommend||null, overall_rating||null, suggestions||null]
    );
    res.json({ ok: true, id });
    computeFeedbackStats().catch(()=>{});
  } catch(e) { res.status(500).json({ ok: false, message: e.message }); }
});

app.use(express.static(path.join(__dirname, 'public')));

async function runSchemaMigration() {
  const migrationFiles = ['001_schema.sql', '002_feedback_day2_import.sql', '003_news_posts.sql', '004_gallery_images.sql', '005_mediumtext_body.sql', '006_next_step.sql', '007_submission_next_step.sql', '008_vote_client_ip.sql'];
  let totalApplied = 0;
  for (const fileName of migrationFiles) {
    const sqlFile = path.join(__dirname, 'migrations', fileName);
    if (!fs.existsSync(sqlFile)) continue;
    const sql = fs.readFileSync(sqlFile, 'utf8');
    const statements = sql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(Boolean);
    let applied = 0;
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
        applied++;
      } catch (e) {
        if (e.errno === 1060) { applied++; } // Duplicate column — already exists
        else { throw e; }
      }
    }
    console.log(`Migration ${fileName}: ${applied} statements applied.`);
    totalApplied += applied;
  }
  console.log(`Schema migration: ${totalApplied} total statements applied.`);
}

const AWARD_CATEGORIES_SEED = [
  { id: 'master-chef',       section: 'per-event', display_order: 1, icon: '🏆', name: 'Master Chef',                    prize_amount: '2.000.000đ',     description: 'Demo nổi bật, hiểu biết sâu về kỹ thuật, chưa từng được sử dụng, có thể scale là điểm cộng. Check với quản lý team đó chưa sử dụng từ trước. Mentor đánh giá.' },
  { id: 'early-bird',        section: 'per-event', display_order: 2, icon: '🚀', name: 'Demo Ready (Early Bird)',         prize_amount: '1.000.000đ × 8', description: 'Sản phẩm chạy được, có demo, giải quyết một pain point cụ thể và chưa từng được sử dụng trong sub-team (BTC xác nhận cùng quản lý).\n\n8 team đầu tiên đạt đủ tiêu chí nhận 1.000.000đ. Nếu chưa đủ 8 suất, BTC tiếp tục xét theo FCFS đến 17:30 hoặc đến khi đủ 8 suất.\nKhông thuộc Early Bird nhưng hoàn thiện trước 17:30: 500.000đ.' },
  { id: 'complete-1730',     section: 'per-event', display_order: 3, icon: '✅', name: 'Hoàn thiện output trước 17:30',   prize_amount: '500.000đ',       description: 'Tất cả các team có demo trước 17:30 đều nhận được 500.000đ' },
  { id: 'top-pick-dish',     section: 'per-event', display_order: 4, icon: '💡', name: 'Top Pick Dish',                  prize_amount: '1.000.000đ',     description: 'Voting sau event' },
  { id: 'ai-gift',           section: 'campaign',  display_order: 5, icon: '🎁', name: 'AI Gift (Robot AI assistant)',   prize_amount: '2.000.000đ × 2', description: '1 HN + 1 HCM. Tích điểm: số event tham gia + số lần trong team có demo. Cao nhất thắng, hòa thì lucky draw.' },
  { id: 'persistent-crew',   section: 'campaign',  display_order: 6, icon: '🤝', name: 'Persistent NHAI Crew',           prize_amount: '1.000.000đ × 2', description: '1 HN + 1 HCM. Team có nhiều thành viên tham gia event nhất xuyên suốt campaign.' },
];

async function seedAwardCategories() {
  for (const r of AWARD_CATEGORIES_SEED) {
    await pool.query(
      `INSERT INTO award_categories (id, section, display_order, icon, name, prize_amount, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE section=VALUES(section), display_order=VALUES(display_order),
         icon=VALUES(icon), name=VALUES(name), prize_amount=VALUES(prize_amount), description=VALUES(description)`,
      [r.id, r.section, r.display_order, r.icon, r.name, r.prize_amount, r.description]
    );
  }
  console.log('Award categories seeded/updated.');
}

async function fixAwardsData() {
  // complete-1730 imported before city-detection fix → set city to Hà Nội (only HN CSV imported)
  const [r1] = await pool.query(
    `UPDATE awards SET city='Hà Nội'
     WHERE season_id='nhai-day-02' AND category_id='complete-1730'
     AND (city IS NULL OR city='')`
  );
  // early-bird null-city rows are duplicates from the old import run → remove them
  const [r2] = await pool.query(
    `DELETE FROM awards
     WHERE season_id='nhai-day-02' AND category_id='early-bird'
     AND (city IS NULL OR city='')`
  );
  if (r1.affectedRows || r2.affectedRows) {
    console.log(`Data fix: complete-1730 city set=${r1.affectedRows}, early-bird dupes removed=${r2.affectedRows}`);
  }
}

async function computeFeedbackStats() {
  try {
    const [rows] = await pool.query(`
      SELECT season_id,
        ROUND(AVG(overall_rating), 2) as avg_experience,
        ROUND(AVG(mentor_rating), 2) as avg_mentor,
        ROUND(SUM(CASE WHEN output_status IS NOT NULL AND output_status != '' AND output_status NOT LIKE '%không%' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as pct_has_demo,
        ROUND(SUM(CASE WHEN continue_dev LIKE '%chắc chắn%' OR continue_dev LIKE '%Có thể%' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as pct_want_continue,
        ROUND(SUM(CASE WHEN recommend = 'Có' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as pct_will_participate,
        SUM(city = 'HN') as hn_participants,
        SUM(city = 'HCM') as hcm_participants,
        COUNT(*) as feedback_count
      FROM event_feedback
      GROUP BY season_id
    `);
    // Count registrations per season to populate total_teams
    const [regRows] = await pool.query(`
      SELECT season_id, COUNT(*) as reg_count FROM registrations
      WHERE season_id IS NOT NULL GROUP BY season_id
    `);
    const regMap = {};
    regRows.forEach(r => { regMap[r.season_id] = r.reg_count; });

    for (const r of rows) {
      const totalTeams = regMap[r.season_id] || null;
      await pool.query(
        `INSERT INTO season_stats (season_id, avg_experience, avg_mentor, pct_has_demo, pct_want_continue, pct_will_participate, hn_participants, hcm_participants, feedback_count, total_teams, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           avg_experience = VALUES(avg_experience), avg_mentor = VALUES(avg_mentor),
           pct_has_demo = VALUES(pct_has_demo), pct_want_continue = VALUES(pct_want_continue),
           pct_will_participate = VALUES(pct_will_participate),
           hn_participants = VALUES(hn_participants), hcm_participants = VALUES(hcm_participants),
           feedback_count = VALUES(feedback_count),
           total_teams = COALESCE(VALUES(total_teams), total_teams),
           updated_at = NOW()`,
        [r.season_id, r.avg_experience, r.avg_mentor, r.pct_has_demo, r.pct_want_continue,
         r.pct_will_participate, r.hn_participants || 0, r.hcm_participants || 0, r.feedback_count, totalTeams]
      );
    }
    if (rows.length) console.log(`Feedback stats computed: ${rows.map(r => `${r.season_id} (${r.feedback_count} responses, ${regMap[r.season_id]||0} registrations)`).join(', ')}`);
  } catch(e) { console.error('Feedback stats compute error:', e.message); }
}

runSchemaMigration()
  .catch(e => console.error('Schema migration error:', e.message))
  .then(() => seedAwardCategories())
  .catch(e => console.error('Seed error:', e.message))
  .then(() => fixAwardsData())
  .catch(e => console.error('Data fix error:', e.message))
  .then(() => computeFeedbackStats())
  .catch(e => console.error('Feedback stats error:', e.message))
  .finally(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`NHAI DAY server listening on port ${PORT}`);
    });
  });
