(function () {
  'use strict';

  var FD = window.FD, I = window.FD_INT, el = FD.el;
  var root = document.getElementById('support-root');
  var W = null, T = 0;
  var mainEl = null, navEl = null, clockEl = null;
  var PER = 25;
  var ME = 'Agent 07';
  var tbl = I.tbl;

  var inb, det;
  function resetViews() {
    inb = { status: 'unsolved', cat: '', channel: '', assignee: '', range: '7d', q: '', page: 1, sortKey: 'wait', sortDir: -1 };
    det = { tab: 'customer', catOpen: false, catPick: '', linkOrder: '' };
  }
  resetViews();

  var REASONS = [
    ['MISSING_ITEM', 'Missing item'], ['WRONG_ITEM', 'Wrong item'], ['FOOD_SPILLED', 'Food spilled or damaged'],
    ['LATE_DELIVERY', 'Late delivery'], ['NOT_DELIVERED', 'Order not delivered'], ['DOUBLE_CHARGE', 'Payment taken twice'],
    ['GOODWILL', 'Goodwill'], ['OTHER', 'Other']
  ];
  var PAID_BY = [['company', 'Company'], ['promo', 'Promo budget']];
  var APPROVAL_LIMIT = 500;

  var STATUS_LABEL = { 'new': 'New', open: 'Open', pending: 'Pending', hold: 'Waiting for supervisor', solved: 'Solved' };
  var PILL = { 'new': 'placed', open: 'transit', pending: 'accepted', hold: 'placed', solved: 'delivered' };
  function statusPill(s) {
    return el('span', { class: 'fd-pill in-pill', dataset: { status: PILL[s] || 'placed' }, text: STATUS_LABEL[s] || s });
  }
  function money(n) { return FD.money(n); }
  function wait(min) {
    if (min < 60) { return min + 'm'; }
    if (min < 1440) { var m = min % 60; return Math.floor(min / 60) + 'h ' + (m < 10 ? '0' : '') + m + 'm'; }
    return Math.floor(min / 1440) + 'd ' + Math.floor((min % 1440) / 60) + 'h';
  }

  function patches() { return I.read('sup_patch', {}); }
  function setPatch(id, fn) { var p = patches(); p[id] = fn(p[id] || {}); I.write('sup_patch', p); }
  function msgs(id) { return (I.read('sup_msgs', {}))[id] || []; }
  function addMsg(id, m) { var all = I.read('sup_msgs', {}); (all[id] = all[id] || []).push(m); I.write('sup_msgs', all); }
  function logEntry(id, text) { var all = I.read('sup_log', {}); (all[id] = all[id] || []).push({ at: T, text: text }); I.write('sup_log', all); }
  function refunds() { return I.read('sup_refunds', []); }

  function stateOf(t) { return I.ticketState(t, T, patches()[t.id]); }
  function orderOf(t) { var p = patches()[t.id]; var v = p && p.order_id ? p.order_id : t.order_id; return v ? (I.orderId(v) || v) : v; }
  function subject(t) {
    var n = t.note || '(no message text)';
    return n.length > 54 ? n.slice(0, 54) + '...' : n;
  }

  function shell() {
    root.innerHTML = '';
    var search = el('input', { class: 'in-input', placeholder: 'Ticket #', 'data-testid': 'sp-find-input', 'aria-label': 'Ticket number' });
    function go() {
      var v = search.value.trim().replace(/^#/, '');
      if (!v) { I.toast('Type a ticket number first.'); return; }
      if (W.ticketById[v]) { location.hash = '#/ticket/' + v; } else { I.toast('Ticket ' + v + ' not found.'); }
    }
    search.addEventListener('keydown', function (e) { if (e.key === 'Enter') { go(); } });
    clockEl = el('span', { class: 'in-top-info', 'data-testid': 'sp-clock' });
    navEl = el('nav', { class: 'in-nav', 'data-testid': 'sp-nav' });
    mainEl = el('main', { class: 'in-main', 'data-testid': 'sp-main' });
    root.appendChild(el('div', { class: 'in-app' }, [
      el('header', { class: 'in-top' }, [
        el('span', { class: 'in-brand' }, ['Food Delivery', el('em', { text: 'Support' })]),
        search,
        el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-find-go', onclick: go }, [I.icon('search'), 'Find']),
        el('span', { class: 'in-spacer' }),
        clockEl,
        el('span', { class: 'in-top-info', text: 'agent07@fooddelivery.example' }),
        el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-logout', onclick: function () {
          FD_DATA.write('persona', null, true);
          location.hash = '';
          location.reload();
        } }, [I.icon('logout'), 'Log out'])
      ]),
      navEl, mainEl
    ]));
  }
  function setClock() { clockEl.textContent = 'Now ' + FD_DATA.fmtDateTime(I.iso(T)); }
  var NAV = [
    { key: 'inbox', label: 'Inbox', hash: '#/inbox' },
    { key: 'approvals', label: 'Approvals', hash: '#/approvals' },
    { key: 'csat', label: 'CSAT', hash: '#/csat' }
  ];
  function drawNav(active) {
    navEl.innerHTML = '';
    NAV.forEach(function (n) {
      var pending = n.key === 'approvals' ? refunds().filter(function (r) { return r.status === 'pending'; }).length : 0;
      navEl.appendChild(el('a', { href: n.hash, class: n.key === active ? 'is-active' : '', 'data-testid': 'sp-nav-' + n.key, text: n.label + (pending ? ' (' + pending + ')' : '') }));
    });
  }

  var lastKey = '';
  function parts() { return location.hash.replace(/^#\/?/, '').split('/'); }
  function draw(fresh) {
    var pt = parts();
    var name = pt[0] || 'inbox';
    var key = name === 'ticket' ? 'ticket/' + pt[1] : name;
    if (fresh && key !== lastKey) { resetViews(); lastKey = key; }
    T = I.boardTime(W);
    setClock();
    var st = mainEl.scrollTop;
    mainEl.innerHTML = '';
    if (name === 'ticket') { drawNav(''); viewTicket(pt[1]); }
    else if (name === 'approvals') { drawNav('approvals'); viewApprovals(); }
    else if (name === 'csat') { drawNav('csat'); viewCsat(); }
    else { drawNav('inbox'); viewInbox(); }
    mainEl.scrollTop = fresh ? 0 : st;
  }
  function route() { draw(true); }
  function redraw() { draw(false); }

  function inRange(t) {
    var today = I.epoch(I.date(T) + ' 00:00:00');
    if (inb.range === 'today') { return t.created >= today; }
    if (inb.range === '7d') { return t.created >= T - 7 * 86400; }
    if (inb.range === '30d') { return t.created >= T - 30 * 86400; }
    return true;
  }
  function viewInbox() {
    var all = W.tickets.filter(function (t) { return t.created !== null && t.created <= T; }).map(function (t) { return { t: t, s: stateOf(t) }; });
    var recent = all.filter(function (r) { return r.t.created >= T - 30 * 86400; });
    var today = I.epoch(I.date(T) + ' 00:00:00');
    function cnt(st) { return recent.filter(function (r) { return r.s.status === st; }).length; }
    var solvedToday = recent.filter(function (r) { return r.s.status === 'solved' && r.s.solvedAt !== null && r.s.solvedAt >= today; }).length;

    var rows = all.filter(function (r) { return inRange(r.t); }).filter(function (r) {
      if (inb.status === 'unsolved' && r.s.status === 'solved') { return false; }
      if (inb.status !== 'unsolved' && inb.status !== 'all' && r.s.status !== inb.status) { return false; }
      if (inb.cat && r.s.category !== inb.cat) { return false; }
      if (inb.assignee === 'me' && r.s.assignee !== ME) { return false; }
      if (inb.assignee === 'none' && r.s.assignee) { return false; }
      if (inb.q) {
        var q = inb.q.toLowerCase();
        var qd = q.replace(/^#/, '').replace(/^o/, '').replace(/^0+(?=\d)/, '');
        var oidTxt = String(orderOf(r.t) || '');
        var hitOrder = oidTxt.toLowerCase().indexOf(q) !== -1 || (qd && /^\d+$/.test(qd) && oidTxt.indexOf(qd) !== -1);
        if (String(r.t.id).toLowerCase().indexOf(q) === -1 && !hitOrder && String(r.t.note).toLowerCase().indexOf(q) === -1) { return false; }
      }
      return true;
    });
    rows.sort(function (a, b) {
      var x = inb.sortKey === 'id' ? Number(a.t.id) : a.s.waitMin;
      var y = inb.sortKey === 'id' ? Number(b.t.id) : b.s.waitMin;
      return x === y ? Number(a.t.id) - Number(b.t.id) : (x - y) * inb.sortDir;
    });

    mainEl.appendChild(el('h1', { class: 'in-h1', text: 'Inbox' }));
    mainEl.appendChild(el('div', { class: 'sp-strip', 'data-testid': 'sp-strip' }, [
      el('span', null, ['New ', el('b', { text: String(cnt('new')) })]),
      el('span', null, ['Open ', el('b', { text: String(cnt('open')) })]),
      el('span', null, ['Pending ', el('b', { text: String(cnt('pending')) })]),
      el('span', null, ['Waiting for supervisor ', el('b', { text: String(cnt('hold')) })]),
      el('span', null, ['Solved today ', el('b', { text: String(solvedToday) })])
    ]));

    function select(label, key, options, testid) {
      var s = el('select', { class: 'in-select', 'data-testid': testid }, options.map(function (o) {
        return el('option', { value: o[0], text: o[1], selected: o[0] === inb[key] ? 'selected' : null });
      }));
      s.addEventListener('change', function () { inb[key] = s.value; inb.page = 1; redraw(); });
      return [el('label', { text: label }), s];
    }
    var q = el('input', { class: 'in-input', placeholder: 'Ticket #, order # or text', value: inb.q, 'data-testid': 'sp-search' });
    q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { inb.q = q.value.trim(); inb.page = 1; redraw(); } });
    mainEl.appendChild(el('div', { class: 'in-toolbar' },
      select('Status', 'status', [['unsolved', 'Not solved'], ['new', 'New'], ['open', 'Open'], ['pending', 'Pending'], ['hold', 'Waiting for supervisor'], ['solved', 'Solved'], ['all', 'All']], 'sp-f-status')
        .concat(select('Category', 'cat', [['', 'All']].concat(I.NINE.map(function (c) { return [c, I.catLabel(c)]; })), 'sp-f-cat'))
        .concat(select('Assignee', 'assignee', [['', 'Anyone'], ['me', 'Me'], ['none', 'Unassigned']], 'sp-f-assignee'))
        .concat(select('Created', 'range', [['today', 'Today'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['all', 'All time']], 'sp-f-range'))
        .concat([q,
          el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-search-go', text: 'Search', onclick: function () { inb.q = q.value.trim(); inb.page = 1; redraw(); } }),
          el('span', { class: 'in-spacer' }),
          el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-refresh', onclick: function () { I.refreshClock(); redraw(); I.toast('Refreshed.'); } }, [I.icon('refresh'), 'Refresh'])
        ])));

    var total = rows.length;
    var maxPage = Math.max(1, Math.ceil(total / PER));
    if (inb.page > maxPage) { inb.page = maxPage; }
    var slice = rows.slice((inb.page - 1) * PER, inb.page * PER);
    function arrow(k) { return inb.sortKey === k ? (inb.sortDir < 0 ? ' ▾' : ' ▴') : ''; }
    function sorter(k) { return function () { if (inb.sortKey === k) { inb.sortDir = -inb.sortDir; } else { inb.sortKey = k; inb.sortDir = -1; } redraw(); }; }
    var cols = [
      { h: 'Ticket #', key: 'id', sort: sorter('id'), arrow: arrow('id') }, { h: 'Status' }, { h: 'Subject' }, { h: 'Customer' },
      { h: 'Category' }, { h: 'Order #' }, { h: 'Assignee' }, { h: 'Created' },
      { h: 'Wait', key: 'wait', sort: sorter('wait'), arrow: arrow('wait'), cls: 'in-num' }
    ];
    mainEl.appendChild(tbl(cols, slice.map(function (r) {
      return {
        data: { ticketId: r.t.id },
        cells: [
          el('a', { href: '#/ticket/' + r.t.id, text: String(r.t.id), 'data-testid': 'sp-ticket-link' }),
          statusPill(r.s.status), subject(r.t), I.personName('customer', r.t.account_id),
          I.catLabel(r.s.category), orderOf(r.t) ? String(orderOf(r.t)) : '', r.s.assignee || '',
          FD_DATA.fmtDateTime(I.iso(r.t.created)).replace(/^\d+ \w+ \d{4}, /, I.date(r.t.created) === I.date(T) ? 'Today ' : '$&'),
          wait(r.s.waitMin)
        ]
      };
    }), { testid: 'sp-table', empty: 'No tickets match these filters.' }));
    mainEl.appendChild(I.pager(inb.page, total, PER, function (p) { inb.page = p; redraw(); }));
  }

  function viewTicket(id) {
    mainEl.appendChild(el('div', { class: 'in-toolbar' }, [
      el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-back', onclick: function () { location.hash = '#/inbox'; } }, [I.icon('back'), 'Back to inbox'])
    ]));
    var t = W.ticketById[String(id)];
    if (!t) { mainEl.appendChild(el('div', { class: 'in-panel', 'data-testid': 'sp-missing', text: 'Ticket ' + id + ' was not found.' })); return; }
    var s = stateOf(t);

    mainEl.appendChild(el('div', { class: 'sp-head' }, [
      el('h1', { text: 'Ticket ' + t.id, 'data-testid': 'sp-ticket-title' }), statusPill(s.status),
      el('span', { class: 'in-muted', text: 'Opened ' + FD_DATA.fmtDateTime(I.iso(t.created)) })
    ]));

    var actions = el('div', { class: 'sp-actions' });
    actions.appendChild(el('span', { text: 'Category: ' }));
    actions.appendChild(el('b', { text: I.catLabel(s.category), 'data-testid': 'sp-category' }));
    actions.appendChild(el('button', { type: 'button', class: 'in-link', 'data-testid': 'sp-cat-change', text: 'Change', onclick: function () { det.catOpen = !det.catOpen; det.catPick = ''; redraw(); } }));
    actions.appendChild(el('span', { class: 'in-spacer' }));
    actions.appendChild(el('span', { class: 'in-muted', text: 'Assignee: ' + (s.assignee || 'Unassigned') }));
    actions.appendChild(el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-assign-me', text: 'Assign to me', disabled: s.assignee === ME ? 'disabled' : null, onclick: function () {
      setPatch(t.id, function (x) { x.assignee = ME; return x; });
      logEntry(t.id, 'Assigned to ' + ME);
      I.toast('Ticket ' + t.id + ' assigned to you.');
      redraw();
    } }));
    actions.appendChild(el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-escalate', text: 'Escalate', disabled: s.status === 'solved' ? 'disabled' : null, onclick: function () { escalate(t); } }));
    actions.appendChild(el('button', { type: 'button', class: 'in-btn in-btn-primary', 'data-testid': 'sp-solve', text: 'Mark solved', disabled: s.status === 'solved' ? 'disabled' : null, onclick: function () {
      I.confirmBox('Mark ticket ' + t.id + ' as solved? A CSAT survey is sent to the customer.', function () { solve(t); }, 'Mark solved');
    } }));
    mainEl.appendChild(actions);

    if (det.catOpen) {
      var panel = el('div', { class: 'sp-catpanel', 'data-testid': 'sp-catpanel' });
      I.NINE.forEach(function (c) {
        var r = el('input', { type: 'radio', name: 'sp-cat', value: c, 'data-testid': 'sp-cat-' + c, checked: (det.catPick || s.category) === c ? 'checked' : null });
        r.addEventListener('change', function () { det.catPick = c; });
        panel.appendChild(el('label', null, [r, I.catLabel(c)]));
      });
      panel.appendChild(el('div', { class: 'sp-catfoot' }, [
        el('button', { type: 'button', class: 'in-btn in-btn-primary', 'data-testid': 'sp-cat-apply', text: 'Apply', onclick: function () {
          var c = det.catPick;
          if (!c || c === s.category) { I.toast('Pick a different category first.'); return; }
          setPatch(t.id, function (x) { x.category = c; return x; });
          logEntry(t.id, 'Category changed from ' + I.catLabel(s.category) + ' to ' + I.catLabel(c));
          det.catOpen = false; det.catPick = '';
          I.toast('Category set to ' + I.catLabel(c) + '.');
          redraw();
        } }),
        el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-cat-cancel', text: 'Cancel', onclick: function () { det.catOpen = false; redraw(); } })
      ]));
      mainEl.appendChild(panel);
    }

    var left = el('div');
    var right = el('div', { class: 'sp-side' });
    mainEl.appendChild(el('div', { class: 'sp-detail' }, [left, right]));

    var thread = el('div', { class: 'sp-thread in-panel', 'data-testid': 'sp-thread' });
    function bubble(kind, who, at, text) {
      var d = el('div', { class: 'sp-msg ' + kind });
      if (kind !== 'is-system') { d.appendChild(el('div', { class: 'sp-msg-meta', text: who + (at !== null ? ', ' + I.hm(at) : '') })); }
      d.appendChild(el('div', { text: text }));
      return d;
    }
    thread.appendChild(bubble('is-system', '', null, 'Ticket opened by ' + I.personName('customer', t.account_id) + ', ' + FD_DATA.fmtDateTime(I.iso(t.created))));
    thread.appendChild(bubble('', I.personName('customer', t.account_id), t.created, t.note || '(no message text)'));
    if (s.firstAt !== null && s.firstAt <= T) {
      var frmTxt = t.first_response_min < 120 ? t.first_response_min + ' min' : (Math.round(t.first_response_min / 6) / 10) + ' hours';
      thread.appendChild(bubble('is-system', '', null, 'First response from agent after ' + frmTxt));
    }
    msgs(t.id).forEach(function (m) { thread.appendChild(bubble(m.kind === 'system' ? 'is-system' : 'is-agent', m.who || ME, m.at, m.text)); });
    if (s.status === 'solved' && s.solvedAt !== null) { thread.appendChild(bubble('is-system', '', null, 'Marked solved ' + FD_DATA.fmtDateTime(I.iso(s.solvedAt)))); }
    left.appendChild(thread);

    var box = el('textarea', { class: 'in-textarea', rows: 4, placeholder: 'Type your reply', 'data-testid': 'sp-reply-box', 'aria-label': 'Reply' });
    function send(andSolve) {
      var text = box.value.trim();
      if (!text) { I.toast('Type a reply first.'); return; }
      addMsg(t.id, { kind: 'agent', who: ME, at: T, text: text });
      setPatch(t.id, function (x) {
        if (andSolve) { x.status = 'solved'; x.solved_at = T; } else if (!x.status) { x.status = 'pending'; }
        if (!x.assignee) { x.assignee = ME; }
        return x;
      });
      logEntry(t.id, 'Reply sent' + (andSolve ? ' and ticket solved' : ''));
      I.toast(andSolve ? 'Reply sent. Ticket solved, survey sent.' : 'Reply sent.');
      redraw();
    }
    left.appendChild(el('div', { class: 'sp-reply in-panel' }, [
      box,
      el('div', { class: 'in-toolbar', style: { marginTop: '6px', marginBottom: 0 } }, [
        el('span', { class: 'in-note', text: 'Plain text only.' }), el('span', { class: 'in-spacer' }),
        el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-send', text: 'Send reply', disabled: s.status === 'solved' ? 'disabled' : null, onclick: function () { send(false); } }),
        el('button', { type: 'button', class: 'in-btn in-btn-primary', 'data-testid': 'sp-send-solve', text: 'Send and solve', disabled: s.status === 'solved' ? 'disabled' : null, onclick: function () { send(true); } })
      ])
    ]));

    var TABS = [['customer', 'Customer'], ['order', 'Order'], ['refund', 'Refund'], ['history', 'History']];
    right.appendChild(el('div', { class: 'in-tabs', 'data-testid': 'sp-tabs' }, TABS.map(function (x) {
      return el('button', { type: 'button', class: x[0] === det.tab ? 'is-active' : '', 'data-testid': 'sp-tab-' + x[0], text: x[1], onclick: function () { det.tab = x[0]; redraw(); } });
    })));
    var side = el('div', { class: 'in-panel', 'data-testid': 'sp-side-body' });
    right.appendChild(side);
    function kv(pairs) {
      var dl = el('dl', { class: 'in-kv', style: { gridTemplateColumns: '110px 1fr' } });
      pairs.forEach(function (p) { dl.appendChild(el('dt', { text: p[0] })); dl.appendChild(el('dd', null, p[1] === null || p[1] === undefined ? '' : p[1])); });
      return dl;
    }

    if (det.tab === 'customer') {
      var acc = W.accounts[String(t.account_id)] || {};
      var same = W.tickets.filter(function (x) { return String(x.account_id) === String(t.account_id) && x.id !== t.id; });
      side.appendChild(kv([
        ['Name', I.personName('customer', t.account_id)], ['Phone', I.personPhone('customer', t.account_id)], ['Account', String(t.account_id)],
        ['Area', acc.area || ''], ['Language', I.lang(acc.preferred_language)], ['Phone', [I.titleize(acc.phone_os || ''), I.titleize(acc.phone_operator || '')].filter(Boolean).join(', ')],
        ['App version', acc.app_version_now || ''], ['Customer since', acc.signup_on ? FD_DATA.fmtDate(acc.signup_on) : ''],
        ['Other tickets', same.length ? el('span', null, same.slice(0, 5).map(function (x, i) { return [i ? ', ' : '', el('a', { href: '#/ticket/' + x.id, text: String(x.id), 'data-testid': 'sp-other-ticket' })]; })) : 'None']
      ]));
    }

    if (det.tab === 'order') {
      var oid = orderOf(t);
      if (oid) {
        side.appendChild(kv([['Order ID', String(oid)]]));
        side.appendChild(el('div', { class: 'in-toolbar' }, [
          el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-copy-order', onclick: function () { I.copyText(oid); I.toast('Copied ' + oid + '.'); } }, [I.icon('copy'), 'Copy order ID']),
          el('a', { class: 'in-btn', href: '../ops-tool/index.html#/order/' + encodeURIComponent(oid), target: '_blank', rel: 'noopener', 'data-testid': 'sp-open-ops' }, [I.icon('external'), 'Open Ops tool'])
        ]));
      } else {
        side.appendChild(el('p', { style: { margin: '0 0 8px' }, text: 'No order is linked to this ticket.', 'data-testid': 'sp-no-order' }));
        var li = el('input', { class: 'in-input', placeholder: 'Order #', 'data-testid': 'sp-link-order-input', 'aria-label': 'Order number' });
        side.appendChild(el('div', { class: 'in-toolbar' }, [li, el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-link-order', text: 'Link order', onclick: function () {
          var v = li.value.trim();
          v = I.orderId(v);
          if (!v) { I.toast('Enter an order number.'); return; }
          setPatch(t.id, function (x) { x.order_id = v; return x; });
          logEntry(t.id, 'Order ' + v + ' linked');
          I.toast('Order ' + v + ' linked.');
          redraw();
        } })]));
      }
    }

    if (det.tab === 'refund') { refundTab(side, t, s); }

    if (det.tab === 'history') {
      var ev = [[t.created, 'Ticket opened']];
      if (s.firstAt !== null && s.firstAt <= T) { ev.push([s.firstAt, 'First response']); }
      (I.read('sup_log', {})[t.id] || []).forEach(function (l) { ev.push([l.at, l.text]); });
      if (t.refund_tk > 0 && s.status === 'solved' && s.solvedAt !== null) { ev.push([s.solvedAt, 'Refund of ' + money(t.refund_tk) + ' paid by ' + (t.refund_paid_by || 'company')]); }
      if (s.status === 'solved' && s.solvedAt !== null && s.solvedAt <= T) { ev.push([s.solvedAt, 'Solved']); }
      ev.sort(function (a, b) { return a[0] - b[0]; });
      side.appendChild(tbl([{ h: 'Time' }, { h: 'Event' }], ev.map(function (e) { return { cells: [FD_DATA.fmtDateTime(I.iso(e[0])), e[1]] }; }), { testid: 'sp-history' }));
    }
  }

  function solve(t) {
    setPatch(t.id, function (x) { x.status = 'solved'; x.solved_at = T; return x; });
    logEntry(t.id, 'Marked solved. CSAT survey sent');
    I.toast('Ticket ' + t.id + ' solved. Survey sent to the customer.');
    redraw();
  }
  function escalate(t) {
    var sel = el('select', { class: 'in-select', 'data-testid': 'sp-esc-to' }, [['ops', 'Ops'], ['kam', 'KAM team']].map(function (o) { return el('option', { value: o[0], text: o[1] }); }));
    var note = el('textarea', { class: 'in-textarea', rows: 3, placeholder: 'What do they need to do?', 'data-testid': 'sp-esc-note' });
    I.modal({
      title: 'Escalate ticket ' + t.id,
      body: el('div', null, [el('div', { class: 'in-field' }, [el('label', { text: 'Send to' }), sel]), el('div', { class: 'in-field' }, [el('label', { text: 'Note' }), note])]),
      buttons: [
        { label: 'Cancel', testid: 'sp-esc-cancel' },
        { label: 'Escalate', primary: true, testid: 'sp-esc-go', onclick: function () {
          if (!note.value.trim()) { I.toast('Add a note first.'); return false; }
          var to = sel.value === 'ops' ? 'Ops' : 'KAM team';
          addMsg(t.id, { kind: 'system', at: T, text: 'Escalated to ' + to + ': ' + note.value.trim() });
          logEntry(t.id, 'Escalated to ' + to);
          setPatch(t.id, function (x) { if (!x.status) { x.status = 'pending'; } return x; });
          I.toast('Ticket ' + t.id + ' sent to ' + to + '.');
          redraw();
        } }
      ]
    });
  }

  function refundTab(side, t, s) {
    var done = refunds().filter(function (r) { return String(r.ticket) === String(t.id); });
    var amount = el('input', { class: 'in-input sp-amount', type: 'number', min: '1', placeholder: 'Tk', 'data-testid': 'sp-refund-amount', 'aria-label': 'Amount in Tk' });
    var reason = el('select', { class: 'in-select', 'data-testid': 'sp-refund-reason', 'aria-label': 'Reason code' },
      [el('option', { value: '', text: 'Select a reason' })].concat(REASONS.map(function (r) { return el('option', { value: r[0], text: r[0] + ' ' + r[1] }); })));
    var paid = el('select', { class: 'in-select', 'data-testid': 'sp-refund-paidby', 'aria-label': 'Paid by' }, PAID_BY.map(function (p) { return el('option', { value: p[0], text: p[1] }); }));
    var note = el('textarea', { class: 'in-textarea', rows: 2, 'data-testid': 'sp-refund-note', 'aria-label': 'Note' });
    side.appendChild(el('div', { class: 'in-field' }, [el('label', { text: 'Amount (Tk)' }), amount]));
    side.appendChild(el('div', { class: 'in-field' }, [el('label', { text: 'Reason code' }), reason]));
    side.appendChild(el('div', { class: 'in-field' }, [el('label', { text: 'Paid by' }), paid]));
    side.appendChild(el('div', { class: 'in-field' }, [el('label', { text: 'Note' }), note]));
    side.appendChild(el('p', { class: 'in-note', text: 'Refunds over ' + money(APPROVAL_LIMIT) + ' need supervisor approval.' }));
    side.appendChild(el('button', { type: 'button', class: 'in-btn in-btn-primary', 'data-testid': 'sp-refund-submit', text: 'Submit refund', disabled: s.status === 'solved' ? 'disabled' : null, onclick: function () {
      var a = parseInt(amount.value, 10);
      if (!a || a < 1) { I.toast('Enter the refund amount.'); return; }
      if (a > 5000) { I.toast('Amount is too high. The limit is Tk 5,000 a ticket.'); return; }
      if (!reason.value) { I.toast('Select a reason code.'); return; }
      var needs = a > APPROVAL_LIMIT;
      I.confirmBox(needs
        ? 'Send a refund of ' + money(a) + ' to a supervisor for approval?'
        : 'Refund ' + money(a) + ' to the customer? This cannot be undone.', function () {
        var list = refunds();
        list.push({ ticket: t.id, amount: a, reason: reason.value, paid_by: paid.value, note: note.value.trim(), at: T, by: ME, status: needs ? 'pending' : 'issued' });
        I.write('sup_refunds', list);
        if (needs) {
          setPatch(t.id, function (x) { x.status = 'hold'; return x; });
          logEntry(t.id, 'Refund of ' + money(a) + ' (' + reason.value + ') sent for supervisor approval');
          I.toast('Refund sent to a supervisor.');
        } else {
          addMsg(t.id, { kind: 'system', at: T, text: 'Refund of ' + money(a) + ' issued (' + reason.value + ', paid by ' + (paid.value === 'company' ? 'Company' : 'Promo budget') + ')' });
          logEntry(t.id, 'Refund of ' + money(a) + ' issued (' + reason.value + ')');
          I.toast('Refund of ' + money(a) + ' issued.');
        }
        redraw();
      }, needs ? 'Send for approval' : 'Refund');
    } }));
    if (t.refund_tk > 0 && s.status === 'solved') {
      side.appendChild(el('p', { class: 'in-note', style: { marginTop: '8px' }, text: 'Earlier refund on this ticket: ' + money(t.refund_tk) + ' paid by ' + (t.refund_paid_by || 'company') + '.' }));
    }
    if (done.length) {
      side.appendChild(el('h2', { class: 'in-h1', style: { marginTop: '10px' }, text: 'Refunds from this tool' }));
      side.appendChild(tbl([{ h: 'Tk', cls: 'in-num' }, { h: 'Reason' }, { h: 'Status' }], done.map(function (r) {
        return { cells: [String(r.amount), r.reason, I.titleize(r.status === 'pending' ? 'waiting for supervisor' : r.status)] };
      }), { testid: 'sp-refund-list' }));
    }
  }

  function viewApprovals() {
    var list = refunds().map(function (r, i) { r.idx = i; return r; });
    var pending = list.filter(function (r) { return r.status === 'pending'; });
    var past = list.filter(function (r) { return r.status !== 'pending' && r.status !== 'issued'; }).slice(-10).reverse();
    mainEl.appendChild(el('h1', { class: 'in-h1', text: 'Approvals' }));
    mainEl.appendChild(el('p', { class: 'in-sub', text: 'Refunds over ' + money(APPROVAL_LIMIT) + ' wait here for a supervisor.' }));
    function decide(r, ok) {
      I.confirmBox((ok ? 'Approve' : 'Reject') + ' the refund of ' + money(r.amount) + ' on ticket ' + r.ticket + '?', function () {
        var all = refunds();
        all[r.idx].status = ok ? 'approved' : 'rejected';
        I.write('sup_refunds', all);
        setPatch(r.ticket, function (x) { x.status = 'open'; return x; });
        logEntry(r.ticket, 'Refund of ' + money(r.amount) + (ok ? ' approved' : ' rejected') + ' by supervisor');
        if (ok) { addMsg(r.ticket, { kind: 'system', at: T, text: 'Refund of ' + money(r.amount) + ' approved and issued (' + r.reason + ')' }); }
        I.toast('Refund ' + (ok ? 'approved' : 'rejected') + '.');
        redraw();
      }, ok ? 'Approve' : 'Reject', 'Supervisor decision');
    }
    mainEl.appendChild(tbl([{ h: 'Ticket #' }, { h: 'Amount Tk', cls: 'in-num' }, { h: 'Reason' }, { h: 'Paid by' }, { h: 'Asked by' }, { h: 'Time' }, { h: 'Note' }, { h: '' }],
      pending.map(function (r) {
        return {
          data: { ticketId: r.ticket },
          cells: [el('a', { href: '#/ticket/' + r.ticket, text: String(r.ticket), 'data-testid': 'sp-appr-ticket' }), String(r.amount), r.reason, I.titleize(r.paid_by), r.by, FD_DATA.fmtDateTime(I.iso(r.at)), r.note,
            el('span', null, [
              el('button', { type: 'button', class: 'in-btn in-btn-primary', 'data-testid': 'sp-appr-approve', text: 'Approve', onclick: function () { decide(r, true); } }), ' ',
              el('button', { type: 'button', class: 'in-btn', 'data-testid': 'sp-appr-reject', text: 'Reject', onclick: function () { decide(r, false); } })
            ])]
        };
      }), { testid: 'sp-appr-table', empty: 'Nothing is waiting for approval.' }));
    if (past.length) {
      mainEl.appendChild(el('h2', { class: 'in-h1', style: { marginTop: '14px' }, text: 'Recent decisions' }));
      mainEl.appendChild(tbl([{ h: 'Ticket #' }, { h: 'Amount Tk', cls: 'in-num' }, { h: 'Reason' }, { h: 'Decision' }],
        past.map(function (r) { return { cells: [String(r.ticket), String(r.amount), r.reason, I.titleize(r.status)] }; }), { testid: 'sp-appr-past' }));
    }
  }

  function viewCsat() {
    var states = W.tickets.filter(function (t) { return t.created !== null && t.created <= T; }).map(function (t) { return { t: t, s: stateOf(t) }; });
    var wd = (Math.floor(T / 86400) + 4) % 7;
    var weekStart = I.epoch(I.date(T - wd * 86400) + ' 00:00:00');
    var weeks = [];
    for (var k = 0; k < 8; k++) { weeks.push(weekStart - k * 7 * 86400); }
    var rows = weeks.map(function (ws) {
      var we = ws + 7 * 86400;
      var solved = states.filter(function (r) { return r.s.status === 'solved' && r.s.solvedAt !== null && r.s.solvedAt >= ws && r.s.solvedAt < we && r.s.solvedAt <= T; });
      var rated = solved.filter(function (r) { return r.t.csat !== null; });
      var good = rated.filter(function (r) { return r.t.csat >= 4; }).length;
      return { ws: ws, solved: solved.length, rated: rated.length, pct: rated.length ? Math.round(good / rated.length * 100) : null, low: rated.filter(function (r) { return r.t.csat <= 2; }).length };
    });
    var cur = rows[0];
    mainEl.appendChild(el('h1', { class: 'in-h1', text: 'CSAT' }));
    mainEl.appendChild(el('p', { class: 'in-sub', text: 'Share of 4 and 5 star ratings, by the week the ticket was solved. A survey is sent when a ticket is marked Solved.' }));
    mainEl.appendChild(el('div', { class: 'in-panel', style: { maxWidth: '300px', marginBottom: '10px' }, 'data-testid': 'sp-csat-now' }, [
      el('div', { class: 'in-muted', text: 'This week so far' }),
      el('div', { class: 'sp-csat-big', text: cur.pct !== null ? cur.pct + '%' : 'No ratings yet' }),
      el('div', { class: 'in-note', text: cur.rated + ' ratings from ' + cur.solved + ' solved tickets' })
    ]));
    mainEl.appendChild(tbl([{ h: 'Week starting' }, { h: 'Solved', cls: 'in-num' }, { h: 'Surveys sent', cls: 'in-num' }, { h: 'Ratings', cls: 'in-num' }, { h: '1 or 2 stars', cls: 'in-num' }, { h: 'CSAT', cls: 'in-num' }],
      rows.map(function (r) { return { cells: [FD_DATA.fmtDate(I.date(r.ws)), String(r.solved), String(r.solved), String(r.rated), String(r.low), r.pct !== null ? r.pct + '%' : ''] }; }),
      { testid: 'sp-csat-table' }));
  }

  function start() {
    root.innerHTML = '<div class="in-loading">Loading tickets...</div>';
    I.loadWorld().then(function (w) {
      W = w;
      T = I.boardTime(W);
      shell();
      window.addEventListener('hashchange', route);
      route();
    }).catch(function (e) {
      root.innerHTML = '';
      root.appendChild(el('div', { class: 'in-loading in-err', 'data-testid': 'sp-load-error', text: 'Could not load data: ' + e.message }));
    });
  }

  FD.requireSession({
    persona: 'support', title: 'Food Delivery Support', subtitle: 'Ticket tool', lang: 'en',
    identifier: 'agent07@fooddelivery.example', identifierLabel: 'Email'
  }, start);
})();
