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

const $search = document.getElementById('search');
const $suggest = document.getElementById('suggest');
const $result = document.getElementById('result');
const $empty = document.getElementById('empty');

init();

async function init() {
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
    $empty.hidden = true;
    const mmHtml = renderMindMap(word, entry);
    renderEntry(entry, word, mmHtml, fam);
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

function renderEntry(entry, word, mmHtml, fam) {
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
        `<div class="ex-num">(${exIdx + 1})</div>` +
        `<div class="ex-sentence">${highlight(ex.s || '', word)}</div>` +
        (ex.src ? `<span class="badge">${esc(ex.src)}</span>` : '') +
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
function highlight(s, word) {
  const base = esc(s);
  const w = (word || '').trim();
  if (!w) return base;
  const safe = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    return base.replace(new RegExp('(' + safe + ')', 'gi'), '<mark>$1</mark>');
  } catch (e) { return base; }
}
function fmt(n) { return (n || 0).toLocaleString('en-US'); }
