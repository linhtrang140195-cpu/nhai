/* ============================================================
   EDITABLE CONTENT — draft copy, not finalized. Change text here,
   no need to touch layout/animation code anywhere else.
   ============================================================ */
// Google Form "CMSN FF" — câu hỏi "Gửi lời chúc". Người dùng KHÔNG thấy form
// này, chỉ thao tác trên ô/nút có sẵn của site; submitWish() âm thầm gửi vào
// đây phía sau để lưu lại thật (Google Sheet gắn với form).
const WISH_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScjNYk0Hqo0jWK6Q8C3-UPPCr0_uf2lBD3Q5g0M_mqCRqWoVA/formResponse';
const WISH_FORM_ENTRY = 'entry.1831177962';
// 7 cột mốc — bản cập nhật theo yêu cầu mới (có 3 mốc cùng năm 2021 vì mỗi
// mốc kể một khía cạnh khác nhau, đây là chủ đích chứ không phải trùng lặp)
const MILESTONES = [
  { year: '2017', title: 'Tôi bắt đầu từ 111dots Studio.', text: 'Từ một studio Việt Nam, tôi được Garena đưa đến người chơi ở khắp nơi trên thế giới.' },
  { year: '2021', title: 'Tôi học cách không dừng lại.', text: 'Ngay cả khi thế giới chậm lại vì Covid, Free Fire vẫn tiếp tục được mở lên mỗi ngày.' },
  { year: '2021', title: 'Tôi lớn lên cùng một cộng đồng khổng lồ.', text: 'Những lượt tải, những lần đăng nhập, những squad và từng trận đấu đã nối dài thêm những đam mê ấy.' },
  { year: '2021', title: 'Tôi mang một dấu ấn Việt Nam đi xa.', text: 'Skyler trở thành nhân vật Việt Nam đầu tiên lấy từ nguyên mẫu đời thật vào game toàn cầu.' },
  { year: '2025', title: 'Tôi thấy cộng đồng viết nên kỷ lục.', text: 'Từ những trận đấu trên điện thoại đến sân khấu FFWS, cộng đồng Free Fire tiếp tục lớn hơn mỗi ngày.' },
  { year: '2026', title: 'Tôi thấy Việt Nam được gọi tên.', text: 'Free Fire Việt Nam ghi dấu một cột mốc mới trên đấu trường khu vực.' },
  { year: 'Hôm nay', title: '9 năm giữ chuỗi.', text: 'Tôi đã lớn lên cùng người chơi, cùng đội ngũ, và cùng những điều từng tưởng rất xa.' },
];
// vị trí 7 mốc dọc theo đường cong filmstrip, tính theo % chiều dài path
// (0 = đúng gốc số 9 ở đáy, 1 = cuối đường cong) — chỉnh mảng này nếu đổi path
const FILMSTRIP_FRACS = [0.08, 0.24, 0.40, 0.56, 0.70, 0.84, 0.97];

// Page 02 — 5 fact bật lớn như "flash moment" (giai đoạn B). "stamp: true"
// = riêng fact này bật thêm con dấu "KỶ LỤC THẾ GIỚI" sau khi số lớn hiện.
const BIG_FACTS = [
  { big: '1 TỶ+', sub: 'lượt tải trên Google Play Store', detail: 'Free Fire là game battle royale đầu tiên đạt mốc này trên Google Play Store.' },
  { big: '150 TRIỆU+', sub: 'người chơi đăng nhập mỗi ngày', detail: 'Mốc peak daily active users được ghi nhận trong Q2/2021.' },
  { big: 'SKYLER', sub: 'dấu ấn Việt Nam trong Free Fire toàn cầu', detail: 'Skyler được ra mắt trong collaboration với Sơn Tùng M-TP — nghệ sĩ Việt Nam đầu tiên hợp tác với Free Fire theo hình thức nhân vật in-game.' },
  { big: '618,778', sub: 'người tham gia', detail: 'FFWS 2025 lập Kỷ lục Guinness cho giải đấu eSports mobile theo đội lớn nhất.', stamp: true },
  { big: 'SECRET WAG', sub: 'Việt Nam nâng cúp FFWS SEA', detail: 'SECRET WAG vô địch FFWS SEA 2026 Spring, trở thành đội Việt Nam đầu tiên nâng cúp FFWS SEA trên sân nhà.' },
];

// Page 02 — bubble thoại vui (giai đoạn C), pop lên rồi biến mất, không ở lại màn hình
const FUN_BUBBLES = [
  'Máy chú có Phai Phai không?',
  'Uầy, lì xì Free Fire kìa, cho cháu!',
  'Ơ, làm ở Free Fire á?',
  'Thế có kim cương không?',
  'Uầy, ngầu vãi.',
];

// Page 04 — danh sách tên thật cuộn ở cuối credit, kết bằng dòng chung
const CREDIT_NAMES = [
  'An Anh Vũ', 'Hoàng Minh Trí', 'Nguyễn Thu Trang', 'Lê Hồng Đức', 'Lê Hồ Anh Khoa',
  'Dương Khải Kiên', 'Đào Hồng Đức', 'Hoàng Thị Phương Thảo', 'Võ Lượng', 'Nguyễn Thanh Phú',
  'Phạm Ngọc Việt', 'Nguyễn Tiến Đức', 'Hồ Trần Thu Anh', 'Nguyễn Quang Hoạt', 'Trần Đức Thao',
  'Phạm Mai Phương', 'Vũ Lan Chi', 'Hoàng Tùng Anh', 'Lê Anh Phương', 'Nguyễn Như Thế Anh',
  'Nguyễn Thanh Tuấn', 'Nguyễn Chí Thanh', 'Nguyễn Ngọc Toàn', 'Trần Quang Đức', 'Nguyễn Hữu Thịnh',
  'Tống Phước Bảo Quốc', 'Đoàn Hồng Việt', 'Mai Anh Tuấn', 'Châu Bảo Minh', 'Lê Thục Anh',
  'Trần Gia Bảo', 'Lương Ngọc Huy', 'Nguyễn Lê Tiến Đạt', 'Phùng Châu Hải', 'Đào Đông Đức',
  'Lê Minh Hảo', 'Ngô Thành Trung', 'Trần Huỳnh Thi', 'Nguyễn Thị Hồng Hà', 'Nguyễn Hữu Thành',
  'Trần Thanh Trường', 'Nguyễn Thị Chung Anh', 'Đinh Thùy Dương', 'Trịnh Hồng Vân', 'Nguyễn Đình Vương',
  'Bùi Hương Giang', 'Ngô Quốc Quân', 'Nguyễn An Nhất Huy', 'Trần Nguyên Đăng Khoa', 'Nguyễn Lê Phong',
  'Nguyễn Tường Linh', 'Ngô Quỳnh Nga', 'Ngô Hoàng Nam Hưng', 'Nguyễn Minh Huy', 'Trần Nam Phong',
  'Lâm Hoàng Lan', 'Hà Nguyễn Quốc Khánh', 'Nguyễn Khánh Linh', 'Hoàng Mai', 'Đào Minh Uyên',
  'Đào Bùi Quang Huy', 'Nguyễn Ngọc Anh', 'Đặng Ngọc Linh', 'Phạm Minh Thành', 'Nguyễn Võ Ngọc Bảo',
  'Ngô Hoàng Tuấn', 'Đàm Thành Đạt',
  'AND EVERYONE WHO KEPT THE CHAIN ALIVE',
];

// Page 04 — các nhóm credit (tiêu đề cam + mô tả), cuộn trước danh sách tên
const CREDIT_BLOCKS = [
  { head: 'Những người tạo nên thế giới trong game.', body: 'Gameplay, nhân vật, bản đồ, sự kiện.' },
  { head: 'Những người đưa Free Fire đến với cộng đồng.', body: 'Campaign, creator, social, esports, community, product...' },
  { head: 'Những người giữ mọi thứ vận hành phía sau.', body: 'Ops, data, CS, QA, finance, legal, people, admin...' },
  { head: 'Và những người chơi đã luôn ở đó.', body: 'Cảm ơn tất cả chúng ta!' },
];

/* ============================================================
   INTRO / PROJECTOR — unchanged mechanic
   ============================================================ */
const stage = document.getElementById('stage');
let fired = false;

/* ---- PAGE 00: click số 9 ở giữa màn để "bật máy chiếu" ----
   Trình tự: số 9 flare mạnh + ánh máy chiếu quét ngang (.firing) chạy
   trước ~0.56s → set stage.fired → screen mở ra, nguồn chiếu số 9 hiện
   ở đáy (bàn giao dưới lớp big-flash trắng) → sau 2.3s hiện nav để lật
   qua các thước phim. Crystal + beam + screen luôn mounted xuyên suốt. */
const sceneProjector = document.getElementById('sceneProjector');
function fireProjector(){
  if(fired) return;
  fired = true;
  sceneProjector.classList.add('firing');
  startBackgroundMusic(); // đúng lúc có cử chỉ bấm thật — trình duyệt cho phép phát tiếng
  setTimeout(() => {
    stage.classList.add('fired');
    setTimeout(() => PageController.init(), 2300);
  }, 560);
}

/* ---- NHẠC NỀN ----
   "Childhood" phát xuyên suốt từ lúc bật máy chiếu; đổi sang "Happy
   Birthday" khi vào Page 4 (Credits) trở đi. Dùng chung 1 thẻ <audio>,
   chỉ đổi src khi thật sự cần (currentTrack) để không giật lại bài đang
   phát mỗi lần onPageEnter chạy lại cho cùng 1 trang. */
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
let musicMuted = false;
let currentTrack = null;
let finalSection = false; // true khi vào Page 5 — cho bài HB chạy full đến hết

function playTrack(src){
  if(currentTrack === src) return;
  currentTrack = src;
  bgMusic.src = src;
  bgMusic.currentTime = 0;
  if(!musicMuted) bgMusic.play().catch(() => {});
}
function startBackgroundMusic(){
  playTrack('assets/music-childhood.mp3');
}
musicToggle.addEventListener('click', () => {
  musicMuted = !musicMuted;
  bgMusic.muted = musicMuted;
  musicToggle.classList.toggle('muted', musicMuted);
  musicToggle.querySelector('.music-icon').textContent = musicMuted ? '✕' : '♪';
  if(!musicMuted && bgMusic.paused && currentTrack) bgMusic.play().catch(() => {});
});
// Khi bài happy birthday còn 8 giây → loop lại từ đầu, tránh bị "cụt" ở đuôi bài.
// Ngoại lệ: đoạn kết (Page 5 — finalSection) thì cho phát full đến hết bài.
bgMusic.addEventListener('timeupdate', () => {
  if(!finalSection && currentTrack && currentTrack.includes('happy-birthday') &&
     bgMusic.duration && bgMusic.currentTime >= bgMusic.duration - 8){
    bgMusic.currentTime = 0;
  }
});
sceneProjector.addEventListener('pointerdown', () => { if(!fired) sceneProjector.classList.add('pressed'); });
sceneProjector.addEventListener('pointerup',   () => sceneProjector.classList.remove('pressed'));
sceneProjector.addEventListener('pointerleave',() => sceneProjector.classList.remove('pressed'));
sceneProjector.addEventListener('click', fireProjector);

/* ============================================================
   PAGE CONTROLLER — swaps the active .reel inside the projector
   screen. The screen/crystal/beam never unmount; only the reel
   showing inside the frame changes, like changing film reels.
   ============================================================ */
const PageController = (() => {
  const reels = Array.from(document.querySelectorAll('.reel'));
  const TOTAL = reels.length;
  let current = 1;

  const pageNumEl = document.getElementById('pageNum');
  const chainEl = document.getElementById('chainProgress');
  const flickerEl = document.getElementById('pageFlicker');
  const sweepEl = document.getElementById('pageLightsweep');
  const btnPrev = document.getElementById('navPrev');
  const btnNext = document.getElementById('navNext');

  function buildChain(){
    chainEl.innerHTML = '';
    for(let i = 1; i <= TOTAL; i++){
      const d = document.createElement('div');
      d.className = 'chain-link';
      d.dataset.page = i;
      chainEl.appendChild(d);
    }
  }

  function updateUI(){
    pageNumEl.textContent = String(current).padStart(2,'0') + ' / ' + String(TOTAL).padStart(2,'0');
    Array.from(chainEl.children).forEach(el => {
      const p = Number(el.dataset.page);
      el.classList.toggle('current', p === current);
      el.classList.toggle('visited', p < current);
    });
    btnPrev.disabled = current <= 1;
    btnNext.disabled = current >= TOTAL;
  }

  function playTransitionFx(){
    flickerEl.classList.remove('sweep'); void flickerEl.offsetWidth; flickerEl.classList.add('sweep');
    sweepEl.classList.remove('sweep'); void sweepEl.offsetWidth; sweepEl.classList.add('sweep');
  }

  function activateReel(n){
    reels.forEach(r => r.classList.toggle('active', Number(r.dataset.page) === n));
    const activeReel = reels.find(r => Number(r.dataset.page) === n);
    if(activeReel) onPageEnter(activeReel);
  }

  function goTo(n){
    n = Math.max(1, Math.min(TOTAL, n));
    if(n === current) return;
    playTransitionFx();
    current = n;
    activateReel(n);
    updateUI();
  }

  function init(){
    buildChain();
    current = 1;
    document.body.classList.add('nav-ready');
    updateUI();
    // kích hoạt reveal cho thước phim đầu tiên (init không đi qua goTo)
    const first = reels.find(r => Number(r.dataset.page) === 1);
    if(first) onPageEnter(first);
  }

  function next(){ goTo(current + 1); }
  function prev(){ goTo(current - 1); }

  // elements that manage their own click/tap/scroll — clicking or scrolling
  // over these must NOT also trigger a page change (they call
  // e.stopPropagation() themselves, this is just a second guard)
  const OWN_INTERACTION_SELECTOR = '.nav-btn, .filmstrip-stage';

  btnNext.addEventListener('click', (e) => { e.stopPropagation(); next(); });
  btnPrev.addEventListener('click', (e) => { e.stopPropagation(); prev(); });
  document.addEventListener('keydown', (e) => {
    if(!fired) return;
    if(e.key === 'ArrowRight') next();
    if(e.key === 'ArrowLeft') prev();
  });

  // horizontal swipe/drag only — a plain click no longer advances the
  // page (it was firing on things like taking a screenshot, inspecting
  // an element, or just clicking to read something, which felt broken)
  let sx = null, sy = null;
  window.addEventListener('pointerdown', (e) => {
    if(!fired) return;
    if(e.target.closest(OWN_INTERACTION_SELECTOR)) return;
    sx = e.clientX; sy = e.clientY;
  });
  window.addEventListener('pointerup', (e) => {
    if(sx === null || !fired) return;
    if(e.target.closest(OWN_INTERACTION_SELECTOR)){ sx = null; sy = null; return; }
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    sx = null; sy = null;
    if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)){ dx < 0 ? next() : prev(); }
  });

  // scroll wheel — lets a reel with taller content (.reel-inner) scroll
  // internally first; only changes page once that content is at its edge
  let wheelLocked = false;
  function lockWheelBriefly(){ wheelLocked = true; setTimeout(() => wheelLocked = false, 550); }
  window.addEventListener('wheel', (e) => {
    if(!fired || wheelLocked) return;
    if(e.target.closest(OWN_INTERACTION_SELECTOR)) return;
    const scrollable = e.target.closest('.reel-inner');
    if(scrollable && scrollable.scrollHeight > scrollable.clientHeight){
      const atTop = scrollable.scrollTop <= 0;
      const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;
      if(e.deltaY > 0 && !atBottom) return; // let it scroll down inside the reel first
      if(e.deltaY < 0 && !atTop) return;    // let it scroll up inside the reel first
    }
    if(e.deltaY > 8){ lockWheelBriefly(); next(); }
    else if(e.deltaY < -8){ lockWheelBriefly(); prev(); }
  }, { passive:true });

  return { init, goTo, next, prev };
})();

/* ============================================================
   SECTION 01 — opening: hiệu ứng gõ máy chữ (typewriter), từng dòng
   gõ xong mới sang dòng kế — như phụ đề phim đang được gõ ra.
   opSession dùng để huỷ giữa chừng nếu người xem rời trang trước
   khi gõ xong (tránh 2 vòng gõ đè lên nhau khi quay lại trang).
   ============================================================ */
let opSession = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// bóc childNodes gốc (text + <span> con) thành từng mẩu 1 lần duy nhất,
// rồi xoá rỗng — giữ nguyên bản gốc trong bộ nhớ để gõ lại được khi replay
function prepareTypeChunks(el){
  if(!el._typeChunks){
    el._typeChunks = Array.from(el.childNodes).map(node =>
      node.nodeType === Node.TEXT_NODE
        ? { text: node.textContent }
        : { text: node.textContent, tag: node.tagName.toLowerCase(), cls: node.className }
    );
  }
  el.innerHTML = '';
}

function typewriteLine(el, speed, mySession){
  const chunks = el._typeChunks;
  const total = chunks.reduce((s,c) => s + c.text.length, 0);
  return new Promise(resolve => {
    if(total === 0){ resolve(); return; }
    let count = 0;
    function render(showCursor){
      let remaining = count, html = '';
      chunks.forEach(c => {
        const take = Math.max(0, Math.min(remaining, c.text.length));
        const slice = c.text.slice(0, take);
        html += c.tag ? `<${c.tag} class="${c.cls}">${slice}</${c.tag}>` : slice;
        remaining -= take;
      });
      if(showCursor) html += '<span class="type-cursor">|</span>';
      el.innerHTML = html;
    }
    render(true);
    const timer = setInterval(() => {
      if(opSession !== mySession){ clearInterval(timer); resolve(); return; }
      count++;
      const done = count >= total;
      render(!done);
      if(done){ clearInterval(timer); resolve(); }
    }, speed);
  });
}

// gõ tuần tự một danh sách dòng .op-line — dùng chung cho Page 01 (runOpening)
// và đoạn dẫn mở Page 04 (runTimelineIntro). opSession dùng để 1 phiên gõ mới
// (trang khác, hoặc quay lại trang) luôn huỷ được phiên gõ dở dang trước đó.
async function typewriteSequence(lines, mySession, opts){
  const titleSpeed = (opts && opts.titleSpeed) || 46;
  const lineSpeed = (opts && opts.lineSpeed) || 26;
  const prePause = (opts && opts.prePause) != null ? opts.prePause : 160;
  const postPause = (opts && opts.postPause) != null ? opts.postPause : 240;
  lines.forEach(l => { l.classList.remove('in'); prepareTypeChunks(l); });
  for(const line of lines){
    if(opSession !== mySession) return;
    line.classList.add('in');
    await sleep(prePause);
    if(opSession !== mySession) return;
    const speed = (line.tagName === 'H1' || line.tagName === 'H2') ? titleSpeed : lineSpeed; // tiêu đề gõ chậm/nặng nhịp hơn
    await typewriteLine(line, speed, mySession);
    await sleep(postPause);
  }
}

async function runOpening(page){
  const mySession = ++opSession;
  const stillActive = () => opSession === mySession && page.classList.contains('active');
  await typewriteSequence(Array.from(page.querySelectorAll('.op-line')), mySession);
  if(!stillActive()) return;
  await sleep(2600); // giữ đọc câu cuối trước khi tự chuyển
  if(!stillActive()) return;
  PageController.goTo(2); // tự động sang trang kế — chỉ Page 00 cần chạm để bắt đầu
}

/* ============================================================
   SECTION 02 — "Chúng ta đã thật sự cùng nhau toả sáng"
   Chuỗi hoàn toàn tự động, không cần chạm (giống Page 04):
   A) video sân khấu + headline  →  B) 5 fact bật lớn lần lượt  →
   C) câu dẫn + bubble thoại vui pop rồi biến mất. Dừng lại ở cuối,
   không tự chuyển Page 3 (khác Page 04 — đó là ngoại lệ duy nhất).
   factsSession dùng để huỷ nếu người xem rời trang giữa chừng.
   ============================================================ */
let factsSession = 0;

function renderFactPop(page, i){
  const f = BIG_FACTS[i];
  page.querySelector('#factsPopBig').textContent = f.big;
  page.querySelector('#factsPopSub').textContent = f.sub;
  page.querySelector('#factsPopDetail').textContent = f.detail;
  const popEl = page.querySelector('#factsPop');
  popEl.classList.remove('pop', 'shrink', 'show-stamp');
  void popEl.offsetWidth;
  popEl.classList.add('pop');
}

async function runFacts(page){
  const mySession = ++factsSession;
  const stillActive = () => factsSession === mySession && page.classList.contains('active');

  const hero = page.querySelector('#factsHero');
  const heroText = page.querySelector('#factsHeroText');
  const popStage = page.querySelector('#factsPopStage');
  const popEl = page.querySelector('#factsPop');
  const badgesWrap = page.querySelector('#factsBadges');
  const funStage = page.querySelector('#factsFunStage');
  const leadEl = page.querySelector('#factsFunLead');
  const bubblesWrap = page.querySelector('#factsBubbles');
  const closerEl = page.querySelector('#factsCloser');

  // reset về trạng thái ban đầu — cho phép chạy lại sạch mỗi lần quay lại trang
  hero.classList.remove('dim'); heroText.classList.remove('show');
  hero.querySelector('.facts-hero-video').style.filter = ''; // trả lại filter mặc định (đã bị ghi đè inline lúc chuyển cảnh)
  popStage.classList.remove('show'); popEl.classList.remove('pop', 'shrink', 'show-stamp');
  funStage.classList.remove('show'); leadEl.classList.remove('show', 'fade');
  bubblesWrap.innerHTML = ''; badgesWrap.innerHTML = '';
  closerEl.classList.remove('show', 'glow');

  if(!stillActive()) return;
  await sleep(1500); // để video tự "làm sân khấu" 1-2s trước khi hiện chữ
  if(!stillActive()) return;
  heroText.classList.add('show');
  await sleep(3400); // giữ đọc headline + sub
  if(!stillActive()) return;

  heroText.classList.remove('show'); // title/sub fade out trước khi video dim
  await sleep(900);
  if(!stillActive()) return;
  hero.classList.add('dim'); // video dim còn ~60%, nhường sân khấu cho fact
  await sleep(600);
  if(!stillActive()) return;

  popStage.classList.add('show');
  for(let i = 0; i < BIG_FACTS.length; i++){
    if(!stillActive()) return;
    const f = BIG_FACTS[i];
    renderFactPop(page, i);
    if(f.stamp){
      await sleep(800); // số lớn hiện trước, rồi mới "đóng dấu" đè lên
      if(!stillActive()) return;
      popEl.classList.add('show-stamp');
      await sleep(4000); // +2s theo yêu cầu (đang trôi nhanh)
    } else {
      await sleep(4600); // giữ mỗi fact ~4.5s (+2s theo yêu cầu)
    }
    if(!stillActive()) return;

    // thu nhỏ fact hiện tại lại rồi dồn thành 1 badge ở cạnh dưới — không
    // để 2 fact chồng lên nhau, badge trước vẫn ở lại làm dấu vết đã qua
    popEl.classList.add('shrink');
    const badge = document.createElement('div');
    badge.className = 'facts-badge';
    badge.textContent = f.big;
    badgesWrap.appendChild(badge);
    void badge.offsetWidth;
    badge.classList.add('show');
    await sleep(500);
    if(!stillActive()) return;
  }
  if(!stillActive()) return;
  popStage.classList.remove('show');
  await sleep(700);
  if(!stillActive()) return;

  funStage.classList.add('show');
  leadEl.classList.add('show');
  await sleep(3000);
  if(!stillActive()) return;
  leadEl.classList.add('fade');

  for(const text of FUN_BUBBLES){
    if(!stillActive()) return;
    const b = document.createElement('div');
    b.className = 'facts-bubble';
    b.textContent = text;
    b.style.left = (14 + Math.random() * 62) + '%'; // vị trí ngẫu nhiên quanh màn hình
    b.style.top = (16 + Math.random() * 55) + '%';
    bubblesWrap.appendChild(b);
    void b.offsetWidth;
    b.classList.add('show');
    await sleep(1700); // giữ ~1.5-2s
    if(!stillActive()) return;
    b.classList.add('out'); // fade + bay nhẹ lên rồi biến mất, không ở lại màn hình
    setTimeout(() => b.remove(), 700);
    await sleep(300); // nhịp nghỉ ngắn trước bubble kế
  }
  if(!stillActive()) return;

  // kết ngắn, tự động — không cần chạm: "Chúng ta vẫn đang giữ chuỗi." giữ
  // ~1.5-2s, rồi chữ "giữ chuỗi" sáng vàng/cam + hắt sáng lan ra màn hình
  closerEl.classList.add('show');
  await sleep(1800);
  if(!stillActive()) return;
  closerEl.classList.add('glow');
  await sleep(1300); // giữ nhịp ánh sáng lan ra trước khi chuyển cảnh

  // chuyển cảnh: video dim thêm + flash ấm rồi sang Page 4 (credits)
  if(!stillActive()) return;
  hero.querySelector('.facts-hero-video').style.filter = 'brightness(.15)';
  const flashEl = document.querySelector('.flash');
  await sleep(500);
  if(!stillActive()) return;
  flashEl.classList.add('warm-flash');
  await sleep(800);
  flashEl.classList.remove('warm-flash');
  if(!stillActive()) return;
  PageController.goTo(4);
}

/* ============================================================
   SECTION 03 — filmstrip: sợi dây ánh sáng toả ra từ số 9 (crystal ở
   đáy màn hình). Vị trí 9 mốc được tính bằng SVG getPointAtLength()
   nên luôn bám đúng đường cong filmPathBg dù sau này đổi lại path.
   Chạm vào cuộn phim → ánh sáng "chảy" tới mốc kế tiếp (stroke-dashoffset
   của filmPathLit) và mốc đó phát sáng + hiện caption năm/nội dung.
   ============================================================ */
function setupFilmstrip(page){
  const pathBg = page.querySelector('#filmPathBg');   // dùng để đo chiều dài + lấy toạ độ mốc
  const pathLit = page.querySelector('#filmPathLit'); // phần sáng, kéo dài dần bằng dashoffset
  const markersEl = page.querySelector('#filmstripMarkers');
  const captionEl = page.querySelector('#filmstripCaption');
  const yearEl = page.querySelector('#filmstripYear');
  const titleEl = page.querySelector('#filmstripTitle');
  const textEl = page.querySelector('#filmstripText');
  const dotsWrap = page.querySelector('#timelineMiniProgress');
  const total = pathBg.getTotalLength();

  pathLit.style.strokeDasharray = total;
  pathLit.style.strokeDashoffset = total;

  // dựng 9 mốc + 9 dot tiến trình một lần duy nhất, đặt đúng toạ độ trên path
  const markers = MILESTONES.map((m, i) => {
    const pt = pathBg.getPointAtLength(FILMSTRIP_FRACS[i] * total);
    const el = document.createElement('div');
    el.className = 'filmstrip-marker';
    el.style.left = (pt.x / 640 * 100) + '%';
    el.style.top = (pt.y / 480 * 100) + '%';
    el.innerHTML = `<span class="filmstrip-dot"></span><span class="filmstrip-marker-year mono">${m.year}</span>`;
    markersEl.appendChild(el);
    return el;
  });
  dotsWrap.innerHTML = MILESTONES.map(() => '<div class="timeline-mini-dot"></div>').join('');
  const dots = Array.from(dotsWrap.children);

  let idx = -1;
  let autoTimer = null;
  let outroTimer = null;
  const AUTO_DELAY = 3800; // cắt thêm 2s — 3.8s/mốc
  const OUTRO_DELAY = 4200; // riêng nhịp chờ trước khi chạy outro sau "Hôm nay" — nhanh hơn AUTO_DELAY

  function showCaption(i){
    yearEl.textContent = MILESTONES[i].year;
    titleEl.textContent = MILESTONES[i].title;
    textEl.textContent = MILESTONES[i].text;
    captionEl.classList.remove('pop'); void captionEl.offsetWidth; captionEl.classList.add('pop');
  }

  function advance(){
    if(idx >= MILESTONES.length - 1) return;
    idx++;
    pathLit.style.strokeDashoffset = total - FILMSTRIP_FRACS[idx] * total;
    if(idx > 0) markers[idx - 1].classList.add('visited');
    markers.forEach((mk, j) => mk.classList.toggle('lit', j === idx));
    if(dots[idx]) dots[idx].classList.add('done');
    showCaption(idx);
    // mốc cuối "Hôm nay" — sau khi đọc xong, tự chạy chuỗi outro rồi sang Page 5
    if(idx === MILESTONES.length - 1){
      outroTimer = setTimeout(() => runTimelineOutro(page, markers), OUTRO_DELAY);
    }
  }

  // tự động tiến tới mốc kế mỗi AUTO_DELAY — không bắt người xem phải chạm.
  // Chạm tay vẫn hoạt động (tua nhanh), mỗi lần chạm sẽ đặt lại nhịp tự động.
  function scheduleAuto(){
    clearTimeout(autoTimer);
    if(idx >= MILESTONES.length - 1) return;
    autoTimer = setTimeout(() => { advance(); scheduleAuto(); }, AUTO_DELAY);
  }

  function resetAll(){
    clearTimeout(autoTimer);
    clearTimeout(outroTimer);
    idx = -1;
    pathLit.style.strokeDashoffset = total;
    markers.forEach(mk => mk.classList.remove('lit', 'visited', 'awaken', 'fly-in'));
    dots.forEach(d => d.classList.remove('done'));
    captionEl.classList.remove('pop');
    yearEl.textContent = ''; titleEl.textContent = ''; textEl.textContent = '';
    page.querySelector('#filmstripBridge').classList.remove('show');
    page.querySelector('.filmstrip-canvas').classList.remove('slow-breathe');
    const crystalImg = document.querySelector('.crystal-img');
    if(crystalImg) crystalImg.style.filter = '';
  }

  page._filmstripReset = resetAll;
  page._filmstripStart = scheduleAuto; // gọi từ runTimelineIntro khi chrome vừa hiện ra

  const zone = page.querySelector('#filmstripStage');
  let tsx = null;
  zone.addEventListener('pointerdown', (e) => { tsx = e.clientX; e.stopPropagation(); });
  zone.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    if(tsx === null) return;
    if(Math.abs(e.clientX - tsx) < 8){ advance(); scheduleAuto(); } // tap = tua nhanh 1 mốc, rồi tiếp tục tự chạy
    tsx = null;
  });
}

/* ---- Giai đoạn outro của Page 04 — sau mốc "Hôm nay" ----
   Chuỗi hoàn toàn tự động, không cần chạm: cuộn phim chậm lại → ánh sáng
   số 9 mạnh hơn → mọi mốc "được đánh thức" sáng lại lần cuối → câu bridge
   hiện ra → các mốc bay vào tâm sáng (đúng gốc số 9 ở đáy khung) → flash
   ấm vàng/cam → tự chuyển sang Page 5. `page.classList.contains('active')`
   được kiểm tra sau mỗi bước để tự huỷ nếu người xem đã rời trang khác. */
async function runTimelineOutro(page, markers){
  const canvas = page.querySelector('.filmstrip-canvas');
  const captionEl = page.querySelector('#filmstripCaption');
  const bridgeEl = page.querySelector('#filmstripBridge');
  const crystalImg = document.querySelector('.crystal-img');
  const flashEl = document.querySelector('.flash');
  const stillActive = () => page.classList.contains('active');

  if(!stillActive()) return;
  canvas.classList.add('slow-breathe');
  await sleep(900);
  if(!stillActive()) return;

  if(crystalImg) crystalImg.style.filter = 'drop-shadow(0 0 90px rgba(255,201,60,1))';

  for(const mk of markers){
    if(!stillActive()) return;
    mk.classList.add('awaken');
    await sleep(160);
  }
  await sleep(500);
  if(!stillActive()) return;

  captionEl.classList.remove('pop');
  bridgeEl.classList.add('show');
  await sleep(3600); // giữ đọc câu bridge
  if(!stillActive()) return;

  // các mảnh ký ức bay vào đúng gốc số 9 (đáy khung filmstrip-canvas) rồi biến mất
  const canvasRect = canvas.getBoundingClientRect();
  const targetX = canvasRect.left + canvasRect.width * 0.5;
  const targetY = canvasRect.top + canvasRect.height;
  markers.forEach(mk => {
    const r = mk.getBoundingClientRect();
    mk.style.setProperty('--fly-x', (targetX - (r.left + r.width / 2)) + 'px');
    mk.style.setProperty('--fly-y', (targetY - (r.top + r.height / 2)) + 'px');
    mk.classList.add('fly-in');
  });
  await sleep(750);
  if(!stillActive()) return;

  flashEl.classList.add('warm-flash');
  await sleep(800);
  flashEl.classList.remove('warm-flash');
  if(!stillActive()) return;

  PageController.goTo(3); // tự động sang Page 3 (Toả sáng) kế tiếp, không cần người xem bấm
}

/* ---- Giai đoạn 1 của Page 04 — mở page ----
   Đoạn dẫn gõ máy chữ từng dòng (tái dùng typewriteSequence của Page 01),
   gõ xong hết + giữ thêm một nhịp để đọc, rồi mờ đi lộ ra chrome tương tác
   (eyebrow/caption/hint/dots) nằm trên sợi dây ánh sáng. Chạy lại mỗi lần
   quay về trang — opSession tự huỷ phiên gõ dở nếu rời trang giữa chừng. */
async function runTimelineIntro(page){
  const intro = page.querySelector('#filmstripIntro');
  const chrome = page.querySelector('#filmstripChrome');
  const stage = page.querySelector('#filmstripStage');
  const mySession = ++opSession;

  intro.classList.remove('out'); chrome.classList.remove('show'); stage.classList.remove('ready');
  void intro.offsetWidth;
  intro.classList.add('show');

  // nhanh hơn Page 01/04 theo yêu cầu — phần mở này chỉ nên là khúc dạo nhanh
  await typewriteSequence(Array.from(intro.querySelectorAll('.op-line')), mySession,
    { titleSpeed: 30, lineSpeed: 16, prePause: 90, postPause: 130 });
  if(opSession !== mySession) return; // đã rời trang giữa lúc đang gõ

  await sleep(1200); // giữ ngắn lại để đọc xong câu cuối trước khi chuyển
  if(opSession !== mySession) return;

  intro.classList.remove('show');
  intro.classList.add('out');
  chrome.classList.add('show');
  stage.classList.add('ready');
  if(page._filmstripStart) page._filmstripStart(); // 7 mốc tự chạy, không cần chạm
}

/* ============================================================
   SECTION 04 — credits dạng split-screen, không cần chạm:
   ảnh trái hiện trước (như "final frame") → title phải hiện → credit
   cuộn 1 LẦN từ dưới lên trong cột phải (nhóm credit rồi tới tên thật)
   → khi cuộn xong, giữ câu kết 2-3s để đóng trang.
   ============================================================ */
function renderTribute(page){
  // dựng nội dung cuộn 1 lần duy nhất: nhóm credit trước, tên thật sau —
  // KHÔNG nhân đôi (khác bản marquee cũ) vì đây là cuộn 1 lần rồi dừng
  const track = page.querySelector('#creditsScrollTrack');
  const blocksHtml = CREDIT_BLOCKS.map(b => `
    <div class="credits-block">
      <p class="credits-block-head">${b.head}</p>
      <p class="credits-block-body">${b.body}</p>
    </div>`).join('');
  const namesHtml = `<div class="credits-names">${CREDIT_NAMES.map(n => `<div class="credits-item">${n}</div>`).join('')}</div>`;
  track.innerHTML = blocksHtml + namesHtml;
}

let creditsSession = 0;

async function runTribute(page){
  const mySession = ++creditsSession;
  const stillActive = () => creditsSession === mySession && page.classList.contains('active');

  const photoFrame = page.querySelector('#creditsPhotoFrame');
  const titleEl = page.querySelector('#creditsTitle');
  const maskEl = page.querySelector('#creditsScrollMask');
  const trackEl = page.querySelector('#creditsScrollTrack');
  const finalEl = page.querySelector('#creditsFinal');

  // reset — cho phép chạy lại sạch mỗi lần quay lại trang
  photoFrame.classList.remove('show');
  titleEl.classList.remove('show');
  maskEl.classList.remove('show');
  trackEl.style.transition = 'none';
  trackEl.style.transform = 'translateY(0)';
  finalEl.classList.remove('show');

  if(!stillActive()) return;

  // ảnh trái hiện trước, như một "final frame" đặt trên bàn chiếu
  photoFrame.classList.add('show');
  await sleep(700); // 0.5-1s trước khi title bên phải hiện
  if(!stillActive()) return;

  titleEl.classList.add('show');
  await sleep(700);
  if(!stillActive()) return;

  // credit cuộn 1 lần: bắt đầu từ dưới khung nhìn, kết thúc khi cuộn hết
  // hẳn lên trên — khoảng cách + thời lượng tính theo chiều cao nội dung
  // thật (không dùng @keyframes cố định vì danh sách tên có thể đổi dài/ngắn)
  maskEl.classList.add('show');
  void trackEl.offsetHeight; // ép reflow trước khi đo
  const maskH = maskEl.clientHeight;
  const trackH = trackEl.scrollHeight;
  trackEl.style.transform = `translateY(${maskH}px)`;
  void trackEl.offsetHeight;
  const distance = maskH + trackH;
  const duration = Math.max(18, Math.min(60, distance / 40)); // chậm rãi nhưng chặn trần 60s
  trackEl.style.transition = `transform ${duration}s linear`;
  requestAnimationFrame(() => { if(stillActive()) trackEl.style.transform = `translateY(-${trackH}px)`; });
  await sleep(duration * 1000);
  if(!stillActive()) return;

  maskEl.classList.remove('show');
  await sleep(500);
  if(!stillActive()) return;

  // câu kết — giữ đọc rồi tự chuyển sang Page 5
  finalEl.classList.add('show');
  await sleep(2800);
  if(!stillActive()) return;
  PageController.goTo(5);
}

/* ============================================================
   SECTION 05 — ending → gửi lời chúc. Đoạn thơ kết hiện ~3.2s rồi mờ
   đi, lộ ra form gửi lời chúc. Gửi xong: chữ bay vào số 9 (đúng vị trí
   thật của .ending-crystal/.wish-crystal trên màn hình, dùng chung kỹ
   thuật --fly-x/--fly-y như outro Page 02), rồi thật sự gửi đi qua
   WISH_FORM_URL nếu đã cấu hình (xem TODO đầu file).
   ============================================================ */
function submitWish(text){
  if(!WISH_FORM_URL || !WISH_FORM_ENTRY) return; // chưa cấu hình — bỏ qua, không báo lỗi
  const body = new URLSearchParams();
  body.set(WISH_FORM_ENTRY, text);
  fetch(WISH_FORM_URL, { method: 'POST', mode: 'no-cors', body }).catch(() => {});
}

function setupWish(page){
  const form = page.querySelector('#wishForm');
  const input = page.querySelector('#wishInput');
  const confirmEl = page.querySelector('#wishConfirm');
  const crystalImg = page.querySelector('.wish-crystal');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if(!text) return;

    // chữ bay từ ô nhập vào đúng vị trí số 9 trên màn hình rồi biến mất
    const startRect = input.getBoundingClientRect();
    const targetRect = crystalImg.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'wish-flying';
    fly.textContent = text;
    fly.style.left = (startRect.left + startRect.width / 2) + 'px';
    fly.style.top = (startRect.top + startRect.height / 2) + 'px';
    fly.style.setProperty('--fly-x', (targetRect.left + targetRect.width / 2 - (startRect.left + startRect.width / 2)) + 'px');
    fly.style.setProperty('--fly-y', (targetRect.top + targetRect.height / 2 - (startRect.top + startRect.height / 2)) + 'px');
    document.body.appendChild(fly);
    requestAnimationFrame(() => fly.classList.add('fly'));
    setTimeout(() => fly.remove(), 1100);

    submitWish(text);

    form.classList.add('hide');
    input.value = '';
    setTimeout(() => confirmEl.classList.add('show'), 500);
  });
}

let endingSession = 0;
async function runEnding(page){
  const mySession = ++endingSession;
  const stillActive = () => endingSession === mySession && page.classList.contains('active');

  const endingWrap = page.querySelector('#endingWrap');
  const wishStage = page.querySelector('#wishStage');
  const form = page.querySelector('#wishForm');
  const confirmEl = page.querySelector('#wishConfirm');
  const ctaBtn = page.querySelector('#endingCta');

  if(page._endingCtaCancel){ page._endingCtaCancel(); page._endingCtaCancel = null; } // huỷ listener dở dang nếu quay lại trang
  endingWrap.classList.remove('hide-fade');
  wishStage.classList.remove('show');
  form.classList.remove('hide');
  confirmEl.classList.remove('show');

  if(!stillActive()) return;
  // chờ người xem chủ động bấm "Click để gửi lời chúc" — không tự chuyển
  await new Promise(resolve => {
    function onTap(){ ctaBtn.removeEventListener('click', onTap); resolve(); }
    ctaBtn.addEventListener('click', onTap);
    page._endingCtaCancel = () => { ctaBtn.removeEventListener('click', onTap); resolve(); };
  });
  if(!stillActive()) return;

  endingWrap.classList.add('hide-fade');
  await sleep(900);
  if(!stillActive()) return;
  wishStage.classList.add('show');
}

/* ============================================================
   Dispatch per-page enter behaviour
   ============================================================ */
const renderedOnce = new WeakSet();
const timelineInit = new WeakSet();
const wishInit = new WeakSet();
function onPageEnter(page){
  const n = page.dataset.page;
  if(n === '4' || n === '5') playTrack('assets/music-happy-birthday.mp3');
  else playTrack('assets/music-childhood.mp3');
  finalSection = (n === '5'); // Page 5 = đoạn kết → bài HB phát full, không loop sớm
  if(n === '1') runOpening(page);
  if(n === '2'){
    if(!timelineInit.has(page)){ setupFilmstrip(page); timelineInit.add(page); }
    else if(page._filmstripReset) page._filmstripReset();
    runTimelineIntro(page);
  }
  if(n === '3') runFacts(page);
  if(n === '4'){
    if(!renderedOnce.has(page)){ renderTribute(page); renderedOnce.add(page); }
    runTribute(page);
  }
  if(n === '5'){
    if(!wishInit.has(page)){ setupWish(page); wishInit.add(page); }
    runEnding(page);
  }
}
