const WORDS_URL = 'data/words.json?v=20260825u';
const INDEX_BASE = 'data/index/';
const MINDMAP_BASE = 'data/mindmap/';
const WORDS_BASE = 'data/words/';
const STATS_URL = 'data/stats.json?v=20260825u';

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
    const [wr, mr] = await Promise.all([fetch(WORDS_URL + '?v=20260825u'), fetch(WORDS_BASE + 'manifest.json?v=20260825u')]);
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
    const [res] = await Promise.all([fetch(WORDS_BASE + rel + '?v=20260825u'), ensureMindmap(letter), ensureFamily()]);
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
const THEME_NETS = [
  {
    name: "学校与教育",
    center: "school",
    branches: [
      { branch: "课程与学习", items: ["student", "class", "study", "skill", "experience", "interest", "problem", "explain", "practise", "teach"] },
      { branch: "校园生活", items: ["play", "friend", "week", "talk", "walk", "offer", "leave", "stop", "keep", "show"] },
      { branch: "师生成长", items: ["teacher", "parent", "kid", "follow", "decide", "begin", "bring", "grow", "become", "live"] },
    ]
  },
  {
    name: "家庭与亲情",
    center: "family",
    branches: [
      { branch: "家庭成员", items: ["mother", "father", "parent", "kid", "home", "relative", "generation", "sister", "brother", "son"] },
      { branch: "家庭生活", items: ["visit", "spend", "move", "enjoy", "together", "week", "offer", "meet", "change", "live"] },
      { branch: "亲情情感", items: ["love", "idea", "experience", "interest", "talk", "friend", "grow", "become", "decide", "follow"] },
    ]
  },
  {
    name: "科研与探索",
    center: "research",
    branches: [
      { branch: "科研主体", items: ["scientist", "university", "team", "study", "finding", "test", "experiment", "data", "evidence", "theory"] },
      { branch: "研究过程", items: ["suggest", "explain", "affect", "allow", "require", "raise", "follow", "grow", "become", "live"] },
      { branch: "科研影响", items: ["benefit", "effect", "level", "purpose", "idea", "share", "understand", "problem", "change", "human"] },
    ]
  },
  {
    name: "阅读与文学",
    center: "book",
    branches: [
      { branch: "阅读写作", items: ["read", "write", "story", "character", "author", "page", "chapter", "library", "publish", "poem"] },
      { branch: "文学要素", items: ["history", "thought", "idea", "view", "share", "understand", "interest", "love", "change", "meet"] },
      { branch: "文学传播", items: ["encourage", "recommend", "avoid", "bring", "enjoy", "teach", "remember", "offer", "talk", "follow"] },
    ]
  },
  {
    name: "饮食与健康",
    center: "food",
    branches: [
      { branch: "饮食行为", items: ["eat", "cook", "grow", "water", "buy", "plan", "meet", "taste", "restaurant", "menu"] },
      { branch: "健康影响", items: ["health", "body", "energy", "nutrition", "habit", "medicine", "care", "benefit", "effect", "level"] },
      { branch: "饮食语境", items: ["research", "study", "test", "local", "human", "family", "school", "talk", "offer", "change"] },
    ]
  },
  {
    name: "科技与创新",
    center: "technology",
    branches: [
      { branch: "科技发展", items: ["future", "power", "development", "create", "design", "system", "device", "digital", "machine", "screen"] },
      { branch: "技术应用", items: ["company", "service", "area", "control", "apply", "remove", "require", "allow", "explain", "share"] },
      { branch: "社会影响", items: ["change", "problem", "cause", "cost", "rise", "history", "idea", "focus", "turn", "live"] },
    ]
  },
  {
    name: "旅行与见闻",
    center: "travel",
    branches: [
      { branch: "旅行方式", items: ["trip", "visit", "train", "car", "journey", "tour", "passenger", "station", "ticket", "flight"] },
      { branch: "目的地见闻", items: ["city", "area", "home", "family", "friend", "service", "food", "week", "run", "field"] },
      { branch: "旅行体验", items: ["experience", "chance", "meet", "interest", "love", "offer", "move", "change", "decide", "enjoy"] },
    ]
  },
  {
    name: "工作与职业",
    center: "job",
    branches: [
      { branch: "职业技能", items: ["skill", "ability", "experience", "knowledge", "training", "exercise", "course", "college", "programme", "class"] },
      { branch: "工作生活", items: ["career", "profession", "office", "company", "manager", "staff", "student", "decide", "require", "teach"] },
      { branch: "经济收支", items: ["money", "pay", "buy", "spend", "earn", "cost", "price", "sell", "market", "business"] },
    ]
  },
  {
    name: "环境与自然",
    center: "environment",
    branches: [
      { branch: "生态保护", items: ["protect", "natural", "community", "effort", "approach", "benefit", "reduce", "replace", "serve", "share"] },
      { branch: "资源能源", items: ["energy", "water", "plant", "waste", "recycle", "animal", "species", "forest", "ocean", "carbon"] },
      { branch: "人与自然", items: ["human", "modern", "important", "local", "large", "past", "future", "change", "research", "study"] },
    ]
  },
  {
    name: "艺术与文化",
    center: "art",
    branches: [
      { branch: "艺术创作", items: ["artist", "paint", "create", "creative", "design", "inspire", "piece", "view", "museum", "exhibition"] },
      { branch: "文化场所", items: ["gallery", "theatre", "history", "century", "public", "school", "activity", "focus", "present", "offer"] },
      { branch: "艺术传承", items: ["music", "dance", "culture", "story", "book", "read", "write", "encourage", "teach", "discover"] },
    ]
  },
];

// 词→主题 index 列表（全量3096词覆盖；一词可属多主题按THEME_NETS顺序取首个命中；归属制=查询词不一定在网络30代表词内，仅显示其最相关主题网络）
const WORD_TO_THEME = (() => {
  const m = new Map();
  m.set("a_an", [0]);
  m.set("a_m_", [0]);
  m.set("abandon", [4]);
  m.set("ability", [7]);
  m.set("able", [0]);
  m.set("abnormal", [0]);
  m.set("aboard", [0]);
  m.set("about", [0]);
  m.set("above", [2]);
  m.set("abroad", [0]);
  m.set("absence", [1]);
  m.set("absent", [0]);
  m.set("absolutely", [0]);
  m.set("absorb", [5]);
  m.set("abstract", [7]);
  m.set("abuse", [4]);
  m.set("academic", [7]);
  m.set("accent", [7]);
  m.set("accept", [0]);
  m.set("access", [5]);
  m.set("accident", [0]);
  m.set("accommodation", [0]);
  m.set("accompany", [0]);
  m.set("according_to", [0]);
  m.set("account", [2]);
  m.set("accurate", [6]);
  m.set("accuse", [7]);
  m.set("ache", [0]);
  m.set("achieve", [2]);
  m.set("achievement", [0]);
  m.set("acid", [4]);
  m.set("acknowledge", [0]);
  m.set("acquire", [3]);
  m.set("across", [0]);
  m.set("act", [0]);
  m.set("action", [1]);
  m.set("active", [3]);
  m.set("activity", [9]);
  m.set("actor_actress", [1]);
  m.set("actually", [0]);
  m.set("ad", [0]);
  m.set("adapt", [0]);
  m.set("adaptation", [2]);
  m.set("add", [3]);
  m.set("addict", [7]);
  m.set("addition", [7]);
  m.set("address", [0]);
  m.set("adjust", [5]);
  m.set("administration", [7]);
  m.set("admire", [0]);
  m.set("admit", [2]);
  m.set("adopt", [5]);
  m.set("adorable", [0]);
  m.set("adult", [0]);
  m.set("advance", [2]);
  m.set("advantage", [3]);
  m.set("adventure", [0]);
  m.set("advertise", [0]);
  m.set("advice", [0]);
  m.set("advise", [1]);
  m.set("advocate", [3]);
  m.set("affair", [4]);
  m.set("affect", [2]);
  m.set("afford", [4]);
  m.set("afraid", [0]);
  m.set("africa", [6]);
  m.set("after", [0]);
  m.set("afternoon", [1]);
  m.set("afterward", [0]);
  m.set("again", [0]);
  m.set("against", [1]);
  m.set("age", [0]);
  m.set("agency", [3]);
  m.set("agenda", [8]);
  m.set("ago", [0]);
  m.set("agree", [3]);
  m.set("agreement", [7]);
  m.set("agriculture", [4]);
  m.set("ahead", [0]);
  m.set("ai", [2]);
  m.set("aid", [2]);
  m.set("aim", [0]);
  m.set("air", [1]);
  m.set("airline", [4]);
  m.set("airport", [4]);
  m.set("alarm", [9]);
  m.set("alcohol", [0]);
  m.set("alert", [0]);
  m.set("alive", [2]);
  m.set("all", [0]);
  m.set("allow", [2, 5]);
  m.set("almost", [0]);
  m.set("alone", [5]);
  m.set("along", [0]);
  m.set("alongside", [0]);
  m.set("aloud", [7]);
  m.set("already", [0]);
  m.set("also", [0]);
  m.set("alternative", [0]);
  m.set("although", [0]);
  m.set("altogether", [1]);
  m.set("always", [0]);
  m.set("amateur", [3]);
  m.set("amazing", [0]);
  m.set("ambition", [4]);
  m.set("ambitious", [7]);
  m.set("ambulance", [2]);
  m.set("america", [6]);
  m.set("among", [0]);
  m.set("amount", [2]);
  m.set("amuse", [8]);
  m.set("analyse", [2]);
  m.set("ancestor", [1]);
  m.set("ancient", [6]);
  m.set("and", [0]);
  m.set("anger", [1]);
  m.set("angle", [0]);
  m.set("angry", [0]);
  m.set("animal", [8]);
  m.set("ankle", [4]);
  m.set("anniversary", [0]);
  m.set("announce", [1]);
  m.set("annoy", [1]);
  m.set("annual", [0]);
  m.set("another", [0]);
  m.set("answer", [4]);
  m.set("ant", [3]);
  m.set("antarctica", [6]);
  m.set("anticipate", [7]);
  m.set("antique", [6]);
  m.set("anxiety", [9]);
  m.set("anxious", [7]);
  m.set("any", [0]);
  m.set("anybody_anyone", [0]);
  m.set("anyhow", [0]);
  m.set("anything", [2]);
  m.set("anyway", [0]);
  m.set("anywhere", [8]);
  m.set("apart", [2]);
  m.set("apartment", [7]);
  m.set("apologise", [0]);
  m.set("app", [0]);
  m.set("apparently", [0]);
  m.set("appeal", [1]);
  m.set("appear", [0]);
  m.set("appetite", [2]);
  m.set("applaud", [0]);
  m.set("apple", [2]);
  m.set("applicant", [7]);
  m.set("application", [0]);
  m.set("apply", [5]);
  m.set("appointment", [0]);
  m.set("appreciate", [7]);
  m.set("approach", [8]);
  m.set("appropriate", [2]);
  m.set("approve", [2]);
  m.set("arch", [8]);
  m.set("architect", [5]);
  m.set("arctic", [8]);
  m.set("area", [5, 6]);
  m.set("argue", [0]);
  m.set("arise", [3]);
  m.set("arm", [0]);
  m.set("army", [1]);
  m.set("around", [0]);
  m.set("arrangement", [0]);
  m.set("arrest", [4]);
  m.set("arrive", [0]);
  m.set("arrow", [8]);
  m.set("art", [9]);
  m.set("article", [5]);
  m.set("artificial", [2]);
  m.set("artist", [9]);
  m.set("as", [0]);
  m.set("ashamed", [2]);
  m.set("asia", [6]);
  m.set("aside", [4]);
  m.set("ask", [1]);
  m.set("asleep", [7]);
  m.set("aspect", [7]);
  m.set("assess", [2]);
  m.set("assign", [3]);
  m.set("assistant", [3]);
  m.set("association", [7]);
  m.set("assume", [3]);
  m.set("assumption", [7]);
  m.set("astonish", [7]);
  m.set("astronaut", [4]);
  m.set("astronomer", [4]);
  m.set("at", [0]);
  m.set("athlete", [4]);
  m.set("atlantic", [6]);
  m.set("atmosphere", [0]);
  m.set("attach", [4]);
  m.set("attack", [0]);
  m.set("attain", [4]);
  m.set("attempt", [0]);
  m.set("attend", [3]);
  m.set("attention", [5]);
  m.set("attitude", [5]);
  m.set("attract", [0]);
  m.set("audience", [0]);
  m.set("aunt", [0]);
  m.set("author", [3]);
  m.set("authority", [0]);
  m.set("automatic", [4]);
  m.set("autonomous", [0]);
  m.set("autumn", [3]);
  m.set("available", [3]);
  m.set("average", [2]);
  m.set("avoid", [3]);
  m.set("awake", [7]);
  m.set("award", [0]);
  m.set("aware", [7]);
  m.set("away", [0]);
  m.set("awesome", [0]);
  m.set("awful", [7]);
  m.set("awkward", [0]);
  m.set("baby", [2]);
  m.set("back", [0]);
  m.set("background", [0]);
  m.set("backward", [4]);
  m.set("bacon", [7]);
  m.set("bacteria", [2]);
  m.set("bad", [2]);
  m.set("badminton", [0]);
  m.set("bag", [0]);
  m.set("bakery", [7]);
  m.set("balance", [5]);
  m.set("ball", [0]);
  m.set("ballet", [0]);
  m.set("balloon", [0]);
  m.set("bamboo", [4]);
  m.set("ban", [0]);
  m.set("banana", [4]);
  m.set("band", [0]);
  m.set("bank", [2]);
  m.set("bar", [4]);
  m.set("barbecue", [0]);
  m.set("barely", [0]);
  m.set("bark", [6]);
  m.set("barrier", [1]);
  m.set("base", [0]);
  m.set("baseball", [7]);
  m.set("basic", [2]);
  m.set("basin", [0]);
  m.set("basis", [6]);
  m.set("basket", [0]);
  m.set("basketball", [0]);
  m.set("bat", [0]);
  m.set("bath", [0]);
  m.set("bathroom", [4]);
  m.set("battery", [4]);
  m.set("battle", [1]);
  m.set("bay", [7]);
  m.set("bce", [0]);
  m.set("be", [0]);
  m.set("beach", [3]);
  m.set("bean", [1]);
  m.set("bear", [0]);
  m.set("beard", [0]);
  m.set("beat", [3]);
  m.set("beautiful", [1]);
  m.set("beauty", [2]);
  m.set("because", [0]);
  m.set("become", [0, 1, 2]);
  m.set("bed", [4]);
  m.set("bedroom", [3]);
  m.set("bee", [5]);
  m.set("beef", [7]);
  m.set("beer", [7]);
  m.set("before", [1]);
  m.set("begin", [0]);
  m.set("behalf", [0]);
  m.set("behave", [4]);
  m.set("behaviour", [0]);
  m.set("behind", [0]);
  m.set("being", [0]);
  m.set("belief", [5]);
  m.set("believe", [0]);
  m.set("bell", [3]);
  m.set("belong", [7]);
  m.set("below", [0]);
  m.set("belt", [0]);
  m.set("bend", [0]);
  m.set("beneath", [2]);
  m.set("benefit", [2, 4, 8]);
  m.set("beside", [0]);
  m.set("besides", [0]);
  m.set("best", [0]);
  m.set("bet", [7]);
  m.set("better", [0]);
  m.set("between", [0]);
  m.set("beyond", [8]);
  m.set("bias", [0]);
  m.set("big", [6]);
  m.set("bike", [6]);
  m.set("bill", [2]);
  m.set("billion", [4]);
  m.set("bin", [1]);
  m.set("biology", [2]);
  m.set("bird", [4]);
  m.set("birth", [0]);
  m.set("birthday", [0]);
  m.set("biscuit", [8]);
  m.set("bit", [0]);
  m.set("bite", [4]);
  m.set("bitter", [1]);
  m.set("black", [0]);
  m.set("blackboard", [0]);
  m.set("blame", [2]);
  m.set("blank", [0]);
  m.set("blanket", [4]);
  m.set("bleed", [4]);
  m.set("bless", [7]);
  m.set("blind", [1]);
  m.set("block", [9]);
  m.set("blog", [3]);
  m.set("blood", [2]);
  m.set("blouse", [6]);
  m.set("blow", [2]);
  m.set("blue", [8]);
  m.set("board", [1]);
  m.set("boat", [0]);
  m.set("body", [4]);
  m.set("boil", [3]);
  m.set("bomb", [6]);
  m.set("bond", [2]);
  m.set("bone", [4]);
  m.set("bonus", [4]);
  m.set("book", [3, 9]);
  m.set("boost", [4]);
  m.set("boot", [4]);
  m.set("border", [2]);
  m.set("bored", [7]);
  m.set("boring", [4]);
  m.set("born", [1]);
  m.set("borrow", [0]);
  m.set("boss", [7]);
  m.set("botanical", [5]);
  m.set("both", [0]);
  m.set("bother", [4]);
  m.set("bottle", [9]);
  m.set("bottom", [3]);
  m.set("bounce", [0]);
  m.set("bound", [2]);
  m.set("boundary", [1]);
  m.set("bow", [8]);
  m.set("bowl", [1]);
  m.set("bowling", [7]);
  m.set("box", [0]);
  m.set("boxing", [4]);
  m.set("boy", [1]);
  m.set("brain", [6]);
  m.set("branch", [1]);
  m.set("brand", [7]);
  m.set("brave", [2]);
  m.set("bread", [8]);
  m.set("break", [0]);
  m.set("breakfast", [5]);
  m.set("breast", [1]);
  m.set("breath", [7]);
  m.set("breathe", [1]);
  m.set("brick", [1]);
  m.set("bride_bridegroom", [8]);
  m.set("bridge", [6]);
  m.set("brief", [3]);
  m.set("bright", [0]);
  m.set("brilliant", [9]);
  m.set("bring", [0, 3]);
  m.set("broad", [0]);
  m.set("broadcast", [7]);
  m.set("brochure", [0]);
  m.set("brother", [1]);
  m.set("brown", [0]);
  m.set("brush", [0]);
  m.set("budget", [4]);
  m.set("buffet", [4]);
  m.set("bug", [4]);
  m.set("build", [0]);
  m.set("building", [0]);
  m.set("bully", [0]);
  m.set("bunch", [7]);
  m.set("burn", [0]);
  m.set("burst", [0]);
  m.set("bury", [4]);
  m.set("bus", [4]);
  m.set("business", [7]);
  m.set("busy", [0]);
  m.set("but", [0]);
  m.set("butcher", [7]);
  m.set("butter", [4]);
  m.set("butterfly", [0]);
  m.set("button", [4]);
  m.set("buy", [4, 7]);
  m.set("by", [0]);
  m.set("cabbage", [4]);
  m.set("cafe", [4]);
  m.set("cafeteria", [0]);
  m.set("cage", [0]);
  m.set("cake", [4]);
  m.set("calculate", [4]);
  m.set("calendar", [6]);
  m.set("call", [1]);
  m.set("calligraphy", [2]);
  m.set("calm", [0]);
  m.set("calorie", [4]);
  m.set("camel", [0]);
  m.set("camera", [0]);
  m.set("camp", [0]);
  m.set("campaign", [8]);
  m.set("campus", [3]);
  m.set("can", [0]);
  m.set("canal", [6]);
  m.set("cancel", [0]);
  m.set("cancer", [2]);
  m.set("candidate", [4]);
  m.set("candle", [8]);
  m.set("candy", [4]);
  m.set("canteen", [4]);
  m.set("cap", [6]);
  m.set("capable", [2]);
  m.set("capacity", [6]);
  m.set("capital", [4]);
  m.set("capsule", [4]);
  m.set("captain", [0]);
  m.set("capture", [2]);
  m.set("car", [6]);
  m.set("carbon", [8]);
  m.set("card", [3]);
  m.set("care", [4]);
  m.set("career", [7]);
  m.set("careful", [6]);
  m.set("careless", [0]);
  m.set("carpet", [3]);
  m.set("carrot", [2]);
  m.set("carry", [0]);
  m.set("cartoon", [0]);
  m.set("carve", [0]);
  m.set("case", [0]);
  m.set("cash", [0]);
  m.set("cast", [1]);
  m.set("castle", [7]);
  m.set("casual", [4]);
  m.set("cat", [0]);
  m.set("catch", [6]);
  m.set("category", [3]);
  m.set("cattle", [4]);
  m.set("cause", [5]);
  m.set("cautious", [0]);
  m.set("cave", [0]);
  m.set("ce", [0]);
  m.set("cease", [0]);
  m.set("ceiling", [4]);
  m.set("celebrate", [0]);
  m.set("celebrity", [4]);
  m.set("cell", [2]);
  m.set("cent", [2]);
  m.set("centimetre", [1]);
  m.set("central", [4]);
  m.set("centre", [0]);
  m.set("century", [9]);
  m.set("ceremony", [7]);
  m.set("certain", [9]);
  m.set("certainly", [2]);
  m.set("certificate", [0]);
  m.set("chain", [2]);
  m.set("chair", [0]);
  m.set("chairman_chairwoman", [0]);
  m.set("chalk", [0]);
  m.set("challenge", [0]);
  m.set("champion", [0]);
  m.set("chance", [6]);
  m.set("change", [1, 2, 3, 4, 5, 6, 8]);
  m.set("channel", [1]);
  m.set("chaos", [2]);
  m.set("chapter", [3]);
  m.set("character", [3]);
  m.set("characteristic", [8]);
  m.set("charge", [0]);
  m.set("charity", [0]);
  m.set("charm", [7]);
  m.set("chart", [1]);
  m.set("chat", [0]);
  m.set("cheap", [7]);
  m.set("cheat", [0]);
  m.set("check", [6]);
  m.set("cheer", [1]);
  m.set("cheese", [0]);
  m.set("chef", [4]);
  m.set("chemical", [8]);
  m.set("chemist", [3]);
  m.set("chemistry", [2]);
  m.set("chess", [4]);
  m.set("chest", [0]);
  m.set("chew", [4]);
  m.set("chicken", [0]);
  m.set("chief", [8]);
  m.set("child", [0]);
  m.set("childhood", [0]);
  m.set("china", [1]);
  m.set("china_8a7d7b", [1]);
  m.set("chinese", [0]);
  m.set("chip", [0]);
  m.set("chocolate", [4]);
  m.set("choice", [0]);
  m.set("choke", [8]);
  m.set("choose", [0]);
  m.set("chopsticks", [4]);
  m.set("chore", [4]);
  m.set("chorus", [3]);
  m.set("christmas", [5]);
  m.set("church", [7]);
  m.set("cigarette", [9]);
  m.set("cinema", [0]);
  m.set("circle", [8]);
  m.set("circuit", [0]);
  m.set("circumstance", [4]);
  m.set("circus", [0]);
  m.set("cite", [2]);
  m.set("citizen", [3]);
  m.set("city", [6]);
  m.set("civil", [1]);
  m.set("civilian", [4]);
  m.set("civilisation", [7]);
  m.set("claim", [3]);
  m.set("clap", [9]);
  m.set("clarify", [4]);
  m.set("class", [0, 7]);
  m.set("classic", [1]);
  m.set("classmate", [1]);
  m.set("classroom", [0]);
  m.set("clay", [0]);
  m.set("clean", [0]);
  m.set("clear", [6]);
  m.set("clerk", [7]);
  m.set("clever", [1]);
  m.set("click", [4]);
  m.set("client", [2]);
  m.set("climate", [2]);
  m.set("climb", [0]);
  m.set("clinic", [0]);
  m.set("clock", [7]);
  m.set("clone", [4]);
  m.set("close", [0]);
  m.set("cloth", [0]);
  m.set("clothes", [3]);
  m.set("cloud", [0]);
  m.set("cloudy", [8]);
  m.set("club", [0]);
  m.set("clue", [4]);
  m.set("coach", [0]);
  m.set("coal", [8]);
  m.set("coast", [0]);
  m.set("coat", [7]);
  m.set("coffee", [7]);
  m.set("coin", [4]);
  m.set("cold", [0]);
  m.set("collaborate", [1]);
  m.set("collapse", [2]);
  m.set("collar", [4]);
  m.set("collect", [0]);
  m.set("collection", [6]);
  m.set("college", [7]);
  m.set("colour", [0]);
  m.set("column", [1]);
  m.set("combine", [0]);
  m.set("come", [0]);
  m.set("comedy", [0]);
  m.set("comfort", [1]);
  m.set("comfortable", [0]);
  m.set("comic", [0]);
  m.set("command", [3]);
  m.set("comment", [0]);
  m.set("commercial", [3]);
  m.set("commit", [7]);
  m.set("commitment", [2]);
  m.set("committee", [3]);
  m.set("common", [0]);
  m.set("communicate", [2]);
  m.set("communication", [1]);
  m.set("communist", [1]);
  m.set("community", [8]);
  m.set("company", [5, 7]);
  m.set("compare", [5]);
  m.set("comparison", [5]);
  m.set("compass", [2]);
  m.set("compete", [1]);
  m.set("competence", [7]);
  m.set("competition", [0]);
  m.set("complain", [3]);
  m.set("complete", [1]);
  m.set("complex", [0]);
  m.set("complicated", [4]);
  m.set("component", [5]);
  m.set("compose", [4]);
  m.set("composition", [0]);
  m.set("comprehension", [7]);
  m.set("comprehensive", [8]);
  m.set("comprise", [4]);
  m.set("computer", [0]);
  m.set("concentrate", [0]);
  m.set("concept", [5]);
  m.set("concern", [0]);
  m.set("concert", [0]);
  m.set("conclude", [6]);
  m.set("conclusion", [0]);
  m.set("concrete", [6]);
  m.set("condition", [3]);
  m.set("conduct", [6]);
  m.set("conference", [4]);
  m.set("confidence", [7]);
  m.set("confident", [3]);
  m.set("confirm", [0]);
  m.set("conflict", [1]);
  m.set("confucianism", [9]);
  m.set("confucius", [9]);
  m.set("confused", [3]);
  m.set("congratulation", [7]);
  m.set("connect", [0]);
  m.set("conscious", [0]);
  m.set("consequence", [2]);
  m.set("conservation", [0]);
  m.set("consider", [0]);
  m.set("consist", [2]);
  m.set("consistent", [2]);
  m.set("constant", [1]);
  m.set("constitution", [7]);
  m.set("construction", [6]);
  m.set("consultant", [4]);
  m.set("consultation", [7]);
  m.set("consume", [8]);
  m.set("consumption", [4]);
  m.set("contact", [7]);
  m.set("contain", [0]);
  m.set("contemporary", [0]);
  m.set("content", [5]);
  m.set("contest", [4]);
  m.set("context", [3]);
  m.set("continent", [0]);
  m.set("continue", [1]);
  m.set("contract", [7]);
  m.set("contradictory", [9]);
  m.set("contrary", [4]);
  m.set("contrast", [2]);
  m.set("contribution", [6]);
  m.set("control", [5]);
  m.set("controversial", [9]);
  m.set("convenient", [5]);
  m.set("conventional", [4]);
  m.set("conversation", [0]);
  m.set("convey", [8]);
  m.set("convince", [3]);
  m.set("cook", [4]);
  m.set("cookie", [0]);
  m.set("cool", [0]);
  m.set("cooperate", [0]);
  m.set("copy", [7]);
  m.set("core", [0]);
  m.set("corn", [0]);
  m.set("corner", [2]);
  m.set("corporate", [7]);
  m.set("correct", [3]);
  m.set("correspond", [6]);
  m.set("cost", [5, 7]);
  m.set("costume", [7]);
  m.set("cottage", [5]);
  m.set("cotton", [4]);
  m.set("cough", [4]);
  m.set("could", [0]);
  m.set("council", [7]);
  m.set("count", [2]);
  m.set("country", [1]);
  m.set("countryside", [3]);
  m.set("county", [8]);
  m.set("couple", [3]);
  m.set("courage", [1]);
  m.set("course", [7]);
  m.set("court", [0]);
  m.set("cousin", [4]);
  m.set("cover", [0]);
  m.set("coverage", [0]);
  m.set("cow", [3]);
  m.set("craft", [6]);
  m.set("crash", [3]);
  m.set("crazy", [9]);
  m.set("cream", [9]);
  m.set("create", [5, 9]);
  m.set("creative", [9]);
  m.set("creature", [0]);
  m.set("credit", [2]);
  m.set("crew", [4]);
  m.set("crime", [1]);
  m.set("crisis", [2]);
  m.set("criterion", [2]);
  m.set("critical", [8]);
  m.set("criticise", [9]);
  m.set("crop", [1]);
  m.set("cross", [1]);
  m.set("crowd", [2]);
  m.set("crowded", [1]);
  m.set("crucial", [7]);
  m.set("cruel", [7]);
  m.set("cry", [0]);
  m.set("cucumber", [0]);
  m.set("cuisine", [4]);
  m.set("culture", [9]);
  m.set("cup", [8]);
  m.set("cupboard", [4]);
  m.set("cure", [2]);
  m.set("curious", [2]);
  m.set("currency", [7]);
  m.set("current", [4]);
  m.set("curtain", [8]);
  m.set("curve", [0]);
  m.set("custom", [0]);
  m.set("customer", [1]);
  m.set("cut", [3]);
  m.set("cute", [2]);
  m.set("cycle", [0]);
  m.set("daily", [1]);
  m.set("dam", [6]);
  m.set("damage", [2]);
  m.set("damp", [6]);
  m.set("dance", [9]);
  m.set("danger", [0]);
  m.set("dangerous", [4]);
  m.set("dare", [4]);
  m.set("dark", [0]);
  m.set("data", [2]);
  m.set("database", [0]);
  m.set("date", [0]);
  m.set("daughter", [4]);
  m.set("dawn", [8]);
  m.set("day", [0]);
  m.set("dead", [1]);
  m.set("deadline", [0]);
  m.set("deaf", [7]);
  m.set("deal", [0]);
  m.set("dear", [0]);
  m.set("death", [2]);
  m.set("debate", [0]);
  m.set("debt", [4]);
  m.set("decade", [1]);
  m.set("decent", [7]);
  m.set("decide", [0, 1, 6, 7]);
  m.set("decision", [2]);
  m.set("declare", [2]);
  m.set("decline", [6]);
  m.set("decorate", [3]);
  m.set("decrease", [2]);
  m.set("dedicate", [1]);
  m.set("deep", [2]);
  m.set("deer", [1]);
  m.set("defeat", [0]);
  m.set("defence", [4]);
  m.set("defend", [3]);
  m.set("definitely", [7]);
  m.set("definition", [9]);
  m.set("degree", [4]);
  m.set("delay", [4]);
  m.set("delete", [0]);
  m.set("delicate", [3]);
  m.set("delicious", [0]);
  m.set("delight", [7]);
  m.set("deliver", [3]);
  m.set("demand", [0]);
  m.set("demonstrate", [0]);
  m.set("dentist", [7]);
  m.set("deny", [4]);
  m.set("department", [2]);
  m.set("departure", [2]);
  m.set("depend", [0]);
  m.set("depress", [4]);
  m.set("depth", [6]);
  m.set("describe", [0]);
  m.set("description", [2]);
  m.set("desert", [2]);
  m.set("deserve", [7]);
  m.set("design", [5, 9]);
  m.set("desire", [6]);
  m.set("desk", [0]);
  m.set("desperate", [7]);
  m.set("despite", [0]);
  m.set("dessert", [4]);
  m.set("destination", [0]);
  m.set("destroy", [2]);
  m.set("detail", [3]);
  m.set("detect", [1]);
  m.set("detective", [4]);
  m.set("determine", [0]);
  m.set("develop", [2]);
  m.set("development", [5]);
  m.set("device", [5]);
  m.set("devote", [7]);
  m.set("diagram", [2]);
  m.set("dialogue", [4]);
  m.set("diamond", [8]);
  m.set("diary", [3]);
  m.set("dictionary", [3]);
  m.set("die", [2]);
  m.set("diet", [4]);
  m.set("differ", [4]);
  m.set("difference", [2]);
  m.set("different", [0]);
  m.set("difficult", [0]);
  m.set("difficulty", [1]);
  m.set("dig", [4]);
  m.set("digest", [4]);
  m.set("digital", [5]);
  m.set("dignity", [7]);
  m.set("dimension", [3]);
  m.set("dining", [4]);
  m.set("dinner", [1]);
  m.set("dinosaur", [6]);
  m.set("direct", [5]);
  m.set("direction", [0]);
  m.set("director", [7]);
  m.set("directory", [7]);
  m.set("dirty", [4]);
  m.set("disability", [0]);
  m.set("disabled", [7]);
  m.set("disappear", [2]);
  m.set("disappoint", [0]);
  m.set("disappointed", [0]);
  m.set("disaster", [5]);
  m.set("disc", [4]);
  m.set("discipline", [4]);
  m.set("discount", [0]);
  m.set("discover", [9]);
  m.set("discovery", [1]);
  m.set("discrimination", [1]);
  m.set("discuss", [0]);
  m.set("discussion", [2]);
  m.set("disease", [1]);
  m.set("dish", [0]);
  m.set("dismiss", [6]);
  m.set("display", [0]);
  m.set("distance", [0]);
  m.set("distant", [3]);
  m.set("distinct", [0]);
  m.set("distinguish", [2]);
  m.set("distribution", [4]);
  m.set("district", [1]);
  m.set("disturb", [3]);
  m.set("dive", [0]);
  m.set("diverse", [0]);
  m.set("divide", [5]);
  m.set("division", [1]);
  m.set("dizzy", [4]);
  m.set("do", [0]);
  m.set("doctor", [6]);
  m.set("document", [1]);
  m.set("dog", [3]);
  m.set("doll", [8]);
  m.set("dollar", [4]);
  m.set("dolphin", [0]);
  m.set("domain", [2]);
  m.set("domestic", [4]);
  m.set("dominate", [4]);
  m.set("donate", [3]);
  m.set("door", [0]);
  m.set("dormitory", [4]);
  m.set("double", [5]);
  m.set("doubt", [2]);
  m.set("down", [0]);
  m.set("download", [0]);
  m.set("downstairs", [7]);
  m.set("downtown", [7]);
  m.set("dozen", [4]);
  m.set("draft", [2]);
  m.set("drag", [0]);
  m.set("dragon", [0]);
  m.set("drama", [0]);
  m.set("dramatic", [3]);
  m.set("draw", [0]);
  m.set("drawer", [0]);
  m.set("dream", [0]);
  m.set("dress", [0]);
  m.set("drill", [6]);
  m.set("drink", [0]);
  m.set("drive", [0]);
  m.set("driver", [4]);
  m.set("drone", [0]);
  m.set("drop", [2]);
  m.set("drought", [2]);
  m.set("drown", [4]);
  m.set("drug", [4]);
  m.set("dry", [2]);
  m.set("duck", [0]);
  m.set("due_to", [0]);
  m.set("dumpling", [4]);
  m.set("duration", [7]);
  m.set("during", [0]);
  m.set("dust", [1]);
  m.set("duty", [1]);
  m.set("dynamic", [0]);
  m.set("dynasty", [2]);
  m.set("each", [0]);
  m.set("eager", [7]);
  m.set("eagle", [0]);
  m.set("ear", [0]);
  m.set("early", [0]);
  m.set("earn", [7]);
  m.set("earth", [9]);
  m.set("earthquake", [2]);
  m.set("ease", [4]);
  m.set("east", [0]);
  m.set("eastern", [0]);
  m.set("easy", [0]);
  m.set("eat", [4]);
  m.set("ecology", [2]);
  m.set("economic", [6]);
  m.set("economy", [0]);
  m.set("edge", [6]);
  m.set("editor", [1]);
  m.set("education", [0]);
  m.set("educator", [0]);
  m.set("effect", [2, 4]);
  m.set("efficient", [0]);
  m.set("effort", [8]);
  m.set("egg", [0]);
  m.set("either", [2]);
  m.set("elder", [1]);
  m.set("elderly", [1]);
  m.set("election", [2]);
  m.set("electric", [4]);
  m.set("electricity", [2]);
  m.set("electronic", [4]);
  m.set("elegant", [4]);
  m.set("element", [0]);
  m.set("elephant", [2]);
  m.set("elevator", [6]);
  m.set("eliminate", [2]);
  m.set("else", [0]);
  m.set("elsewhere", [2]);
  m.set("email", [3]);
  m.set("embarrassed", [1]);
  m.set("emerge", [8]);
  m.set("emergency", [2]);
  m.set("emotion", [0]);
  m.set("empathy", [0]);
  m.set("emperor_empress", [0]);
  m.set("emphasis", [6]);
  m.set("employ", [4]);
  m.set("empty", [0]);
  m.set("enable", [0]);
  m.set("encounter", [2]);
  m.set("encourage", [3, 9]);
  m.set("end", [0]);
  m.set("endangered", [8]);
  m.set("enemy", [0]);
  m.set("energetic", [0]);
  m.set("energy", [4, 8]);
  m.set("engage", [1]);
  m.set("engine", [1]);
  m.set("engineer", [0]);
  m.set("english", [1]);
  m.set("enhance", [3]);
  m.set("enjoy", [1, 3, 6]);
  m.set("enormous", [3]);
  m.set("enough", [0]);
  m.set("ensure", [7]);
  m.set("enter", [0]);
  m.set("enterprise", [7]);
  m.set("entertainment", [1]);
  m.set("enthusiastic", [0]);
  m.set("entirely", [7]);
  m.set("entitle", [8]);
  m.set("entrance", [1]);
  m.set("entry", [2]);
  m.set("envelope", [3]);
  m.set("environment", [8]);
  m.set("envy", [3]);
  m.set("episode", [6]);
  m.set("equal", [1]);
  m.set("equator", [6]);
  m.set("equipment", [7]);
  m.set("era", [0]);
  m.set("eraser", [0]);
  m.set("error", [2]);
  m.set("erupt", [6]);
  m.set("escape", [3]);
  m.set("especially", [0]);
  m.set("essay", [1]);
  m.set("essential", [1]);
  m.set("establish", [0]);
  m.set("estate", [0]);
  m.set("estimate", [4]);
  m.set("ethical", [9]);
  m.set("ethnic", [0]);
  m.set("europe", [6]);
  m.set("evaluate", [4]);
  m.set("eve", [7]);
  m.set("even", [0]);
  m.set("evening", [2]);
  m.set("event", [0]);
  m.set("eventually", [0]);
  m.set("ever", [0]);
  m.set("every", [6]);
  m.set("everybody_everyone", [0]);
  m.set("everyday", [0]);
  m.set("everything", [0]);
  m.set("everywhere", [0]);
  m.set("evidence", [2]);
  m.set("evolve", [2]);
  m.set("exactly", [1]);
  m.set("exam", [2]);
  m.set("examine", [8]);
  m.set("example", [0]);
  m.set("exceed", [4]);
  m.set("excellent", [8]);
  m.set("except", [1]);
  m.set("exceptional", [3]);
  m.set("exchange", [0]);
  m.set("excited", [0]);
  m.set("exciting", [0]);
  m.set("excuse", [2]);
  m.set("exercise", [7]);
  m.set("exhaust", [4]);
  m.set("exhibition", [9]);
  m.set("exist", [2]);
  m.set("exit", [4]);
  m.set("expand", [1]);
  m.set("expansion", [0]);
  m.set("expect", [0]);
  m.set("expectation", [5]);
  m.set("expense", [4]);
  m.set("expensive", [4]);
  m.set("experience", [0, 1, 6, 7]);
  m.set("experiment", [2]);
  m.set("expert", [0]);
  m.set("explain", [0, 2, 5]);
  m.set("explode", [2]);
  m.set("explore", [0]);
  m.set("export", [3]);
  m.set("expose", [3]);
  m.set("exposure", [4]);
  m.set("express", [0]);
  m.set("extend", [5]);
  m.set("extension", [4]);
  m.set("extent", [7]);
  m.set("external", [7]);
  m.set("extinction", [1]);
  m.set("extra", [0]);
  m.set("extraordinary", [1]);
  m.set("extremely", [1]);
  m.set("eye", [0]);
  m.set("fable", [0]);
  m.set("fabric", [7]);
  m.set("face", [0]);
  m.set("facilitate", [0]);
  m.set("facility", [0]);
  m.set("fact", [0]);
  m.set("factor", [6]);
  m.set("factory", [0]);
  m.set("fail", [1]);
  m.set("failure", [4]);
  m.set("faint", [3]);
  m.set("fair", [6]);
  m.set("faith", [7]);
  m.set("fall", [0]);
  m.set("false", [7]);
  m.set("familiar", [0]);
  m.set("family", [1, 4, 6]);
  m.set("famous", [0]);
  m.set("fan", [0]);
  m.set("fancy", [4]);
  m.set("fantastic", [0]);
  m.set("fantasy", [2]);
  m.set("far", [0]);
  m.set("farm", [6]);
  m.set("farmer", [4]);
  m.set("fascinating", [6]);
  m.set("fashion", [6]);
  m.set("fast", [4]);
  m.set("fat", [2]);
  m.set("father", [1]);
  m.set("fault", [0]);
  m.set("favour", [3]);
  m.set("favourite", [0]);
  m.set("fear", [0]);
  m.set("feature", [0]);
  m.set("fee", [5]);
  m.set("feed", [0]);
  m.set("feel", [0]);
  m.set("feeling", [0]);
  m.set("fellow", [0]);
  m.set("female", [7]);
  m.set("fence", [1]);
  m.set("fertile", [8]);
  m.set("festival", [0]);
  m.set("fetch", [4]);
  m.set("fever", [1]);
  m.set("few", [0]);
  m.set("fibre", [4]);
  m.set("fiction", [3]);
  m.set("field", [6]);
  m.set("fight", [1]);
  m.set("figure", [0]);
  m.set("file", [0]);
  m.set("fill", [1]);
  m.set("film", [0]);
  m.set("final", [0]);
  m.set("finally", [0]);
  m.set("finance", [4]);
  m.set("financial", [0]);
  m.set("find", [0]);
  m.set("finding", [2]);
  m.set("fine", [0]);
  m.set("finger", [4]);
  m.set("finish", [0]);
  m.set("fire", [3]);
  m.set("fireman", [0]);
  m.set("firework", [7]);
  m.set("firm", [4]);
  m.set("fish", [0]);
  m.set("fisherman", [7]);
  m.set("fist", [3]);
  m.set("fit", [1]);
  m.set("fix", [0]);
  m.set("flag", [7]);
  m.set("flame", [8]);
  m.set("flash", [2]);
  m.set("flat", [2]);
  m.set("flavour", [0]);
  m.set("flexible", [7]);
  m.set("flight", [6]);
  m.set("float", [2]);
  m.set("flood", [2]);
  m.set("floor", [0]);
  m.set("flour", [4]);
  m.set("flow", [0]);
  m.set("flower", [0]);
  m.set("flu", [1]);
  m.set("fluent", [0]);
  m.set("fly", [1]);
  m.set("focus", [5, 9]);
  m.set("fog", [0]);
  m.set("fold", [7]);
  m.set("folk", [9]);
  m.set("follow", [0, 1, 2, 3]);
  m.set("fond", [7]);
  m.set("food", [4, 6]);
  m.set("fool", [0]);
  m.set("foot", [1]);
  m.set("football", [3]);
  m.set("for", [0]);
  m.set("force", [0]);
  m.set("forecast", [2]);
  m.set("forehead", [4]);
  m.set("foreign", [2]);
  m.set("forest", [8]);
  m.set("forever", [2]);
  m.set("forget", [0]);
  m.set("forgive", [0]);
  m.set("fork", [1]);
  m.set("form", [6]);
  m.set("formal", [0]);
  m.set("format", [3]);
  m.set("former", [7]);
  m.set("fortunately", [4]);
  m.set("fortune", [4]);
  m.set("forward", [3]);
  m.set("found", [0]);
  m.set("foundation", [0]);
  m.set("fountain", [0]);
  m.set("fox", [3]);
  m.set("frame", [4]);
  m.set("frank", [0]);
  m.set("free", [0]);
  m.set("freedom", [3]);
  m.set("freeze", [0]);
  m.set("frequency", [4]);
  m.set("frequently", [0]);
  m.set("fresh", [0]);
  m.set("friction", [8]);
  m.set("fridge", [0]);
  m.set("friend", [0, 1, 6]);
  m.set("friendly", [0]);
  m.set("friendship", [0]);
  m.set("frightened", [4]);
  m.set("frog", [4]);
  m.set("from", [0]);
  m.set("front", [0]);
  m.set("frontier", [6]);
  m.set("frost", [4]);
  m.set("fruit", [0]);
  m.set("fry", [0]);
  m.set("fuel", [4]);
  m.set("fulfil", [4]);
  m.set("full", [2]);
  m.set("fun", [0]);
  m.set("function", [8]);
  m.set("fund", [1]);
  m.set("fundamental", [3]);
  m.set("funny", [0]);
  m.set("furniture", [0]);
  m.set("further", [2]);
  m.set("furthermore", [6]);
  m.set("future", [5, 8]);
  m.set("gain", [1]);
  m.set("gallery", [9]);
  m.set("game", [3]);
  m.set("gap", [0]);
  m.set("garbage", [8]);
  m.set("garden", [1]);
  m.set("garlic", [1]);
  m.set("gas", [4]);
  m.set("gate", [5]);
  m.set("gather", [0]);
  m.set("gender", [1]);
  m.set("gene", [4]);
  m.set("general", [1]);
  m.set("generate", [8]);
  m.set("generation", [1]);
  m.set("generous", [7]);
  m.set("genius", [3]);
  m.set("gentle", [8]);
  m.set("gentleman", [7]);
  m.set("genuine", [7]);
  m.set("geography", [2]);
  m.set("geometry", [7]);
  m.set("gesture", [7]);
  m.set("get", [0]);
  m.set("giant", [0]);
  m.set("gift", [1]);
  m.set("gifted", [4]);
  m.set("giraffe", [8]);
  m.set("girl", [2]);
  m.set("give", [0]);
  m.set("glad", [4]);
  m.set("glance", [7]);
  m.set("glass", [0]);
  m.set("global", [2]);
  m.set("globe", [3]);
  m.set("glove", [0]);
  m.set("glue", [0]);
  m.set("go", [0]);
  m.set("goal", [1]);
  m.set("goat", [8]);
  m.set("god", [4]);
  m.set("gold", [0]);
  m.set("golf", [2]);
  m.set("good", [0]);
  m.set("goodbye", [0]);
  m.set("goods", [3]);
  m.set("government", [2]);
  m.set("grab", [2]);
  m.set("graceful", [4]);
  m.set("grade", [4]);
  m.set("gradually", [3]);
  m.set("graduate", [4]);
  m.set("grain", [6]);
  m.set("grammar", [3]);
  m.set("gramme", [0]);
  m.set("grand", [3]);
  m.set("granddaughter", [3]);
  m.set("grandfather", [0]);
  m.set("grandmother", [1]);
  m.set("grandparent", [1]);
  m.set("grandson", [0]);
  m.set("grape", [3]);
  m.set("grasp", [4]);
  m.set("grass", [2]);
  m.set("grateful", [7]);
  m.set("gratitude", [4]);
  m.set("gravity", [3]);
  m.set("great", [0]);
  m.set("greedy", [1]);
  m.set("green", [0]);
  m.set("greenhouse", [4]);
  m.set("greet", [7]);
  m.set("grey", [3]);
  m.set("grocery", [6]);
  m.set("ground", [5]);
  m.set("group", [0]);
  m.set("grow", [0, 1, 2, 4]);
  m.set("guarantee", [7]);
  m.set("guard", [0]);
  m.set("guess", [0]);
  m.set("guest", [3]);
  m.set("guidance", [4]);
  m.set("guide", [3]);
  m.set("guideline", [4]);
  m.set("guilty", [7]);
  m.set("guitar", [0]);
  m.set("gun", [0]);
  m.set("guy", [4]);
  m.set("gym", [0]);
  m.set("gymnastics", [0]);
  m.set("habit", [4]);
  m.set("habitat", [2]);
  m.set("hair", [0]);
  m.set("half", [0]);
  m.set("hall", [0]);
  m.set("ham", [0]);
  m.set("hamburger", [0]);
  m.set("hand", [0]);
  m.set("handbag", [0]);
  m.set("handkerchief", [6]);
  m.set("handle", [4]);
  m.set("handsome", [7]);
  m.set("handwriting", [0]);
  m.set("hang", [6]);
  m.set("happen", [0]);
  m.set("happy", [0]);
  m.set("hard", [0]);
  m.set("hardly", [3]);
  m.set("harm", [5]);
  m.set("harmful", [4]);
  m.set("harmonious", [1]);
  m.set("harmony", [5]);
  m.set("harvest", [5]);
  m.set("hat", [7]);
  m.set("hatch", [0]);
  m.set("hate", [7]);
  m.set("have", [0]);
  m.set("he", [0]);
  m.set("head", [0]);
  m.set("headache", [1]);
  m.set("headline", [2]);
  m.set("health", [4]);
  m.set("healthy", [0]);
  m.set("hear", [0]);
  m.set("heart", [0]);
  m.set("heat", [3]);
  m.set("heavy", [2]);
  m.set("height", [2]);
  m.set("helicopter", [2]);
  m.set("hello", [0]);
  m.set("help", [0]);
  m.set("helpful", [1]);
  m.set("hen", [0]);
  m.set("hence", [7]);
  m.set("her", [0]);
  m.set("herb", [0]);
  m.set("here", [0]);
  m.set("heritage", [2]);
  m.set("hero", [0]);
  m.set("hers", [0]);
  m.set("herself", [3]);
  m.set("hesitate", [4]);
  m.set("hi", [7]);
  m.set("hide", [1]);
  m.set("high", [0]);
  m.set("highlight", [3]);
  m.set("highway", [0]);
  m.set("hike", [4]);
  m.set("hill", [3]);
  m.set("him", [1]);
  m.set("himself", [1]);
  m.set("hire", [4]);
  m.set("his", [0]);
  m.set("historic", [0]);
  m.set("history", [3, 5, 9]);
  m.set("hit", [2]);
  m.set("hobby", [1]);
  m.set("hold", [0]);
  m.set("hole", [5]);
  m.set("holiday", [1]);
  m.set("home", [1, 6]);
  m.set("hometown", [7]);
  m.set("homework", [0]);
  m.set("honest", [1]);
  m.set("honey", [2]);
  m.set("honour", [0]);
  m.set("hope", [4]);
  m.set("horrible", [7]);
  m.set("horror", [3]);
  m.set("horse", [0]);
  m.set("hospital", [6]);
  m.set("host_hostess", [0]);
  m.set("hot", [0]);
  m.set("hotel", [0]);
  m.set("hour", [0]);
  m.set("house", [4]);
  m.set("household", [3]);
  m.set("housework", [4]);
  m.set("housing", [0]);
  m.set("how", [0]);
  m.set("however", [0]);
  m.set("hug", [7]);
  m.set("huge", [0]);
  m.set("human", [2, 4, 8]);
  m.set("humanity", [3]);
  m.set("humble", [0]);
  m.set("humour", [0]);
  m.set("humourous", [0]);
  m.set("hungry", [4]);
  m.set("hunt", [0]);
  m.set("hurricane", [2]);
  m.set("hurry", [0]);
  m.set("hurt", [2]);
  m.set("husband", [1]);
  m.set("hybrid", [4]);
  m.set("hydrogen", [4]);
  m.set("i", [0]);
  m.set("ice", [0]);
  m.set("idea", [1, 2, 3, 5]);
  m.set("ideal", [2]);
  m.set("identical", [4]);
  m.set("identify", [5]);
  m.set("identity", [0]);
  m.set("idiom", [7]);
  m.set("if", [0]);
  m.set("ignore", [4]);
  m.set("ill", [4]);
  m.set("illegal", [7]);
  m.set("illness", [6]);
  m.set("illustrate", [2]);
  m.set("image", [3]);
  m.set("imagine", [0]);
  m.set("immediately", [4]);
  m.set("impact", [1]);
  m.set("imply", [0]);
  m.set("import", [0]);
  m.set("important", [8]);
  m.set("impossible", [2]);
  m.set("impress", [4]);
  m.set("impression", [0]);
  m.set("improve", [0]);
  m.set("in", [0]);
  m.set("inch", [4]);
  m.set("incident", [4]);
  m.set("include", [0]);
  m.set("income", [4]);
  m.set("increase", [5]);
  m.set("incredible", [7]);
  m.set("indeed", [0]);
  m.set("independent", [2]);
  m.set("indicate", [6]);
  m.set("individual", [0]);
  m.set("industry", [7]);
  m.set("infection", [4]);
  m.set("infer", [4]);
  m.set("influence", [0]);
  m.set("influential", [1]);
  m.set("information", [3]);
  m.set("ingredient", [0]);
  m.set("initial", [4]);
  m.set("initiative", [3]);
  m.set("injury", [4]);
  m.set("ink", [9]);
  m.set("inner", [7]);
  m.set("innocent", [7]);
  m.set("innovation", [6]);
  m.set("input", [4]);
  m.set("inquire", [0]);
  m.set("insect", [1]);
  m.set("inside", [1]);
  m.set("insight", [1]);
  m.set("insist", [4]);
  m.set("inspection", [8]);
  m.set("inspire", [9]);
  m.set("instance", [7]);
  m.set("instant", [0]);
  m.set("instead", [0]);
  m.set("institute", [3]);
  m.set("institution", [0]);
  m.set("instruction", [2]);
  m.set("instrument", [2]);
  m.set("insurance", [7]);
  m.set("integrate", [4]);
  m.set("integrity", [7]);
  m.set("intellectual", [7]);
  m.set("intelligent", [2]);
  m.set("intend", [1]);
  m.set("intense", [5]);
  m.set("intention", [1]);
  m.set("interaction", [9]);
  m.set("interest", [0, 1, 3, 6]);
  m.set("interesting", [0]);
  m.set("internal", [4]);
  m.set("international", [5]);
  m.set("internet", [5]);
  m.set("interpret", [2]);
  m.set("interrupt", [0]);
  m.set("intervention", [2]);
  m.set("interview", [7]);
  m.set("into", [0]);
  m.set("introduce", [0]);
  m.set("introduction", [2]);
  m.set("invent", [2]);
  m.set("invention", [2]);
  m.set("invest", [1]);
  m.set("investigate", [4]);
  m.set("investment", [1]);
  m.set("invite", [1]);
  m.set("involve", [0]);
  m.set("iron", [4]);
  m.set("irrigation", [4]);
  m.set("island", [0]);
  m.set("issue", [0]);
  m.set("it", [0]);
  m.set("item", [4]);
  m.set("its", [0]);
  m.set("itself", [0]);
  m.set("jacket", [4]);
  m.set("jam", [0]);
  m.set("jaw", [0]);
  m.set("jazz", [0]);
  m.set("jeans", [7]);
  m.set("job", [7]);
  m.set("jog", [0]);
  m.set("join", [0]);
  m.set("joint", [2]);
  m.set("joke", [0]);
  m.set("journal", [5]);
  m.set("journalist", [1]);
  m.set("journey", [6]);
  m.set("joy", [9]);
  m.set("judge", [1]);
  m.set("juice", [1]);
  m.set("jump", [3]);
  m.set("jungle", [2]);
  m.set("junior", [3]);
  m.set("just", [0]);
  m.set("justice", [7]);
  m.set("justify", [0]);
  m.set("kangaroo", [0]);
  m.set("keen", [0]);
  m.set("keep", [0]);
  m.set("kettle", [0]);
  m.set("key", [0]);
  m.set("keyboard", [0]);
  m.set("kick", [0]);
  m.set("kid", [0, 1]);
  m.set("kill", [0]);
  m.set("kilo", [1]);
  m.set("kilometre", [0]);
  m.set("kind", [2]);
  m.set("kindergarten", [2]);
  m.set("king", [2]);
  m.set("kingdom", [4]);
  m.set("kiss", [7]);
  m.set("kit", [4]);
  m.set("kitchen", [3]);
  m.set("kite", [8]);
  m.set("knee", [7]);
  m.set("knife", [7]);
  m.set("knock", [7]);
  m.set("know", [0]);
  m.set("knowledge", [7]);
  m.set("kung", [3]);
  m.set("kung_fu", [0]);
  m.set("lab", [3]);
  m.set("label", [4]);
  m.set("labour", [3]);
  m.set("lack", [2]);
  m.set("lady", [1]);
  m.set("lake", [1]);
  m.set("lamb", [4]);
  m.set("lamp", [0]);
  m.set("land", [0]);
  m.set("landscape", [3]);
  m.set("language", [3]);
  m.set("lantern", [0]);
  m.set("lap", [7]);
  m.set("laptop", [4]);
  m.set("large", [8]);
  m.set("last", [6]);
  m.set("late", [0]);
  m.set("later", [6]);
  m.set("laugh", [0]);
  m.set("launch", [3]);
  m.set("law", [1]);
  m.set("lawyer", [0]);
  m.set("lay", [7]);
  m.set("lazy", [4]);
  m.set("lead", [0]);
  m.set("leader", [1]);
  m.set("leadership", [0]);
  m.set("leaf", [4]);
  m.set("league", [0]);
  m.set("leak", [4]);
  m.set("lean", [0]);
  m.set("leap", [4]);
  m.set("learn", [0]);
  m.set("least", [0]);
  m.set("leather", [0]);
  m.set("leave", [0]);
  m.set("lecture", [7]);
  m.set("left", [0]);
  m.set("leg", [0]);
  m.set("legal", [7]);
  m.set("legend", [1]);
  m.set("leisure", [4]);
  m.set("lemon", [0]);
  m.set("lend", [3]);
  m.set("length", [5]);
  m.set("less", [0]);
  m.set("lesson", [2]);
  m.set("let", [0]);
  m.set("letter", [0]);
  m.set("level", [2, 4]);
  m.set("liberation", [3]);
  m.set("liberty", [1]);
  m.set("librarian", [2]);
  m.set("library", [3]);
  m.set("license", [0]);
  m.set("lie", [2]);
  m.set("life", [0]);
  m.set("lifestyle", [0]);
  m.set("lift", [3]);
  m.set("light", [0]);
  m.set("lightning", [2]);
  m.set("like", [1]);
  m.set("likely", [0]);
  m.set("limit", [2]);
  m.set("limited", [0]);
  m.set("line", [6]);
  m.set("link", [0]);
  m.set("lion", [1]);
  m.set("lip", [9]);
  m.set("liquid", [4]);
  m.set("list", [0]);
  m.set("listen", [0]);
  m.set("literally", [2]);
  m.set("literary", [2]);
  m.set("literature", [0]);
  m.set("litter", [1]);
  m.set("little", [0]);
  m.set("live", [0, 1, 2, 5]);
  m.set("lively", [4]);
  m.set("livestock", [0]);
  m.set("living", [0]);
  m.set("load", [0]);
  m.set("loan", [4]);
  m.set("local", [4, 8]);
  m.set("location", [0]);
  m.set("lock", [0]);
  m.set("log", [3]);
  m.set("logical", [4]);
  m.set("lonely", [4]);
  m.set("long", [6]);
  m.set("look", [0]);
  m.set("loose", [2]);
  m.set("lose", [6]);
  m.set("loss", [0]);
  m.set("lost", [5]);
  m.set("lot", [4]);
  m.set("loud", [4]);
  m.set("love", [1, 3, 6]);
  m.set("lovely", [0]);
  m.set("low", [4]);
  m.set("lower", [2]);
  m.set("loyal", [4]);
  m.set("luck", [1]);
  m.set("lucky", [3]);
  m.set("lunar", [2]);
  m.set("lunch", [3]);
  m.set("lung", [0]);
  m.set("luxury", [4]);
  m.set("machine", [5]);
  m.set("mad", [0]);
  m.set("madam", [7]);
  m.set("magazine", [0]);
  m.set("magic", [0]);
  m.set("magnificent", [7]);
  m.set("mail", [9]);
  m.set("main", [0]);
  m.set("maintain", [0]);
  m.set("major", [0]);
  m.set("majority", [2]);
  m.set("make", [0]);
  m.set("male", [2]);
  m.set("mall", [0]);
  m.set("man", [0]);
  m.set("manage", [0]);
  m.set("manager", [7]);
  m.set("mankind", [1]);
  m.set("manner", [4]);
  m.set("many", [0]);
  m.set("map", [0]);
  m.set("marathon", [4]);
  m.set("march", [5]);
  m.set("marine", [3]);
  m.set("mark", [0]);
  m.set("market", [7]);
  m.set("marriage", [8]);
  m.set("marry", [2]);
  m.set("mass", [2]);
  m.set("massive", [4]);
  m.set("master", [7]);
  m.set("match", [0]);
  m.set("material", [0]);
  m.set("maths", [0]);
  m.set("matter", [0]);
  m.set("mature", [2]);
  m.set("maximum", [7]);
  m.set("may", [0]);
  m.set("maybe", [0]);
  m.set("me", [0]);
  m.set("meal", [4]);
  m.set("mean", [0]);
  m.set("meaning", [0]);
  m.set("means", [0]);
  m.set("meanwhile", [2]);
  m.set("measure", [2]);
  m.set("meat", [0]);
  m.set("mechanic", [7]);
  m.set("medal", [7]);
  m.set("medical", [2]);
  m.set("medicine", [4]);
  m.set("medium", [1]);
  m.set("meet", [1, 3, 4, 6]);
  m.set("meeting", [1]);
  m.set("member", [0]);
  m.set("membership", [0]);
  m.set("memorial", [8]);
  m.set("memory", [0]);
  m.set("mental", [0]);
  m.set("mention", [2]);
  m.set("menu", [4]);
  m.set("mercy", [7]);
  m.set("merely", [4]);
  m.set("merry", [0]);
  m.set("mess", [0]);
  m.set("message", [1]);
  m.set("metal", [4]);
  m.set("metaphor", [6]);
  m.set("method", [0]);
  m.set("metre", [1]);
  m.set("microscope", [5]);
  m.set("middle", [1]);
  m.set("midnight", [7]);
  m.set("might", [0]);
  m.set("migration", [1]);
  m.set("mild", [4]);
  m.set("mile", [6]);
  m.set("military", [7]);
  m.set("milk", [0]);
  m.set("millimetre", [6]);
  m.set("million", [0]);
  m.set("mind", [0]);
  m.set("mine", [9]);
  m.set("mineral", [4]);
  m.set("minimum", [4]);
  m.set("minister", [0]);
  m.set("minor", [3]);
  m.set("minority", [1]);
  m.set("minute", [1]);
  m.set("miracle", [1]);
  m.set("mirror", [0]);
  m.set("miss", [5]);
  m.set("missile", [6]);
  m.set("missing", [5]);
  m.set("mission", [2]);
  m.set("mist", [0]);
  m.set("mistake", [3]);
  m.set("mix", [0]);
  m.set("mixture", [9]);
  m.set("mobile", [0]);
  m.set("mode", [0]);
  m.set("model", [0]);
  m.set("modern", [8]);
  m.set("modernization", [0]);
  m.set("modest", [7]);
  m.set("modify", [0]);
  m.set("moment", [0]);
  m.set("money", [7]);
  m.set("monitor", [3]);
  m.set("monkey", [2]);
  m.set("month", [0]);
  m.set("monthly", [7]);
  m.set("monument", [0]);
  m.set("mood", [4]);
  m.set("moon", [2]);
  m.set("moral", [0]);
  m.set("more", [0]);
  m.set("moreover", [0]);
  m.set("morning", [0]);
  m.set("mosquito", [4]);
  m.set("most", [0]);
  m.set("mostly", [0]);
  m.set("mother", [1]);
  m.set("motion", [7]);
  m.set("motivate", [1]);
  m.set("motive", [7]);
  m.set("motor", [8]);
  m.set("mount", [6]);
  m.set("mountain", [0]);
  m.set("mouse", [2]);
  m.set("mouth", [2]);
  m.set("move", [1, 6]);
  m.set("movement", [1]);
  m.set("movie", [0]);
  m.set("mr", [7]);
  m.set("mrs", [6]);
  m.set("ms", [0]);
  m.set("much", [0]);
  m.set("mud", [4]);
  m.set("multiple", [0]);
  m.set("murder", [7]);
  m.set("muscle", [4]);
  m.set("museum", [9]);
  m.set("mushroom", [4]);
  m.set("music", [9]);
  m.set("musician", [3]);
  m.set("must", [1]);
  m.set("mutton", [4]);
  m.set("mutual", [1]);
  m.set("my", [0]);
  m.set("myself", [0]);
  m.set("mystery", [3]);
  m.set("myth", [1]);
  m.set("nail", [1]);
  m.set("name", [0]);
  m.set("narrow", [1]);
  m.set("nation", [1]);
  m.set("national", [0]);
  m.set("nationality", [4]);
  m.set("native", [2]);
  m.set("natural", [8]);
  m.set("nature", [0]);
  m.set("navy", [7]);
  m.set("near", [0]);
  m.set("nearby", [1]);
  m.set("nearly", [3]);
  m.set("neat", [2]);
  m.set("necessary", [2]);
  m.set("neck", [4]);
  m.set("need", [0]);
  m.set("needle", [4]);
  m.set("negative", [4]);
  m.set("negotiate", [0]);
  m.set("neighbour", [1]);
  m.set("neighbourhood", [0]);
  m.set("neither", [3]);
  m.set("nephew", [4]);
  m.set("nervous", [0]);
  m.set("nest", [6]);
  m.set("net", [0]);
  m.set("network", [1]);
  m.set("neutral", [4]);
  m.set("never", [1]);
  m.set("nevertheless", [3]);
  m.set("new", [0]);
  m.set("news", [0]);
  m.set("newspaper", [1]);
  m.set("next", [6]);
  m.set("nice", [4]);
  m.set("niece", [4]);
  m.set("night", [0]);
  m.set("no", [0]);
  m.set("noble", [4]);
  m.set("nobody", [2]);
  m.set("nod", [4]);
  m.set("noise", [8]);
  m.set("noisy", [0]);
  m.set("none", [2]);
  m.set("noodle", [4]);
  m.set("noon", [7]);
  m.set("nor", [2]);
  m.set("normal", [3]);
  m.set("north", [4]);
  m.set("northern", [1]);
  m.set("nose", [7]);
  m.set("not", [0]);
  m.set("note", [0]);
  m.set("notebook", [4]);
  m.set("nothing", [0]);
  m.set("notice", [0]);
  m.set("novel", [0]);
  m.set("novelist", [7]);
  m.set("now", [0]);
  m.set("nowadays", [0]);
  m.set("nowhere", [4]);
  m.set("nuclear", [6]);
  m.set("number", [0]);
  m.set("numerous", [4]);
  m.set("nurse", [0]);
  m.set("nut", [0]);
  m.set("nutrition", [4]);
  m.set("o_clock", [0]);
  m.set("obey", [2]);
  m.set("object", [2]);
  m.set("objective", [1]);
  m.set("observe", [2]);
  m.set("obstacle", [4]);
  m.set("obtain", [5]);
  m.set("obviously", [9]);
  m.set("occasion", [3]);
  m.set("occupation", [4]);
  m.set("occupy", [4]);
  m.set("occur", [2]);
  m.set("ocean", [8]);
  m.set("odd", [1]);
  m.set("of", [0]);
  m.set("off", [0]);
  m.set("offend", [0]);
  m.set("offer", [0, 1, 3, 4, 6, 9]);
  m.set("office", [7]);
  m.set("officer", [0]);
  m.set("official", [2]);
  m.set("often", [0]);
  m.set("oil", [4]);
  m.set("ok", [0]);
  m.set("old", [0]);
  m.set("olympic", [0]);
  m.set("on", [0]);
  m.set("once", [0]);
  m.set("onion", [4]);
  m.set("online", [0]);
  m.set("only", [0]);
  m.set("onto", [0]);
  m.set("open", [0]);
  m.set("opera", [0]);
  m.set("operate", [4]);
  m.set("operation", [7]);
  m.set("operator", [4]);
  m.set("opinion", [0]);
  m.set("opponent", [0]);
  m.set("opportunity", [0]);
  m.set("oppose", [8]);
  m.set("opposite", [0]);
  m.set("optimistic", [4]);
  m.set("option", [1]);
  m.set("or", [0]);
  m.set("orange", [4]);
  m.set("orbit", [4]);
  m.set("orchestra", [9]);
  m.set("order", [0]);
  m.set("ordinary", [6]);
  m.set("organ", [2]);
  m.set("organic", [2]);
  m.set("organisation", [7]);
  m.set("organise", [7]);
  m.set("origin", [1]);
  m.set("original", [0]);
  m.set("other", [0]);
  m.set("otherwise", [2]);
  m.set("ought", [1]);
  m.set("our", [1]);
  m.set("ours", [7]);
  m.set("ourselves", [0]);
  m.set("out", [0]);
  m.set("outcome", [0]);
  m.set("outgoing", [4]);
  m.set("outline", [1]);
  m.set("output", [0]);
  m.set("outside", [1]);
  m.set("outstanding", [0]);
  m.set("oven", [4]);
  m.set("over", [6]);
  m.set("overall", [0]);
  m.set("overcome", [1]);
  m.set("overseas", [3]);
  m.set("owe", [7]);
  m.set("own", [0]);
  m.set("oxygen", [2]);
  m.set("p_m_", [0]);
  m.set("pace", [6]);
  m.set("pacific", [2]);
  m.set("pack", [0]);
  m.set("package", [4]);
  m.set("packet", [4]);
  m.set("page", [3]);
  m.set("pagoda", [8]);
  m.set("pain", [0]);
  m.set("paint", [9]);
  m.set("pair", [0]);
  m.set("palace", [7]);
  m.set("pale", [3]);
  m.set("pan", [3]);
  m.set("pancake", [4]);
  m.set("panda", [0]);
  m.set("panel", [5]);
  m.set("panic", [4]);
  m.set("pants", [6]);
  m.set("paper", [0]);
  m.set("paragraph", [0]);
  m.set("parcel", [0]);
  m.set("pardon", [0]);
  m.set("parent", [0, 1]);
  m.set("park", [0]);
  m.set("parking", [0]);
  m.set("part", [6]);
  m.set("participate", [2]);
  m.set("particular", [0]);
  m.set("partner", [3]);
  m.set("party", [1]);
  m.set("pass", [0]);
  m.set("passage", [0]);
  m.set("passenger", [6]);
  m.set("passion", [0]);
  m.set("passive", [1]);
  m.set("passport", [0]);
  m.set("past", [8]);
  m.set("patent", [5]);
  m.set("path", [0]);
  m.set("patience", [8]);
  m.set("patient", [1]);
  m.set("patriotism", [7]);
  m.set("pattern", [0]);
  m.set("pay", [7]);
  m.set("pe", [0]);
  m.set("peace", [0]);
  m.set("peak", [3]);
  m.set("pear", [0]);
  m.set("pen", [3]);
  m.set("pencil", [2]);
  m.set("penguin", [2]);
  m.set("people", [0]);
  m.set("pepper", [4]);
  m.set("per", [0]);
  m.set("perceive", [3]);
  m.set("percentage", [0]);
  m.set("perfect", [1]);
  m.set("perform", [0]);
  m.set("performance", [0]);
  m.set("perhaps", [8]);
  m.set("period", [5]);
  m.set("permanent", [3]);
  m.set("permit", [0]);
  m.set("person", [0]);
  m.set("personal", [0]);
  m.set("personality", [0]);
  m.set("perspective", [4]);
  m.set("persuade", [1]);
  m.set("pessimistic", [0]);
  m.set("pet", [7]);
  m.set("petrol", [0]);
  m.set("phase", [4]);
  m.set("phenomenon", [1]);
  m.set("philosophy", [0]);
  m.set("phone", [1]);
  m.set("photo", [1]);
  m.set("photographer", [6]);
  m.set("phrase", [2]);
  m.set("physician", [0]);
  m.set("physics", [7]);
  m.set("piano", [0]);
  m.set("pick", [0]);
  m.set("picnic", [4]);
  m.set("picture", [1]);
  m.set("pie", [4]);
  m.set("piece", [9]);
  m.set("pig", [1]);
  m.set("pile", [7]);
  m.set("pill", [7]);
  m.set("pilot", [3]);
  m.set("ping_pong", [0]);
  m.set("pink", [3]);
  m.set("pioneer", [6]);
  m.set("pipe", [4]);
  m.set("pity", [7]);
  m.set("pizza", [0]);
  m.set("place", [0]);
  m.set("plain", [3]);
  m.set("plan", [4]);
  m.set("plane", [4]);
  m.set("planet", [4]);
  m.set("plant", [8]);
  m.set("plastic", [0]);
  m.set("plate", [6]);
  m.set("platform", [4]);
  m.set("play", [0]);
  m.set("player", [0]);
  m.set("playground", [0]);
  m.set("pleasant", [3]);
  m.set("please", [7]);
  m.set("pleasure", [7]);
  m.set("plenty", [1]);
  m.set("plot", [0]);
  m.set("plug", [4]);
  m.set("plus", [7]);
  m.set("pocket", [4]);
  m.set("poem", [3]);
  m.set("poet", [0]);
  m.set("poetry", [0]);
  m.set("point", [0]);
  m.set("poison", [2]);
  m.set("polar", [8]);
  m.set("pole", [0]);
  m.set("police", [1]);
  m.set("policeman_policewoman", [0]);
  m.set("policy", [3]);
  m.set("polish", [6]);
  m.set("polite", [0]);
  m.set("political", [9]);
  m.set("politician", [3]);
  m.set("politics", [4]);
  m.set("pollute", [4]);
  m.set("pollution", [2]);
  m.set("pond", [8]);
  m.set("pool", [4]);
  m.set("poor", [0]);
  m.set("popular", [1]);
  m.set("population", [0]);
  m.set("pork", [4]);
  m.set("porridge", [8]);
  m.set("port", [0]);
  m.set("portrait", [0]);
  m.set("pose", [6]);
  m.set("position", [5]);
  m.set("positive", [8]);
  m.set("possession", [1]);
  m.set("possible", [6]);
  m.set("post", [0]);
  m.set("postcard", [4]);
  m.set("poster", [0]);
  m.set("postman", [7]);
  m.set("postpone", [7]);
  m.set("pot", [0]);
  m.set("potato", [8]);
  m.set("potential", [2]);
  m.set("pound", [4]);
  m.set("pour", [3]);
  m.set("poverty", [4]);
  m.set("power", [5]);
  m.set("practical", [4]);
  m.set("practise", [0]);
  m.set("praise", [0]);
  m.set("pray", [4]);
  m.set("precious", [7]);
  m.set("precisely", [2]);
  m.set("predict", [2]);
  m.set("prefer", [0]);
  m.set("preference", [2]);
  m.set("prejudice", [1]);
  m.set("premier", [0]);
  m.set("prepare", [0]);
  m.set("present", [9]);
  m.set("presentation", [3]);
  m.set("preserve", [8]);
  m.set("president", [1]);
  m.set("press", [4]);
  m.set("pressure", [2]);
  m.set("pretend", [7]);
  m.set("pretty", [0]);
  m.set("prevent", [1]);
  m.set("previous", [9]);
  m.set("price", [7]);
  m.set("pride", [1]);
  m.set("primary", [0]);
  m.set("primitive", [6]);
  m.set("prince_princess", [0]);
  m.set("principal", [1]);
  m.set("principle", [7]);
  m.set("print", [3]);
  m.set("prior", [4]);
  m.set("priority", [1]);
  m.set("prison", [2]);
  m.set("private", [2]);
  m.set("prize", [7]);
  m.set("probably", [0]);
  m.set("problem", [0, 2, 5]);
  m.set("procedure", [4]);
  m.set("proceed", [9]);
  m.set("process", [0]);
  m.set("produce", [5]);
  m.set("product", [6]);
  m.set("profession", [7]);
  m.set("professional", [0]);
  m.set("professor", [0]);
  m.set("profile", [4]);
  m.set("profit", [1]);
  m.set("programme", [7]);
  m.set("progress", [2]);
  m.set("prohibit", [4]);
  m.set("project", [0]);
  m.set("promise", [1]);
  m.set("promote", [3]);
  m.set("pronounce", [0]);
  m.set("pronunciation", [0]);
  m.set("proof", [8]);
  m.set("proper", [5]);
  m.set("property", [4]);
  m.set("proportion", [8]);
  m.set("proposal", [8]);
  m.set("prospect", [3]);
  m.set("prosperity", [1]);
  m.set("protect", [8]);
  m.set("protein", [1]);
  m.set("protest", [9]);
  m.set("proud", [0]);
  m.set("prove", [8]);
  m.set("provide", [0]);
  m.set("province", [0]);
  m.set("psychology", [0]);
  m.set("pub", [7]);
  m.set("public", [9]);
  m.set("publish", [3]);
  m.set("pudding", [0]);
  m.set("pull", [0]);
  m.set("punish", [7]);
  m.set("purchase", [4]);
  m.set("pure", [0]);
  m.set("purple", [8]);
  m.set("purpose", [2]);
  m.set("purse", [4]);
  m.set("pursue", [4]);
  m.set("push", [0]);
  m.set("put", [0]);
  m.set("puzzle", [7]);
  m.set("pyramid", [6]);
  m.set("qualification", [4]);
  m.set("qualify", [7]);
  m.set("quality", [0]);
  m.set("quantity", [4]);
  m.set("quarter", [2]);
  m.set("queen", [0]);
  m.set("question", [0]);
  m.set("quick", [0]);
  m.set("quiet", [0]);
  m.set("quit", [6]);
  m.set("quite", [1]);
  m.set("quote", [2]);
  m.set("rabbit", [5]);
  m.set("race", [0]);
  m.set("racial", [1]);
  m.set("radiation", [4]);
  m.set("radio", [2]);
  m.set("radium", [5]);
  m.set("railway", [0]);
  m.set("rain", [0]);
  m.set("rainbow", [0]);
  m.set("rainy", [0]);
  m.set("raise", [2]);
  m.set("random", [1]);
  m.set("range", [0]);
  m.set("rank", [0]);
  m.set("rapid", [2]);
  m.set("rare", [5]);
  m.set("rate", [1]);
  m.set("rather", [0]);
  m.set("rating", [4]);
  m.set("raw", [4]);
  m.set("ray", [4]);
  m.set("reach", [0]);
  m.set("react", [4]);
  m.set("reaction", [5]);
  m.set("read", [3, 9]);
  m.set("ready", [0]);
  m.set("real", [1]);
  m.set("realise", [0]);
  m.set("realistic", [4]);
  m.set("reality", [0]);
  m.set("really", [1]);
  m.set("reason", [0]);
  m.set("recall", [0]);
  m.set("receipt", [4]);
  m.set("receive", [0]);
  m.set("recent", [6]);
  m.set("recently", [3]);
  m.set("receptionist", [7]);
  m.set("recipe", [4]);
  m.set("recite", [9]);
  m.set("recognise", [0]);
  m.set("recognition", [2]);
  m.set("recommend", [3]);
  m.set("record", [0]);
  m.set("recording", [0]);
  m.set("recover", [2]);
  m.set("recreation", [4]);
  m.set("recycle", [8]);
  m.set("red", [0]);
  m.set("reduce", [8]);
  m.set("refer", [2]);
  m.set("reference", [3]);
  m.set("reflect", [2]);
  m.set("reform", [7]);
  m.set("refresh", [8]);
  m.set("refuse", [1]);
  m.set("regard", [0]);
  m.set("regardless", [1]);
  m.set("region", [0]);
  m.set("register", [7]);
  m.set("regret", [6]);
  m.set("regular", [1]);
  m.set("reinforce", [4]);
  m.set("reject", [8]);
  m.set("rejuvenate", [0]);
  m.set("relate", [0]);
  m.set("relationship", [3]);
  m.set("relative", [1]);
  m.set("relax", [0]);
  m.set("relay", [0]);
  m.set("release", [1]);
  m.set("relevant", [4]);
  m.set("reliable", [3]);
  m.set("relief", [0]);
  m.set("relieve", [1]);
  m.set("religion", [0]);
  m.set("rely", [4]);
  m.set("remain", [0]);
  m.set("remarkable", [7]);
  m.set("remember", [3]);
  m.set("remind", [0]);
  m.set("remote", [1]);
  m.set("remove", [5]);
  m.set("rent", [4]);
  m.set("repair", [0]);
  m.set("repeat", [0]);
  m.set("replace", [8]);
  m.set("reply", [5]);
  m.set("report", [0]);
  m.set("represent", [0]);
  m.set("representative", [3]);
  m.set("republic", [2]);
  m.set("reputation", [8]);
  m.set("request", [0]);
  m.set("require", [2, 5, 7]);
  m.set("rescue", [3]);
  m.set("research", [2, 4, 8]);
  m.set("reserve", [2]);
  m.set("resident", [2]);
  m.set("resign", [5]);
  m.set("resistance", [0]);
  m.set("resolution", [1]);
  m.set("resolve", [1]);
  m.set("resource", [1]);
  m.set("respect", [0]);
  m.set("respective", [7]);
  m.set("respond", [2]);
  m.set("response", [4]);
  m.set("responsibility", [3]);
  m.set("responsible", [1]);
  m.set("rest", [0]);
  m.set("restaurant", [4]);
  m.set("restore", [7]);
  m.set("restrict", [4]);
  m.set("result", [2]);
  m.set("retire", [7]);
  m.set("return", [0]);
  m.set("reveal", [2]);
  m.set("review", [2]);
  m.set("revise", [0]);
  m.set("revolution", [0]);
  m.set("reward", [1]);
  m.set("rhyme", [3]);
  m.set("rhythm", [6]);
  m.set("rice", [0]);
  m.set("rich", [6]);
  m.set("riddle", [0]);
  m.set("ride", [6]);
  m.set("right", [0]);
  m.set("rigid", [0]);
  m.set("ring", [3]);
  m.set("ripe", [6]);
  m.set("rise", [5]);
  m.set("risk", [0]);
  m.set("rival", [0]);
  m.set("river", [0]);
  m.set("road", [0]);
  m.set("roast", [0]);
  m.set("robot", [2]);
  m.set("rock", [5]);
  m.set("rocket", [2]);
  m.set("role", [0]);
  m.set("roll", [1]);
  m.set("romantic", [7]);
  m.set("roof", [2]);
  m.set("room", [1]);
  m.set("root", [8]);
  m.set("rope", [8]);
  m.set("rose", [0]);
  m.set("rough", [7]);
  m.set("round", [0]);
  m.set("route", [6]);
  m.set("routine", [1]);
  m.set("row", [4]);
  m.set("royal", [7]);
  m.set("rubber", [0]);
  m.set("rubbish", [7]);
  m.set("rude", [9]);
  m.set("rugby", [7]);
  m.set("ruin", [6]);
  m.set("rule", [0]);
  m.set("ruler", [1]);
  m.set("run", [6]);
  m.set("rural", [5]);
  m.set("rush", [0]);
  m.set("sacrifice", [7]);
  m.set("sad", [0]);
  m.set("safe", [0]);
  m.set("safety", [6]);
  m.set("sail", [0]);
  m.set("salad", [0]);
  m.set("salary", [7]);
  m.set("sale", [8]);
  m.set("salesman_saleswoman", [7]);
  m.set("salt", [4]);
  m.set("salty", [4]);
  m.set("same", [0]);
  m.set("sample", [2]);
  m.set("sand", [0]);
  m.set("sandwich", [4]);
  m.set("satellite", [2]);
  m.set("satisfaction", [3]);
  m.set("satisfy", [0]);
  m.set("sauce", [4]);
  m.set("saucer", [4]);
  m.set("sausage", [4]);
  m.set("save", [0]);
  m.set("saving", [1]);
  m.set("say", [0]);
  m.set("saying", [0]);
  m.set("scale", [8]);
  m.set("scan", [4]);
  m.set("scare", [8]);
  m.set("scarf", [0]);
  m.set("scene", [0]);
  m.set("schedule", [1]);
  m.set("scholarship", [4]);
  m.set("school", [0, 4, 9]);
  m.set("schoolbag", [0]);
  m.set("science", [0]);
  m.set("scientific", [2]);
  m.set("scientist", [2]);
  m.set("scissors", [6]);
  m.set("score", [1]);
  m.set("scream", [4]);
  m.set("screen", [5]);
  m.set("sculpture", [0]);
  m.set("sea", [0]);
  m.set("search", [2]);
  m.set("season", [6]);
  m.set("seat", [0]);
  m.set("secondary", [2]);
  m.set("secret", [0]);
  m.set("secretary", [0]);
  m.set("section", [7]);
  m.set("secure", [4]);
  m.set("security", [5]);
  m.set("see", [0]);
  m.set("seed", [8]);
  m.set("seek", [6]);
  m.set("seem", [3]);
  m.set("seize", [1]);
  m.set("seldom", [0]);
  m.set("select", [0]);
  m.set("selfish", [2]);
  m.set("sell", [7]);
  m.set("semester", [0]);
  m.set("send", [0]);
  m.set("senior", [0]);
  m.set("sense", [0]);
  m.set("sensitive", [4]);
  m.set("sentence", [0]);
  m.set("separate", [5]);
  m.set("series", [0]);
  m.set("serious", [1]);
  m.set("servant", [6]);
  m.set("serve", [8]);
  m.set("service", [5, 6]);
  m.set("session", [2]);
  m.set("set", [0]);
  m.set("setting", [0]);
  m.set("settle", [0]);
  m.set("several", [6]);
  m.set("severe", [2]);
  m.set("sew", [7]);
  m.set("sex", [7]);
  m.set("shade", [6]);
  m.set("shadow", [4]);
  m.set("shake", [4]);
  m.set("shall", [3]);
  m.set("shallow", [6]);
  m.set("shame", [0]);
  m.set("shape", [2]);
  m.set("share", [2, 3, 5, 8]);
  m.set("shark", [0]);
  m.set("sharp", [4]);
  m.set("shave", [7]);
  m.set("she", [4]);
  m.set("sheep", [7]);
  m.set("sheet", [7]);
  m.set("shelf", [0]);
  m.set("shell", [2]);
  m.set("shelter", [2]);
  m.set("shift", [0]);
  m.set("shine", [3]);
  m.set("ship", [0]);
  m.set("shirt", [1]);
  m.set("shock", [0]);
  m.set("shoe", [0]);
  m.set("shoot", [0]);
  m.set("shop", [0]);
  m.set("shore", [3]);
  m.set("short", [3]);
  m.set("shortage", [1]);
  m.set("shorts", [6]);
  m.set("should", [0]);
  m.set("shoulder", [9]);
  m.set("shout", [0]);
  m.set("show", [0]);
  m.set("shower", [0]);
  m.set("shut", [1]);
  m.set("shy", [0]);
  m.set("sick", [6]);
  m.set("side", [0]);
  m.set("sigh", [7]);
  m.set("sight", [0]);
  m.set("sign", [3]);
  m.set("signal", [0]);
  m.set("significant", [4]);
  m.set("silence", [3]);
  m.set("silent", [8]);
  m.set("silk", [3]);
  m.set("silly", [8]);
  m.set("silver", [2]);
  m.set("similar", [0]);
  m.set("simple", [0]);
  m.set("since", [0]);
  m.set("sincerely", [7]);
  m.set("sing", [1]);
  m.set("single", [2]);
  m.set("sink", [1]);
  m.set("sir", [0]);
  m.set("sister", [1]);
  m.set("sit", [0]);
  m.set("site", [0]);
  m.set("situation", [0]);
  m.set("size", [4]);
  m.set("skate", [0]);
  m.set("skateboard", [0]);
  m.set("ski", [0]);
  m.set("skill", [0, 7]);
  m.set("skin", [0]);
  m.set("skip", [8]);
  m.set("skirt", [0]);
  m.set("sky", [0]);
  m.set("slave", [1]);
  m.set("sleep", [4]);
  m.set("sleepy", [0]);
  m.set("slice", [4]);
  m.set("slide", [1]);
  m.set("slightly", [2]);
  m.set("slim", [4]);
  m.set("slip", [4]);
  m.set("slow", [0]);
  m.set("small", [6]);
  m.set("smart", [6]);
  m.set("smell", [3]);
  m.set("smile", [1]);
  m.set("smog", [8]);
  m.set("smoke", [4]);
  m.set("smooth", [4]);
  m.set("snack", [0]);
  m.set("snake", [4]);
  m.set("sneeze", [4]);
  m.set("snow", [0]);
  m.set("snowy", [7]);
  m.set("so", [0]);
  m.set("soccer", [0]);
  m.set("social", [0]);
  m.set("socialism", [7]);
  m.set("socialist", [0]);
  m.set("society", [2]);
  m.set("sock", [1]);
  m.set("sofa", [9]);
  m.set("soft", [0]);
  m.set("software", [4]);
  m.set("soil", [2]);
  m.set("solar", [2]);
  m.set("soldier", [1]);
  m.set("solid", [4]);
  m.set("solution", [4]);
  m.set("solve", [0]);
  m.set("some", [0]);
  m.set("somebody_someone", [1]);
  m.set("somehow", [3]);
  m.set("something", [1]);
  m.set("sometimes", [0]);
  m.set("somewhat", [4]);
  m.set("somewhere", [7]);
  m.set("son", [1]);
  m.set("song", [1]);
  m.set("soon", [0]);
  m.set("sore", [1]);
  m.set("sorrow", [4]);
  m.set("sorry", [1]);
  m.set("sort", [6]);
  m.set("soul", [1]);
  m.set("sound", [0]);
  m.set("soup", [4]);
  m.set("sour", [0]);
  m.set("source", [0]);
  m.set("south", [5]);
  m.set("southern", [2]);
  m.set("souvenir", [1]);
  m.set("sow", [8]);
  m.set("space", [3]);
  m.set("spacecraft", [4]);
  m.set("spare", [4]);
  m.set("speak", [0]);
  m.set("speaker", [0]);
  m.set("special", [0]);
  m.set("specialist", [1]);
  m.set("species", [8]);
  m.set("specific", [0]);
  m.set("speech", [1]);
  m.set("speed", [0]);
  m.set("spell", [3]);
  m.set("spend", [1, 7]);
  m.set("spicy", [4]);
  m.set("spirit", [9]);
  m.set("splendid", [6]);
  m.set("split", [1]);
  m.set("sponsor", [0]);
  m.set("spoon", [1]);
  m.set("sport", [1]);
  m.set("spot", [0]);
  m.set("spread", [1]);
  m.set("spring", [1]);
  m.set("spy", [4]);
  m.set("square", [7]);
  m.set("stability", [0]);
  m.set("stadium", [0]);
  m.set("staff", [7]);
  m.set("stage", [0]);
  m.set("stair", [7]);
  m.set("stamp", [7]);
  m.set("stand", [0]);
  m.set("standard", [9]);
  m.set("star", [5]);
  m.set("stare", [4]);
  m.set("start", [0]);
  m.set("starve", [8]);
  m.set("state", [0]);
  m.set("station", [6]);
  m.set("statistic", [2]);
  m.set("statue", [4]);
  m.set("status", [7]);
  m.set("stay", [0]);
  m.set("steady", [4]);
  m.set("steak", [4]);
  m.set("steal", [7]);
  m.set("steam", [7]);
  m.set("steel", [2]);
  m.set("step", [0]);
  m.set("stick", [4]);
  m.set("still", [0]);
  m.set("stimulate", [0]);
  m.set("stomach", [2]);
  m.set("stomachache", [4]);
  m.set("stone", [0]);
  m.set("stop", [0]);
  m.set("store", [1]);
  m.set("storm", [2]);
  m.set("story", [3, 9]);
  m.set("straight", [4]);
  m.set("straightforward", [4]);
  m.set("strait", [6]);
  m.set("strange", [2]);
  m.set("stranger", [1]);
  m.set("strategy", [0]);
  m.set("strawberry", [4]);
  m.set("stream", [3]);
  m.set("street", [0]);
  m.set("strength", [7]);
  m.set("strengthen", [3]);
  m.set("stress", [0]);
  m.set("stretch", [7]);
  m.set("strict", [7]);
  m.set("strike", [2]);
  m.set("string", [2]);
  m.set("strong", [0]);
  m.set("structure", [1]);
  m.set("struggle", [1]);
  m.set("student", [0, 7]);
  m.set("studio", [1]);
  m.set("study", [0, 2, 4, 8]);
  m.set("stuff", [4]);
  m.set("stupid", [0]);
  m.set("style", [1]);
  m.set("subject", [0]);
  m.set("subjective", [4]);
  m.set("submit", [0]);
  m.set("subscribe", [0]);
  m.set("subsequent", [2]);
  m.set("substance", [6]);
  m.set("substantial", [2]);
  m.set("suburb", [4]);
  m.set("subway", [6]);
  m.set("succeed", [2]);
  m.set("success", [2]);
  m.set("successful", [5]);
  m.set("such", [0]);
  m.set("sudden", [0]);
  m.set("suffer", [1]);
  m.set("sufficient", [4]);
  m.set("sugar", [4]);
  m.set("suggest", [2]);
  m.set("suggestion", [0]);
  m.set("suit", [0]);
  m.set("suitable", [0]);
  m.set("sum", [4]);
  m.set("summary", [1]);
  m.set("summer", [0]);
  m.set("sun", [0]);
  m.set("sunny", [8]);
  m.set("super", [2]);
  m.set("superb", [0]);
  m.set("superior", [0]);
  m.set("supermarket", [0]);
  m.set("supplement", [1]);
  m.set("supply", [2]);
  m.set("support", [0]);
  m.set("suppose", [4]);
  m.set("sure", [0]);
  m.set("surf", [9]);
  m.set("surface", [0]);
  m.set("surgeon", [4]);
  m.set("surgery", [5]);
  m.set("surprise", [0]);
  m.set("surround", [4]);
  m.set("surrounding", [2]);
  m.set("survey", [4]);
  m.set("survive", [1]);
  m.set("suspect", [2]);
  m.set("suspend", [0]);
  m.set("sustain", [8]);
  m.set("sweat", [4]);
  m.set("sweater", [0]);
  m.set("sweep", [7]);
  m.set("sweet", [4]);
  m.set("swim", [2]);
  m.set("swing", [7]);
  m.set("switch", [1]);
  m.set("symbol", [0]);
  m.set("sympathy", [0]);
  m.set("symphony", [2]);
  m.set("symptom", [1]);
  m.set("system", [5]);
  m.set("t_shirt", [6]);
  m.set("table", [0]);
  m.set("tablet", [1]);
  m.set("tackle", [2]);
  m.set("tail", [1]);
  m.set("tailor", [7]);
  m.set("take", [0]);
  m.set("tale", [3]);
  m.set("talent", [0]);
  m.set("talk", [0, 1, 3, 4]);
  m.set("tall", [2]);
  m.set("tank", [4]);
  m.set("tap", [0]);
  m.set("tape", [2]);
  m.set("target", [3]);
  m.set("task", [4]);
  m.set("taste", [4]);
  m.set("tax", [4]);
  m.set("taxi", [2]);
  m.set("tea", [4]);
  m.set("teach", [0, 3, 7, 9]);
  m.set("teacher", [0]);
  m.set("team", [2]);
  m.set("teamwork", [0]);
  m.set("teapot", [0]);
  m.set("tear", [0]);
  m.set("technique", [0]);
  m.set("technology", [5]);
  m.set("teenage", [0]);
  m.set("teenager", [4]);
  m.set("telephone", [7]);
  m.set("telescope", [4]);
  m.set("tell", [0]);
  m.set("temperature", [3]);
  m.set("temple", [3]);
  m.set("temporary", [0]);
  m.set("tend", [1]);
  m.set("tendency", [0]);
  m.set("tennis", [4]);
  m.set("tension", [0]);
  m.set("tent", [0]);
  m.set("term", [7]);
  m.set("terrible", [0]);
  m.set("territory", [2]);
  m.set("test", [2, 4]);
  m.set("text", [3]);
  m.set("than", [0]);
  m.set("thank", [0]);
  m.set("that", [0]);
  m.set("the", [0]);
  m.set("theatre", [9]);
  m.set("theft", [4]);
  m.set("their", [0]);
  m.set("theirs", [0]);
  m.set("them", [0]);
  m.set("theme", [0]);
  m.set("themselves", [0]);
  m.set("then", [0]);
  m.set("theory", [2]);
  m.set("there", [6]);
  m.set("therefore", [0]);
  m.set("these", [0]);
  m.set("they", [0]);
  m.set("thick", [0]);
  m.set("thin", [0]);
  m.set("thing", [0]);
  m.set("think", [3]);
  m.set("thinking", [0]);
  m.set("thirsty", [0]);
  m.set("this", [0]);
  m.set("thorough", [7]);
  m.set("those", [0]);
  m.set("though", [2]);
  m.set("thought", [3]);
  m.set("threat", [2]);
  m.set("threaten", [7]);
  m.set("throat", [4]);
  m.set("through", [0]);
  m.set("throughout", [0]);
  m.set("throw", [8]);
  m.set("thunder", [0]);
  m.set("thus", [1]);
  m.set("ticket", [6]);
  m.set("tidy", [8]);
  m.set("tie", [7]);
  m.set("tiger", [0]);
  m.set("tight", [7]);
  m.set("time", [0]);
  m.set("tiny", [8]);
  m.set("tip", [8]);
  m.set("tired", [5]);
  m.set("tissue", [2]);
  m.set("title", [0]);
  m.set("to", [0]);
  m.set("toast", [0]);
  m.set("tobacco", [1]);
  m.set("today", [0]);
  m.set("tofu", [1]);
  m.set("together", [1]);
  m.set("toilet", [4]);
  m.set("tolerate", [1]);
  m.set("tomato", [0]);
  m.set("tomb", [0]);
  m.set("tomorrow", [1]);
  m.set("ton", [4]);
  m.set("tone", [7]);
  m.set("tonight", [3]);
  m.set("too", [0]);
  m.set("tool", [0]);
  m.set("tooth", [1]);
  m.set("toothache", [4]);
  m.set("top", [0]);
  m.set("topic", [0]);
  m.set("total", [0]);
  m.set("touch", [1]);
  m.set("tough", [1]);
  m.set("tour", [6]);
  m.set("tourist", [0]);
  m.set("tournament", [7]);
  m.set("towards", [5]);
  m.set("towel", [4]);
  m.set("tower", [4]);
  m.set("town", [1]);
  m.set("toy", [9]);
  m.set("track", [4]);
  m.set("trade", [3]);
  m.set("tradition", [0]);
  m.set("traditional", [0]);
  m.set("traffic", [0]);
  m.set("train", [6]);
  m.set("training", [7]);
  m.set("transfer", [0]);
  m.set("transform", [5]);
  m.set("transition", [4]);
  m.set("translate", [3]);
  m.set("transport", [5]);
  m.set("trap", [2]);
  m.set("travel", [6]);
  m.set("treasure", [0]);
  m.set("treat", [0]);
  m.set("treatment", [1]);
  m.set("tree", [0]);
  m.set("trend", [2]);
  m.set("trial", [0]);
  m.set("trick", [0]);
  m.set("trip", [6]);
  m.set("tropical", [4]);
  m.set("trouble", [0]);
  m.set("trousers", [4]);
  m.set("truck", [0]);
  m.set("true", [0]);
  m.set("trunk", [7]);
  m.set("trust", [0]);
  m.set("truth", [0]);
  m.set("try", [0]);
  m.set("tube", [2]);
  m.set("tune", [3]);
  m.set("tunnel", [0]);
  m.set("turkey", [0]);
  m.set("turn", [5]);
  m.set("tv", [0]);
  m.set("twice", [4]);
  m.set("twin", [1]);
  m.set("type", [0]);
  m.set("typhoon", [2]);
  m.set("typical", [4]);
  m.set("ugly", [7]);
  m.set("ultimately", [7]);
  m.set("umbrella", [6]);
  m.set("uncle", [7]);
  m.set("under", [2]);
  m.set("underground", [1]);
  m.set("understand", [2, 3]);
  m.set("uniform", [7]);
  m.set("union", [1]);
  m.set("unique", [0]);
  m.set("unit", [0]);
  m.set("universe", [0]);
  m.set("university", [2]);
  m.set("unless", [0]);
  m.set("until", [0]);
  m.set("unusual", [0]);
  m.set("up", [0]);
  m.set("update", [5]);
  m.set("upon", [0]);
  m.set("upper", [4]);
  m.set("upset", [1]);
  m.set("urban", [1]);
  m.set("urge", [3]);
  m.set("urgent", [8]);
  m.set("us", [0]);
  m.set("use", [0]);
  m.set("used", [0]);
  m.set("useful", [0]);
  m.set("usual", [0]);
  m.set("usually", [0]);
  m.set("vacation", [9]);
  m.set("valid", [1]);
  m.set("valley", [4]);
  m.set("valuable", [2]);
  m.set("value", [0]);
  m.set("variation", [2]);
  m.set("variety", [0]);
  m.set("various", [2]);
  m.set("vary", [7]);
  m.set("vase", [0]);
  m.set("vast", [2]);
  m.set("vegetable", [0]);
  m.set("vehicle", [4]);
  m.set("venue", [0]);
  m.set("version", [2]);
  m.set("very", [0]);
  m.set("victim", [4]);
  m.set("victory", [0]);
  m.set("video", [0]);
  m.set("view", [3, 9]);
  m.set("village", [2]);
  m.set("violence", [1]);
  m.set("violin", [0]);
  m.set("virtual", [2]);
  m.set("virtue", [3]);
  m.set("virus", [2]);
  m.set("visible", [4]);
  m.set("vision", [1]);
  m.set("visit", [1, 6]);
  m.set("visitor", [0]);
  m.set("visual", [2]);
  m.set("vital", [1]);
  m.set("vivid", [0]);
  m.set("vocabulary", [0]);
  m.set("voice", [0]);
  m.set("volcano", [6]);
  m.set("volleyball", [0]);
  m.set("volume", [3]);
  m.set("voluntary", [0]);
  m.set("volunteer", [0]);
  m.set("vote", [1]);
  m.set("voyage", [3]);
  m.set("wage", [3]);
  m.set("waist", [0]);
  m.set("wait", [0]);
  m.set("wake", [3]);
  m.set("walk", [0]);
  m.set("wall", [1]);
  m.set("wallet", [4]);
  m.set("wander", [3]);
  m.set("want", [0]);
  m.set("war", [0]);
  m.set("ward", [1]);
  m.set("warm", [0]);
  m.set("warn", [8]);
  m.set("warning", [2]);
  m.set("wash", [0]);
  m.set("washroom", [6]);
  m.set("waste", [8]);
  m.set("watch", [0]);
  m.set("water", [4, 8]);
  m.set("watermelon", [4]);
  m.set("wave", [0]);
  m.set("way", [0]);
  m.set("we", [0]);
  m.set("weak", [0]);
  m.set("wealth", [4]);
  m.set("weapon", [8]);
  m.set("wear", [0]);
  m.set("weather", [4]);
  m.set("web", [1]);
  m.set("website", [6]);
  m.set("wedding", [0]);
  m.set("weed", [3]);
  m.set("week", [0, 1, 6]);
  m.set("weekday", [2]);
  m.set("weekend", [0]);
  m.set("weekly", [3]);
  m.set("weep", [7]);
  m.set("weigh", [1]);
  m.set("weight", [4]);
  m.set("welcome", [0]);
  m.set("welfare", [4]);
  m.set("well", [0]);
  m.set("west", [0]);
  m.set("western", [0]);
  m.set("wet", [2]);
  m.set("wetland", [6]);
  m.set("whale", [0]);
  m.set("what", [0]);
  m.set("whatever", [0]);
  m.set("wheat", [4]);
  m.set("wheel", [4]);
  m.set("when", [1]);
  m.set("whenever", [4]);
  m.set("where", [0]);
  m.set("whether", [5]);
  m.set("which", [0]);
  m.set("while", [0]);
  m.set("whisper", [7]);
  m.set("white", [0]);
  m.set("who", [0]);
  m.set("whole", [0]);
  m.set("whom", [7]);
  m.set("whose", [0]);
  m.set("why", [0]);
  m.set("wi_fi", [0]);
  m.set("wide", [0]);
  m.set("widespread", [4]);
  m.set("wife", [0]);
  m.set("wild", [0]);
  m.set("will", [0]);
  m.set("win", [0]);
  m.set("wind", [0]);
  m.set("window", [0]);
  m.set("windy", [8]);
  m.set("wine", [7]);
  m.set("wing", [0]);
  m.set("winner", [7]);
  m.set("winter", [0]);
  m.set("wire", [0]);
  m.set("wisdom", [0]);
  m.set("wise", [4]);
  m.set("wish", [0]);
  m.set("with", [0]);
  m.set("withdraw", [0]);
  m.set("within", [0]);
  m.set("without", [0]);
  m.set("witness", [0]);
  m.set("wolf", [1]);
  m.set("woman", [0]);
  m.set("wonder", [2]);
  m.set("wonderful", [0]);
  m.set("wood", [1]);
  m.set("wool", [7]);
  m.set("word", [3]);
  m.set("work", [0]);
  m.set("worker", [0]);
  m.set("world", [0]);
  m.set("worry", [0]);
  m.set("worse", [1]);
  m.set("worst", [2]);
  m.set("worth", [0]);
  m.set("worthwhile", [4]);
  m.set("worthy", [4]);
  m.set("would", [0]);
  m.set("wound", [4]);
  m.set("wrap", [4]);
  m.set("wrestle", [1]);
  m.set("wrinkle", [3]);
  m.set("wrist", [4]);
  m.set("write", [3, 9]);
  m.set("writer", [3]);
  m.set("wrong", [0]);
  m.set("x_ray", [4]);
  m.set("yard", [4]);
  m.set("year", [0]);
  m.set("yellow", [8]);
  m.set("yes", [5]);
  m.set("yesterday", [0]);
  m.set("yet", [3]);
  m.set("yield", [4]);
  m.set("yoghurt", [4]);
  m.set("you", [0]);
  m.set("young", [0]);
  m.set("your", [0]);
  m.set("yours", [7]);
  m.set("yourself", [0]);
  m.set("youth", [1]);
  m.set("zero", [0]);
  m.set("zone", [0]);
  m.set("zoo", [0]);
  return m;
})();

function _renderThemeNet(theme, hw) {
  const W = 320, H = 472;
  const bx = [55, 160, 265];
  const by = 92;
  const ws = 128;
  const rh = 28;
  const elliRx = (w) => Math.max(w.length * 3.2 + 9, 25);
  const isHi = (w) => w.toLowerCase() === hw;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="wv-net" xmlns="http://www.w3.org/2000/svg">`;
  // 第1层：中心节点（蓝色#2563eb对齐"常见结构"wv-tag标签样式；查询词=中心则红色高亮）
  const cHi = isHi(theme.center);
  s += `<ellipse cx="160" cy="40" rx="52" ry="18" fill="${cHi ? '#dc2626' : '#2563eb'}" stroke="#1e40af" stroke-width="1"/>`;
  s += `<text x="160" y="40" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="13" font-weight="700">${esc(theme.center)}</text>`;
  theme.branches.forEach((br, i) => {
    const x = bx[i];
    s += `<line x1="160" y1="58" x2="${x}" y2="${by - 16}" stroke="#9ca3af" stroke-width="1" stroke-opacity="0.5"/>`;
    s += `<ellipse cx="${x}" cy="${by}" rx="48" ry="16" fill="#e5e7eb" stroke="#9ca3af" stroke-width="0.8"/>`;
    s += `<text x="${x}" y="${by}" text-anchor="middle" dominant-baseline="central" fill="#1f2937" font-size="11" font-weight="600">${esc(br.branch)}</text>`;
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
  return `<div class="wv-net-wrap"><div class="wv-net-title">${esc(theme.name)} · 主题词汇语义网</div>${s}</div>`;
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
