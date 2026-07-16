/**
 * NHAI DAY — Website Config & Integration
 * Paste vào cuối file HTML website (trước </body>):
 * <script src="nhai-config.js"></script>
 */

(function() {
  'use strict';

  const SB_URL = 'https://xmtxdfeengpbapgudprx.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdHhkZmVlbmdwYmFwZ3VkcHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDg0MTAsImV4cCI6MjA5OTE4NDQxMH0.NNePCWoFDuRWmeDI01FK5XOF9IbQq4E3H6wJEju-tRY';
  const SHEET_WEBHOOK = 'https://script.google.com/a/macros/garena.vn/s/AKfycbxCy-zbv5IISskZZdT0IAKXNZkiGDFA8QsCRvxhzxGK0zDavEtDajfs-40H9bSTNKo/exec';

  // ===== SUPABASE HELPERS =====
  async function sb(path) {
    try {
      const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) { console.error('SB fetch error:', e); return []; }
  }

  async function sbInsert(table, data) {
    try {
      const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json', Prefer: 'return=representation'
        },
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch (e) { console.error('SB insert error:', e); return false; }
  }

  // ===== CONFIG & DATA =====
  let siteConfig = {};
  let seasonStats = [];
  let mentors = [];
  let events = [];
  let faqs = [];
  let registrationCount = 0;

  async function loadConfig() {
    const [cfg, ss, m, e, f, regs] = await Promise.all([
      sb('site_config'),
      sb('season_stats?order=season_id'),
      sb('mentors?is_active=eq.true&order=display_order'),
      sb('events?order=display_order'),
      sb('faqs?is_active=eq.true&order=display_order'),
      sb('registrations?select=season_id,member2_name,member3_name&limit=5000')
    ]);

    cfg.forEach(row => { siteConfig[row.key] = row.value; });
    seasonStats = ss || [];
    mentors = m || [];
    events = e || [];
    faqs = f || [];

    // headcount: mỗi registration + TV2 + TV3
    const allRegs = regs || [];
    registrationCount = allRegs.length;
    const headcountBySeason = {};
    allRegs.forEach(r => {
      if (!headcountBySeason[r.season_id]) headcountBySeason[r.season_id] = 0;
      headcountBySeason[r.season_id]++;
      if (r.member2_name && r.member2_name.trim()) headcountBySeason[r.season_id]++;
      if (r.member3_name && r.member3_name.trim()) headcountBySeason[r.season_id]++;
    });

    // Expose current season cho form đăng ký trong index.html
    window.nhaiCurrentSeason = siteConfig.current_season || 'nhai-day-02';

    applyConfig();
    updateMentors();
    updateEvents();
    updateFAQ();
    updateRegistrationCount();
    updateSeasonStats();
    updateEditionStats(headcountBySeason);
    updateHeroTeamRank(allRegs);
  }

  // ===== 6b. HERO TOP TEAM RANK (compact pills dưới nút đăng ký) =====
  function updateHeroTeamRank(allRegs) {
    const el = document.getElementById('heroTeamRank');
    if (!el) return;
    const curSeason = window.nhaiCurrentSeason || 'nhai-day-02';
    const cur = allRegs.filter(r => r.season_id === curSeason);
    if (!cur.length) return;
    const tc = {};
    cur.forEach(r => {
      const t = r.team || 'Khác';
      tc[t] = (tc[t] || 0) + 1;
      if (r.member2_name && r.member2_name.trim()) { const t2 = r.member2_team || t; tc[t2] = (tc[t2] || 0) + 1; }
      if (r.member3_name && r.member3_name.trim()) { const t3 = r.member3_team || t; tc[t3] = (tc[t3] || 0) + 1; }
    });
    const top3 = Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const medals = ['🥇', '🥈', '🥉'];
    el.innerHTML =
      '<span style="font-size:13px;color:rgba(255,255,255,0.38);white-space:nowrap">Top team mùa này:</span>' +
      top3.map(([t, c], i) =>
        `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:4px 12px;font-size:13px;color:rgba(255,255,255,0.82)">${medals[i]} <b style="font-weight:600">${t}</b> <span style="color:rgba(255,255,255,0.42)">${c} người</span></span>`
      ).join('');
    el.style.display = 'flex';
  }

  // ===== 6c. UPDATE EDITION STATS (Results section per-season) =====
  const SEASON_ED = ['nhai-day-01','nhai-day-02','nhai-day-03','nhai-day-04'];
  function updateEditionStats(headcountBySeason) {
    SEASON_ED.forEach((sid, i) => {
      const ss = seasonStats.find(s => s.season_id === sid);
      const hc = headcountBySeason[sid];

      const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.textContent = val; };
      if (hc) set(`ek-p-${i}`, hc);
      if (ss) {
        if (ss.total_teams)      set(`ek-t-${i}`,  ss.total_teams);
        if (ss.avg_experience)   set(`ek-xp-${i}`, ss.avg_experience + '★');
        if (ss.avg_mentor)       set(`ek-mn-${i}`, ss.avg_mentor + '★');
        if (ss.pct_want_continue) set(`ek-ct-${i}`, ss.pct_want_continue + '%');
        if (ss.pct_has_demo)     set(`ek-dm-${i}`, ss.pct_has_demo + '%');
      }
    });
  }

  // ===== 1. APPLY SITE CONFIG (toggles) =====
  function applyConfig() {
    const toggleMap = {
      'show_winner_banner': '.winner-banner, .top-pick-winner',
      'show_voting': '.voting-section, .top-pick-section',
      'show_vote_button': '.vote-btn, .heart-btn',
      'show_register_button': '.register-btn, .cta-register',
      'show_btc_section': '.btc-section',
      'show_countdown': '.countdown-section',
      'show_results': '.results-section',
      'show_announcement': '.announcement-bar',
      'show_top_pick_dish': '.top-pick-dish-section',
    };

    Object.entries(toggleMap).forEach(([key, selector]) => {
      const els = document.querySelectorAll(selector);
      const show = siteConfig[key];
      els.forEach(el => {
        if (show) { el.style.removeProperty('display'); el.classList.remove('hidden'); }
        else { el.style.display = 'none'; el.classList.add('hidden'); }
      });
    });

    // Announcement text
    const annText = siteConfig.announcement_text;
    if (annText) {
      const annEls = document.querySelectorAll('.announcement-text, .ann-text');
      annEls.forEach(el => { el.textContent = typeof annText === 'string' ? annText : ''; });
    }
  }

  // ===== 2. UPDATE MENTORS =====
  function updateMentors() {
    const container = document.querySelector('#mentorGrid, .mentors-grid, .mentor-list, #mentors-container');
    if (!container || !mentors.length) return;

    const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    container.innerHTML = mentors.map((m, i) => `
      <div class="mentor-card">
        <img class="mentor-avatar" id="mav${i}"
          src="${esc(m.avatar_url || '')}"
          alt="${esc(m.name)}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
          ${m.avatar_url ? '' : 'style="display:none"'}>
        <div class="mentor-avatar" style="display:${m.avatar_url ? 'none' : 'flex'};align-items:center;justify-content:center;font-size:24px;font-weight:600;color:#f2b933;background:rgba(242,185,51,.15)">
          ${esc((m.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2))}
        </div>
        <div class="mentor-name">${esc(m.name || 'Tên mentor')}</div>
        <div class="mentor-role">${esc(m.role || 'Chức danh')}</div>
        ${m.tag ? `<div class="mentor-tag">${esc(m.tag)}</div>` : ''}
      </div>
    `).join('');

    // Sync vào localStorage để page's own JS không overwrite lại
    try {
      const mapped = mentors.map(m => ({
        name: m.name, role: m.role, tag: m.tag,
        avatar: m.avatar_url || '', bio: m.bio || ''
      }));
      localStorage.setItem('nd_mentors3', JSON.stringify(mapped));
    } catch(e) {}
  }

  // ===== 3. UPDATE EVENTS / ROADMAP =====
  function updateEvents() {
    const container = document.querySelector('.roadmap-grid, .events-timeline, #events-container');
    if (!container || !events.length) return;

    container.innerHTML = events.map(ev => {
      const statusMap = {
        completed: { label: 'Đã hoàn thành', color: '#14B8A6', dot: '●' },
        upcoming: { label: 'Sắp tới', color: '#F5C842', dot: '○' },
        voting_open: { label: 'Đang vote', color: '#EC4899', dot: '●' },
        voting_closed: { label: 'Đã đóng vote', color: '#8B92A5', dot: '●' },
        active: { label: 'Đang diễn ra', color: '#14B8A6', dot: '●' },
      };
      const s = statusMap[ev.status] || statusMap.upcoming;
      return `
        <div class="event-card" style="padding:16px;border:1px solid rgba(255,255,255,0.1);border-radius:12px;min-width:200px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <span style="color:${s.color};font-size:10px">${s.dot}</span>
            <span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:${s.color};font-weight:600">${s.label}</span>
          </div>
          <div style="font-weight:600;font-size:15px;margin-bottom:4px">${ev.name}</div>
          <div style="color:#8B92A5;font-size:12px">${ev.date || ''}</div>
          ${ev.status === 'completed' && ev.recap_url
            ? `<a href="${ev.recap_url}" style="display:inline-block;margin-top:8px;font-size:12px;color:#F5C842;text-decoration:none">Xem recap →</a>`
            : ev.status === 'upcoming'
              ? `<a href="#register" style="display:inline-block;margin-top:8px;font-size:12px;color:#F5C842;text-decoration:none">Đăng ký →</a>`
              : ''
          }
        </div>
      `;
    }).join('');
  }

  // ===== 4. UPDATE FAQ =====
  function updateFAQ() {
    const container = document.querySelector('.faq-list, #faq-container');
    if (!container || !faqs.length) return;

    container.innerHTML = faqs.map((f, i) => `
      <div class="faq-item" style="border-bottom:1px solid rgba(255,255,255,0.06);padding:16px 0">
        <div class="faq-q" onclick="this.parentElement.classList.toggle('open')"
          style="font-weight:600;font-size:15px;cursor:pointer;display:flex;justify-content:space-between;align-items:center">
          ${f.question}
          <span style="font-size:18px;transition:transform 0.2s">+</span>
        </div>
        <div class="faq-a" style="display:none;margin-top:10px;color:#C4CBD9;font-size:14px;line-height:1.7">${f.answer}</div>
      </div>
    `).join('');

    // Toggle FAQ
    container.querySelectorAll('.faq-item').forEach(item => {
      item.querySelector('.faq-q').addEventListener('click', () => {
        const a = item.querySelector('.faq-a');
        const icon = item.querySelector('.faq-q span');
        if (a.style.display === 'none') {
          a.style.display = 'block'; icon.textContent = '−';
        } else {
          a.style.display = 'none'; icon.textContent = '+';
        }
      });
    });
  }

  // ===== 5. UPDATE REGISTRATION COUNT =====
  function updateRegistrationCount() {
    const offset = parseInt(siteConfig.display_count_offset) || 0;
    const total = registrationCount + offset;
    // #sCare = element "lượt quan tâm" trên website
    const els = document.querySelectorAll('.registration-count, .interest-count, #reg-count, #sCare');
    els.forEach(el => { el.textContent = total; });
  }

  // ===== 6. UPDATE SEASON STATS =====
  function updateSeasonStats() {
    const currentSeason = siteConfig.current_season || 'nhai-day-01';
    const ss = seasonStats.find(s => s.season_id === currentSeason);
    if (!ss) return;

    const mapping = {
      '.stat-participants, #stat-participants': ss.total_participants,
      '.stat-teams, #stat-teams': ss.total_teams,
      '.stat-experience, #stat-experience': ss.avg_experience ? ss.avg_experience + '★' : '',
      '.stat-mentor, #stat-mentor': ss.avg_mentor ? ss.avg_mentor + '★' : '',
      '.stat-continue, #stat-continue': ss.pct_want_continue ? ss.pct_want_continue + '%' : '',
      '.stat-demo, #stat-demo': ss.pct_has_demo ? ss.pct_has_demo + '%' : '',
    };

    Object.entries(mapping).forEach(([selector, value]) => {
      document.querySelectorAll(selector).forEach(el => {
        if (value) el.textContent = value;
      });
    });
  }

  // ===== 7. REGISTRATION FORM (3 steps) =====
  function initRegistrationForm() {
    const formContainer = document.querySelector('#registration-form, .registration-form');
    if (!formContainer) return;

    const currentSeason = siteConfig.current_season || 'nhai-day-01';
    const teams = ['AOV / DF','FF (Free Fire)','FCO / FCM','CODE','CS','People Team','Admin game','New Game','Khác'];
    const cities = ['Hà Nội','Hồ Chí Minh'];

    formContainer.innerHTML = `
    <div id="regForm" style="max-width:500px;margin:0 auto">
      <div id="regStep" style="font-size:12px;color:#8B92A5;margin-bottom:8px">Bước 1/3</div>
      <div style="display:flex;gap:0;margin-bottom:20px">
        <div id="prog1" style="flex:1;height:3px;background:#F5C842;border-radius:2px"></div>
        <div id="prog2" style="flex:1;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;margin-left:4px"></div>
        <div id="prog3" style="flex:1;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;margin-left:4px"></div>
      </div>

      <!-- Step 1 -->
      <div id="step1">
        <h3 style="font-size:18px;font-weight:600;margin-bottom:4px">Thông tin cá nhân</h3>
        <p style="color:#8B92A5;font-size:13px;margin-bottom:16px">Điền thông tin để đăng ký tham gia NHAI DAY</p>
        <label style="font-size:12px;color:#8B92A5;display:block;margin-bottom:4px">Họ và tên *</label>
        <input type="text" id="r_name" placeholder="Nguyễn Văn A" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:14px;margin-bottom:12px;outline:none">
        <label style="font-size:12px;color:#8B92A5;display:block;margin-bottom:4px">Email công ty *</label>
        <input type="email" id="r_email" placeholder="ten@garena.vn" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:14px;margin-bottom:12px;outline:none">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <label style="font-size:12px;color:#8B92A5;display:block;margin-bottom:4px">Tham gia tại *</label>
            <select id="r_city" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:14px;margin-bottom:12px">
              <option value="">Chọn...</option>
              ${cities.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:12px;color:#8B92A5;display:block;margin-bottom:4px">Thuộc team *</label>
            <select id="r_team" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:14px;margin-bottom:12px">
              <option value="">Chọn...</option>
              ${teams.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
        </div>
        <label style="font-size:12px;color:#8B92A5;display:block;margin-bottom:4px">
          Mức độ sử dụng AI hiện tại *
          <a href="https://ai-adoption.garena.vn/sample" target="_blank" style="color:#F5C842;text-decoration:none;font-size:11px;margin-left:4px">tham chiếu →</a>
        </label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px" id="aiLevelGrid">
          ${['L0|Chưa dùng AI', 'L1|Dùng AI chat cơ bản', 'L2|Dùng AI trong workflow', 'L3|Tự build tool AI'].map((item, i) => {
            const [level, desc] = item.split('|');
            return `<div class="ai-level-card" data-level="${level}" onclick="selectAILevel(this)"
              style="border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;cursor:pointer;transition:all 0.15s">
              <div style="font-size:14px;font-weight:600;color:#F5C842;margin-bottom:2px">${level}</div>
              <div style="font-size:11px;color:#8B92A5">${desc}</div>
            </div>`;
          }).join('')}
        </div>
        <button onclick="goRegStep(2)" style="width:100%;padding:12px;background:#F5C842;color:#1A1F2E;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
          Tiếp theo →
        </button>
      </div>

      <!-- Step 2 -->
      <div id="step2" style="display:none">
        <h3 style="font-size:18px;font-weight:600;margin-bottom:4px">Hình thức & nhóm</h3>
        <p style="color:#8B92A5;font-size:13px;margin-bottom:16px">Bạn tham gia solo hay có team?</p>
        <div id="regTypeGrid" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
          ${[
            'solo|Solo (1 mình)|Tự mình tham gia',
            'group|Nhóm (2–3 người)|Đã có team, điền thêm thành viên',
            'need_matching|Muốn được ghép nhóm|BTC sẽ ghép team phù hợp'
          ].map(item => {
            const [val, label, desc] = item.split('|');
            return `<div class="reg-type-card" data-type="${val}" onclick="selectRegType(this)"
              style="border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:12px;cursor:pointer;transition:all 0.15s">
              <div style="font-size:14px;font-weight:500">${label}</div>
              <div style="font-size:11px;color:#8B92A5;margin-top:2px">${desc}</div>
            </div>`;
          }).join('')}
        </div>
        <div id="memberFields" style="display:none">
          <div style="border:1px dashed rgba(255,255,255,0.1);border-radius:8px;padding:12px;margin-bottom:10px">
            <div style="font-size:11px;color:#8B92A5;margin-bottom:8px;font-weight:500">Thành viên thứ 2</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input type="text" id="r_m2name" placeholder="Họ và tên" style="padding:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:white;font-size:13px;outline:none">
              <select id="r_m2team" style="padding:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:white;font-size:13px">
                <option value="">Team</option>${teams.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="border:1px dashed rgba(255,255,255,0.1);border-radius:8px;padding:12px;margin-bottom:10px">
            <div style="font-size:11px;color:#8B92A5;margin-bottom:8px;font-weight:500">Thành viên thứ 3 (nếu có)</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input type="text" id="r_m3name" placeholder="Họ và tên" style="padding:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:white;font-size:13px;outline:none">
              <select id="r_m3team" style="padding:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:white;font-size:13px">
                <option value="">Team</option>${teams.map(t => `<option value="${t}">${t}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <label style="font-size:12px;color:#8B92A5;display:block;margin-bottom:4px">Mong muốn khi ghép team (nếu có)</label>
        <input type="text" id="r_matching" placeholder="Muốn có người biết code, hoặc từ team khác..." style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:14px;margin-bottom:16px;outline:none">
        <div style="display:flex;gap:8px">
          <button onclick="goRegStep(1)" style="flex:1;padding:12px;background:transparent;color:#C4CBD9;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:14px;cursor:pointer">← Quay lại</button>
          <button onclick="goRegStep(3)" style="flex:2;padding:12px;background:#F5C842;color:#1A1F2E;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Tiếp theo →</button>
        </div>
      </div>

      <!-- Step 3 -->
      <div id="step3" style="display:none">
        <h3 style="font-size:18px;font-weight:600;margin-bottom:4px">Kỳ vọng & bài toán</h3>
        <p style="color:#8B92A5;font-size:13px;margin-bottom:16px">Giúp BTC hiểu bạn hơn</p>
        <label style="font-size:12px;color:#8B92A5;display:block;margin-bottom:4px">Bài toán bạn/team muốn giải quyết</label>
        <textarea id="r_problem" placeholder="Mô tả ngắn vấn đề bạn đang gặp..." rows="3" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:14px;margin-bottom:12px;outline:none;resize:vertical;font-family:inherit"></textarea>
        <label style="font-size:12px;color:#8B92A5;display:block;margin-bottom:4px">Kỳ vọng output sau NHAI DAY *</label>
        <div id="outputGrid" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
          ${[
            'demo|Có demo/prototype chạy được',
            'plan|Có giải pháp và plan rõ ràng',
            'learn|Học được kỹ năng mới'
          ].map(item => {
            const [val, label] = item.split('|');
            return `<div class="output-card" data-output="${val}" onclick="selectOutput(this)"
              style="border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;cursor:pointer;transition:all 0.15s">
              <div style="font-size:13px">${label}</div>
            </div>`;
          }).join('')}
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="goRegStep(2)" style="flex:1;padding:12px;background:transparent;color:#C4CBD9;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:14px;cursor:pointer">← Quay lại</button>
          <button onclick="submitRegistration()" id="regSubmitBtn" style="flex:2;padding:12px;background:#14B8A6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">Hoàn tất đăng ký ✓</button>
        </div>
      </div>

      <!-- Success -->
      <div id="regSuccess" style="display:none;text-align:center;padding:40px 0">
        <div style="width:60px;height:60px;border-radius:50%;background:rgba(20,184,166,0.15);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px">✓</div>
        <div style="font-size:20px;font-weight:600;margin-bottom:8px">Đăng ký thành công!</div>
        <div style="color:#8B92A5;font-size:14px;line-height:1.6">
          Cảm ơn bạn đã đăng ký tham gia <strong>NHAI DAY!</strong><br>
          BTC sẽ liên hệ qua email xác nhận thông tin.
        </div>
      </div>
    </div>`;

    // Make helper functions global
    window.selectedAILevel = '';
    window.selectedRegType = 'solo';
    window.selectedOutput = 'demo';

    window.selectAILevel = function(el) {
      document.querySelectorAll('.ai-level-card').forEach(c => { c.style.borderColor = 'rgba(255,255,255,0.1)'; c.style.background = 'transparent'; });
      el.style.borderColor = '#F5C842'; el.style.background = 'rgba(245,200,66,0.08)';
      window.selectedAILevel = el.dataset.level;
    };

    window.selectRegType = function(el) {
      document.querySelectorAll('.reg-type-card').forEach(c => { c.style.borderColor = 'rgba(255,255,255,0.1)'; c.style.background = 'transparent'; });
      el.style.borderColor = '#F5C842'; el.style.background = 'rgba(245,200,66,0.08)';
      window.selectedRegType = el.dataset.type;
      document.getElementById('memberFields').style.display = el.dataset.type === 'group' ? 'block' : 'none';
    };

    window.selectOutput = function(el) {
      document.querySelectorAll('.output-card').forEach(c => { c.style.borderColor = 'rgba(255,255,255,0.1)'; c.style.background = 'transparent'; });
      el.style.borderColor = '#14B8A6'; el.style.background = 'rgba(20,184,166,0.08)';
      window.selectedOutput = el.dataset.output;
    };

    window.goRegStep = function(step) {
      // Validate step 1
      if (step === 2) {
        const name = document.getElementById('r_name').value.trim();
        const email = document.getElementById('r_email').value.trim();
        const city = document.getElementById('r_city').value;
        if (!name || !email || !city) {
          alert('Vui lòng điền đầy đủ thông tin bắt buộc');
          return;
        }
        if (!email.includes('@')) {
          alert('Email không hợp lệ');
          return;
        }
      }

      document.getElementById('step1').style.display = step === 1 ? 'block' : 'none';
      document.getElementById('step2').style.display = step === 2 ? 'block' : 'none';
      document.getElementById('step3').style.display = step === 3 ? 'block' : 'none';
      document.getElementById('regStep').textContent = `Bước ${step}/3`;
      ['prog1','prog2','prog3'].forEach((id, i) => {
        document.getElementById(id).style.background = i < step ? '#F5C842' : 'rgba(255,255,255,0.1)';
      });
    };

    window.submitRegistration = async function() {
      const btn = document.getElementById('regSubmitBtn');
      btn.textContent = 'Đang gửi...'; btn.disabled = true;

      const data = {
        full_name: document.getElementById('r_name').value.trim(),
        email: document.getElementById('r_email').value.trim(),
        city: document.getElementById('r_city').value,
        team: document.getElementById('r_team').value,
        registration_type: window.selectedRegType,
        member2_name: document.getElementById('r_m2name')?.value.trim() || '',
        member2_team: document.getElementById('r_m2team')?.value || '',
        member3_name: document.getElementById('r_m3name')?.value.trim() || '',
        member3_team: document.getElementById('r_m3team')?.value || '',
        team_matching_note: document.getElementById('r_matching')?.value.trim() || '',
        problem_to_solve: document.getElementById('r_problem')?.value.trim() || '',
        ai_level: window.selectedAILevel,
        expected_output: window.selectedOutput,
        season_id: currentSeason,
      };

      // Song song: Supabase + Google Sheet
      const [sbOk] = await Promise.all([
        sbInsert('registrations', data),
        fetch(SHEET_WEBHOOK, {
          method: 'POST', mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, season: currentSeason })
        }).catch(() => {})
      ]);

      if (sbOk) {
        document.getElementById('step3').style.display = 'none';
        document.getElementById('regSuccess').style.display = 'block';
        // Update count
        registrationCount++;
        updateRegistrationCount();
      } else {
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
        btn.textContent = 'Hoàn tất đăng ký ✓'; btn.disabled = false;
      }
    };
  }

  // ===== 8. VOTE EMAIL VERIFICATION =====
  function initVoteSystem() {
    // Check if user already verified
    let voterEmail = localStorage.getItem('nhai_voter_email') || '';
    let votedCases = JSON.parse(localStorage.getItem('nhai_voted_cases') || '[]');
    const deviceId = localStorage.getItem('nhai_device_id') || generateDeviceId();
    localStorage.setItem('nhai_device_id', deviceId);

    function generateDeviceId() {
      return 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    }

    // Override vote button click
    document.addEventListener('click', function(e) {
      const voteBtn = e.target.closest('.vote-btn, .heart-btn, [data-vote]');
      if (!voteBtn) return;
      e.preventDefault(); e.stopPropagation();

      const caseId = voteBtn.dataset.caseId || voteBtn.dataset.vote || voteBtn.closest('[data-case-id]')?.dataset.caseId;
      if (!caseId) return;

      // Already voted?
      if (votedCases.includes(caseId)) {
        showVoteToast('Bạn đã vote case này rồi!', 'warning');
        return;
      }

      // Need email verification?
      if (!voterEmail) {
        showEmailPopup(caseId);
        return;
      }

      // Do vote
      doVote(caseId);
    });

    function showEmailPopup(caseId) {
      // Remove existing popup
      document.getElementById('votePopup')?.remove();

      const popup = document.createElement('div');
      popup.id = 'votePopup';
      popup.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px" onclick="this.remove()">
          <div style="background:#131826;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:24px;width:380px;text-align:center" onclick="event.stopPropagation()">
            <div style="font-size:24px;margin-bottom:12px">❤️</div>
            <div style="font-size:16px;font-weight:600;margin-bottom:4px">Xác nhận vote</div>
            <div style="font-size:13px;color:#8B92A5;margin-bottom:16px">Nhập email @garena.vn để xác nhận</div>
            <input type="email" id="voteEmailInput" placeholder="ten@garena.vn"
              style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:white;font-size:14px;text-align:center;outline:none;margin-bottom:12px">
            <button id="voteConfirmBtn"
              style="width:100%;padding:12px;background:#F5C842;color:#1A1F2E;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
              Vote ngay
            </button>
            <div style="font-size:11px;color:#8B92A5;margin-top:10px">Chỉ cần nhập 1 lần — các lần vote sau sẽ không hỏi lại</div>
          </div>
        </div>
      `;
      document.body.appendChild(popup);

      document.getElementById('voteConfirmBtn').addEventListener('click', function() {
        const email = document.getElementById('voteEmailInput').value.trim();
        if (!email.endsWith('@garena.vn') && !email.endsWith('@sea.com')) {
          alert('Chỉ email @garena.vn hoặc @sea.com mới được vote');
          return;
        }
        voterEmail = email;
        localStorage.setItem('nhai_voter_email', email);
        popup.remove();
        doVote(caseId);
      });

      // Enter key
      document.getElementById('voteEmailInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('voteConfirmBtn').click();
      });

      setTimeout(() => document.getElementById('voteEmailInput').focus(), 100);
    }

    async function doVote(caseId) {
      // Get campaign
      const campaigns = await sb('top_pick_campaigns?is_active=eq.true&limit=1');
      const campaign = campaigns[0];
      if (!campaign) {
        showVoteToast('Chưa mở bình chọn', 'error');
        return;
      }

      // Check max votes
      const maxVotes = campaign.max_votes_per_device || 3;
      if (votedCases.length >= maxVotes) {
        showVoteToast(`Bạn đã vote tối đa ${maxVotes} case`, 'warning');
        return;
      }

      // Insert vote
      const ok = await sbInsert('top_pick_votes', {
        campaign_id: campaign.id,
        case_id: caseId,
        device_id: deviceId,
        voter_email: voterEmail,
      });

      if (ok) {
        votedCases.push(caseId);
        localStorage.setItem('nhai_voted_cases', JSON.stringify(votedCases));
        showVoteToast('Đã vote thành công! ❤️');

        // Update UI
        const voteBtn = document.querySelector(`[data-case-id="${caseId}"] .vote-btn, [data-vote="${caseId}"]`);
        if (voteBtn) {
          voteBtn.style.color = '#EC4899';
          voteBtn.classList.add('voted');
        }
        const countEl = document.querySelector(`[data-case-id="${caseId}"] .vote-count`);
        if (countEl) {
          countEl.textContent = parseInt(countEl.textContent || '0') + 1;
        }
      } else {
        showVoteToast('Có lỗi hoặc bạn đã vote case này rồi', 'error');
      }
    }

    function showVoteToast(msg, type = 'success') {
      const colors = { success: '#14B8A6', warning: '#F5C842', error: '#EF4444' };
      const toast = document.createElement('div');
      toast.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;color:white;background:${colors[type] || colors.success};box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:fadeIn 0.3s`;
      toast.textContent = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    // Mark already voted cases
    document.querySelectorAll('[data-case-id]').forEach(card => {
      const caseId = card.dataset.caseId;
      if (votedCases.includes(caseId)) {
        const btn = card.querySelector('.vote-btn, .heart-btn');
        if (btn) { btn.style.color = '#EC4899'; btn.classList.add('voted'); }
      }
    });
  }

  // ===== INIT =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    loadConfig().then(() => {
      initRegistrationForm();
      initVoteSystem();
      console.log('NHAI DAY config loaded ✓');
    });
  }

})();
