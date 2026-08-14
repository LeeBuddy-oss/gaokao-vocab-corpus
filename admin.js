/* ============================================================
 * 教师数据统计后台 admin.js
 * 读取 CloudBase 数据库中的 visits / queries 集合，
 * 前端聚合展示：独立访客、PV、查询次数、热门词汇、活跃度
 * ============================================================ */
(function () {
  'use strict';

  const ADMIN_PASS = (window.CB_CONFIG && window.CB_CONFIG.adminPass) || 'xbjy23027';
  const ENV = (window.CB_CONFIG && window.CB_CONFIG.env) || '';

  const $loginBox  = document.getElementById('admin-login');
  const $loginForm = document.getElementById('admin-form');
  const $passInput = document.getElementById('admin-pass-input');
  const $loginBtn  = document.getElementById('admin-login-btn');
  const $adminMsg  = document.getElementById('admin-msg');
  const $dash      = document.getElementById('dashboard');
  const $cards     = document.getElementById('stat-cards');
  const $tableBody = document.querySelector('#daily-table tbody');
  const $rangeSel  = document.getElementById('range-select');
  const $rangeLbl  = document.getElementById('range-label');

  let DB = null;
  let RAW = null;          // { visits:[], queries:[] }
  let trendChart = null;
  let topChart = null;

  /* ---------- 工具 ---------- */
  function msg(text, ok) {
    if (!text) { $adminMsg.hidden = true; return; }
    $adminMsg.textContent = text;
    $adminMsg.className = 'auth-msg' + (ok ? ' ok' : '');
    $adminMsg.hidden = false;
  }
  function fmtDate(ts) {
    const d = new Date(ts);
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function fmtNum(n) {
    return (n || 0).toLocaleString('zh-CN');
  }

  /* ---------- 访问码 ---------- */
  if (sessionStorage.getItem('gk_admin_ok') === '1') {
    enterDashboard();
  } else {
    $loginBox.hidden = false;
  }

  $loginForm.addEventListener('submit', ev => {
    ev.preventDefault();
    if ($passInput.value.trim() === ADMIN_PASS) {
      sessionStorage.setItem('gk_admin_ok', '1');
      enterDashboard();
    } else {
      msg('访问码错误');
    }
  });

  document.getElementById('admin-logout-btn').addEventListener('click', () => {
    sessionStorage.removeItem('gk_admin_ok');
    location.reload();
  });

  /* ---------- 进入后台 ---------- */
  async function enterDashboard() {
    $loginBox.hidden = true;
    $dash.hidden = false;
    $dash.innerHTML = '<div class="admin-main"><p class="load-tip">正在连接数据库并加载统计数据…</p></div>';
    try {
      await initCloud();
      // 如果数据库不可用，显示提示并结束（不抛错）
      if (!DB) {
        $dash.innerHTML = '<div class="admin-main"><p class="load-tip">⚠️ 当前 CloudBase 环境不支持文档型数据库，统计功能已关闭。<br/><br/>' +
          '如需启用统计，请使用支持文档数据库的 CloudBase 环境。</p></div>';
        return;
      }
      await loadData();
      renderDashboard();
    } catch (e) {
      console.error('[admin] 加载失败', e);
      $dash.innerHTML = '<div class="admin-main"><p class="load-tip">❌ 加载失败：' +
        (e && e.message ? String(e.message).replace(/</g, '&lt;') : '未知错误') +
        '<br/><br/>请确认 cloudbase-config.js 已填写环境 ID，且数据库集合（visits/queries）已创建、权限为“所有用户可读写”。</p></div>';
    }
  }

  async function initCloud() {
    if (!ENV || typeof cloudbase === 'undefined') {
      throw new Error('未配置 CloudBase 环境 ID（请修改 cloudbase-config.js）');
    }
    const app = cloudbase.init({ env: ENV });
    const auth = app.auth();
    try {
      DB = app.database();
    } catch (dbErr) {
      console.warn('[admin] 文档数据库不可用，统计功能已关闭', dbErr);
      DB = null;
      return; // 数据库不可用时不继续，enterDashboard 会显示提示
    }
    try {
      const state = await auth.getLoginState();
      if (!state || !state.user) {
        // 后台以匿名身份读取统计数据（集合权限为"所有用户可读写"即可）
        await auth.signInAnonymously();
      }
    } catch (e) {
      // 匿名登录未开启时：集合若为"所有用户可读写"，仍可直接读取
      console.warn('[admin] 匿名登录不可用，尝试直接读取', e);
    }
  }

  /* ---------- 读取数据（分页，每页 1000 条） ---------- */
  async function fetchAll(collName) {
    const coll = DB.collection(collName);
    const PAGE = 1000;
    const all = [];
    let skip = 0;
    for (let guard = 0; guard < 200; guard++) { // 最多 20 万条
      let res;
      try {
        res = await coll.orderBy('ts', 'asc').skip(skip).limit(PAGE).get();
      } catch (e) {
        console.warn('[admin] 读取 ' + collName + ' 失败（可能为空或权限不足）', e);
        return all;
      }
      const data = res.data || [];
      all.push.apply(all, data);
      if (data.length < PAGE) break;
      skip += PAGE;
    }
    return all;
  }

  async function loadData() {
    const [visits, queries] = await Promise.all([fetchAll('visits'), fetchAll('queries')]);
    RAW = { visits, queries };
  }

  /* ---------- 聚合统计 ---------- */
  function aggregate(rangeDays) {
    const visits = RAW.visits || [];
    const queries = RAW.queries || [];
    const allUids = new Set();
    const days = {};   // date -> { pv, uv:Set, queries }
    const wordCount = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutTs = rangeDays ? today.getTime() - (rangeDays - 1) * 86400000 : 0;

    function inRange(ts, date) {
      if (!rangeDays) return true;
      if (date) {
        const parts = date.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.getTime() >= cutTs;
      }
      return ts >= cutTs;
    }

    visits.forEach(v => {
      allUids.add(v.uid);
      if (!inRange(v.ts, v.date)) return;
      const d = v.date || fmtDate(v.ts);
      const rec = days[d] || (days[d] = { pv: 0, uv: new Set(), queries: 0 });
      rec.pv++;
      rec.uv.add(v.uid);
    });
    queries.forEach(q => {
      allUids.add(q.uid);
      wordCount[q.word] = (wordCount[q.word] || 0) + 1;
      if (!inRange(q.ts, q.date)) return;
      const d = q.date || fmtDate(q.ts);
      const rec = days[d] || (days[d] = { pv: 0, uv: new Set(), queries: 0 });
      rec.queries++;
      rec.uv.add(q.uid);
    });

    // 汇总
    let totalPV = 0, totalQ = 0;
    const dayList = Object.keys(days).sort();
    dayList.forEach(d => {
      const r = days[d];
      r.uvCount = r.uv.size;
      totalPV += r.pv;
      totalQ += r.queries;
    });
    const topWords = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 20);

    return {
      totalUsers: allUids.size,
      totalPV, totalQ,
      dayList, days, topWords
    };
  }

  /* ---------- 渲染 ---------- */
  function renderDashboard() {
    const range = $rangeSel.value;
    const daysN = range === 'all' ? 0 : parseInt(range, 10);
    const agg = aggregate(daysN);
    $rangeLbl.textContent = '统计范围：' + (daysN ? '最近 ' + daysN + ' 天' : '全部时间');

    // 卡片
    $cards.innerHTML =
      card(agg.totalUsers, '独立访客（累计）', true) +
      card(agg.totalPV, '页面访问量 PV（累计）', false) +
      card(agg.totalQ, '词汇查询次数（累计）', false) +
      card(agg.topWords.length ? agg.topWords[0][0] : '—', '最热门词汇', false) +
      card(agg.dayList.length ? fmtNum(agg.days[agg.dayList[agg.dayList.length - 1]].uvCount) : 0, '最近一日独立访客', false);

    renderCharts(agg);
    renderTable(agg);
  }

  function card(num, lbl, hl) {
    return '<div class="stat-card' + (hl ? ' hl' : '') + '">' +
      '<div class="num">' + num + '</div><div class="lbl">' + lbl + '</div></div>';
  }

  function themeColors() {
    const text = cssVar('--title') || '#1f2937';
    const muted = cssVar('--muted') || '#6b7280';
    const grid = cssVar('--border') || 'rgba(120,120,120,.25)';
    return { text, muted, grid };
  }

  function renderCharts(agg) {
    const tc = themeColors();
    const days = agg.dayList.slice(-60); // 趋势图最多展示 60 天
    const labels = days;

    if (trendChart) trendChart.destroy();
    trendChart = new Chart(document.getElementById('trend-chart'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'PV', data: days.map(d => agg.days[d].pv), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.12)', tension: .3, fill: true, pointRadius: 2 },
          { label: '独立访客', data: days.map(d => agg.days[d].uvCount), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.12)', tension: .3, fill: true, pointRadius: 2 },
          { label: '查询次数', data: days.map(d => agg.days[d].queries), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.12)', tension: .3, fill: true, pointRadius: 2 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: tc.text, boxWidth: 12, font: { size: 12 } } } },
        scales: {
          x: { ticks: { color: tc.muted, maxTicksLimit: 12 }, grid: { color: tc.grid } },
          y: { ticks: { color: tc.muted, precision: 0 }, grid: { color: tc.grid }, beginAtZero: true }
        }
      }
    });

    if (topChart) topChart.destroy();
    const words = agg.topWords.map(w => w[0]);
    const counts = agg.topWords.map(w => w[1]);
    topChart = new Chart(document.getElementById('top-chart'), {
      type: 'bar',
      data: {
        labels: words,
        datasets: [{ label: '查询次数', data: counts, backgroundColor: 'rgba(59,130,246,.75)', borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: tc.muted, precision: 0 }, grid: { color: tc.grid }, beginAtZero: true },
          y: { ticks: { color: tc.text, font: { size: 12 } }, grid: { display: false } }
        }
      }
    });
  }

  function renderTable(agg) {
    const rows = agg.dayList.slice().reverse().map(d => {
      const r = agg.days[d];
      const per = r.uvCount ? (r.queries / r.uvCount).toFixed(1) : '0';
      return '<tr><td>' + d + '</td><td>' + fmtNum(r.pv) + '</td><td>' + fmtNum(r.uvCount) +
        '</td><td>' + fmtNum(r.queries) + '</td><td>' + per + '</td></tr>';
    });
    $tableBody.innerHTML = rows.join('') || '<tr><td colspan="5">暂无数据</td></tr>';
  }

  /* ---------- 交互 ---------- */
  $rangeSel.addEventListener('change', () => { if (RAW) renderDashboard(); });
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    await loadData();
    renderDashboard();
  });

  /* ---------- 导出 CSV ---------- */
  document.getElementById('export-btn').addEventListener('click', () => {
    const agg = aggregate($rangeSel.value === 'all' ? 0 : parseInt($rangeSel.value, 10));
    const lines = [];
    lines.push('==== 总览 ====');
    lines.push('独立访客,' + agg.totalUsers);
    lines.push('页面访问量PV,' + agg.totalPV);
    lines.push('词汇查询次数,' + agg.totalQ);
    lines.push('');
    lines.push('==== 每日明细 ====');
    lines.push('日期,PV,独立访客,查询次数,人均查询');
    agg.dayList.sort().forEach(d => {
      const r = agg.days[d];
      lines.push([d, r.pv, r.uvCount, r.queries, r.uvCount ? (r.queries / r.uvCount).toFixed(1) : 0].join(','));
    });
    lines.push('');
    lines.push('==== 热门词汇 TOP20 ====');
    lines.push('词汇,查询次数');
    agg.topWords.forEach(w => lines.push(w[0] + ',' + w[1]));

    const csv = '\ufeff' + lines.join('\r\n'); // BOM 保证 Excel 打开不乱码
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '词汇库使用统计_' + fmtDate(Date.now()).replace(/-/g, '') + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });
})();
