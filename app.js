const WORDS_URL = 'data/words.json';
const INDEX_BASE = 'data/index/';
const MINDMAP_BASE = 'data/mindmap/';
const STATS_URL = 'data/stats.json';

const CATS = [
  { key: 'gaokao',   label: '高考真题', color: 'var(--gaokao)' },
  { key: 'renjiao',  label: '人教版',   color: 'var(--renjiao)' },
  { key: 'waiyan',   label: '外研社',   color: 'var(--waiyan)' },
  { key: 'beishida', label: '北师大',   color: 'var(--beishida)' },
  { key: 'yilin',    label: '译林',     color: 'var(--yilin)' },
];

let WORDS = [];
const cache = {};        // letter -> { word: entry }
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
    const r = await fetch(WORDS_URL);
    WORDS = await r.json();
  } catch (e) {
    console.error('加载词表失败', e);
  }
  bindEvents();
}

function loadStats() {
  fetch(STATS_URL).then(r => (r.ok ? r.json() : null)).then(s => {
    if (!s) return;
    document.getElementById('stats').innerHTML =
      `<span><b>${s.words}</b> 课标词</span>` +
      `<span><b>${fmt(s.cats.gaokao)}</b> 真题例句</span>` +
      `<span><b>${fmt(s.totalTextbook)}</b> 教材例句</span>`;
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

async function search(rawWord) {
  const word = (rawWord || '').trim();
  if (!word) return;
  const letter = (/^[a-z]/i.test(word) ? word[0].toLowerCase() : '#');
  if (!cache[letter]) {
    try {
      const r = await fetch(INDEX_BASE + letter + '.json');
      cache[letter] = await r.json();
    } catch (e) {
      console.error('加载索引失败', e);
      cache[letter] = {};
    }
  }
  // 并行加载思维导图数据
  loadMindmap(letter);
  const entry = cache[letter][word] || cache[letter][word.toLowerCase()];
  $empty.hidden = true;
  if (!entry) { renderNotFound(word); return; }
  // 先渲染思维导图，再渲染词条
  const mmHtml = await renderMindMap(word, entry);
  renderEntry(entry, word, mmHtml);
}

function renderNotFound(word) {
  $result.innerHTML = `<div class="notfound">未找到「${esc(word)}」。试试课标词表里的其它词～</div>`;
}

/* ========== 思维导图渲染器 ========== */

const MM_COLORS = {
  title: '#1e3a8a',
  ovalFill: '#9b6fba',     // 紫色椭圆填充
  ovalStroke: '#7a4fa3',
  ovalText: '#fff',        // 椭圆内文字白色
  branchText: '#8B0000',   // 分支文字深红色
  lineColor: '#5a7ba8',    // 连线蓝灰色
  rightText: '#A52A2A',    // 右侧短语深红
  posLabel: '#c44',        // 词性标签
};

async function loadMindmap(letter) {
  if (mmCache[letter]) return mmCache[letter];
  try {
    const r = await fetch(MINDMAP_BASE + letter + '.json');
    mmCache[letter] = await r.json();
  } catch (e) {
    mmCache[letter] = {};
  }
  return mmCache[letter];
}

function renderMindMap(word, entry) {
  const letter = (/^[a-z]/i.test(word) ? word[0].toLowerCase() : '#');
  const mm = mmCache[letter] ? (mmCache[letter][word] || mmCache[letter][word.toLowerCase()]) : null;
  if (!mm) return '';

  const pos = mm.pos || '';
  const left = mm.left || [];
  const right = mm.right || [];

  // SVG 尺寸
  const W = 720, H = Math.max(380, left.length * 62 + right.length * 50 + 120);
  const cx = W * 0.52;       // 中心 x（稍偏右给左侧留更多空间）
  const cy = H * 0.48;       // 中心 y

  let svg = '';

  // ---- 连线 ----
  // 左分支连线
  const leftCount = left.length;
  left.forEach((b, i) => {
    const lx = 55;
    const ly = 45 + i * (H - 90) / Math.max(leftCount, 1);
    svg += `<line x1="${lx + 100}" y1="${ly}" x2="${cx - 68}" y2="${cy}" stroke="${MM_COLORS.lineColor}" stroke-width="1.2"/>`;
  });
  // 右分支连线
  const rightCount = right.length;
  right.forEach((b, i) => {
    const rx = W - 40;
    const ry = 50 + i * (H - 100) / Math.max(rightCount, 1);
    svg += `<path d="M${cx+68} ${cy} L${rx-80} ${ry} L${rx-5} ${ry}" fill="none" stroke="${MM_COLORS.lineColor}" stroke-width="1.2"/>`;
    // 箭头
    svg += `<polygon points="${rx-5},${ry} ${rx-12},${ry-4} ${rx-12},${ry+4}" fill="${MM_COLORS.lineColor}"/>`;
  });

  // ---- 词性标签（左连线中间）----
  if (pos) {
    svg += `<text x="${(55 + 100 + cx - 68) / 2}" y="${cy - 6}" text-anchor="middle" font-size="13" font-style="italic" fill="${MM_COLORS.posLabel}" font-weight="600">${esc(pos)}</text>`;
  }

  // ---- 右词性标签（右连线起点）----
  const posRight = mm.pos_full || '';
  const adjMatch = posRight.match(/(adj\.?|n\.?|adv\.?)/i);
  if (adjMatch) {
    svg += `<text x="${cx + 75}" y="${cy - 6}" font-size="12" font-style="italic" fill="${MM_COLORS.posLabel}" font-weight="600">${esc(adjMatch[1])}</text>`;
  }

  // ---- 左节点（紫色椭圆）----
  left.forEach((b, i) => {
    const lx = 55;
    const ly = 45 + i * (H - 90) / Math.max(leftCount, 1);
    const pattern = esc(b.pattern || '');
    const cn = esc(b.cn || '');
    // 椭圆尺寸根据文本长度自适应
    const pw = Math.max(130, pattern.length * 10 + 30, cn.length * 11 + 20);
    const ph = cn ? 46 : 34;

    svg += `<ellipse cx="${lx + pw/2}" cy="${ly}" rx="${pw/2 + 8}" ry="${ph/2 + 4}" fill="${MM_COLORS.ovalFill}" stroke="${MM_COLORS.ovalStroke}" stroke-width="1"/>`;

    // 英文模式（上）
    svg += `<text x="${lx + pw/2}" y="${ly - (cn ? 4 : 1)}" text-anchor="middle" font-size="13" font-weight="700" fill="${MM_COLORS.branchText}">${pattern}</text>`;
    // 中文释义（下）
    if (cn) {
      svg += `<text x="${lx + pw/2}" y="${ly + 14}" text-anchor="middle" font-size="11.5" fill="${MM_COLORS.branchText}">${cn}</text>`;
    }
  });

  // ---- 中心节点（大紫色椭圆）----
  const cw = word.length * 18 + 50;
  const ch = 46;
  svg += `<ellipse cx="${cx}" cy="${cy}" rx="${cw/2 + 10}" ry="${ch/2 + 6}" fill="${MM_COLORS.ovalFill}" stroke="${MM_COLORS.ovalStroke}" stroke-width="1.8"/>`;
  svg += `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="22" font-weight="700" fill="#fff" style="font-family:Georgia,'Times New Roman',serif">${esc(word)}</text>`;

  // ---- 右节点（纯文本）----
  right.forEach((b, i) => {
    const rx = W - 35;
    const ry = 50 + i * (H - 100) / Math.max(rightCount, 1);
    const phrase = esc(b.phrase || '');

    // 英文短语（上，深红）
    svg += `<text x="${rx}" y="${ry - 4}" text-anchor="end" font-size="13" font-weight="700" fill="${MM_COLORS.rightText}">${phrase}</text>`;
  });

  return `<div class="mindmap-wrap">
    <div class="mindmap-title">思维导图总结</div>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="xMidYMid meet" class="mindmap-svg">
      ${svg}
    </svg>
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
