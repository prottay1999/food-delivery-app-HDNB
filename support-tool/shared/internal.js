(function () {
  'use strict';

  var D = window.FD_DATA;
  var FD = window.FD;
  if (!D || !FD) { throw new Error('internal.js needs data.js and common.js first'); }
  var el = FD.el;

  var CONFIG = {
    orders: ['orders'],
    riders: ['riders'],
    restaurants: ['restaurants'],
    tickets: ['tickets'],
    payouts: ['payouts']
  };
  var OPTIONAL = { accounts: 'accounts', offers: 'dispatch_offers', shifts: 'rider_shifts' };

  function two(n) { return (n < 10 ? '0' : '') + n; }
  function g(o) {
    for (var i = 1; i < arguments.length; i++) {
      var v = o[arguments[i]];
      if (v !== undefined && v !== null && v !== '') { return v; }
    }
    return null;
  }
  function num(v) {
    if (v === null || v === undefined || v === '') { return null; }
    var n = Number(v);
    return isNaN(n) ? null : n;
  }
  function epoch(isoStr) {
    var p = D.parseIso(isoStr);
    return p ? Date.UTC(p.y, p.mo - 1, p.d, p.hh, p.mm, p.ss) / 1000 : null;
  }
  function iso(sec) {
    if (sec === null || sec === undefined) { return ''; }
    var d = new Date(sec * 1000);
    return d.getUTCFullYear() + '-' + two(d.getUTCMonth() + 1) + '-' + two(d.getUTCDate()) + ' ' +
      two(d.getUTCHours()) + ':' + two(d.getUTCMinutes()) + ':' + two(d.getUTCSeconds());
  }
  function hm(sec) { return sec === null || sec === undefined ? '' : iso(sec).slice(11, 16); }
  function date(sec) { return sec === null || sec === undefined ? '' : iso(sec).slice(0, 10); }
  function hash(str) {
    var x = 2166136261;
    str = String(str);
    for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  }
  function mins(sec) { return Math.floor(sec / 60); }
  function lang(v) { v = String(v || '').toLowerCase(); return v === 'bn' ? 'Bangla' : (v === 'en' ? 'English' : titleize(v)); }
  function titleize(s) {
    s = String(s || '').replace(/_/g, ' ').trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  var FIRST = ['Rahim', 'Karim', 'Nusrat', 'Sadia', 'Tanvir', 'Mehedi', 'Farhana', 'Imran', 'Jannat', 'Sohel',
    'Rubel', 'Shamima', 'Arif', 'Mitu', 'Nayeem', 'Tasnim', 'Faisal', 'Sumaiya', 'Habib', 'Rima',
    'Jahid', 'Lamia', 'Masud', 'Priya', 'Rakib', 'Sabrina', 'Tuhin', 'Urmi', 'Zahid', 'Anika',
    'Shuvo', 'Ishrat', 'Mizan', 'Nadia', 'Parvez', 'Kabir', 'Bithi', 'Alamin', 'Joya', 'Sajib'];
  var LAST = ['Uddin', 'Hossain', 'Ahmed', 'Islam', 'Rahman', 'Akter', 'Khan', 'Chowdhury', 'Mia', 'Sarker',
    'Begum', 'Hasan', 'Das', 'Roy', 'Talukder', 'Mollah', 'Sheikh', 'Biswas', 'Bhuiyan', 'Karmakar'];
  function personName(kind, id) {
    var a = hash(kind + ':a:' + id), b = hash(kind + ':b:' + id);
    return FIRST[a % FIRST.length] + ' ' + LAST[b % LAST.length];
  }
  function personPhone(kind, id) {
    var a = hash(kind + ':p:' + id);
    var pre = ['017', '018', '019', '016', '013', '015'][a % 6];
    var rest = String(hash(kind + ':q:' + id) % 100000000);
    while (rest.length < 8) { rest = '0' + rest; }
    return pre + rest.slice(0, 2) + '-' + rest.slice(2);
  }
  function shortName(full) {
    var p = String(full).split(' ');
    return p.length > 1 ? p[0] + ' ' + p[1].charAt(0) + '.' : full;
  }

  function read(key, dflt, perTab) { return D.read('int_' + key, dflt, perTab); }
  function write(key, val, perTab) { D.write('int_' + key, val, perTab); }

  function loadFirst(names) {
    names = names || [];
    function attempt(i) {
      if (i >= names.length) { return Promise.resolve([]); }
      return D.loadData(names[i]).catch(function () { return attempt(i + 1); });
    }
    return attempt(0);
  }
  function asRows(x) { return Array.isArray(x) ? x : []; }

  function orderId(v) {
    var s = String(v === null || v === undefined ? '' : v).trim().replace(/^#/, '');
    var m = /^[oO]?\s*0*(\d+)$/.exec(s);
    if (!m) { return ''; }
    var d = m[1];
    while (d.length < 7) { d = '0' + d; }
    return 'O' + d;
  }

  var LEGACY = { placed: 1, accepted: 1, ready: 1, assigned: 1, picked_up: 1, delivered: 1, cancelled: 1 };

  function normOrder(raw) {
    var o = {};
    o.id = g(raw, 'order_id', 'id');
    o.account_id = g(raw, 'account_id', 'customer_id');
    o.placed = epoch(g(raw, 'placed_at'));
    o.area = g(raw, 'area') || (raw.address && raw.address.area) || '';
    o.restaurant_id = g(raw, 'restaurant_id');
    var items = num(g(raw, 'items_total_tk'));
    if (items === null && Array.isArray(raw.items)) {
      items = raw.items.reduce(function (s, i) { return s + (i.qty || 1) * (i.price || 0); }, 0);
    }
    o.items_total = items || 0;
    o.delivery_fee = num(g(raw, 'delivery_fee_tk', 'delivery_fee')) || 0;
    o.platform_fee = num(g(raw, 'platform_fee_tk')) || 0;
    o.promo_code = g(raw, 'promo_code') || '';
    o.discount = num(g(raw, 'discount_tk', 'discount_amount')) || 0;
    o.funded_by = g(raw, 'discount_funded_by') || '';
    o.payment_method = g(raw, 'payment_method') || '';
    o.app_version = g(raw, 'app_version') || '';
    o.accept_sec = num(g(raw, 'restaurant_accept_sec'));
    o.food_ready_min = num(g(raw, 'food_ready_min'));
    o.promised_eta_min = num(g(raw, 'promised_eta_min'));
    o.delivery_min = num(g(raw, 'delivery_min'));
    o.cancel_stage = g(raw, 'cancel_stage') || '';
    o.cancel_reason = g(raw, 'cancel_reason') || '';
    o.cancelled_after_sec = num(g(raw, 'cancelled_after_sec'));
    o.rider_id = g(raw, 'rider_id');
    o.calls = num(g(raw, 'rider_calls_to_customer')) || 0;
    o.is_first = String(g(raw, 'is_first_order')) === '1' || String(g(raw, 'is_first_order')).toLowerCase() === 'true' ||
      String(g(raw, 'is_first_order')).toLowerCase() === 'yes';
    var st = String(g(raw, 'status') || 'completed');
    if (LEGACY[st] && Array.isArray(raw.timeline)) {
      o.legacy = true;
      o.legacy_status = st;
      o.legacy_timeline = raw.timeline;
    }
    o.status = st === 'delivered' ? 'completed' : st;
    return o;
  }

  var offersByOrder = {};

  function deriveTimes(o, patch) {
    var h = hash(o.id);
    var cancelled = o.status === 'cancelled' || o.status === 'no_rider_found';
    var stage = o.cancel_stage;
    var t = { placed: o.placed, accepted: null, assigned: null, ready: null, picked: null, delivered: null, cancelled: null };

    if (o.legacy) {
      o.legacy_timeline.forEach(function (e) {
        var s = epoch(e.at);
        if (e.status === 'accepted') { t.accepted = s; }
        if (e.status === 'assigned') { t.assigned = s; }
        if (e.status === 'ready') { t.ready = s; }
        if (e.status === 'picked_up') { t.picked = s; }
        if (e.status === 'delivered') { t.delivered = s; }
        if (e.status === 'cancelled') { t.cancelled = s; }
      });
      return t;
    }

    var noAccept = cancelled && stage === 'waiting_for_restaurant';
    if (!noAccept) {
      t.accepted = o.placed + (o.accept_sec !== null ? o.accept_sec : 90);
    }
    var noRider = o.status === 'no_rider_found' || (cancelled && stage === 'finding_rider') || noAccept;
    if (!noRider && t.accepted !== null) {
      var off = offersByOrder[o.id];
      var delay = 30 + (h % 150);
      if (/aftabnagar|sector 15|keraniganj|purbachal/i.test(o.area)) { delay += 240 + (h % 420); }
      var wd = (Math.floor(o.placed / 86400) + 4) % 7;
      var hh = Math.floor((o.placed % 86400) / 3600);
      if (wd === 5 && hh >= 12 && hh < 15) { delay += 180 + (h % 360); }
      t.assigned = off && off.length ? off[0] : t.accepted + delay;
      if (t.assigned < t.accepted) { t.assigned = t.accepted + 30; }
    }
    if (t.accepted !== null) {
      t.ready = t.accepted + (o.food_ready_min !== null ? o.food_ready_min * 60 : 720);
    }
    if (!cancelled) {
      if (t.assigned === null) { t.assigned = (t.accepted || o.placed) + 60; }
      t.picked = Math.max(t.ready || 0, t.assigned + 240 + (h % 240));
      var total = o.delivery_min !== null ? o.placed + o.delivery_min * 60 : t.picked + 900;
      t.delivered = Math.max(total, t.picked + 420);
    } else {
      var last = t.assigned || t.accepted || o.placed;
      var ca = o.cancelled_after_sec !== null ? o.placed + o.cancelled_after_sec : o.placed + 900;
      t.cancelled = Math.max(ca, last + 30);
    }
    if (patch) {
      if (patch.assign) {
        t.assigned = patch.assign.at;
        t.cancelled = null;
        t.ready = t.ready || (t.accepted || o.placed) + 720;
        t.picked = Math.max(t.ready, t.assigned + 240);
        t.delivered = t.picked + 900;
        if (t.accepted === null) { t.accepted = Math.min(t.assigned, o.placed + 60); }
      }
      if (patch.cancel && (!patch.assign || patch.cancel.at >= patch.assign.at)) {
        t.cancelled = patch.cancel.at;
      }
    }
    return t;
  }

  function orderState(o, T, patch) {
    var t = deriveTimes(o, patch);
    var status;
    if (o.legacy && !patch) {
      status = o.legacy_status === 'delivered' ? 'delivered' : o.legacy_status;
    } else if (t.cancelled !== null && T >= t.cancelled) { status = 'cancelled'; }
    else if (t.delivered !== null && T >= t.delivered) { status = 'delivered'; }
    else if (t.picked !== null && T >= t.picked) { status = 'picked_up'; }
    else if (t.assigned !== null && T >= t.assigned) { status = 'assigned'; }
    else if (t.accepted !== null && T >= t.accepted) { status = (t.ready !== null && T >= t.ready) ? 'ready' : 'accepted'; }
    else { status = 'placed'; }
    var rider = null;
    if (status === 'assigned' || status === 'picked_up' || status === 'delivered' ||
        (status === 'cancelled' && t.assigned !== null && T >= t.assigned)) {
      rider = patch && patch.assign ? patch.assign.rider_id : o.rider_id;
    }
    var final = status === 'delivered' || status === 'cancelled';
    var endAt = status === 'cancelled' ? t.cancelled : (status === 'delivered' ? t.delivered : null);
    var eta = patch && patch.eta ? patch.eta : o.promised_eta_min;
    return { status: status, times: t, rider_id: rider, final: final, endAt: endAt, eta: eta, manual: !!(patch && patch.assign) };
  }

  var STATUS_LABEL = {
    placed: 'Waiting for restaurant',
    accepted: 'Accepted, no rider',
    ready: 'Food ready, no rider',
    assigned: 'Rider assigned',
    picked_up: 'Picked up',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  var PILL = { placed: 'placed', accepted: 'accepted', ready: 'accepted', assigned: 'transit', picked_up: 'transit', delivered: 'delivered', cancelled: 'cancelled' };
  function orderPill(status) {
    return el('span', { class: 'fd-pill in-pill', dataset: { status: PILL[status] || 'placed' }, text: STATUS_LABEL[status] || titleize(status) });
  }

  var NINE = ['where_is_my_order', 'missing_item', 'food_spilled', 'food_quality', 'order_cancelled', 'payment', 'app_stuck', 'rider_behaviour', 'wrong_item', 'fee', 'other'];
  var CAT_LABEL = {
    where_is_my_order: 'Where is my order', missing_item: 'Missing item', food_spilled: 'Food spilled',
    payment: 'Payment', app_stuck: 'App stuck', rider_behaviour: 'Rider behaviour',
    wrong_item: 'Wrong item', fee: 'Fee', other: 'Other', food_quality: 'Food quality', order_cancelled: 'Order cancelled',
    refund_status: 'Refund status', change_address: 'Change address', promo_help: 'Promo code help'
  };
  function catLabel(c) { return CAT_LABEL[c] || titleize(c) || 'Other'; }

  function normTicket(raw) {
    var t = {};
    t.id = g(raw, 'ticket_id', 'id');
    t.created = epoch(g(raw, 'created_at'));
    t.account_id = g(raw, 'account_id', 'customer_id');
    t.order_id = g(raw, 'order_id');
    t.restaurant_id = g(raw, 'restaurant_id');
    t.category = g(raw, 'category') || 'other';
    t.note = g(raw, 'agent_note', 'body', 'customer_message') || '';
    t.first_response_min = num(g(raw, 'first_response_min'));
    t.resolved_min = num(g(raw, 'resolved_min'));
    t.handle_min = num(g(raw, 'handle_min', 'handle_time_minutes'));
    t.refund_tk = num(g(raw, 'refund_tk')) || 0;
    t.refund_paid_by = g(raw, 'refund_paid_by') || '';
    t.csat = num(g(raw, 'csat'));
    return t;
  }

  var AGENTS = ['Tania Akter', 'Sumon Das', 'Mahin Rahman', 'Lipi Khatun', 'Rasel Mia', 'Nargis Sultana', 'Hasib Khan', 'Rima Begum'];

  function ticketState(t, T, patch) {
    patch = patch || {};
    var h = hash(t.id);
    var solvedAt = patch.solved_at ? patch.solved_at : (t.resolved_min !== null ? t.created + t.resolved_min * 60 : null);
    var firstAt = t.first_response_min !== null ? t.created + t.first_response_min * 60 : null;
    var status;
    if (patch.status) { status = patch.status; }
    else if (solvedAt !== null && T >= solvedAt) { status = 'solved'; }
    else if (firstAt !== null && T >= firstAt) { status = (h % 5 === 0) ? 'pending' : 'open'; }
    else { status = 'new'; }
    var assignee = patch.assignee;
    if (assignee === undefined) {
      assignee = (status === 'new' && h % 3 !== 0) ? null : AGENTS[h % AGENTS.length];
    }
    var waitEnd = status === 'solved' ? (solvedAt !== null ? Math.min(solvedAt, T) : T) : T;
    return {
      status: status, assignee: assignee, solvedAt: solvedAt, firstAt: firstAt,
      category: patch.category || t.category,
      waitMin: Math.max(0, mins(waitEnd - t.created))
    };
  }

  function normPayouts(p) {
    var out = [];
    if (Array.isArray(p)) {
      p.forEach(function (r, i) {
        out.push({
          id: g(r, 'payout_id') || ('P' + i),
          restaurant_id: g(r, 'restaurant_id'),
          restaurant_name: g(r, 'restaurant_name') || '',
          week_start: g(r, 'week_start') || '',
          week_end: g(r, 'week_end') || '',
          orders: num(g(r, 'orders_count')) || 0,
          gross: num(g(r, 'gross_sales_tk')) || 0,
          pct: num(g(r, 'commission_pct_applied')),
          commission: num(g(r, 'commission_tk')) || 0,
          deductions: num(g(r, 'deductions_tk')) || 0,
          payout: num(g(r, 'payout_tk')) || 0,
          paid_on: g(r, 'paid_on') || '',
          days: num(g(r, 'working_days_to_pay')),
          method: g(r, 'payout_method') || ''
        });
      });
    } else if (p && Array.isArray(p.reconciliation)) {
      p.reconciliation.forEach(function (r) {
        out.push({
          id: 'L' + r.restaurant_id, restaurant_id: r.restaurant_id, restaurant_name: r.restaurant_name || '',
          week_start: 'Current period', week_end: '', orders: r.delivered_orders || 0, gross: r.gross_amount || 0,
          pct: r.gross_amount ? Math.round(r.commission / r.gross_amount * 100) : null,
          commission: r.commission || 0, deductions: r.deductions || 0, payout: r.net_amount || 0,
          paid_on: '', days: null, method: ''
        });
      });
    }
    return out;
  }

  var worldPromise = null;
  function loadWorld() {
    if (worldPromise) { return worldPromise; }
    worldPromise = D.loadData('meta').catch(function () { return {}; }).then(function (meta) {
      var listed = meta && Array.isArray(meta.files) ? meta.files : [];
      function opt(key) { return listed.indexOf(OPTIONAL[key]) !== -1 ? loadFirst([OPTIONAL[key]]) : Promise.resolve([]); }
      return Promise.all([
        Promise.resolve(meta),
        loadFirst(CONFIG.orders), loadFirst(CONFIG.riders), loadFirst(CONFIG.restaurants),
        opt('accounts'), loadFirst(CONFIG.tickets), loadFirst(CONFIG.payouts),
        opt('offers'), opt('shifts'),
        loadFirst(['ticket_orders']), loadFirst(['ticket_order_offers'])
      ]);
    }).then(function (r) {
      var W = { meta: r[0] || {} };
      var rawOrders = asRows(r[1]);
      W.orders = rawOrders;
      W.byId = {};
      var minP = Infinity, maxP = 0;
      rawOrders.forEach(function (o) {
        var id = g(o, 'order_id', 'id');
        o._id = String(id);
        o._p = epoch(g(o, 'placed_at'));
        W.byId[o._id] = o;
        if (o._p !== null) { if (o._p < minP) { minP = o._p; } if (o._p > maxP) { maxP = o._p; } }
      });
      W.minPlaced = minP === Infinity ? 0 : minP;
      W.maxPlaced = maxP;
      var extraOrders = asRows(r[9]);
      extraOrders.forEach(function (o) {
        o._id = String(g(o, 'order_id', 'id'));
        o._p = epoch(g(o, 'placed_at'));
        if (!W.byId[o._id]) { W.byId[o._id] = o; }
      });
      W.accountOrderCount = {};
      rawOrders.concat(extraOrders).forEach(function (o) {
        var a = String(g(o, 'account_id', 'customer_id'));
        W.accountOrderCount[a] = (W.accountOrderCount[a] || 0) + 1;
      });

      W.riders = asRows(r[2]).map(function (x) {
        return {
          id: g(x, 'rider_id', 'id'),
          zone: g(x, 'home_zone') || g(x, 'city') || '',
          vehicle: g(x, 'vehicle') || '',
          joined_on: g(x, 'joined_on') || '',
          language: g(x, 'app_language') || '',
          rating: num(g(x, 'rating')),
          status: String(g(x, 'status') || (x.active === 0 ? 'left' : 'active')),
          left_on: g(x, 'left_on') || '',
          name: g(x, 'name'),
          phone: g(x, 'phone')
        };
      });
      W.riderById = {};
      W.riders.forEach(function (x) {
        x.name = x.name || personName('rider', x.id);
        x.phone = x.phone || personPhone('rider', x.id);
        W.riderById[String(x.id)] = x;
      });

      W.restaurants = {};
      asRows(r[3]).forEach(function (x) {
        var id = g(x, 'restaurant_id', 'id');
        W.restaurants[String(id)] = {
          id: id, name: g(x, 'name') || ('Restaurant ' + id), area: g(x, 'area') || '', cuisine: g(x, 'cuisine') || '',
          type: g(x, 'restaurant_type') || '', prep: num(g(x, 'avg_prep_min')), kam: g(x, 'kam_id') || '', status: g(x, 'status') || ''
        };
      });

      W.accounts = {};
      asRows(r[4]).forEach(function (x) { W.accounts[String(g(x, 'account_id', 'id'))] = x; });

      W.tickets = asRows(r[5]).map(normTicket);
      W.ticketById = {};
      W.tickets.forEach(function (t) { W.ticketById[String(t.id)] = t; });

      W.payouts = normPayouts(r[6]);

      var offs = asRows(r[7]).concat(asRows(r[10]));
      offersByOrder = {};
      W.offers = {};
      offs.forEach(function (x) {
        var oid = String(g(x, 'order_id'));
        (W.offers[oid] = W.offers[oid] || []).push(x);
        if (String(g(x, 'response')) === 'accepted') {
          var at = epoch(g(x, 'offered_at'));
          if (at !== null) { offersByOrder[oid] = [at + (num(g(x, 'response_sec')) || 20)]; }
        }
      });
      W.shifts = asRows(r[8]);
      return W;
    });
    return worldPromise;
  }

  function baseTime(W) {
    var nowS = epoch(W.meta && W.meta.now);
    if (nowS !== null && W.maxPlaced && nowS >= W.minPlaced && nowS <= W.maxPlaced + 4 * 3600) { return nowS; }
    if (W.maxPlaced) { return epoch(date(W.maxPlaced) + ' 13:10:00'); }
    return nowS || 0;
  }
  function boardTime(W) {
    var off = read('clock_off', 0, true) || 0;
    return baseTime(W) + off * 120;
  }
  function refreshClock() {
    write('clock_off', (read('clock_off', 0, true) || 0) + 1, true);
  }

  var SVG = {
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.5-4.5',
    copy: 'M9 9h10v11H9zM5 15V4h10',
    download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
    logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
    check: 'M5 12.5l4.5 4.5L19 7',
    x: 'M6 6l12 12M18 6L6 18',
    back: 'M14 6l-6 6 6 6',
    next: 'M10 6l6 6-6 6',
    alert: 'M12 4l9 16H3zM12 10v4M12 17v.5',
    plus: 'M12 5v14M5 12h14',
    external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6'
  };
  function icon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'in-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', SVG[name] || SVG.x);
    svg.appendChild(p);
    return svg;
  }

  var toastTimer = null;
  function toast(msg) {
    var old = document.getElementById('in-toast');
    if (old) { old.remove(); }
    var t = el('div', { id: 'in-toast', class: 'in-toast', role: 'status', 'data-testid': 'in-toast', text: msg });
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 4500);
  }

  function modal(opts) {
    var back = el('div', { class: 'in-modal-back', 'data-testid': 'in-modal' });
    var box = el('div', { class: 'in-modal', role: 'dialog' });
    function close() { back.remove(); }
    box.appendChild(el('div', { class: 'in-modal-head' }, [
      el('span', { text: opts.title || '' }),
      el('button', { type: 'button', class: 'in-x', 'aria-label': 'Close', onclick: close, 'data-testid': 'in-modal-close' }, icon('x'))
    ]));
    box.appendChild(el('div', { class: 'in-modal-body' }, opts.body));
    var foot = el('div', { class: 'in-modal-foot' });
    (opts.buttons || []).forEach(function (b) {
      foot.appendChild(el('button', {
        type: 'button', class: 'in-btn' + (b.primary ? ' in-btn-primary' : ''), 'data-testid': b.testid || null, text: b.label,
        onclick: function () { if (!b.onclick || b.onclick(close) !== false) { close(); } }
      }));
    });
    box.appendChild(foot);
    back.appendChild(box);
    document.body.appendChild(back);
    return { close: close, box: box };
  }
  function confirmBox(message, onOk, okLabel, title) {
    return modal({
      title: title || 'Please confirm',
      body: el('p', { text: message }),
      buttons: [
        { label: 'Cancel', testid: 'in-confirm-cancel' },
        { label: okLabel || 'OK', primary: true, testid: 'in-confirm-ok', onclick: function () { onOk(); } }
      ]
    });
  }

  function copyText(text) {
    var done = function () { return true; };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(String(text)).then(done, function () { fallbackCopy(text); });
        return;
      }
    } catch (e) {  }
    fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var ta = el('textarea', { style: { position: 'fixed', left: '-9999px', top: '0' } });
    ta.value = String(text);
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {  }
    ta.remove();
  }

  function pager(page, total, per, onChange) {
    var pages = Math.max(1, Math.ceil(total / per));
    var from = total ? (page - 1) * per + 1 : 0;
    var to = Math.min(total, page * per);
    return el('div', { class: 'in-pager', 'data-testid': 'in-pager' }, [
      el('span', { class: 'in-muted', text: 'Showing ' + from + ' to ' + to + ' of ' + total }),
      el('span', { class: 'in-spacer' }),
      el('button', { type: 'button', class: 'in-btn', disabled: page <= 1 ? 'disabled' : null, 'data-testid': 'in-prev', text: 'Prev', onclick: function () { onChange(page - 1); } }),
      el('span', { text: 'Page ' + page + ' of ' + pages }),
      el('button', { type: 'button', class: 'in-btn', disabled: page >= pages ? 'disabled' : null, 'data-testid': 'in-next', text: 'Next', onclick: function () { onChange(page + 1); } })
    ]);
  }

  function tbl(cols, rows, opts) {
    opts = opts || {};
    var head = el('tr', null, cols.map(function (c) {
      var th = el('th', { class: (c.cls || '') + (c.sort ? ' is-sort' : ''), text: c.h + (c.arrow || '') });
      if (c.sort) { th.addEventListener('click', c.sort); th.setAttribute('data-testid', 'th-' + c.key); }
      return th;
    }));
    var body = el('tbody');
    rows.forEach(function (r) {
      if (r.group) {
        body.appendChild(el('tr', { class: 'in-group' }, el('td', { colspan: cols.length, text: r.group })));
        return;
      }
      body.appendChild(el('tr', { dataset: r.data || {} }, r.cells.map(function (cell, i) {
        return el('td', { class: cols[i].cls || '' }, cell);
      })));
    });
    if (!rows.length) {
      body.appendChild(el('tr', null, el('td', { colspan: cols.length, class: 'in-empty', text: opts.empty || 'No rows.' })));
    }
    return el('div', { class: 'in-tablewrap' }, el('table', { class: 'in-table', 'data-testid': opts.testid || null }, [el('thead', null, head), body]));
  }

  function downloadCsv(filename, rows) {
    var csv = rows.map(function (r) {
      return r.map(function (c) {
        var s = String(c === null || c === undefined ? '' : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  window.FD_INT = {
    CONFIG: CONFIG,
    loadWorld: loadWorld, boardTime: boardTime, refreshClock: refreshClock,
    orderId: orderId, orderState: orderState, normOrder: normOrder, deriveTimes: deriveTimes, ticketState: ticketState,
    STATUS_LABEL: STATUS_LABEL, orderPill: orderPill,
    NINE: NINE, CAT_LABEL: CAT_LABEL, catLabel: catLabel, AGENTS: AGENTS,
    personName: personName, personPhone: personPhone, shortName: shortName,
    epoch: epoch, iso: iso, hm: hm, date: date, mins: mins, hash: hash, titleize: titleize, lang: lang, g: g, num: num,
    el: el, icon: icon, toast: toast, modal: modal, confirmBox: confirmBox, copyText: copyText, pager: pager,
    tbl: tbl, downloadCsv: downloadCsv, read: read, write: write
  };
})();
