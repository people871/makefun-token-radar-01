// Token Radar dashboard. Reads window.RADAR (bundled beside this folder as data.js)
// and renders the board entirely offline: no fetch, no network, no imports.
(function () {
  'use strict';

  var DATA = (typeof window !== 'undefined') ? window.RADAR : null;
  var rows = (DATA && Array.isArray(DATA.rows)) ? DATA.rows : [];
  var live = (DATA && Array.isArray(DATA.live)) ? DATA.live : [];
  var model = (DATA && DATA.model) || {};
  var BASE = typeof model.base_multiple === 'number' ? model.base_multiple : 0.25;

  var state = { view: 'board', q: '', cat: 'all', chain: 'all', watch: false, sort: 'implied', dir: -1 };

  /* ---------- formatting ---------- */
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    var a = Math.abs(n);
    if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function fmtPct(n) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return (n > 0 ? '+' : '') + Number(n).toFixed(2) + '%';
  }
  function fmtAge(d) {
    if (d === null || d === undefined || !isFinite(d)) return 'Unknown';
    if (d >= 365) return (d / 365).toFixed(1) + ' yr';
    return Math.max(0, Math.round(d)) + ' days';
  }
  function fmtMult(n) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return Number(n).toFixed(4).replace(/0+$/, '').replace(/\.$/, '.0');
  }

  /* ---------- model ---------- */
  // Recompute a board row from the snapshot figures, to show beside the stored value.
  function modelParts(r) {
    var g = (typeof r.growth_multiplier === 'number') ? r.growth_multiplier
      : (r.model && typeof r.model.growth_multiplier === 'number' ? r.model.growth_multiplier : 1);
    var m = (typeof r.maturity_multiplier === 'number') ? r.maturity_multiplier
      : (r.model && typeof r.model.maturity_multiplier === 'number' ? r.model.maturity_multiplier : 1);
    var base = r.tvl_usd * BASE;
    return { base: base, growth: g, maturity: m, implied: Math.max(1, Math.round(base * g * m)) };
  }

  /* ---------- farm plan fallback ---------- */
  // Used only when a row carries no farm_steps. Derived from the row itself:
  // category picks the action, TVL picks the capital, age picks the hold.
  function farmPlan(p) {
    var chain = (p.chains && p.chains.length) ? p.chains[0] : 'its main chain';
    var cap = p.tvl_usd >= 5e9 ? 250 : p.tvl_usd >= 1e9 ? 150 : p.tvl_usd >= 1e8 ? 100 : 50;
    var hold = (p.age_days === null || p.age_days === undefined) ? 30 : p.age_days < 180 ? 60 : p.age_days < 365 ? 45 : 30;
    var c = String(p.category || '').toLowerCase();
    var act;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0) act = 'Supply $' + cap + ' of USDC to ' + p.name + ' on ' + chain + ' and leave the position open.';
    else if (c.indexOf('dex') >= 0 || c.indexOf('yield') >= 0) act = 'Add $' + cap + ' of liquidity to the main pool of ' + p.name + ' on ' + chain + ' and leave it in place.';
    else if (c.indexOf('bridge') >= 0) act = 'Bridge $' + cap + ' of USDC through ' + p.name + ' onto ' + chain + ' and use the funds inside its app.';
    else if (c.indexOf('stak') >= 0 || c.indexOf('restak') >= 0) act = 'Stake $' + cap + ' of the staking asset through ' + p.name + ' and keep the receipt token.';
    else if (c.indexOf('perp') >= 0 || c.indexOf('derivat') >= 0) act = 'Deposit $' + cap + ' of USDC as margin on ' + p.name + ' and open one small hedged position.';
    else if (c.indexOf('prediction') >= 0) act = 'Fund $' + cap + ' and take one position in a market on ' + p.name + '.';
    else if (c.indexOf('vault') >= 0 || c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0) act = 'Deposit $' + cap + ' into a ' + p.name + ' vault on ' + chain + ' and hold the vault shares.';
    else if (c.indexOf('stable') >= 0) act = 'Mint or deposit $' + cap + ' of the stable asset through ' + p.name + ' on ' + chain + '.';
    else if (c.indexOf('rwa') >= 0) act = 'Mint $' + cap + ' of the yield asset on ' + chain + ' through ' + p.name + ' and hold it.';
    else if (c.indexOf('insurance') >= 0) act = 'Buy $' + cap + ' of cover from ' + p.name + ' on ' + chain + ' and keep the policy active.';
    else act = 'Deposit $' + cap + ' of USDC into ' + p.name + ' on ' + chain + ' and leave the position open.';
    return [
      'Open a fresh wallet that holds only the funds you plan to farm, and keep its recovery phrase offline. Cost: under $3 of gas. Time: 5 minutes.',
      act + ' Cost: $' + cap + ' of capital and about $' + (cap >= 150 ? 8 : 4) + ' of gas. Time: 15 minutes to set up.',
      'Do one qualifying action each week — a deposit, a borrow, a swap or a vote. Cost: about $2 of gas a week. Time: 10 minutes a week.',
      'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot. Cost: the $' + cap + ' stays in the position. Time: ' + hold + ' days.',
      'Before withdrawing, open the protocol\u2019s own points or rewards page and claim only from the link it publishes. Cost: nothing to check, and never pay to claim. Time: 10 minutes.',
      'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it. Cost: nothing but the log. Time: 5 minutes.'
    ];
  }

  /* ---------- sort + filter (pure, also used by the Node sanity test) ---------- */
  function keyOf(r, key) {
    if (key === 'name') return String(r.name || '').toLowerCase();
    if (key === 'category') return String(r.category || '').toLowerCase();
    if (key === 'tvl') return r.tvl_usd || 0;
    if (key === 'change') return (r.change_7d === null || r.change_7d === undefined) ? -Infinity : r.change_7d;
    if (key === 'age') return (r.age_days === null || r.age_days === undefined) ? Infinity : r.age_days;
    if (key === 'implied') return r.implied_value_usd || 0;
    if (key === 'mcap') return r.mcap_usd || 0;
    return r.rank || 0;
  }
  function sortList(list, key, dir) {
    return list.slice().sort(function (a, b) {
      var av = keyOf(a, key), bv = keyOf(b, key);
      if (av < bv) return -dir;
      if (av > bv) return dir;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  }
  function applyFilters(list, st) {
    var q = String(st.q || '').trim().toLowerCase();
    var floor = (DATA && typeof DATA.floor_usd === 'number') ? DATA.floor_usd : 0;
    return list.filter(function (r) {
      if (st.cat !== 'all' && (r.category || 'Other') !== st.cat) return false;
      if (st.chain !== 'all' && !(r.chains || []).includes(st.chain)) return false;
      if (st.watch && (r.tvl_usd || 0) < floor) return false;
      if (!q) return true;
      var hay = [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  /* ---------- DOM rendering (browser only) ---------- */
  function $(id) { return document.getElementById(id); }
  function chainsOf(r) {
    var cs = r.chains || [];
    if (!cs.length) return '<span class="sub">—</span>';
    var shown = cs.slice(0, 3).map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join(' ');
    return shown + (cs.length > 3 ? ' <span class="sub">+' + (cs.length - 3) + '</span>' : '');
  }
  function changeCell(r) {
    var cls = (r.change_7d === null || r.change_7d === undefined) ? '' : r.change_7d >= 0 ? 'up' : 'down';
    return '<td class="num ' + cls + '">' + fmtPct(r.change_7d) + '</td>';
  }
  function nameCell(r, status) {
    return '<td><div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.slug) + (status ? ' · ' + esc(status) : '') + '</span></div></td>';
  }

  var COLS = {
    board: [
      { k: 'rank', label: 'Rank' }, { k: 'name', label: 'Protocol' }, { k: 'category', label: 'Category' },
      { k: 'chains', label: 'Chains' }, { k: 'tvl', label: 'TVL' }, { k: 'change', label: '7d' },
      { k: 'age', label: 'Age' }, { k: 'implied', label: 'Implied value' }
    ],
    live: [
      { k: 'name', label: 'Protocol' }, { k: 'category', label: 'Category' }, { k: 'chains', label: 'Chains' },
      { k: 'tvl', label: 'TVL' }, { k: 'change', label: '7d' }, { k: 'mcap', label: 'Market cap' }
    ]
  };
  var SORTABLE = { rank: 1, name: 1, category: 1, tvl: 1, change: 1, age: 1, implied: 1, mcap: 1 };

  function renderHead() {
    var cols = COLS[state.view];
    $('thead').innerHTML = '<tr>' + cols.map(function (c) {
      var arrow = state.sort === c.k ? (state.dir < 0 ? ' ▼' : ' ▲') : '';
      var sort = state.sort === c.k ? (state.dir < 0 ? ' aria-sort="descending"' : ' aria-sort="ascending"') : '';
      var inner = SORTABLE[c.k]
        ? '<button type="button" data-sort="' + c.k + '">' + esc(c.label) + esc(arrow) + '</button>'
        : esc(c.label);
      return '<th scope="col"' + sort + '>' + inner + '</th>';
    }).join('') + '</tr>';
  }

  function currentList() {
    var src = state.view === 'board' ? rows : live;
    return sortList(applyFilters(src, state), state.sort, state.dir);
  }

  function renderTable() {
    renderHead();
    var list = currentList();
    var label = state.view === 'board' ? 'Board' : 'Live tokens';
    $('count').textContent = list.length + ' of ' + (state.view === 'board' ? rows.length : live.length) + ' ' + (state.view === 'board' ? 'rows' : 'live protocols') + ' shown';
    $('caption').textContent = state.view === 'board'
      ? 'Pre-token protocols, strongest implied value first. Select a row for its model breakdown and farm plan.'
      : 'Live-token protocols: each already trades, so the figure shown is the market\u2019s own market cap — a market value, never a model implied value. Select a row for its figures.';
    $('empty').hidden = list.length > 0;
    if (!list.length) { $('rows').innerHTML = ''; return; }
    if (state.view === 'board') {
      var max = Math.max.apply(null, list.map(function (r) { return r.implied_value_usd || 1; }));
      $('rows').innerHTML = list.map(function (r) {
        var pct = Math.max(3, Math.round(((r.implied_value_usd || 0) / max) * 100));
        return '<tr tabindex="0" data-slug="' + esc(r.slug) + '">'
          + '<td class="rk">' + (r.rank || '—') + '</td>'
          + nameCell(r, 'records no token')
          + '<td>' + esc(r.category || 'Other') + '</td>'
          + '<td>' + chainsOf(r) + '</td>'
          + '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>'
          + changeCell(r)
          + '<td class="num">' + fmtAge(r.age_days) + '</td>'
          + '<td><span class="val"><span class="bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span><span class="num">' + fmtUsd(r.implied_value_usd) + '</span></span></td>'
          + '</tr>';
      }).join('');
    } else {
      $('rows').innerHTML = list.map(function (r) {
        return '<tr tabindex="0" data-slug="' + esc(r.slug) + '" data-live="1">'
          + nameCell(r, 'already trades')
          + '<td>' + esc(r.category || 'Other') + '</td>'
          + '<td>' + chainsOf(r) + '</td>'
          + '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>'
          + changeCell(r)
          + '<td class="num">' + fmtUsd(r.mcap_usd) + '</td>'
          + '</tr>';
      }).join('');
    }
  }

  function fillSelects() {
    var cats = {}, chs = {};
    rows.concat(live).forEach(function (r) {
      cats[r.category || 'Other'] = 1;
      (r.chains || []).forEach(function (c) { chs[c] = 1; });
    });
    var catOpts = '<option value="all">All categories</option>' + Object.keys(cats).sort().map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
    }).join('');
    var chainOpts = '<option value="all">All chains</option>' + Object.keys(chs).sort().map(function (c) {
      return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
    }).join('');
    $('cat').innerHTML = catOpts;
    $('chain').innerHTML = chainOpts;
  }

  function openDetail(slug, isLive) {
    var src = isLive ? live : rows;
    var r = null;
    for (var i = 0; i < src.length; i++) if (src[i].slug === slug) { r = src[i]; break; }
    if (!r) return;
    var dlg = $('detail'), body = $('detail-body');
    var h = '<p class="d-kicker">' + (isLive ? 'Live token' : 'Rank ' + (r.rank || '—') + ' of ' + rows.length + ' · Pre-token') + '</p>'
      + '<h2 id="detail-title">' + esc(r.name) + '</h2>'
      + '<p class="sub">' + esc(r.category || 'Other') + ' · ' + esc((r.chains || []).join(', ') || 'no chain listed') + '</p>'
      + '<p><span class="pill' + (isLive ? ' live' : '') + '">' + (isLive ? 'Token already trades' : 'Records no token') + '</span></p>'
      + '<h3>Figures</h3><dl>'
      + '<div><dt>TVL</dt><dd>' + fmtUsd(r.tvl_usd) + '</dd></div>'
      + '<div><dt>7-day change</dt><dd>' + fmtPct(r.change_7d) + '</dd></div>'
      + '<div><dt>Age</dt><dd>' + fmtAge(r.age_days) + '</dd></div>'
      + '<div><dt>Listed</dt><dd>' + esc(r.listed_at || 'Unknown') + '</dd></div>'
      + '<div><dt>Category</dt><dd>' + esc(r.category || 'Other') + '</dd></div>'
      + '<div><dt>Chains</dt><dd>' + esc((r.chains || []).join(', ') || '—') + '</dd></div>'
      + (isLive
        ? '<div><dt>Market cap (market&rsquo;s value)</dt><dd>' + fmtUsd(r.mcap_usd) + '</dd></div>'
        : '<div><dt>Implied value (model)</dt><dd>' + fmtUsd(r.implied_value_usd) + '</dd></div>')
      + '</dl>';
    if (!isLive) {
      var mp = modelParts(r);
      var match = mp.implied === r.implied_value_usd;
      h += '<h3>Model breakdown · ' + esc(DATA.model_version || 'radar-1') + '</h3><dl>'
        + '<div><dt>Base multiple</dt><dd>× ' + fmtMult(BASE) + '</dd></div>'
        + '<div><dt>Base (TVL × multiple)</dt><dd>' + fmtUsd(mp.base) + '</dd></div>'
        + '<div><dt>Growth multiplier</dt><dd>× ' + fmtMult(mp.growth) + '</dd></div>'
        + '<div><dt>Maturity multiplier</dt><dd>× ' + fmtMult(mp.maturity) + '</dd></div>'
        + '<div><dt>Implied value</dt><dd>' + fmtUsd(r.implied_value_usd) + '</dd></div>'
        + '<div><dt>Recomputed here</dt><dd>' + fmtUsd(mp.implied) + (match ? ' · matches' : ' · differs — data may be stale') + '</dd></div>'
        + '</dl>'
        + '<p class="note">Implied value is the model&rsquo;s estimate from this snapshot&rsquo;s TVL, 7-day growth and age. It is not a price.</p>';
      var steps = (Array.isArray(r.farm_steps) && r.farm_steps.length) ? r.farm_steps : farmPlan(r);
      h += '<h3>Farm plan</h3><ol>' + steps.map(function (s) { return '<li>' + esc(String(s)) + '</li>'; }).join('') + '</ol>';
    } else {
      h += '<p class="note">This protocol&rsquo;s token already trades, so the market cap above is the market&rsquo;s own value — not a model estimate — and there is no pre-token farm plan for it.</p>';
    }
    body.innerHTML = h;
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute('open', '');
  }

  function renderHeader() {
    if (!DATA) return;
    $('asof').textContent = DATA.as_of || '—';
    $('mver').textContent = DATA.model_version || '—';
    $('watch-n').textContent = (DATA.watchlist_size !== undefined ? DATA.watchlist_size : rows.length) + '';
    $('board-n').textContent = (DATA.board_size !== undefined ? DATA.board_size : rows.length) + ' rows';
    $('live-n').textContent = (DATA.live_size !== undefined ? DATA.live_size : live.length) + '';
    $('source').textContent = DATA.source || 'snapshot';
    var m = model;
    $('model-text').innerHTML = 'Implied value = TVL × <code>' + esc(BASE) + '</code> (base multiple)'
      + ' × growth multiplier (7-day change, weight ' + esc(typeof m.growth_weight === 'number' ? m.growth_weight : 0.5) + ')'
      + ' × maturity multiplier (age up to ' + esc(typeof m.maturity_days === 'number' ? m.maturity_days : 1095) + ' days).'
      + ' One function scores every row; no protocol name is special-cased.';
  }

  function boot() {
    renderHeader();
    fillSelects();
    renderTable();
    $('q').addEventListener('input', function (e) { state.q = e.target.value; renderTable(); });
    $('cat').addEventListener('change', function (e) { state.cat = e.target.value; renderTable(); });
    $('chain').addEventListener('change', function (e) { state.chain = e.target.value; renderTable(); });
    $('watch').addEventListener('change', function (e) { state.watch = e.target.checked; renderTable(); });
    $('tab-board').addEventListener('click', function () {
      state.view = 'board'; state.sort = 'implied'; state.dir = -1;
      $('tab-board').setAttribute('aria-pressed', 'true');
      $('tab-live').setAttribute('aria-pressed', 'false');
      renderTable();
    });
    $('tab-live').addEventListener('click', function () {
      state.view = 'live'; state.sort = 'mcap'; state.dir = -1;
      $('tab-live').setAttribute('aria-pressed', 'true');
      $('tab-board').setAttribute('aria-pressed', 'false');
      renderTable();
    });
    $('clear').addEventListener('click', function () {
      state.q = ''; state.cat = 'all'; state.chain = 'all'; state.watch = false;
      $('q').value = ''; $('cat').value = 'all'; $('chain').value = 'all'; $('watch').checked = false;
      renderTable();
    });
    $('thead').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-sort]') : null;
      if (!b) return;
      var k = b.getAttribute('data-sort');
      if (state.sort === k) state.dir = -state.dir;
      else { state.sort = k; state.dir = (k === 'name' || k === 'category') ? 1 : -1; }
      renderTable();
    });
    $('rows').addEventListener('click', function (e) {
      var tr = e.target.closest ? e.target.closest('tr[data-slug]') : null;
      if (tr) openDetail(tr.getAttribute('data-slug'), tr.getAttribute('data-live') === '1');
    });
    $('rows').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var tr = e.target.closest ? e.target.closest('tr[data-slug]') : null;
      if (tr) { e.preventDefault(); openDetail(tr.getAttribute('data-slug'), tr.getAttribute('data-live') === '1'); }
    });
    $('detail').addEventListener('click', function (e) {
      var d = $('detail');
      if (e.target === d) d.close();
    });
  }

  if (typeof document !== 'undefined' && DATA) boot();
  else if (typeof document !== 'undefined') {
    var main = document.getElementById('main');
    if (main) main.insertAdjacentHTML('afterbegin', '<p class="empty">No snapshot data found: data.js did not set window.RADAR.</p>');
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fmtUsd: fmtUsd, fmtPct: fmtPct, fmtAge: fmtAge, sortList: sortList, applyFilters: applyFilters, farmPlan: farmPlan, modelParts: modelParts };
  }
})();
