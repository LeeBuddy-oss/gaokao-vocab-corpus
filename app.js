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
    // 词条（小文件）与思维导图（已预热）并行加载
    const [res] = await Promise.all([fetch(WORDS_BASE + rel), ensureMindmap(letter)]);
    if (!res.ok) { renderNotFound(word); return; }
    const entry = await res.json();
    $empty.hidden = true;
    const mmHtml = renderMindMap(word, entry);
    renderEntry(entry, word, mmHtml);
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

/* ========== 词汇风向标渲染器 ========== */

// 从词条数据中提取风向标统计
function analyzeWindVane(word, entry) {
  const meta = entry.meta || {};
  const defs = entry.defs || [];
  const mm = _getMmData(word);

  // 统计每个释义的例句数 & 来源分布
  let totalGaokao = 0, totalTextbook = 0;
  const senseBars = [];   // { label, count, gaokao, textbook, defText }
  const srcSet = new Set(); // 收集所有来源（用于文体判断）
  const phraseMap = {};    // 短语计数

  defs.forEach((d, idx) => {
    const exs = d.ex || [];
    let gk = 0, tb = 0;
    exs.forEach(ex => {
      const src = ex.src || '';
      srcSet.add(src);
      if (isGaokaoSrc(src)) { gk++; totalGaokao++; }
      else { tb++; totalTextbook++; }
      // 提取含查询词的短语
      _extractPhrases(ex.s || '', word, phraseMap);
    });
    const count = exs.length;
    if (count > 0 || d.def) {
      // 提取释义中文摘要（取括号内中文或前20字）
      const label = _extractSenseLabel(d.def, idx + 1);
      senseBars.push({ label, count, gaokao: gk, textbook: tb, defText: d.def || '', idx });
    }
  });

  // 合并思维导图中的短语数据
  if (mm && mm.right) {
    mm.right.forEach(p => {
      const ph = (p.phrase || '').trim().toLowerCase();
      if (ph) {
        phraseMap[ph] = Math.max(phraseMap[ph] || 0, p.cnt || 0);
      }
    });
  }

  // 按例句数降序排列，取 top 6
  senseBars.sort((a, b) => b.count - a.count);
  const topSenses = senseBars.slice(0, 6);

  // Top 短语（按频次排序）
  const topPhrases = Object.entries(phraseMap)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([ph, cnt]) => ({ ph, cnt }));

  // 判断常见文体
  const genres = _detectGenres([...srcSet]);

  return {
    word,
    pos: meta.pos || '',
    posFull: mm && mm.pos_full ? mm.pos_full : '',
    total: totalGaokao + totalTextbook,
    totalGaokao,
    totalTextbook,
    senses: topSenses,
    allSenseCount: senseBars.length,
    phrases: topPhrases,
    genres,
    hasData: totalGaokao + totalTextbook > 0,
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

// 提取释义的中文短标签
function _extractSenseLabel(defText, idx) {
  if (!defText) return `义项 ${idx}`;
  // 优先提取括号内的中文 （代表数量…）
  const cnMatch = defText.match(/（([^）]{2,18}?)）/);
  if (cnMatch) return cnMatch[1];
  // 取前 18 个字符
  return defText.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '').slice(0, 18) || `义项 ${idx}`;
}

// 从句子中提取含查询词的短语
function _extractPhrases(sentence, word, map) {
  if (!sentence || !word) return;
  const w = word.toLowerCase();
  const re = new RegExp('\\b[a-zA-Z ]{0,12}' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-zA-Z ]{0,12}\\b', 'gi');
  const matches = sentence.match(re);
  if (matches) {
    matches.forEach(m => {
      const ph = m.trim().toLowerCase();
      if (ph.length >= w.length + 2 && ph.length <= 30) {
        map[ph] = (map[ph] || 0) + 1;
      }
    });
  }
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

// ====== 渲染风向标主函数 ======
function renderMindMap(word, entry) {
  const data = analyzeWindVane(word, entry);
  if (!data.hasData && data.senses.length === 0) return '';

  const maxCount = Math.max(...data.senses.map(s => s.count), 1);

  // ---- 左侧柱状图 ----
  let barsHtml = '';
  data.senses.forEach(s => {
    const pct = Math.round(s.count / maxCount * 100);
    const barW = Math.max(pct, s.count > 0 ? 8 : 0);
    barsHtml += `<div class="wv-bar-row">
      <span class="wv-bar-label" title="${esc(s.defText)}">${esc(s.label)}</span>
      <div class="wv-bar-track">
        <div class="wv-bar-fill" style="width:${barW}%"></div>
        ${s.count > 0 ? `<span class="wv-bar-val">${s.count}</span>` : ''}
      </div>
    </div>`;
  });

  // ---- 右侧文字分析 ----
  const totalAll = data.totalGaokao + data.totalTextbook;
  let analysisHtml = '';
  analysisHtml += `<p class="wv-lead"><b>${esc(data.word)}</b>在十年高考真题与教材中共出现<b>${totalAll}</b>词次，其中：</p>`;
  let rightLines = [];

  // 分释义描述
  if (data.senses.length > 0) {
    data.senses.forEach((s, i) => {
      if (s.count === 0) return;
      const parts = [];
      parts.push(`「${esc(s.label)}」`);
      parts.push(`出现${s.gaokao + s.textbook}次`);
      if (s.gaokao > 0) parts.push(`（高考${s.gaokao}次）`);
      // 文体提示
      if (data.genres.types.length > 0) {
        const topGenre = data.genres.types[0].t;
        if (i === 0 || s.gaokao >= 3) parts.push(`，常出现在<span class="wv-hl">${esc(topGenre)}</span>类试题中`);
      }
      rightLines.push(`（${i + 1}）${parts.join('')}；`);
    });
  }

  // 高频短语
  if (data.phrases.length > 0) {
    const phList = data.phrases.slice(0, 5).map(p =>
      `<span class="wv-hl">${esc(p.ph)}</span>（${p.cnt}次）`
    ).join('、');
    rightLines.push(`高频搭配：${phList}。`);
  }

  analysisHtml += `<div class="wv-body">`;
  rightLines.forEach(line => {
    analysisHtml += `<p class="wv-line">${line}</p>`;
  });
  analysisHtml += `</div>`;

  return `<div class="wv-wrap">
    <div class="wv-header">
      <span class="wv-title">词汇风向标</span>
      <span class="wv-subtitle">${esc(word)}特征归纳</span>
    </div>
    <div class="wv-content">
      <div class="wv-left">
        <div class="wv-chart-title">${esc(word)}义项</div>
        <div class="wv-bars">${barsHtml}</div>
      </div>
      <div class="wv-right">
        ${analysisHtml}
      </div>
    </div>
  </div>`;
}

/* ========== 词条渲染 ========== */

function renderEntry(entry, word, mmHtml) {
  const meta = entry.meta || {};
  let html = '';

  // 思维导图（如果有）
  if (mmHtml) {
    html += mmHtml;
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
    html += `<div class="def">` +
      `<div class="def-title"><span class="def-idx">释义 ${idx + 1}</span></div>` +
      (d.def ? `<div class="def-text">${esc(d.def)}</div>` : '');
    const exs = d.ex || [];
    if (!exs.length) {
      html += `<div class="def-empty">本义项下暂无例句。</div>`;
    }
    exs.forEach(ex => {
      const cat = ex.cat || classify(ex.src);
      html += `<div class="ex s-${cat}">` +
        `<div class="ex-sentence">${highlight(ex.s || '', word)}</div>` +
        (ex.src ? `<span class="badge">${esc(ex.src)}</span>` : '') +
        (ex.t ? `<div class="ex-trans">${esc(ex.t)}</div>` : '') +
        `</div>`;
    });
    html += `</div>`;
  });
  $result.innerHTML = html;
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
