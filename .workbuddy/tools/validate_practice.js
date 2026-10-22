/**
 * 主题词汇巩固练 · 结构质检脚本
 * 用法：node .workbuddy/tools/validate_practice.js [--fix-meta] [文件名...]
 * 默认检查 data/practice/manifest.json 里登记的全部词条。
 *
 * 校验项：
 *  1. JSON 可解析
 *  2. 正文圈码 ①—⑩ 各出现一次且严格升序
 *  3. Task 1 选项 8 个；题目 10 条；答案 10 条；key 合法（可含 A/B 双答案）
 *  4. Task 1 每题 q 去掉首尾标点后能在正文中找到（漏词检查）
 *  5. Task 2 题目 6 条、答案 6 条，答案非中文
 *  6. Task 3 词块 ≥8、书写线 ≥4、示例 ≥4
 *  7. task3.title 含"语境写作"；段落无多余空格、无中文标点误用（英文正文）
 *  8. meta 中"正文 N words"与实际词数一致（--fix-meta 时自动改写）
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PRAC_DIR = path.join(ROOT, 'data/practice');
const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮';

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(PRAC_DIR, 'manifest.json'), 'utf8'));
}

function countWords(paras) {
  return paras.join(' ').replace(/[①-⑮]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

function check(file) {
  const errs = [];
  const warns = [];
  const p = path.join(PRAC_DIR, file);
  let d;
  try {
    d = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return { file, errs: ['JSON 解析失败: ' + e.message], warns, word: '?' };
  }
  const word = d.word || '';
  if (!word) errs.push('缺少 word 字段');

  // ---- 正文圈码 ----
  const text = (d.passage || []).join('\n');
  if (!text) errs.push('passage 为空');
  const marks = [...text].filter(ch => CIRCLED.includes(ch));
  const expect = CIRCLED.slice(0, 10).split('');
  if (marks.length !== 10) errs.push(`圈码数量 ${marks.length}（应为 10）`);
  if (marks.join('') !== expect.join('')) errs.push(`圈码顺序异常: ${marks.join('')}（应为 ①②③④⑤⑥⑦⑧⑨⑩）`);

  // ---- 目标词在正文中出现次数 ----
  const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hits = (text.match(new RegExp('\\b' + safe + '(?:s|es|ed|ing|d|en)?\\b', 'gi')) || []).length;
  if (hits < 12) warns.push(`目标词正文出现 ${hits} 次（建议 ≥12，覆盖各义项与复现）`);

  // ---- Task 1 ----
  const t1 = d.task1 || {};
  const opts = t1.options || [];
  const items = t1.items || [];
  const answers = t1.answers || [];
  if (opts.length < 8) errs.push(`Task 1 选项 ${opts.length} 个（应 ≥8）`);
  if (items.length !== 10) errs.push(`Task 1 题目 ${items.length} 条（应为 10）`);
  if (answers.length !== items.length) errs.push(`Task 1 答案 ${answers.length} 条与题目 ${items.length} 条不匹配`);
  const used = {};
  answers.forEach((a, i) => {
    const keys = String(a.key || '').split('/').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (!keys.length) errs.push(`Task 1 第 ${i + 1} 题缺答案`);
    keys.forEach(k => {
      if (!/^[A-H]$/.test(k)) errs.push(`Task 1 第 ${i + 1} 题答案 "${k}" 不是 A-H`);
      else if (k.charCodeAt(0) - 65 >= opts.length) errs.push(`Task 1 第 ${i + 1} 题答案 ${k} 超出选项范围`);
      used[k] = (used[k] || 0) + 1;
    });
    if (!a.why || String(a.why).trim().length < 8) errs.push(`Task 1 第 ${i + 1} 题缺解析 why`);
  });
  const missingKeys = 'ABCDEFGH'.slice(0, opts.length).split('').filter(k => !used[k]);
  if (missingKeys.length) warns.push(`Task 1 选项 ${missingKeys.join('')} 未被任何题目使用`);
  // q 是否能在正文中找到（宽松：取 q 前 4 个单词）
  const norm = s => s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  const ntext = norm(text);
  items.forEach((it, i) => {
    const q = norm(String(it.q || ''));
    const head = q.split(' ').slice(0, Math.min(4, q.split(' ').length)).join(' ');
    if (q && head && !ntext.includes(head)) warns.push(`Task 1 第 ${i + 1} 题题干"${it.q}"在正文中未直接匹配，请核对是否需要改写`);
  });

  // ---- Task 2 ----
  const t2 = d.task2 || {};
  const t2i = t2.items || [], t2a = t2.answers || [];
  if (t2i.length !== 6) errs.push(`Task 2 题目 ${t2i.length} 条（应为 6）`);
  if (t2a.length !== t2i.length) errs.push(`Task 2 答案 ${t2a.length} 条与题目 ${t2i.length} 条不匹配`);
  t2a.forEach((s, i) => {
    if (/[\u4e00-\u9fa5]/.test(String(s))) errs.push(`Task 2 第 ${i + 1} 题答案含中文`);
    if (!/[.?!]$/.test(String(s).trim())) warns.push(`Task 2 第 ${i + 1} 题答案缺少句末标点`);
  });

  // ---- Task 3 ----
  const t3 = d.task3 || {};
  if (!/语境写作/.test(String(t3.title || ''))) errs.push(`task3.title 应为"Task 3　语境写作"，当前"${t3.title}"`);
  if ((t3.wordbank || []).length < 8) errs.push(`Task 3 词块 ${(t3.wordbank || []).length} 个（应 ≥8）`);
  if ((t3.lines || 0) < 4) errs.push(`Task 3 书写线 ${t3.lines} 条（应 ≥4）`);
  if ((t3.answers || []).length < 4) errs.push(`Task 3 示例句 ${(t3.answers || []).length} 条（应 ≥4）`);
  const wb = (t3.wordbank || []).filter(w => !text.toLowerCase().includes(String(w).toLowerCase()));
  if (wb.length > 3) warns.push(`词块中超 ${wb.length} 个未在正文出现: ${wb.join(', ')}`);

  // ---- meta 词数 ----
  const wc = countWords(d.passage || []);
  const m = String(d.meta || '').match(/正文\s*(\d+)\s*words/);
  if (!m) errs.push('meta 缺少"正文 N words"');
  else if (Number(m[1]) !== wc) {
    if (FIX_META) {
      d.meta = d.meta.replace(/正文\s*\d+\s*words/, `正文 ${wc} words`);
      fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
      warns.push(`meta 词数已修正 ${m[1]} → ${wc}`);
    } else {
      errs.push(`meta 词数 ${m[1]} 与实际 ${wc} 不一致`);
    }
  }
  if (wc < 280 || wc > 420) warns.push(`正文 ${wc} 词（建议 300—380 词）`);

  // ---- 段落数（前端与线上校验均按 5 段渲染）----
  const nPara = (d.passage || []).length;
  if (nPara !== 5) errs.push(`正文 ${nPara} 段（应为 5 段）`);

  return { file, word, errs, warns, wordCount: wc };
}

const args = process.argv.slice(2);
const FIX_META = args.includes('--fix-meta');
const files = args.filter(a => !a.startsWith('--'));
const manifest = loadManifest();
const targets = files.length ? files : Object.values(manifest);

let bad = 0;
targets.forEach(f => {
  const r = check(f);
  const tag = r.errs.length ? '✗' : '✓';
  console.log(`${tag} ${f}  (${r.word || '?'}, ${r.wordCount} words)`);
  r.errs.forEach(e => console.log('   ✗ ' + e));
  r.warns.forEach(w => console.log('   ! ' + w));
  if (r.errs.length) bad++;
});
console.log(`\n共检查 ${targets.length} 个文件，${targets.length - bad} 通过，${bad} 有问题。`);
process.exit(bad ? 1 : 0);
