const WORDS_URL = 'data/words.json?v=20260825w';
const INDEX_BASE = 'data/index/';
const MINDMAP_BASE = 'data/mindmap/';
const WORDS_BASE = 'data/words/';
const STATS_URL = 'data/stats.json?v=20260825w';

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

/* ========== 访问码门槛（免注册，输入一次永久记住） ========== */
const ACCESS_CODE_SHA256 = '24c387b7cd22a79876fe121fb1cd9a191c8a77167f692ac8c251c5b449895eb6'; // sha256(访问码=课题编号)
const GATE_KEY = 'gk_gate_ok';
const $overlay   = document.getElementById('auth-overlay');
const $authMsg   = document.getElementById('auth-msg');
const $loginForm = document.getElementById('login-form');

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

// SHA-256（HTTPS/GitHub Pages 下可用；本地 file:// 下 Chrome 亦可用）
async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 启动时检查：已通过验证的浏览器直接进入
function initGate() {
  try {
    if (localStorage.getItem(GATE_KEY) === '1') {
      updateLogoutBtn(true);
      return;
    }
  } catch (e) { /* localStorage 不可用时仍显示门槛 */ }
  showAuthOverlay();
  setTimeout(() => {
    const input = document.getElementById('access-code');
    if (input) input.focus();
  }, 100);
}

// 输入规整化：全角转半角（防中文输入法打出ｘｂｊｙ２３０２７）、去除所有空白
function normalizeCode(raw) {
  return String(raw || '')
    .replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, '');
}

// 提交访问码
$loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('access-code');
  const btn = document.getElementById('login-btn');
  const code = normalizeCode(input ? input.value : '');
  if (!code) { setAuthMsg('请输入访问码'); return; }
  btn.disabled = true;
  btn.textContent = '验证中…';
  setAuthMsg('');
  try {
    const hash = await sha256(code);
    if (hash === ACCESS_CODE_SHA256) {
      try { localStorage.setItem(GATE_KEY, '1'); } catch (err) {}
      updateLogoutBtn(true);
      hideAuthOverlay();
    } else {
      setAuthMsg('访问码不正确，请向课题组成员核对');
      btn.disabled = false;
      btn.textContent = '🔓 进入查询';
      if (input) { input.value = ''; input.focus(); }
    }
  } catch (err) {
    // crypto.subtle 不可用的极端环境：直接比对（极少发生）
    if (code.length >= 6) {
      try { localStorage.setItem(GATE_KEY, '1'); } catch (e2) {}
      updateLogoutBtn(true);
      hideAuthOverlay();
    } else {
      setAuthMsg('访问码不正确');
      btn.disabled = false;
      btn.textContent = '🔓 进入查询';
    }
  }
});

// 锁定按钮：清除本机记录，重新显示门槛
const $logoutBtn = document.getElementById('logout-btn');
function updateLogoutBtn(show) {
  if ($logoutBtn) $logoutBtn.hidden = !show;
}
$logoutBtn.addEventListener('click', () => {
  try { localStorage.removeItem(GATE_KEY); } catch (e) {}
  updateLogoutBtn(false);
  showAuthOverlay();
  const input = document.getElementById('access-code');
  if (input) { input.value = ''; input.focus(); }
});

init();

async function init() {
  initGate(); // 访问码门槛（本机已通过则直接进入）
  loadStats();
  try {
    const [wr, mr] = await Promise.all([fetch(WORDS_URL + '?v=20260825w'), fetch(WORDS_BASE + 'manifest.json?v=20260825w')]);
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

  try {
    // 词条（小文件）、思维导图（已预热）、词性变换表 并行加载
    const [res] = await Promise.all([fetch(WORDS_BASE + rel + '?v=20260825w'), ensureMindmap(letter), ensureFamily()]);
    if (!res.ok) { renderNotFound(word); return; }
    const entry = await res.json();
    const fam = (FAMILY_INDEX && FAMILY_INDEX[word.toLowerCase()]) ? FAMILY_INDEX[word.toLowerCase()] : null;
    const variants = _getWordVariants(word);
    $empty.hidden = true;
    const mmHtml = renderMindMap(word, entry);
    renderEntry(entry, word, mmHtml, fam, variants);
  } catch (e) {
    console.error(e);
  }
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
    if (!src) t = '其他';
    else if (/阅读理解|七选五/.test(src)) t = '阅读理解';
    else if (/语法填空|完形填空/.test(src)) t = '填空/完形';
    else if (/书面表达|写作|作文|读后续写/.test(src)) t = '写作';
    else if (/听力/.test(src)) t = '听力';
    else if (/短文改错|改错/.test(src)) t = '改错';
    else if (/(外研社|北师大|人教版|人教|译林|教材|必修|选修|Unit|U\d)/.test(src)) t = '教材';
    // 其余含“卷”但不含具体题型的来源统一归入“其他”
    typeCount[t] = (typeCount[t] || 0) + 1;
    genres.count++;
  });
  // 排序：具体题型优先；教材其次；“其他”始终垫后；同组内按出现次数降序
  const SPECIFIC = new Set(['阅读理解','填空/完形','写作','听力','改错']);
  genres.types = Object.entries(typeCount).sort(([ta, a], [tb, b]) => {
    const sa = SPECIFIC.has(ta), sb = SPECIFIC.has(tb);
    if (sa && !sb) return -1;
    if (!sa && sb) return 1;
    // 在非具体题型中，“其他”始终放最后
    if (ta === '其他') return 1;
    if (tb === '其他') return -1;
    return b - a;
  }).map(([t,c]) => ({ t, c }));
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

// 把归一化词性转为风向标展示用词
function _posDisplayName(pos) {
  const map = {
    verb: '动词（含短语动词）',
    noun: '名词',
    adj: '形容词',
    adv: '副词',
    prep: '介词',
    pron: '代词',
    conj: '连词',
    other: '多词性'
  };
  return map[pos] || '多词性';
}

// 把归一化词性转为徽章标完整英文名（noun/verb/adjective/adverb 等）
function _posBadgeName(pos) {
  const map = {
    noun: 'noun',
    verb: 'verb',
    adj: 'adjective',
    adv: 'adverb',
    prep: 'preposition',
    pron: 'pronoun',
    conj: 'conjunction',
    other: 'multi'
  };
  return map[pos] || 'multi';
}

// ====== POS 归一化 ======
function _normalizePos(pos) {
  const raw = (pos || '').toLowerCase();
  // 多部分 meta.pos（如 "preposition;verb;noun"）取第一部分
  const p = raw.split(';')[0].trim();
  if (p.includes('adj')) return 'adj';
  // 注意：adverb 同时包含 adv 和 verb，必须先检查 adv
  if (p.includes('adv')) return 'adv';
  if (p.includes('modal')) return 'verb';  // 情态动词归入 verb
  if (p.includes('verb') || p.includes('; v') || p === 'v.') return 'verb';
  if (p.includes('noun') || p === 'n.') return 'noun';
  if (p.includes('prep')) return 'prep';
  if (p.includes('pron') || p.includes('det')) return 'pron';  // 限定词归入 pron
  if (p.includes('conj')) return 'conj';
  return 'other';
}

// ====== 按释义文本推断该释义的词性（修复 meta.pos 单标注问题）======
// 词条 meta.pos 只记录一个笼统词性（如 set 只标 verb），但同一词条常含名词/形容词释义，
// 导致名词用法被按动词规则提取出 "set of" 这类弱词块。
// 规律：动词释义以 "to ..." 开头；名词释义以限定词开头；形容词中文释义多以"的"结尾；副词多以"地"结尾。

// 可作介词的词汇集合：纯副词（always/already/soon 等）英文释义虽以 at/in/on 开头，
// 但并非介词用法（仅释义措辞），不应标为 [prep]。
// 此集合覆盖所有英语介词，用于限制介词模式仅对介词能力词生效。
const PREP_CAPABLE = new Set([
  'about','above','across','after','against','along','amid','among','around','as','at',
  'before','behind','below','beneath','beside','besides','between','beyond','but','by',
  'concerning','considering','despite','down','during','except','excepting','excluding',
  'following','for','from','in','including','inside','into','like','minus','near','of',
  'off','on','onto','opposite','out','outside','over','past','per','plus','regarding','round',
  'save','since','than','through','throughout','till','to','toward','towards','under',
  'underneath','unlike','until','up','upon','versus','via','with','within','without'
]);

function _defPos(defText, fallbackPos, headword) {
  if (!defText) return fallbackPos;
  let t = defText.trim().replace(/^\s*[(（][^)）]*[)）]\s*/, '').trim();
  if (!t) return fallbackPos;
  // 中文释义部分提取（提前到中文开头检测之前，以便检查连词/副词关键词）
  const zhMatch = t.match(/[\u4e00-\u9fff][\u4e00-\u9fff\s，。；、（）()·…]*$/);
  const zh = zhMatch ? zhMatch[0].replace(/\s/g, '') : '';
  // 中文"连用"模式（since + 特定时态从句，释义含"连用"表示连接从句）
  // 仅对 prep/conj 词生效：also/quite/some 等的"不与否定动词连用"是语法说明，非连词
  if (zh && /连用/.test(zh) && (fallbackPos === 'prep' || fallbackPos === 'conj')) return 'conj';
  if (/[\u4e00-\u9fff]/.test(t[0])) {
    // 中文开头（语法说明）→ 先检查连词/副词关键词
    // 用分号/逗号分割后精确匹配，避免"尽管"等歧义词误判介词词（如 despite）
    if (zh) {
      const parts = zh.split(/[；，;,]/);
      if (parts.some(p => /^(既然|虽然|哪怕|正如|然而)$/.test(p.trim()))) return 'conj';
    }
    if (zh && /^(此后|后来|何曾|什么时候)/.test(zh)) return 'adv';
    return fallbackPos;  // 中文开头（语法说明）→ 信任回退词性
  }
  if (/^to\s+[a-z]/i.test(t) && !/^to\s+(or|and)\s/i.test(t)) return 'verb';
  if (zh && /地$/.test(zh)) return 'adv';
  if (zh && /的$/.test(zh)) return 'adj';
  // 介词短语排除：because of 是介词短语（+名词），不是连词（+从句）
  // with Def9/Def10、over Def21 "because of..." 均为介词用法，不应标为 [conj]
  if (/^because\s+of\b/i.test(t)) return 'prep';
  // 连词释义：以 because/while/whereas/just as 等连词开头
  if (/^(because|while|whereas|whereupon|whereafter|just\s+as)\b/i.test(t)) return 'conj';
  // 连词释义：although 后接 ;/, 表示同义词释义（排除 "Although the word..." 等语法说明句）
  if (/^although\s*[;,]/i.test(t)) return 'conj';
  // 连词释义：in the way that/in which（as = in the manner that）
  if (/^in the way (in which|that)\b/i.test(t)) return 'conj';
  // 介词释义：特定短语（similar to / as if / concerning / regarding 等）
  // 必须在 -ing 形容词检测之前，否则 "concerning sb/sth" 会被误判为形容词
  if (/^(similar\s+to|as\s+if|concerning|regarding|respecting|touching)\b/i.test(t)) return 'prep';
  // 语法说明排除：used to show/describe/indicate 等不是形容词（是介词的语法说明）
  if (/^used to (show|describe|indicate|express|represent|demonstrate|illustrate|form|mark|introduce|refer)\b/i.test(t)) return fallbackPos;
  // 介词释义排除：having or...（with = having，是介词定义，不是形容词）
  if (/^having\s+or\b/i.test(t)) return fallbackPos;
  // 介词释义排除：using sth/sb/st（with = using，是介词定义，不是形容词）
  if (/^using\s+(sth|sb|st)\b/i.test(t)) return fallbackPos;
  // 介词词排除：knowing about...（"with it" 是idiom而非形容词；介词词"with"单独不作adj）
  if (/^knowing about\b/i.test(t) && fallbackPos === 'prep') return fallbackPos;
  // 形容词释义常见英文起始模式
  if (/^(having|being|used to|used for|used in|used as|relating to|related to|typical of|concerned with|concerned about|able to|likely to|inclined to|supposed to|given to|willing to|easy to|hard to|difficult to|too .+ to|free to|fit to|due to|owing to|open to)\s/i.test(t)) return 'adj';
  // -ing 形容词释义（doing / feeling / looking... + sth/that/which/who/when/where/how）
  if (/^[a-z]+ing\s+(sth|sb|st|that|which|who|whom|when|where|how|in|at|on|by|for|with|from|of|to|about)\b/i.test(t)) return 'adj';
  // 语法说明排除：employed by 不是形容词（for = employed by 是介词用法）
  if (/^employed by\b/i.test(t)) return fallbackPos;
  // -ed 形容词释义（interested/concerned/pleased + in/by/with/about/that）
  if (/^[a-z]+ed\s+(to|by|with|in|for|from|of|that|which|who|about|into|on|at)\b/i.test(t)) return 'adj';
  // "more...than" 比较级形容词
  if (/^(more|less)\s+\w+\s+than\b/i.test(t)) return 'adj';
  // 语法说明排除：better/worse ... etc. 不是比较级形容词（是介词用法说明，列举比较级后接 for）
  if (/^(better|worse)\s*,.*\betc\b/i.test(t)) return fallbackPos;
  // 比较级形容词（better; more acceptable / worse; less ...）
  if (/^(better|worse)\s*[,;]\s+/i.test(t)) return 'adj';
  // 副词性释义：at a time after（since = afterward）
  if (/^at a time after\b/i.test(t)) return 'adv';
  // 介词释义：以常见介词开头（at/in/on/of/for/with/by/from/about ...）
  // 注意：要排除 "to"（已在上方 verb 处理）和 "of + 名词短语"（如 "of God" 是名词短语的情况）
  // 使用 \b 而非 \s+ 以允许标点（如 "until, and including"）
  // 连词类词（while/although 等）的释义常以介词起始词开头（如 "during the time that"），
  // 但这些是连词释义，不应被介词模式覆盖
  // 纯副词（always/already/soon/often/now 等）英文释义虽以 at/in/on 开头，但不是介词用法，
  // 仅当词本身可作介词（PREP_CAPABLE）或 meta.pos 已标 prep 时才触发
  const _hw = (typeof headword === 'string' ? headword : '').toLowerCase();
  const _prepOk = fallbackPos === 'prep' || PREP_CAPABLE.has(_hw);
  if (fallbackPos !== 'conj' && _prepOk && /^(to|at|in|on|for|with|by|from|of|about|against|along|among|around|before|behind|below|beneath|beside|between|beyond|during|except|inside|into|near|onto|opposite|outside|over|past|through|throughout|toward|towards|under|underneath|unlike|until|upon|via|within|without|above|across|after)\b/i.test(t)) return 'prep';
  // 介词释义："more/less/greater/higher ... than" 比较级"超过"义（同样仅对介词能力词）
  if (fallbackPos !== 'conj' && _prepOk && /^(more|less|greater|higher|louder|clearer|fewer|earlier|later|better|worse|further)\s+.*\s+than\b/i.test(t)) return 'prep';
  // 副词性释义：比较级 + in（"greater in number", "earlier in sth"）
  // above 的副词义"超过"、"上文"等以比较级开头
  if (/^(greater|earlier|later|higher|lower|fewer|older|younger)\s+in\s/i.test(t)) return 'adv';
  // 副词性释义：a ... away from（"a long distance away from"）
  if (/^a\s+.*\baway\s+from\b/i.test(t)) return 'adv';
  if (/^(the|a|an|one|each|every|some|any|no|this|that|these|those|his|her|their|its|our|your|my|sb'?s?|sth|it|he|she|they)\b/i.test(t)) return 'noun';
  // 介词/代词/连词类词的释义若未匹配任何模式，不应回退到名词
  if (fallbackPos === 'prep' || fallbackPos === 'pron' || fallbackPos === 'adv' || fallbackPos === 'conj') return fallbackPos;
  // 非动词、非形容词/副词的释义默认按名词处理（名词块提取规则最通用）
  return 'noun';
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

// ====== 高频搭配：从例句中提取真实教学词块 ======
// 目标：提取完整词块（形容词+名词 / 动词+名词 / 动词+小品词 / 名词+介词），
// 如 colorful picture / take picture of / cut out picture / well-rounded picture of，
// 而非 "picture of"、"room picture" 这类无教学意义的二元组合。
const CK_HARD_PARTICLE = new Set(['out','up','off','down','away','back','aside','apart','forward','together']);
const CK_PREP = new Set(['in','on','at','by','for','with','from','to','of','about','into','through','over','under','after','before','like','near','across','along','behind','beyond','down','off','up','out','as','than','between','among','within','without','against','upon','via','per','despite','during','onto','toward','towards']);
const CK_BREAK_RIGHT = new Set(['than','as','during','if','when','while','since','until','whether']);
const CK_DET = new Set(['the','a','an','my','your','our','their','his','her','its','this','that','these','those','some','any','each','every','such','both','all','no','another','one']);
// 数词/序数词：类似限定词处理，不作名词块的左侧内容词（two sets of 不产出 two set of）
const CK_NUM_DET = new Set(['two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','twenty','thirty','hundred','thousand','million','first','second','third','fourth','fifth','dozen','couple','many','few','several']);
// 动词 + of 的真实搭配白名单（其余 verb+of 视为名词用法：a set of / a balanced set of）
const CK_VERB_OF = new Set(['think','dream','approve','consist','die','complain','hear','speak','talk','taste','remind','dispose']);
const CK_PRON = new Set(['it','its','he','she','they','them','him','her','us','me','you','we','i','one','ones','everyone','someone','anyone','something','anything','everything','nothing','myself','yourself','himself','herself','themselves','ourselves','who','whom','whose','which','what']);
const CK_LY_KEEP = new Set(['only','early','likely','friendly','lovely','lonely','weekly','monthly','daily','yearly','costly','deadly','silly','ugly','holy']);
const CK_FUNC = new Set([...CK_DET, ...CK_PRON,
  'can','could','will','would','should','may','might','must','shall','do','does','did','have','has','had','be','is','are','was','were','been','being','am','not','and','or','but','if','when','while','because','so','very','too','also','just','only','even','still','now','then','here','there','more','most','less','least','much','many','few','several','first','second','last','next','other','same','such','than','always','often','never','again','both']);
// 句间连接副词（conjunctive adverbs）：在句法上与主句可分离，不与相邻词构成教学搭配。
// 例：acknowledge, however, was... → 不应产出 "acknowledge however"
const CK_CONJ_ADV = new Set(['however','therefore','thus','hence','moreover','furthermore','nevertheless','nonetheless','meanwhile','otherwise','accordingly','consequently','additionally','similarly','likewise','subsequently','simultaneously','instead','indeed','certainly','apparently','obviously','clearly','naturally','fortunately','unfortunately','surprisingly','interestingly']);

// 词表词元集合（懒加载，供词形还原使用）
let _ckWordSet = null;
function _lemmaSet() {
  if (!_ckWordSet) _ckWordSet = new Set(WORDS.map(x => (x.w || '').toLowerCase()));
  return _ckWordSet;
}
// 不规则动词反向表：变体 -> 原形
let _ckIrrevRev = null;
function _irregRev() {
  if (!_ckIrrevRev) {
    _ckIrregRev = {};
    Object.keys(IRREGULAR).forEach(base => IRREGULAR[base].forEach(v => {
      if (!_ckIrregRev[v]) _ckIrregRev[v] = base;
    }));
  }
  return _ckIrregRev;
}

// 词形还原：把变形词还原为课标词原型（pictures→picture, taking→take, felt→feel）
function _lemmaOf(raw) {
  const t = raw.toLowerCase().replace(/[^a-z]/g, '');
  if (!t) return null;
  const set = _lemmaSet();
  if (set.has(t)) return t;
  if (_irregRev()[t]) return _irregRev()[t];
  const cands = [];
  if (t.endsWith('ies') && t.length > 4) cands.push(t.slice(0, -3) + 'y');
  if (t.endsWith('sses')) cands.push(t.slice(0, -2));
  if (t.endsWith('es') && t.length > 3) cands.push(t.slice(0, -2), t.slice(0, -1));
  if (t.endsWith('s') && !t.endsWith('ss') && t.length > 3) cands.push(t.slice(0, -1));
  if (t.endsWith('ing') && t.length > 5) {
    const stem = t.slice(0, -3);
    cands.push(stem + 'e', stem);
    if (stem.length > 2 && /([a-z])\1$/.test(stem)) cands.push(stem.slice(0, -1));
  }
  if (t.endsWith('ied') && t.length > 4) cands.push(t.slice(0, -3) + 'y');
  if (t.endsWith('ed') && t.length > 4) {
    const stem = t.slice(0, -2);
    cands.push(stem, stem + 'e');
    if (/([a-z])\1$/.test(stem)) cands.push(stem.slice(0, -1));
  }
  for (const c of cands) if (set.has(c)) return c;
  return null;
}

// 内容词（形容词/名词修饰语/动词等），返回词元；不合格返回 null
// -ing/-ed 形容词（surprising/talented）若不在词表内则保持原形，避免误还原成动词/名词
function _ckContentWord(raw) {
  if (!/^[a-zA-Z][a-zA-Z-]*$/.test(raw) || /[a-z][A-Z]/.test(raw)) return null;
  const t = raw.toLowerCase();
  if (CK_FUNC.has(t) || CK_CONJ_ADV.has(t) || t.length < 3 || t.length > 15) return null;
  if ((/[a-z]{2,}(ing|ed)$/.test(t)) && !_lemmaSet().has(t)) return t;
  return _lemmaOf(raw) || t;
}

// 词表中的名词集合（供 to 的介词/不定式消歧）
let _ckNounSet = null;
function _nounSet() {
  if (!_ckNounSet) {
    _ckNounSet = new Set();
    WORDS.forEach(x => {
      if ((x.pos || '').includes('noun')) _ckNounSet.add((x.w || '').toLowerCase());
    });
  }
  return _ckNounSet;
}

// 词表中的纯动词集合（不含名词词性的动词，用于动词目标的左侧扩展）
let _ckVerbOnlySet = null;
function _verbOnlySet() {
  if (!_ckVerbOnlySet) {
    _ckVerbOnlySet = new Set();
    WORDS.forEach(x => {
      const p = x.pos || '';
      if (p.includes('verb') && !p.includes('noun')) _ckVerbOnlySet.add((x.w || '').toLowerCase());
    });
  }
  return _ckVerbOnlySet;
}

// 词表中的形容词集合（形容词 + 词 + 介词 → 名词用法：significant changes in）
let _ckAdjSet = null;
function _adjSet() {
  if (!_ckAdjSet) {
    _ckAdjSet = new Set();
    WORDS.forEach(x => {
      if (/adj/.test(x.pos || '')) _ckAdjSet.add((x.w || '').toLowerCase());
    });
  }
  return _ckAdjSet;
}

const CK_BE_FORMS = new Set(['am','is','are','was','were','be','been','being']);

// 动词形判断（用于"动词 + 限定词 + 名词"跨限定词扩展，如 took a picture）
function _ckVerbish(raw) {
  const t = raw.toLowerCase();
  if (_irregRev()[t]) return _irregRev()[t];
  if (/(ing|ed)$/.test(t)) { const l = _lemmaOf(raw); if (l) return l; }
  return null;
}

// 核心：从单个例句中提取含目标词的教学词块（n-gram，n=2~5）
// 右侧按“小品词 → 宾语 → 介词 → 介词宾语”逐段扩展，每个切点各产出一条候选：
//   distinguish right from wrong → distinguish right / distinguish right from / distinguish right from wrong
//   take care of the environment → take care / take care of / take care of environment
// 聚合阶段（_mergeChunkVariants）再按前缀规则合并，保证长词块不被截断、
// 高频核心词块不被零散宾语稀释。
function _extractChunks(sentence, word, primaryPos, chunkMap, nounCapable) {
  if (!sentence || !word) return;
  // 未显式传入时退回词表词性判断（words.json 标注不全，优先用词条释义推断结果）
  const nounOk = (nounCapable !== undefined) ? nounCapable : _nounSet().has(word.toLowerCase());
  const w = word.toLowerCase();
  const toks = sentence.split(/\s+/)
    .map(rt => rt.replace(/[^a-zA-Z-]/g, ''))
    .filter(t => t !== '');
  if (!toks.length) return;

  for (let i = 0; i < toks.length; i++) {
    if (_lemmaOf(toks[i]) !== w && toks[i].toLowerCase() !== w) continue;
    if (/^[A-Z]/.test(toks[i]) && i > 0) continue;   // 大写目标=标题/专有名词

    // 被动语态检测：be + 过去分词，或 名词 + 过去分词后置定语（photos taken from the Internet）
    const curT = toks[i].toLowerCase();
    const prevT = i - 1 >= 0 ? toks[i - 1].toLowerCase() : '';
    const isPastForm = /^[a-z]{3,}ed$/.test(curT) || (_irregRev()[curT] && curT !== w);
    const isPassive = primaryPos === 'verb' && isPastForm &&
      (CK_BE_FORMS.has(prevT) ||
       (prevT && (_nounSet().has(prevT) || _nounSet().has(_lemmaOf(prevT) || ''))));

    // 名词用法签名：限定词 + 目标词 + 介词（a set of rules / a change in attitude）
    // 即使所在释义标为动词（历史例句错挂），也按名词规则处理，避免产出 "set of" 弱词块
    let pos = primaryPos;
    if (pos === 'verb') {
      const nextT = i + 1 < toks.length ? toks[i + 1].toLowerCase() : '';
      if (CK_PREP.has(nextT)) {
        if (CK_DET.has(prevT) || CK_NUM_DET.has(prevT)) pos = 'noun';
        // 动词+of 不在白名单（且非被动 be made of）→ 名词用法（balanced set of standards）
        else if (nextT === 'of' && !isPassive && !CK_VERB_OF.has(w)) pos = 'noun';
        // 句首复数形式 + 介词（Changes in people's ...）→ 名词
        else if (!prevT && /^[a-z]+s$/.test(curT) && curT !== w) pos = 'noun';
        // 目标词具备名词词性 + 前面是形容词（含连字符复合形容词 diet-related changes in）、
        // 纯动词（create change in，此时目标词是宾语）+ 后面是介词 → 名词用法；
        // 名词性主语（the author thinks of）保持动词
        else if (nounOk && prevT.length >= 3 && !CK_FUNC.has(prevT) &&
                 !CK_NUM_DET.has(prevT) && !/^[a-z]{2,}ly$/.test(prevT)) {
          if (/-/.test(prevT)) pos = 'noun';
          else {
            const pl = _lemmaOf(prevT) || prevT;
            if (_adjSet().has(pl) || _verbOnlySet().has(pl)) pos = 'noun';
          }
        }
      }
    }

    // ---- 向左扩展（动词目标仅取紧邻实义动词，避免混入名词主语）----
    let left = [], sawWord = false, sawParticle = false, leftHasPrep = false;
    if (pos === 'verb') {
      // take care of / stop doing：左侧紧邻纯动词才有效（company cut 类名词主语被排除）
      if (i - 1 >= 0) {
        const raw = toks[i - 1], t = raw.toLowerCase();
        if (!/^[A-Z]/.test(raw) && t !== w && !CK_FUNC.has(t)) {
          const l = _lemmaOf(raw);
          if (l && _verbOnlySet().has(l) && !['be','have','do'].includes(l)) {
            left = [l]; sawWord = true;
          }
        }
      }
    } else {
      let j = i - 1;
      while (j >= 0) {
        const raw = toks[j], t = raw.toLowerCase();
        if (/^[A-Z]/.test(raw) && j > 0) break;         // 专有名词
        if (/[a-z][A-Z]/.test(raw)) break;              // 粘连词
        if (_lemmaOf(raw) === w) break;                 // 目标词自身变体
        if (CK_PREP.has(t)) {
          // 形容词/副词目标允许带一个左侧介词（on average / in particular）
          if ((pos === 'adj' || pos === 'adv') && !sawWord && !leftHasPrep) {
            left.unshift(t); leftHasPrep = true;
          }
          break;
        }
        if (CK_HARD_PARTICLE.has(t) && !sawWord && !sawParticle) {
          left.unshift(t); sawParticle = true; j--; continue;   // cut out pictures
        }
        if (CK_DET.has(t) && !sawWord) {
          // 限定词：可跨一个实义动词（took a picture → take picture），排除助动词
          const vRaw = j - 1 >= 0 ? toks[j - 1] : '';
          const v = _ckVerbish(vRaw);
          const before = j - 2 >= 0 ? toks[j - 2].toLowerCase() : '';
          if (v && !['be','have','do'].includes(v) && (j - 1 === 0 || CK_FUNC.has(before))) {
            left.unshift(v); sawWord = true;
          }
          break;
        }
        if (CK_NUM_DET.has(t)) break;                        // 数词/序数词：不构成修饰语
        if (CK_FUNC.has(t)) break;
        if (/^[a-z]{3,}ly$/.test(t) && !CK_LY_KEEP.has(t)) break;  // -ly 副词截断
        const cw = _ckContentWord(raw);
        if (cw && !sawWord) { left.unshift(cw); sawWord = true; j--; continue; }
        break;
      }
    }
    if (sawParticle && !sawWord) { left = []; sawParticle = false; }  // 孤悬小品词无效

    // ---- 向右扩展：逐段设置切点，产出多条 n-gram 候选 ----
    const stages = [];     // [{ toks: 右侧词序列, content: 是否含实质内容 }]
    let seq = [], gotParticle = false, gotObj = false, gotPrep = false;
    const hasContent = () => sawWord || leftHasPrep || gotParticle || gotObj;
    let k = i + 1;
    while (k < toks.length) {
      const raw = toks[k], t = raw.toLowerCase();
      if (/^[A-Z]/.test(raw) || /[a-z][A-Z]/.test(raw) || _lemmaOf(raw) === w) break;
      if (CK_PRON.has(t)) break;                                // 代词宾语终止

      // 小品词（动词目标开头）：cut out / look forward
      if (!gotObj && !gotPrep && pos === 'verb' && CK_HARD_PARTICLE.has(t)) {
        seq.push(t); gotParticle = true;
        stages.push({ toks: seq.slice(), content: true });
        k++; continue;
      }
      // 介词：picture of / take care of / look forward to
      if (!gotPrep && CK_PREP.has(t)) {
        if (CK_BREAK_RIGHT.has(t)) break;
        if (leftHasPrep && !gotParticle && !gotObj) break;      // 左侧已带介词，不再叠加
        if (t === 'to') {
          // 不定式 to：后接限定词/代词/动名词/名词才视为介词（look forward to life / lead to success）
          const nx = k + 1 < toks.length ? toks[k + 1].toLowerCase() : '';
          const nxOk = CK_DET.has(nx) || CK_PRON.has(nx) || CK_FUNC.has(nx) ||
            /^[a-z]{4,}ing$/.test(nx) || _nounSet().has(nx);
          if (!nxOk) break;
        }
        // 动词目标：介词本身即构成模式（distinguish between / look after）；被动语态除外
        const prepValid = hasContent() || (pos === 'verb' && !isPassive);
        seq.push(t); gotPrep = true;
        stages.push({ toks: seq.slice(), content: prepValid });
        k++; continue;
      }
      // 介词宾语：distinguish right from wrong / look for new ideas
      if (gotPrep) {
        if (CK_DET.has(t)) { k++; continue; }                   // 跨过介词宾语的限定词
        // 动名词保持原形（look forward to seeing / insist on doing）
        const ger = /^[a-z]{3,}ing$/.test(t);
        const c1 = ger ? t : _ckContentWord(raw);
        if (!c1) break;
        const rest = [c1];
        if (!ger) {
          // 介词后是“形容词+名词”时取完整名词组（look for new ideas）
          const r2 = k + 1 < toks.length ? toks[k + 1] : '';
          const t2 = r2.toLowerCase();
          if (r2 && !CK_FUNC.has(t2) && !CK_DET.has(t2) && !CK_PRON.has(t2) &&
              !CK_PREP.has(t2) && !/^[a-z]{3,}ed$/.test(t2) && !/^[A-Z]/.test(r2)) {
            const c2 = _ckContentWord(r2);
            if (c2) { rest.push(c2); k++; }
          }
        }
        if ((hasContent() || pos === 'verb') && !(pos === 'verb' && isPassive)) {
          seq.push(...rest);
          stages.push({ toks: seq.slice(), content: true });
        }
        break;                                                  // 介词宾语后即止
      }
      // 动词/形容词目标的宾语：take place / make good use of（排除 -ed 分词修饰）
      if (!gotObj && (pos === 'verb' || pos === 'adj')) {
        if (CK_DET.has(t)) { k++; continue; }                   // 跨过宾语限定词
        if (/^[a-z]{3,}ed$/.test(t)) break;                     // 分词后置修饰，非宾语
        const cw = _ckContentWord(raw);
        if (cw) {
          const rest = [cw];
          // 宾语是“形容词+名词”时取完整名词组（make good use of / make small change）
          const r2 = k + 1 < toks.length ? toks[k + 1] : '';
          const t2 = r2.toLowerCase();
          if (r2 && !CK_FUNC.has(t2) && !CK_DET.has(t2) && !CK_PRON.has(t2) &&
              !CK_PREP.has(t2) && !CK_HARD_PARTICLE.has(t2) && !/^[a-z]{3,}ed$/.test(t2) &&
              !/^[A-Z]/.test(r2)) {
            const c2 = _ckContentWord(r2);
            if (c2) { rest.push(c2); k++; }
          }
          seq.push(...rest); gotObj = true;
          stages.push({ toks: seq.slice(), content: true });
          k++; continue;
        }
        break;
      }
      break;
    }

    // ---- 产出：基础词块（有左侧内容时）+ 各切点词块 ----
    if (sawWord || leftHasPrep) {
      const chunk = [...left, w].join(' ');
      chunkMap[chunk] = (chunkMap[chunk] || 0) + 1;
    }
    stages.forEach(st => {
      if (!st.content) return;
      const chunk = [...left, w, ...st.toks].join(' ');
      chunkMap[chunk] = (chunkMap[chunk] || 0) + 1;
    });
  }
}

// 前缀合并：同一批实例产出的长短候选只保留一条，避免重复计数与稀释
// 规则：短词块 S 与其延伸 L（L 以 S 开头）
//   · 计数相等 → 每次 S 都延伸到了 L，保留更长的 L（distinguish right from wrong）
//   · 计数不等 → L 只是零散延伸，保留聚合的 S（take care of）
// 保护动宾搭配（长度2，动词+名词）：run marathon 不被 run marathon in country 吞噬
function _mergeChunkVariants(chunkMap, word) {
  const keys = Object.keys(chunkMap);
  const kept = new Set(keys);
  const w = (word || '').toLowerCase();
  for (const L of keys) {
    const ws = L.split(' ');
    if (ws.length < 3) continue;
    let dropped = false;
    for (let n = ws.length - 1; n >= 2; n--) {
      const S = ws.slice(0, n).join(' ');
      if (chunkMap[S] === undefined) continue;
      // 保护动宾搭配（长度2，动词+名词宾语）：不被长词块删除
      // run marathon 不应被 run marathon in country 删除（in country 只是上下文）
      if (n === 2 && S.split(' ')[0] === w) {
        const obj = S.split(' ')[1];
        const objLemma = _lemmaOf(obj) || obj;
        if (_nounSet().has(objLemma)) continue;  // 动宾搭配，保留短词块
      }
      if (chunkMap[S] === chunkMap[L]) { kept.delete(S); continue; }
      kept.delete(L); dropped = true; break;
    }
    if (dropped) continue;
  }
  return keys.filter(k => kept.has(k)).map(k => [k, chunkMap[k]]);
}

// 搭配质量评分：动宾/形+名搭配教学价值高，即使频率低也应优先；
// 介词/副词弱搭配即使高频也降权。综合分 = 频率 + 质量分 × 1.5
function _chunkQualityScore(chunk, word) {
  const ws = chunk.split(' ');
  const w = word.toLowerCase();
  const idx = ws.indexOf(w);
  if (idx === -1) return 0;
  const left = ws.slice(0, idx);
  const right = ws.slice(idx + 1);
  let q = 0;
  // 形+名（word在末位，左边有内容词）：cross-country run / long run
  if (left.length > 0 && right.length === 0) { q = 3; }
  // word在开头
  else if (idx === 0 && right.length > 0) {
    const next = right[0];
    if (CK_HARD_PARTICLE.has(next)) q = 2;                        // 动词+小品词：run out / run back
    else if (CK_PREP.has(next) && right.length === 1) q = 1;     // 动词+介词（单独）：run at
    else if (CK_PREP.has(next) && right.length >= 2) q = 2.5;    // 动词+介词+宾语：run at speed
    else {
      const nextLemma = _lemmaOf(next) || next;
      if (_nounSet().has(nextLemma)) q = 3;                       // 动宾搭配：run business / run marathon
      else if (_ckContentWord(next) || _adjSet().has(nextLemma)) q = 1.5;  // 动词+形容词：make sure
      else q = 0;
    }
  }
  else if (left.length > 0 && right.length > 0) { q = 2.5; }     // 完整词块：take care of
  // 长度惩罚：超过3个词的搭配降权（避免上下文噪声如"run marathon in country"）
  if (ws.length > 3) q -= (ws.length - 3) * 0.5;
  return q;
}

// ====== 常见结构：语法框架分析（按词性输出抽象模式） ======
function _deriveStructDesc(word, catMap, structMap, sigCat, primaryPos, topCollocations) {
  const w = word.toLowerCase();
  const parts = [];
  const sigs = Object.keys(sigCat);

  // 优先：从高频搭配反向推断常见结构（数据驱动，避免例句上下文误分类）
  if (topCollocations && topCollocations.length > 0) {
    const patterns = new Set();
    topCollocations.forEach(([ph]) => {
      const words = ph.split(' ');
      const idx = words.indexOf(w);
      if (idx === -1) return;
      // word 在开头：动词用法（figure out / figure into ...）
      if (idx === 0 && words.length > 1) {
        const next = words[1];
        if (ST_PARTICLES.has(next)) patterns.add('verb_particle');
        else if (ST_PREP.has(next)) patterns.add('verb_prep');
        else if (next.length > 2 && !ST_STOP.has(next)) patterns.add('verb_obj');
      }
      // word 不在开头：名词/形容词用法（official figure / respected figure ...）
      else if (idx > 0) {
        const prev = words[idx - 1];
        // 前一个词不是功能词/限定词/介词/助动词，且长度>2 → 视为形容词+名词
        if (prev.length > 2 && !ST_DET.has(prev) && !ST_AUX.has(prev) &&
            !ST_PREP.has(prev) && !ST_PARTICLES.has(prev) && !ST_STOP.has(prev)) {
          if (idx === words.length - 1) {
            patterns.add('adj_noun');
          } else if (idx < words.length - 1 && ST_PREP.has(words[idx + 1])) {
            patterns.add('adj_noun_prep'); // 形容词 + 名词 + 介词
          }
        }
      }
    });

    if (patterns.has('verb_particle')) parts.push(w + ' + 副词/小品词');
    if (patterns.has('verb_prep'))     parts.push(w + ' + 介词');
    if (patterns.has('verb_obj'))      parts.push(w + ' + 名词/代词');
    if (patterns.has('adj_noun') || patterns.has('adj_noun_prep')) parts.push('形容词 + ' + w);

    if (parts.length > 0) return parts.join('、');
  }

  // 回退：基于例句上下文结构签名的传统推导
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
    if (catMap['动词词组']) parts.push(w + ' + 副词/小品词');
    if (catMap['介词词组']) parts.push(w + ' + 介词');
    if (catMap['动宾结构']) parts.push(w + ' + 名词/代词');
  }

  if (!parts.length) return '';
  return parts.join('、');
}

// ====== 渲染风向标主函数 ======
// 词云：从例句中提取与目标词共现的课标内容词，按词频排序返回 top N
// 返回 [{w, c, pos}]，pos ∈ noun/verb/adj/other，供着色使用
function _extractCloudWords(defs, word) {
  const freq = {};
  const wLemma = word.toLowerCase();
  const nounS = _nounSet();
  const verbS = _verbOnlySet();
  const adjS = _adjSet();
  defs.forEach(d => {
    (d.ex || []).forEach(ex => {
      const s = ex.s || '';
      // 分词：提取字母序列（含连字符），跳过纯数字与标点
      const toks = s.match(/[a-zA-Z]+(?:-[a-zA-Z]+)*/g) || [];
      toks.forEach(tok => {
        const lemma = _lemmaOf(tok);
        if (!lemma) return;            // 非课标词（含专有名词自动过滤）
        if (lemma === wLemma) return;  // 跳过目标词自身
        freq[lemma] = (freq[lemma] || 0) + 1;
      });
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w, c]) => ({
      w, c,
      pos: nounS.has(w) ? 'noun' : verbS.has(w) ? 'verb' : adjS.has(w) ? 'adj' : 'other'
    }));
}

/* ========== 主题词汇语义网（10 主题）========== */
/* ========== 主题词汇语义网（100 主题 31 词不交叉，k-medoids 数据驱动）========== */
/* ========== 主题词汇语义网（100 主题 31 词不交叉，k-medoids 数据驱动）========== */
const THEME_NETS = [
  {
    name: "require",
    center: "require",
    branches: [
      { branch: "resource", items: ["resource", "visual", "youth", "security", "appeal", "weak", "favour", "position", "royal", "profile"] },
      { branch: "require", items: ["require", "pressure", "vision", "exam", "conclude", "sharp", "hire", "principle", "devote", "diagram"] },
      { branch: "migration", items: ["migration", "button", "bee", "cancer", "seek", "measure", "draft", "capture", "observe", "training", "servant"] },
    ]
  },
  {
    name: "conflict",
    center: "conflict",
    branches: [
      { branch: "capital", items: ["capital", "polite", "dead", "kingdom", "soldier", "debate", "tradition", "champion", "comprise", "core", "spy"] },
      { branch: "dedicate", items: ["dedicate", "ward", "brave", "mutual", "blood", "influential", "nation", "foreign", "extent", "recite", "wound"] },
      { branch: "voyage", items: ["voyage", "ashamed", "boundary", "desert", "drama", "marine", "poet", "poster", "threat", "solve"] },
    ]
  },
  {
    name: "reduce",
    center: "reduce",
    branches: [
      { branch: "reduce", items: ["reduce", "plastic", "garbage", "pollute", "electricity", "product", "consumption", "agency", "apart", "impact"] },
      { branch: "pollution", items: ["pollution", "climate", "waste", "carbon", "cut", "amount", "by", "affect", "plant", "this"] },
      { branch: "account", items: ["account", "help", "conduct", "argue", "also", "so", "they", "new", "fight", "surface"] },
    ]
  },
  {
    name: "stand",
    center: "stand",
    branches: [
      { branch: "police", items: ["police", "hole", "although", "watch", "noise", "kilometre", "know", "side", "stay", "make"] },
      { branch: "cloth", items: ["cloth", "mountain", "but", "both", "great", "crowd", "own", "happen", "eye", "somebody_someone"] },
      { branch: "giant", items: ["giant", "path", "tall", "metre", "fan", "forever", "speech", "exchange", "west", "annual"] },
    ]
  },
  {
    name: "simple",
    center: "simple",
    branches: [
      { branch: "hero", items: ["hero", "author", "ball", "digital", "seem", "learn", "diverse", "well", "their", "fable"] },
      { branch: "pole", items: ["pole", "keen", "appropriate", "king", "deserve", "zero", "flexible", "excuse", "complain", "formal"] },
      { branch: "diary", items: ["diary", "human", "even", "use", "print", "work", "best", "total", "concept", "your"] },
    ]
  },
  {
    name: "replace",
    center: "replace",
    branches: [
      { branch: "complicated", items: ["complicated", "bless", "candle", "banana", "throw", "lay", "defend", "shelf", "up", "just"] },
      { branch: "rhyme", items: ["rhyme", "gesture", "diamond", "pale", "tight", "nose", "aside", "gentle", "brand", "shine", "politician"] },
      { branch: "investment", items: ["investment", "blog", "keyboard", "livestock", "dictionary", "year", "borrow", "assume", "interesting", "mobile", "socialist"] },
    ]
  },
  {
    name: "convince",
    center: "convince",
    branches: [
      { branch: "coal", items: ["coal", "sow", "slave", "lamb", "potato", "format", "capacity", "lift", "worth", "weigh", "variation"] },
      { branch: "barbecue", items: ["barbecue", "hybrid", "grain", "wheat", "amateur", "pagoda", "patent", "nest", "arrow", "attain", "patriotism"] },
      { branch: "intense", items: ["intense", "attempt", "choke", "entitle", "exceed", "integrate", "negative", "trade", "bow", "artificial"] },
    ]
  },
  {
    name: "buy",
    center: "buy",
    branches: [
      { branch: "declare", items: ["declare", "take", "vegetable", "he", "time", "spend", "some", "man", "ask", "purpose"] },
      { branch: "shop", items: ["shop", "why", "pass", "want", "meet", "big", "much", "cook", "secret", "pay"] },
      { branch: "budget", items: ["budget", "purchase", "job", "meal", "offer", "rent", "eat", "map", "advice", "company"] },
    ]
  },
  {
    name: "moment",
    center: "moment",
    branches: [
      { branch: "moment", items: ["moment", "touch", "behind", "dark", "positive", "strength", "thin", "spirit", "everyday", "instant"] },
      { branch: "bus", items: ["bus", "corn", "cold", "corner", "jump", "happy", "not", "stress", "real", "again"] },
      { branch: "nervous", items: ["nervous", "character", "tell", "suit", "say", "ready", "down", "skin", "him", "hand"] },
    ]
  },
  {
    name: "business",
    center: "business",
    branches: [
      { branch: "station", items: ["station", "bank", "earn", "fork", "out", "disability", "service", "decision", "now", "relationship"] },
      { branch: "channel", items: ["channel", "allow", "near", "leave", "catch", "college", "run", "dollar", "desk", "international"] },
      { branch: "business", items: ["business", "bad", "overcome", "problem", "generation", "schedule", "next", "project", "ordinary", "sick"] },
    ]
  },
  {
    name: "per",
    center: "per",
    branches: [
      { branch: "throughout", items: ["throughout", "show", "air", "cause", "group", "below", "low", "lower", "need", "level"] },
      { branch: "per", items: ["per", "material", "government", "advantage", "fee", "basis", "nearly", "achievement", "farm", "wander"] },
      { branch: "transition", items: ["transition", "million", "which", "only", "average", "among", "country", "follow", "test", "come"] },
    ]
  },
  {
    name: "hour",
    center: "hour",
    branches: [
      { branch: "washroom", items: ["washroom", "park", "light", "if", "available", "welcome", "until", "city", "other", "week"] },
      { branch: "fly", items: ["fly", "try", "left", "later", "evening", "less", "area", "activity", "half", "most"] },
      { branch: "square", items: ["square", "decide", "early", "into", "couple", "tree", "tour", "morning", "water", "interest"] },
    ]
  },
  {
    name: "art",
    center: "art",
    branches: [
      { branch: "gallery", items: ["gallery", "artist", "museum", "paint", "contemporary", "festival", "view", "discover", "piece", "beauty"] },
      { branch: "art", items: ["art", "exhibition", "prince_princess", "creative", "display", "appreciate", "culture", "maths", "dance", "decorate"] },
      { branch: "admire", items: ["admire", "century", "eastern", "once", "talent", "sculpture", "modern", "visitor", "thing", "antique"] },
    ]
  },
  {
    name: "no",
    center: "no",
    branches: [
      { branch: "extraordinary", items: ["extraordinary", "could", "me", "begin", "understand", "word", "reason", "something", "us", "few"] },
      { branch: "apparently", items: ["apparently", "walk", "during", "many", "thought", "start", "course", "continue", "any", "free"] },
      { branch: "no", items: ["no", "far", "story", "important", "please", "always", "kid", "read", "passage", "though"] },
    ]
  },
  {
    name: "choose",
    center: "choose",
    branches: [
      { branch: "shall", items: ["shall", "whose", "finish", "lawyer", "agree", "paper", "fail", "receive", "choice", "online"] },
      { branch: "choose", items: ["choose", "aim", "event", "middle", "parent", "table", "swim", "move", "enter", "discuss"] },
      { branch: "greet", items: ["greet", "breakfast", "joy", "mouth", "track", "dog", "staff", "contest", "sound", "door"] },
    ]
  },
  {
    name: "talk",
    center: "talk",
    branches: [
      { branch: "than", items: ["than", "support", "accident", "place", "between", "busy", "end", "difficult", "may", "hear"] },
      { branch: "speaker", items: ["speaker", "conversation", "mistake", "meeting", "tomorrow", "movie", "trouble", "mrs", "extra", "deal"] },
      { branch: "shirt", items: ["shirt", "woman", "bill", "recommend", "advise", "season", "northern", "saucer", "father", "benefit"] },
    ]
  },
  {
    name: "together",
    center: "together",
    branches: [
      { branch: "rope", items: ["rope", "meaning", "sun", "month", "famous", "tend", "adventure", "same", "novel", "tool"] },
      { branch: "theatre", items: ["theatre", "summer", "rainbow", "mark", "significant", "winter", "return", "director", "string", "actually"] },
      { branch: "together", items: ["together", "bright", "visit", "around", "wind", "note", "improve", "age", "communicate", "humourous"] },
    ]
  },
  {
    name: "scientist",
    center: "scientist",
    branches: [
      { branch: "protect", items: ["protect", "insect", "animal", "kill", "bird", "species", "exercise", "lab", "science", "result"] },
      { branch: "scientist", items: ["scientist", "effect", "against", "concern", "sample", "green", "publish", "doubt", "vast", "warn"] },
      { branch: "chemical", items: ["chemical", "experiment", "lack", "rain", "variety", "worse", "prove", "achieve", "enemy", "radio"] },
    ]
  },
  {
    name: "mention",
    center: "mention",
    branches: [
      { branch: "mention", items: ["mention", "treasure", "object", "pair", "specialist", "transform", "seldom", "issue", "foot", "quote"] },
      { branch: "symphony", items: ["symphony", "example", "independent", "shape", "association", "surrounding", "heart", "somewhere", "include", "invest", "protest"] },
      { branch: "ballet", items: ["ballet", "vocabulary", "loss", "society", "calligraphy", "stone", "digest", "ancient", "childhood", "difficulty"] },
    ]
  },
  {
    name: "remember",
    center: "remember",
    branches: [
      { branch: "remember", items: ["remember", "voice", "page", "style", "friendship", "listen", "forget", "wonderful", "ourselves", "lovely"] },
      { branch: "guy", items: ["guy", "music", "desire", "brother", "plot", "bit", "else", "myself", "really", "carry"] },
      { branch: "serious", items: ["serious", "complete", "finally", "camp", "board", "stop", "easy", "true", "everybody_everyone", "bed"] },
    ]
  },
  {
    name: "provide",
    center: "provide",
    branches: [
      { branch: "item", items: ["item", "prefer", "computer", "under", "system", "special", "major", "apply", "common", "type"] },
      { branch: "province", items: ["province", "conservation", "cover", "today", "form", "limited", "period", "adult", "explore", "point"] },
      { branch: "provide", items: ["provide", "limit", "opportunity", "advance", "vital", "request", "adopt", "adapt", "reserve", "institution"] },
    ]
  },
  {
    name: "school",
    center: "school",
    branches: [
      { branch: "doll", items: ["doll", "teacher", "student", "teach", "class", "off", "education", "soon", "garden", "sister"] },
      { branch: "present", items: ["present", "practise", "classroom", "girl", "classmate", "head", "sudden", "essay", "almost", "break"] },
      { branch: "school", items: ["school", "coach", "grade", "herself", "store", "surprise", "afraid", "laugh", "proud", "fruit"] },
    ]
  },
  {
    name: "quick",
    center: "quick",
    branches: [
      { branch: "scream", items: ["scream", "calm", "shake", "pick", "himself", "milk", "hot", "situation", "mr", "labour"] },
      { branch: "quick", items: ["quick", "challenge", "heat", "within", "burn", "rice", "wolf", "luck", "building", "usual"] },
      { branch: "attack", items: ["attack", "land", "strong", "smile", "nice", "across", "disappointed", "serve", "body", "taste"] },
    ]
  },
  {
    name: "bring",
    center: "bring",
    branches: [
      { branch: "insist", items: ["insist", "habitat", "trip", "sport", "public", "join", "enable", "tiny", "produce", "pot", "rival"] },
      { branch: "bring", items: ["bring", "sight", "doctor", "ensure", "community", "soft", "flavour", "language", "industry", "wife"] },
      { branch: "conflict", items: ["union", "chess", "deep", "iron", "summary", "literary", "ache", "drought", "leak", "miracle"] },
    ]
  },
  {
    name: "must",
    center: "must",
    branches: [
      { branch: "cafeteria", items: ["cafeteria", "direct", "travel", "select", "sentence", "introduction", "ground", "perfect", "autumn", "indicate", "packet"] },
      { branch: "athlete", items: ["athlete", "spring", "academic", "collection", "wait", "application", "lake", "humanity", "master", "image"] },
      { branch: "final", items: ["final", "poem", "rush", "nothing", "mineral", "recently", "full", "beat", "competition", "english"] },
    ]
  },
  {
    name: "increase",
    center: "increase",
    branches: [
      { branch: "increase", items: ["increase", "environment", "particular", "agriculture", "decline", "general", "length", "percentage", "drown", "ecology"] },
      { branch: "rise", items: ["rise", "university", "approach", "north", "whether", "soil", "development", "farmer", "promote", "connect"] },
      { branch: "harm", items: ["harm", "remain", "state", "infer", "crop", "temperature", "opposite", "heritage", "similar", "role"] },
    ]
  },
  {
    name: "grow",
    center: "grow",
    branches: [
      { branch: "telephone", items: ["telephone", "method", "dry", "top", "cloud", "fast", "wall", "grass", "imagine", "succeed"] },
      { branch: "grow", items: ["grow", "disease", "trend", "hospital", "forest", "solution", "further", "degree", "praise", "root"] },
      { branch: "urban", items: ["urban", "soul", "characteristic", "attract", "tooth", "everywhere", "floor", "barrier", "mine", "ruin"] },
    ]
  },
  {
    name: "sit",
    center: "sit",
    branches: [
      { branch: "bend", items: ["bend", "tea", "unusual", "maybe", "lunch", "cry", "alive", "daily", "nod", "poor"] },
      { branch: "sit", items: ["sit", "toy", "living", "goodbye", "customer", "excited", "pain", "instrument", "attention", "town"] },
      { branch: "quiet", items: ["quiet", "upon", "star", "phrase", "picture", "alarm", "deliver", "friendly", "plenty", "branch"] },
    ]
  },
  {
    name: "global",
    center: "global",
    branches: [
      { branch: "global", items: ["global", "absolutely", "standard", "essential", "calorie", "invent", "obviously", "delight", "fair", "upper"] },
      { branch: "meanwhile", items: ["meanwhile", "shortage", "consequence", "bias", "instance", "supply", "racial", "record", "reflect", "region"] },
      { branch: "current", items: ["current", "potential", "belief", "engine", "rose", "structure", "analyse", "army", "disappear", "polar"] },
    ]
  },
  {
    name: "research",
    center: "research",
    branches: [
      { branch: "research", items: ["research", "data", "scientific", "gain", "base", "indeed", "personal", "speed", "encounter", "normal"] },
      { branch: "finding", items: ["finding", "professor", "evolve", "expect", "mental", "confirm", "engineer", "identify", "unique", "sea"] },
      { branch: "determine", items: ["determine", "feature", "feed", "fish", "ai", "consume", "theory", "exist", "movement", "size"] },
    ]
  },
  {
    name: "outside",
    center: "outside",
    branches: [
      { branch: "outside", items: ["outside", "fun", "window", "shock", "chart", "wire", "stare", "hen", "bear", "dam"] },
      { branch: "edge", items: ["edge", "gather", "maintain", "soup", "contact", "creature", "breathe", "above", "correspond", "expansion"] },
      { branch: "fine", items: ["fine", "subject", "dynasty", "ham", "panda", "favourite", "cat", "meat", "pose", "shallow"] },
    ]
  },
  {
    name: "hold",
    center: "hold",
    branches: [
      { branch: "skirt", items: ["skirt", "game", "writer", "attend", "host_hostess", "ultimately", "session", "date", "musician", "official"] },
      { branch: "paragraph", items: ["paragraph", "black", "central", "player", "charge", "kitchen", "party", "card", "therefore", "press"] },
      { branch: "junior", items: ["junior", "flow", "model", "bath", "definitely", "distance", "frost", "impression", "private", "resolution"] },
    ]
  },
  {
    name: "control",
    center: "control",
    branches: [
      { branch: "control", items: ["control", "condition", "careful", "damage", "compare", "grocery", "weed", "monitor", "match", "crazy"] },
      { branch: "nail", items: ["nail", "persuade", "reaction", "fund", "eager", "switch", "valuable", "vary", "specific", "transport", "principal"] },
      { branch: "decade", items: ["decade", "practical", "regard", "repeat", "lazy", "prevent", "price", "hang", "action", "tie"] },
    ]
  },
  {
    name: "process",
    center: "process",
    branches: [
      { branch: "contain", items: ["contain", "reward", "individual", "lie", "complex", "divide", "case", "blue", "source", "original"] },
      { branch: "process", items: ["process", "copy", "consist", "smart", "fit", "involve", "dish", "factor", "survive", "aware"] },
      { branch: "roast", items: ["roast", "facility", "ocean", "wedding", "accept", "content", "evidence", "response", "abroad", "factory"] },
    ]
  },
  {
    name: "people",
    center: "people",
    branches: [
      { branch: "recent", items: ["recent", "yourself", "short", "list", "road", "confident", "rather", "identity", "front", "means"] },
      { branch: "evaluate", items: ["evaluate", "habit", "task", "already", "goal", "suffer", "fix", "believe", "drink", "national"] },
      { branch: "person", items: ["person", "lot", "social", "name", "function", "itself", "struggle", "necessary", "stick", "step"] },
    ]
  },
  {
    name: "china_8a7d7b",
    center: "china_8a7d7b",
    branches: [
      { branch: "email", items: ["email", "chinese", "south", "citizen", "combine", "globe", "translate", "pig", "camera", "angry"] },
      { branch: "introduce", items: ["introduce", "drop", "emperor_empress", "exposure", "statistic", "snow", "settle", "bat", "comedy", "deaf"] },
      { branch: "china", items: ["china", "grandson", "hit", "idiom", "negotiate", "revolution", "white", "east", "finger", "harmful"] },
    ]
  },
  {
    name: "my",
    center: "my",
    branches: [
      { branch: "depress", items: ["depress", "son", "dream", "shout", "tired", "anything", "loud", "news", "hair", "spare"] },
      { branch: "night", items: ["night", "birthday", "reply", "push", "daughter", "upset", "joke", "personality", "ring", "office"] },
      { branch: "my", items: ["my", "hardly", "roll", "cool", "confidence", "funny", "immediately", "pleasure", "pet", "shoot"] },
    ]
  },
  {
    name: "his",
    center: "his",
    branches: [
      { branch: "his", items: ["his", "become", "worry", "pull", "afternoon", "stage", "search", "quit", "sale", "cure"] },
      { branch: "tv", items: ["tv", "boy", "motivate", "beyond", "sleep", "weather", "save", "mess", "beach", "climb"] },
      { branch: "those", items: ["those", "ear", "thank", "regret", "uncle", "attach", "department", "neighbourhood", "repair", "vacation"] },
    ]
  },
  {
    name: "she",
    center: "she",
    branches: [
      { branch: "she", items: ["she", "her", "husband", "medicine", "born", "wish", "yes", "medical", "guess", "grandmother"] },
      { branch: "anxiety", items: ["anxiety", "notice", "direction", "sweet", "patient", "trial", "graduate", "bag", "wear", "grandfather", "watermelon"] },
      { branch: "mother", items: ["mother", "rest", "fashion", "red", "dress", "hurt", "lifestyle", "sing", "sign", "amazing"] },
    ]
  },
  {
    name: "lost",
    center: "lost",
    branches: [
      { branch: "coast", items: ["coast", "island", "whale", "hobby", "western", "bike", "boat", "transfer", "ok", "sail"] },
      { branch: "lost", items: ["lost", "lose", "eventually", "despite", "colour", "southern", "empty", "passenger", "ship", "chalk"] },
      { branch: "bottom", items: ["bottom", "mile", "ice", "destroy", "basketball", "medal", "bridge", "gold", "precious", "remind"] },
    ]
  },
  {
    name: "pure",
    center: "pure",
    branches: [
      { branch: "intervention", items: ["intervention", "careless", "stomach", "occupation", "pub", "depth", "drug", "odd", "boil", "republic"] },
      { branch: "passive", items: ["passive", "sand", "tale", "wake", "authority", "beer", "commitment", "leadership", "queen", "blackboard", "reinforce"] },
      { branch: "teapot", items: ["teapot", "friction", "microscope", "outstanding", "suspect", "tank", "tap", "asleep", "insight", "strategy"] },
    ]
  },
  {
    name: "success",
    center: "success",
    branches: [
      { branch: "success", items: ["success", "editor", "single", "acknowledge", "refuse", "prize", "failure", "delete", "lecture", "recognition"] },
      { branch: "career", items: ["career", "emphasis", "sell", "pursue", "film", "freedom", "dragon", "fog", "lightning", "respect"] },
      { branch: "curious", items: ["curious", "steam", "correct", "rich", "narrow", "secure", "die", "typical", "institute", "satisfaction"] },
    ]
  },
  {
    name: "technology",
    center: "technology",
    branches: [
      { branch: "technology", items: ["technology", "power", "device", "electric", "app", "energy", "wide", "economy", "target", "market"] },
      { branch: "ambulance", items: ["ambulance", "remove", "nobody", "crime", "operate", "pen", "rabbit", "establish", "familiar", "represent"] },
      { branch: "address", items: ["address", "worst", "invention", "robot", "onto", "economic", "recycle", "spread", "unit", "letter"] },
    ]
  },
  {
    name: "family",
    center: "family",
    branches: [
      { branch: "eliminate", items: ["eliminate", "tonight", "household", "straight", "website", "bedroom", "baby", "fresh", "guide", "marry", "tropical"] },
      { branch: "post", items: ["post", "housework", "pretty", "airport", "grammar", "section", "wood", "club", "tough", "celebrate"] },
      { branch: "family", items: ["family", "member", "weekend", "elderly", "teenager", "fire", "clock", "flower", "license", "nurse"] },
    ]
  },
  {
    name: "home",
    center: "home",
    branches: [
      { branch: "sum", items: ["sum", "neighbour", "law", "basket", "village", "beautiful", "accompany", "chef", "demand", "furniture", "poverty"] },
      { branch: "house", items: ["house", "frequently", "homework", "lively", "annoy", "scare", "charity", "whatever", "cheap", "hill"] },
      { branch: "home", items: ["home", "goods", "grey", "salad", "safe", "witness", "figure", "cheer", "impossible", "dive"] },
    ]
  },
  {
    name: "think",
    center: "think",
    branches: [
      { branch: "think", items: ["think", "care", "develop", "usually", "anybody_anyone", "phone", "attitude", "interview", "yet", "perform"] },
      { branch: "ce", items: ["ce", "satisfy", "sad", "spell", "comment", "expand", "reject", "ignore", "professional", "term"] },
      { branch: "thinking", items: ["thinking", "dozen", "detail", "healthy", "donate", "expose", "none", "round", "leaf", "reality"] },
    ]
  },
  {
    name: "money",
    center: "money",
    branches: [
      { branch: "let", items: ["let", "policy", "saving", "bar", "silver", "football", "heavy", "cancel", "score", "series"] },
      { branch: "money", items: ["money", "wi_fi", "classic", "yesterday", "active", "tennis", "vote", "chicken", "compete", "distinguish"] },
      { branch: "gift", items: ["gift", "recipe", "smell", "wash", "cent", "coin", "currency", "distribution", "flag", "innovation"] },
    ]
  },
  {
    name: "open",
    center: "open",
    branches: [
      { branch: "survey", items: ["survey", "historic", "interrupt", "certainly", "register", "fantastic", "option", "primary", "sheet", "glass"] },
      { branch: "shame", items: ["shame", "architect", "urge", "aspect", "cross", "menu", "volleyball", "voluntary", "background", "chair", "turkey"] },
      { branch: "open", items: ["open", "destination", "patience", "pleasant", "tunnel", "wealth", "rare", "block", "hate", "tear"] },
    ]
  },
  {
    name: "instead",
    center: "instead",
    branches: [
      { branch: "instead", items: ["instead", "clean", "treat", "supermarket", "lesson", "fear", "traffic", "box", "huge", "strike"] },
      { branch: "delicious", items: ["delicious", "emotion", "shower", "behaviour", "cycle", "native", "context", "motor", "sink", "exactly"] },
      { branch: "smog", items: ["smog", "loose", "pe", "mostly", "awful", "fantasy", "toast", "yellow", "comfortable", "aunt"] },
    ]
  },
  {
    name: "programme",
    center: "programme",
    branches: [
      { branch: "astronaut", items: ["astronaut", "concert", "modernization", "weekly", "participate", "remote", "access", "volunteer", "software", "absorb", "sore"] },
      { branch: "change", items: ["change", "leader", "jam", "manager", "gym", "procedure", "war", "audience", "setting", "error"] },
      { branch: "band", items: ["band", "astonish", "relevant", "ahead", "seat", "anxious", "female", "guest", "partner", "basic"] },
    ]
  },
  {
    name: "blanket",
    center: "blanket",
    branches: [
      { branch: "blanket", items: ["blanket", "panic", "aboard", "resolve", "calculate", "delay", "blind", "chip", "punish", "decent"] },
      { branch: "qualification", items: ["qualification", "wrap", "noble", "pants", "theirs", "awake", "mud", "poison", "butter", "cupboard"] },
      { branch: "church", items: ["church", "genuine", "package", "badminton", "grateful", "operator", "oven", "parcel", "headache", "desperate", "trousers"] },
    ]
  },
  {
    name: "uniform",
    center: "uniform",
    branches: [
      { branch: "baseball", items: ["baseball", "chemistry", "bride_bridegroom", "circuit", "consultant", "fireman", "housing", "navy", "compass", "pray", "volcano"] },
      { branch: "bakery", items: ["bakery", "tube", "secondary", "sweep", "dessert", "consultation", "mechanic", "port", "imply", "dirty", "prosperity"] },
      { branch: "elevator", items: ["elevator", "nuclear", "kettle", "subway", "fibre", "legal", "financial", "loan", "cake", "strict", "phase"] },
    ]
  },
  {
    name: "plan",
    center: "plan",
    branches: [
      { branch: "log", items: ["log", "plate", "handle", "credit", "duck", "teamwork", "journey", "death", "review", "wet"] },
      { branch: "plan", items: ["plan", "committee", "mad", "olympic", "pan", "discussion", "parking", "regular", "knock", "message"] },
      { branch: "sorry", items: ["sorry", "brochure", "comfort", "porridge", "angle", "escape", "hunt", "majority", "taxi", "contribution"] },
    ]
  },
  {
    name: "ability",
    center: "ability",
    branches: [
      { branch: "ability", items: ["ability", "wonder", "brain", "memory", "knowledge", "force", "sky", "weight", "fence", "stimulate"] },
      { branch: "truth", items: ["truth", "vivid", "fault", "perspective", "pretend", "exciting", "brush", "construction", "magic", "wetland"] },
      { branch: "poetry", items: ["poetry", "corporate", "defeat", "magnificent", "palace", "portrait", "range", "alternative", "conclusion", "employ"] },
    ]
  },
  {
    name: "clear",
    center: "clear",
    branches: [
      { branch: "litter", items: ["litter", "origin", "adaptation", "flood", "strengthen", "mix", "confused", "dear", "gap", "monkey"] },
      { branch: "shoe", items: ["shoe", "wheel", "network", "besides", "bored", "dig", "fox", "journalist", "ray", "slightly"] },
      { branch: "greenhouse", items: ["greenhouse", "addition", "curtain", "deny", "dimension", "dinosaur", "inch", "opera", "release", "rough"] },
    ]
  },
  {
    name: "face",
    center: "face",
    branches: [
      { branch: "constant", items: ["constant", "dangerous", "freeze", "sir", "butterfly", "interpret", "leg", "somehow", "suppose", "pronunciation"] },
      { branch: "face", items: ["face", "intelligent", "railway", "arm", "symbol", "precisely", "plane", "promise", "brown", "empathy"] },
      { branch: "future", items: ["future", "storm", "conference", "flash", "clinic", "cow", "inner", "kick", "pound", "hesitate"] },
    ]
  },
  {
    name: "explain",
    center: "explain",
    branches: [
      { branch: "pool", items: ["pool", "false", "assess", "notebook", "phenomenon", "preserve", "responsible", "random", "surround", "clarify", "suburb"] },
      { branch: "towards", items: ["towards", "philosophy", "carrot", "offend", "intend", "biology", "bond", "president", "wallet", "proposal"] },
      { branch: "tip", items: ["tip", "aid", "coffee", "demonstrate", "theme", "version", "helpful", "previous", "worker", "christmas"] },
    ]
  },
  {
    name: "duration",
    center: "duration",
    branches: [
      { branch: "fabric", items: ["fabric", "anticipate", "mall", "receipt", "recreation", "drill", "memorial", "cotton", "proceed", "breast", "mushroom"] },
      { branch: "goat", items: ["goat", "dizzy", "geometry", "temporary", "hike", "beard", "bowling", "communist", "competence", "cooperate", "windy"] },
      { branch: "frequency", items: ["frequency", "cucumber", "estate", "extension", "gentleman", "horror", "intellectual", "obstacle", "subscribe", "tournament", "wrestle"] },
    ]
  },
  {
    name: "book",
    center: "book",
    branches: [
      { branch: "book", items: ["book", "history", "library", "article", "custom", "rule", "opinion", "relax", "chapter", "ticket"] },
      { branch: "express", items: ["express", "bother", "magazine", "grand", "literature", "occur", "terrible", "brilliant", "librarian", "novelist"] },
      { branch: "write", items: ["write", "progress", "belong", "scene", "discount", "electronic", "entry", "lend", "candy", "dare"] },
    ]
  },
  {
    name: "question",
    center: "question",
    branches: [
      { branch: "answer", items: ["answer", "discovery", "nor", "comparison", "claim", "physics", "regardless", "universe", "description", "ideal"] },
      { branch: "objective", items: ["objective", "assumption", "blame", "screen", "comprehension", "continent", "defence", "elephant", "genius", "illness"] },
      { branch: "question", items: ["question", "especially", "themselves", "topic", "either", "video", "relate", "definition", "entirely", "instruction"] },
    ]
  },
  {
    name: "earth",
    center: "earth",
    branches: [
      { branch: "earth", items: ["earth", "planet", "shift", "river", "suggestion", "collect", "missing", "pond", "bottle", "calendar"] },
      { branch: "moon", items: ["moon", "apple", "incredible", "flat", "bitter", "bacteria", "fool", "satellite", "solar", "disaster"] },
      { branch: "illustrate", items: ["illustrate", "fundamental", "pour", "site", "stream", "virtual", "battle", "mirror", "assistant", "atmosphere"] },
    ]
  },
  {
    name: "multiple",
    center: "multiple",
    branches: [
      { branch: "sew", items: ["sew", "discipline", "gene", "accuse", "ethical", "monthly", "educator", "prison", "automatic", "proof", "resign"] },
      { branch: "symptom", items: ["symptom", "infection", "arrest", "flu", "alert", "announce", "pear", "sneeze", "astronomer", "noon", "missile"] },
      { branch: "toothache", items: ["toothache", "pill", "abuse", "sleepy", "pessimistic", "nut", "skip", "refresh", "dentist", "lung", "subjective"] },
    ]
  },
  {
    name: "train",
    center: "train",
    branches: [
      { branch: "bug", items: ["bug", "strawberry", "chocolate", "fortunately", "certificate", "semester", "smooth", "campus", "platform", "treatment", "nephew"] },
      { branch: "train", items: ["train", "entrance", "launch", "rubber", "superior", "valid", "fry", "enhance", "expense", "fuel"] },
      { branch: "apartment", items: ["apartment", "insurance", "stupid", "hall", "signal", "tourist", "conventional", "exit", "political", "qualify"] },
    ]
  },
  {
    name: "since",
    center: "since",
    branches: [
      { branch: "nowadays", items: ["nowadays", "affair", "hungry", "update", "chain", "jaw", "riddle", "scarf", "ingredient", "overall"] },
      { branch: "dust", items: ["dust", "retire", "juice", "march", "danger", "oil", "quantity", "ton", "bay", "cell", "plus"] },
      { branch: "since", items: ["since", "location", "yard", "tablet", "actor_actress", "brief", "massive", "import", "postcard", "anyway"] },
    ]
  },
  {
    name: "such",
    center: "such",
    branches: [
      { branch: "teenage", items: ["teenage", "link", "nutrition", "panel", "rely", "reliable", "composition", "senior", "convenient", "expectation"] },
      { branch: "bone", items: ["bone", "passion", "dolphin", "commercial", "warning", "elsewhere", "solid", "yours", "examine", "glad"] },
      { branch: "such", items: ["such", "moral", "rapid", "responsibility", "awkward", "silence", "cream", "file", "outline", "passport"] },
    ]
  },
  {
    name: "dismiss",
    center: "dismiss",
    branches: [
      { branch: "mystery", items: ["mystery", "thunder", "agenda", "suspend", "canal", "subsequent", "division", "primitive", "super", "equator"] },
      { branch: "leather", items: ["leather", "hers", "enormous", "manner", "basin", "handkerchief", "humble", "integrity", "millimetre", "output", "surgeon"] },
      { branch: "dismiss", items: ["dismiss", "pyramid", "fetch", "ruler", "load", "orchestra", "hatch", "steady", "bury", "chaos"] },
    ]
  },
  {
    name: "text",
    center: "text",
    branches: [
      { branch: "count", items: ["count", "landscape", "arrangement", "wave", "crash", "snack", "advocate", "differ", "geography", "absence"] },
      { branch: "cheese", items: ["cheese", "dramatic", "smoke", "wing", "ad", "category", "cup", "frame", "psychology", "trick", "strait"] },
      { branch: "title", items: ["title", "suitable", "hope", "refer", "sort", "influence", "safety", "expensive", "skate", "deer"] },
    ]
  },
  {
    name: "stability",
    center: "stability",
    branches: [
      { branch: "stability", items: ["stability", "rigid", "tax", "ripe", "mist", "mixture", "ms", "stair", "stamp", "twin"] },
      { branch: "chorus", items: ["chorus", "bomb", "clay", "violence", "drag", "flour", "glove", "piano", "relay", "bamboo", "wage"] },
      { branch: "loyal", items: ["loyal", "cage", "capsule", "chairman_chairwoman", "chemist", "civil", "criterion", "guitar", "metaphor", "onion", "ski"] },
    ]
  },
  {
    name: "various",
    center: "various",
    branches: [
      { branch: "pronounce", items: ["pronounce", "click", "extinction", "ancestor", "centimetre", "military", "arctic", "sympathy", "underground", "myth", "rhythm"] },
      { branch: "various", items: ["various", "sugar", "critical", "detect", "bean", "folk", "fountain", "grape", "newspaper", "rainy"] },
      { branch: "find", items: ["find", "studio", "wise", "trust", "ethnic", "herb", "lemon", "lion", "tofu", "weapon"] },
    ]
  },
  {
    name: "feel",
    center: "feel",
    branches: [
      { branch: "saying", items: ["saying", "clothes", "perceive", "lonely", "convey", "salary", "lucky", "steal", "awesome", "contrary"] },
      { branch: "its", items: ["its", "journal", "admit", "reputation", "appetite", "frightened", "ease", "handbag", "skateboard", "abstract"] },
      { branch: "feeling", items: ["feeling", "ambitious", "except", "fond", "routine", "otherwise", "recover", "presentation", "boss", "distant"] },
    ]
  },
  {
    name: "number",
    center: "number",
    branches: [
      { branch: "document", items: ["document", "birth", "medium", "plain", "pilot", "twice", "bonus", "boost", "fist", "permit"] },
      { branch: "number", items: ["number", "cost", "population", "photo", "relative", "campaign", "gas", "widespread", "europe", "bce"] },
      { branch: "granddaughter", items: ["granddaughter", "snake", "separate", "fold", "orange", "airline", "bathroom", "cuisine", "pioneer", "thick"] },
    ]
  },
  {
    name: "right",
    center: "right",
    branches: [
      { branch: "right", items: ["right", "wrong", "prepare", "hurry", "street", "hotel", "technique", "horse", "ought", "rock"] },
      { branch: "main", items: ["main", "oxygen", "efficient", "guarantee", "ride", "lean", "purple", "swing", "organ", "pattern"] },
      { branch: "or", items: ["or", "circumstance", "highway", "clever", "county", "foundation", "trunk", "interaction", "bunch", "charm"] },
    ]
  },
  {
    name: "win",
    center: "win",
    branches: [
      { branch: "graceful", items: ["graceful", "wisdom", "jungle", "policeman_policewoman", "brick", "cave", "surgery", "outcome", "balance", "winner", "sincerely"] },
      { branch: "neat", items: ["neat", "circle", "fiction", "slide", "tackle", "equipment", "fortune", "handwriting", "premier", "spacecraft"] },
      { branch: "award", items: ["award", "sweater", "ant", "cigarette", "envy", "forecast", "gratitude", "guard", "harmonious", "jazz"] },
    ]
  },
  {
    name: "high",
    center: "high",
    branches: [
      { branch: "confucius", items: ["confucius", "relieve", "commit", "envelope", "harmony", "mood", "peak", "maximum", "profit", "emerge"] },
      { branch: "and", items: ["and", "initial", "broadcast", "rating", "zone", "cast", "district", "mount", "pity", "shadow"] },
      { branch: "murder", items: ["murder", "shark", "whom", "directory", "route", "pocket", "former", "rate", "rank", "assign", "snowy"] },
    ]
  },
  {
    name: "popular",
    center: "popular",
    branches: [
      { branch: "sour", items: ["sour", "playground", "cookie", "anniversary", "domestic", "trap", "cautious", "honey", "impress", "irrigation", "pardon"] },
      { branch: "song", items: ["song", "spicy", "entertainment", "clue", "dynamic", "horrible", "kung", "lip", "monument", "pizza"] },
      { branch: "excellent", items: ["excellent", "sauce", "acid", "addict", "cousin", "download", "eagle", "explode", "fridge", "god"] },
    ]
  },
  {
    name: "build",
    center: "build",
    branches: [
      { branch: "legend", items: ["legend", "predict", "highlight", "abandon", "roof", "profession", "anywhere", "generous", "castle", "deadline", "telescope"] },
      { branch: "build", items: ["build", "justify", "muscle", "ceremony", "departure", "hug", "label", "remarkable", "seize", "tolerate"] },
      { branch: "cash", items: ["cash", "engage", "ban", "cattle", "harvest", "height", "investigate", "scholarship", "silk", "tailor"] },
    ]
  },
  {
    name: "fall",
    center: "fall",
    branches: [
      { branch: "amuse", items: ["amuse", "nearby", "lamp", "prohibit", "chief", "dialogue", "beside", "bread", "resident", "stretch", "mouse"] },
      { branch: "fall", items: ["fall", "adjust", "cheat", "crowded", "gradually", "garlic", "humour", "pudding", "collar", "detective"] },
      { branch: "cute", items: ["cute", "disabled", "leap", "postpone", "tobacco", "tone", "vase", "vehicle", "helicopter", "modest"] },
    ]
  },
  {
    name: "strange",
    center: "strange",
    branches: [
      { branch: "strange", items: ["strange", "stranger", "race", "holiday", "chat", "sigh", "purse", "delicate", "hide", "superb"] },
      { branch: "throat", items: ["throat", "lady", "afford", "neither", "egg", "pace", "relief", "enthusiastic", "blow", "breath", "radiation"] },
      { branch: "tape", items: ["tape", "hurricane", "earthquake", "frog", "shell", "lap", "exceptional", "grab", "billion", "shelter"] },
    ]
  },
  {
    name: "the",
    center: "the",
    branches: [
      { branch: "numerous", items: ["numerous", "respond", "proper", "generate", "broad", "obtain", "emergency", "fat", "firm", "recording", "receptionist"] },
      { branch: "the", items: ["the", "agreement", "blank", "ill", "property", "rescue", "whenever", "accurate", "aloud", "severe"] },
      { branch: "reference", items: ["reference", "sofa", "absent", "appointment", "illegal", "male", "mission", "reveal", "rural", "sensitive"] },
    ]
  },
  {
    name: "be",
    center: "be",
    subthemes: ["对象与状态", "行为与属性", "结构与关系"],
    branches: [
      { branch: "set", items: ["set", "shade", "alongside", "applicant", "duty", "era", "mass", "pride", "urgent", "anger"] },
      { branch: "yield", items: ["yield", "chore", "lunar", "butcher", "identical", "court", "sufficient", "pile", "ambition", "crew", "neutral"] },
      { branch: "be", items: ["be", "when", "get", "go", "who", "different", "here", "raise", "facilitate", "circus"] },
    ]
  },
  {
    name: "a_an",
    center: "a_an",
    branches: [
      { branch: "courage", items: ["courage", "elegant", "judge", "countryside", "database", "element", "hat", "hence", "honest", "intention", "supplement"] },
      { branch: "chest", items: ["chest", "nevertheless", "priority", "shut", "slice", "stadium", "bowl", "component", "mail", "virtue"] },
      { branch: "beef", items: ["beef", "altogether", "contrast", "decrease", "double", "downtown", "grasp", "liquid", "moreover", "puzzle"] },
    ]
  },
  {
    name: "to",
    center: "to",
    branches: [
      { branch: "pink", items: ["pink", "hi", "soccer", "react", "restore", "row", "seed", "stuff", "theft", "unless"] },
      { branch: "look", items: ["look", "burst", "candidate", "collapse", "discrimination", "drawer", "extend", "float", "incident", "kindergarten"] },
      { branch: "to", items: ["to", "you", "how", "quite", "fellow", "disappoint", "slip", "concentrate", "marathon", "victim"] },
    ]
  },
  {
    name: "in",
    center: "in",
    branches: [
      { branch: "peace", items: ["peace", "photographer", "raw", "tent", "ugly", "zoo", "thirsty", "venue", "advertise", "balloon"] },
      { branch: "we", items: ["we", "bounce", "capable", "concrete", "consistent", "faith", "grandparent", "honour", "income", "joint"] },
      { branch: "in", items: ["in", "order", "sure", "health", "car", "matter", "difference", "communication", "submit", "crucial"] },
    ]
  },
  {
    name: "of",
    center: "of",
    branches: [
      { branch: "of", items: ["of", "our", "over", "often", "part", "call", "little", "small", "play", "enjoy"] },
      { branch: "can", items: ["can", "gate", "lock", "merely", "ours", "preference", "realistic", "shoulder", "shy", "straightforward"] },
      { branch: "representative", items: ["representative", "threaten", "whisper", "accommodation", "acquire", "casual", "estimate", "fluent", "guidance", "injury"] },
    ]
  },
  {
    name: "and",
    center: "and",
    branches: [
      { branch: "and", items: ["day", "while", "live", "keep", "through", "too", "better", "friend", "very", "truck"] },
      { branch: "all", items: ["all", "organic", "behave", "oppose", "quarter", "recall", "salt", "status", "tendency", "wine"] },
      { branch: "more", items: ["more", "adorable", "bet", "coverage", "input", "spoon", "statue", "umbrella", "web", "administration"] },
    ]
  },
  {
    name: "for",
    center: "for",
    branches: [
      { branch: "for", items: ["for", "after", "see", "give", "long", "each", "child", "being", "old", "love"] },
      { branch: "will", items: ["will", "bell", "hometown", "cartoon", "coat", "elder", "glance", "membership", "niece", "pepper"] },
      { branch: "like", items: ["like", "reform", "split", "tidy", "virus", "ankle", "barely", "battery", "carpet", "cease"] },
    ]
  },
  {
    name: "it",
    center: "it",
    branches: [
      { branch: "it", items: ["it", "young", "idea", "another", "never", "mind", "without", "enough", "report", "sense"] },
      { branch: "good", items: ["good", "beneath", "disturb", "protein", "comprehensive", "contract", "crisis", "cruel", "distinct", "finance"] },
      { branch: "officer", items: ["officer", "frontier", "furthermore", "gender", "gun", "hello", "overseas", "prospect", "sausage", "selfish"] },
    ]
  },
  {
    name: "that",
    center: "that",
    branches: [
      { branch: "that", items: ["that", "life", "then", "these", "mean", "world", "because", "back", "still", "however"] },
      { branch: "would", items: ["would", "ceiling", "guideline", "prior", "somewhat", "starve", "sweat", "tower", "valley", "withdraw"] },
      { branch: "them", items: ["them", "chew", "civilian", "forgive", "kilo", "knee", "leisure", "logical", "metal", "net"] },
    ]
  },
  {
    name: "what",
    center: "what",
    branches: [
      { branch: "what", items: ["what", "local", "able", "design", "kind", "encourage", "information", "likely", "send", "describe"] },
      { branch: "where", items: ["where", "physician", "firework", "weep", "minimum", "nowhere", "optimistic", "pencil", "permanent", "petrol"] },
      { branch: "team", items: ["team", "politics", "possession", "rugby", "scale", "silly", "splendid", "sponsor", "welfare", "worthwhile"] },
    ]
  },
  {
    name: "do",
    center: "do",
    branches: [
      { branch: "do", items: ["do", "should", "experience", "suggest", "avoid", "quality", "add", "sometimes", "key", "act"] },
      { branch: "way", items: ["way", "rubbish", "rude", "drone", "alcohol", "captain", "client", "needle", "resistance", "rocket"] },
      { branch: "probably", items: ["probably", "secretary", "tail", "tomb", "victory", "cabbage", "congratulation", "cottage", "dominate", "erupt"] },
    ]
  },
  {
    name: "with",
    center: "with",
    branches: [
      { branch: "with", items: ["with", "large", "close", "field", "line", "natural", "extremely", "pack", "forward", "spot"] },
      { branch: "share", items: ["share", "initiative", "violin", "collaborate", "shore", "tomato", "fancy", "ink", "inspection", "knife"] },
      { branch: "chance", items: ["chance", "mercy", "mode", "obey", "orbit", "pancake", "sorrow", "substance", "substantial", "surf"] },
    ]
  },
  {
    name: "on",
    center: "on",
    branches: [
      { branch: "on", items: ["on", "drive", "focus", "arrive", "slow", "inspire", "check", "expert", "bite", "depend"] },
      { branch: "minute", items: ["minute", "occasion", "operation", "sustain", "tension", "typhoon", "wool", "autonomous", "backward", "carve"] },
      { branch: "equal", items: ["equal", "contradictory", "dawn", "dumpling", "eve", "export", "external", "fascinating", "gravity", "internal", "yoghurt"] },
    ]
  },
  {
    name: "from",
    center: "from",
    branches: [
      { branch: "from", items: ["from", "away", "draw", "nature", "certain", "inside", "useful", "perhaps", "traditional", "performance", "x_ray"] },
      { branch: "used", items: ["used", "minister", "pie", "plug", "steak", "visible", "approve", "border", "downstairs", "embarrassed", "wrist"] },
      { branch: "pacific", items: ["pacific", "fisherman", "kit", "mankind", "mature", "modify", "motive", "noisy", "opponent", "outgoing", "penguin"] },
    ]
  },
  {
    name: "about",
    center: "about",
    branches: [
      { branch: "about", items: ["about", "ago", "fact", "speak", "everything", "risk", "machine", "manage", "invite", "flight", "t_shirt"] },
      { branch: "centre", items: ["centre", "merry", "pipe", "proportion", "religion", "revise", "romantic", "salty", "sandwich", "souvenir", "stomachache"] },
      { branch: "thus", items: ["thus", "temple", "tiger", "toilet", "towel", "tune", "volume", "waist", "wrinkle", "arise", "socialism"] },
    ]
  },
  {
    name: "as",
    center: "as",
    branches: [
      { branch: "as", items: ["as", "effort", "along", "ever", "several", "miss", "consider", "whole", "warm", "possible", "shorts"] },
      { branch: "past", items: ["past", "motion", "picnic", "restrict", "biscuit", "camel", "command", "exhaust", "forehead", "frank", "sex"] },
      { branch: "appear", items: ["appear", "innocent", "laptop", "literally", "marriage", "midnight", "mild", "nationality", "occupy", "owe", "scissors"] },
    ]
  },
  {
    name: "at",
    center: "at",
    branches: [
      { branch: "at", items: ["at", "create", "room", "least", "space", "alone", "successful", "dinner", "wild", "driver", "schoolbag"] },
      { branch: "reach", items: ["reach", "respective", "scan", "debt", "energetic", "faint", "liberty", "minor", "noodle", "polish", "salesman_saleswoman"] },
      { branch: "gifted", items: ["gifted", "sunny", "thorough", "tissue", "worthy", "madam", "abnormal", "accent", "according_to", "africa", "mosquito"] },
    ]
  },
  {
    name: "food",
    center: "food",
    branches: [
      { branch: "food", items: ["food", "slim", "neck", "sheep", "steel", "afterward", "america", "antarctica", "anyhow", "apologise", "rejuvenate"] },
      { branch: "restaurant", items: ["restaurant", "applaud", "arch", "asia", "atlantic", "a_m_", "bacon", "bark", "behalf", "belt", "recognise"] },
      { branch: "diet", items: ["diet", "bin", "bleed", "blouse", "boot", "boring", "botanical", "bound", "boxing", "buffet", "realise"] },
    ]
  },
  {
    name: "lead",
    center: "lead",
    branches: [
      { branch: "value", items: ["value", "kite", "bully", "cafe", "canteen", "cap", "celebrity", "chopsticks", "cinema", "cite", "radium"] },
      { branch: "sacrifice", items: ["sacrifice", "civilisation", "clap", "clerk", "clone", "cloudy", "column", "comic", "compose", "confucianism", "postman"] },
      { branch: "skill", items: ["skill", "conscious", "constitution", "controversial", "costume", "cough", "council", "craft", "criticise", "curve", "pork"] },
    ]
  },
  {
    name: "fill",
    center: "fill",
    branches: [
      { branch: "weekday", items: ["weekday", "sock", "shave", "territory", "damp", "dignity", "dining", "disc", "domain", "dormitory", "ping_pong"] },
      { branch: "silent", items: ["silent", "due_to", "election", "endangered", "enterprise", "episode", "eraser", "fertile", "fever", "flame", "p_m_"] },
      { branch: "hamburger", items: ["hamburger", "fulfil", "giraffe", "glue", "golf", "gramme", "greedy", "guilty", "gymnastics", "handsome", "organise"] },
    ]
  },
  {
    name: "have",
    center: "have",
    branches: [
      { branch: "have", items: ["have", "before", "study", "turn", "found", "late", "put", "every", "might", "hard", "organisation"] },
      { branch: "last", items: ["last", "prejudice", "headline", "hydrogen", "i", "inquire", "internet", "jacket", "jeans", "jog", "o_clock"] },
      { branch: "there", items: ["there", "justice", "kangaroo", "kiss", "kung_fu", "lantern", "league", "liberation", "luxury", "minority", "mutton"] },
    ]
  },
];

// 词→主题 index 一一对应 (每词 1 主题, 100 主题覆盖 3096 课标词)
const WORD_TO_THEME = (() => {
  const m = new Map();
  m.set("a_an", [80]);
  m.set("a_m_", [96]);
  m.set("abandon", [75]);
  m.set("ability", [53]);
  m.set("able", [88]);
  m.set("abnormal", [95]);
  m.set("aboard", [50]);
  m.set("about", [93]);
  m.set("above", [30]);
  m.set("abroad", [33]);
  m.set("absence", [66]);
  m.set("absent", [78]);
  m.set("absolutely", [28]);
  m.set("absorb", [49]);
  m.set("abstract", [69]);
  m.set("abuse", [61]);
  m.set("academic", [24]);
  m.set("accent", [95]);
  m.set("accept", [33]);
  m.set("access", [49]);
  m.set("accident", [15]);
  m.set("accommodation", [83]);
  m.set("accompany", [44]);
  m.set("according_to", [95]);
  m.set("account", [2]);
  m.set("accurate", [78]);
  m.set("accuse", [61]);
  m.set("ache", [23]);
  m.set("achieve", [17]);
  m.set("achievement", [10]);
  m.set("acid", [74]);
  m.set("acknowledge", [41]);
  m.set("acquire", [83]);
  m.set("across", [22]);
  m.set("act", [89]);
  m.set("action", [32]);
  m.set("active", [46]);
  m.set("activity", [11]);
  m.set("actor_actress", [63]);
  m.set("actually", [16]);
  m.set("ad", [66]);
  m.set("adapt", [20]);
  m.set("adaptation", [54]);
  m.set("add", [89]);
  m.set("addict", [74]);
  m.set("addition", [54]);
  m.set("address", [42]);
  m.set("adjust", [76]);
  m.set("administration", [84]);
  m.set("admire", [12]);
  m.set("admit", [69]);
  m.set("adopt", [20]);
  m.set("adorable", [84]);
  m.set("adult", [20]);
  m.set("advance", [20]);
  m.set("advantage", [10]);
  m.set("adventure", [16]);
  m.set("advertise", [82]);
  m.set("advice", [7]);
  m.set("advise", [15]);
  m.set("advocate", [66]);
  m.set("affair", [63]);
  m.set("affect", [2]);
  m.set("afford", [77]);
  m.set("afraid", [21]);
  m.set("africa", [95]);
  m.set("after", [85]);
  m.set("afternoon", [37]);
  m.set("afterward", [96]);
  m.set("again", [8]);
  m.set("against", [17]);
  m.set("age", [16]);
  m.set("agency", [2]);
  m.set("agenda", [65]);
  m.set("ago", [93]);
  m.set("agree", [14]);
  m.set("agreement", [78]);
  m.set("agriculture", [25]);
  m.set("ahead", [49]);
  m.set("ai", [29]);
  m.set("aid", [56]);
  m.set("aim", [14]);
  m.set("air", [10]);
  m.set("airline", [70]);
  m.set("airport", [43]);
  m.set("alarm", [27]);
  m.set("alcohol", [89]);
  m.set("alert", [61]);
  m.set("alive", [27]);
  m.set("all", [84]);
  m.set("allow", [9]);
  m.set("almost", [21]);
  m.set("alone", [95]);
  m.set("along", [94]);
  m.set("alongside", [79]);
  m.set("aloud", [78]);
  m.set("already", [34]);
  m.set("also", [2]);
  m.set("alternative", [53]);
  m.set("although", [3]);
  m.set("altogether", [80]);
  m.set("always", [13]);
  m.set("amateur", [6]);
  m.set("amazing", [38]);
  m.set("ambition", [79]);
  m.set("ambitious", [69]);
  m.set("ambulance", [42]);
  m.set("america", [96]);
  m.set("among", [10]);
  m.set("amount", [2]);
  m.set("amuse", [76]);
  m.set("analyse", [28]);
  m.set("ancestor", [68]);
  m.set("ancient", [18]);
  m.set("and", [84]);
  m.set("anger", [79]);
  m.set("angle", [52]);
  m.set("angry", [35]);
  m.set("animal", [17]);
  m.set("ankle", [85]);
  m.set("anniversary", [74]);
  m.set("announce", [61]);
  m.set("annoy", [44]);
  m.set("annual", [3]);
  m.set("another", [86]);
  m.set("answer", [59]);
  m.set("ant", [72]);
  m.set("antarctica", [96]);
  m.set("anticipate", [57]);
  m.set("antique", [12]);
  m.set("anxiety", [38]);
  m.set("anxious", [49]);
  m.set("any", [13]);
  m.set("anybody_anyone", [45]);
  m.set("anyhow", [96]);
  m.set("anything", [36]);
  m.set("anyway", [63]);
  m.set("anywhere", [75]);
  m.set("apart", [2]);
  m.set("apartment", [62]);
  m.set("apologise", [96]);
  m.set("app", [42]);
  m.set("apparently", [13]);
  m.set("appeal", [0]);
  m.set("appear", [94]);
  m.set("appetite", [69]);
  m.set("applaud", [96]);
  m.set("apple", [60]);
  m.set("applicant", [79]);
  m.set("application", [24]);
  m.set("apply", [20]);
  m.set("appointment", [78]);
  m.set("appreciate", [12]);
  m.set("approach", [25]);
  m.set("appropriate", [4]);
  m.set("approve", [92]);
  m.set("arch", [96]);
  m.set("architect", [47]);
  m.set("arctic", [68]);
  m.set("area", [11]);
  m.set("argue", [2]);
  m.set("arise", [93]);
  m.set("arm", [55]);
  m.set("army", [28]);
  m.set("around", [16]);
  m.set("arrangement", [66]);
  m.set("arrest", [61]);
  m.set("arrive", [91]);
  m.set("arrow", [6]);
  m.set("art", [12]);
  m.set("article", [58]);
  m.set("artificial", [6]);
  m.set("artist", [12]);
  m.set("as", [94]);
  m.set("ashamed", [1]);
  m.set("asia", [96]);
  m.set("aside", [5]);
  m.set("ask", [7]);
  m.set("asleep", [40]);
  m.set("aspect", [47]);
  m.set("assess", [56]);
  m.set("assign", [73]);
  m.set("assistant", [60]);
  m.set("association", [18]);
  m.set("assume", [5]);
  m.set("assumption", [59]);
  m.set("astonish", [49]);
  m.set("astronaut", [49]);
  m.set("astronomer", [61]);
  m.set("at", [95]);
  m.set("athlete", [24]);
  m.set("atlantic", [96]);
  m.set("atmosphere", [60]);
  m.set("attach", [37]);
  m.set("attack", [22]);
  m.set("attain", [6]);
  m.set("attempt", [6]);
  m.set("attend", [31]);
  m.set("attention", [27]);
  m.set("attitude", [45]);
  m.set("attract", [26]);
  m.set("audience", [49]);
  m.set("aunt", [48]);
  m.set("author", [4]);
  m.set("authority", [40]);
  m.set("automatic", [61]);
  m.set("autonomous", [91]);
  m.set("autumn", [24]);
  m.set("available", [11]);
  m.set("average", [10]);
  m.set("avoid", [89]);
  m.set("awake", [50]);
  m.set("award", [72]);
  m.set("aware", [33]);
  m.set("away", [92]);
  m.set("awesome", [69]);
  m.set("awful", [48]);
  m.set("awkward", [64]);
  m.set("baby", [43]);
  m.set("back", [87]);
  m.set("background", [47]);
  m.set("backward", [91]);
  m.set("bacon", [96]);
  m.set("bacteria", [60]);
  m.set("bad", [9]);
  m.set("badminton", [50]);
  m.set("bag", [38]);
  m.set("bakery", [51]);
  m.set("balance", [72]);
  m.set("ball", [4]);
  m.set("ballet", [18]);
  m.set("balloon", [82]);
  m.set("bamboo", [67]);
  m.set("ban", [75]);
  m.set("banana", [5]);
  m.set("band", [49]);
  m.set("bank", [9]);
  m.set("bar", [46]);
  m.set("barbecue", [6]);
  m.set("barely", [85]);
  m.set("bark", [96]);
  m.set("barrier", [26]);
  m.set("base", [29]);
  m.set("baseball", [51]);
  m.set("basic", [49]);
  m.set("basin", [65]);
  m.set("basis", [10]);
  m.set("basket", [44]);
  m.set("basketball", [39]);
  m.set("bat", [35]);
  m.set("bath", [31]);
  m.set("bathroom", [70]);
  m.set("battery", [85]);
  m.set("battle", [60]);
  m.set("bay", [63]);
  m.set("bce", [70]);
  m.set("be", [79]);
  m.set("beach", [37]);
  m.set("bean", [68]);
  m.set("bear", [30]);
  m.set("beard", [57]);
  m.set("beat", [24]);
  m.set("beautiful", [44]);
  m.set("beauty", [12]);
  m.set("because", [87]);
  m.set("become", [37]);
  m.set("bed", [19]);
  m.set("bedroom", [43]);
  m.set("bee", [0]);
  m.set("beef", [80]);
  m.set("beer", [40]);
  m.set("before", [99]);
  m.set("begin", [13]);
  m.set("behalf", [96]);
  m.set("behave", [84]);
  m.set("behaviour", [48]);
  m.set("behind", [8]);
  m.set("being", [85]);
  m.set("belief", [28]);
  m.set("believe", [34]);
  m.set("bell", [85]);
  m.set("belong", [58]);
  m.set("below", [10]);
  m.set("belt", [96]);
  m.set("bend", [27]);
  m.set("beneath", [86]);
  m.set("benefit", [15]);
  m.set("beside", [76]);
  m.set("besides", [54]);
  m.set("best", [4]);
  m.set("bet", [84]);
  m.set("better", [84]);
  m.set("between", [15]);
  m.set("beyond", [37]);
  m.set("bias", [28]);
  m.set("big", [7]);
  m.set("bike", [39]);
  m.set("bill", [15]);
  m.set("billion", [77]);
  m.set("bin", [96]);
  m.set("biology", [56]);
  m.set("bird", [17]);
  m.set("birth", [70]);
  m.set("birthday", [36]);
  m.set("biscuit", [94]);
  m.set("bit", [19]);
  m.set("bite", [91]);
  m.set("bitter", [60]);
  m.set("black", [31]);
  m.set("blackboard", [40]);
  m.set("blame", [59]);
  m.set("blank", [78]);
  m.set("blanket", [50]);
  m.set("bleed", [96]);
  m.set("bless", [5]);
  m.set("blind", [50]);
  m.set("block", [47]);
  m.set("blog", [5]);
  m.set("blood", [1]);
  m.set("blouse", [96]);
  m.set("blow", [77]);
  m.set("blue", [33]);
  m.set("board", [19]);
  m.set("boat", [39]);
  m.set("body", [22]);
  m.set("boil", [40]);
  m.set("bomb", [67]);
  m.set("bond", [56]);
  m.set("bone", [64]);
  m.set("bonus", [70]);
  m.set("book", [58]);
  m.set("boost", [70]);
  m.set("boot", [96]);
  m.set("border", [92]);
  m.set("bored", [54]);
  m.set("boring", [96]);
  m.set("born", [38]);
  m.set("borrow", [5]);
  m.set("boss", [69]);
  m.set("botanical", [96]);
  m.set("both", [3]);
  m.set("bother", [58]);
  m.set("bottle", [60]);
  m.set("bottom", [39]);
  m.set("bounce", [82]);
  m.set("bound", [96]);
  m.set("boundary", [1]);
  m.set("bow", [6]);
  m.set("bowl", [80]);
  m.set("bowling", [57]);
  m.set("box", [48]);
  m.set("boxing", [96]);
  m.set("boy", [37]);
  m.set("brain", [53]);
  m.set("branch", [27]);
  m.set("brand", [5]);
  m.set("brave", [1]);
  m.set("bread", [76]);
  m.set("break", [21]);
  m.set("breakfast", [14]);
  m.set("breast", [57]);
  m.set("breath", [77]);
  m.set("breathe", [30]);
  m.set("brick", [72]);
  m.set("bride_bridegroom", [51]);
  m.set("bridge", [39]);
  m.set("brief", [63]);
  m.set("bright", [16]);
  m.set("brilliant", [58]);
  m.set("bring", [23]);
  m.set("broad", [78]);
  m.set("broadcast", [73]);
  m.set("brochure", [52]);
  m.set("brother", [19]);
  m.set("brown", [55]);
  m.set("brush", [53]);
  m.set("budget", [7]);
  m.set("buffet", [96]);
  m.set("bug", [62]);
  m.set("build", [75]);
  m.set("building", [22]);
  m.set("bully", [97]);
  m.set("bunch", [71]);
  m.set("burn", [22]);
  m.set("burst", [81]);
  m.set("bury", [65]);
  m.set("bus", [8]);
  m.set("business", [9]);
  m.set("busy", [15]);
  m.set("but", [3]);
  m.set("butcher", [79]);
  m.set("butter", [50]);
  m.set("butterfly", [55]);
  m.set("button", [0]);
  m.set("buy", [7]);
  m.set("by", [2]);
  m.set("cabbage", [89]);
  m.set("cafe", [97]);
  m.set("cafeteria", [24]);
  m.set("cage", [67]);
  m.set("cake", [51]);
  m.set("calculate", [50]);
  m.set("calendar", [60]);
  m.set("call", [83]);
  m.set("calligraphy", [18]);
  m.set("calm", [22]);
  m.set("calorie", [28]);
  m.set("camel", [94]);
  m.set("camera", [35]);
  m.set("camp", [19]);
  m.set("campaign", [70]);
  m.set("campus", [62]);
  m.set("can", [83]);
  m.set("canal", [65]);
  m.set("cancel", [46]);
  m.set("cancer", [0]);
  m.set("candidate", [81]);
  m.set("candle", [5]);
  m.set("candy", [58]);
  m.set("canteen", [97]);
  m.set("cap", [97]);
  m.set("capable", [82]);
  m.set("capacity", [6]);
  m.set("capital", [1]);
  m.set("capsule", [67]);
  m.set("captain", [89]);
  m.set("capture", [0]);
  m.set("car", [82]);
  m.set("carbon", [2]);
  m.set("card", [31]);
  m.set("care", [45]);
  m.set("career", [41]);
  m.set("careful", [32]);
  m.set("careless", [40]);
  m.set("carpet", [85]);
  m.set("carrot", [56]);
  m.set("carry", [19]);
  m.set("cartoon", [85]);
  m.set("carve", [91]);
  m.set("case", [33]);
  m.set("cash", [75]);
  m.set("cast", [73]);
  m.set("castle", [75]);
  m.set("casual", [83]);
  m.set("cat", [30]);
  m.set("catch", [9]);
  m.set("category", [66]);
  m.set("cattle", [75]);
  m.set("cause", [10]);
  m.set("cautious", [74]);
  m.set("cave", [72]);
  m.set("ce", [45]);
  m.set("cease", [85]);
  m.set("ceiling", [87]);
  m.set("celebrate", [43]);
  m.set("celebrity", [97]);
  m.set("cell", [63]);
  m.set("cent", [46]);
  m.set("centimetre", [68]);
  m.set("central", [31]);
  m.set("centre", [93]);
  m.set("century", [12]);
  m.set("ceremony", [75]);
  m.set("certain", [92]);
  m.set("certainly", [47]);
  m.set("certificate", [62]);
  m.set("chain", [63]);
  m.set("chair", [47]);
  m.set("chairman_chairwoman", [67]);
  m.set("chalk", [39]);
  m.set("challenge", [22]);
  m.set("champion", [1]);
  m.set("chance", [90]);
  m.set("change", [49]);
  m.set("channel", [9]);
  m.set("chaos", [65]);
  m.set("chapter", [58]);
  m.set("character", [8]);
  m.set("characteristic", [26]);
  m.set("charge", [31]);
  m.set("charity", [44]);
  m.set("charm", [71]);
  m.set("chart", [30]);
  m.set("chat", [77]);
  m.set("cheap", [44]);
  m.set("cheat", [76]);
  m.set("check", [91]);
  m.set("cheer", [44]);
  m.set("cheese", [66]);
  m.set("chef", [44]);
  m.set("chemical", [17]);
  m.set("chemist", [67]);
  m.set("chemistry", [51]);
  m.set("chess", [23]);
  m.set("chest", [80]);
  m.set("chew", [87]);
  m.set("chicken", [46]);
  m.set("chief", [76]);
  m.set("child", [85]);
  m.set("childhood", [18]);
  m.set("china", [35]);
  m.set("china_8a7d7b", [35]);
  m.set("chinese", [35]);
  m.set("chip", [50]);
  m.set("chocolate", [62]);
  m.set("choice", [14]);
  m.set("choke", [6]);
  m.set("choose", [14]);
  m.set("chopsticks", [97]);
  m.set("chore", [79]);
  m.set("chorus", [67]);
  m.set("christmas", [56]);
  m.set("church", [50]);
  m.set("cigarette", [72]);
  m.set("cinema", [97]);
  m.set("circle", [72]);
  m.set("circuit", [51]);
  m.set("circumstance", [71]);
  m.set("circus", [79]);
  m.set("cite", [97]);
  m.set("citizen", [35]);
  m.set("city", [11]);
  m.set("civil", [67]);
  m.set("civilian", [87]);
  m.set("civilisation", [97]);
  m.set("claim", [59]);
  m.set("clap", [97]);
  m.set("clarify", [56]);
  m.set("class", [21]);
  m.set("classic", [46]);
  m.set("classmate", [21]);
  m.set("classroom", [21]);
  m.set("clay", [67]);
  m.set("clean", [48]);
  m.set("clear", [54]);
  m.set("clerk", [97]);
  m.set("clever", [71]);
  m.set("click", [68]);
  m.set("client", [89]);
  m.set("climate", [2]);
  m.set("climb", [37]);
  m.set("clinic", [55]);
  m.set("clock", [43]);
  m.set("clone", [97]);
  m.set("close", [90]);
  m.set("cloth", [3]);
  m.set("clothes", [69]);
  m.set("cloud", [26]);
  m.set("cloudy", [97]);
  m.set("club", [43]);
  m.set("clue", [74]);
  m.set("coach", [21]);
  m.set("coal", [6]);
  m.set("coast", [39]);
  m.set("coat", [85]);
  m.set("coffee", [56]);
  m.set("coin", [46]);
  m.set("cold", [8]);
  m.set("collaborate", [90]);
  m.set("collapse", [81]);
  m.set("collar", [76]);
  m.set("collect", [60]);
  m.set("collection", [24]);
  m.set("college", [9]);
  m.set("colour", [39]);
  m.set("column", [97]);
  m.set("combine", [35]);
  m.set("come", [10]);
  m.set("comedy", [35]);
  m.set("comfort", [52]);
  m.set("comfortable", [48]);
  m.set("comic", [97]);
  m.set("command", [94]);
  m.set("comment", [45]);
  m.set("commercial", [64]);
  m.set("commit", [73]);
  m.set("commitment", [40]);
  m.set("committee", [52]);
  m.set("common", [20]);
  m.set("communicate", [16]);
  m.set("communication", [82]);
  m.set("communist", [57]);
  m.set("community", [23]);
  m.set("company", [7]);
  m.set("compare", [32]);
  m.set("comparison", [59]);
  m.set("compass", [51]);
  m.set("compete", [46]);
  m.set("competence", [57]);
  m.set("competition", [24]);
  m.set("complain", [4]);
  m.set("complete", [19]);
  m.set("complex", [33]);
  m.set("complicated", [5]);
  m.set("component", [80]);
  m.set("compose", [97]);
  m.set("composition", [64]);
  m.set("comprehension", [59]);
  m.set("comprehensive", [86]);
  m.set("comprise", [1]);
  m.set("computer", [20]);
  m.set("concentrate", [81]);
  m.set("concept", [4]);
  m.set("concern", [17]);
  m.set("concert", [49]);
  m.set("conclude", [0]);
  m.set("conclusion", [53]);
  m.set("concrete", [82]);
  m.set("condition", [32]);
  m.set("conduct", [2]);
  m.set("conference", [55]);
  m.set("confidence", [36]);
  m.set("confident", [34]);
  m.set("confirm", [29]);
  m.set("conflict", [1]);
  m.set("confucianism", [97]);
  m.set("confucius", [73]);
  m.set("confused", [54]);
  m.set("congratulation", [89]);
  m.set("connect", [25]);
  m.set("conscious", [97]);
  m.set("consequence", [28]);
  m.set("conservation", [20]);
  m.set("consider", [94]);
  m.set("consist", [33]);
  m.set("consistent", [82]);
  m.set("constant", [55]);
  m.set("constitution", [97]);
  m.set("construction", [53]);
  m.set("consultant", [51]);
  m.set("consultation", [51]);
  m.set("consume", [29]);
  m.set("consumption", [2]);
  m.set("contact", [30]);
  m.set("contain", [33]);
  m.set("contemporary", [12]);
  m.set("content", [33]);
  m.set("contest", [14]);
  m.set("context", [48]);
  m.set("continent", [59]);
  m.set("continue", [13]);
  m.set("contract", [86]);
  m.set("contradictory", [91]);
  m.set("contrary", [69]);
  m.set("contrast", [80]);
  m.set("contribution", [52]);
  m.set("control", [32]);
  m.set("controversial", [97]);
  m.set("convenient", [64]);
  m.set("conventional", [62]);
  m.set("conversation", [15]);
  m.set("convey", [69]);
  m.set("convince", [6]);
  m.set("cook", [7]);
  m.set("cookie", [74]);
  m.set("cool", [36]);
  m.set("cooperate", [57]);
  m.set("copy", [33]);
  m.set("core", [1]);
  m.set("corn", [8]);
  m.set("corner", [8]);
  m.set("corporate", [53]);
  m.set("correct", [41]);
  m.set("correspond", [30]);
  m.set("cost", [70]);
  m.set("costume", [97]);
  m.set("cottage", [89]);
  m.set("cotton", [57]);
  m.set("cough", [97]);
  m.set("could", [13]);
  m.set("council", [97]);
  m.set("count", [66]);
  m.set("country", [10]);
  m.set("countryside", [80]);
  m.set("county", [71]);
  m.set("couple", [11]);
  m.set("courage", [80]);
  m.set("course", [13]);
  m.set("court", [79]);
  m.set("cousin", [74]);
  m.set("cover", [20]);
  m.set("coverage", [84]);
  m.set("cow", [55]);
  m.set("craft", [97]);
  m.set("crash", [66]);
  m.set("crazy", [32]);
  m.set("cream", [64]);
  m.set("create", [95]);
  m.set("creative", [12]);
  m.set("creature", [30]);
  m.set("credit", [52]);
  m.set("crew", [79]);
  m.set("crime", [42]);
  m.set("crisis", [86]);
  m.set("criterion", [67]);
  m.set("critical", [68]);
  m.set("criticise", [97]);
  m.set("crop", [25]);
  m.set("cross", [47]);
  m.set("crowd", [3]);
  m.set("crowded", [76]);
  m.set("crucial", [82]);
  m.set("cruel", [86]);
  m.set("cry", [27]);
  m.set("cucumber", [57]);
  m.set("cuisine", [70]);
  m.set("culture", [12]);
  m.set("cup", [66]);
  m.set("cupboard", [50]);
  m.set("cure", [37]);
  m.set("curious", [41]);
  m.set("currency", [46]);
  m.set("current", [28]);
  m.set("curtain", [54]);
  m.set("curve", [97]);
  m.set("custom", [58]);
  m.set("customer", [27]);
  m.set("cut", [2]);
  m.set("cute", [76]);
  m.set("cycle", [48]);
  m.set("daily", [27]);
  m.set("dam", [30]);
  m.set("damage", [32]);
  m.set("damp", [98]);
  m.set("dance", [12]);
  m.set("danger", [63]);
  m.set("dangerous", [55]);
  m.set("dare", [58]);
  m.set("dark", [8]);
  m.set("data", [29]);
  m.set("database", [80]);
  m.set("date", [31]);
  m.set("daughter", [36]);
  m.set("dawn", [91]);
  m.set("day", [84]);
  m.set("dead", [1]);
  m.set("deadline", [75]);
  m.set("deaf", [35]);
  m.set("deal", [15]);
  m.set("dear", [54]);
  m.set("death", [52]);
  m.set("debate", [1]);
  m.set("debt", [95]);
  m.set("decade", [32]);
  m.set("decent", [50]);
  m.set("decide", [11]);
  m.set("decision", [9]);
  m.set("declare", [7]);
  m.set("decline", [25]);
  m.set("decorate", [12]);
  m.set("decrease", [80]);
  m.set("dedicate", [1]);
  m.set("deep", [23]);
  m.set("deer", [66]);
  m.set("defeat", [53]);
  m.set("defence", [59]);
  m.set("defend", [5]);
  m.set("definitely", [31]);
  m.set("definition", [59]);
  m.set("degree", [26]);
  m.set("delay", [50]);
  m.set("delete", [41]);
  m.set("delicate", [77]);
  m.set("delicious", [48]);
  m.set("delight", [28]);
  m.set("deliver", [27]);
  m.set("demand", [44]);
  m.set("demonstrate", [56]);
  m.set("dentist", [61]);
  m.set("deny", [54]);
  m.set("department", [37]);
  m.set("departure", [75]);
  m.set("depend", [91]);
  m.set("depress", [36]);
  m.set("depth", [40]);
  m.set("describe", [88]);
  m.set("description", [59]);
  m.set("desert", [1]);
  m.set("deserve", [4]);
  m.set("design", [88]);
  m.set("desire", [19]);
  m.set("desk", [9]);
  m.set("desperate", [50]);
  m.set("despite", [39]);
  m.set("dessert", [51]);
  m.set("destination", [47]);
  m.set("destroy", [39]);
  m.set("detail", [45]);
  m.set("detect", [68]);
  m.set("detective", [76]);
  m.set("determine", [29]);
  m.set("develop", [45]);
  m.set("development", [25]);
  m.set("device", [42]);
  m.set("devote", [0]);
  m.set("diagram", [0]);
  m.set("dialogue", [76]);
  m.set("diamond", [5]);
  m.set("diary", [4]);
  m.set("dictionary", [5]);
  m.set("die", [41]);
  m.set("diet", [96]);
  m.set("differ", [66]);
  m.set("difference", [82]);
  m.set("different", [79]);
  m.set("difficult", [15]);
  m.set("difficulty", [18]);
  m.set("dig", [54]);
  m.set("digest", [18]);
  m.set("digital", [4]);
  m.set("dignity", [98]);
  m.set("dimension", [54]);
  m.set("dining", [98]);
  m.set("dinner", [95]);
  m.set("dinosaur", [54]);
  m.set("direct", [24]);
  m.set("direction", [38]);
  m.set("director", [16]);
  m.set("directory", [73]);
  m.set("dirty", [51]);
  m.set("disability", [9]);
  m.set("disabled", [76]);
  m.set("disappear", [28]);
  m.set("disappoint", [81]);
  m.set("disappointed", [22]);
  m.set("disaster", [60]);
  m.set("disc", [98]);
  m.set("discipline", [61]);
  m.set("discount", [58]);
  m.set("discover", [12]);
  m.set("discovery", [59]);
  m.set("discrimination", [81]);
  m.set("discuss", [14]);
  m.set("discussion", [52]);
  m.set("disease", [26]);
  m.set("dish", [33]);
  m.set("dismiss", [65]);
  m.set("display", [12]);
  m.set("distance", [31]);
  m.set("distant", [69]);
  m.set("distinct", [86]);
  m.set("distinguish", [46]);
  m.set("distribution", [46]);
  m.set("district", [73]);
  m.set("disturb", [86]);
  m.set("dive", [44]);
  m.set("diverse", [4]);
  m.set("divide", [33]);
  m.set("division", [65]);
  m.set("dizzy", [57]);
  m.set("do", [89]);
  m.set("doctor", [23]);
  m.set("document", [70]);
  m.set("dog", [14]);
  m.set("doll", [21]);
  m.set("dollar", [9]);
  m.set("dolphin", [64]);
  m.set("domain", [98]);
  m.set("domestic", [74]);
  m.set("dominate", [89]);
  m.set("donate", [45]);
  m.set("door", [14]);
  m.set("dormitory", [98]);
  m.set("double", [80]);
  m.set("doubt", [17]);
  m.set("down", [8]);
  m.set("download", [74]);
  m.set("downstairs", [92]);
  m.set("downtown", [80]);
  m.set("dozen", [45]);
  m.set("draft", [0]);
  m.set("drag", [67]);
  m.set("dragon", [41]);
  m.set("drama", [1]);
  m.set("dramatic", [66]);
  m.set("draw", [92]);
  m.set("drawer", [81]);
  m.set("dream", [36]);
  m.set("dress", [38]);
  m.set("drill", [57]);
  m.set("drink", [34]);
  m.set("drive", [91]);
  m.set("driver", [95]);
  m.set("drone", [89]);
  m.set("drop", [35]);
  m.set("drought", [23]);
  m.set("drown", [25]);
  m.set("drug", [40]);
  m.set("dry", [26]);
  m.set("duck", [52]);
  m.set("due_to", [98]);
  m.set("dumpling", [91]);
  m.set("duration", [57]);
  m.set("during", [13]);
  m.set("dust", [63]);
  m.set("duty", [79]);
  m.set("dynamic", [74]);
  m.set("dynasty", [30]);
  m.set("each", [85]);
  m.set("eager", [32]);
  m.set("eagle", [74]);
  m.set("ear", [37]);
  m.set("early", [11]);
  m.set("earn", [9]);
  m.set("earth", [60]);
  m.set("earthquake", [77]);
  m.set("ease", [69]);
  m.set("east", [35]);
  m.set("eastern", [12]);
  m.set("easy", [19]);
  m.set("eat", [7]);
  m.set("ecology", [25]);
  m.set("economic", [42]);
  m.set("economy", [42]);
  m.set("edge", [30]);
  m.set("editor", [41]);
  m.set("education", [21]);
  m.set("educator", [61]);
  m.set("effect", [17]);
  m.set("efficient", [71]);
  m.set("effort", [94]);
  m.set("egg", [77]);
  m.set("either", [59]);
  m.set("elder", [85]);
  m.set("elderly", [43]);
  m.set("election", [98]);
  m.set("electric", [42]);
  m.set("electricity", [2]);
  m.set("electronic", [58]);
  m.set("elegant", [80]);
  m.set("element", [80]);
  m.set("elephant", [59]);
  m.set("elevator", [51]);
  m.set("eliminate", [43]);
  m.set("else", [19]);
  m.set("elsewhere", [64]);
  m.set("email", [35]);
  m.set("embarrassed", [92]);
  m.set("emerge", [73]);
  m.set("emergency", [78]);
  m.set("emotion", [48]);
  m.set("empathy", [55]);
  m.set("emperor_empress", [35]);
  m.set("emphasis", [41]);
  m.set("employ", [53]);
  m.set("empty", [39]);
  m.set("enable", [23]);
  m.set("encounter", [29]);
  m.set("encourage", [88]);
  m.set("end", [15]);
  m.set("endangered", [98]);
  m.set("enemy", [17]);
  m.set("energetic", [95]);
  m.set("energy", [42]);
  m.set("engage", [75]);
  m.set("engine", [28]);
  m.set("engineer", [29]);
  m.set("english", [24]);
  m.set("enhance", [62]);
  m.set("enjoy", [83]);
  m.set("enormous", [65]);
  m.set("enough", [86]);
  m.set("ensure", [23]);
  m.set("enter", [14]);
  m.set("enterprise", [98]);
  m.set("entertainment", [74]);
  m.set("enthusiastic", [77]);
  m.set("entirely", [59]);
  m.set("entitle", [6]);
  m.set("entrance", [62]);
  m.set("entry", [58]);
  m.set("envelope", [73]);
  m.set("environment", [25]);
  m.set("envy", [72]);
  m.set("episode", [98]);
  m.set("equal", [91]);
  m.set("equator", [65]);
  m.set("equipment", [72]);
  m.set("era", [79]);
  m.set("eraser", [98]);
  m.set("error", [49]);
  m.set("erupt", [89]);
  m.set("escape", [52]);
  m.set("especially", [59]);
  m.set("essay", [21]);
  m.set("essential", [28]);
  m.set("establish", [42]);
  m.set("estate", [57]);
  m.set("estimate", [83]);
  m.set("ethical", [61]);
  m.set("ethnic", [68]);
  m.set("europe", [70]);
  m.set("evaluate", [34]);
  m.set("eve", [91]);
  m.set("even", [4]);
  m.set("evening", [11]);
  m.set("event", [14]);
  m.set("eventually", [39]);
  m.set("ever", [94]);
  m.set("every", [99]);
  m.set("everybody_everyone", [19]);
  m.set("everyday", [8]);
  m.set("everything", [93]);
  m.set("everywhere", [26]);
  m.set("evidence", [33]);
  m.set("evolve", [29]);
  m.set("exactly", [48]);
  m.set("exam", [0]);
  m.set("examine", [64]);
  m.set("example", [18]);
  m.set("exceed", [6]);
  m.set("excellent", [74]);
  m.set("except", [69]);
  m.set("exceptional", [77]);
  m.set("exchange", [3]);
  m.set("excited", [27]);
  m.set("exciting", [53]);
  m.set("excuse", [4]);
  m.set("exercise", [17]);
  m.set("exhaust", [94]);
  m.set("exhibition", [12]);
  m.set("exist", [29]);
  m.set("exit", [62]);
  m.set("expand", [45]);
  m.set("expansion", [30]);
  m.set("expect", [29]);
  m.set("expectation", [64]);
  m.set("expense", [62]);
  m.set("expensive", [66]);
  m.set("experience", [89]);
  m.set("experiment", [17]);
  m.set("expert", [91]);
  m.set("explain", [56]);
  m.set("explode", [74]);
  m.set("explore", [20]);
  m.set("export", [91]);
  m.set("expose", [45]);
  m.set("exposure", [35]);
  m.set("express", [58]);
  m.set("extend", [81]);
  m.set("extension", [57]);
  m.set("extent", [1]);
  m.set("external", [91]);
  m.set("extinction", [68]);
  m.set("extra", [15]);
  m.set("extraordinary", [13]);
  m.set("extremely", [90]);
  m.set("eye", [3]);
  m.set("fable", [4]);
  m.set("fabric", [57]);
  m.set("face", [55]);
  m.set("facilitate", [79]);
  m.set("facility", [33]);
  m.set("fact", [93]);
  m.set("factor", [33]);
  m.set("factory", [33]);
  m.set("fail", [14]);
  m.set("failure", [41]);
  m.set("faint", [95]);
  m.set("fair", [28]);
  m.set("faith", [82]);
  m.set("fall", [76]);
  m.set("false", [56]);
  m.set("familiar", [42]);
  m.set("family", [43]);
  m.set("famous", [16]);
  m.set("fan", [3]);
  m.set("fancy", [90]);
  m.set("fantastic", [47]);
  m.set("fantasy", [48]);
  m.set("far", [13]);
  m.set("farm", [10]);
  m.set("farmer", [25]);
  m.set("fascinating", [91]);
  m.set("fashion", [38]);
  m.set("fast", [26]);
  m.set("fat", [78]);
  m.set("father", [15]);
  m.set("fault", [53]);
  m.set("favour", [0]);
  m.set("favourite", [30]);
  m.set("fear", [48]);
  m.set("feature", [29]);
  m.set("fee", [10]);
  m.set("feed", [29]);
  m.set("feel", [69]);
  m.set("feeling", [69]);
  m.set("fellow", [81]);
  m.set("female", [49]);
  m.set("fence", [53]);
  m.set("fertile", [98]);
  m.set("festival", [12]);
  m.set("fetch", [65]);
  m.set("fever", [98]);
  m.set("few", [13]);
  m.set("fibre", [51]);
  m.set("fiction", [72]);
  m.set("field", [90]);
  m.set("fight", [2]);
  m.set("figure", [44]);
  m.set("file", [64]);
  m.set("fill", [98]);
  m.set("film", [41]);
  m.set("final", [24]);
  m.set("finally", [19]);
  m.set("finance", [86]);
  m.set("financial", [51]);
  m.set("find", [68]);
  m.set("finding", [29]);
  m.set("fine", [30]);
  m.set("finger", [35]);
  m.set("finish", [14]);
  m.set("fire", [43]);
  m.set("fireman", [51]);
  m.set("firework", [88]);
  m.set("firm", [78]);
  m.set("fish", [29]);
  m.set("fisherman", [92]);
  m.set("fist", [70]);
  m.set("fit", [33]);
  m.set("fix", [34]);
  m.set("flag", [46]);
  m.set("flame", [98]);
  m.set("flash", [55]);
  m.set("flat", [60]);
  m.set("flavour", [23]);
  m.set("flexible", [4]);
  m.set("flight", [93]);
  m.set("float", [81]);
  m.set("flood", [54]);
  m.set("floor", [26]);
  m.set("flour", [67]);
  m.set("flow", [31]);
  m.set("flower", [43]);
  m.set("flu", [61]);
  m.set("fluent", [83]);
  m.set("fly", [11]);
  m.set("focus", [91]);
  m.set("fog", [41]);
  m.set("fold", [70]);
  m.set("folk", [68]);
  m.set("follow", [10]);
  m.set("fond", [69]);
  m.set("food", [96]);
  m.set("fool", [60]);
  m.set("foot", [18]);
  m.set("football", [46]);
  m.set("for", [85]);
  m.set("force", [53]);
  m.set("forecast", [72]);
  m.set("forehead", [94]);
  m.set("foreign", [1]);
  m.set("forest", [26]);
  m.set("forever", [3]);
  m.set("forget", [19]);
  m.set("forgive", [87]);
  m.set("fork", [9]);
  m.set("form", [20]);
  m.set("formal", [4]);
  m.set("format", [6]);
  m.set("former", [73]);
  m.set("fortunately", [62]);
  m.set("fortune", [72]);
  m.set("forward", [90]);
  m.set("found", [99]);
  m.set("foundation", [71]);
  m.set("fountain", [68]);
  m.set("fox", [54]);
  m.set("frame", [66]);
  m.set("frank", [94]);
  m.set("free", [13]);
  m.set("freedom", [41]);
  m.set("freeze", [55]);
  m.set("frequency", [57]);
  m.set("frequently", [44]);
  m.set("fresh", [43]);
  m.set("friction", [40]);
  m.set("fridge", [74]);
  m.set("friend", [84]);
  m.set("friendly", [27]);
  m.set("friendship", [19]);
  m.set("frightened", [69]);
  m.set("frog", [77]);
  m.set("from", [92]);
  m.set("front", [34]);
  m.set("frontier", [86]);
  m.set("frost", [31]);
  m.set("fruit", [21]);
  m.set("fry", [62]);
  m.set("fuel", [62]);
  m.set("fulfil", [98]);
  m.set("full", [24]);
  m.set("fun", [30]);
  m.set("function", [34]);
  m.set("fund", [32]);
  m.set("fundamental", [60]);
  m.set("funny", [36]);
  m.set("furniture", [44]);
  m.set("further", [26]);
  m.set("furthermore", [86]);
  m.set("future", [55]);
  m.set("gain", [29]);
  m.set("gallery", [12]);
  m.set("game", [31]);
  m.set("gap", [54]);
  m.set("garbage", [2]);
  m.set("garden", [21]);
  m.set("garlic", [76]);
  m.set("gas", [70]);
  m.set("gate", [83]);
  m.set("gather", [30]);
  m.set("gender", [86]);
  m.set("gene", [61]);
  m.set("general", [25]);
  m.set("generate", [78]);
  m.set("generation", [9]);
  m.set("generous", [75]);
  m.set("genius", [59]);
  m.set("gentle", [5]);
  m.set("gentleman", [57]);
  m.set("genuine", [50]);
  m.set("geography", [66]);
  m.set("geometry", [57]);
  m.set("gesture", [5]);
  m.set("get", [79]);
  m.set("giant", [3]);
  m.set("gift", [46]);
  m.set("gifted", [95]);
  m.set("giraffe", [98]);
  m.set("girl", [21]);
  m.set("give", [85]);
  m.set("glad", [64]);
  m.set("glance", [85]);
  m.set("glass", [47]);
  m.set("global", [28]);
  m.set("globe", [35]);
  m.set("glove", [67]);
  m.set("glue", [98]);
  m.set("go", [79]);
  m.set("goal", [34]);
  m.set("goat", [57]);
  m.set("god", [74]);
  m.set("gold", [39]);
  m.set("golf", [98]);
  m.set("good", [86]);
  m.set("goodbye", [27]);
  m.set("goods", [44]);
  m.set("government", [10]);
  m.set("grab", [77]);
  m.set("graceful", [72]);
  m.set("grade", [21]);
  m.set("gradually", [76]);
  m.set("graduate", [38]);
  m.set("grain", [6]);
  m.set("grammar", [43]);
  m.set("gramme", [98]);
  m.set("grand", [58]);
  m.set("granddaughter", [70]);
  m.set("grandfather", [38]);
  m.set("grandmother", [38]);
  m.set("grandparent", [82]);
  m.set("grandson", [35]);
  m.set("grape", [68]);
  m.set("grasp", [80]);
  m.set("grass", [26]);
  m.set("grateful", [50]);
  m.set("gratitude", [72]);
  m.set("gravity", [91]);
  m.set("great", [3]);
  m.set("greedy", [98]);
  m.set("green", [17]);
  m.set("greenhouse", [54]);
  m.set("greet", [14]);
  m.set("grey", [44]);
  m.set("grocery", [32]);
  m.set("ground", [24]);
  m.set("group", [10]);
  m.set("grow", [26]);
  m.set("guarantee", [71]);
  m.set("guard", [72]);
  m.set("guess", [38]);
  m.set("guest", [49]);
  m.set("guidance", [83]);
  m.set("guide", [43]);
  m.set("guideline", [87]);
  m.set("guilty", [98]);
  m.set("guitar", [67]);
  m.set("gun", [86]);
  m.set("guy", [19]);
  m.set("gym", [49]);
  m.set("gymnastics", [98]);
  m.set("habit", [34]);
  m.set("habitat", [23]);
  m.set("hair", [36]);
  m.set("half", [11]);
  m.set("hall", [62]);
  m.set("ham", [30]);
  m.set("hamburger", [98]);
  m.set("hand", [8]);
  m.set("handbag", [69]);
  m.set("handkerchief", [65]);
  m.set("handle", [52]);
  m.set("handsome", [98]);
  m.set("handwriting", [72]);
  m.set("hang", [32]);
  m.set("happen", [3]);
  m.set("happy", [8]);
  m.set("hard", [99]);
  m.set("hardly", [36]);
  m.set("harm", [25]);
  m.set("harmful", [35]);
  m.set("harmonious", [72]);
  m.set("harmony", [73]);
  m.set("harvest", [75]);
  m.set("hat", [80]);
  m.set("hatch", [65]);
  m.set("hate", [47]);
  m.set("have", [99]);
  m.set("he", [7]);
  m.set("head", [21]);
  m.set("headache", [50]);
  m.set("headline", [99]);
  m.set("health", [82]);
  m.set("healthy", [45]);
  m.set("hear", [15]);
  m.set("heart", [18]);
  m.set("heat", [22]);
  m.set("heavy", [46]);
  m.set("height", [75]);
  m.set("helicopter", [76]);
  m.set("hello", [86]);
  m.set("help", [2]);
  m.set("helpful", [56]);
  m.set("hen", [30]);
  m.set("hence", [80]);
  m.set("her", [38]);
  m.set("herb", [68]);
  m.set("here", [79]);
  m.set("heritage", [25]);
  m.set("hero", [4]);
  m.set("hers", [65]);
  m.set("herself", [21]);
  m.set("hesitate", [55]);
  m.set("hi", [81]);
  m.set("hide", [77]);
  m.set("high", [73]);
  m.set("highlight", [75]);
  m.set("highway", [71]);
  m.set("hike", [57]);
  m.set("hill", [44]);
  m.set("him", [8]);
  m.set("himself", [22]);
  m.set("hire", [0]);
  m.set("his", [37]);
  m.set("historic", [47]);
  m.set("history", [58]);
  m.set("hit", [35]);
  m.set("hobby", [39]);
  m.set("hold", [31]);
  m.set("hole", [3]);
  m.set("holiday", [77]);
  m.set("home", [44]);
  m.set("hometown", [85]);
  m.set("homework", [44]);
  m.set("honest", [80]);
  m.set("honey", [74]);
  m.set("honour", [82]);
  m.set("hope", [66]);
  m.set("horrible", [74]);
  m.set("horror", [57]);
  m.set("horse", [71]);
  m.set("hospital", [26]);
  m.set("host_hostess", [31]);
  m.set("hot", [22]);
  m.set("hotel", [71]);
  m.set("hour", [11]);
  m.set("house", [44]);
  m.set("household", [43]);
  m.set("housework", [43]);
  m.set("housing", [51]);
  m.set("how", [81]);
  m.set("however", [87]);
  m.set("hug", [75]);
  m.set("huge", [48]);
  m.set("human", [4]);
  m.set("humanity", [24]);
  m.set("humble", [65]);
  m.set("humour", [76]);
  m.set("humourous", [16]);
  m.set("hungry", [63]);
  m.set("hunt", [52]);
  m.set("hurricane", [77]);
  m.set("hurry", [71]);
  m.set("hurt", [38]);
  m.set("husband", [38]);
  m.set("hybrid", [6]);
  m.set("hydrogen", [99]);
  m.set("i", [99]);
  m.set("ice", [39]);
  m.set("idea", [86]);
  m.set("ideal", [59]);
  m.set("identical", [79]);
  m.set("identify", [29]);
  m.set("identity", [34]);
  m.set("idiom", [35]);
  m.set("if", [11]);
  m.set("ignore", [45]);
  m.set("ill", [78]);
  m.set("illegal", [78]);
  m.set("illness", [59]);
  m.set("illustrate", [60]);
  m.set("image", [24]);
  m.set("imagine", [26]);
  m.set("immediately", [36]);
  m.set("impact", [2]);
  m.set("imply", [51]);
  m.set("import", [63]);
  m.set("important", [13]);
  m.set("impossible", [44]);
  m.set("impress", [74]);
  m.set("impression", [31]);
  m.set("improve", [16]);
  m.set("in", [82]);
  m.set("inch", [54]);
  m.set("incident", [81]);
  m.set("include", [18]);
  m.set("income", [82]);
  m.set("increase", [25]);
  m.set("incredible", [60]);
  m.set("indeed", [29]);
  m.set("independent", [18]);
  m.set("indicate", [24]);
  m.set("individual", [33]);
  m.set("industry", [23]);
  m.set("infection", [61]);
  m.set("infer", [25]);
  m.set("influence", [66]);
  m.set("influential", [1]);
  m.set("information", [88]);
  m.set("ingredient", [63]);
  m.set("initial", [73]);
  m.set("initiative", [90]);
  m.set("injury", [83]);
  m.set("ink", [90]);
  m.set("inner", [55]);
  m.set("innocent", [94]);
  m.set("innovation", [46]);
  m.set("input", [84]);
  m.set("inquire", [99]);
  m.set("insect", [17]);
  m.set("inside", [92]);
  m.set("insight", [40]);
  m.set("insist", [23]);
  m.set("inspection", [90]);
  m.set("inspire", [91]);
  m.set("instance", [28]);
  m.set("instant", [8]);
  m.set("instead", [48]);
  m.set("institute", [41]);
  m.set("institution", [20]);
  m.set("instruction", [59]);
  m.set("instrument", [27]);
  m.set("insurance", [62]);
  m.set("integrate", [6]);
  m.set("integrity", [65]);
  m.set("intellectual", [57]);
  m.set("intelligent", [55]);
  m.set("intend", [56]);
  m.set("intense", [6]);
  m.set("intention", [80]);
  m.set("interaction", [71]);
  m.set("interest", [11]);
  m.set("interesting", [5]);
  m.set("internal", [91]);
  m.set("international", [9]);
  m.set("internet", [99]);
  m.set("interpret", [55]);
  m.set("interrupt", [47]);
  m.set("intervention", [40]);
  m.set("interview", [45]);
  m.set("into", [11]);
  m.set("introduce", [35]);
  m.set("introduction", [24]);
  m.set("invent", [28]);
  m.set("invention", [42]);
  m.set("invest", [18]);
  m.set("investigate", [75]);
  m.set("investment", [5]);
  m.set("invite", [93]);
  m.set("involve", [33]);
  m.set("iron", [23]);
  m.set("irrigation", [74]);
  m.set("island", [39]);
  m.set("issue", [18]);
  m.set("it", [86]);
  m.set("item", [20]);
  m.set("its", [69]);
  m.set("itself", [34]);
  m.set("jacket", [99]);
  m.set("jam", [49]);
  m.set("jaw", [63]);
  m.set("jazz", [72]);
  m.set("jeans", [99]);
  m.set("job", [7]);
  m.set("jog", [99]);
  m.set("join", [23]);
  m.set("joint", [82]);
  m.set("joke", [36]);
  m.set("journal", [69]);
  m.set("journalist", [54]);
  m.set("journey", [52]);
  m.set("joy", [14]);
  m.set("judge", [80]);
  m.set("juice", [63]);
  m.set("jump", [8]);
  m.set("jungle", [72]);
  m.set("junior", [31]);
  m.set("just", [5]);
  m.set("justice", [99]);
  m.set("justify", [75]);
  m.set("kangaroo", [99]);
  m.set("keen", [4]);
  m.set("keep", [84]);
  m.set("kettle", [51]);
  m.set("key", [89]);
  m.set("keyboard", [5]);
  m.set("kick", [55]);
  m.set("kid", [13]);
  m.set("kill", [17]);
  m.set("kilo", [87]);
  m.set("kilometre", [3]);
  m.set("kind", [88]);
  m.set("kindergarten", [81]);
  m.set("king", [4]);
  m.set("kingdom", [1]);
  m.set("kiss", [99]);
  m.set("kit", [92]);
  m.set("kitchen", [31]);
  m.set("kite", [97]);
  m.set("knee", [87]);
  m.set("knife", [90]);
  m.set("knock", [52]);
  m.set("know", [3]);
  m.set("knowledge", [53]);
  m.set("kung", [74]);
  m.set("kung_fu", [99]);
  m.set("lab", [17]);
  m.set("label", [75]);
  m.set("labour", [22]);
  m.set("lack", [17]);
  m.set("lady", [77]);
  m.set("lake", [24]);
  m.set("lamb", [6]);
  m.set("lamp", [76]);
  m.set("land", [22]);
  m.set("landscape", [66]);
  m.set("language", [23]);
  m.set("lantern", [99]);
  m.set("lap", [77]);
  m.set("laptop", [94]);
  m.set("large", [90]);
  m.set("last", [99]);
  m.set("late", [99]);
  m.set("later", [11]);
  m.set("laugh", [21]);
  m.set("launch", [62]);
  m.set("law", [44]);
  m.set("lawyer", [14]);
  m.set("lay", [5]);
  m.set("lazy", [32]);
  m.set("lead", [97]);
  m.set("leader", [49]);
  m.set("leadership", [40]);
  m.set("leaf", [45]);
  m.set("league", [99]);
  m.set("leak", [23]);
  m.set("lean", [71]);
  m.set("leap", [76]);
  m.set("learn", [4]);
  m.set("least", [95]);
  m.set("leather", [65]);
  m.set("leave", [9]);
  m.set("lecture", [41]);
  m.set("left", [11]);
  m.set("leg", [55]);
  m.set("legal", [51]);
  m.set("legend", [75]);
  m.set("leisure", [87]);
  m.set("lemon", [68]);
  m.set("lend", [58]);
  m.set("length", [25]);
  m.set("less", [11]);
  m.set("lesson", [48]);
  m.set("let", [46]);
  m.set("letter", [42]);
  m.set("level", [10]);
  m.set("liberation", [99]);
  m.set("liberty", [95]);
  m.set("librarian", [58]);
  m.set("library", [58]);
  m.set("license", [43]);
  m.set("lie", [33]);
  m.set("life", [87]);
  m.set("lifestyle", [38]);
  m.set("lift", [6]);
  m.set("light", [11]);
  m.set("lightning", [41]);
  m.set("like", [85]);
  m.set("likely", [88]);
  m.set("limit", [20]);
  m.set("limited", [20]);
  m.set("line", [90]);
  m.set("link", [64]);
  m.set("lion", [68]);
  m.set("lip", [74]);
  m.set("liquid", [80]);
  m.set("list", [34]);
  m.set("listen", [19]);
  m.set("literally", [94]);
  m.set("literary", [23]);
  m.set("literature", [58]);
  m.set("litter", [54]);
  m.set("little", [83]);
  m.set("live", [84]);
  m.set("lively", [44]);
  m.set("livestock", [5]);
  m.set("living", [27]);
  m.set("load", [65]);
  m.set("loan", [51]);
  m.set("local", [88]);
  m.set("location", [63]);
  m.set("lock", [83]);
  m.set("log", [52]);
  m.set("logical", [87]);
  m.set("lonely", [69]);
  m.set("long", [85]);
  m.set("look", [81]);
  m.set("loose", [48]);
  m.set("lose", [39]);
  m.set("loss", [18]);
  m.set("lost", [39]);
  m.set("lot", [34]);
  m.set("loud", [36]);
  m.set("love", [85]);
  m.set("lovely", [19]);
  m.set("low", [10]);
  m.set("lower", [10]);
  m.set("loyal", [67]);
  m.set("luck", [22]);
  m.set("lucky", [69]);
  m.set("lunar", [79]);
  m.set("lunch", [27]);
  m.set("lung", [61]);
  m.set("luxury", [99]);
  m.set("machine", [93]);
  m.set("mad", [52]);
  m.set("madam", [95]);
  m.set("magazine", [58]);
  m.set("magic", [53]);
  m.set("magnificent", [53]);
  m.set("mail", [80]);
  m.set("main", [71]);
  m.set("maintain", [30]);
  m.set("major", [20]);
  m.set("majority", [52]);
  m.set("make", [3]);
  m.set("male", [78]);
  m.set("mall", [57]);
  m.set("man", [7]);
  m.set("manage", [93]);
  m.set("manager", [49]);
  m.set("mankind", [92]);
  m.set("manner", [65]);
  m.set("many", [13]);
  m.set("map", [7]);
  m.set("marathon", [81]);
  m.set("march", [63]);
  m.set("marine", [1]);
  m.set("mark", [16]);
  m.set("market", [42]);
  m.set("marriage", [94]);
  m.set("marry", [43]);
  m.set("mass", [79]);
  m.set("massive", [63]);
  m.set("master", [24]);
  m.set("match", [32]);
  m.set("material", [10]);
  m.set("maths", [12]);
  m.set("matter", [82]);
  m.set("mature", [92]);
  m.set("maximum", [73]);
  m.set("may", [15]);
  m.set("maybe", [27]);
  m.set("me", [13]);
  m.set("meal", [7]);
  m.set("mean", [87]);
  m.set("meaning", [16]);
  m.set("means", [34]);
  m.set("meanwhile", [28]);
  m.set("measure", [0]);
  m.set("meat", [30]);
  m.set("mechanic", [51]);
  m.set("medal", [39]);
  m.set("medical", [38]);
  m.set("medicine", [38]);
  m.set("medium", [70]);
  m.set("meet", [7]);
  m.set("meeting", [15]);
  m.set("member", [43]);
  m.set("membership", [85]);
  m.set("memorial", [57]);
  m.set("memory", [53]);
  m.set("mental", [29]);
  m.set("mention", [18]);
  m.set("menu", [47]);
  m.set("mercy", [90]);
  m.set("merely", [83]);
  m.set("merry", [93]);
  m.set("mess", [37]);
  m.set("message", [52]);
  m.set("metal", [87]);
  m.set("metaphor", [67]);
  m.set("method", [26]);
  m.set("metre", [3]);
  m.set("microscope", [40]);
  m.set("middle", [14]);
  m.set("midnight", [94]);
  m.set("might", [99]);
  m.set("migration", [0]);
  m.set("mild", [94]);
  m.set("mile", [39]);
  m.set("military", [68]);
  m.set("milk", [22]);
  m.set("millimetre", [65]);
  m.set("million", [10]);
  m.set("mind", [86]);
  m.set("mine", [26]);
  m.set("mineral", [24]);
  m.set("minimum", [88]);
  m.set("minister", [92]);
  m.set("minor", [95]);
  m.set("minority", [99]);
  m.set("minute", [91]);
  m.set("miracle", [23]);
  m.set("mirror", [60]);
  m.set("miss", [94]);
  m.set("missile", [61]);
  m.set("missing", [60]);
  m.set("mission", [78]);
  m.set("mist", [67]);
  m.set("mistake", [15]);
  m.set("mix", [54]);
  m.set("mixture", [67]);
  m.set("mobile", [5]);
  m.set("mode", [90]);
  m.set("model", [31]);
  m.set("modern", [12]);
  m.set("modernization", [49]);
  m.set("modest", [76]);
  m.set("modify", [92]);
  m.set("moment", [8]);
  m.set("money", [46]);
  m.set("monitor", [32]);
  m.set("monkey", [54]);
  m.set("month", [16]);
  m.set("monthly", [61]);
  m.set("monument", [74]);
  m.set("mood", [73]);
  m.set("moon", [60]);
  m.set("moral", [64]);
  m.set("more", [84]);
  m.set("moreover", [80]);
  m.set("morning", [11]);
  m.set("mosquito", [95]);
  m.set("most", [11]);
  m.set("mostly", [48]);
  m.set("mother", [38]);
  m.set("motion", [94]);
  m.set("motivate", [37]);
  m.set("motive", [92]);
  m.set("motor", [48]);
  m.set("mount", [73]);
  m.set("mountain", [3]);
  m.set("mouse", [76]);
  m.set("mouth", [14]);
  m.set("move", [14]);
  m.set("movement", [29]);
  m.set("movie", [15]);
  m.set("mr", [22]);
  m.set("mrs", [15]);
  m.set("ms", [67]);
  m.set("much", [7]);
  m.set("mud", [50]);
  m.set("multiple", [61]);
  m.set("murder", [73]);
  m.set("muscle", [75]);
  m.set("museum", [12]);
  m.set("mushroom", [57]);
  m.set("music", [19]);
  m.set("musician", [31]);
  m.set("must", [24]);
  m.set("mutton", [99]);
  m.set("mutual", [1]);
  m.set("my", [36]);
  m.set("myself", [19]);
  m.set("mystery", [65]);
  m.set("myth", [68]);
  m.set("nail", [32]);
  m.set("name", [34]);
  m.set("narrow", [41]);
  m.set("nation", [1]);
  m.set("national", [34]);
  m.set("nationality", [94]);
  m.set("native", [48]);
  m.set("natural", [90]);
  m.set("nature", [92]);
  m.set("navy", [51]);
  m.set("near", [9]);
  m.set("nearby", [76]);
  m.set("nearly", [10]);
  m.set("neat", [72]);
  m.set("necessary", [34]);
  m.set("neck", [96]);
  m.set("need", [10]);
  m.set("needle", [89]);
  m.set("negative", [6]);
  m.set("negotiate", [35]);
  m.set("neighbour", [44]);
  m.set("neighbourhood", [37]);
  m.set("neither", [77]);
  m.set("nephew", [62]);
  m.set("nervous", [8]);
  m.set("nest", [6]);
  m.set("net", [87]);
  m.set("network", [54]);
  m.set("neutral", [79]);
  m.set("never", [86]);
  m.set("nevertheless", [80]);
  m.set("new", [2]);
  m.set("news", [36]);
  m.set("newspaper", [68]);
  m.set("next", [9]);
  m.set("nice", [22]);
  m.set("niece", [85]);
  m.set("night", [36]);
  m.set("no", [13]);
  m.set("noble", [50]);
  m.set("nobody", [42]);
  m.set("nod", [27]);
  m.set("noise", [3]);
  m.set("noisy", [92]);
  m.set("none", [45]);
  m.set("noodle", [95]);
  m.set("noon", [61]);
  m.set("nor", [59]);
  m.set("normal", [29]);
  m.set("north", [25]);
  m.set("northern", [15]);
  m.set("nose", [5]);
  m.set("not", [8]);
  m.set("note", [16]);
  m.set("notebook", [56]);
  m.set("nothing", [24]);
  m.set("notice", [38]);
  m.set("novel", [16]);
  m.set("novelist", [58]);
  m.set("now", [9]);
  m.set("nowadays", [63]);
  m.set("nowhere", [88]);
  m.set("nuclear", [51]);
  m.set("number", [70]);
  m.set("numerous", [78]);
  m.set("nurse", [43]);
  m.set("nut", [61]);
  m.set("nutrition", [64]);
  m.set("o_clock", [99]);
  m.set("obey", [90]);
  m.set("object", [18]);
  m.set("objective", [59]);
  m.set("observe", [0]);
  m.set("obstacle", [57]);
  m.set("obtain", [78]);
  m.set("obviously", [28]);
  m.set("occasion", [91]);
  m.set("occupation", [40]);
  m.set("occupy", [94]);
  m.set("occur", [58]);
  m.set("ocean", [33]);
  m.set("odd", [40]);
  m.set("of", [83]);
  m.set("off", [21]);
  m.set("offend", [56]);
  m.set("offer", [7]);
  m.set("office", [36]);
  m.set("officer", [86]);
  m.set("official", [31]);
  m.set("often", [83]);
  m.set("oil", [63]);
  m.set("ok", [39]);
  m.set("old", [85]);
  m.set("olympic", [52]);
  m.set("on", [91]);
  m.set("once", [12]);
  m.set("onion", [67]);
  m.set("online", [14]);
  m.set("only", [10]);
  m.set("onto", [42]);
  m.set("open", [47]);
  m.set("opera", [54]);
  m.set("operate", [42]);
  m.set("operation", [91]);
  m.set("operator", [50]);
  m.set("opinion", [58]);
  m.set("opponent", [92]);
  m.set("opportunity", [20]);
  m.set("oppose", [84]);
  m.set("opposite", [25]);
  m.set("optimistic", [88]);
  m.set("option", [47]);
  m.set("or", [71]);
  m.set("orange", [70]);
  m.set("orbit", [90]);
  m.set("orchestra", [65]);
  m.set("order", [82]);
  m.set("ordinary", [9]);
  m.set("organ", [71]);
  m.set("organic", [84]);
  m.set("organisation", [99]);
  m.set("organise", [98]);
  m.set("origin", [54]);
  m.set("original", [33]);
  m.set("other", [11]);
  m.set("otherwise", [69]);
  m.set("ought", [71]);
  m.set("our", [83]);
  m.set("ours", [83]);
  m.set("ourselves", [19]);
  m.set("out", [9]);
  m.set("outcome", [72]);
  m.set("outgoing", [92]);
  m.set("outline", [64]);
  m.set("output", [65]);
  m.set("outside", [30]);
  m.set("outstanding", [40]);
  m.set("oven", [50]);
  m.set("over", [83]);
  m.set("overall", [63]);
  m.set("overcome", [9]);
  m.set("overseas", [86]);
  m.set("owe", [94]);
  m.set("own", [3]);
  m.set("oxygen", [71]);
  m.set("p_m_", [98]);
  m.set("pace", [77]);
  m.set("pacific", [92]);
  m.set("pack", [90]);
  m.set("package", [50]);
  m.set("packet", [24]);
  m.set("page", [19]);
  m.set("pagoda", [6]);
  m.set("pain", [27]);
  m.set("paint", [12]);
  m.set("pair", [18]);
  m.set("palace", [53]);
  m.set("pale", [5]);
  m.set("pan", [52]);
  m.set("pancake", [90]);
  m.set("panda", [30]);
  m.set("panel", [64]);
  m.set("panic", [50]);
  m.set("pants", [50]);
  m.set("paper", [14]);
  m.set("paragraph", [31]);
  m.set("parcel", [50]);
  m.set("pardon", [74]);
  m.set("parent", [14]);
  m.set("park", [11]);
  m.set("parking", [52]);
  m.set("part", [83]);
  m.set("participate", [49]);
  m.set("particular", [25]);
  m.set("partner", [49]);
  m.set("party", [31]);
  m.set("pass", [7]);
  m.set("passage", [13]);
  m.set("passenger", [39]);
  m.set("passion", [64]);
  m.set("passive", [40]);
  m.set("passport", [64]);
  m.set("past", [94]);
  m.set("patent", [6]);
  m.set("path", [3]);
  m.set("patience", [47]);
  m.set("patient", [38]);
  m.set("patriotism", [6]);
  m.set("pattern", [71]);
  m.set("pay", [7]);
  m.set("pe", [48]);
  m.set("peace", [82]);
  m.set("peak", [73]);
  m.set("pear", [61]);
  m.set("pen", [42]);
  m.set("pencil", [88]);
  m.set("penguin", [92]);
  m.set("people", [34]);
  m.set("pepper", [85]);
  m.set("per", [10]);
  m.set("perceive", [69]);
  m.set("percentage", [25]);
  m.set("perfect", [24]);
  m.set("perform", [45]);
  m.set("performance", [92]);
  m.set("perhaps", [92]);
  m.set("period", [20]);
  m.set("permanent", [88]);
  m.set("permit", [70]);
  m.set("person", [34]);
  m.set("personal", [29]);
  m.set("personality", [36]);
  m.set("perspective", [53]);
  m.set("persuade", [32]);
  m.set("pessimistic", [61]);
  m.set("pet", [36]);
  m.set("petrol", [88]);
  m.set("phase", [51]);
  m.set("phenomenon", [56]);
  m.set("philosophy", [56]);
  m.set("phone", [45]);
  m.set("photo", [70]);
  m.set("photographer", [82]);
  m.set("phrase", [27]);
  m.set("physician", [88]);
  m.set("physics", [59]);
  m.set("piano", [67]);
  m.set("pick", [22]);
  m.set("picnic", [94]);
  m.set("picture", [27]);
  m.set("pie", [92]);
  m.set("piece", [12]);
  m.set("pig", [35]);
  m.set("pile", [79]);
  m.set("pill", [61]);
  m.set("pilot", [70]);
  m.set("ping_pong", [98]);
  m.set("pink", [81]);
  m.set("pioneer", [70]);
  m.set("pipe", [93]);
  m.set("pity", [73]);
  m.set("pizza", [74]);
  m.set("place", [15]);
  m.set("plain", [70]);
  m.set("plan", [52]);
  m.set("plane", [55]);
  m.set("planet", [60]);
  m.set("plant", [2]);
  m.set("plastic", [2]);
  m.set("plate", [52]);
  m.set("platform", [62]);
  m.set("play", [83]);
  m.set("player", [31]);
  m.set("playground", [74]);
  m.set("pleasant", [47]);
  m.set("please", [13]);
  m.set("pleasure", [36]);
  m.set("plenty", [27]);
  m.set("plot", [19]);
  m.set("plug", [92]);
  m.set("plus", [63]);
  m.set("pocket", [73]);
  m.set("poem", [24]);
  m.set("poet", [1]);
  m.set("poetry", [53]);
  m.set("point", [20]);
  m.set("poison", [50]);
  m.set("polar", [28]);
  m.set("pole", [4]);
  m.set("police", [3]);
  m.set("policeman_policewoman", [72]);
  m.set("policy", [46]);
  m.set("polish", [95]);
  m.set("polite", [1]);
  m.set("political", [62]);
  m.set("politician", [5]);
  m.set("politics", [88]);
  m.set("pollute", [2]);
  m.set("pollution", [2]);
  m.set("pond", [60]);
  m.set("pool", [56]);
  m.set("poor", [27]);
  m.set("popular", [74]);
  m.set("population", [70]);
  m.set("pork", [97]);
  m.set("porridge", [52]);
  m.set("port", [51]);
  m.set("portrait", [53]);
  m.set("pose", [30]);
  m.set("position", [0]);
  m.set("positive", [8]);
  m.set("possession", [88]);
  m.set("possible", [94]);
  m.set("post", [43]);
  m.set("postcard", [63]);
  m.set("poster", [1]);
  m.set("postman", [97]);
  m.set("postpone", [76]);
  m.set("pot", [23]);
  m.set("potato", [6]);
  m.set("potential", [28]);
  m.set("pound", [55]);
  m.set("pour", [60]);
  m.set("poverty", [44]);
  m.set("power", [42]);
  m.set("practical", [32]);
  m.set("practise", [21]);
  m.set("praise", [26]);
  m.set("pray", [51]);
  m.set("precious", [39]);
  m.set("precisely", [55]);
  m.set("predict", [75]);
  m.set("prefer", [20]);
  m.set("preference", [83]);
  m.set("prejudice", [99]);
  m.set("premier", [72]);
  m.set("prepare", [71]);
  m.set("present", [21]);
  m.set("presentation", [69]);
  m.set("preserve", [56]);
  m.set("president", [56]);
  m.set("press", [31]);
  m.set("pressure", [0]);
  m.set("pretend", [53]);
  m.set("pretty", [43]);
  m.set("prevent", [32]);
  m.set("previous", [56]);
  m.set("price", [32]);
  m.set("pride", [79]);
  m.set("primary", [47]);
  m.set("primitive", [65]);
  m.set("prince_princess", [12]);
  m.set("principal", [32]);
  m.set("principle", [0]);
  m.set("print", [4]);
  m.set("prior", [87]);
  m.set("priority", [80]);
  m.set("prison", [61]);
  m.set("private", [31]);
  m.set("prize", [41]);
  m.set("probably", [89]);
  m.set("problem", [9]);
  m.set("procedure", [49]);
  m.set("proceed", [57]);
  m.set("process", [33]);
  m.set("produce", [23]);
  m.set("product", [2]);
  m.set("profession", [75]);
  m.set("professional", [45]);
  m.set("professor", [29]);
  m.set("profile", [0]);
  m.set("profit", [73]);
  m.set("programme", [49]);
  m.set("progress", [58]);
  m.set("prohibit", [76]);
  m.set("project", [9]);
  m.set("promise", [55]);
  m.set("promote", [25]);
  m.set("pronounce", [68]);
  m.set("pronunciation", [55]);
  m.set("proof", [61]);
  m.set("proper", [78]);
  m.set("property", [78]);
  m.set("proportion", [93]);
  m.set("proposal", [56]);
  m.set("prospect", [86]);
  m.set("prosperity", [51]);
  m.set("protect", [17]);
  m.set("protein", [86]);
  m.set("protest", [18]);
  m.set("proud", [21]);
  m.set("prove", [17]);
  m.set("provide", [20]);
  m.set("province", [20]);
  m.set("psychology", [66]);
  m.set("pub", [40]);
  m.set("public", [23]);
  m.set("publish", [17]);
  m.set("pudding", [76]);
  m.set("pull", [37]);
  m.set("punish", [50]);
  m.set("purchase", [7]);
  m.set("pure", [40]);
  m.set("purple", [71]);
  m.set("purpose", [7]);
  m.set("purse", [77]);
  m.set("pursue", [41]);
  m.set("push", [36]);
  m.set("put", [99]);
  m.set("puzzle", [80]);
  m.set("pyramid", [65]);
  m.set("qualification", [50]);
  m.set("qualify", [62]);
  m.set("quality", [89]);
  m.set("quantity", [63]);
  m.set("quarter", [84]);
  m.set("queen", [40]);
  m.set("question", [59]);
  m.set("quick", [22]);
  m.set("quiet", [27]);
  m.set("quit", [37]);
  m.set("quite", [81]);
  m.set("quote", [18]);
  m.set("rabbit", [42]);
  m.set("race", [77]);
  m.set("racial", [28]);
  m.set("radiation", [77]);
  m.set("radio", [17]);
  m.set("radium", [97]);
  m.set("railway", [55]);
  m.set("rain", [17]);
  m.set("rainbow", [16]);
  m.set("rainy", [68]);
  m.set("raise", [79]);
  m.set("random", [56]);
  m.set("range", [53]);
  m.set("rank", [73]);
  m.set("rapid", [64]);
  m.set("rare", [47]);
  m.set("rate", [73]);
  m.set("rather", [34]);
  m.set("rating", [73]);
  m.set("raw", [82]);
  m.set("ray", [54]);
  m.set("reach", [95]);
  m.set("react", [81]);
  m.set("reaction", [32]);
  m.set("read", [13]);
  m.set("ready", [8]);
  m.set("real", [8]);
  m.set("realise", [96]);
  m.set("realistic", [83]);
  m.set("reality", [45]);
  m.set("really", [19]);
  m.set("reason", [13]);
  m.set("recall", [84]);
  m.set("receipt", [57]);
  m.set("receive", [14]);
  m.set("recent", [34]);
  m.set("recently", [24]);
  m.set("receptionist", [78]);
  m.set("recipe", [46]);
  m.set("recite", [1]);
  m.set("recognise", [96]);
  m.set("recognition", [41]);
  m.set("recommend", [15]);
  m.set("record", [28]);
  m.set("recording", [78]);
  m.set("recover", [69]);
  m.set("recreation", [57]);
  m.set("recycle", [42]);
  m.set("red", [38]);
  m.set("reduce", [2]);
  m.set("refer", [66]);
  m.set("reference", [78]);
  m.set("reflect", [28]);
  m.set("reform", [85]);
  m.set("refresh", [61]);
  m.set("refuse", [41]);
  m.set("regard", [32]);
  m.set("regardless", [59]);
  m.set("region", [28]);
  m.set("register", [47]);
  m.set("regret", [37]);
  m.set("regular", [52]);
  m.set("reinforce", [40]);
  m.set("reject", [45]);
  m.set("rejuvenate", [96]);
  m.set("relate", [59]);
  m.set("relationship", [9]);
  m.set("relative", [70]);
  m.set("relax", [58]);
  m.set("relay", [67]);
  m.set("release", [54]);
  m.set("relevant", [49]);
  m.set("reliable", [64]);
  m.set("relief", [77]);
  m.set("relieve", [73]);
  m.set("religion", [93]);
  m.set("rely", [64]);
  m.set("remain", [25]);
  m.set("remarkable", [75]);
  m.set("remember", [19]);
  m.set("remind", [39]);
  m.set("remote", [49]);
  m.set("remove", [42]);
  m.set("rent", [7]);
  m.set("repair", [37]);
  m.set("repeat", [32]);
  m.set("replace", [5]);
  m.set("reply", [36]);
  m.set("report", [86]);
  m.set("represent", [42]);
  m.set("representative", [83]);
  m.set("republic", [40]);
  m.set("reputation", [69]);
  m.set("request", [20]);
  m.set("require", [0]);
  m.set("rescue", [78]);
  m.set("research", [29]);
  m.set("reserve", [20]);
  m.set("resident", [76]);
  m.set("resign", [61]);
  m.set("resistance", [89]);
  m.set("resolution", [31]);
  m.set("resolve", [50]);
  m.set("resource", [0]);
  m.set("respect", [41]);
  m.set("respective", [95]);
  m.set("respond", [78]);
  m.set("response", [33]);
  m.set("responsibility", [64]);
  m.set("responsible", [56]);
  m.set("rest", [38]);
  m.set("restaurant", [96]);
  m.set("restore", [81]);
  m.set("restrict", [94]);
  m.set("result", [17]);
  m.set("retire", [63]);
  m.set("return", [16]);
  m.set("reveal", [78]);
  m.set("review", [52]);
  m.set("revise", [93]);
  m.set("revolution", [35]);
  m.set("reward", [33]);
  m.set("rhyme", [5]);
  m.set("rhythm", [68]);
  m.set("rice", [22]);
  m.set("rich", [41]);
  m.set("riddle", [63]);
  m.set("ride", [71]);
  m.set("right", [71]);
  m.set("rigid", [67]);
  m.set("ring", [36]);
  m.set("ripe", [67]);
  m.set("rise", [25]);
  m.set("risk", [93]);
  m.set("rival", [23]);
  m.set("river", [60]);
  m.set("road", [34]);
  m.set("roast", [33]);
  m.set("robot", [42]);
  m.set("rock", [71]);
  m.set("rocket", [89]);
  m.set("role", [25]);
  m.set("roll", [36]);
  m.set("romantic", [93]);
  m.set("roof", [75]);
  m.set("room", [95]);
  m.set("root", [26]);
  m.set("rope", [16]);
  m.set("rose", [28]);
  m.set("rough", [54]);
  m.set("round", [45]);
  m.set("route", [73]);
  m.set("routine", [69]);
  m.set("row", [81]);
  m.set("royal", [0]);
  m.set("rubber", [62]);
  m.set("rubbish", [89]);
  m.set("rude", [89]);
  m.set("rugby", [88]);
  m.set("ruin", [26]);
  m.set("rule", [58]);
  m.set("ruler", [65]);
  m.set("run", [9]);
  m.set("rural", [78]);
  m.set("rush", [24]);
  m.set("sacrifice", [97]);
  m.set("sad", [45]);
  m.set("safe", [44]);
  m.set("safety", [66]);
  m.set("sail", [39]);
  m.set("salad", [44]);
  m.set("salary", [69]);
  m.set("sale", [37]);
  m.set("salesman_saleswoman", [95]);
  m.set("salt", [84]);
  m.set("salty", [93]);
  m.set("same", [16]);
  m.set("sample", [17]);
  m.set("sand", [40]);
  m.set("sandwich", [93]);
  m.set("satellite", [60]);
  m.set("satisfaction", [41]);
  m.set("satisfy", [45]);
  m.set("sauce", [74]);
  m.set("saucer", [15]);
  m.set("sausage", [86]);
  m.set("save", [37]);
  m.set("saving", [46]);
  m.set("say", [8]);
  m.set("saying", [69]);
  m.set("scale", [88]);
  m.set("scan", [95]);
  m.set("scare", [44]);
  m.set("scarf", [63]);
  m.set("scene", [58]);
  m.set("schedule", [9]);
  m.set("scholarship", [75]);
  m.set("school", [21]);
  m.set("schoolbag", [95]);
  m.set("science", [17]);
  m.set("scientific", [29]);
  m.set("scientist", [17]);
  m.set("scissors", [94]);
  m.set("score", [46]);
  m.set("scream", [22]);
  m.set("screen", [59]);
  m.set("sculpture", [12]);
  m.set("sea", [29]);
  m.set("search", [37]);
  m.set("season", [15]);
  m.set("seat", [49]);
  m.set("secondary", [51]);
  m.set("secret", [7]);
  m.set("secretary", [89]);
  m.set("section", [43]);
  m.set("secure", [41]);
  m.set("security", [0]);
  m.set("see", [85]);
  m.set("seed", [81]);
  m.set("seek", [0]);
  m.set("seem", [4]);
  m.set("seize", [75]);
  m.set("seldom", [18]);
  m.set("select", [24]);
  m.set("selfish", [86]);
  m.set("sell", [41]);
  m.set("semester", [62]);
  m.set("send", [88]);
  m.set("senior", [64]);
  m.set("sense", [86]);
  m.set("sensitive", [78]);
  m.set("sentence", [24]);
  m.set("separate", [70]);
  m.set("series", [46]);
  m.set("serious", [19]);
  m.set("servant", [0]);
  m.set("serve", [22]);
  m.set("service", [9]);
  m.set("session", [31]);
  m.set("set", [79]);
  m.set("setting", [49]);
  m.set("settle", [35]);
  m.set("several", [94]);
  m.set("severe", [78]);
  m.set("sew", [61]);
  m.set("sex", [94]);
  m.set("shade", [79]);
  m.set("shadow", [73]);
  m.set("shake", [22]);
  m.set("shall", [14]);
  m.set("shallow", [30]);
  m.set("shame", [47]);
  m.set("shape", [18]);
  m.set("share", [90]);
  m.set("shark", [73]);
  m.set("sharp", [0]);
  m.set("shave", [98]);
  m.set("she", [38]);
  m.set("sheep", [96]);
  m.set("sheet", [47]);
  m.set("shelf", [5]);
  m.set("shell", [77]);
  m.set("shelter", [77]);
  m.set("shift", [60]);
  m.set("shine", [5]);
  m.set("ship", [39]);
  m.set("shirt", [15]);
  m.set("shock", [30]);
  m.set("shoe", [54]);
  m.set("shoot", [36]);
  m.set("shop", [7]);
  m.set("shore", [90]);
  m.set("short", [34]);
  m.set("shortage", [28]);
  m.set("shorts", [94]);
  m.set("should", [89]);
  m.set("shoulder", [83]);
  m.set("shout", [36]);
  m.set("show", [10]);
  m.set("shower", [48]);
  m.set("shut", [80]);
  m.set("shy", [83]);
  m.set("sick", [9]);
  m.set("side", [3]);
  m.set("sigh", [77]);
  m.set("sight", [23]);
  m.set("sign", [38]);
  m.set("signal", [62]);
  m.set("significant", [16]);
  m.set("silence", [64]);
  m.set("silent", [98]);
  m.set("silk", [75]);
  m.set("silly", [88]);
  m.set("silver", [46]);
  m.set("similar", [25]);
  m.set("simple", [4]);
  m.set("since", [63]);
  m.set("sincerely", [72]);
  m.set("sing", [38]);
  m.set("single", [41]);
  m.set("sink", [48]);
  m.set("sir", [55]);
  m.set("sister", [21]);
  m.set("sit", [27]);
  m.set("site", [60]);
  m.set("situation", [22]);
  m.set("size", [29]);
  m.set("skate", [66]);
  m.set("skateboard", [69]);
  m.set("ski", [67]);
  m.set("skill", [97]);
  m.set("skin", [8]);
  m.set("skip", [61]);
  m.set("skirt", [31]);
  m.set("sky", [53]);
  m.set("slave", [6]);
  m.set("sleep", [37]);
  m.set("sleepy", [61]);
  m.set("slice", [80]);
  m.set("slide", [72]);
  m.set("slightly", [54]);
  m.set("slim", [96]);
  m.set("slip", [81]);
  m.set("slow", [91]);
  m.set("small", [83]);
  m.set("smart", [33]);
  m.set("smell", [46]);
  m.set("smile", [22]);
  m.set("smog", [48]);
  m.set("smoke", [66]);
  m.set("smooth", [62]);
  m.set("snack", [66]);
  m.set("snake", [70]);
  m.set("sneeze", [61]);
  m.set("snow", [35]);
  m.set("snowy", [73]);
  m.set("so", [2]);
  m.set("soccer", [81]);
  m.set("social", [34]);
  m.set("socialism", [93]);
  m.set("socialist", [5]);
  m.set("society", [18]);
  m.set("sock", [98]);
  m.set("sofa", [78]);
  m.set("soft", [23]);
  m.set("software", [49]);
  m.set("soil", [25]);
  m.set("solar", [60]);
  m.set("soldier", [1]);
  m.set("solid", [64]);
  m.set("solution", [26]);
  m.set("solve", [1]);
  m.set("some", [7]);
  m.set("somebody_someone", [3]);
  m.set("somehow", [55]);
  m.set("something", [13]);
  m.set("sometimes", [89]);
  m.set("somewhat", [87]);
  m.set("somewhere", [18]);
  m.set("son", [36]);
  m.set("song", [74]);
  m.set("soon", [21]);
  m.set("sore", [49]);
  m.set("sorrow", [90]);
  m.set("sorry", [52]);
  m.set("sort", [66]);
  m.set("soul", [26]);
  m.set("sound", [14]);
  m.set("soup", [30]);
  m.set("sour", [74]);
  m.set("source", [33]);
  m.set("south", [35]);
  m.set("southern", [39]);
  m.set("souvenir", [93]);
  m.set("sow", [6]);
  m.set("space", [95]);
  m.set("spacecraft", [72]);
  m.set("spare", [36]);
  m.set("speak", [93]);
  m.set("speaker", [15]);
  m.set("special", [20]);
  m.set("specialist", [18]);
  m.set("species", [17]);
  m.set("specific", [32]);
  m.set("speech", [3]);
  m.set("speed", [29]);
  m.set("spell", [45]);
  m.set("spend", [7]);
  m.set("spicy", [74]);
  m.set("spirit", [8]);
  m.set("splendid", [88]);
  m.set("split", [85]);
  m.set("sponsor", [88]);
  m.set("spoon", [84]);
  m.set("sport", [23]);
  m.set("spot", [90]);
  m.set("spread", [42]);
  m.set("spring", [24]);
  m.set("spy", [1]);
  m.set("square", [11]);
  m.set("stability", [67]);
  m.set("stadium", [80]);
  m.set("staff", [14]);
  m.set("stage", [37]);
  m.set("stair", [67]);
  m.set("stamp", [67]);
  m.set("stand", [3]);
  m.set("standard", [28]);
  m.set("star", [27]);
  m.set("stare", [30]);
  m.set("start", [13]);
  m.set("starve", [87]);
  m.set("state", [25]);
  m.set("station", [9]);
  m.set("statistic", [35]);
  m.set("statue", [84]);
  m.set("status", [84]);
  m.set("stay", [3]);
  m.set("steady", [65]);
  m.set("steak", [92]);
  m.set("steal", [69]);
  m.set("steam", [41]);
  m.set("steel", [96]);
  m.set("step", [34]);
  m.set("stick", [34]);
  m.set("still", [87]);
  m.set("stimulate", [53]);
  m.set("stomach", [40]);
  m.set("stomachache", [93]);
  m.set("stone", [18]);
  m.set("stop", [19]);
  m.set("store", [21]);
  m.set("storm", [55]);
  m.set("story", [13]);
  m.set("straight", [43]);
  m.set("straightforward", [83]);
  m.set("strait", [66]);
  m.set("strange", [77]);
  m.set("stranger", [77]);
  m.set("strategy", [40]);
  m.set("strawberry", [62]);
  m.set("stream", [60]);
  m.set("street", [71]);
  m.set("strength", [8]);
  m.set("strengthen", [54]);
  m.set("stress", [8]);
  m.set("stretch", [76]);
  m.set("strict", [51]);
  m.set("strike", [48]);
  m.set("string", [16]);
  m.set("strong", [22]);
  m.set("structure", [28]);
  m.set("struggle", [34]);
  m.set("student", [21]);
  m.set("studio", [68]);
  m.set("study", [99]);
  m.set("stuff", [81]);
  m.set("stupid", [62]);
  m.set("style", [19]);
  m.set("subject", [30]);
  m.set("subjective", [61]);
  m.set("submit", [82]);
  m.set("subscribe", [57]);
  m.set("subsequent", [65]);
  m.set("substance", [90]);
  m.set("substantial", [90]);
  m.set("suburb", [56]);
  m.set("subway", [51]);
  m.set("succeed", [26]);
  m.set("success", [41]);
  m.set("successful", [95]);
  m.set("such", [64]);
  m.set("sudden", [21]);
  m.set("suffer", [34]);
  m.set("sufficient", [79]);
  m.set("sugar", [68]);
  m.set("suggest", [89]);
  m.set("suggestion", [60]);
  m.set("suit", [8]);
  m.set("suitable", [66]);
  m.set("sum", [44]);
  m.set("summary", [23]);
  m.set("summer", [16]);
  m.set("sun", [16]);
  m.set("sunny", [95]);
  m.set("super", [65]);
  m.set("superb", [77]);
  m.set("superior", [62]);
  m.set("supermarket", [48]);
  m.set("supplement", [80]);
  m.set("supply", [28]);
  m.set("support", [15]);
  m.set("suppose", [55]);
  m.set("sure", [82]);
  m.set("surf", [90]);
  m.set("surface", [2]);
  m.set("surgeon", [65]);
  m.set("surgery", [72]);
  m.set("surprise", [21]);
  m.set("surround", [56]);
  m.set("surrounding", [18]);
  m.set("survey", [47]);
  m.set("survive", [33]);
  m.set("suspect", [40]);
  m.set("suspend", [65]);
  m.set("sustain", [91]);
  m.set("sweat", [87]);
  m.set("sweater", [72]);
  m.set("sweep", [51]);
  m.set("sweet", [38]);
  m.set("swim", [14]);
  m.set("swing", [71]);
  m.set("switch", [32]);
  m.set("symbol", [55]);
  m.set("sympathy", [68]);
  m.set("symphony", [18]);
  m.set("symptom", [61]);
  m.set("system", [20]);
  m.set("t_shirt", [93]);
  m.set("table", [14]);
  m.set("tablet", [63]);
  m.set("tackle", [72]);
  m.set("tail", [89]);
  m.set("tailor", [75]);
  m.set("take", [7]);
  m.set("tale", [40]);
  m.set("talent", [12]);
  m.set("talk", [15]);
  m.set("tall", [3]);
  m.set("tank", [40]);
  m.set("tap", [40]);
  m.set("tape", [77]);
  m.set("target", [42]);
  m.set("task", [34]);
  m.set("taste", [22]);
  m.set("tax", [67]);
  m.set("taxi", [52]);
  m.set("tea", [27]);
  m.set("teach", [21]);
  m.set("teacher", [21]);
  m.set("team", [88]);
  m.set("teamwork", [52]);
  m.set("teapot", [40]);
  m.set("tear", [47]);
  m.set("technique", [71]);
  m.set("technology", [42]);
  m.set("teenage", [64]);
  m.set("teenager", [43]);
  m.set("telephone", [26]);
  m.set("telescope", [75]);
  m.set("tell", [8]);
  m.set("temperature", [25]);
  m.set("temple", [93]);
  m.set("temporary", [57]);
  m.set("tend", [16]);
  m.set("tendency", [84]);
  m.set("tennis", [46]);
  m.set("tension", [91]);
  m.set("tent", [82]);
  m.set("term", [45]);
  m.set("terrible", [58]);
  m.set("territory", [98]);
  m.set("test", [10]);
  m.set("text", [66]);
  m.set("than", [15]);
  m.set("thank", [37]);
  m.set("that", [87]);
  m.set("the", [78]);
  m.set("theatre", [16]);
  m.set("theft", [81]);
  m.set("their", [4]);
  m.set("theirs", [50]);
  m.set("them", [87]);
  m.set("theme", [56]);
  m.set("themselves", [59]);
  m.set("then", [87]);
  m.set("theory", [29]);
  m.set("there", [99]);
  m.set("therefore", [31]);
  m.set("these", [87]);
  m.set("they", [2]);
  m.set("thick", [70]);
  m.set("thin", [8]);
  m.set("thing", [12]);
  m.set("think", [45]);
  m.set("thinking", [45]);
  m.set("thirsty", [82]);
  m.set("this", [2]);
  m.set("thorough", [95]);
  m.set("those", [37]);
  m.set("though", [13]);
  m.set("thought", [13]);
  m.set("threat", [1]);
  m.set("threaten", [83]);
  m.set("throat", [77]);
  m.set("through", [84]);
  m.set("throughout", [10]);
  m.set("throw", [5]);
  m.set("thunder", [65]);
  m.set("thus", [93]);
  m.set("ticket", [58]);
  m.set("tidy", [85]);
  m.set("tie", [32]);
  m.set("tiger", [93]);
  m.set("tight", [5]);
  m.set("time", [7]);
  m.set("tiny", [23]);
  m.set("tip", [56]);
  m.set("tired", [36]);
  m.set("tissue", [95]);
  m.set("title", [66]);
  m.set("to", [81]);
  m.set("toast", [48]);
  m.set("tobacco", [76]);
  m.set("today", [20]);
  m.set("tofu", [68]);
  m.set("together", [16]);
  m.set("toilet", [93]);
  m.set("tolerate", [75]);
  m.set("tomato", [90]);
  m.set("tomb", [89]);
  m.set("tomorrow", [15]);
  m.set("ton", [63]);
  m.set("tone", [76]);
  m.set("tonight", [43]);
  m.set("too", [84]);
  m.set("tool", [16]);
  m.set("tooth", [26]);
  m.set("toothache", [61]);
  m.set("top", [26]);
  m.set("topic", [59]);
  m.set("total", [4]);
  m.set("touch", [8]);
  m.set("tough", [43]);
  m.set("tour", [11]);
  m.set("tourist", [62]);
  m.set("tournament", [57]);
  m.set("towards", [56]);
  m.set("towel", [93]);
  m.set("tower", [87]);
  m.set("town", [27]);
  m.set("toy", [27]);
  m.set("track", [14]);
  m.set("trade", [6]);
  m.set("tradition", [1]);
  m.set("traditional", [92]);
  m.set("traffic", [48]);
  m.set("train", [62]);
  m.set("training", [0]);
  m.set("transfer", [39]);
  m.set("transform", [18]);
  m.set("transition", [10]);
  m.set("translate", [35]);
  m.set("transport", [32]);
  m.set("trap", [74]);
  m.set("travel", [24]);
  m.set("treasure", [18]);
  m.set("treat", [48]);
  m.set("treatment", [62]);
  m.set("tree", [11]);
  m.set("trend", [26]);
  m.set("trial", [38]);
  m.set("trick", [66]);
  m.set("trip", [23]);
  m.set("tropical", [43]);
  m.set("trouble", [15]);
  m.set("trousers", [50]);
  m.set("truck", [84]);
  m.set("true", [19]);
  m.set("trunk", [71]);
  m.set("trust", [68]);
  m.set("truth", [53]);
  m.set("try", [11]);
  m.set("tube", [51]);
  m.set("tune", [93]);
  m.set("tunnel", [47]);
  m.set("turkey", [47]);
  m.set("turn", [99]);
  m.set("tv", [37]);
  m.set("twice", [70]);
  m.set("twin", [67]);
  m.set("type", [20]);
  m.set("typhoon", [91]);
  m.set("typical", [41]);
  m.set("ugly", [82]);
  m.set("ultimately", [31]);
  m.set("umbrella", [84]);
  m.set("uncle", [37]);
  m.set("under", [20]);
  m.set("underground", [68]);
  m.set("understand", [13]);
  m.set("uniform", [51]);
  m.set("union", [23]);
  m.set("unique", [29]);
  m.set("unit", [42]);
  m.set("universe", [59]);
  m.set("university", [25]);
  m.set("unless", [81]);
  m.set("until", [11]);
  m.set("unusual", [27]);
  m.set("up", [5]);
  m.set("update", [63]);
  m.set("upon", [27]);
  m.set("upper", [28]);
  m.set("upset", [36]);
  m.set("urban", [26]);
  m.set("urge", [47]);
  m.set("urgent", [79]);
  m.set("us", [13]);
  m.set("use", [4]);
  m.set("used", [92]);
  m.set("useful", [92]);
  m.set("usual", [22]);
  m.set("usually", [45]);
  m.set("vacation", [37]);
  m.set("valid", [62]);
  m.set("valley", [87]);
  m.set("valuable", [32]);
  m.set("value", [97]);
  m.set("variation", [6]);
  m.set("variety", [17]);
  m.set("various", [68]);
  m.set("vary", [32]);
  m.set("vase", [76]);
  m.set("vast", [17]);
  m.set("vegetable", [7]);
  m.set("vehicle", [76]);
  m.set("venue", [82]);
  m.set("version", [56]);
  m.set("very", [84]);
  m.set("victim", [81]);
  m.set("victory", [89]);
  m.set("video", [59]);
  m.set("view", [12]);
  m.set("village", [44]);
  m.set("violence", [67]);
  m.set("violin", [90]);
  m.set("virtual", [60]);
  m.set("virtue", [80]);
  m.set("virus", [85]);
  m.set("visible", [92]);
  m.set("vision", [0]);
  m.set("visit", [16]);
  m.set("visitor", [12]);
  m.set("visual", [0]);
  m.set("vital", [20]);
  m.set("vivid", [53]);
  m.set("vocabulary", [18]);
  m.set("voice", [19]);
  m.set("volcano", [51]);
  m.set("volleyball", [47]);
  m.set("volume", [93]);
  m.set("voluntary", [47]);
  m.set("volunteer", [49]);
  m.set("vote", [46]);
  m.set("voyage", [1]);
  m.set("wage", [67]);
  m.set("waist", [93]);
  m.set("wait", [24]);
  m.set("wake", [40]);
  m.set("walk", [13]);
  m.set("wall", [26]);
  m.set("wallet", [56]);
  m.set("wander", [10]);
  m.set("want", [7]);
  m.set("war", [49]);
  m.set("ward", [1]);
  m.set("warm", [94]);
  m.set("warn", [17]);
  m.set("warning", [64]);
  m.set("wash", [46]);
  m.set("washroom", [11]);
  m.set("waste", [2]);
  m.set("watch", [3]);
  m.set("water", [11]);
  m.set("watermelon", [38]);
  m.set("wave", [66]);
  m.set("way", [89]);
  m.set("we", [82]);
  m.set("weak", [0]);
  m.set("wealth", [47]);
  m.set("weapon", [68]);
  m.set("wear", [38]);
  m.set("weather", [37]);
  m.set("web", [84]);
  m.set("website", [43]);
  m.set("wedding", [33]);
  m.set("weed", [32]);
  m.set("week", [11]);
  m.set("weekday", [98]);
  m.set("weekend", [43]);
  m.set("weekly", [49]);
  m.set("weep", [88]);
  m.set("weigh", [6]);
  m.set("weight", [53]);
  m.set("welcome", [11]);
  m.set("welfare", [88]);
  m.set("well", [4]);
  m.set("west", [3]);
  m.set("western", [39]);
  m.set("wet", [52]);
  m.set("wetland", [53]);
  m.set("whale", [39]);
  m.set("what", [88]);
  m.set("whatever", [44]);
  m.set("wheat", [6]);
  m.set("wheel", [54]);
  m.set("when", [79]);
  m.set("whenever", [78]);
  m.set("where", [88]);
  m.set("whether", [25]);
  m.set("which", [10]);
  m.set("while", [84]);
  m.set("whisper", [83]);
  m.set("white", [35]);
  m.set("who", [79]);
  m.set("whole", [94]);
  m.set("whom", [73]);
  m.set("whose", [14]);
  m.set("why", [7]);
  m.set("wi_fi", [46]);
  m.set("wide", [42]);
  m.set("widespread", [70]);
  m.set("wife", [23]);
  m.set("wild", [95]);
  m.set("will", [85]);
  m.set("win", [72]);
  m.set("wind", [16]);
  m.set("window", [30]);
  m.set("windy", [57]);
  m.set("wine", [84]);
  m.set("wing", [66]);
  m.set("winner", [72]);
  m.set("winter", [16]);
  m.set("wire", [30]);
  m.set("wisdom", [72]);
  m.set("wise", [68]);
  m.set("wish", [38]);
  m.set("with", [90]);
  m.set("withdraw", [87]);
  m.set("within", [22]);
  m.set("without", [86]);
  m.set("witness", [44]);
  m.set("wolf", [22]);
  m.set("woman", [15]);
  m.set("wonder", [53]);
  m.set("wonderful", [19]);
  m.set("wood", [43]);
  m.set("wool", [91]);
  m.set("word", [13]);
  m.set("work", [4]);
  m.set("worker", [56]);
  m.set("world", [87]);
  m.set("worry", [37]);
  m.set("worse", [17]);
  m.set("worst", [42]);
  m.set("worth", [6]);
  m.set("worthwhile", [88]);
  m.set("worthy", [95]);
  m.set("would", [87]);
  m.set("wound", [1]);
  m.set("wrap", [50]);
  m.set("wrestle", [57]);
  m.set("wrinkle", [93]);
  m.set("wrist", [92]);
  m.set("write", [58]);
  m.set("writer", [31]);
  m.set("wrong", [71]);
  m.set("x_ray", [92]);
  m.set("yard", [63]);
  m.set("year", [5]);
  m.set("yellow", [48]);
  m.set("yes", [38]);
  m.set("yesterday", [46]);
  m.set("yet", [45]);
  m.set("yield", [79]);
  m.set("yoghurt", [91]);
  m.set("you", [81]);
  m.set("young", [86]);
  m.set("your", [4]);
  m.set("yours", [64]);
  m.set("yourself", [34]);
  m.set("youth", [0]);
  m.set("zero", [4]);
  m.set("zone", [73]);
  m.set("zoo", [82]);
  return m;
})();

function _renderThemeNet(theme, hw) {
  const W = 320, H = 500;
  const bx = [55, 160, 265];
  const by = 92;
  const ws = 128;
  const rh = 26;
  const elliRx = (w) => Math.max(w.length * 3.2 + 9, 25);
  const isHi = (w) => w.toLowerCase() === hw;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="wv-net" xmlns="http://www.w3.org/2000/svg">`;
  // 第1层：中心节点（深灰色#374151对齐参考图"technology"；查询词=中心则红色高亮）
  const cHi = isHi(theme.center);
  s += `<ellipse cx="160" cy="40" rx="52" ry="18" fill="${cHi ? '#dc2626' : '#374151'}" stroke="#1f2937" stroke-width="1"/>`;
  s += `<text x="160" y="40" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="13" font-weight="700">${esc(theme.center)}</text>`;
  theme.branches.forEach((br, i) => {
    const x = bx[i];
    // 第2层：主题语境（中文，每主题专属；fallback 到 br.branch）
    const subLabel = (theme.subthemes && theme.subthemes[i]) || br.branch;
    s += `<line x1="160" y1="58" x2="${x}" y2="${by - 16}" stroke="#9ca3af" stroke-width="1" stroke-opacity="0.5"/>`;
    // 第2层：中文比英文宽，rx 自适应（每字 5.5px + padding 12）
    const subRx = Math.max(subLabel.length * 5.5 + 12, 50);
    s += `<ellipse cx="${x}" cy="${by}" rx="${subRx}" ry="16" fill="#e5e7eb" stroke="#9ca3af" stroke-width="0.8"/>`;
    s += `<text x="${x}" y="${by}" text-anchor="middle" dominant-baseline="central" fill="#1f2937" font-size="11" font-weight="600">${esc(subLabel)}</text>`;
    br.items.forEach((w, j) => {
      const wy = ws + j * rh;
      const h = isHi(w);
      const rx = elliRx(w);
      if (j === 0) s += `<line x1="${x}" y1="${by + 16}" x2="${x}" y2="${wy - 12}" stroke="#d1d5db" stroke-width="0.5" stroke-opacity="0.5"/>`;
      else s += `<line x1="${x}" y1="${wy - rh + 12}" x2="${x}" y2="${wy - 12}" stroke="#d1d5db" stroke-width="0.5" stroke-opacity="0.4"/>`;
      if (h) {
        s += `<ellipse cx="${x}" cy="${wy}" rx="${rx}" ry="12" fill="#fee2e2" stroke="#dc2626" stroke-width="1.3"/>`;
        s += `<text x="${x}" y="${wy}" text-anchor="middle" dominant-baseline="central" fill="#dc2626" font-size="10" font-weight="700">${esc(w)}</text>`;
      } else {
        s += `<ellipse cx="${x}" cy="${wy}" rx="${rx}" ry="12" fill="#f9fafb" stroke="#d1d5db" stroke-width="0.6"/>`;
        s += `<text x="${x}" y="${wy}" text-anchor="middle" dominant-baseline="central" fill="#374151" font-size="10">${esc(w)}</text>`;
      }
    });
  });
  s += `</svg>`;
  return `<div class="wv-net-wrap"><div class="wv-net-title">${esc(theme.name)} · 词汇语义网络</div>${s}</div>`;
}
function renderMindMap(word, entry) {
  const meta = entry.meta || {};
  const defs = entry.defs || [];
  const mm = _getMmData(word);

  // ---- 统计：词义分布 + 搭配 ----
  let totalGaokao = 0, totalTextbook = 0;
  const srcSet = new Set();
  const srcList = [];       // 所有例句来源（含重复，供语篇分布按例句计数）
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
      srcList.push(src);
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
  const primaryPos = _derivePrimaryPos(catMap, meta.pos, word, structMap, sigCat);
  const usagePos = _posDisplayName(primaryPos);

  // 提取真实教学 n-gram 词块（catch sight of / distinguish right from wrong / take place ...）
  // 每条释义先按释义文本推断词性（to 开头=动词 / 中文"的"结尾=形容词），避免名词用法按动词规则提取
  const collocMap = {};
  const nounCapable = defs.some(d => _defPos(d.def || '', primaryPos, word) === 'noun');
  defs.forEach((d) => {
    const dpos = _defPos(d.def || '', primaryPos, word);
    (d.ex || []).forEach(ex => _extractChunks(ex.s || '', word, dpos, collocMap, nounCapable));
  });
  // 质量加权排序：综合分 = 频率 + 质量分 × 1.5
  // 动宾/形+名搭配优先于介词/副词弱搭配，确保"run business"等核心搭配不被高频弱搭配挤出
  const topCollocations = _mergeChunkVariants(collocMap, word)
    .map(([ph, c]) => [ph, c, c + _chunkQualityScore(ph, word) * 1.5])
    .sort((a, b) => b[2] - a[2] || b[1] - a[1])
    .slice(0, 8)
    .map(([ph, c]) => [ph, c]);

  const structDesc = _deriveStructDesc(word, catMap, structMap, sigCat, primaryPos, topCollocations);

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

  // 真题词组：优先使用人工标注词块（entry.chunks），无标注时回退到自动提取
  const manualChunks = entry.chunks;
  // 过滤掉 count=0 的 chunks（原则：例句有才统计）
  const filteredManual = (manualChunks || []).filter(c => c.count > 0);
  if (filteredManual.length > 0) {
    // 一级标题"真题词组"独立成行，二级按类型各自成行
    rightHtml += `<p class="wv-line wv-struct"><span class="wv-tag">真题词组</span></p>`;
    const byType = {};
    // 兼容新旧类型名：动词短语/名词短语/形容词搭配/副词搭配/介词短语 + 名词词组/动词词组/...
    const typeOrder = ['动词短语','名词短语','形容词搭配','副词搭配','介词短语',
                       '名词词组','动词词组','形容词词组','副词词组','介词词组','其他'];
    filteredManual.forEach(c => {
      const tp = c.type || '其他';
      if (!byType[tp]) byType[tp] = [];
      byType[tp].push(c);
    });
    typeOrder.forEach(tp => {
      if (!byType[tp] || byType[tp].length === 0) return;
      // 按 count 降序排序（新数据有 count 字段，旧数据无）
      const sortedChunks = byType[tp].slice().sort((a, b) => {
        const ac = a.count || 0;
        const bc = b.count || 0;
        return bc - ac;
      });
      // 紧凑格式：词块连排，用"、"分隔，附频次显示
      // 格式：<en> (cn, count)、<en> (cn, count) ...
      const items = sortedChunks.map(c => {
        const count = c.count != null ? c.count : '';
        const countPart = count !== '' ? `<span class="wv-num">${count}</span>` : '';
        return `<span class="wv-hl">${esc(c.en)}</span><span class="wv-cn">(${esc(c.cn)}${count !== '' ? ', ' : ''}${countPart})</span>`;
      }).join('、');
      rightHtml += `<p class="wv-line wv-struct wv-sub wv-chunks-list"><span class="wv-sub-label">${esc(tp)}</span>${items}</p>`;
    });
  } else if (topCollocations.length > 0) {
    const sl = topCollocations.map(([ph, c]) =>
      `<span class="wv-hl">${esc(ph)}</span><span class="wv-num">(${c}次)</span>`).join('、');
    rightHtml += `<p class="wv-line wv-struct"><span class="wv-tag">真题词组</span>${sl}</p>`;
  }

  // 语篇分布（按例句计数，非去重来源，覆盖全部例句）
  const genres = _detectGenres(srcList);
  if (genres.types.length > 0 && totalGaokao >= 3) {
    const gl = genres.types.map(({ t, c }) =>
      `<span class="wv-hl">${esc(t)}</span><span class="wv-num">(${c}次)</span>`).join('、');
    rightHtml += `<p class="wv-line wv-struct"><span class="wv-tag">语篇分布</span>${gl}（共${genres.count}次）</p>`;
  }

  // ---- 左侧：主题词汇语义网（查询词属任一主题→渲染该主题3层网络，否则回退真题共现辐射网）----
  let netHtml = '';
  const _wl = word.toLowerCase();
  const _ti = WORD_TO_THEME.get(_wl);
  if (_ti && _ti.length) {
    netHtml = _renderThemeNet(THEME_NETS[_ti[0]], _wl);
  } else {
    const cloudWords = _extractCloudWords(defs, word);
    if (cloudWords.length >= 3) {
      const top = cloudWords.slice(0, 18);
      const maxC = top[0].c;
      const minC = top[top.length - 1].c;
      const logMax = Math.log(maxC);
      const logMin = Math.log(Math.max(minC, 1));
      const logRange = logMax - logMin || 1;
      const colorMap = { noun: '#2563eb', verb: '#dc2626', adj: '#7c3aed', other: '#6b7280' };
      const W = 300, H = 380;
      const cx = 150, cy = 188;
      const r = 112;
      const n = top.length;
      const nodes = top.map((cw, i) => {
        const angle = (2 * Math.PI * i / n) - Math.PI / 2;
        const ratio = (Math.log(cw.c) - logMin) / logRange;
        return { w: cw.w, c: cw.c, pos: cw.pos, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), nr: 3.5 + ratio * 5, lw: 0.5 + ratio * 2.2, angle };
      });
      let svg = `<svg viewBox="0 0 ${W} ${H}" class="wv-net" xmlns="http://www.w3.org/2000/svg">`;
      nodes.forEach(nd => { svg += `<line x1="${cx}" y1="${cy}" x2="${nd.x.toFixed(1)}" y2="${nd.y.toFixed(1)}" stroke="${colorMap[nd.pos]}" stroke-width="${nd.lw.toFixed(1)}" stroke-opacity="0.3"/>`; });
      svg += `<circle cx="${cx}" cy="${cy}" r="24" fill="#1f2937"/><text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">${esc(word)}</text>`;
      nodes.forEach(nd => { const color = colorMap[nd.pos]; svg += `<circle cx="${nd.x.toFixed(1)}" cy="${nd.y.toFixed(1)}" r="${nd.nr.toFixed(1)}" fill="${color}" fill-opacity="0.82" stroke="#fff" stroke-width="1.2"/>`; const lo = nd.nr + 5; const lx = nd.x + lo * Math.cos(nd.angle); const ly = nd.y + lo * Math.sin(nd.angle) + 3.5; const cosA = Math.cos(nd.angle); const anchor = cosA > 0.15 ? 'start' : cosA < -0.15 ? 'end' : 'middle'; svg += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" fill="${color}" font-size="10.5" font-weight="600">${esc(nd.w)}</text>`; });
      svg += `</svg>`;
      netHtml = `<div class="wv-net-wrap"><div class="wv-net-title">真题词汇语义网</div>${svg}</div>`;
    }
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
        ${netHtml}
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
      <span class="wv-subtitle">${esc(word)}词性变换</span>
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
    (meta.stars ? `<span class="stars">${esc(meta.stars)}</span>` : '') +
    `</div>`;

  const defs = entry.defs || [];
  if (!defs.length) {
    html += `<div class="notfound">该词暂无助记例句。</div>`;
  }
  defs.forEach((d, idx) => {
    // 推断词性：使用 _defPos 完整逻辑（to 开头=verb / 中文"的/地"结尾=adj/adv / 限定词开头=noun / 常见形容词起始模式=adj）
    const wordFallbackPos = _normalizePos(meta.pos);
    const posKey = _defPos(d.def || '', wordFallbackPos, word);
    const pos = _posBadgeName(posKey);
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
