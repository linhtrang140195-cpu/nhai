const crypto = require('crypto');
const pool = require('./db');

async function readCampaign(campaignId) {
  const [rows] = await pool.query(
    'SELECT id, name, max_votes_per_device, is_active, opens_at, closes_at FROM top_pick_campaigns WHERE id = ?',
    [campaignId]
  );
  return rows[0] || null;
}

function getCampaignBlockReason(campaign) {
  if (!campaign.is_active) return 'Voting has already closed.';
  const now = new Date();
  if (campaign.opens_at && new Date(campaign.opens_at) > now) return 'Voting has not opened yet.';
  if (campaign.closes_at && new Date(campaign.closes_at) < now) return 'Voting has already closed.';
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

async function castVote(campaignId, caseId, deviceId, maxVotes) {
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

  try {
    await pool.query(
      'INSERT INTO top_pick_votes (id, campaign_id, case_id, device_id) VALUES (?, ?, ?, ?)',
      [crypto.randomUUID(), campaignId, caseId, deviceId]
    );
  } catch (e) {
    if (e.errno === 1062) {
      return { ok: false, status: 409, message: 'This device already voted for this case.' };
    }
    throw e;
  }

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

      const result = await castVote(campaignId, caseId, deviceId, campaign.max_votes_per_device);
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
