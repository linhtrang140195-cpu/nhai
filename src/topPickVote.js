const crypto = require('crypto');
const pool = require('./db');

// A script that opens a fresh identity per vote passes every per-device check: each
// id casts one ballot and never returns, so nothing looks over the limit. What gives
// it away is cadence — 28 ballots arrived 5.0s apart (sd 1.4s) while real voting that
// week averaged 48s apart with a spread of 111s. Counting ballots per IP cannot
// separate a script from an office full of colleagues voting at once; the spread can.
// Held in memory: a restart clears it, and the audit page still catches what slips by.
const RECENT_WINDOW_MS = 5 * 60 * 1000;
const RECENT_MIN_SAMPLES = 8;
const RECENT_MAX_SD_SECONDS = 3;
const RECENT_MAX_MEDIAN_GAP_SECONDS = 12;
const recentVotesByIp = new Map();

function looksScripted(clientIp, now) {
  const stamps = (recentVotesByIp.get(clientIp) || []).filter(t => now - t < RECENT_WINDOW_MS);
  if (stamps.length < RECENT_MIN_SAMPLES) return null;

  const gaps = [];
  for (let i = 1; i < stamps.length; i++) gaps.push((stamps[i] - stamps[i - 1]) / 1000);
  const median = gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
  if (median > RECENT_MAX_MEDIAN_GAP_SECONDS) return null;

  const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  const sd = Math.sqrt(gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length);
  if (sd > RECENT_MAX_SD_SECONDS) return null;

  return { samples: stamps.length, median: Math.round(median * 10) / 10, sd: Math.round(sd * 10) / 10 };
}

function recordVote(clientIp, now) {
  if (!clientIp) return;
  const stamps = (recentVotesByIp.get(clientIp) || []).filter(t => now - t < RECENT_WINDOW_MS);
  stamps.push(now);
  recentVotesByIp.set(clientIp, stamps);
  if (recentVotesByIp.size > 5000) {
    for (const [ip, ts] of recentVotesByIp) {
      if (!ts.some(t => now - t < RECENT_WINDOW_MS)) recentVotesByIp.delete(ip);
    }
  }
}

async function readCampaign(campaignId) {
  const [rows] = await pool.query(
    'SELECT id, name, max_votes_per_device, is_active, opens_at, closes_at FROM top_pick_campaigns WHERE id = ?',
    [campaignId]
  );
  return rows[0] || null;
}

// Campaign times are wall-clock Vietnam time — that is what the admin form asks for
// and what the organisers mean. The container runs in UTC, so letting Date assume the
// server's zone read "23:59" as 23:59 UTC and kept voting open until 06:59 the next
// morning in Hanoi, seven hours past the announced close.
function vnTime(value) {
  if (!value) return null;
  const s = String(value).trim().replace(' ', 'T');
  return new Date(/(?:[+-]\d\d:?\d\d|Z)$/.test(s) ? s : `${s}+07:00`);
}

function getCampaignBlockReason(campaign) {
  if (!campaign.is_active) return 'Voting has already closed.';
  const now = new Date();
  const opens = vnTime(campaign.opens_at);
  const closes = vnTime(campaign.closes_at);
  if (opens && opens > now) return 'Voting has not opened yet.';
  if (closes && closes < now) return 'Voting has already closed.';
  return '';
}

async function buildSnapshot(campaignId, deviceId) {
  const [cases] = await pool.query(
    'SELECT case_id, city FROM top_pick_cases WHERE campaign_id = ? AND is_active = 1',
    [campaignId]
  );

  const counts = {};
  const caseCityMap = {};
  cases.forEach(row => {
    counts[row.case_id] = 0;
    caseCityMap[row.case_id] = row.city;
  });

  const [votes] = await pool.query(
    'SELECT case_id FROM top_pick_votes WHERE campaign_id = ?',
    [campaignId]
  );
  votes.forEach(row => {
    counts[row.case_id] = (counts[row.case_id] || 0) + 1;
  });

  let deviceVotes = [];
  const deviceVotesByCity = { HN: [], HCM: [] };
  if (deviceId) {
    const [mine] = await pool.query(
      'SELECT case_id FROM top_pick_votes WHERE campaign_id = ? AND device_id = ?',
      [campaignId, deviceId]
    );
    deviceVotes = mine.map(row => row.case_id);
    deviceVotes.forEach(id => {
      const city = caseCityMap[id];
      if (city === 'HN' || city === 'HCM') deviceVotesByCity[city].push(id);
    });
  }

  return { counts, deviceVotes, deviceVotesByCity };
}

async function castVote(campaignId, caseId, deviceId, maxVotes, clientIp) {
  const [caseRows] = await pool.query(
    'SELECT case_id, city FROM top_pick_cases WHERE campaign_id = ? AND case_id = ? AND is_active = 1',
    [campaignId, caseId]
  );
  const voteCase = caseRows[0];
  if (!voteCase) {
    return { ok: false, status: 404, message: 'Case does not exist or is inactive.' };
  }

  const [cityVotes] = await pool.query(
    `SELECT v.case_id FROM top_pick_votes v
     JOIN top_pick_cases c ON c.case_id = v.case_id
     WHERE v.campaign_id = ? AND v.device_id = ? AND c.city = ?`,
    [campaignId, deviceId, voteCase.city]
  );
  if (cityVotes.length >= maxVotes) {
    const cityLabel = voteCase.city === 'HCM' ? 'TP.HCM' : 'Hà Nội';
    return { ok: false, status: 409, message: `This device has used all ${maxVotes} votes for ${cityLabel}.` };
  }

  if (clientIp) {
    const now = Date.now();
    const scripted = looksScripted(clientIp, now);
    if (scripted) {
      console.log(`vote rejected as scripted: ip=${clientIp} samples=${scripted.samples} median=${scripted.median}s sd=${scripted.sd}s case=${caseId}`);
      return { ok: false, status: 429, message: 'Quá nhiều lượt bình chọn liên tiếp từ mạng của bạn. Vui lòng thử lại sau vài phút.' };
    }
  }

  try {
    await pool.query(
      'INSERT INTO top_pick_votes (id, campaign_id, case_id, device_id, client_ip, city) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), campaignId, caseId, deviceId, clientIp || null, voteCase.city || null]
    );
  } catch (e) {
    if (e.errno === 1062) {
      return { ok: false, status: 409, message: 'This device already voted for this case.' };
    }
    throw e;
  }

  recordVote(clientIp, Date.now());
  return { ok: true, status: 200 };
}

async function removeVote(campaignId, caseId, deviceId) {
  const [rows] = await pool.query(
    'SELECT id FROM top_pick_votes WHERE campaign_id = ? AND case_id = ? AND device_id = ?',
    [campaignId, caseId, deviceId]
  );
  const existingVote = rows[0];
  if (!existingVote) {
    return { ok: false, status: 404, message: 'This device has not voted for this case yet.' };
  }
  await pool.query('DELETE FROM top_pick_votes WHERE id = ?', [existingVote.id]);
  return { ok: true, status: 200 };
}

module.exports = async function topPickVote(req, res) {
  try {
    if (req.method === 'GET') {
      const campaignId = String(req.query.campaign_id || '');
      const deviceId = String(req.query.device_id || '');
      if (!campaignId) return res.status(400).json({ ok: false, message: 'campaign_id is required.' });

      const campaign = await readCampaign(campaignId);
      if (!campaign) return res.status(404).json({ ok: false, message: 'Campaign not found.' });

      const snapshot = await buildSnapshot(campaignId, deviceId);
      return res.json({
        ok: true,
        campaignId,
        votingClosed: !!getCampaignBlockReason(campaign),
        maxVotes: campaign.max_votes_per_device,
        maxVotesPerCity: campaign.max_votes_per_device,
        ...snapshot
      });
    }

    if (req.method === 'POST') {
      const campaignId = String(req.body?.campaign_id || '').trim();
      const caseId = String(req.body?.case_id || '').trim();
      const deviceId = String(req.body?.device_id || '').trim();
      if (!campaignId || !caseId || !deviceId) {
        return res.status(400).json({ ok: false, message: 'campaign_id, case_id and device_id are required.' });
      }

      const campaign = await readCampaign(campaignId);
      if (!campaign) return res.status(404).json({ ok: false, message: 'Campaign not found.' });
      const blockReason = getCampaignBlockReason(campaign);
      if (blockReason) return res.status(409).json({ ok: false, message: blockReason });

      const clientIp = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
      const result = await castVote(campaignId, caseId, deviceId, campaign.max_votes_per_device, clientIp);
      if (!result.ok) return res.status(result.status).json(result);

      const snapshot = await buildSnapshot(campaignId, deviceId);
      return res.json({
        ok: true, campaignId,
        maxVotes: campaign.max_votes_per_device,
        maxVotesPerCity: campaign.max_votes_per_device,
        ...snapshot
      });
    }

    if (req.method === 'DELETE') {
      const campaignId = String(req.body?.campaign_id || '').trim();
      const caseId = String(req.body?.case_id || '').trim();
      const deviceId = String(req.body?.device_id || '').trim();
      if (!campaignId || !caseId || !deviceId) {
        return res.status(400).json({ ok: false, message: 'campaign_id, case_id and device_id are required.' });
      }

      const campaign = await readCampaign(campaignId);
      if (!campaign) return res.status(404).json({ ok: false, message: 'Campaign not found.' });
      const blockReason = getCampaignBlockReason(campaign);
      if (blockReason) return res.status(409).json({ ok: false, message: blockReason });

      const result = await removeVote(campaignId, caseId, deviceId);
      if (!result.ok) return res.status(result.status).json(result);

      const snapshot = await buildSnapshot(campaignId, deviceId);
      return res.json({
        ok: true, campaignId,
        maxVotes: campaign.max_votes_per_device,
        maxVotesPerCity: campaign.max_votes_per_device,
        ...snapshot
      });
    }

    return res.status(405).json({ ok: false, message: 'Method not allowed.' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error instanceof Error ? error.message : 'Unexpected server error.' });
  }
};
