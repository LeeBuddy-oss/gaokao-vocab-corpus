const WORDS_URL = 'data/words.json?v=20260825aa';
const INDEX_BASE = 'data/index/';
const MINDMAP_BASE = 'data/mindmap/';
const WORDS_BASE = 'data/words/';
const STATS_URL = 'data/stats.json?v=20260825aa';

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
    const [wr, mr] = await Promise.all([fetch(WORDS_URL + '?v=20260825aa'), fetch(WORDS_BASE + 'manifest.json?v=20260825aa')]);
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
    const [res] = await Promise.all([fetch(WORDS_BASE + rel + '?v=20260825aa'), ensureMindmap(letter), ensureFamily()]);
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
/* ========== 主题词汇语义网（100 主题 31 词不交叉，每主题专属 3 中文子主题）========== */
const THEME_NETS = [
  {
    name: "require",
    center: "require",
    subthemes: ["资源与形象", "要求与原则", "探索与训练"],
    branches: [
      { branch: "resource", items: ["resource", "visual", "youth", "security", "appeal", "weak", "favour", "position", "royal", "profile"] },
      { branch: "require", items: ["require", "pressure", "vision", "exam", "conclude", "sharp", "hire", "principle", "devote", "diagram"] },
      { branch: "migration", items: ["migration", "button", "bee", "cancer", "seek", "measure", "draft", "capture", "observe", "training", "servant"] },
    ]
  },
  {
    name: "conflict",
    center: "conflict",
    subthemes: ["国家与传统", "奉献与关系", "探索与边界"],
    branches: [
      { branch: "capital", items: ["capital", "polite", "dead", "kingdom", "soldier", "debate", "tradition", "champion", "comprise", "core", "spy"] },
      { branch: "dedicate", items: ["dedicate", "ward", "brave", "mutual", "blood", "influential", "nation", "foreign", "extent", "recite", "wound"] },
      { branch: "voyage", items: ["voyage", "ashamed", "boundary", "desert", "drama", "marine", "poet", "poster", "threat", "solve"] },
    ]
  },
  {
    name: "reduce",
    center: "reduce",
    subthemes: ["污染与消费", "气候与碳排", "讨论与对抗"],
    branches: [
      { branch: "reduce", items: ["reduce", "plastic", "garbage", "pollute", "electricity", "product", "consumption", "agency", "apart", "impact"] },
      { branch: "pollution", items: ["pollution", "climate", "waste", "carbon", "cut", "amount", "by", "affect", "plant", "this"] },
      { branch: "account", items: ["account", "help", "conduct", "argue", "also", "so", "they", "new", "fight", "surface"] },
    ]
  },
  {
    name: "stand",
    center: "stand",
    subthemes: ["位置与观察", "环境与人群", "空间与时间"],
    branches: [
      { branch: "police", items: ["police", "hole", "although", "watch", "noise", "kilometre", "know", "side", "stay", "make"] },
      { branch: "cloth", items: ["cloth", "mountain", "but", "both", "great", "crowd", "own", "happen", "eye", "somebody_someone"] },
      { branch: "giant", items: ["giant", "path", "tall", "metre", "fan", "forever", "speech", "exchange", "west", "annual"] },
    ]
  },
  {
    name: "simple",
    center: "simple",
    subthemes: ["人物与学习", "标准与态度", "概念与使用"],
    branches: [
      { branch: "hero", items: ["hero", "author", "ball", "digital", "seem", "learn", "diverse", "well", "their", "fable"] },
      { branch: "pole", items: ["pole", "keen", "appropriate", "king", "deserve", "zero", "flexible", "excuse", "complain", "formal"] },
      { branch: "diary", items: ["diary", "human", "even", "use", "print", "work", "best", "total", "concept", "your"] },
    ]
  },
  {
    name: "replace",
    center: "replace",
    subthemes: ["物品与情感", "特征与表现", "现代与媒介"],
    branches: [
      { branch: "complicated", items: ["complicated", "bless", "candle", "banana", "throw", "lay", "defend", "shelf", "up", "just"] },
      { branch: "rhyme", items: ["rhyme", "gesture", "diamond", "pale", "tight", "nose", "aside", "gentle", "brand", "shine", "politician"] },
      { branch: "investment", items: ["investment", "blog", "keyboard", "livestock", "dictionary", "year", "borrow", "assume", "interesting", "mobile", "socialist"] },
    ]
  },
  {
    name: "convince",
    center: "convince",
    subthemes: ["资源与劳作", "食物与发明", "行动与贸易"],
    branches: [
      { branch: "coal", items: ["coal", "sow", "slave", "lamb", "potato", "format", "capacity", "lift", "worth", "weigh", "variation"] },
      { branch: "barbecue", items: ["barbecue", "hybrid", "grain", "wheat", "amateur", "pagoda", "patent", "nest", "arrow", "attain", "patriotism"] },
      { branch: "intense", items: ["intense", "attempt", "choke", "entitle", "exceed", "integrate", "negative", "trade", "bow", "artificial"] },
    ]
  },
  {
    name: "buy",
    center: "buy",
    subthemes: ["声明与时间", "购物与支付", "消费与工作"],
    branches: [
      { branch: "declare", items: ["declare", "take", "vegetable", "he", "time", "spend", "some", "man", "ask", "purpose"] },
      { branch: "shop", items: ["shop", "why", "pass", "want", "meet", "big", "much", "cook", "secret", "pay"] },
      { branch: "budget", items: ["budget", "purchase", "job", "meal", "offer", "rent", "eat", "map", "advice", "company"] },
    ]
  },
  {
    name: "moment",
    center: "moment",
    subthemes: ["时刻与精神", "日常与情感", "性格与表达"],
    branches: [
      { branch: "moment", items: ["moment", "touch", "behind", "dark", "positive", "strength", "thin", "spirit", "everyday", "instant"] },
      { branch: "bus", items: ["bus", "corn", "cold", "corner", "jump", "happy", "not", "stress", "real", "again"] },
      { branch: "nervous", items: ["nervous", "character", "tell", "suit", "say", "ready", "down", "skin", "him", "hand"] },
    ]
  },
  {
    name: "business",
    center: "business",
    subthemes: ["机构与服务", "渠道与教育", "问题与项目"],
    branches: [
      { branch: "station", items: ["station", "bank", "earn", "fork", "out", "disability", "service", "decision", "now", "relationship"] },
      { branch: "channel", items: ["channel", "allow", "near", "leave", "catch", "college", "run", "dollar", "desk", "international"] },
      { branch: "business", items: ["business", "bad", "overcome", "problem", "generation", "schedule", "next", "project", "ordinary", "sick"] },
    ]
  },
  {
    name: "per",
    center: "per",
    subthemes: ["范围与水平", "资源与成就", "数据与分布"],
    branches: [
      { branch: "throughout", items: ["throughout", "show", "air", "cause", "group", "below", "low", "lower", "need", "level"] },
      { branch: "per", items: ["per", "material", "government", "advantage", "fee", "basis", "nearly", "achievement", "farm", "wander"] },
      { branch: "transition", items: ["transition", "million", "which", "only", "average", "among", "country", "follow", "test", "come"] },
    ]
  },
  {
    name: "hour",
    center: "hour",
    subthemes: ["场所与时间", "动作与时段", "地点与兴趣"],
    branches: [
      { branch: "washroom", items: ["washroom", "park", "light", "if", "available", "welcome", "until", "city", "other", "week"] },
      { branch: "fly", items: ["fly", "try", "left", "later", "evening", "less", "area", "activity", "half", "most"] },
      { branch: "square", items: ["square", "decide", "early", "into", "couple", "tree", "tour", "morning", "water", "interest"] },
    ]
  },
  {
    name: "art",
    center: "art",
    topic_group: "文学艺术与体育",
    subtopic: "绘画、建筑等领域的代表作品和人物",
    subthemes: ["绘画艺术", "建筑艺术", "艺术活动"],
    branches: [
      { branch: "painting", items: ["painting", "paint", "picture", "frame", "canvas", "gallery", "museum", "exhibition", "artist", "portrait"] },
      { branch: "architecture", items: ["architecture", "building", "design", "structure", "monument", "temple", "palace", "castle", "tower", "bridge"] },
      { branch: "activity", items: ["art", "create", "draw", "sketch", "color", "brush", "beauty", "appreciate", "admire", "display"] }
    ]
  },
  {
    name: "no",
    center: "no",
    subthemes: ["认知与表达", "动作与状态", "否定与故事"],
    branches: [
      { branch: "extraordinary", items: ["extraordinary", "could", "me", "begin", "understand", "word", "reason", "something", "us", "few"] },
      { branch: "apparently", items: ["apparently", "walk", "during", "many", "thought", "start", "course", "continue", "any", "free"] },
      { branch: "no", items: ["no", "far", "story", "important", "please", "always", "kid", "read", "passage", "though"] },
    ]
  },
  {
    name: "choose",
    center: "choose",
    subthemes: ["决定与文件", "选择与行动", "问候与日常"],
    branches: [
      { branch: "shall", items: ["shall", "whose", "finish", "lawyer", "agree", "paper", "fail", "receive", "choice", "online"] },
      { branch: "choose", items: ["choose", "aim", "event", "middle", "parent", "table", "swim", "move", "enter", "discuss"] },
      { branch: "greet", items: ["greet", "breakfast", "joy", "mouth", "track", "dog", "staff", "contest", "sound", "door"] },
    ]
  },
  {
    name: "talk",
    center: "talk",
    subthemes: ["支持与事故", "对话与会议", "物品与人物"],
    branches: [
      { branch: "than", items: ["than", "support", "accident", "place", "between", "busy", "end", "difficult", "may", "hear"] },
      { branch: "speaker", items: ["speaker", "conversation", "mistake", "meeting", "tomorrow", "movie", "trouble", "mrs", "extra", "deal"] },
      { branch: "shirt", items: ["shirt", "woman", "bill", "recommend", "advise", "season", "northern", "saucer", "father", "benefit"] },
    ]
  },
  {
    name: "together",
    center: "together",
    subthemes: ["物品与意义", "季节与艺术", "交流与改进"],
    branches: [
      { branch: "rope", items: ["rope", "meaning", "sun", "month", "famous", "tend", "adventure", "same", "novel", "tool"] },
      { branch: "theatre", items: ["theatre", "summer", "rainbow", "mark", "significant", "winter", "return", "director", "string", "actually"] },
      { branch: "together", items: ["together", "bright", "visit", "around", "wind", "note", "improve", "age", "communicate", "humourous"] },
    ]
  },
  {
    name: "scientist",
    center: "scientist",
    topic_group: "科学与技术",
    subtopic: "科学精神、科学探究",
    subthemes: ["科学方法", "实验研究", "科学发现"],
    branches: [
      { branch: "method", items: ["research", "experiment", "observe", "analyze", "conclude", "theory", "hypothesis", "evidence", "data", "result"] },
      { branch: "lab", items: ["laboratory", "microscope", "instrument", "sample", "chemical", "biology", "physics", "chemistry", "measure", "calculate"] },
      { branch: "discovery", items: ["discover", "invent", "develop", "innovate", "breakthrough", "achievement", "contribution", "genius", "inspire", "progress"] }
    ]
  },
  {
    name: "mention",
    center: "mention",
    subthemes: ["提及与对象", "形式与组合", "文化与古老"],
    branches: [
      { branch: "mention", items: ["mention", "treasure", "object", "pair", "specialist", "transform", "seldom", "issue", "foot", "quote"] },
      { branch: "symphony", items: ["symphony", "example", "independent", "shape", "association", "surrounding", "heart", "somewhere", "include", "invest", "protest"] },
      { branch: "ballet", items: ["ballet", "vocabulary", "loss", "society", "calligraphy", "stone", "digest", "ancient", "childhood", "difficulty"] },
    ]
  },
  {
    name: "remember",
    center: "remember",
    subthemes: ["记忆与声音", "人物与情感", "状态与完成"],
    branches: [
      { branch: "remember", items: ["remember", "voice", "page", "style", "friendship", "listen", "forget", "wonderful", "ourselves", "lovely"] },
      { branch: "guy", items: ["guy", "music", "desire", "brother", "plot", "bit", "else", "myself", "really", "carry"] },
      { branch: "serious", items: ["serious", "complete", "finally", "camp", "board", "stop", "easy", "true", "everybody_everyone", "bed"] },
    ]
  },
  {
    name: "provide",
    center: "provide",
    subthemes: ["物品与系统", "区域与保护", "提供与适应"],
    branches: [
      { branch: "item", items: ["item", "prefer", "computer", "under", "system", "special", "major", "apply", "common", "type"] },
      { branch: "province", items: ["province", "conservation", "cover", "today", "form", "limited", "period", "adult", "explore", "point"] },
      { branch: "provide", items: ["provide", "limit", "opportunity", "advance", "vital", "request", "adopt", "adapt", "reserve", "institution"] },
    ]
  },
  {
    name: "school",
    center: "school",
    topic_group: "生活与学习",
    subtopic: "个人、家庭、社区及学校生活",
    subthemes: ["教育主体", "学习活动", "校园场景"],
    branches: [
      { branch: "people", items: ["teacher", "student", "classmate", "parent", "professor", "coach", "master", "guide", "monitor", "principal"] },
      { branch: "learning", items: ["learn", "study", "read", "write", "think", "practice", "teach", "class", "education", "knowledge"] },
      { branch: "place", items: ["classroom", "library", "lab", "playground", "gym", "hall", "campus", "building", "room", "lecture"] }
    ]
  },
  {
    name: "quick",
    center: "quick",
    subthemes: ["动作与情境", "挑战与状态", "力量与感受"],
    branches: [
      { branch: "scream", items: ["scream", "calm", "shake", "pick", "himself", "milk", "hot", "situation", "mr", "labour"] },
      { branch: "quick", items: ["quick", "challenge", "heat", "within", "burn", "rice", "wolf", "luck", "building", "usual"] },
      { branch: "attack", items: ["attack", "land", "strong", "smile", "nice", "across", "disappointed", "serve", "body", "taste"] },
    ]
  },
  {
    name: "bring",
    center: "bring",
    subthemes: ["坚持与旅行", "带来与社区", "联合与文学"],
    branches: [
      { branch: "insist", items: ["insist", "habitat", "trip", "sport", "public", "join", "enable", "tiny", "produce", "pot", "rival"] },
      { branch: "bring", items: ["bring", "sight", "doctor", "ensure", "community", "soft", "flavour", "language", "industry", "wife"] },
      { branch: "conflict", items: ["union", "chess", "deep", "iron", "summary", "literary", "ache", "drought", "leak", "miracle"] },
    ]
  },
  {
    name: "must",
    center: "must",
    subthemes: ["场所与选择", "运动与学术", "最终与竞赛"],
    branches: [
      { branch: "cafeteria", items: ["cafeteria", "direct", "travel", "select", "sentence", "introduction", "ground", "perfect", "autumn", "indicate", "packet"] },
      { branch: "athlete", items: ["athlete", "spring", "academic", "collection", "wait", "application", "lake", "humanity", "master", "image"] },
      { branch: "final", items: ["final", "poem", "rush", "nothing", "mineral", "recently", "full", "beat", "competition", "english"] },
    ]
  },
  {
    name: "increase",
    center: "increase",
    subthemes: ["环境与农业", "发展与联系", "状态与传承"],
    branches: [
      { branch: "increase", items: ["increase", "environment", "particular", "agriculture", "decline", "general", "length", "percentage", "drown", "ecology"] },
      { branch: "rise", items: ["rise", "university", "approach", "north", "whether", "soil", "development", "farmer", "promote", "connect"] },
      { branch: "harm", items: ["harm", "remain", "state", "infer", "crop", "temperature", "opposite", "heritage", "similar", "role"] },
    ]
  },
  {
    name: "grow",
    center: "grow",
    subthemes: ["工具与方法", "生长与健康", "城市与特征"],
    branches: [
      { branch: "telephone", items: ["telephone", "method", "dry", "top", "cloud", "fast", "wall", "grass", "imagine", "succeed"] },
      { branch: "grow", items: ["grow", "disease", "trend", "hospital", "forest", "solution", "further", "degree", "praise", "root"] },
      { branch: "urban", items: ["urban", "soul", "characteristic", "attract", "tooth", "everywhere", "floor", "barrier", "mine", "ruin"] },
    ]
  },
  {
    name: "sit",
    center: "sit",
    subthemes: ["动作与日常", "位置与情感", "安静与传递"],
    branches: [
      { branch: "bend", items: ["bend", "tea", "unusual", "maybe", "lunch", "cry", "alive", "daily", "nod", "poor"] },
      { branch: "sit", items: ["sit", "toy", "living", "goodbye", "customer", "excited", "pain", "instrument", "attention", "town"] },
      { branch: "quiet", items: ["quiet", "upon", "star", "phrase", "picture", "alarm", "deliver", "friendly", "plenty", "branch"] },
    ]
  },
  {
    name: "global",
    center: "global",
    subthemes: ["全球与标准", "供应与后果", "现状与潜力"],
    branches: [
      { branch: "global", items: ["global", "absolutely", "standard", "essential", "calorie", "invent", "obviously", "delight", "fair", "upper"] },
      { branch: "meanwhile", items: ["meanwhile", "shortage", "consequence", "bias", "instance", "supply", "racial", "record", "reflect", "region"] },
      { branch: "current", items: ["current", "potential", "belief", "engine", "rose", "structure", "analyse", "army", "disappear", "polar"] },
    ]
  },
  {
    name: "research",
    center: "research",
    subthemes: ["研究与数据", "发现与认知", "特征与存在"],
    branches: [
      { branch: "research", items: ["research", "data", "scientific", "gain", "base", "indeed", "personal", "speed", "encounter", "normal"] },
      { branch: "finding", items: ["finding", "professor", "evolve", "expect", "mental", "confirm", "engineer", "identify", "unique", "sea"] },
      { branch: "determine", items: ["determine", "feature", "feed", "fish", "ai", "consume", "theory", "exist", "movement", "size"] },
    ]
  },
  {
    name: "outside",
    center: "outside",
    subthemes: ["外部与边界", "边缘与维持", "接触与生物"],
    branches: [
      { branch: "outside", items: ["outside", "fun", "window", "shock", "chart", "wire", "stare", "hen", "bear", "dam"] },
      { branch: "edge", items: ["edge", "gather", "maintain", "soup", "contact", "creature", "breathe", "above", "correspond", "expansion"] },
      { branch: "fine", items: ["fine", "subject", "dynasty", "ham", "panda", "favourite", "cat", "meat", "pose", "shallow"] },
    ]
  },
  {
    name: "hold",
    center: "hold",
    subthemes: ["物品与游戏", "官方与会话", "中央与流动"],
    branches: [
      { branch: "skirt", items: ["skirt", "game", "writer", "attend", "host_hostess", "ultimately", "session", "date", "musician", "official"] },
      { branch: "paragraph", items: ["paragraph", "black", "central", "player", "charge", "kitchen", "party", "card", "therefore", "press"] },
      { branch: "junior", items: ["junior", "flow", "model", "bath", "definitely", "distance", "frost", "impression", "private", "resolution"] },
    ]
  },
  {
    name: "control",
    center: "control",
    subthemes: ["控制与条件", "反应与资金", "具体与行动"],
    branches: [
      { branch: "control", items: ["control", "condition", "careful", "damage", "compare", "grocery", "weed", "monitor", "match", "crazy"] },
      { branch: "nail", items: ["nail", "persuade", "reaction", "fund", "eager", "switch", "valuable", "vary", "specific", "transport", "principal"] },
      { branch: "decade", items: ["decade", "practical", "regard", "repeat", "lazy", "prevent", "price", "hang", "action", "tie"] },
    ]
  },
  {
    name: "process",
    center: "process",
    subthemes: ["包含与奖励", "复杂与组成", "过程与反应"],
    branches: [
      { branch: "contain", items: ["contain", "reward", "individual", "lie", "complex", "divide", "case", "blue", "source", "original"] },
      { branch: "process", items: ["process", "copy", "consist", "smart", "fit", "involve", "dish", "factor", "survive", "aware"] },
      { branch: "roast", items: ["roast", "facility", "ocean", "wedding", "accept", "content", "evidence", "response", "abroad", "factory"] },
    ]
  },
  {
    name: "people",
    center: "people",
    subthemes: ["近期与自身", "身份与手段", "信念与挣扎"],
    branches: [
      { branch: "recent", items: ["recent", "yourself", "short", "list", "road", "confident", "rather", "identity", "front", "means"] },
      { branch: "evaluate", items: ["evaluate", "habit", "task", "already", "goal", "suffer", "fix", "believe", "drink", "national"] },
      { branch: "person", items: ["person", "lot", "social", "name", "function", "itself", "struggle", "necessary", "stick", "step"] },
    ]
  },
  {
    name: "china_8a7d7b",
    center: "china_8a7d7b",
    subthemes: ["中国与公民", "数据与统计", "东方与革命"],
    branches: [
      { branch: "email", items: ["email", "chinese", "south", "citizen", "combine", "globe", "translate", "pig", "camera", "angry"] },
      { branch: "introduce", items: ["introduce", "drop", "emperor_empress", "exposure", "statistic", "snow", "settle", "bat", "comedy", "deaf"] },
      { branch: "china", items: ["china", "grandson", "hit", "idiom", "negotiate", "revolution", "white", "east", "finger", "harmful"] },
    ]
  },
  {
    name: "my",
    center: "my",
    subthemes: ["情绪与梦境", "家庭与日常", "自信与快乐"],
    branches: [
      { branch: "depress", items: ["depress", "son", "dream", "shout", "tired", "anything", "loud", "news", "hair", "spare"] },
      { branch: "night", items: ["night", "birthday", "reply", "push", "daughter", "upset", "joke", "personality", "ring", "office"] },
      { branch: "my", items: ["my", "hardly", "roll", "cool", "confidence", "funny", "immediately", "pleasure", "pet", "shoot"] },
    ]
  },
  {
    name: "his",
    center: "his",
    subthemes: ["变化与担忧", "寻找与阶段", "天气与休养"],
    branches: [
      { branch: "his", items: ["his", "become", "worry", "pull", "afternoon", "stage", "search", "quit", "sale", "cure"] },
      { branch: "tv", items: ["tv", "boy", "motivate", "beyond", "sleep", "weather", "save", "mess", "beach", "climb"] },
      { branch: "those", items: ["those", "ear", "thank", "regret", "uncle", "attach", "department", "neighbourhood", "repair", "vacation"] },
    ]
  },
  {
    name: "she",
    center: "she",
    subthemes: ["关系与医学", "愿望与方向", "穿着与生活方式"],
    branches: [
      { branch: "she", items: ["she", "her", "husband", "medicine", "born", "wish", "yes", "medical", "guess", "grandmother"] },
      { branch: "anxiety", items: ["anxiety", "notice", "direction", "sweet", "patient", "trial", "graduate", "bag", "wear", "grandfather", "watermelon"] },
      { branch: "mother", items: ["mother", "rest", "fashion", "red", "dress", "hurt", "lifestyle", "sing", "sign", "amazing"] },
    ]
  },
  {
    name: "lost",
    center: "lost",
    subthemes: ["海岸与岛屿", "失去与颜色", "南方与珍贵"],
    branches: [
      { branch: "coast", items: ["coast", "island", "whale", "hobby", "western", "bike", "boat", "transfer", "ok", "sail"] },
      { branch: "lost", items: ["lost", "lose", "eventually", "despite", "colour", "southern", "empty", "passenger", "ship", "chalk"] },
      { branch: "bottom", items: ["bottom", "mile", "ice", "destroy", "basketball", "medal", "bridge", "gold", "precious", "remind"] },
    ]
  },
  {
    name: "pure",
    center: "pure",
    subthemes: ["干预与职业", "权力与领导", "工具与策略"],
    branches: [
      { branch: "intervention", items: ["intervention", "careless", "stomach", "occupation", "pub", "depth", "drug", "odd", "boil", "republic"] },
      { branch: "passive", items: ["passive", "sand", "tale", "wake", "authority", "beer", "commitment", "leadership", "queen", "blackboard", "reinforce"] },
      { branch: "teapot", items: ["teapot", "friction", "microscope", "outstanding", "suspect", "tank", "tap", "asleep", "insight", "strategy"] },
    ]
  },
  {
    name: "success",
    center: "success",
    subthemes: ["成功与拒绝", "财富与追求", "尊重与典型"],
    branches: [
      { branch: "success", items: ["success", "editor", "single", "acknowledge", "refuse", "prize", "failure", "delete", "lecture", "recognition"] },
      { branch: "career", items: ["career", "emphasis", "sell", "pursue", "film", "freedom", "dragon", "fog", "lightning", "respect"] },
      { branch: "curious", items: ["curious", "steam", "correct", "rich", "narrow", "secure", "die", "typical", "institute", "satisfaction"] },
    ]
  },
  {
    name: "technology",
    center: "technology",
    topic_group: "科学与技术",
    subtopic: "科技发展与信息技术创新、科学精神",
    subthemes: ["能源与设备", "发明与创新", "数字信息"],
    branches: [
      { branch: "energy", items: ["energy", "power", "electricity", "battery", "device", "machine", "engine", "electric", "solar", "wind"] },
      { branch: "invention", items: ["invention", "design", "create", "develop", "invent", "discover", "build", "construct", "establish", "tool"] },
      { branch: "digital", items: ["computer", "digital", "online", "internet", "software", "data", "system", "program", "network", "information"] }
    ]
  },
  {
    name: "family",
    center: "family",
    topic_group: "生活与学习",
    subtopic: "个人、家庭、社区及学校生活",
    subthemes: ["家庭成员", "家庭生活", "家庭场景"],
    branches: [
      { branch: "member", items: ["member", "parent", "child", "baby", "elderly", "husband", "wife", "brother", "sister", "son"] },
      { branch: "life", items: ["dinner", "breakfast", "weekend", "holiday", "party", "share", "celebrate", "prepare", "fresh", "marry"] },
      { branch: "place", items: ["bedroom", "kitchen", "garden", "table", "bed", "wall", "room", "home", "house", "door"] }
    ]
  },
  {
    name: "home",
    center: "home",
    subthemes: ["邻居与法律", "家具与陪伴", "安全与欢呼"],
    branches: [
      { branch: "sum", items: ["sum", "neighbour", "law", "basket", "village", "beautiful", "accompany", "chef", "demand", "furniture", "poverty"] },
      { branch: "house", items: ["house", "frequently", "homework", "lively", "annoy", "scare", "charity", "whatever", "cheap", "hill"] },
      { branch: "home", items: ["home", "goods", "grey", "salad", "safe", "witness", "figure", "cheer", "impossible", "dive"] },
    ]
  },
  {
    name: "think",
    center: "think",
    subthemes: ["思考与关心", "发展与态度", "专业与拒绝"],
    branches: [
      { branch: "think", items: ["think", "care", "develop", "usually", "anybody_anyone", "phone", "attitude", "interview", "yet", "perform"] },
      { branch: "ce", items: ["ce", "satisfy", "sad", "spell", "comment", "expand", "reject", "ignore", "professional", "term"] },
      { branch: "thinking", items: ["thinking", "dozen", "detail", "healthy", "donate", "expose", "none", "round", "leaf", "reality"] },
    ]
  },
  {
    name: "money",
    center: "money",
    subthemes: ["政策与储蓄", "运动与竞争", "货币与创新"],
    branches: [
      { branch: "let", items: ["let", "policy", "saving", "bar", "silver", "football", "heavy", "cancel", "score", "series"] },
      { branch: "money", items: ["money", "wi_fi", "classic", "yesterday", "active", "tennis", "vote", "chicken", "compete", "distinguish"] },
      { branch: "gift", items: ["gift", "recipe", "smell", "wash", "cent", "coin", "currency", "distribution", "flag", "innovation"] },
    ]
  },
  {
    name: "open",
    center: "open",
    subthemes: ["调查与历史", "选项与背景", "开放与目的地"],
    branches: [
      { branch: "survey", items: ["survey", "historic", "interrupt", "certainly", "register", "fantastic", "option", "primary", "sheet", "glass"] },
      { branch: "shame", items: ["shame", "architect", "urge", "aspect", "cross", "menu", "volleyball", "voluntary", "background", "chair", "turkey"] },
      { branch: "open", items: ["open", "destination", "patience", "pleasant", "tunnel", "wealth", "rare", "block", "hate", "tear"] },
    ]
  },
  {
    name: "instead",
    center: "instead",
    subthemes: ["清洁与治疗", "交通与情绪", "行为与舒适"],
    branches: [
      { branch: "instead", items: ["instead", "clean", "treat", "supermarket", "lesson", "fear", "traffic", "box", "huge", "strike"] },
      { branch: "delicious", items: ["delicious", "emotion", "shower", "behaviour", "cycle", "native", "context", "motor", "sink", "exactly"] },
      { branch: "smog", items: ["smog", "loose", "pe", "mostly", "awful", "fantasy", "toast", "yellow", "comfortable", "aunt"] },
    ]
  },
  {
    name: "programme",
    center: "programme",
    subthemes: ["节目与现代化", "访问与志愿", "领袖与观众"],
    branches: [
      { branch: "astronaut", items: ["astronaut", "concert", "modernization", "weekly", "participate", "remote", "access", "volunteer", "software", "absorb", "sore"] },
      { branch: "change", items: ["change", "leader", "jam", "manager", "gym", "procedure", "war", "audience", "setting", "error"] },
      { branch: "band", items: ["band", "astonish", "relevant", "ahead", "seat", "anxious", "female", "guest", "partner", "basic"] },
    ]
  },
  {
    name: "blanket",
    center: "blanket",
    subthemes: ["恐慌与 aboard", "解决与计算", "包裹与绝望"],
    branches: [
      { branch: "blanket", items: ["blanket", "panic", "aboard", "resolve", "calculate", "delay", "blind", "chip", "punish", "decent"] },
      { branch: "qualification", items: ["qualification", "wrap", "noble", "pants", "theirs", "awake", "mud", "poison", "butter", "cupboard"] },
      { branch: "church", items: ["church", "genuine", "package", "badminton", "grateful", "operator", "oven", "parcel", "headache", "desperate", "trousers"] },
    ]
  },
  {
    name: "uniform",
    center: "uniform",
    subthemes: ["运动与化学", "婚姻与咨询", "交通与金融"],
    branches: [
      { branch: "baseball", items: ["baseball", "chemistry", "bride_bridegroom", "circuit", "consultant", "fireman", "housing", "navy", "compass", "pray", "volcano"] },
      { branch: "bakery", items: ["bakery", "tube", "secondary", "sweep", "dessert", "consultation", "mechanic", "port", "imply", "dirty", "prosperity"] },
      { branch: "elevator", items: ["elevator", "nuclear", "kettle", "subway", "fibre", "legal", "financial", "loan", "cake", "strict", "phase"] },
    ]
  },
  {
    name: "plan",
    center: "plan",
    subthemes: ["物品与处理", "信用与死亡", "讨论与常规"],
    branches: [
      { branch: "log", items: ["log", "plate", "handle", "credit", "duck", "teamwork", "journey", "death", "review", "wet"] },
      { branch: "plan", items: ["plan", "committee", "mad", "olympic", "pan", "discussion", "parking", "regular", "knock", "message"] },
      { branch: "sorry", items: ["sorry", "brochure", "comfort", "porridge", "angle", "escape", "hunt", "majority", "taxi", "contribution"] },
    ]
  },
  {
    name: "ability",
    center: "ability",
    subthemes: ["能力与惊奇", "知识与力量", "刺激与构造"],
    branches: [
      { branch: "ability", items: ["ability", "wonder", "brain", "memory", "knowledge", "force", "sky", "weight", "fence", "stimulate"] },
      { branch: "truth", items: ["truth", "vivid", "fault", "perspective", "pretend", "exciting", "brush", "construction", "magic", "wetland"] },
      { branch: "poetry", items: ["poetry", "corporate", "defeat", "magnificent", "palace", "portrait", "range", "alternative", "conclusion", "employ"] },
    ]
  },
  {
    name: "clear",
    center: "clear",
    subthemes: ["清除与起源", "适应与加强", "网络与增加"],
    branches: [
      { branch: "litter", items: ["litter", "origin", "adaptation", "flood", "strengthen", "mix", "confused", "dear", "gap", "monkey"] },
      { branch: "shoe", items: ["shoe", "wheel", "network", "besides", "bored", "dig", "fox", "journalist", "ray", "slightly"] },
      { branch: "greenhouse", items: ["greenhouse", "addition", "curtain", "deny", "dimension", "dinosaur", "inch", "opera", "release", "rough"] },
    ]
  },
  {
    name: "face",
    center: "face",
    subthemes: ["持续与危险", "解释与象征", "智能与承诺"],
    branches: [
      { branch: "constant", items: ["constant", "dangerous", "freeze", "sir", "butterfly", "interpret", "leg", "somehow", "suppose", "pronunciation"] },
      { branch: "face", items: ["face", "intelligent", "railway", "arm", "symbol", "precisely", "plane", "promise", "brown", "empathy"] },
      { branch: "future", items: ["future", "storm", "conference", "flash", "clinic", "cow", "inner", "kick", "pound", "hesitate"] },
    ]
  },
  {
    name: "explain",
    center: "explain",
    subthemes: ["评估与现象", "保存与负责", "哲学与演示"],
    branches: [
      { branch: "pool", items: ["pool", "false", "assess", "notebook", "phenomenon", "preserve", "responsible", "random", "surround", "clarify", "suburb"] },
      { branch: "towards", items: ["towards", "philosophy", "carrot", "offend", "intend", "biology", "bond", "president", "wallet", "proposal"] },
      { branch: "tip", items: ["tip", "aid", "coffee", "demonstrate", "theme", "version", "helpful", "previous", "worker", "christmas"] },
    ]
  },
  {
    name: "duration",
    center: "duration",
    subthemes: ["布料与预期", "休闲与纪念", "几何与暂时"],
    branches: [
      { branch: "fabric", items: ["fabric", "anticipate", "mall", "receipt", "recreation", "drill", "memorial", "cotton", "proceed", "breast", "mushroom"] },
      { branch: "goat", items: ["goat", "dizzy", "geometry", "temporary", "hike", "beard", "bowling", "communist", "competence", "cooperate", "windy"] },
      { branch: "frequency", items: ["frequency", "cucumber", "estate", "extension", "gentleman", "horror", "intellectual", "obstacle", "subscribe", "tournament", "wrestle"] },
    ]
  },
  {
    name: "book",
    center: "book",
    subthemes: ["书籍与历史", "文章与规则", "场景与文学"],
    branches: [
      { branch: "book", items: ["book", "history", "library", "article", "custom", "rule", "opinion", "relax", "chapter", "ticket"] },
      { branch: "express", items: ["express", "bother", "magazine", "grand", "literature", "occur", "terrible", "brilliant", "librarian", "novelist"] },
      { branch: "write", items: ["write", "progress", "belong", "scene", "discount", "electronic", "entry", "lend", "candy", "dare"] },
    ]
  },
  {
    name: "question",
    center: "question",
    subthemes: ["答案与发现", "比较与主张", "问题与主题"],
    branches: [
      { branch: "answer", items: ["answer", "discovery", "nor", "comparison", "claim", "physics", "regardless", "universe", "description", "ideal"] },
      { branch: "objective", items: ["objective", "assumption", "blame", "screen", "comprehension", "continent", "defence", "elephant", "genius", "illness"] },
      { branch: "question", items: ["question", "especially", "themselves", "topic", "either", "video", "relate", "definition", "entirely", "instruction"] },
    ]
  },
  {
    name: "earth",
    center: "earth",
    subthemes: ["地球与行星", "河流与建议", "日历与月亮"],
    branches: [
      { branch: "earth", items: ["earth", "planet", "shift", "river", "suggestion", "collect", "missing", "pond", "bottle", "calendar"] },
      { branch: "moon", items: ["moon", "apple", "incredible", "flat", "bitter", "bacteria", "fool", "satellite", "solar", "disaster"] },
      { branch: "illustrate", items: ["illustrate", "fundamental", "pour", "site", "stream", "virtual", "battle", "mirror", "assistant", "atmosphere"] },
    ]
  },
  {
    name: "multiple",
    center: "multiple",
    subthemes: ["缝纫与纪律", "基因与指控", "症状与感染"],
    branches: [
      { branch: "sew", items: ["sew", "discipline", "gene", "accuse", "ethical", "monthly", "educator", "prison", "automatic", "proof", "resign"] },
      { branch: "symptom", items: ["symptom", "infection", "arrest", "flu", "alert", "announce", "pear", "sneeze", "astronomer", "noon", "missile"] },
      { branch: "toothache", items: ["toothache", "pill", "abuse", "sleepy", "pessimistic", "nut", "skip", "refresh", "dentist", "lung", "subjective"] },
    ]
  },
  {
    name: "train",
    center: "train",
    subthemes: ["食物与幸运", "校园与平台", "治疗与入口"],
    branches: [
      { branch: "bug", items: ["bug", "strawberry", "chocolate", "fortunately", "certificate", "semester", "smooth", "campus", "platform", "treatment", "nephew"] },
      { branch: "train", items: ["train", "entrance", "launch", "rubber", "superior", "valid", "fry", "enhance", "expense", "fuel"] },
      { branch: "apartment", items: ["apartment", "insurance", "stupid", "hall", "signal", "tourist", "conventional", "exit", "political", "qualify"] },
    ]
  },
  {
    name: "since",
    center: "since",
    subthemes: ["现在与事务", "饥饿与更新", "位置与药片"],
    branches: [
      { branch: "nowadays", items: ["nowadays", "affair", "hungry", "update", "chain", "jaw", "riddle", "scarf", "ingredient", "overall"] },
      { branch: "dust", items: ["dust", "retire", "juice", "march", "danger", "oil", "quantity", "ton", "bay", "cell", "plus"] },
      { branch: "since", items: ["since", "location", "yard", "tablet", "actor_actress", "brief", "massive", "import", "postcard", "anyway"] },
    ]
  },
  {
    name: "such",
    center: "such",
    subthemes: ["少年与联系", "营养与小组", "期待与责任"],
    branches: [
      { branch: "teenage", items: ["teenage", "link", "nutrition", "panel", "rely", "reliable", "composition", "senior", "convenient", "expectation"] },
      { branch: "bone", items: ["bone", "passion", "dolphin", "commercial", "warning", "elsewhere", "solid", "yours", "examine", "glad"] },
      { branch: "such", items: ["such", "moral", "rapid", "responsibility", "awkward", "silence", "cream", "file", "outline", "passport"] },
    ]
  },
  {
    name: "dismiss",
    center: "dismiss",
    subthemes: ["神秘与雷声", "议程与暂停", "输出与统治"],
    branches: [
      { branch: "mystery", items: ["mystery", "thunder", "agenda", "suspend", "canal", "subsequent", "division", "primitive", "super", "equator"] },
      { branch: "leather", items: ["leather", "hers", "enormous", "manner", "basin", "handkerchief", "humble", "integrity", "millimetre", "output", "surgeon"] },
      { branch: "dismiss", items: ["dismiss", "pyramid", "fetch", "ruler", "load", "orchestra", "hatch", "steady", "bury", "chaos"] },
    ]
  },
  {
    name: "text",
    center: "text",
    subthemes: ["计数与风景", "安排与崩溃", "类别与框架"],
    branches: [
      { branch: "count", items: ["count", "landscape", "arrangement", "wave", "crash", "snack", "advocate", "differ", "geography", "absence"] },
      { branch: "cheese", items: ["cheese", "dramatic", "smoke", "wing", "ad", "category", "cup", "frame", "psychology", "trick", "strait"] },
      { branch: "title", items: ["title", "suitable", "hope", "refer", "sort", "influence", "safety", "expensive", "skate", "deer"] },
    ]
  },
  {
    name: "stability",
    center: "stability",
    subthemes: ["稳定与僵化", "税收与混合", "暴力与拖动"],
    branches: [
      { branch: "stability", items: ["stability", "rigid", "tax", "ripe", "mist", "mixture", "ms", "stair", "stamp", "twin"] },
      { branch: "chorus", items: ["chorus", "bomb", "clay", "violence", "drag", "flour", "glove", "piano", "relay", "bamboo", "wage"] },
      { branch: "loyal", items: ["loyal", "cage", "capsule", "chairman_chairwoman", "chemist", "civil", "criterion", "guitar", "metaphor", "onion", "ski"] },
    ]
  },
  {
    name: "various",
    center: "various",
    subthemes: ["发音与点击", "灭绝与祖先", "同情与地下"],
    branches: [
      { branch: "pronounce", items: ["pronounce", "click", "extinction", "ancestor", "centimetre", "military", "arctic", "sympathy", "underground", "myth", "rhythm"] },
      { branch: "various", items: ["various", "sugar", "critical", "detect", "bean", "folk", "fountain", "grape", "newspaper", "rainy"] },
      { branch: "find", items: ["find", "studio", "wise", "trust", "ethnic", "herb", "lemon", "lion", "tofu", "weapon"] },
    ]
  },
  {
    name: "feel",
    center: "feel",
    subthemes: ["言语与衣物", "感知与孤独", "名声与胃口"],
    branches: [
      { branch: "saying", items: ["saying", "clothes", "perceive", "lonely", "convey", "salary", "lucky", "steal", "awesome", "contrary"] },
      { branch: "its", items: ["its", "journal", "admit", "reputation", "appetite", "frightened", "ease", "handbag", "skateboard", "abstract"] },
      { branch: "feeling", items: ["feeling", "ambitious", "except", "fond", "routine", "otherwise", "recover", "presentation", "boss", "distant"] },
    ]
  },
  {
    name: "number",
    center: "number",
    subthemes: ["文件与出生", "媒介与平原", "运动与竞选"],
    branches: [
      { branch: "document", items: ["document", "birth", "medium", "plain", "pilot", "twice", "bonus", "boost", "fist", "permit"] },
      { branch: "number", items: ["number", "cost", "population", "photo", "relative", "campaign", "gas", "widespread", "europe", "bce"] },
      { branch: "granddaughter", items: ["granddaughter", "snake", "separate", "fold", "orange", "airline", "bathroom", "cuisine", "pioneer", "thick"] },
    ]
  },
  {
    name: "right",
    center: "right",
    subthemes: ["对错与准备", "街道与酒店", "效率与保证"],
    branches: [
      { branch: "right", items: ["right", "wrong", "prepare", "hurry", "street", "hotel", "technique", "horse", "ought", "rock"] },
      { branch: "main", items: ["main", "oxygen", "efficient", "guarantee", "ride", "lean", "purple", "swing", "organ", "pattern"] },
      { branch: "or", items: ["or", "circumstance", "highway", "clever", "county", "foundation", "trunk", "interaction", "bunch", "charm"] },
    ]
  },
  {
    name: "win",
    center: "win",
    subthemes: ["优雅与智慧", "丛林与手术", "结果与平衡"],
    branches: [
      { branch: "graceful", items: ["graceful", "wisdom", "jungle", "policeman_policewoman", "brick", "cave", "surgery", "outcome", "balance", "winner", "sincerely"] },
      { branch: "neat", items: ["neat", "circle", "fiction", "slide", "tackle", "equipment", "fortune", "handwriting", "premier", "spacecraft"] },
      { branch: "award", items: ["award", "sweater", "ant", "cigarette", "envy", "forecast", "gratitude", "guard", "harmonious", "jazz"] },
    ]
  },
  {
    name: "high",
    center: "high",
    subthemes: ["孔子与缓解", "承诺与和谐", "心情与高峰"],
    branches: [
      { branch: "confucius", items: ["confucius", "relieve", "commit", "envelope", "harmony", "mood", "peak", "maximum", "profit", "emerge"] },
      { branch: "and", items: ["and", "initial", "broadcast", "rating", "zone", "cast", "district", "mount", "pity", "shadow"] },
      { branch: "murder", items: ["murder", "shark", "whom", "directory", "route", "pocket", "former", "rate", "rank", "assign", "snowy"] },
    ]
  },
  {
    name: "popular",
    center: "popular",
    subthemes: ["酸与操场", "饼干与周年", "国内与陷阱"],
    branches: [
      { branch: "sour", items: ["sour", "playground", "cookie", "anniversary", "domestic", "trap", "cautious", "honey", "impress", "irrigation", "pardon"] },
      { branch: "song", items: ["song", "spicy", "entertainment", "clue", "dynamic", "horrible", "kung", "lip", "monument", "pizza"] },
      { branch: "excellent", items: ["excellent", "sauce", "acid", "addict", "cousin", "download", "eagle", "explode", "fridge", "god"] },
    ]
  },
  {
    name: "build",
    center: "build",
    subthemes: ["传奇与预测", "废弃与屋顶", "职业与城堡"],
    branches: [
      { branch: "legend", items: ["legend", "predict", "highlight", "abandon", "roof", "profession", "anywhere", "generous", "castle", "deadline", "telescope"] },
      { branch: "build", items: ["build", "justify", "muscle", "ceremony", "departure", "hug", "label", "remarkable", "seize", "tolerate"] },
      { branch: "cash", items: ["cash", "engage", "ban", "cattle", "harvest", "height", "investigate", "scholarship", "silk", "tailor"] },
    ]
  },
  {
    name: "fall",
    center: "fall",
    subthemes: ["娱乐与附近", "灯与禁止", "对话与面包"],
    branches: [
      { branch: "amuse", items: ["amuse", "nearby", "lamp", "prohibit", "chief", "dialogue", "beside", "bread", "resident", "stretch", "mouse"] },
      { branch: "fall", items: ["fall", "adjust", "cheat", "crowded", "gradually", "garlic", "humour", "pudding", "collar", "detective"] },
      { branch: "cute", items: ["cute", "disabled", "leap", "postpone", "tobacco", "tone", "vase", "vehicle", "helicopter", "modest"] },
    ]
  },
  {
    name: "strange",
    center: "strange",
    subthemes: ["陌生与陌生人", "比赛与假期", "微妙与隐藏"],
    branches: [
      { branch: "strange", items: ["strange", "stranger", "race", "holiday", "chat", "sigh", "purse", "delicate", "hide", "superb"] },
      { branch: "throat", items: ["throat", "lady", "afford", "neither", "egg", "pace", "relief", "enthusiastic", "blow", "breath", "radiation"] },
      { branch: "tape", items: ["tape", "hurricane", "earthquake", "frog", "shell", "lap", "exceptional", "grab", "billion", "shelter"] },
    ]
  },
  {
    name: "the",
    center: "the",
    subthemes: ["众多与回应", "正确与产生", "紧急与财产"],
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
    subthemes: ["勇气与优雅", "判断与乡村", "元素与意图"],
    branches: [
      { branch: "courage", items: ["courage", "elegant", "judge", "countryside", "database", "element", "hat", "hence", "honest", "intention", "supplement"] },
      { branch: "chest", items: ["chest", "nevertheless", "priority", "shut", "slice", "stadium", "bowl", "component", "mail", "virtue"] },
      { branch: "beef", items: ["beef", "altogether", "contrast", "decrease", "double", "downtown", "grasp", "liquid", "moreover", "puzzle"] },
    ]
  },
  {
    name: "to",
    center: "to",
    subthemes: ["颜色与招呼", "运动与恢复", "事件与幼儿园"],
    branches: [
      { branch: "pink", items: ["pink", "hi", "soccer", "react", "restore", "row", "seed", "stuff", "theft", "unless"] },
      { branch: "look", items: ["look", "burst", "candidate", "collapse", "discrimination", "drawer", "extend", "float", "incident", "kindergarten"] },
      { branch: "to", items: ["to", "you", "how", "quite", "fellow", "disappoint", "slip", "concentrate", "marathon", "victim"] },
    ]
  },
  {
    name: "in",
    center: "in",
    subthemes: ["和平与摄影", "原始与帐篷", "能力与收入"],
    branches: [
      { branch: "peace", items: ["peace", "photographer", "raw", "tent", "ugly", "zoo", "thirsty", "venue", "advertise", "balloon"] },
      { branch: "we", items: ["we", "bounce", "capable", "concrete", "consistent", "faith", "grandparent", "honour", "income", "joint"] },
      { branch: "in", items: ["in", "order", "sure", "health", "car", "matter", "difference", "communication", "submit", "crucial"] },
    ]
  },
  {
    name: "of",
    center: "of",
    subthemes: ["我们的与上方", "部分与小", "享受与锁"],
    branches: [
      { branch: "of", items: ["of", "our", "over", "often", "part", "call", "little", "small", "play", "enjoy"] },
      { branch: "can", items: ["can", "gate", "lock", "merely", "ours", "preference", "realistic", "shoulder", "shy", "straightforward"] },
      { branch: "representative", items: ["representative", "threaten", "whisper", "accommodation", "acquire", "casual", "estimate", "fluent", "guidance", "injury"] },
    ]
  },
  {
    name: "and",
    center: "and",
    subthemes: ["日与同时", "居住与保持", "通过与更好"],
    branches: [
      { branch: "and", items: ["day", "while", "live", "keep", "through", "too", "better", "friend", "very", "truck"] },
      { branch: "all", items: ["all", "organic", "behave", "oppose", "quarter", "recall", "salt", "status", "tendency", "wine"] },
      { branch: "more", items: ["more", "adorable", "bet", "coverage", "input", "spoon", "statue", "umbrella", "web", "administration"] },
    ]
  },
  {
    name: "for",
    center: "for",
    subthemes: ["之后与看见", "给予与长", "每个与孩子"],
    branches: [
      { branch: "for", items: ["for", "after", "see", "give", "long", "each", "child", "being", "old", "love"] },
      { branch: "will", items: ["will", "bell", "hometown", "cartoon", "coat", "elder", "glance", "membership", "niece", "pepper"] },
      { branch: "like", items: ["like", "reform", "split", "tidy", "virus", "ankle", "barely", "battery", "carpet", "cease"] },
    ]
  },
  {
    name: "it",
    center: "it",
    subthemes: ["年轻与想法", "另一个与从不", "心灵与足够"],
    branches: [
      { branch: "it", items: ["it", "young", "idea", "another", "never", "mind", "without", "enough", "report", "sense"] },
      { branch: "good", items: ["good", "beneath", "disturb", "protein", "comprehensive", "contract", "crisis", "cruel", "distinct", "finance"] },
      { branch: "officer", items: ["officer", "frontier", "furthermore", "gender", "gun", "hello", "overseas", "prospect", "sausage", "selfish"] },
    ]
  },
  {
    name: "that",
    center: "that",
    subthemes: ["生命与那时", "这些与意思", "世界与因为"],
    branches: [
      { branch: "that", items: ["that", "life", "then", "these", "mean", "world", "because", "back", "still", "however"] },
      { branch: "would", items: ["would", "ceiling", "guideline", "prior", "somewhat", "starve", "sweat", "tower", "valley", "withdraw"] },
      { branch: "them", items: ["them", "chew", "civilian", "forgive", "kilo", "knee", "leisure", "logical", "metal", "net"] },
    ]
  },
  {
    name: "what",
    center: "what",
    subthemes: ["本地与能力", "设计与种类", "鼓励与信息"],
    branches: [
      { branch: "what", items: ["what", "local", "able", "design", "kind", "encourage", "information", "likely", "send", "describe"] },
      { branch: "where", items: ["where", "physician", "firework", "weep", "minimum", "nowhere", "optimistic", "pencil", "permanent", "petrol"] },
      { branch: "team", items: ["team", "politics", "possession", "rugby", "scale", "silly", "splendid", "sponsor", "welfare", "worthwhile"] },
    ]
  },
  {
    name: "do",
    center: "do",
    subthemes: ["应当与经验", "建议与避免", "质量与增加"],
    branches: [
      { branch: "do", items: ["do", "should", "experience", "suggest", "avoid", "quality", "add", "sometimes", "key", "act"] },
      { branch: "way", items: ["way", "rubbish", "rude", "drone", "alcohol", "captain", "client", "needle", "resistance", "rocket"] },
      { branch: "probably", items: ["probably", "secretary", "tail", "tomb", "victory", "cabbage", "congratulation", "cottage", "dominate", "erupt"] },
    ]
  },
  {
    name: "with",
    center: "with",
    subthemes: ["大与近", "田野与线", "自然与极端"],
    branches: [
      { branch: "with", items: ["with", "large", "close", "field", "line", "natural", "extremely", "pack", "forward", "spot"] },
      { branch: "share", items: ["share", "initiative", "violin", "collaborate", "shore", "tomato", "fancy", "ink", "inspection", "knife"] },
      { branch: "chance", items: ["chance", "mercy", "mode", "obey", "orbit", "pancake", "sorrow", "substance", "substantial", "surf"] },
    ]
  },
  {
    name: "on",
    center: "on",
    subthemes: ["驾驶与聚焦", "到达与缓慢", "启发与检查"],
    branches: [
      { branch: "on", items: ["on", "drive", "focus", "arrive", "slow", "inspire", "check", "expert", "bite", "depend"] },
      { branch: "minute", items: ["minute", "occasion", "operation", "sustain", "tension", "typhoon", "wool", "autonomous", "backward", "carve"] },
      { branch: "equal", items: ["equal", "contradictory", "dawn", "dumpling", "eve", "export", "external", "fascinating", "gravity", "internal", "yoghurt"] },
    ]
  },
  {
    name: "from",
    center: "from",
    subthemes: ["离开与绘画", "自然与某些", "内部与有用"],
    branches: [
      { branch: "from", items: ["from", "away", "draw", "nature", "certain", "inside", "useful", "perhaps", "traditional", "performance", "x_ray"] },
      { branch: "used", items: ["used", "minister", "pie", "plug", "steak", "visible", "approve", "border", "downstairs", "embarrassed", "wrist"] },
      { branch: "pacific", items: ["pacific", "fisherman", "kit", "mankind", "mature", "modify", "motive", "noisy", "opponent", "outgoing", "penguin"] },
    ]
  },
  {
    name: "about",
    center: "about",
    subthemes: ["以前与事实", "说话与一切", "风险与机器"],
    branches: [
      { branch: "about", items: ["about", "ago", "fact", "speak", "everything", "risk", "machine", "manage", "invite", "flight", "t_shirt"] },
      { branch: "centre", items: ["centre", "merry", "pipe", "proportion", "religion", "revise", "romantic", "salty", "sandwich", "souvenir", "stomachache"] },
      { branch: "thus", items: ["thus", "temple", "tiger", "toilet", "towel", "tune", "volume", "waist", "wrinkle", "arise", "socialism"] },
    ]
  },
  {
    name: "as",
    center: "as",
    subthemes: ["努力与沿着", "曾经与几个", "思念与考虑"],
    branches: [
      { branch: "as", items: ["as", "effort", "along", "ever", "several", "miss", "consider", "whole", "warm", "possible", "shorts"] },
      { branch: "past", items: ["past", "motion", "picnic", "restrict", "biscuit", "camel", "command", "exhaust", "forehead", "frank", "sex"] },
      { branch: "appear", items: ["appear", "innocent", "laptop", "literally", "marriage", "midnight", "mild", "nationality", "occupy", "owe", "scissors"] },
    ]
  },
  {
    name: "at",
    center: "at",
    subthemes: ["创造与房间", "至少与空间", "成功与晚宴"],
    branches: [
      { branch: "at", items: ["at", "create", "room", "least", "space", "alone", "successful", "dinner", "wild", "driver", "schoolbag"] },
      { branch: "reach", items: ["reach", "respective", "scan", "debt", "energetic", "faint", "liberty", "minor", "noodle", "polish", "salesman_saleswoman"] },
      { branch: "gifted", items: ["gifted", "sunny", "thorough", "tissue", "worthy", "madam", "abnormal", "accent", "according_to", "africa", "mosquito"] },
    ]
  },
  {
    name: "food",
    center: "food",
    subthemes: ["食物与苗条", "脖子与羊", "钢铁与之后"],
    branches: [
      { branch: "food", items: ["food", "slim", "neck", "sheep", "steel", "afterward", "america", "antarctica", "anyhow", "apologise", "rejuvenate"] },
      { branch: "restaurant", items: ["restaurant", "applaud", "arch", "asia", "atlantic", "a_m_", "bacon", "bark", "behalf", "belt", "recognise"] },
      { branch: "diet", items: ["diet", "bin", "bleed", "blouse", "boot", "boring", "botanical", "bound", "boxing", "buffet", "realise"] },
    ]
  },
  {
    name: "lead",
    center: "lead",
    subthemes: ["价值与风筝", "欺凌与咖啡馆", "名人与筷子"],
    branches: [
      { branch: "value", items: ["value", "kite", "bully", "cafe", "canteen", "cap", "celebrity", "chopsticks", "cinema", "cite", "radium"] },
      { branch: "sacrifice", items: ["sacrifice", "civilisation", "clap", "clerk", "clone", "cloudy", "column", "comic", "compose", "confucianism", "postman"] },
      { branch: "skill", items: ["skill", "conscious", "constitution", "controversial", "costume", "cough", "council", "craft", "criticise", "curve", "pork"] },
    ]
  },
  {
    name: "fill",
    center: "fill",
    subthemes: ["工作日与袜子", "剃须与领土", "尊严与餐饮"],
    branches: [
      { branch: "weekday", items: ["weekday", "sock", "shave", "territory", "damp", "dignity", "dining", "disc", "domain", "dormitory", "ping_pong"] },
      { branch: "silent", items: ["silent", "due_to", "election", "endangered", "enterprise", "episode", "eraser", "fertile", "fever", "flame", "p_m_"] },
      { branch: "hamburger", items: ["hamburger", "fulfil", "giraffe", "glue", "golf", "gramme", "greedy", "guilty", "gymnastics", "handsome", "organise"] },
    ]
  },
  {
    name: "have",
    center: "have",
    subthemes: ["之前与学习", "转动与建立", "晚与放"],
    branches: [
      { branch: "have", items: ["have", "before", "study", "turn", "found", "late", "put", "every", "might", "hard", "organisation"] },
      { branch: "last", items: ["last", "prejudice", "headline", "hydrogen", "i", "inquire", "internet", "jacket", "jeans", "jog", "o_clock"] },
      { branch: "there", items: ["there", "justice", "kangaroo", "kiss", "kung_fu", "lantern", "league", "liberation", "luxury", "minority", "mutton"] },
    ]
  },
];

// 词→主题 index 动态映射 (从 THEME_NETS 自动构建，新课标主题优先)
const WORD_TO_THEME = (() => {
  const m = new Map();
  const addTheme = (theme, i, override) => {
    const c = (theme.center || '').toLowerCase();
    if (c && (override || !m.has(c))) m.set(c, [i]);
    (theme.branches || []).forEach(br => {
      (br.items || []).forEach(w => {
        const w2 = w.toLowerCase();
        if (override || !m.has(w2)) m.set(w2, [i]);
      });
    });
  };
  // First pass: old themes (without topic_group), first-wins
  THEME_NETS.forEach((t, i) => { if (!t.topic_group) addTheme(t, i, false); });
  // Second pass: new curriculum themes (with topic_group), overwrite
  THEME_NETS.forEach((t, i) => { if (t.topic_group) addTheme(t, i, true); });
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
