(function () {
  'use strict';

  var FD = window.FD, I = window.FD_INT, el = FD.el;
  var root = document.getElementById('ops-root');
  var W = null;
  var T = 0;
  var mainEl = null, navEl = null, clockEl = null;
  var PAGE = 50;

  var live, unas, rid, pay, det;
  function resetViews() {
    live = { tab: 'live', page: 1, area: '', q: '', sortKey: 'placed', sortDir: -1 };
    unas = { page: 1 };
    rid = { zone: '', status: 'online', q: '', page: 1 };
    pay = { week: '', q: '', page: 1 };
    det = { tab: 'summary', eta: '', riderPick: '', cancelReason: '' };
  }
  resetViews();

  function money(n) { return FD.money(n); }
  function patchAll() { return I.read('ops_patch', {}); }
  function patchOne(id) { return patchAll()[id] || null; }
  function setPatch(id, fn) { var p = patchAll(); p[id] = fn(p[id] || {}); I.write('ops_patch', p); }

  function restName(id) { var r = W.restaurants[String(id)]; return r ? r.name : (id ? 'Restaurant ' + id : ''); }
  function riderLabel(id) {
    var r = W.riderById[String(id)];
    return r ? 'R-' + id + ' ' + I.shortName(r.name) : (id ? 'R-' + id : '');
  }

  function todaysRows() {
    var dayStart = I.epoch(I.date(T) + ' 00:00:00');
    var p = patchAll();
    var rows = [];
    for (var i = 0; i < W.orders.length; i++) {
      var raw = W.orders[i];
      if (raw._p === null || raw._p < dayStart || raw._p > T) { continue; }
      var o = I.normOrder(raw);
      rows.push({ o: o, s: I.orderState(o, T, p[raw._id]) });
    }
    return rows;
  }

  var TABS = [
    { key: 'live', label: 'Live', test: function (r) { return !r.s.final; } },
    { key: 'placed', label: 'Waiting for restaurant', test: function (r) { return r.s.status === 'placed'; } },
    { key: 'norider', label: 'No rider yet', test: function (r) { return r.s.status === 'accepted' || r.s.status === 'ready'; } },
    { key: 'assigned', label: 'Rider assigned', test: function (r) { return r.s.status === 'assigned'; } },
    { key: 'picked', label: 'Picked up', test: function (r) { return r.s.status === 'picked_up'; } },
    { key: 'old', label: 'Older than 45 min', test: function (r) { return !r.s.final && I.mins(T - r.o.placed) > 45; } },
    { key: 'delivered', label: 'Delivered today', test: function (r) { return r.s.status === 'delivered'; } },
    { key: 'cancelled', label: 'Cancelled today', test: function (r) { return r.s.status === 'cancelled'; } }
  ];

  function onRoster(r) {
    var day = I.date(T);
    if (/^(left|inactive|terminated|quit)$/i.test(r.status)) { return false; }
    if (r.left_on && String(r.left_on).slice(0, 10) <= day) { return false; }
    if (r.joined_on && String(r.joined_on).slice(0, 10) > day) { return false; }
    return true;
  }
  var busyCache = null;
  function busyMap() {
    if (busyCache && busyCache.T === T) { return busyCache.map; }
    var map = {};
    todaysRows().forEach(function (r) {
      if ((r.s.status === 'assigned' || r.s.status === 'picked_up') && r.s.rider_id !== null) {
        var k = String(r.s.rider_id);
        (map[k] = map[k] || []).push(r.o.id);
      }
    });
    busyCache = { T: T, map: map };
    return map;
  }
  function shiftOnline(r) {
    if (!W.shifts.length) { return null; }
    if (!W.shiftIndex) {
      W.shiftIndex = {};
      W.shifts.forEach(function (s) {
        var k = String(s.rider_id) + '|' + String(s.date || '').slice(0, 10);
        (W.shiftIndex[k] = W.shiftIndex[k] || []).push(s);
      });
    }
    var list = W.shiftIndex[String(r.id) + '|' + I.date(T)] || [];
    function at(v) {
      if (!v) { return null; }
      v = String(v);
      return I.epoch(v.length <= 8 ? I.date(T) + ' ' + v : v);
    }
    for (var i = 0; i < list.length; i++) {
      var a = at(list[i].login_at), b = at(list[i].logout_at);
      if (a !== null && T >= a && (b === null || T < b)) { return true; }
    }
    return false;
  }
  function riderStatus(r) {
    var busy = busyMap();
    if (busy[String(r.id)]) { return 'Busy'; }
    if (!onRoster(r)) { return 'Left'; }
    var sh = shiftOnline(r);
    var online = sh !== null ? sh : (I.hash(r.id + ':' + I.date(T)) % 100 < 66);
    return online ? 'Idle' : 'Offline';
  }

  function link(text, hash, testid) {
    return el('a', { href: hash, text: text, 'data-testid': testid || null });
  }
  var tbl = I.tbl;

  function shell() {
    root.innerHTML = '';
    var search = el('input', { class: 'in-input', placeholder: 'Order #', 'data-testid': 'ops-find-input', 'aria-label': 'Order number' });
    function go() {
      var v = search.value.trim().replace(/^#/, '');
      if (!v) { I.toast('Type an order number first.'); return; }
      var key = W.byId[v] ? v : I.orderId(v);
      if (key && W.byId[key]) { location.hash = '#/order/' + key; } else { I.toast('Order ' + v + ' not found.'); }
    }
    search.addEventListener('keydown', function (e) { if (e.key === 'Enter') { go(); } });
    clockEl = el('span', { class: 'in-top-info', 'data-testid': 'ops-clock' });
    navEl = el('nav', { class: 'in-nav', 'data-testid': 'ops-nav' });
    mainEl = el('main', { class: 'in-main', 'data-testid': 'ops-main' });
    root.appendChild(el('div', { class: 'in-app' }, [
      el('header', { class: 'in-top' }, [
        el('span', { class: 'in-brand' }, ['Food Delivery', el('em', { text: 'Ops' })]),
        search,
        el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-find-go', onclick: go }, [I.icon('search'), 'Find']),
        el('span', { class: 'in-spacer' }),
        clockEl,
        el('span', { class: 'in-top-info', text: 'ops@fooddelivery.example' }),
        el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-logout', onclick: function () {
          FD_DATA.write('persona', null, true);
          location.hash = '';
          location.reload();
        } }, [I.icon('logout'), 'Log out'])
      ]),
      navEl, mainEl
    ]));
  }
  function setClock() {
    clockEl.textContent = 'Board time ' + FD_DATA.fmtDateTime(I.iso(T));
  }
  var NAV = [
    { key: 'orders', label: 'Live orders', hash: '#/orders' },
    { key: 'unassigned', label: 'Unassigned', hash: '#/unassigned' },
    { key: 'riders', label: 'Riders', hash: '#/riders' },
    { key: 'payouts', label: 'Payout reconciliation', hash: '#/payouts' }
  ];
  function drawNav(active) {
    navEl.innerHTML = '';
    NAV.forEach(function (n) {
      navEl.appendChild(el('a', { href: n.hash, class: n.key === active ? 'is-active' : '', 'data-testid': 'ops-nav-' + n.key, text: n.label }));
    });
  }

  var lastKey = '';
  var nextTab = null;
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    var name = parts[0] || 'orders';
    var key = name === 'order' ? 'order/' + parts[1] : name;
    if (key !== lastKey) {
      resetViews();
      lastKey = key;
      if (nextTab) { det.tab = nextTab; nextTab = null; }
    }
    T = I.boardTime(W);
    setClock();
    mainEl.innerHTML = '';
    if (name === 'order') { drawNav(''); viewOrder(parts[1]); }
    else if (name === 'unassigned') { drawNav('unassigned'); viewUnassigned(); }
    else if (name === 'riders') { drawNav('riders'); viewRiders(); }
    else if (name === 'payouts') { drawNav('payouts'); viewPayouts(); }
    else { drawNav('orders'); viewLive(); }
    mainEl.scrollTop = 0;
  }
  function redraw() {
    var st = mainEl.scrollTop;
    T = I.boardTime(W);
    setClock();
    mainEl.innerHTML = '';
    var name = location.hash.replace(/^#\/?/, '').split('/')[0] || 'orders';
    if (name === 'order') { viewOrder(location.hash.split('/')[2]); }
    else if (name === 'unassigned') { viewUnassigned(); }
    else if (name === 'riders') { viewRiders(); }
    else if (name === 'payouts') { viewPayouts(); }
    else { viewLive(); }
    mainEl.scrollTop = st;
  }

  function refreshBtn() {
    return el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-refresh', onclick: function () {
      I.refreshClock();
      redraw();
      I.toast('Refreshed. Board time is now ' + I.hm(T) + '.');
    } }, [I.icon('refresh'), 'Refresh']);
  }

  function sortRows(rows, key, dir) {
    return rows.slice().sort(function (a, b) {
      var na = Number(String(a.o.id).replace(/\D/g, '')), nb = Number(String(b.o.id).replace(/\D/g, ''));
      var x = key === 'id' ? na : a.o.placed;
      var y = key === 'id' ? nb : b.o.placed;
      if (x === y) { return na - nb; }
      return (x - y) * dir;
    });
  }
  function viewLive() {
    var all = todaysRows();
    var tab = TABS.filter(function (t) { return t.key === live.tab; })[0] || TABS[0];
    var rows = all.filter(tab.test);
    if (live.area) { rows = rows.filter(function (r) { return r.o.area === live.area; }); }
    if (live.q) {
      var q = live.q.toLowerCase();
      var qd = q.replace(/^#/, '').replace(/^o/, '').replace(/^0+(?=\d)/, '');
      rows = rows.filter(function (r) { return String(r.o.id).toLowerCase().indexOf(q) !== -1 || (qd && /^\d+$/.test(qd) && String(r.o.id).indexOf(qd) !== -1) || restName(r.o.restaurant_id).toLowerCase().indexOf(q) !== -1; });
    }
    rows = sortRows(rows, live.sortKey, live.sortDir);
    var areas = {};
    all.forEach(function (r) { if (r.o.area) { areas[r.o.area] = 1; } });

    mainEl.appendChild(el('h1', { class: 'in-h1', text: 'Live orders' }));
    mainEl.appendChild(el('div', { class: 'in-chips', 'data-testid': 'ops-tabs' }, TABS.map(function (t) {
      return el('button', { type: 'button', class: 'in-chip' + (t.key === live.tab ? ' is-on' : ''), 'data-testid': 'ops-tab-' + t.key, text: t.label,
        onclick: function () { live.tab = t.key; live.page = 1; redraw(); } });
    })));
    var qInput = el('input', { class: 'in-input', placeholder: 'Order # or restaurant', value: live.q, 'data-testid': 'ops-live-search' });
    qInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { live.q = qInput.value.trim(); live.page = 1; redraw(); } });
    var areaSel = el('select', { class: 'in-select', 'data-testid': 'ops-live-area' }, [el('option', { value: '', text: 'All areas' })].concat(
      Object.keys(areas).sort().map(function (a) { return el('option', { value: a, text: a, selected: a === live.area ? 'selected' : null }); })));
    areaSel.addEventListener('change', function () { live.area = areaSel.value; live.page = 1; redraw(); });
    mainEl.appendChild(el('div', { class: 'in-toolbar' }, [
      el('label', { text: 'Area' }), areaSel, qInput,
      el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-live-go', text: 'Search', onclick: function () { live.q = qInput.value.trim(); live.page = 1; redraw(); } }),
      el('span', { class: 'in-spacer' }),
      el('span', { class: 'in-muted', text: 'Last refreshed ' + I.hm(T) }),
      refreshBtn()
    ]));

    var total = rows.length;
    var maxPage = Math.max(1, Math.ceil(total / PAGE));
    if (live.page > maxPage) { live.page = maxPage; }
    var slice = rows.slice((live.page - 1) * PAGE, live.page * PAGE);
    function arrow(k) { return live.sortKey === k ? (live.sortDir < 0 ? ' ▾' : ' ▴') : ''; }
    function sorter(k) { return function () { if (live.sortKey === k) { live.sortDir = -live.sortDir; } else { live.sortKey = k; live.sortDir = -1; } redraw(); }; }
    var cols = [
      { h: 'Order #', key: 'id', sort: sorter('id'), arrow: arrow('id') },
      { h: 'Placed', key: 'placed', sort: sorter('placed'), arrow: arrow('placed') },
      { h: 'Min', cls: 'in-num' },
      { h: 'Restaurant' }, { h: 'Area' }, { h: 'Status' }, { h: 'Rider' },
      { h: 'ETA', cls: 'in-num' }, { h: 'Food Tk', cls: 'in-num' }, { h: 'Fee Tk', cls: 'in-num' }, { h: 'Pay' }
    ];
    var body = slice.map(function (r) {
      return {
        data: { orderId: r.o.id },
        cells: [
          link(String(r.o.id), '#/order/' + r.o.id, 'ops-order-link'),
          I.hm(r.o.placed),
          String(I.mins(T - r.o.placed)),
          restName(r.o.restaurant_id), r.o.area, I.orderPill(r.s.status),
          r.s.rider_id !== null ? riderLabel(r.s.rider_id) : '',
          r.s.eta !== null && r.s.eta !== undefined ? String(r.s.eta) : '',
          String(Math.round(r.o.items_total)), String(Math.round(r.o.delivery_fee)),
          r.o.payment_method
        ]
      };
    });
    mainEl.appendChild(tbl(cols, body, { testid: 'ops-live-table', empty: 'No orders in this tab.' }));
    mainEl.appendChild(I.pager(live.page, total, PAGE, function (p) { live.page = p; redraw(); }));
  }

  function viewUnassigned() {
    var rows = todaysRows().filter(function (r) { return r.s.status === 'accepted' || r.s.status === 'ready'; });
    rows.sort(function (a, b) { return a.o.placed - b.o.placed; });
    mainEl.appendChild(el('h1', { class: 'in-h1', text: 'Unassigned orders' }));
    mainEl.appendChild(el('p', { class: 'in-sub', text: 'Orders accepted by the restaurant that have no rider yet. Open an order to assign a rider.' }));
    mainEl.appendChild(el('div', { class: 'in-toolbar' }, [
      el('span', { text: rows.length + ' orders waiting' }), el('span', { class: 'in-spacer' }),
      el('span', { class: 'in-muted', text: 'Last refreshed ' + I.hm(T) }), refreshBtn()
    ]));
    var total = rows.length;
    var maxPage = Math.max(1, Math.ceil(total / PAGE));
    if (unas.page > maxPage) { unas.page = maxPage; }
    var slice = rows.slice((unas.page - 1) * PAGE, unas.page * PAGE);
    var cols = [{ h: 'Order #' }, { h: 'Area' }, { h: 'Restaurant' }, { h: 'Placed' }, { h: 'Waiting (min)', cls: 'in-num' }, { h: 'Status' }, { h: '' }];
    mainEl.appendChild(tbl(cols, slice.map(function (r) {
      return {
        data: { orderId: r.o.id },
        cells: [
          link(String(r.o.id), '#/order/' + r.o.id, 'ops-unassigned-link'),
          r.o.area, restName(r.o.restaurant_id), I.hm(r.o.placed), String(I.mins(T - r.o.placed)), I.orderPill(r.s.status),
          el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-unassigned-assign', text: 'Assign',
            onclick: function () { nextTab = 'assign'; location.hash = '#/order/' + r.o.id; } })
        ]
      };
    }), { testid: 'ops-unassigned-table', empty: 'No orders are waiting for a rider.' }));
    mainEl.appendChild(I.pager(unas.page, total, PAGE, function (p) { unas.page = p; redraw(); }));
  }

  function viewRiders() {
    var list = W.riders.filter(onRoster).map(function (r) { return { r: r, st: riderStatus(r) }; });
    var zones = {};
    list.forEach(function (x) { if (x.r.zone) { zones[x.r.zone] = 1; } });
    var wanted = rid.status;
    var rows = list.filter(function (x) {
      if (rid.zone && x.r.zone !== rid.zone) { return false; }
      if (wanted === 'online' && x.st === 'Offline') { return false; }
      if (wanted === 'busy' && x.st !== 'Busy') { return false; }
      if (wanted === 'idle' && x.st !== 'Idle') { return false; }
      if (wanted === 'offline' && x.st !== 'Offline') { return false; }
      if (rid.q) {
        var q = rid.q.toLowerCase();
        if (String(x.r.id).indexOf(q) === -1 && x.r.name.toLowerCase().indexOf(q) === -1) { return false; }
      }
      return true;
    });
    rows.sort(function (a, b) {
      if (a.r.zone !== b.r.zone) { return String(a.r.zone).localeCompare(String(b.r.zone)); }
      return Number(a.r.id) - Number(b.r.id);
    });
    mainEl.appendChild(el('h1', { class: 'in-h1', text: 'Riders' }));
    mainEl.appendChild(el('div', { class: 'in-nav', style: { padding: 0, marginBottom: '8px', borderBottom: '1px solid var(--fd-hair)', background: 'transparent' } }, [
      el('a', { class: 'is-active', text: 'List', 'data-testid': 'ops-riders-list' }),
      el('span', { class: 'ops-subtle-tab', title: 'Not available yet', 'data-testid': 'ops-riders-map', text: 'Map (not available)' })
    ]));
    var zoneSel = el('select', { class: 'in-select', 'data-testid': 'ops-riders-zone' }, [el('option', { value: '', text: 'All zones' })].concat(
      Object.keys(zones).sort().map(function (z) { return el('option', { value: z, text: z, selected: z === rid.zone ? 'selected' : null }); })));
    zoneSel.addEventListener('change', function () { rid.zone = zoneSel.value; rid.page = 1; redraw(); });
    var stSel = el('select', { class: 'in-select', 'data-testid': 'ops-riders-status' },
      [['online', 'Online'], ['busy', 'Busy'], ['idle', 'Idle'], ['offline', 'Offline'], ['all', 'All on roster']].map(function (o) {
        return el('option', { value: o[0], text: o[1], selected: o[0] === rid.status ? 'selected' : null });
      }));
    stSel.addEventListener('change', function () { rid.status = stSel.value; rid.page = 1; redraw(); });
    var q = el('input', { class: 'in-input', placeholder: 'Rider # or name', value: rid.q, 'data-testid': 'ops-riders-search' });
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { rid.q = q.value.trim(); rid.page = 1; redraw(); } });
    mainEl.appendChild(el('div', { class: 'in-toolbar' }, [
      el('label', { text: 'Zone' }), zoneSel, el('label', { text: 'Status' }), stSel, q,
      el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-riders-go', text: 'Search', onclick: function () { rid.q = q.value.trim(); rid.page = 1; redraw(); } }),
      el('span', { class: 'in-spacer' }), el('span', { class: 'in-muted', text: rows.length + ' riders' }), refreshBtn()
    ]));
    var maxPage = Math.max(1, Math.ceil(rows.length / PAGE));
    if (rid.page > maxPage) { rid.page = maxPage; }
    var slice = rows.slice((rid.page - 1) * PAGE, rid.page * PAGE);
    var busy = busyMap();
    var out = [], lastZone = null;
    slice.forEach(function (x) {
      if (x.r.zone !== lastZone) {
        lastZone = x.r.zone;
        var n = rows.filter(function (y) { return y.r.zone === lastZone; }).length;
        out.push({ group: (lastZone || 'No zone') + ' (' + n + ')' });
      }
      var active = busy[String(x.r.id)] || [];
      out.push({
        data: { riderId: x.r.id },
        cells: [
          'R-' + x.r.id, x.r.name, x.r.zone, I.titleize(x.r.vehicle), x.st,
          active.length ? el('span', null, active.slice(0, 3).map(function (id, i) {
            return [i ? ', ' : '', link(String(id), '#/order/' + id, 'ops-rider-order')];
          })) : '',
          I.lang(x.r.language), x.r.rating !== null ? x.r.rating.toFixed(1) : 'New', x.r.phone
        ]
      });
    });
    mainEl.appendChild(tbl([{ h: 'Rider' }, { h: 'Name' }, { h: 'Zone' }, { h: 'Vehicle' }, { h: 'Status' }, { h: 'Active orders' },
      { h: 'App language' }, { h: 'Rating', cls: 'in-num' }, { h: 'Phone' }], out, { testid: 'ops-riders-table', empty: 'No riders match.' }));
    mainEl.appendChild(I.pager(rid.page, rows.length, PAGE, function (p) { rid.page = p; redraw(); }));
  }

  var CANCEL_REASONS = [['customer_cancel', 'Customer asked to cancel'], ['restaurant_closed', 'Restaurant closed'],
    ['restaurant_item_unavailable', 'Item not available'], ['no_rider', 'No rider found'], ['other', 'Other']];

  function viewOrder(id) {
    var raw = W.byId[String(id)] || W.byId[I.orderId(id)];
    mainEl.appendChild(el('div', { class: 'in-toolbar' }, [
      el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-back', onclick: function () { location.hash = '#/orders'; } }, [I.icon('back'), 'Back to orders'])
    ]));
    if (!raw) {
      mainEl.appendChild(el('div', { class: 'in-panel', 'data-testid': 'ops-order-missing', text: 'Order ' + id + ' was not found.' }));
      return;
    }
    var o = I.normOrder(raw);
    var p = patchOne(o.id);
    var Td = T;
    var future = o.placed > T;
    if (future) { Td = o.placed + 3 * 86400; }
    var s = I.orderState(o, Td, p);
    var rest = W.restaurants[String(o.restaurant_id)] || {};

    mainEl.appendChild(el('div', { class: 'ops-order-head' }, [
      el('h1', { text: 'Order ' + o.id, 'data-testid': 'ops-order-title' }),
      I.orderPill(s.status),
      el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-copy-id', onclick: function () {
        I.copyText(o.id);
        I.toast('Copied ' + o.id + '.');
      } }, [I.icon('copy'), 'Copy order ID']),
      future ? el('span', { class: 'in-muted', text: 'Placed after the current board time. Showing the final state.' }) : null
    ]));

    var TABS_D = [['summary', 'Summary'], ['timeline', 'Timeline'], ['customer', 'Customer'], ['restaurant', 'Restaurant'],
      ['rider', 'Rider'], ['payment', 'Payment'], ['assign', 'Assign or cancel']];
    mainEl.appendChild(el('div', { class: 'in-tabs', 'data-testid': 'ops-detail-tabs' }, TABS_D.map(function (t) {
      return el('button', { type: 'button', class: t[0] === det.tab ? 'is-active' : '', 'data-testid': 'ops-dtab-' + t[0], text: t[1],
        onclick: function () { det.tab = t[0]; redraw(); } });
    })));
    var box = el('div', { class: 'in-panel ops-detail', 'data-testid': 'ops-detail-body' });
    mainEl.appendChild(box);

    function kv(pairs) {
      var dl = el('dl', { class: 'in-kv' });
      pairs.forEach(function (x) { dl.appendChild(el('dt', { text: x[0] })); dl.appendChild(el('dd', null, x[1] === null || x[1] === undefined ? '' : x[1])); });
      return dl;
    }

    if (det.tab === 'summary') {
      box.appendChild(kv([
        ['Order ID', String(o.id)], ['Status', I.STATUS_LABEL[s.status] || s.status],
        ['Placed at', FD_DATA.fmtDateTime(I.iso(o.placed))], ['Restaurant', restName(o.restaurant_id)],
        ['Area', o.area], ['Rider', s.rider_id !== null ? riderLabel(s.rider_id) : 'None'],
        ['Food value', money(o.items_total)], ['Promised ETA', (s.eta !== null && s.eta !== undefined ? s.eta + ' min' : '') + (p && p.eta ? ' (manual)' : '')],
        ['First order', o.is_first ? 'Yes' : 'No']
      ]));
      var etaIn = el('input', { class: 'in-input', value: det.eta, 'data-testid': 'ops-eta-input', 'aria-label': 'New ETA in minutes' });
      box.appendChild(el('div', { class: 'ops-eta' }, [
        el('label', { class: 'in-muted', text: 'Change promised ETA (min)' }), etaIn,
        el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-eta-save', text: 'Update ETA', onclick: function () {
          var v = parseInt(etaIn.value, 10);
          if (!v || v < 10 || v > 180) { I.toast('Enter an ETA between 10 and 180 minutes.'); return; }
          setPatch(o.id, function (x) { x.eta = v; return x; });
          det.eta = '';
          I.toast('ETA for order ' + o.id + ' set to ' + v + ' min.');
          redraw();
        } })
      ]));
    }

    if (det.tab === 'timeline') {
      var t = s.times, ev = [];
      ev.push([t.placed, 'Order placed', o.payment_method ? 'Payment: ' + o.payment_method : '']);
      if (t.accepted !== null && t.accepted <= Td) { ev.push([t.accepted, 'Accepted by restaurant', 'after ' + (t.accepted - t.placed) + ' sec']); }
      if (t.assigned !== null && t.assigned <= Td && s.rider_id !== null) { ev.push([t.assigned, 'Rider assigned', riderLabel(s.rider_id) + (p && p.assign ? ' (manual)' : '')]); }
      if (t.ready !== null && t.ready <= Td && t.cancelled === null) { ev.push([t.ready, 'Food ready', o.food_ready_min !== null ? o.food_ready_min + ' min after accept' : '']); }
      if (t.picked !== null && t.picked <= Td) { ev.push([t.picked, 'Picked up', '']); }
      if (t.delivered !== null && t.delivered <= Td) { ev.push([t.delivered, 'Delivered', I.mins(t.delivered - t.placed) + ' min after placing']); }
      if (t.cancelled !== null && t.cancelled <= Td) {
        ev.push([t.cancelled, 'Cancelled', [I.titleize(p && p.cancel ? p.cancel.reason : o.cancel_reason), o.cancel_stage ? 'at stage: ' + I.titleize(o.cancel_stage) : ''].filter(Boolean).join(', ')]);
      }
      ev.sort(function (a, b) { return a[0] - b[0]; });
      box.appendChild(tbl([{ h: 'Time' }, { h: 'Event' }, { h: 'Note' }], ev.map(function (e) {
        return { cells: [FD_DATA.fmtDateTime(I.iso(e[0])), e[1], e[2]] };
      }), { testid: 'ops-timeline' }));
      box.appendChild(el('p', { text: 'Rider calls to customer: ' + o.calls, 'data-testid': 'ops-calls', style: { marginTop: '8px', marginBottom: 0 } }));
    }

    if (det.tab === 'customer') {
      var acc = W.accounts[String(o.account_id)] || {};
      box.appendChild(kv([
        ['Name', I.personName('customer', o.account_id)], ['Phone', I.personPhone('customer', o.account_id)],
        ['Account', String(o.account_id)], ['Area', o.area],
        ['Language', I.lang(acc.preferred_language)], ['Phone OS', I.titleize(acc.phone_os || '')],
        ['App version', o.app_version || acc.app_version_now || ''], ['Orders in system', String(W.accountOrderCount[String(o.account_id)] || 1)]
      ]));
    }

    if (det.tab === 'restaurant') {
      box.appendChild(kv([
        ['Restaurant', restName(o.restaurant_id)], ['ID', String(o.restaurant_id)], ['Area', rest.area || ''],
        ['Cuisine', I.titleize(rest.cuisine || '')], ['Type', I.titleize(rest.type || '')],
        ['Average prep time', rest.prep !== null && rest.prep !== undefined ? rest.prep + ' min' : ''],
        ['KAM', rest.kam || '']
      ]));
    }

    if (det.tab === 'rider') {
      if (s.rider_id === null) {
        box.appendChild(el('p', { text: 'No rider on this order.', style: { margin: 0 } }));
      } else {
        var rd = W.riderById[String(s.rider_id)] || {};
        box.appendChild(kv([
          ['Rider', 'R-' + s.rider_id + ' ' + (rd.name || '')], ['Phone', rd.phone || ''], ['Zone', rd.zone || ''],
          ['Vehicle', I.titleize(rd.vehicle || '')], ['App language', I.lang(rd.language)],
          ['Rating', rd.rating !== null && rd.rating !== undefined ? rd.rating.toFixed(1) : 'New'],
          ['Calls to customer', String(o.calls)]
        ]));
      }
      var offs = W.offers[String(o.id)] || [];
      if (offs.length) {
        box.appendChild(el('h2', { class: 'in-h1', style: { marginTop: '10px' }, text: 'Offers sent' }));
        box.appendChild(tbl([{ h: 'Rider' }, { h: 'Offered' }, { h: 'Pickup km', cls: 'in-num' }, { h: 'Response' }, { h: 'Sec', cls: 'in-num' }],
          offs.map(function (x) {
            var g = I.g;
            return { cells: ['R-' + g(x, 'rider_id'), I.hm(I.epoch(g(x, 'offered_at'))), String(g(x, 'pickup_distance_km') || ''), I.titleize(g(x, 'response') || ''), String(g(x, 'response_sec') || '')] };
          }), { testid: 'ops-offers' }));
      }
    }

    if (det.tab === 'payment') {
      box.appendChild(kv([
        ['Food value', money(o.items_total)], ['Delivery fee', money(o.delivery_fee)],
        ['Promo code', o.promo_code || 'None'], ['Discount', money(o.discount)], ['Discount paid by', I.titleize(o.funded_by)],
        ['Customer pays', money(o.items_total + o.delivery_fee + o.platform_fee - o.discount)], ['Method', I.titleize(o.payment_method)]
      ]));
    }

    if (det.tab === 'assign') {
      if (s.final) {
        box.appendChild(el('p', { text: 'This order is closed (' + (I.STATUS_LABEL[s.status] || s.status).toLowerCase() + '). Nothing can be changed.', 'data-testid': 'ops-closed', style: { margin: 0 } }));
      } else {
        var canAssign = s.status !== 'picked_up' && s.status !== 'placed';
        box.appendChild(el('h2', { class: 'in-h1', text: s.rider_id !== null ? 'Reassign rider' : 'Assign rider' }));
        if (!canAssign) {
          box.appendChild(el('p', { class: 'in-note', 'data-testid': 'ops-assign-blocked',
            text: s.status === 'placed' ? 'The restaurant has not accepted this order yet.' : 'The rider has already picked up this order.' }));
        } else {
          var sel = el('select', { class: 'in-select', 'data-testid': 'ops-assign-select', 'aria-label': 'Rider' }, [el('option', { value: '', text: 'Select a rider' })].concat(
            W.riders.filter(onRoster).map(function (r) {
              return el('option', { value: String(r.id), text: 'R-' + r.id + '  ' + r.name + '  ' + r.zone + '  ' + riderStatus(r), selected: String(r.id) === det.riderPick ? 'selected' : null });
            })));
          sel.addEventListener('change', function () { det.riderPick = sel.value; });
          box.appendChild(el('div', { class: 'ops-assign-row' }, [sel,
            el('button', { type: 'button', class: 'in-btn in-btn-primary', 'data-testid': 'ops-assign-go', text: 'Assign', onclick: function () {
              if (!sel.value) { I.toast('Select a rider first.'); return; }
              var rr = W.riderById[sel.value];
              I.confirmBox('Assign R-' + sel.value + ' ' + (rr ? rr.name : '') + ' to order ' + o.id + '? The customer is notified.', function () {
                setPatch(o.id, function (x) { x.assign = { rider_id: rr ? rr.id : sel.value, at: T }; return x; });
                det.riderPick = '';
                I.toast('Order ' + o.id + ' assigned to R-' + sel.value + '.');
                redraw();
              }, 'Assign');
            } })]));
        }
        box.appendChild(el('h2', { class: 'in-h1', style: { marginTop: '14px' }, text: 'Cancel order' }));
        var rs = el('select', { class: 'in-select', 'data-testid': 'ops-cancel-reason', 'aria-label': 'Cancel reason' },
          [el('option', { value: '', text: 'Select a reason' })].concat(CANCEL_REASONS.map(function (c) { return el('option', { value: c[0], text: c[1] }); })));
        box.appendChild(el('div', { class: 'ops-assign-row' }, [rs,
          el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-cancel-go', text: 'Cancel order', onclick: function () {
            if (!rs.value) { I.toast('Select a reason first.'); return; }
            I.confirmBox('Cancel order ' + o.id + '? This cannot be undone.', function () {
              setPatch(o.id, function (x) { x.cancel = { reason: rs.value, at: T }; return x; });
              I.toast('Order ' + o.id + ' cancelled.');
              redraw();
            }, 'Cancel order', 'Cancel order');
          } })]));
      }
    }
  }

  function viewPayouts() {
    var rows = W.payouts;
    var weeks = {};
    rows.forEach(function (r) { weeks[r.week_start] = r.week_end; });
    var wkKeys = Object.keys(weeks).sort().reverse();
    if (!pay.week || wkKeys.indexOf(pay.week) === -1) { pay.week = wkKeys[0] || ''; }
    var recon = I.read('ops_recon', {});
    var sel = rows.filter(function (r) { return r.week_start === pay.week; });
    if (pay.q) {
      var q = pay.q.toLowerCase();
      sel = sel.filter(function (r) { return String(r.restaurant_id).indexOf(q) !== -1 || restName(r.restaurant_id).toLowerCase().indexOf(q) !== -1 || r.restaurant_name.toLowerCase().indexOf(q) !== -1; });
    }
    var weekSel = el('select', { class: 'in-select', 'data-testid': 'ops-pay-week' }, wkKeys.map(function (k) {
      var label = /^\d/.test(k) ? FD_DATA.fmtDate(k) + ' to ' + FD_DATA.fmtDate(weeks[k]) : k;
      return el('option', { value: k, text: label, selected: k === pay.week ? 'selected' : null });
    }));
    weekSel.addEventListener('change', function () { pay.week = weekSel.value; pay.page = 1; redraw(); });
    var qIn = el('input', { class: 'in-input', placeholder: 'Restaurant # or name', value: pay.q, 'data-testid': 'ops-pay-search' });
    qIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { pay.q = qIn.value.trim(); pay.page = 1; redraw(); } });
    var totalPay = sel.reduce(function (s, r) { return s + r.payout; }, 0);
    var done = sel.filter(function (r) { return recon[r.id]; }).length;

    mainEl.appendChild(el('h1', { class: 'in-h1', text: 'Payout reconciliation' }));
    mainEl.appendChild(el('p', { class: 'in-sub', text: 'Type the amount the bank shows for each restaurant, check the difference, then mark the row reconciled.' }));
    mainEl.appendChild(el('div', { class: 'in-toolbar' }, [
      el('label', { text: 'Week' }), weekSel, qIn,
      el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-pay-go', text: 'Search', onclick: function () { pay.q = qIn.value.trim(); pay.page = 1; redraw(); } }),
      el('span', { class: 'in-spacer' }),
      el('span', { class: 'in-muted', 'data-testid': 'ops-pay-summary', text: sel.length + ' payouts, ' + money(totalPay) + ' total, ' + done + ' reconciled' }),
      el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-pay-csv', onclick: function () {
        I.downloadCsv('payouts-' + pay.week + '.csv', [['restaurant_id', 'restaurant', 'orders', 'gross_tk', 'commission_pct', 'commission_tk', 'deductions_tk', 'payout_tk', 'method', 'paid_on']].concat(
          sel.map(function (r) { return [r.restaurant_id, restName(r.restaurant_id) || r.restaurant_name, r.orders, r.gross, r.pct, r.commission, r.deductions, r.payout, r.method, r.paid_on]; })));
        I.toast('CSV downloaded.');
      } }, [I.icon('download'), 'Export CSV'])
    ]));
    var maxPage = Math.max(1, Math.ceil(sel.length / PAGE));
    if (pay.page > maxPage) { pay.page = maxPage; }
    var slice = sel.slice((pay.page - 1) * PAGE, pay.page * PAGE);
    var cols = [{ h: 'Restaurant #' }, { h: 'Name' }, { h: 'Orders', cls: 'in-num' }, { h: 'Sales Tk', cls: 'in-num' }, { h: 'Comm %', cls: 'in-num' },
      { h: 'Comm Tk', cls: 'in-num' }, { h: 'Deduct Tk', cls: 'in-num' }, { h: 'Payout Tk', cls: 'in-num' }, { h: 'Method' }, { h: 'Paid on' },
      { h: 'Days', cls: 'in-num' }, { h: 'Bank Tk' }, { h: 'Diff', cls: 'in-num' }, { h: '' }];
    mainEl.appendChild(tbl(cols, slice.map(function (r) {
      var rec = recon[r.id];
      var bank = el('input', { class: 'in-input ops-recon-input', value: rec && rec.bank !== null ? String(rec.bank) : '', disabled: rec ? 'disabled' : null, 'data-testid': 'ops-pay-bank', 'aria-label': 'Bank amount' });
      var diff = el('span', { text: rec && rec.bank !== null ? String(rec.bank - r.payout) : '' });
      bank.addEventListener('input', function () {
        var v = parseFloat(bank.value);
        diff.textContent = isNaN(v) ? '' : String(Math.round(v - r.payout));
      });
      function mark() {
        var v = bank.value.trim() === '' ? null : parseFloat(bank.value);
        function commit() {
          var m = I.read('ops_recon', {});
          m[r.id] = { bank: v === null || isNaN(v) ? null : v, at: I.iso(T) };
          I.write('ops_recon', m);
          I.toast('Restaurant ' + r.restaurant_id + ' marked reconciled.');
          redraw();
        }
        if (v === null) { I.confirmBox('No bank amount entered. Mark as reconciled anyway?', commit, 'Mark reconciled'); } else { commit(); }
      }
      return {
        data: { payoutId: r.id },
        cells: [
          String(r.restaurant_id), restName(r.restaurant_id) || r.restaurant_name, String(r.orders), FD_DATA.groupBd(r.gross),
          r.pct !== null ? String(r.pct) : '', FD_DATA.groupBd(r.commission), FD_DATA.groupBd(r.deductions), FD_DATA.groupBd(r.payout),
          I.titleize(r.method), r.paid_on ? FD_DATA.fmtDate(r.paid_on) : 'Not paid', r.days !== null ? String(r.days) : '',
          bank, diff,
          rec ? el('span', null, [el('span', { class: 'in-tag', text: 'Reconciled' }), ' ',
            el('button', { type: 'button', class: 'in-link', 'data-testid': 'ops-pay-undo', text: 'Undo', onclick: function () {
              var m = I.read('ops_recon', {}); delete m[r.id]; I.write('ops_recon', m); I.toast('Reconciliation removed.'); redraw();
            } })])
            : el('button', { type: 'button', class: 'in-btn', 'data-testid': 'ops-pay-mark', text: 'Mark reconciled', onclick: mark })
        ]
      };
    }), { testid: 'ops-pay-table', empty: 'No payouts for this week.' }));
    mainEl.appendChild(I.pager(pay.page, sel.length, PAGE, function (p) { pay.page = p; redraw(); }));
  }

  function start() {
    root.innerHTML = '<div class="in-loading">Loading orders...</div>';
    I.loadWorld().then(function (w) {
      W = w;
      T = I.boardTime(W);
      shell();
      window.addEventListener('hashchange', route);
      route();
    }).catch(function (e) {
      root.innerHTML = '';
      root.appendChild(el('div', { class: 'in-loading in-err', 'data-testid': 'ops-load-error', text: 'Could not load data: ' + e.message }));
    });
  }

  FD.requireSession({
    persona: 'ops', title: 'Food Delivery Ops', subtitle: 'Back office console', lang: 'en',
    identifier: 'ops@fooddelivery.example', identifierLabel: 'Email'
  }, start);
})();
