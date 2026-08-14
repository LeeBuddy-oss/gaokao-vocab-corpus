const WORDS_URL = 'data/words.json';
const INDEX_BASE = 'data/index/';
const MINDMAP_BASE = 'data/mindmap/';
const WORDS_BASE = 'data/words/';
const STATS_URL = 'data/stats.json';

const CATS = [
  { key: 'gaokao',   label: '高考真题', color: 'var(--gaokao)' },
  { key: 'renjiao',  label: '人教版',   color: 'var(--renjiao)' },
  { key: 'waiyan',   label: '外研社',   color: 'var(--waiyan)' },
  { key: 'beishida', label: '北师大',   color: 'var(--beishida)' },
  { key: 'yilin',    label: '译林',     color: 'var(--yilin)' },
];

let WORDS = [];
let WORD_FILES = null;   // 小写/原词 -> "<letter>/<file>.json"（manifest）
let FAMILY_INDEX = null; // 小写形式 -> { seq,cn,verb,noun,adj,adv }（词性变换）
const mmCache = {};      // letter -> { word: mindmap }
let activeIdx = -1;      // suggestion highlight index

// 不规则动词变体表（原形 -> 所有变体）
const IRREGULAR = {
  'be': ['am','is','are','was','were','been','being'],
  'have': ['has','had','having'],
  'do': ['did','done','does','doing'],
  'go': ['went','gone','goes','going'],
  'run': ['ran','runs','running'],
  'come': ['came','comes','coming'],
  'see': ['saw','seen','sees','seeing'],
  'take': ['took','taken','takes','taking'],
  'give': ['gave','given','gives','giving'],
  'know': ['knew','known','knows','knowing'],
  'think': ['thought','thinks','thinking'],
  'get': ['got','gotten','gets','getting'],
  'make': ['made','makes','making'],
  'say': ['said','says','saying'],
  'find': ['found','finds','finding'],
  'tell': ['told','tells','telling'],
  'become': ['became','becomes','becoming'],
  'show': ['showed','shown','shows','showing'],
  'leave': ['left','leaves','leaving'],
  'feel': ['felt','feels','feeling'],
  'put': ['puts','putting'],
  'bring': ['brought','brings','bringing'],
  'begin': ['began','begun','begins','beginning'],
  'keep': ['kept','keeps','keeping'],
  'hold': ['held','holds','holding'],
  'write': ['wrote','written','writes','writing'],
  'stand': ['stood','stands','standing'],
  'hear': ['heard','hears','hearing'],
  'let': ['lets','letting'],
  'mean': ['meant','means','meaning'],
  'set': ['sets','setting'],
  'meet': ['met','meets','meeting'],
  'pay': ['paid','pays','paying'],
  'sit': ['sat','sits','sitting'],
  'speak': ['spoke','spoken','speaks','speaking'],
  'lie': ['lay','lain','lies','lying'],
  'lead': ['led','leads','leading'],
  'read': ['reads','reading'],
  'grow': ['grew','grown','grows','growing'],
  'lose': ['lost','loses','losing'],
  'fall': ['fell','fallen','falls','falling'],
  'send': ['sent','sends','sending'],
  'build': ['built','builds','building'],
  'understand': ['understood','understands','understanding'],
  'draw': ['drew','drawn','draws','drawing'],
  'break': ['broke','broken','breaks','breaking'],
  'spend': ['spent','spends','spending'],
  'cut': ['cuts','cutting'],
  'rise': ['rose','risen','rises','rising'],
  'drive': ['drove','driven','drives','driving'],
  'buy': ['bought','buys','buying'],
  'wear': ['wore','worn','wears','wearing'],
  'choose': ['chose','chosen','chooses','choosing'],
  'eat': ['ate','eaten','eats','eating'],
  'sleep': ['slept','sleeps','sleeping'],
  'catch': ['caught','catches','catching'],
  'drink': ['drank','drunk','drinks','drinking'],
  'fly': ['flew','flown','flies','flying'],
  'sing': ['sang','sung','sings','singing'],
  'swim': ['swam','swum','swims','swimming'],
  'throw': ['threw','thrown','throws','throwing'],
  'fight': ['fought','fights','fighting'],
  'ride': ['rode','ridden','rides','riding'],
  'seek': ['sought','seeks','seeking'],
  'teach': ['taught','teaches','teaching'],
  'stick': ['stuck','sticks','sticking'],
  'beat': ['beat','beaten','beats','beating'],
  'blow': ['blew','blown','blows','blowing'],
  'burn': ['burnt','burned','burns','burning'],
  'dig': ['dug','digs','digging'],
  'hang': ['hung','hanged','hangs','hanging'],
  'hide': ['hid','hidden','hides','hiding'],
  'hit': ['hits','hitting'],
  'hurt': ['hurts','hurting'],
  'lay': ['laid','lays','laying'],
  'deal': ['dealt','deals','dealing'],
  'feed': ['fed','feeds','feeding'],
  'ring': ['rang','rung','rings','ringing'],
  'shake': ['shook','shaken','shakes','shaking'],
  'shut': ['shuts','shutting'],
  'spread': ['spreads','spreading'],
  'strike': ['struck','strikes','striking'],
  'sweep': ['swept','sweeps','sweeping'],
  'wake': ['woke','woken','wakes','waking'],
  'bet': ['bets','betting'],
  'bend': ['bent','bends','bending'],
  'bind': ['bound','binds','binding'],
  'bleed': ['bled','bleeds','bleeding'],
  'breed': ['bred','breeds','breeding'],
  'cast': ['casts','casting'],
  'creep': ['crept','creeps','creeping'],
  'dwell': ['dwelt','dwells','dwelling'],
  'flee': ['fled','flees','fleeing'],
  'forbid': ['forbade','forbidden','forbids','forbidding'],
  'forgive': ['forgave','forgiven','forgives','forgiving'],
  'freeze': ['froze','frozen','freezes','freezing'],
  'kneel': ['knelt','kneels','kneeling'],
  'lean': ['leant','leaned','leans','leaning'],
  'leap': ['leapt','leaped','leaps','leaping'],
  'shine': ['shone','shined','shines','shining'],
  'slide': ['slid','slides','sliding'],
  'sow': ['sowed','sown','sows','sowing'],
  'speed': ['sped','speeded','speeds','speeding'],
  'spell': ['spelt','spelled','spells','spelling'],
  'spill': ['spilt','spilled','spills','spilling'],
  'spin': ['spun','spins','spinning'],
  'spit': ['spat','spits','spitting'],
  'split': ['splits','splitting'],
  'spoil': ['spoilt','spoiled','spoils','spoiling'],
  'steal': ['stole','stolen','steals','stealing'],
  'sting': ['stung','stings','stinging'],
  'stride': ['strode','strides','striding'],
  'string': ['strung','strings','stringing'],
  'strive': ['strove','striven','strives','striving'],
  'swear': ['swore','sworn','swears','swearing'],
  'tear': ['tore','torn','tears','tearing'],
  'tread': ['trod','trodden','treads','treading'],
  'weave': ['wove','woven','weaves','weaving'],
  'wind': ['wound','winds','winding'],
  'withdraw': ['withdrew','withdrawn','withdraws','withdrawing'],
  'withhold': ['withheld','withholds','withholding'],
  'withstand': ['withstood','withstands','withstanding'],
};

const $search = document.getElementById('search');
const $suggest = document.getElementById('suggest');
const $result = document.getElementById('result');
const $empty = document.getElementById('empty');

/* ========== 邮箱密码登录 + 使用统计（腾讯云 CloudBase） ========== */
const CLOUDBASE_ENV = (window.CB_CONFIG && window.CB_CONFIG.env) || '';
const $overlay   = document.getElementById('auth-overlay');
const $authMsg   = document.getElementById('auth-msg');
const $loginForm = document.getElementById('login-form');
const $regForm   = document.getElementById('register-form');

let CLOUDBASE_AUTH = null;
let CLOUDBASE_DB   = null;
let CLOUDBASE_UID  = null;   // 当前用户 UID（统计口径：独立用户）
let STATS_READY    = false;  // 统计可用标记

function setAuthMsg(text, ok) {
  if (!text) { $authMsg.hidden = true; return; }
  $authMsg.textContent = text;
  $authMsg.className = 'auth-msg' + (ok ? ' ok' : '');
  $authMsg.hidden = false;
}

function showAuthOverlay() {
  $overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function hideAuthOverlay() {
  $overlay.hidden = true;
  document.body.style.overflow = '';
}

// 登录 / 注册表单切换
function switchAuthForm(showLogin) {
  $loginForm.hidden = !showLogin;
  $regForm.hidden = showLogin;
  setAuthMsg('');
}

/* ---------- 统计埋点（visits / queries 两个集合） ---------- */
function todayStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

// 页面访问（PV）：登录成功/恢复登录态时写入一条
function trackVisit() {
  if (!STATS_READY || !CLOUDBASE_UID || !CLOUDBASE_DB) return;
  CLOUDBASE_DB.collection('visits').add({
    uid: CLOUDBASE_UID, ts: Date.now(), date: todayStr()
  }).catch(e => console.warn('[stats] 访问统计失败', e));
}

// 查询统计：内存缓冲，满 10 条或 15 秒批量写入，避免频繁请求
const statQueue = [];
let statTimer = null;

function trackQuery(word) {
  if (!STATS_READY || !CLOUDBASE_UID || !word || !CLOUDBASE_DB) return;
  statQueue.push({
    uid: CLOUDBASE_UID,
    word: String(word).toLowerCase().trim(),
    ts: Date.now(),
    date: todayStr()
  });
  if (statQueue.length >= 10) flushStats();
  else if (!statTimer) statTimer = setTimeout(flushStats, 15000);
}

async function flushStats() {
  if (!statQueue.length || !CLOUDBASE_DB) return;
  const batch = statQueue.splice(0, statQueue.length);
  statTimer = null;
  try {
    await CLOUDBASE_DB.collection('queries').add(batch);
  } catch (e) {
    console.warn('[stats] 查询统计上报失败', e);
  }
}

// 页面离开前尽力上报剩余统计
window.addEventListener('pagehide', () => {
  if (statQueue.length && STATS_READY && CLOUDBASE_DB) {
    const batch = statQueue.splice(0, statQueue.length);
    CLOUDBASE_DB.collection('queries').add(batch).catch(() => {});
  }
});

/* ---------- 初始化：邮箱密码登录 ---------- */
async function initAuth() {
  // 未配置环境 ID 时进入开发模式：跳过登录，直接可用（本地预览/未启用前不锁站）
  if (!CLOUDBASE_ENV || typeof cloudbase === 'undefined') {
    hideAuthOverlay();
    console.warn('[auth] CloudBase 未配置，开发模式：跳过登录');
    return;
  }
  try {
    const app = cloudbase.init({ env: CLOUDBASE_ENV });
    CLOUDBASE_AUTH = app.auth();
    // 数据库用于统计；若环境不支持文档型数据库，仅关闭统计，不影响登录
    try {
      CLOUDBASE_DB = app.database();
    } catch (dbErr) {
      console.warn('[auth] 文档数据库不可用，统计功能已关闭', dbErr);
      CLOUDBASE_DB = null;
    }
    CLOUDBASE_AUTH.onLoginStateChanged(user => {
      if (user) {
        if (!CLOUDBASE_UID) {
          CLOUDBASE_UID = user.uid;
          if (CLOUDBASE_DB) {
            STATS_READY = true;
            trackVisit();
          }
        }
        updateLogoutBtn(true);
        hideAuthOverlay();
      } else {
        updateLogoutBtn(false);
        showAuthOverlay();
      }
    });
    // 已有登录态自动恢复（30 天有效），无需重复登录
    const state = await CLOUDBASE_AUTH.getLoginState();
    if (state && state.user) {
      CLOUDBASE_UID = state.user.uid;
      if (CLOUDBASE_DB) {
        STATS_READY = true;
      }
      updateLogoutBtn(true);
      hideAuthOverlay();
      trackVisit();
      return;
    }
    showAuthOverlay();
  } catch (e) {
    console.error('[auth] CloudBase 初始化失败，放行访问', e);
    hideAuthOverlay();
  }
}

// 从 CloudBase 错误码提取用户可读的错误信息
function authErrorMessage(e, fallback) {
  const code = e && (e.code || e.errCode || '') || '';
  const msg = (e && (e.message || e.errMsg)) || '';
  if (code.includes('network') || msg.includes('network')) return '网络异常，请检查网络后重试';
  if (code.includes('user-not-found') || msg.includes('user not found') || msg.includes('不存在')) return '该邮箱尚未注册，请先注册账号';
  if (code.includes('wrong-password') || msg.includes('password') || msg.includes('密码错误')) return '密码错误，请重试';
  if (code.includes('email-exists') || msg.includes('exists') || msg.includes('已注册')) return '该邮箱已注册，请直接登录';
  if (code.includes('invalid-email') || msg.includes('email')) return '邮箱格式不正确';
  if (code.includes('weak-password') || msg.includes('weak')) return '密码太简单，请至少使用 6 位';
  return fallback;
}

// 登录
$loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pwd = document.getElementById('login-pwd').value;
  if (!email || !pwd) { setAuthMsg('请输入邮箱和密码'); return; }
  if (!CLOUDBASE_AUTH) { hideAuthOverlay(); return; }
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = '登录中…';
  setAuthMsg('');
  try {
    await CLOUDBASE_AUTH.signInWithEmailAndPassword(email, pwd);
    // 登录成功后的界面切换由 onLoginStateChanged 处理
  } catch (err) {
    setAuthMsg(authErrorMessage(err, '登录失败，请重试'));
    btn.disabled = false;
    btn.textContent = '🔑 登录并进入查询';
  }
});

// 注册：注册成功即自动登录（CloudBase 邮箱注册后默认已登录）
$regForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('reg-email').value.trim();
  const pwd = document.getElementById('reg-pwd').value;
  const pwd2 = document.getElementById('reg-pwd2').value;
  if (!email || !pwd) { setAuthMsg('请输入邮箱和密码'); return; }
  if (pwd.length < 6) { setAuthMsg('密码至少需要 6 位'); return; }
  if (pwd !== pwd2) { setAuthMsg('两次输入的密码不一致'); return; }
  if (!CLOUDBASE_AUTH) { hideAuthOverlay(); return; }
  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.textContent = '注册中…';
  setAuthMsg('');
  try {
    await CLOUDBASE_AUTH.signUpWithEmailAndPassword(email, pwd);
    // 注册成功后自动登录，由 onLoginStateChanged 进入站点
  } catch (err) {
    setAuthMsg(authErrorMessage(err, '注册失败，请重试'));
    btn.disabled = false;
    btn.textContent = '📝 注册并进入';
  }
});

// 忘记密码：发送重置邮件
document.getElementById('forgot-link').addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  if (!email) { setAuthMsg('请先在邮箱栏输入注册邮箱，再点击"忘记密码"'); return; }
  if (!CLOUDBASE_AUTH) return;
  setAuthMsg('正在发送重置邮件…');
  try {
    await CLOUDBASE_AUTH.sendPasswordResetEmail(email);
    setAuthMsg('重置邮件已发送，请登录邮箱按提示设置新密码', true);
  } catch (err) {
    setAuthMsg(authErrorMessage(err, '发送失败，请确认邮箱已注册'));
  }
});

// 表单切换
document.getElementById('to-register-link').addEventListener('click', (e) => {
  e.preventDefault();
  switchAuthForm(false);
});
document.getElementById('back-to-login-link').addEventListener('click', (e) => {
  e.preventDefault();
  switchAuthForm(true);
});

// 退出登录
const $logoutBtn = document.getElementById('logout-btn');
function updateLogoutBtn(show) {
  if ($logoutBtn) $logoutBtn.hidden = !show;
}
$logoutBtn.addEventListener('click', async () => {
  if (!CLOUDBASE_AUTH) return;
  try {
    await CLOUDBASE_AUTH.signOut();
    updateLogoutBtn(false);
    showAuthOverlay();
    switchAuthForm(true);
  } catch (e) {
    console.warn('[auth] 退出失败', e);
  }
});

init();

async function init() {
  await initAuth(); // 先处理登录（未配置时自动跳过）
  loadStats();
  try {
    const [wr, mr] = await Promise.all([fetch(WORDS_URL), fetch(WORDS_BASE + 'manifest.json')]);
    WORDS = wr.ok ? await wr.json() : [];
    WORD_FILES = mr.ok ? await mr.json() : null;
  } catch (e) {
    console.error('加载词表失败', e);
  }
  bindEvents();
  // 预热首页示例词的字母思维导图（identify/ability/improve/culture/environment → i,a,m,c,e）
  ['i', 'a', 'm', 'c', 'e'].forEach(preload);
}

function loadStats() {
  fetch(STATS_URL).then(r => (r.ok ? r.json() : null)).then(s => {
    if (!s) return;
    document.getElementById('stats').innerHTML =
      `<span class="stat-box box-red"><b>${s.words}</b> 课标词</span>` +
      `<span class="stat-box box-yellow"><b>${fmt(s.cats.gaokao)}</b> 真题例句</span>` +
      `<span class="stat-box box-green"><b>${fmt(s.totalTextbook)}</b> 教材例句</span>`;
  }).catch(() => {});
}

function bindEvents() {
  $search.addEventListener('input', onInput);
  $search.addEventListener('keydown', onKey);
  $search.addEventListener('blur', () => setTimeout(hideSuggest, 150));
  $suggest.addEventListener('mousedown', e => {
    const li = e.target.closest('li');
    if (li) { e.preventDefault(); choose(li.dataset.word); }
  });
}

function onInput() {
  const q = $search.value.trim().toLowerCase();
  if (!q) { hideSuggest(); return; }
  // 边打字边预热该字母的数据，查询时几乎零等待
  const letter = (/^[a-z]/i.test(q) ? q[0] : '#');
  preload(letter);
  const matches = WORDS.filter(w => w.w.toLowerCase().startsWith(q))
    .concat(WORDS.filter(w => !w.w.toLowerCase().startsWith(q) && w.w.toLowerCase().includes(q)))
    .slice(0, 12);
  renderSuggest(matches);
}

function renderSuggest(matches) {
  if (!matches.length) { hideSuggest(); return; }
  $suggest.innerHTML = matches.map((m, i) =>
    `<li data-word="${esc(m.w)}" class="${i === activeIdx ? 'active' : ''}">` +
    `<span class="sw">${esc(m.w)}</span>` +
    (m.ph ? `<span class="sp">/${esc(m.ph)}/</span>` : '') +
    `</li>`).join('');
  $suggest.hidden = false;
  activeIdx = -1;
}

function onKey(e) {
  const items = [...$suggest.querySelectorAll('li')];
  if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, items.length - 1); highlight(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); highlight(); }
  else if (e.key === 'Enter') {
    if (activeIdx >= 0 && items[activeIdx]) choose(items[activeIdx].dataset.word);
    else search($search.value.trim());
  } else if (e.key === 'Escape') { hideSuggest(); }
}
function highlight() {
  [...$suggest.querySelectorAll('li')].forEach((li, i) => li.classList.toggle('active', i === activeIdx));
}
function hideSuggest() { $suggest.hidden = true; $suggest.innerHTML = ''; }

function choose(word) {
  $search.value = word;
  hideSuggest();
  search(word);
}

/* ========== 数据加载（极速单字查询） ==========
 * 每个词独立成文件 data/words/<letter>/<safe>.json，查询只下载该词（~10–40KB），
 * 不再下载整个字母的 MB 级大文件；manifest.json 记录 词→文件路径 的精确映射。
 * 思维导图仍按字母分片（较小，~43KB）并在后台预热。
 */
async function ensureMindmap(letter) {
  if (mmCache[letter]) return mmCache[letter];
  try {
    const r = await fetch(MINDMAP_BASE + letter + '.json');
    mmCache[letter] = r.ok ? await r.json() : {};
  } catch (e) {
    mmCache[letter] = {};
  }
  return mmCache[letter];
}

// 后台预热思维导图（不阻塞输入）
function preload(letter) {
  if (!letter || letter === '#') return;
  ensureMindmap(letter);
}

// 词性变换表（词汇家族表）数据：首次查询时懒加载一次
async function ensureFamily() {
  if (FAMILY_INDEX) return FAMILY_INDEX;
  try {
    const r = await fetch('data/family.json');
    if (r.ok) {
      const data = await r.json();
      FAMILY_INDEX = data.index || {};
    }
  } catch (e) {
    FAMILY_INDEX = FAMILY_INDEX || {};
  }
  return FAMILY_INDEX;
}

// 为单词生成规则时态/数/级变体
function _addRegularForms(w, variants) {
  // 第三人称单数
  variants.add(w + 's');
  if (/[sxz]$/.test(w) || /[sc]h$/.test(w)) {
    variants.add(w + 'es');
  } else if (/[^aeiou]y$/.test(w)) {
    variants.add(w.slice(0, -1) + 'ies');
  } else if (/o$/.test(w)) {
    variants.add(w + 'es');
  }

  // 过去式 / 过去分词
  variants.add(w + 'ed');
  if (w.endsWith('e')) {
    variants.add(w + 'd');
  } else if (/[^aeiou]y$/.test(w)) {
    variants.add(w.slice(0, -1) + 'ied');
  }

  // 现在分词
  variants.add(w + 'ing');
  if (w.endsWith('e')) {
    variants.add(w.slice(0, -1) + 'ing');
  }

  // 名词复数
  if (/[sxz]$/.test(w) || /[sc]h$/.test(w)) {
    variants.add(w + 'es');
  } else if (/[^aeiou]y$/.test(w)) {
    variants.add(w.slice(0, -1) + 'ies');
  }

  // 形容词/副词常见派生
  variants.add(w + 'er');
  variants.add(w + 'est');
  variants.add(w + 'ly');
  variants.add(w + 'ness');
  variants.add(w + 'ment');
}

// 获取单词的所有变体（family.json + 不规则动词 + 规则变化）
function _getWordVariants(word) {
  const w = word.toLowerCase();
  const variants = new Set();

  // 1. family.json 词族变体
  const fam = FAMILY_INDEX && FAMILY_INDEX[w];
  if (fam) {
    for (const k of ['verb','noun','adj','adv']) {
      const v = (fam[k] || '').trim();
      if (!v) continue;
      for (const part of v.split(/[\/\n]/)) {
        const p = part.trim().toLowerCase();
        if (p && p !== w) variants.add(p);
      }
    }
  }

  // 2. 不规则动词变体
  if (IRREGULAR[w]) {
    for (const v of IRREGULAR[w]) {
      if (v !== w) variants.add(v);
    }
  }

  // 3. 规则时态/数/级变化（所有词都生成，family.json 已记录的变体不会重复加入）
  _addRegularForms(w, variants);

  return Array.from(variants).filter(v => v && v !== w);
}

// 把用户输入解析成 manifest 中的原始词键（处理大小写/特殊词）
function resolveKey(word) {
  if (WORD_FILES && WORD_FILES[word]) return word;
  const low = word.toLowerCase();
  if (WORD_FILES && WORD_FILES[low]) return low;
  // 退而求其次：用已加载词表找大小写匹配的原文
  const hit = WORDS.find(w => w.w.toLowerCase() === low);
  return hit ? hit.w : null;
}

async function search(rawWord) {
  const word = (rawWord || '').trim();
  if (!word) return;
  const letter = (/^[a-z]/i.test(word) ? word[0].toLowerCase() : '#');
  // 确保 manifest 已就绪（首次极快）
  if (!WORD_FILES) {
    try {
      const r = await fetch(WORDS_BASE + 'manifest.json');
      if (r.ok) WORD_FILES = await r.json();
    } catch (e) {}
  }
  const key = resolveKey(word);
  if (!key) { $empty.hidden = true; renderNotFound(word); return; }
  const rel = WORD_FILES[key];
  if (!rel) { $empty.hidden = true; renderNotFound(word); return; }

  showLoading(true);
  try {
    // 词条（小文件）、思维导图（已预热）、词性变换表 并行加载
    const [res] = await Promise.all([fetch(WORDS_BASE + rel), ensureMindmap(letter), ensureFamily()]);
    if (!res.ok) { renderNotFound(word); return; }
    const entry = await res.json();
    const fam = (FAMILY_INDEX && FAMILY_INDEX[word.toLowerCase()]) ? FAMILY_INDEX[word.toLowerCase()] : null;
    const variants = _getWordVariants(word);
    $empty.hidden = true;
    const mmHtml = renderMindMap(word, entry);
    renderEntry(entry, word, mmHtml, fam, variants);
    trackQuery(word); // 统计埋点：记录本次查询
  } catch (e) {
    console.error(e);
  } finally {
    showLoading(false);
  }
}

function showLoading(on) {
  const el = document.getElementById('loading');
  if (el) el.hidden = !on;
}

function renderNotFound(word) {
  $result.innerHTML = `<div class="notfound">未找到「${esc(word)}」。试试课标词表里的其它词～</div>`;
}

/* ========== 词汇风向标渲染器（词组搭配 + 高频表达） ========== */

// 从词条数据中提取风向标统计——核心：词组/搭配/高频表达
function analyzeWindVane(word, entry) {
  const meta = entry.meta || {};
  const defs = entry.defs || [];
  const mm = _getMmData(word);

  let totalGaokao = 0, totalTextbook = 0;
  const srcSet = new Set();
  const phraseMap = {};       // 短语 → 出现次数
  const patternMap = {};      // 结构模式 → 次数（如 "distinguish between", "distinguish from"）
  const posPatternMap = {};   // 按词性分类的搭配：verb-phrase, prep-phrase, noun-phrase 等

  defs.forEach((d) => {
    const exs = d.ex || [];
    exs.forEach(ex => {
      const src = ex.src || '';
      srcSet.add(src);
      if (isGaokaoSrc(src)) totalGaokao++;
      else totalTextbook++;

      // 提取含查询词的短语和搭配
      _extractCollocations(ex.s || '', word, phraseMap, patternMap, posPatternMap);
    });
  });

  // 合并思维导图中的短语数据（补充）
  if (mm && mm.right) {
    mm.right.forEach(p => {
      const ph = (p.phrase || '').trim().toLowerCase();
      if (ph && ph.length >= word.length + 2) {
        phraseMap[ph] = Math.max(phraseMap[ph] || 0, p.cnt || 0);
        // 也归类到结构模式
        const struct = _classifyPhraseStruct(ph, word);
        if (struct) { patternMap[struct] = Math.max(patternMap[struct] || 0, p.cnt || 0); }
      }
    });
  }

  // Top 搭配（按频次排序，去重变体，取 top 8）
  const topPhrases = _dedupePhrases(Object.entries(phraseMap)
    .sort(([,a], [,b]) => b - a)
    .map(([ph, cnt]) => ({ ph, cnt })), word)
    .slice(0, 8);

  // 结构化搭配分类
  const categories = _categorizePatterns(patternMap, posPatternMap, word);

  // 文体检测
  const genres = _detectGenres([...srcSet]);

  return {
    word,
    pos: meta.pos || '',
    total: totalGaokao + totalTextbook,
    totalGaokao,
    totalTextbook,
    phrases: topPhrases,
    categories,
    genres,
    hasData: totalGaokao + totalTextbook > 0 || topPhrases.length > 0,
  };
}

// 判断是否高考来源
function isGaokaoSrc(src) {
  if (!src) return false;
  const s = src.toLowerCase();
  return s.includes('高考') || s.includes('全国') || s.includes('新高考') ||
         s.includes('北京') || s.includes('天津') || s.includes('浙江') ||
         s.includes('江苏') || s.includes('卷') || s.includes('上海');
}

// ====== 从句子中提取搭配和词组 ======
function _extractCollocations(sentence, word, phraseMap, patternMap, posPatternMap) {
  if (!sentence || !word) return;
  const w = word.toLowerCase();
  const words = sentence.split(/\s+/);

  // 找到查询词在句子中的所有位置
  for (let i = 0; i < words.length; i++) {
    const cleanW = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (cleanW !== w && !cleanW.startsWith(w)) continue;

    // 提取窗口内的短语（前后各取1-3个词）
    for (let pre = Math.max(0, i - 3); pre <= i; pre++) {
      for (let post = i; post < Math.min(words.length, i + 4); post++) {
        const phWords = words.slice(pre, post + 1).map(x => x.replace(/[^a-zA-Z']/g, ''));
        const ph = phWords.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
        if (ph.length >= w.length + 3 && ph.length <= 35 && ph.includes(w)) {
          phraseMap[ph] = (phraseMap[ph] || 0) + 1;
          // 分类到结构模式
          const struct = _classifyPhraseStruct(ph, word);
          if (struct) {
            patternMap[struct] = (patternMap[struct] || 0) + 1;
            // 词性分类
            const cat = _phraseCategory(struct);
            if (cat) { posPatternMap[cat] = (posPatternMap[cat] || 0) + 1; }
          }
        }
      }
    }
  }
}

// 判断短语结构类型（如 "distinguish between" → between型介词搭配）
function _classifyPhraseStruct(ph, target) {
  if (!ph || !target) return null;
  const t = target.toLowerCase();
  const idx = ph.indexOf(t);
  if (idx === -1) return null;

  const after = ph.slice(idx + t.length).trim().split(/\s+/)[0];
  const before = ph.slice(0, idx).trim().split(/\s+/).pop();

  let struct = '';
  if (/^(from|between|with|by|into|as|for|to|in|on|at|of|through|against|upon|among|within|over|under|about|around|after|before|like|near|across|along|behind|beyond|down|off|out|up)$/i.test(after)) {
    struct = `${target} ${after}`;           // 介词搭配
  } else if (/^(can|could|will|would|should|may|might|must|shall|need|dare|used|had|is|are|was|were|be|been|being|do|does|did|have|has|had|to)$/i.test(before)) {
    struct = `${before} ${target}`;          // 动词变形 / 情态动词
  } else if (after && /^[a-z]{2,}$/i.test(after)) {
    struct = `${target} ${after}`;           // 一般名词/形容词后接
  } else if (before && /^[a-z]{2,}$/i.test(before)) {
    struct = `${before} ${target}`;
  }
  return struct || null;
}

// 短语归类到词性类别
function _phraseCategory(struct) {
  if (!struct) return null;
  const parts = struct.split(/\s+/);
  const first = (parts[0] || '').toLowerCase();
  // 常见情态/助动词 → 动词词组
  if (/^(can|could|will|would|should|may|might|must|shall|do|does|did|have|has|had|be|is|are|was|were|to)$/i.test(first)) return '动词词组';
  // 介词 → 介词词组
  if (/^(from|between|with|by|into|as|for|to|in|on|at|of|through|against|upon|among|within|over|under|about|around|after|before|like|near|across|along|behind|beyond|down|off|out|up)$/i.test(parts[parts.length - 1] || '')) return '介词词组';
  // -ed/-ing 结尾 → 分词词组
  if (/-(ed|ing)$/.test(parts[parts.length - 1] || '')) return '分词词组';
  // 名词性（a/an/the + n 或纯名词）
  if (/^(a|an|the)$/i.test(first)) return '名词词组';
  return '其他搭配';
}

// 去重短语变体（如 "distinguish between a" 和 "distinguish between b" 合并为 "distinguish between"）
function _dedupePhrases(phrases, word) {
  const seen = new Set();
  const result = [];
  phrases.forEach(p => {
    // 归一化：去掉末尾的冠词/代词/短词来找核心结构
    const core = p.ph.replace(/\s+(a|an|the|it|this|that|these|those|his|her|their|my|your|our|one|two|three|some|any|no|every|each|all|both|few|many|much|more|most|other|another|such|what|which|who|whom|whose)\b.*$/i, '').trim();
    if (core.length >= word.length + 2 && !seen.has(core)) {
      seen.add(core);
      result.push({ ...p, display: p.ph, core });
    } else if (seen.has(core)) {
      // 累加计数到已存在的核心
      const existing = result.find(r => r.core === core);
      if (existing) existing.cnt += p.cnt;
    }
  });
  // 重新按累计频次排序
  result.sort((a, b) => b.cnt - a.cnt);
  return result;
}

// 分类汇总搭配模式
function _categorizePatterns(patternMap, posPatternMap, word) {
  const cats = [];
  Object.entries(posPatternMap).sort(([,a],[,b]) => b - a).forEach(([cat, cnt]) => {
    // 找该类别下的代表短语
    const examples = Object.entries(patternMap)
      .filter(([s]) => _phraseCategory(_classifyPhraseStruct(s, word)) === cat)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 4)
      .map(([s, c]) => ({ ph: s, c }));
    cats.push({ cat, cnt, examples });
  });
  return cats;
}

// 检测文体类型
function _detectGenres(sources) {
  const genres = { count: 0, types: [] };
  const typeCount = {};
  sources.forEach(src => {
    let t = '其他';
    if (/阅读理解|七选五/.test(src)) t = '阅读理解';
    else if (/语法填空|完形填空/.test(src)) t = '填空/完形';
    else if (/书面表达|写作|作文/.test(src)) t = '写作';
    else if (/听力/.test(src)) t = '听力';
    typeCount[t] = (typeCount[t] || 0) + 1;
    genres.count++;
  });
  genres.types = Object.entries(typeCount).sort(([,a],[,b]) => b - a).map(([t,c]) => ({ t, c }));
  return genres;
}

// 获取思维导图缓存数据
function _getMmData(word) {
  const letter = (/^[a-z]/i.test(word) ? word[0].toLowerCase() : '#');
  const cache = mmCache[letter];
  if (!cache) return null;
  return cache[word] || cache[word.toLowerCase()] || null;
}

// ====== 从释义中提取中文部分 ======
function _extractCnFromDef(defText) {
  if (!defText) return '';
  // 找到第一个中文字符，截取从它开始的所有内容
  const cnIdx = defText.search(/[\u4e00-\u9fff]/);
  if (cnIdx === -1) return defText.slice(0, 20);
  return defText.slice(cnIdx).trim();
}

// ====== 结构签名：把零散 n-gram 合并为语法结构 ======
const ST_PARTICLES = new Set(['out','up','in','off','down','away','back','on','over','through','into','aside','around','forward','together','apart']);
const ST_OBJ = new Set(['it','this','that','them','these','those','what','which','something','anything','nothing','everything','him','her','us','me','you','one','all','some','any','each','both','my','your','our','their','his','its','the','a','an']);
const ST_PREP = new Set(['in','on','at','by','for','with','from','to','of','about','into','through','over','under','after','before','like','near','across','along','behind','beyond','down','off','up','out','as','than','between','among','within','without','against','upon','via','per','despite','during']);
const ST_DET = new Set(['the','a','an','my','your','our','their','his','her','its','this','that','these','those','some','any','each','every','such','what','which','whose','both','all','no','another']);
const ST_AUX = new Set(['can','could','will','would','should','may','might','must','shall','do','does','did','have','has','had','be','is','are','was','were','been','being','to']);

// 依据目标词前后相邻词，判定其结构签名（动词短语 / 动宾 / 介词短语 / 其他）
function _structSignature(beforeRaw, afterRaw, word) {
  const w = word.toLowerCase();
  const after = (afterRaw || '').toLowerCase().replace(/[^a-z']/g, '');
  const before = (beforeRaw || '').toLowerCase().replace(/[^a-z']/g, '');
  if (after && ST_PARTICLES.has(after)) return { sig: w + ' ' + after, cat: '动词词组' };
  if (before && ST_AUX.has(before)) {
    if (before === 'to') return { sig: 'to ' + w, cat: '动词词组' };  // 不定式单独标记，稍后并入短语动词或动词桶
    return { sig: w + '(动词)', cat: '动词词组' };
  }
  if (before && ST_PREP.has(before)) return { sig: before + ' ' + w, cat: '介词词组' };
  if (after && ST_PREP.has(after)) {
    // 目标词后接介词：前面是限定词（名词短语）→ 介词词组；否则多为介词动词 → 动词词组
    if (before && ST_DET.has(before)) return { sig: w + ' ' + after, cat: '介词词组' };
    return { sig: w + ' ' + after, cat: '动词词组' };
  }
  if (after && (ST_OBJ.has(after) || /^[a-z]{3,}$/.test(after))) return { sig: w + '+名词/代词', cat: '动宾结构' };
  return { sig: w + '(独立用法)', cat: '其他搭配' };
}

// 从句子中为每个目标词出现点标注一个结构签名（每个出现点只计一次，避免滑动窗口重复）
function _extractStructures(sentence, word, structMap, catMap, sigCat) {
  if (!sentence || !word) return;
  const w = word.toLowerCase();
  const words = sentence.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const clean = words[i].toLowerCase().replace(/[^a-z']/g, '');
    if (clean !== w && !clean.startsWith(w)) continue;
    const afterRaw = i + 1 < words.length ? words[i + 1] : '';
    const beforeRaw = i - 1 >= 0 ? words[i - 1] : '';
    const r = _structSignature(beforeRaw, afterRaw, word);
    if (r && r.sig) {
      structMap[r.sig] = (structMap[r.sig] || 0) + 1;
      catMap[r.cat] = (catMap[r.cat] || 0) + 1;
      sigCat[r.sig] = r.cat;
    }
  }
}

// 归一化动词结构：把情态/助动词+动词 合并为 "word(动词)" 桶；
// 不定式 "to word" 在其主导短语动词明显占优时并入该短语动词（如 to figure → figure out），
// 否则并入动词桶，避免把 to make 错并到 make up。
function _normalizeVerb(structMap, sigCat, word) {
  const w = word.toLowerCase();
  const verbKey = w + '(动词)';
  let dom = '', dc = 0;
  Object.keys(sigCat).forEach(s => {
    if (sigCat[s] === '动词词组' && s.indexOf(' ') !== -1) {
      const c = structMap[s] || 0;
      if (c > dc) { dc = c; dom = s; }
    }
  });
  const verbCnt = structMap[verbKey] || 0;
  const toKey = 'to ' + w;
  if (structMap[toKey]) {
    if (dom && dc >= verbCnt) structMap[dom] += structMap[toKey];
    else structMap[verbKey] = verbCnt + structMap[toKey];
    delete structMap[toKey];
    delete sigCat[toKey];
  }
  if (structMap[verbKey]) sigCat[verbKey] = '动词词组';
}

function _topSig(structMap, sigCat, cat) {
  let best = '', bc = -1;
  Object.keys(sigCat).forEach(s => {
    if (sigCat[s] === cat && (structMap[s] || 0) > bc) { bc = structMap[s] || 0; best = s; }
  });
  return best;
}

function _deriveUsagePos(catMap, metaPos) {
  const verbish = (catMap['动词词组'] || 0) + (catMap['动宾结构'] || 0);
  const nounish = (catMap['介词词组'] || 0) + (catMap['名词词组'] || 0);
  if (verbish > 0 && verbish >= nounish) return '动词（含短语动词）';
  if (nounish > 0 && nounish > verbish) return '名词';
  return metaPos || '多词性';
}

// ====== POS 归一化 ======
function _normalizePos(pos) {
  const p = (pos || '').toLowerCase();
  if (p.includes('verb') || p.includes('; v') || p === 'v.') return 'verb';
  if (p.includes('noun') || p === 'n.') return 'noun';
  if (p.includes('adj')) return 'adj';
  if (p.includes('adv')) return 'adv';
  if (p.includes('prep')) return 'prep';
  if (p.includes('pron')) return 'pron';
  return 'other';
}

// 强动词信号：不与介词重叠的小品词（out/up/off 等几乎只用于动词短语）
const ST_VERB_PARTICLE = new Set(['out','up','off','away','back','aside','apart','together']);

// 从语料实际用法推断主词性（以 meta.pos 为基准，仅在有强证据时覆盖）
function _derivePrimaryPos(catMap, metaPos, word, structMap, sigCat) {
  const metaNorm = _normalizePos(metaPos);

  // 形容词/副词/介词/代词：信任 meta.pos，不因后接介词而误判为动词
  if (metaNorm === 'adj' || metaNorm === 'adv' ||
      metaNorm === 'prep' || metaNorm === 'pron') return metaNorm;

  // 名词：仅当存在足量"不可伪"动词小品词（如 figure out）时才覆盖
  if (metaNorm === 'noun') {
    const w = word.toLowerCase();
    let particleCount = 0;
    Object.keys(sigCat).forEach(s => {
      if (sigCat[s] === '动词词组' && s.startsWith(w + ' ')) {
        const p = s.split(' ').pop();
        if (ST_VERB_PARTICLE.has(p)) particleCount += structMap[s] || 0;
      }
    });
    if (particleCount >= 3) return 'verb';
    return 'noun';
  }

  // 动词：保持
  if (metaNorm === 'verb') return 'verb';

  // 未知词性：按频次推断
  const verbScore = (catMap['动词词组'] || 0) + (catMap['动宾结构'] || 0);
  const nounScore = (catMap['介词词组'] || 0) + (catMap['名词词组'] || 0);
  if (verbScore > nounScore && verbScore > 0) return 'verb';
  if (nounScore > 0) return 'noun';
  return 'other';
}

// 不应出现在搭配中的停用词（连词/副词等）
const ST_STOP = new Set([
  'and','or','but','if','when','where','while','although','because','since',
  'that','which','who','whom','whose','what','how','why','not','no','very',
  'too','so','as','than','also','just','only','even','still','already','yet',
  'now','then','here','there','up','down','out','off','away','back','more',
  'most','less','least','much','many','few','several','various','other',
  'another','such','same','different','similar','certain','particular',
  'specific','general','main','major','minor','whole','entire','complete',
  'full','total','partial','half','first','second','third','last','next',
  'previous','following','former','latter','both','either','neither','all',
  'any','some','none','one','two','three','four','five','six','seven',
  'eight','nine','ten','however','therefore','thus','hence','moreover',
  'furthermore','nevertheless','instead','otherwise','meanwhile','besides'
]);

// ====== 按词性从例句中提取真实搭配 ======
function _extractPosCollocations(sentence, word, primaryPos, collocMap) {
  if (!sentence || !word) return;
  const w = word.toLowerCase();
  const tokens = sentence.split(/\s+/);

  for (let i = 0; i < tokens.length; i++) {
    const clean = tokens[i].toLowerCase().replace(/[^a-z']/g, '');
    if (clean !== w) continue;

    const after  = i + 1 < tokens.length ? tokens[i + 1].toLowerCase().replace(/[^a-z']/g, '') : '';
    const before = i - 1 >= 0 ? tokens[i - 1].toLowerCase().replace(/[^a-z']/g, '') : '';

    if (primaryPos === 'verb') {
      // 动词短语：word + 副词/小品词，word + 介词
      if (after && (ST_PARTICLES.has(after) || ST_PREP.has(after))) {
        const ph = w + ' ' + after;
        collocMap[ph] = (collocMap[ph] || 0) + 1;
      }
    }
    else if (primaryPos === 'noun') {
      // 名词短语：形容词 + word
      if (before && /^[a-z]{3,}$/.test(before) &&
          !ST_DET.has(before) && !ST_AUX.has(before) &&
          !ST_PREP.has(before) && !ST_PARTICLES.has(before) && !ST_STOP.has(before)) {
        const ph = before + ' ' + w;
        collocMap[ph] = (collocMap[ph] || 0) + 1;
      }
      // 名词 + 介词
      if (after && ST_PREP.has(after)) {
        const ph = w + ' ' + after;
        collocMap[ph] = (collocMap[ph] || 0) + 1;
      }
    }
    else if (primaryPos === 'adj') {
      // 形容词 + 介词
      if (after && ST_PREP.has(after)) {
        const ph = w + ' ' + after;
        collocMap[ph] = (collocMap[ph] || 0) + 1;
      }
      // 形容词 + 名词
      if (after && /^[a-z]{3,}$/.test(after) &&
          !ST_PREP.has(after) && !ST_PARTICLES.has(after) &&
          !ST_AUX.has(after) && !ST_DET.has(after) && !ST_STOP.has(after)) {
        const ph = w + ' ' + after;
        collocMap[ph] = (collocMap[ph] || 0) + 1;
      }
    }
    else if (primaryPos === 'adv') {
      // 动词 + 副词
      if (before && /^[a-z]{3,}$/.test(before) &&
          !ST_DET.has(before) && !ST_AUX.has(before) &&
          !ST_PREP.has(before) && !ST_PARTICLES.has(before) && !ST_STOP.has(before)) {
        const ph = before + ' ' + w;
        collocMap[ph] = (collocMap[ph] || 0) + 1;
      }
      // 副词 + 形容词
      if (after && /^[a-z]{3,}$/.test(after) &&
          !ST_PREP.has(after) && !ST_PARTICLES.has(after) &&
          !ST_AUX.has(after) && !ST_DET.has(after) && !ST_STOP.has(after)) {
        const ph = w + ' ' + after;
        collocMap[ph] = (collocMap[ph] || 0) + 1;
      }
    }
    else {
      // 默认：word + 介词/小品词
      if (after && (ST_PREP.has(after) || ST_PARTICLES.has(after))) {
        const ph = w + ' ' + after;
        collocMap[ph] = (collocMap[ph] || 0) + 1;
      }
    }
  }
}

// ====== 常见结构：语法框架分析（按词性输出抽象模式） ======
function _deriveStructDesc(word, catMap, structMap, sigCat, primaryPos) {
  const w = word.toLowerCase();
  const parts = [];
  const sigs = Object.keys(sigCat);

  if (primaryPos === 'verb') {
    const hasParticle = sigs.some(s =>
      sigCat[s] === '动词词组' && s.includes(' ') && ST_PARTICLES.has(s.split(' ').pop() || ''));
    const hasPrep = sigs.some(s =>
      sigCat[s] === '动词词组' && s.includes(' ') &&
      ST_PREP.has(s.split(' ').pop() || '') && !ST_PARTICLES.has(s.split(' ').pop() || ''));
    if (hasParticle) parts.push(w + ' + 副词/小品词');
    if (hasPrep) parts.push(w + ' + 介词');
    if (catMap['动宾结构']) parts.push(w + ' + 名词/代词');
    if (structMap['to ' + w] || structMap[w + '(动词)']) parts.push('to + ' + w);
  }
  else if (primaryPos === 'noun') {
    if (catMap['名词词组'] || catMap['介词词组']) parts.push('形容词 + ' + w);
    // 直接检查 structMap 中是否有 word + 介词 签名（不受 sigCat 误分类影响）
    const hasNounPrep = sigs.some(s =>
      s.startsWith(w + ' ') && ST_PREP.has(s.split(' ').pop() || ''));
    if (hasNounPrep) parts.push(w + ' + 介词');
    parts.push('冠词 + ' + w);
  }
  else if (primaryPos === 'adj') {
    if (catMap['动宾结构'] || catMap['其他搭配']) parts.push(w + ' + 名词');
    const hasAdjPrep = sigs.some(s =>
      s.startsWith(w + ' ') && ST_PREP.has(s.split(' ').pop() || ''));
    if (hasAdjPrep) parts.push(w + ' + 介词');
    parts.push('代词 + ' + w);
  }
  else if (primaryPos === 'adv') {
    parts.push('动词 + ' + w);
    parts.push(w + ' + 形容词');
  }
  else {
    // 回退：通用模式
    if (catMap['动词词组']) parts.push(w + ' + 副词/小品词');
    if (catMap['介词词组']) parts.push(w + ' + 介词');
    if (catMap['动宾结构']) parts.push(w + ' + 名词/代词');
  }

  if (!parts.length) return '';
  return parts.join('、');
}

// ====== 渲染风向标主函数 ======
function renderMindMap(word, entry) {
  const meta = entry.meta || {};
  const defs = entry.defs || [];
  const mm = _getMmData(word);

  // ---- 统计：词义分布 + 搭配 ----
  let totalGaokao = 0, totalTextbook = 0;
  const srcSet = new Set();
  const structMap = {};     // 结构签名 → 次数（figure out / figure+名词/代词 ...）
  const catMap = {};        // 词性结构类别 → 次数
  const sigCat = {};        // 结构签名 → 类别

  // 词义列表：{ cnLabel, count, gk, tb, defText }
  const senses = [];

  defs.forEach((d) => {
    const exs = d.ex || [];
    let gk = 0, tb = 0;
    exs.forEach(ex => {
      const src = ex.src || '';
      srcSet.add(src);
      if (isGaokaoSrc(src)) { gk++; totalGaokao++; }
      else { tb++; totalTextbook++; }
      _extractStructures(ex.s || '', word, structMap, catMap, sigCat);
    });
    const cnLabel = _extractCnFromDef(d.def);
    if (cnLabel || exs.length > 0) {
      senses.push({ label: cnLabel || `义项${senses.length + 1}`, count: exs.length, gk, tb, defText: d.def || '' });
    }
  });

  // 结构统计已在上方从句中提取（不再混入思维导图噪声短语）

  const totalAll = totalGaokao + totalTextbook;
  const hasData = totalAll > 0 || senses.length > 0;
  if (!hasData) return '';

  // ---- 左侧：词义柱状图（中文标签，仅显示有例句的释义）----
  const shownSenses = senses.filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...shownSenses.map(s => s.count), 1);

  let barsHtml = '';
  if (shownSenses.length === 0) {
    barsHtml = `<p class="wv-empty">该词暂无例句数据</p>`;
  } else {
    shownSenses.forEach(s => {
      const pct = Math.round(s.count / maxCount * 100);
      const barW = Math.max(pct, 8);
      barsHtml += `<div class="wv-bar-row">
        <span class="wv-bar-label" title="${esc(s.defText)}">${esc(s.label)}</span>
        <div class="wv-bar-track">
          <div class="wv-bar-fill" style="width:${barW}%"></div>
        </div>
        <span class="wv-bar-val">${s.count}</span>
      </div>`;
    });
  }

  // ---- 右侧：用法分析 ----
  _normalizeVerb(structMap, sigCat, word);
  const usagePos = _deriveUsagePos(catMap, meta.pos);
  const primaryPos = _derivePrimaryPos(catMap, meta.pos, word, structMap, sigCat);
  const structDesc = _deriveStructDesc(word, catMap, structMap, sigCat, primaryPos);

  // 按词性提取真实搭配
  const collocMap = {};
  defs.forEach((d) => {
    (d.ex || []).forEach(ex => {
      _extractPosCollocations(ex.s || '', word, primaryPos, collocMap);
    });
  });
  let collocEntries = Object.entries(collocMap).sort((a, b) => b[1] - a[1]);
  // 若主词性搭配不足 3 个，回退提取所有类型
  if (collocEntries.length < 3) {
    const fallbackMap = {};
    defs.forEach((d) => {
      (d.ex || []).forEach(ex => {
        _extractPosCollocations(ex.s || '', word, 'other', fallbackMap);
      });
    });
    const existing = new Set(collocEntries.map(e => e[0]));
    Object.entries(fallbackMap).sort((a, b) => b[1] - a[1]).forEach(e => {
      if (!existing.has(e[0])) collocEntries.push(e);
    });
    collocEntries.sort((a, b) => b[1] - a[1]);
  }
  const topCollocations = collocEntries.slice(0, 5);

  let rightHtml = '';
  rightHtml += `<p class="wv-lead"><b>${esc(word)}</b>在例句库中主要作<b>${esc(usagePos)}</b>，共出现<b class="wv-num">${totalAll}</b>词次。</p>`;

  // 词义说明（保留）
  if (senses.length > 0) {
    rightHtml += `<div class="wv-body">`;
    senses.forEach((s, i) => {
      if (s.count === 0) return;
      let parts = `「${esc(s.label)}」<span class="wv-num">${s.count}次</span>`;
      if (s.gk > 0) parts += `（高考${s.gk}次）`;
      rightHtml += `<p class="wv-line">（${i + 1}）${parts}</p>`;
    });
    rightHtml += `</div>`;
  }

  // 常见结构（语法框架分析）
  if (structDesc) {
    rightHtml += `<p class="wv-line wv-struct"><span class="wv-tag">常见结构</span>${esc(structDesc)}</p>`;
  }

  // 高频搭配（按词性提取的真实短语，3-5 个）
  if (topCollocations.length > 0) {
    const sl = topCollocations.map(([ph, c]) =>
      `<span class="wv-hl">${esc(ph)}</span><span class="wv-num">(${c}次)</span>`).join('、');
    rightHtml += `<p class="wv-line wv-struct"><span class="wv-tag">高频搭配</span>${sl}</p>`;
  }

  // 语篇分布（与高频搭配同格式）
  const genres = _detectGenres([...srcSet]);
  if (genres.types.length > 0 && totalGaokao >= 3) {
    const gl = genres.types.slice(0, 3).map(({ t, c }) =>
      `<span class="wv-hl">${esc(t)}</span><span class="wv-num">(${c}次)</span>`).join('、');
    rightHtml += `<p class="wv-line wv-struct"><span class="wv-tag">语篇分布</span>${gl}</p>`;
  }

  return `<div class="wv-wrap">
    <div class="wv-header">
      <span class="wv-title">词汇风向标</span>
      <span class="wv-subtitle">${esc(word)}特征归纳</span>
    </div>
    <div class="wv-content">
      <div class="wv-left">
        <div class="wv-chart-title">${esc(word)}词义</div>
        <div class="wv-bars">${barsHtml}</div>
      </div>
      <div class="wv-right">
        ${rightHtml}
      </div>
    </div>
  </div>`;
}

/* ========== 词条渲染 ========== */

// 词汇家族表（词性变换）：复用风向标标题样式，表格列与教师 Excel 一致
function renderFamily(word, fam) {
  if (!fam) return '';
  // 缺失的词性以 “/” 占位，杜绝遗漏或错填
  const v = x => (x && x !== '/') ? esc(x) : '/';
  const m = x => (x && x !== '/') ? '' : 'fam-missing';
  return `<div class="wv-wrap family-wrap">
    <div class="wv-header">
      <span class="wv-title">词汇家族表</span>
      <span class="wv-subtitle">${esc(word)} 词性变换</span>
    </div>
    <table class="family-table">
      <thead><tr>
        <th>常见释义</th><th>动词</th><th>名词</th><th>形容词</th><th>副词</th>
      </tr></thead>
      <tbody><tr>
        <td class="fam-cn">${v(fam.cn)}</td>
        <td class="${m(fam.verb)}">${v(fam.verb)}</td>
        <td class="${m(fam.noun)}">${v(fam.noun)}</td>
        <td class="${m(fam.adj)}">${v(fam.adj)}</td>
        <td class="${m(fam.adv)}">${v(fam.adv)}</td>
      </tr></tbody>
    </table>
  </div>`;
}

function renderEntry(entry, word, mmHtml, fam, variants) {
  const meta = entry.meta || {};
  let html = '';

  // 词汇风向标
  if (mmHtml) {
    html += mmHtml;
  }

  // 词汇家族表（词性变换）——位于词汇风向标之下
  const famHtml = renderFamily(word, fam);
  if (famHtml) {
    html += famHtml;
  }

  html += `<div class="word-head">` +
    `<span class="w">${esc(word)}</span>` +
    (meta.ph ? `<span class="ph">/${esc(meta.ph)}/</span>` : '') +
    (meta.pos ? `<span class="pos">${esc(meta.pos)}</span>` : '') +
    (meta.stars ? `<span class="stars">${esc(meta.stars)}</span>` : '') +
    `</div>`;

  const defs = entry.defs || [];
  if (!defs.length) {
    html += `<div class="notfound">该词暂无助记例句。</div>`;
  }
  defs.forEach((d, idx) => {
    // 推断词性：释义以 "to " 开头 → verb，否则 noun
    const defText = (d.def || '').trim();
    const pos = defText.toLowerCase().startsWith('to ') ? 'verb' : 'noun';
    const exs = d.ex || [];
    const exCount = exs.length;
    html += `<div class="def" data-def-idx="${idx}">` +
      `<div class="def-title"><span class="def-idx">释义 ${idx + 1}</span><span class="def-pos">[${pos}]</span><span class="def-count">${exCount} 例句</span><span class="def-toggle">▲</span></div>` +
      (d.def ? `<div class="def-text">${esc(d.def)}</div>` : '') +
      `<div class="ex-list collapsed">`;
    if (!exs.length) {
      html += `<div class="def-empty">本义项下暂无例句。</div>`;
    }
    exs.forEach((ex, exIdx) => {
      const cat = ex.cat || classify(ex.src);
      html += `<div class="ex s-${cat}">` +
        `<div class="ex-line">` +
        `<span class="ex-num">(${exIdx + 1})</span> ` +
        `<span class="ex-sentence">${highlight(ex.s || '', word, variants)}</span>` +
        (ex.src ? ` <span class="ex-src">(${esc(ex.src)})</span>` : '') +
        `</div>` +
        (ex.t ? `<div class="ex-trans">${esc(ex.t)}</div>` : '') +
        `</div>`;
    });
    html += `</div></div>`;
  });
  $result.innerHTML = html;

  // 绑定释义折叠/展开——直接在每个三角标上绑定，确保可靠
  $result.querySelectorAll('.def-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const def = this.closest('.def');
      const exList = def.querySelector('.ex-list');
      const isCollapsed = exList.classList.toggle('collapsed');
      this.textContent = isCollapsed ? '▲' : '▼';
    });
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function classify(src) {
  src = src || '';
  if (src.includes('人教')) return 'renjiao';
  if (src.includes('外研')) return 'waiyan';
  if (src.includes('北师大')) return 'beishida';
  if (src.includes('译林')) return 'yilin';
  return 'gaokao';
}

// 释义折叠/展开（内联 onclick 调用）
function toggleDef(el) {
  const def = el.closest('.def');
  const exList = def.querySelector('.ex-list');
  const isCollapsed = exList.classList.toggle('collapsed');
  el.textContent = isCollapsed ? '▲' : '▼';
}

/* helpers */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function highlight(s, word, variants) {
  const base = esc(s);
  const w = (word || '').trim();
  if (!w) return base;

  // 收集所有要匹配的变体（原形 + variants），按长度降序排列（长的优先匹配）
  const all = [w];
  if (variants && variants.length) {
    for (const v of variants) {
      if (v && v !== w) all.push(v);
    }
  }
  all.sort((a, b) => b.length - a.length);

  // 去重并转义
  const seen = new Set();
  const parts = [];
  for (const v of all) {
    const lv = v.toLowerCase();
    if (seen.has(lv)) continue;
    seen.add(lv);
    parts.push(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }

  try {
    return base.replace(new RegExp('(' + parts.join('|') + ')', 'gi'), '<mark>$1</mark>');
  } catch (e) { return base; }
}
function fmt(n) { return (n || 0).toLocaleString('en-US'); }
