const crypto = require('crypto');
const pool = require('./db');

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

async function upsertSession(payload) {
  const sessionId = String(payload.session_id || '').trim();
  const deviceId = String(payload.device_id || '').trim();
  if (!sessionId || !deviceId) {
    return { ok: false, status: 400, message: 'session_id and device_id are required.' };
  }

  const patch = {
    session_id: sessionId,
    device_id: deviceId,
    last_event_at: nowSql()
  };
  if (payload.path) patch.entry_path = String(payload.path);
  if (payload.title) patch.page_title = String(payload.title);
  if (payload.user_agent) patch.user_agent = String(payload.user_agent);
  if (payload.started_at) patch.started_at = nowSql();
  if (payload.ended_at) patch.ended_at = nowSql();
  if (payload.duration_seconds != null) patch.duration_seconds = Number(payload.duration_seconds) || 0;

  const cols = Object.keys(patch);
  const placeholders = cols.map(() => '?').join(', ');
  const updateCols = cols.filter(c => c !== 'session_id');
  const updateSql = updateCols.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');

  const sql = `INSERT INTO page_sessions (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})
               ON DUPLICATE KEY UPDATE ${updateSql}`;
  await pool.query(sql, cols.map(c => patch[c]));

  return { ok: true, status: 200 };
}

module.exports = async function siteAnalytics(req, res) {
  try {
    const body = req.body || {};
    const type = String(body.type || '').trim();
    const sessionId = String(body.session_id || '').trim();
    const deviceId = String(body.device_id || '').trim();

    if (!type || !sessionId || !deviceId) {
      return res.status(400).json({ ok: false, message: 'type, session_id and device_id are required.' });
    }

    if (type === 'session_start') {
      const result = await upsertSession({
        session_id: sessionId,
        device_id: deviceId,
        path: body.path,
        title: body.title,
        user_agent: body.user_agent,
        started_at: true
      });
      return res.status(result.status).json(result);
    }

    if (type === 'session_end') {
      const result = await upsertSession({
        session_id: sessionId,
        device_id: deviceId,
        path: body.path,
        ended_at: true,
        duration_seconds: body.duration_seconds
      });
      return res.status(result.status).json(result);
    }

    if (type === 'event') {
      await upsertSession({ session_id: sessionId, device_id: deviceId });

      await pool.query(
        `INSERT INTO page_events (id, session_id, device_id, event_name, event_value, meta) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          sessionId,
          deviceId,
          String(body.event_name || '').trim(),
          body.event_value ? String(body.event_value) : '',
          JSON.stringify(body.meta && typeof body.meta === 'object' ? body.meta : {})
        ]
      );
      return res.status(200).json({ ok: true, status: 200 });
    }

    return res.status(400).json({ ok: false, message: 'Unsupported analytics event type.' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
};
