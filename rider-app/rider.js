(function () {
  "use strict";

  var FD = window.FD;
  var D = window.FD_DATA;
  var el = FD.el;
  var money = FD.money;

  var USE_SHIFTS_FILE = true;

  var OFFER_SECONDS = 30;
  var FLAT_TK = 48;

  var ICONS = {
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M16 15h2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7"/><path d="M12 17h.01"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    nav: '<path d="M12 3l7 17-7-4-7 4z"/>',
    pin: '<path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    store: '<path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3.5 9l1.4-4.4A1 1 0 0 1 5.85 4h12.3a1 1 0 0 1 .95.6L20.5 9a2.5 2.5 0 0 1-4.25 2 2.5 2.5 0 0 1-4.25 0 2.5 2.5 0 0 1-4.25 0A2.5 2.5 0 0 1 3.5 9Z"/><path d="M9.5 20v-5h5v5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    bike: '<circle cx="5.5" cy="17.5" r="3.2"/><circle cx="18.5" cy="17.5" r="3.2"/><path d="M8.5 17.5h6l-3.5-8H8"/><path d="M14 9.5h3l1.5 8"/><path d="M13.5 6.5h2.2"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.4"/>',
    file: '<path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.5 12.5a9.5 9.5 0 0 1 13 0"/><path d="M9 16a5 5 0 0 1 6 0"/><path d="M12 19.5h.01"/>',
    battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10.5v3"/><path d="M6 10v4"/><path d="M9 10v4"/><path d="M12 10v4"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    warn: '<path d="M12 3.2 2.6 20.5h18.8z"/><path d="M12 10v4.2"/><path d="M12 17.4h.01"/>'
  };
  function icon(name, cls) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("class", "rd-ic" + (cls ? " " + cls : ""));
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "1.9");
    s.setAttribute("stroke-linecap", "round");
    s.setAttribute("stroke-linejoin", "round");
    s.innerHTML = ICONS[name] || "";
    return s;
  }

  var BN = {
    "Home": "হোম", "Earnings": "আয়", "Profile": "প্রোফাইল", "Help": "সাহায্য",
    "You are offline": "আপনি অফলাইনে আছেন", "You are online": "আপনি অনলাইনে আছেন",
    "Go online": "অনলাইনে যান", "Go offline": "অফলাইনে যান",
    "Today": "আজ", "Deliveries": "ডেলিভারি", "Earned": "আয়", "Online time": "অনলাইন সময়",
    "Looking for orders": "অর্ডার খোঁজা হচ্ছে",
    "Stay on this screen. New orders show up here.": "এই স্ক্রিনে থাকুন। নতুন অর্ডার এখানে আসবে।",
    "New order": "নতুন অর্ডার", "Pickup": "পিকআপ", "Drop area": "ড্রপ এলাকা",
    "Accept": "গ্রহণ", "Decline": "বাতিল", "km": "কিমি",
    "Go to restaurant": "রেস্টুরেন্টে যান", "Navigate": "রাস্তা দেখুন", "I have arrived": "আমি পৌঁছে গেছি",
    "Call restaurant": "রেস্টুরেন্টে কল করুন", "Confirm pickup": "পিকআপ নিশ্চিত করুন",
    "Pick up the order": "অর্ডার নিন", "Items": "আইটেম", "Order": "অর্ডার",
    "Go to customer": "কাস্টমারের কাছে যান", "Call customer": "কাস্টমারকে কল করুন",
    "Delivery address": "ডেলিভারির ঠিকানা", "Collect cash": "নগদ টাকা নিন",
    "Paid online": "অনলাইনে পরিশোধিত", "Nothing to collect": "টাকা নেওয়ার নেই",
    "Delivered": "ডেলিভারি সম্পন্ন", "Delivery complete": "ডেলিভারি শেষ",
    "Trip earning": "এই ট্রিপের আয়", "Back to home": "হোমে ফিরুন",
    "Report an issue": "ডেলিভারিতে সমস্যা", "This week": "এই সপ্তাহ",
    "Trips": "ট্রিপ", "Recent trips": "সাম্প্রতিক ট্রিপ", "Recent shifts": "সাম্প্রতিক শিফট",
    "Bonuses": "বোনাস", "No bonus is running right now.": "এখন কোনো বোনাস চলছে না।",
    "Vehicle": "যানবাহন", "Motorbike": "মোটরসাইকেল", "Bicycle": "সাইকেল", "Documents": "কাগজপত্র",
    "Verified": "যাচাই করা", "Language": "ভাষা", "Sign out": "সাইন আউট",
    "Call rider ops": "রাইডার অপস-এ কল করুন", "Rider ops": "রাইডার অপস",
    "Calling": "কল করা হচ্ছে", "End call": "কল শেষ", "Close": "বন্ধ করুন", "Rating": "রেটিং", "New": "নতুন",
    "Why can you not finish?": "কেন শেষ করতে পারছেন না?",
    "Pickup is too far": "পিকআপ অনেক দূর", "Customer location not clear": "কাস্টমারের লোকেশন বোঝা যাচ্ছে না",
    "Vehicle issue": "গাড়ির সমস্যা", "Restaurant is closed": "রেস্টুরেন্ট বন্ধ", "Other": "অন্য কারণ",
    "Keep delivering": "ডেলিভারি চালিয়ে যান", "Cash order": "নগদ অর্ডার",
    "Sign in": "সাইন ইন", "Signed out": "সাইন আউট হয়েছে", "Drop": "ড্রপ", "Flat pay per trip": "প্রতি ট্রিপে একই পে",
    "Finish your delivery first": "আগে ডেলিভারি শেষ করুন", "Distance to restaurant": "রেস্টুরেন্ট পর্যন্ত দূরত্ব"
  };
  var S = null;
  function t(s) { return S && S.lang === "bn" && BN[s] ? BN[s] : s; }

  var OFFERS = [
    { pk: 4.2, drop: "Mirpur", dk: 3.1, addr: "H-12, R-5, Blk C, Sec 10", cust: "Nusrat", pay: "cash", food: 960, order: 4821,
      items: [["Kacchi Biryani", 2], ["Borhani", 2]] },
    { pk: 1.8, drop: "Dhanmondi", dk: 2.4, addr: "Fl-5A, H-27, R-8/A", cust: "Imran", pay: "prepaid", food: 540, order: 4822,
      items: [["Beef Burger", 2], ["Fries", 1]] },
    { pk: 6.1, drop: "Uttara", dk: 4.8, addr: "H-4, R-12, Blk B, Sec 11", cust: "Farzana", pay: "cash", food: 1120, order: 4823,
      items: [["Chicken Tehari", 3], ["Salad", 1]] },
    { pk: 2.6, drop: "Mohammadpur", dk: 1.9, addr: "H-31, R-3, Blk D", cust: "Sabbir", pay: "prepaid", food: 380, order: 4824,
      items: [["Chicken Fry", 1], ["Rice", 2]] },
    { pk: 3.4, drop: "Gulshan", dk: 3.6, addr: "Fl-7C, H-52, R-90", cust: "Tania", pay: "cash", food: 820, order: 4825,
      items: [["Pasta", 1], ["Garlic Bread", 1]] },
    { pk: 0.9, drop: "Banani", dk: 1.2, addr: "H-9, R-11, Blk E", cust: "Rafi", pay: "prepaid", food: 460, order: 4826,
      items: [["Fried Rice", 2]] }
  ];
  var FALLBACK_RESTAURANTS = [
    { name: "Dhanmondi Biryani Corner", area: "Dhanmondi" }, { name: "Burger Shack", area: "Gulshan" },
    { name: "Wok Express", area: "Uttara" }, { name: "Sweet Treats", area: "Mirpur" },
    { name: "Kacchi Bhai", area: "Mohammadpur" }, { name: "Pasta Point", area: "Banani" }
  ];
  var SEED_DAYS = [
    { trips: 10, earn: 548, om: 312 }, { trips: 12, earn: 668, om: 361 }, { trips: 9, earn: 497, om: 280 },
    { trips: 11, earn: 612, om: 340 }, { trips: 8, earn: 436, om: 255 }, { trips: 13, earn: 721, om: 388 }
  ];
  var SEED_TRIPS = [
    { r: 2, drop: "Mirpur", km: 2.7, day: "Yesterday, 19:42" }, { r: 0, drop: "Dhanmondi", km: 3.3, day: "Yesterday, 19:10" },
    { r: 4, drop: "Farmgate", km: 1.6, day: "Yesterday, 18:25" }, { r: 1, drop: "Uttara", km: 4.1, day: "Yesterday, 13:36" },
    { r: 3, drop: "Banani", km: 2.2, day: "Yesterday, 13:02" }
  ];
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var ctx = { now: "2027-04-01 09:00:00", rests: FALLBACK_RESTAURANTS, rider: null, shifts: [], menu: {} };

  function tryLoad(name) {
    return D.loadData(name).catch(function () { return null; });
  }
  function rows(x) {
    if (Array.isArray(x)) return x;
    if (x && typeof x === "object") {
      for (var k in x) { if (Array.isArray(x[k])) return x[k]; }
    }
    return [];
  }
  function pick(o, keys, dflt) {
    for (var i = 0; i < keys.length; i++) {
      if (o && o[keys[i]] !== undefined && o[keys[i]] !== null && o[keys[i]] !== "") return o[keys[i]];
    }
    return dflt;
  }

  function loadContext() {
    return Promise.all([tryLoad("meta"), tryLoad("restaurants"), tryLoad("riders"), USE_SHIFTS_FILE ? tryLoad("rider_shifts") : Promise.resolve(null), tryLoad("menu_items")]).then(function (r) {
      var meta = r[0] || {};
      if (typeof meta.now === "string") ctx.now = meta.now;
      var rr = rows(r[1]).map(function (x) {
        return { id: pick(x, ["restaurant_id", "id"], null), name: pick(x, ["name", "restaurant_name"], ""), area: pick(x, ["area", "city"], "") };
      }).filter(function (x) { return x.name; });
      if (rr.length >= 3) ctx.rests = rr.slice(0, 40);
      rows(r[4]).forEach(function (m) {
        var rid = pick(m, ["restaurant_id"], null), nm = pick(m, ["name", "item_name"], "");
        if (rid === null || !nm) return;
        (ctx.menu[rid] = ctx.menu[rid] || []).push({ name: nm, price: +pick(m, ["price", "price_tk"], 0) });
      });
      var pid = meta.personas && meta.personas.rider_id;
      var riders = rows(r[2]);
      var me = null;
      riders.forEach(function (x) {
        if (me) return;
        var id = pick(x, ["rider_id", "id"], null);
        if (id !== null && String(id) === String(pid)) me = x;
      });
      if (!me && riders.length) me = riders[0];
      ctx.riderId = me ? pick(me, ["rider_id", "id"], null) : null;
      ctx.rider = {
        name: pick(me, ["name", "rider_name"], "Rubel Ahmed"),
        vehicle: String(pick(me, ["vehicle"], "motorbike")).toLowerCase(),
        joined: pick(me, ["joined_on"], "2027-03-18"),
        rating: pick(me, ["rating"], null)
      };
      ctx.shifts = rows(r[3]).filter(function (x) {
        var id = pick(x, ["rider_id"], null);
        return id !== null && ctx.riderId !== null && String(id) === String(ctx.riderId);
      });
    });
  }

  function defaultState() {
    return { lang: "en", online: false, tab: "home", phase: "idle", job: null, trips: [], onlineSec: 0, calls: 0, offerCount: 0, declined: 0, signedOut: false };
  }
  function save() {
    D.write("rd_state", {
      lang: S.lang, online: S.online, tab: S.tab, phase: S.phase, job: S.job, trips: S.trips,
      onlineSec: S.onlineSec, calls: S.calls, offerCount: S.offerCount, declined: S.declined
    });
  }
  var JOB_PHASES = ["to_restaurant", "at_restaurant", "to_customer", "deliver", "done"];
  function inJob() { return JOB_PHASES.indexOf(S.phase) !== -1; }

  var simSec = 0;
  function nowParts() {
    var p = D.parseIso(ctx.now) || { y: 2027, mo: 4, d: 1, hh: 9, mm: 0, ss: 0 };
    var base = Date.UTC(p.y, p.mo - 1, p.d, p.hh, p.mm, p.ss) + simSec * 1000;
    var d = new Date(base);
    return d;
  }
  function clockText() {
    var d = nowParts();
    function two(n) { return (n < 10 ? "0" : "") + n; }
    return two(d.getUTCHours()) + ":" + two(d.getUTCMinutes());
  }
  function hm(sec) {
    var m = Math.floor(sec / 60);
    return m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m";
  }

  function earnFor(km) { return FLAT_TK; }

  function weekData() {
    var d = nowParts();
    var dow = d.getUTCDay();
    var days = [];
    for (var i = 0; i < 7; i++) {
      var dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow + i));
      var key = dt.getUTCFullYear() + "-" + (dt.getUTCMonth() + 1 < 10 ? "0" : "") + (dt.getUTCMonth() + 1) + "-" + (dt.getUTCDate() < 10 ? "0" : "") + dt.getUTCDate();
      var day = { label: WEEKDAYS[i], key: key, trips: 0, earn: 0, om: 0, future: i > dow, today: i === dow };
      if (i < dow) {
        var fromShifts = ctx.shifts.filter(function (s) { return String(pick(s, ["date"], "")).slice(0, 10) === key; });
        if (fromShifts.length) {
          fromShifts.forEach(function (s) {
            day.trips += +pick(s, ["deliveries"], 0);
            day.earn += +pick(s, ["earnings_tk"], 0);
            day.om += +pick(s, ["online_min"], 0);
          });
        } else {
          var sd = SEED_DAYS[i % SEED_DAYS.length];
          day.trips = sd.trips; day.earn = sd.earn; day.om = sd.om;
        }
      }
      if (i === dow) {
        S.trips.forEach(function (tr) { day.trips += 1; day.earn += tr.total; });
        day.om = Math.floor(S.onlineSec / 60);
      }
      days.push(day);
    }
    return days;
  }
  function todayTotals() {
    var earn = 0;
    S.trips.forEach(function (tr) { earn += tr.total; });
    return { n: S.trips.length, earn: earn };
  }

  var root = null;
  var ui = {};
  var timer = null;

  function toast(msg) {
    var old = root.querySelector(".rd-toast");
    if (old) old.remove();
    var n = el("div", { "class": "rd-toast", role: "status", text: msg, "data-testid": "rider-toast" });
    root.appendChild(n);
    setTimeout(function () { if (n.parentNode) n.remove(); }, 2600);
  }

  function statusBar() {
    ui.clock = el("span", { text: clockText() });
    return el("div", { "class": "rd-status" }, [
      ui.clock,
      el("span", { "class": "rd-status-right" }, [icon("wifi"), icon("battery")])
    ]);
  }

  function tabs() {
    var items = [["home", "Home", "home"], ["earnings", "Earnings", "wallet"], ["profile", "Profile", "user"], ["help", "Help", "help"]];
    return el("nav", { "class": "rd-tabs", "aria-label": "Main" }, items.map(function (it) {
      return el("button", {
        "class": "rd-tab" + (S.tab === it[0] ? " is-active" : ""), type: "button",
        "data-testid": "rider-tab-" + it[0], "aria-current": S.tab === it[0] ? "page" : null,
        onclick: function () { S.tab = it[0]; save(); render(); }
      }, [icon(it[2]), el("span", { text: t(it[1]) })]);
    }));
  }

  function wordmark() {
    var w = el("span", { "class": "fd-wordmark" });
    w.innerHTML = '<svg class="fd-wordmark-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16a8 8 0 0 1-16 0Z"/><path d="M9 8.5c0-1.2.9-1.2.9-2.4M13 8.5c0-1.2.9-1.2.9-2.4"/></svg><span class="fd-wordmark-text">Food Delivery</span>';
    return w;
  }

  function header(title) {
    return el("div", { "class": "rd-hd" }, title === null ? [wordmark()] : [el("h1", { text: title })]);
  }

  function callOverlay(name, number, isCustomer) {
    if (isCustomer) { S.calls += 1; save(); }
    var o = el("div", { "class": "rd-overlay is-full", "data-testid": "rider-call-overlay", role: "dialog", "aria-label": t("Calling") }, [
      icon("phone", "rd-ic-lg"),
      el("div", { "class": "rd-small", text: t("Calling") + "..." }),
      el("div", { "class": "rd-callname", text: name }),
      el("div", { text: number }),
      el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-end-call", text: t("End call"),
        onclick: function () { o.remove(); render(); } })
    ]);
    root.appendChild(o);
    return o;
  }

  function navOverlay(dest) {
    var o = el("div", { "class": "rd-overlay is-full", "data-testid": "rider-nav-overlay", role: "dialog", "aria-label": t("Navigate") }, [
      icon("nav", "rd-ic-lg"),
      el("div", { "class": "rd-callname", text: dest }),
      el("div", { "class": "rd-small", text: "Directions open in your maps app." }),
      el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-close-nav", text: t("Close"),
        onclick: function () { o.remove(); } })
    ]);
    root.appendChild(o);
  }

  function homeScreen() {
    var tt = todayTotals();
    var body = el("div", { "class": "rd-body" });
    var first = String(ctx.rider.name).split(" ")[0];
    body.appendChild(el("div", { "class": "rd-card" }, [
      el("div", { "class": "rd-row" }, [
        el("div", { "class": "rd-sp" }, [
          el("div", { "class": "rd-small rd-muted", text: "Hi, " + first }),
          el("div", { "class": "rd-big", "data-testid": "rider-online-label", text: t(S.online ? "You are online" : "You are offline"), style: { fontSize: "22px" } })
        ]),
        el("button", { "class": "rd-switch", role: "switch", "aria-checked": S.online ? "true" : "false", "aria-label": t(S.online ? "Go offline" : "Go online"),
          "data-testid": "rider-online-toggle", type: "button", onclick: toggleOnline })
      ])
    ]));
    ui.onlineText = el("b", { text: hm(S.onlineSec) });
    body.appendChild(el("div", { "class": "rd-card" }, [
      el("h2", { text: t("Today") }),
      el("div", { "class": "rd-stats" }, [
        el("div", { "class": "rd-stat" }, [el("b", { "data-testid": "rider-today-deliveries", text: String(tt.n) }), el("span", { text: t("Deliveries") })]),
        el("div", { "class": "rd-stat" }, [el("b", { "data-testid": "rider-today-earnings", text: money(tt.earn) }), el("span", { text: t("Earned") })]),
        el("div", { "class": "rd-stat" }, [ui.onlineText, el("span", { text: t("Online time") })])
      ])
    ]));
    if (S.online) {
      body.appendChild(el("div", { "class": "rd-card rd-search", "data-testid": "rider-searching" }, [
        el("div", { "class": "rd-pulse" }, [icon("bike", "rd-ic-lg")]),
        el("div", { "class": "rd-big", style: { fontSize: "20px" }, text: t("Looking for orders") + "..." }),
        el("div", { "class": "rd-muted rd-small", text: t("Stay on this screen. New orders show up here.") })
      ]));
    } else {
      body.appendChild(el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-go-online", text: t("Go online"), onclick: toggleOnline }));
    }
    return el("div", { "class": "rd-screen", style: { display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: "0" } }, [header(null), body]);
  }

  function toggleOnline() {
    if (inJob()) { toast(t("Finish your delivery first")); return; }
    if (S.online) {
      S.online = false; S.phase = "idle";
    } else {
      S.online = true; S.phase = "searching"; S.searchLeft = 3;
    }
    save(); render();
  }

  function makeOffer() {
    var i = S.offerCount;
    var base = OFFERS[i % OFFERS.length];
    var rest = ctx.rests[(i * 2 + 1) % ctx.rests.length];
    var mi = rest.id !== null && rest.id !== undefined ? ctx.menu[rest.id] : null;
    var items = base.items, food = base.food;
    if (mi && mi.length) {
      var a = mi[i % mi.length], b = mi[(i + 1) % mi.length];
      items = [[a.name, 2]];
      food = a.price * 2;
      if (b !== a) { items.push([b.name, 1]); food += b.price; }
      if (!food) food = base.food;
    }
    S.job = {
      rest: rest.name, restArea: rest.area, pk: base.pk, drop: base.drop, dk: base.dk, addr: base.addr, cust: base.cust,
      pay: base.pay, food: food, items: items, order: base.order + Math.floor(i / OFFERS.length) * 10
    };
    S.offerCount += 1;
    S.phase = "offer";
    S.offerLeft = OFFER_SECONDS;
    save(); render();
  }

  function offerOverlay() {
    var j = S.job;
    var C = 2 * Math.PI * 52;
    ui.ringNum = el("div", { "class": "rd-ring-num", "data-testid": "rider-offer-timer", text: String(S.offerLeft) });
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 120 120");
    var bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("class", "rd-ring-bg"); bg.setAttribute("cx", "60"); bg.setAttribute("cy", "60"); bg.setAttribute("r", "52");
    var fg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    fg.setAttribute("class", "rd-ring-fg"); fg.setAttribute("cx", "60"); fg.setAttribute("cy", "60"); fg.setAttribute("r", "52");
    fg.setAttribute("stroke-dasharray", String(C));
    fg.setAttribute("stroke-dashoffset", String(C * (1 - S.offerLeft / OFFER_SECONDS)));
    ui.ringFg = fg;
    svg.appendChild(bg); svg.appendChild(fg);
    return el("div", { "class": "rd-offer", role: "dialog", "aria-label": t("New order"), "data-testid": "rider-offer" }, [
      el("div", { "class": "rd-offer-kicker", text: t("New order") }),
      el("div", { "class": "rd-ring" }, [svg, ui.ringNum]),
      el("h1", { "data-testid": "rider-offer-restaurant", text: j.rest }),
      el("div", { "class": "rd-facts" }, [
        el("div", { "class": "rd-fact" }, [icon("pin", "rd-ic-lg"), el("div", {}, [
          el("small", { text: t("Distance to restaurant") }), el("span", { "data-testid": "rider-offer-pickup", text: t("Pickup") + " " + j.pk.toFixed(1) + " " + t("km") })])]),
        el("div", { "class": "rd-fact" }, [icon("home", "rd-ic-lg"), el("div", {}, [
          el("small", { text: t("Drop area") }), el("span", { "data-testid": "rider-offer-drop", text: j.drop })])])
      ]),
      el("div", { "class": "rd-sp" }),
      el("div", { "class": "rd-btns" }, [
        el("button", { "class": "rd-btn", type: "button", "data-testid": "rider-decline", text: t("Decline"), onclick: function () { endOffer(false); } }),
        el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-accept", text: t("Accept"), onclick: acceptOffer })
      ])
    ]);
  }

  function endOffer(expired) {
    S.declined += 1;
    S.phase = "searching"; S.searchLeft = 5; S.job = null;
    save(); render();
    toast(expired ? "Offer expired" : "Offer declined");
  }
  function acceptOffer() { S.phase = "to_restaurant"; save(); render(); }

  function mapSvg(kind) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "rd-mapsvg");
    svg.setAttribute("viewBox", "0 0 370 330");
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Map with the pin");
    var A = kind === "toRestaurant" ? { x: 70, y: 250 } : { x: 80, y: 90 };
    var B = kind === "toRestaurant" ? { x: 290, y: 90 } : { x: 285, y: 235 };
    var path = kind === "toRestaurant"
      ? "M70 250 L70 190 L170 190 L170 120 L290 120 L290 90"
      : "M80 90 L80 150 L200 150 L200 235 L285 235";
    var bgRoads = [
      "M0 60 H370", "M0 150 H370", "M0 190 H370", "M0 235 H370", "M0 290 H370", "M0 120 H370",
      "M40 0 V330", "M80 0 V330", "M170 0 V330", "M200 0 V330", "M250 0 V330", "M290 0 V330", "M70 0 V330"
    ];
    var inner = '<rect width="370" height="330" fill="#E9EBEF"/>' +
      '<rect x="95" y="205" width="62" height="70" fill="#DDE0E5"/><rect x="215" y="40" width="50" height="60" fill="#DDE0E5"/>' +
      bgRoads.map(function (d) { return '<path d="' + d + '" stroke="#fff" stroke-width="7" fill="none"/>'; }).join("") +
      '<circle cx="' + A.x + '" cy="' + A.y + '" r="9" fill="#fff" stroke="#1A1D23" stroke-width="3"/>' +
      '<g transform="translate(' + (B.x - 16) + ',' + (B.y - 16) + ')"><circle cx="16" cy="16" r="16" fill="#1A1D23"/>' +
      '<g transform="translate(4,4) scale(1)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      (kind === "toRestaurant" ? ICONS.store : ICONS.pin) + '</g></g>';
    svg.innerHTML = inner;
    return svg;
  }

  function stepBar() {
    var order = ["to_restaurant", "at_restaurant", "to_customer", "deliver"];
    var idx = order.indexOf(S.phase);
    return el("div", { "class": "rd-steps", "aria-hidden": "true" }, order.map(function (p, i) {
      return el("i", { "class": i < idx ? "is-done" : (i === idx ? "is-now" : "") });
    }));
  }

  function issueSheet() {
    var reasons = ["Pickup is too far", "Customer location not clear", "Vehicle issue", "Restaurant is closed", "Other"];
    var o = el("div", { "class": "rd-overlay", role: "dialog", "aria-label": t("Report an issue"), "data-testid": "rider-issue" }, [
      el("div", { "class": "rd-modal" }, [
        el("h2", { text: t("Why can you not finish?") })
      ].concat(reasons.map(function (r) {
        return el("button", { "class": "rd-opt", type: "button", "data-testid": "rider-reason", text: t(r),
          onclick: function () { o.remove(); S.phase = S.online ? "searching" : "idle"; S.searchLeft = 5; S.job = null; S.tab = "home"; save(); render(); toast("Delivery cancelled"); } });
      })).concat([
        el("button", { "class": "rd-btn", type: "button", "data-testid": "rider-keep", text: t("Keep delivering"), onclick: function () { o.remove(); } })
      ]))
    ]);
    root.appendChild(o);
  }

  function jobScreen() {
    var j = S.job;
    var p = S.phase;
    var wrap = el("div", { "class": "rd-screen", style: { display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: "0" } });
    var sheet = el("div", { "class": "rd-sheet", "data-testid": "rider-sheet" });
    var showMap = p !== "at_restaurant" && p !== "deliver";
    var mapBox = null;
    if (showMap) {
      mapBox = el("div", { "class": "rd-map" }, [mapSvg(p === "to_restaurant" ? "toRestaurant" : "toCustomer"), stepBar()]);
    }

    function help() { return el("button", { "class": "rd-link", type: "button", "data-testid": "rider-issue-btn", text: t("Report an issue"), onclick: issueSheet }); }

    if (p === "to_restaurant") {
      sheet.appendChild(el("h1", { "data-testid": "rider-job-title", text: t("Go to restaurant") }));
      sheet.appendChild(el("div", { "class": "rd-row" }, [icon("store", "rd-ic-lg"), el("div", {}, [
        el("div", { style: { fontSize: "19px", fontWeight: "700" }, text: j.rest }),
        el("div", { "class": "rd-muted", text: j.restArea + ", " + j.pk.toFixed(1) + " " + t("km") })])]));
      sheet.appendChild(el("div", { "class": "rd-btns" }, [
        el("button", { "class": "rd-btn", type: "button", "data-testid": "rider-call-restaurant", onclick: function () { callOverlay(j.rest, "09613-000111", false); } }, [icon("phone"), t("Call restaurant")])
      ]));
      sheet.appendChild(el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-arrived-restaurant", text: t("I have arrived"),
        onclick: function () { S.phase = "at_restaurant"; save(); render(); } }));
      sheet.appendChild(help());
    } else if (p === "at_restaurant") {
      wrap.appendChild(el("div", { "class": "rd-hd" }, [el("h1", { text: t("Pick up the order") })]));
      var body = el("div", { "class": "rd-body" });
      body.appendChild(el("div", { "class": "rd-card" }, [
        el("div", { "class": "rd-row" }, [icon("store", "rd-ic-lg"), el("div", { "class": "rd-sp" }, [
          el("div", { style: { fontSize: "19px", fontWeight: "700" }, text: j.rest }),
          el("div", { "class": "rd-muted", text: t("Order") + " #" + j.order })])]),
      ]));
      body.appendChild(el("div", { "class": "rd-card" }, [
        el("h2", { text: t("Items") }),
        el("ul", { "class": "rd-items", "data-testid": "rider-pickup-items" }, j.items.map(function (it) {
          return el("li", {}, [el("span", { text: it[0] }), el("b", { text: "x" + it[1] })]);
        }))
      ]));
      body.appendChild(el("div", { "class": "rd-sp" }));
      body.appendChild(el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-confirm-pickup", text: t("Confirm pickup"),
        onclick: function () { S.phase = "to_customer"; save(); render(); } }));
      body.appendChild(help());
      wrap.appendChild(body);
      return wrap;
    } else if (p === "to_customer") {
      sheet.appendChild(el("h1", { "data-testid": "rider-job-title", text: t("Go to customer") }));
      sheet.appendChild(el("div", { "class": "rd-small rd-muted", text: t("Delivery address") }));
      sheet.appendChild(el("div", { "class": "rd-addr", "data-testid": "rider-address", text: j.addr }));
      sheet.appendChild(el("div", { "class": "rd-btns" }, [
        el("button", { "class": "rd-btn", type: "button", "data-testid": "rider-call-customer", onclick: function () { callOverlay(j.cust, "01XXX-XXXXXX", true); } }, [icon("phone"), t("Call customer")])
      ]));
      sheet.appendChild(el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-arrived-customer", text: t("I have arrived"),
        onclick: function () { S.phase = "deliver"; save(); render(); } }));
      sheet.appendChild(help());
    } else if (p === "deliver") {
      wrap.appendChild(el("div", { "class": "rd-hd" }, [el("h1", { text: t("Delivered") })]));
      var b2 = el("div", { "class": "rd-body" });
      b2.appendChild(el("div", { "class": "rd-card" }, [
        el("div", { "class": "rd-small rd-muted", text: t("Delivery address") }),
        el("div", { "class": "rd-addr", "data-testid": "rider-address", text: j.addr })
      ]));
      var total = j.food + 45;
      b2.appendChild(el("div", { "class": "rd-card" }, j.pay === "cash" ? [
        el("div", { "class": "rd-small rd-muted", text: t("Cash order") }),
        el("div", { "class": "rd-cash rd-money", "data-testid": "rider-cash", text: t("Collect cash") + " " + money(total) })
      ] : [
        el("div", { style: { fontWeight: "700", fontSize: "19px" }, text: t("Paid online") }),
        el("div", { "class": "rd-muted", text: t("Nothing to collect") })
      ]));
      b2.appendChild(el("div", { "class": "rd-sp" }));
      b2.appendChild(el("button", { "class": "rd-btn rd-btn-dark", type: "button", "data-testid": "rider-call-customer", onclick: function () { callOverlay(j.cust, "01XXX-XXXXXX", true); } }, [icon("phone"), t("Call customer")]));
      b2.appendChild(el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-delivered", text: t("Delivered"), onclick: completeTrip }));
      b2.appendChild(help());
      wrap.appendChild(b2);
      return wrap;
    } else if (p === "done") {
      var last = S.trips[S.trips.length - 1];
      var tt = todayTotals();
      var bd = el("div", { "class": "rd-body" });
      bd.appendChild(el("div", { "class": "rd-done-mark" }, [icon("check", "rd-ic-lg")]));
      bd.appendChild(el("div", { "class": "rd-big", style: { textAlign: "center", fontSize: "24px" }, text: t("Delivery complete") }));
      bd.appendChild(el("div", { "class": "rd-card" }, [
        el("h2", { text: t("Trip earning") }),
        el("div", { "class": "rd-big rd-money", "data-testid": "rider-trip-earning", text: money(last ? last.total : 0) }),
        el("div", { "class": "rd-muted", style: { marginTop: "6px" }, "data-testid": "rider-trip-breakdown",
          text: last ? t("Flat pay per trip") + " (" + last.km.toFixed(1) + " km)" : "" })
      ]));
      bd.appendChild(el("div", { "class": "rd-card" }, [
        el("h2", { text: t("Today") }),
        el("div", { "class": "rd-stats" }, [
          el("div", { "class": "rd-stat" }, [el("b", { text: String(tt.n) }), el("span", { text: t("Deliveries") })]),
          el("div", { "class": "rd-stat" }, [el("b", { text: money(tt.earn) }), el("span", { text: t("Earned") })])
        ])
      ]));
      bd.appendChild(el("div", { "class": "rd-sp" }));
      bd.appendChild(el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-back-home", text: t("Back to home"),
        onclick: function () { S.phase = S.online ? "searching" : "idle"; S.searchLeft = 5; S.job = null; S.tab = "home"; save(); render(); } }));
      wrap.appendChild(header(null));
      wrap.appendChild(bd);
      return wrap;
    }
    if (mapBox) wrap.appendChild(mapBox);
    wrap.appendChild(sheet);
    return wrap;
  }

  function completeTrip() {
    var j = S.job;
    S.trips.push({ rest: j.rest, drop: j.drop, km: j.dk, total: earnFor(j.dk), at: clockText() });
    S.phase = "done";
    save(); render();
  }

  function earningsScreen() {
    var days = weekData();
    var wk = days.reduce(function (a, d) { a.earn += d.earn; a.trips += d.trips; a.om += d.om; return a; }, { earn: 0, trips: 0, om: 0 });
    var max = Math.max.apply(null, days.map(function (d) { return d.earn; }).concat([1]));
    var body = el("div", { "class": "rd-body" });
    body.appendChild(el("div", { "class": "rd-card" }, [
      el("h2", { text: t("This week") }),
      el("div", { "class": "rd-big rd-money", "data-testid": "rider-week-total", text: money(wk.earn) }),
      el("div", { "class": "rd-muted rd-small", style: { margin: "4px 0 14px" }, text: wk.trips + " " + t("Trips") + ", " + hm(wk.om * 60) + " " + t("Online time").toLowerCase() }),
      el("div", { "class": "rd-bars", "aria-hidden": "true" }, days.map(function (d) {
        return el("div", { "class": "rd-bar" + (d.future ? " is-future" : "") }, [
          el("i", { style: { height: Math.max(2, Math.round(d.earn / max * 80)) + "px" } }), el("span", { text: d.label.charAt(0) })]);
      }))
    ]));

    var list = [];
    S.trips.slice().reverse().forEach(function (tr) { list.push({ rest: tr.rest, drop: tr.drop, km: tr.km, when: "Today, " + tr.at }); });
    SEED_TRIPS.forEach(function (s) { list.push({ rest: ctx.rests[s.r % ctx.rests.length].name, drop: s.drop, km: s.km, when: s.day }); });
    var tripCard = el("div", { "class": "rd-card" }, [el("h2", { text: t("Recent trips") })]);
    list.slice(0, 8).forEach(function (tr) {
      var open = false;
      var detail = el("div", { "class": "rd-trip-detail", style: { display: "none" }, "data-testid": "rider-trip-detail",
        text: t("Flat pay per trip") + " (" + tr.km.toFixed(1) + " km)" });
      var btn = el("button", { "class": "rd-trip", type: "button", "data-testid": "rider-trip", "aria-expanded": "false",
        onclick: function () { open = !open; detail.style.display = open ? "block" : "none"; btn.setAttribute("aria-expanded", open ? "true" : "false"); } }, [
        el("div", { "class": "rd-row" }, [
          el("div", { "class": "rd-sp" }, [el("div", { style: { fontWeight: "600" }, text: tr.rest }), el("div", { "class": "rd-muted rd-small", text: tr.when + ", " + tr.drop })]),
          el("b", { "class": "rd-money", text: money(earnFor(tr.km)) })
        ]),
        detail
      ]);
      tripCard.appendChild(btn);
    });
    body.appendChild(tripCard);

    body.appendChild(el("div", { "class": "rd-card" }, [
      el("h2", { text: t("Recent shifts") })
    ].concat(days.filter(function (d) { return !d.future && d.om > 0; }).slice(-4).reverse().map(function (d) {
      return el("div", { "class": "rd-row", "data-testid": "rider-shift" }, [
        el("div", { "class": "rd-sp" }, [el("div", { style: { fontWeight: "600" }, text: d.label + (d.today ? " (" + t("Today") + ")" : "") }),
          el("div", { "class": "rd-muted rd-small", text: hm(d.om * 60) + ", " + d.trips + " " + t("Deliveries").toLowerCase() })]),
        el("b", { "class": "rd-money", text: money(d.earn) })
      ]);
    }))));
    body.appendChild(el("div", { "class": "rd-card" }, [
      el("h2", { text: t("Bonuses") }),
      el("div", { "class": "rd-muted", "data-testid": "rider-bonus-note", text: t("No bonus is running right now.") })
    ]));
    return el("div", { "class": "rd-screen", style: { display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: "0" } }, [header(t("Earnings")), body]);
  }

  function profileScreen() {
    var r = ctx.rider;
    var initials = String(r.name).split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
    var ratingNew = r.rating === null || isNaN(parseFloat(r.rating));
    var vehicle = r.vehicle === "bicycle" ? "Bicycle" : "Motorbike";
    var docs = ["National ID", "Driving licence", "Bike registration"];
    if (r.vehicle === "bicycle") docs = ["National ID"];
    var body = el("div", { "class": "rd-body" });
    body.appendChild(el("div", { "class": "rd-card" }, [
      el("div", { "class": "rd-row" }, [
        el("div", { "class": "rd-avatar", text: initials }),
        el("div", { "class": "rd-sp" }, [
          el("div", { style: { fontSize: "20px", fontWeight: "700" }, "data-testid": "rider-name", text: r.name }),
          el("div", { "class": "rd-muted", "data-testid": "rider-rating", text: ratingNew ? t("Rating") + ": " + t("New") : t("Rating") + ": " + parseFloat(r.rating).toFixed(1) })
        ])
      ])
    ]));
    body.appendChild(el("div", { "class": "rd-card" }, [
      el("div", { "class": "rd-row" }, [icon("bike"), el("span", { "class": "rd-sp", text: t("Vehicle") }), el("b", { "data-testid": "rider-vehicle", text: t(vehicle) })])
    ]));
    body.appendChild(el("div", { "class": "rd-card" }, [el("h2", { text: t("Documents") })].concat(docs.map(function (d) {
      return el("div", { "class": "rd-doc" }, [icon("file"), el("span", { "class": "rd-sp", text: d }), el("span", { "class": "fd-pill", dataset: { status: "delivered" }, text: t("Verified") })]);
    }))));
    function langBtn(code, label) {
      return el("button", { type: "button", "class": S.lang === code ? "is-on" : "", "data-testid": "rider-lang-" + code, "aria-pressed": S.lang === code ? "true" : "false",
        text: label, onclick: function () { S.lang = code; save(); render(); } });
    }
    body.appendChild(el("div", { "class": "rd-card" }, [
      el("h2", { text: t("Language") }),
      el("div", { "class": "rd-seg" }, [langBtn("en", "English"), langBtn("bn", "বাংলা")])
    ]));
    body.appendChild(el("button", { "class": "rd-btn", type: "button", "data-testid": "rider-signout", text: t("Sign out"), onclick: signOut }));
    return el("div", { "class": "rd-screen", style: { display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: "0" } }, [header(t("Profile")), body]);
  }

  function signOut() {
    if (inJob()) { toast(t("Finish your delivery first")); return; }
    S.online = false; S.phase = "idle"; save();
    var o = el("div", { "class": "rd-signed", "data-testid": "rider-signed-out" }, [
      wordmark(),
      el("div", { "class": "rd-big", style: { fontSize: "22px" }, text: t("Signed out") }),
      el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-signin", text: t("Sign in"),
        onclick: function () { S.tab = "home"; save(); render(); } })
    ]);
    root.appendChild(o);
  }

  function helpScreen() {
    var body = el("div", { "class": "rd-body" });
    body.appendChild(el("div", { "class": "rd-card" }, [
      el("div", { "class": "rd-row" }, [icon("phone", "rd-ic-lg"), el("div", { "class": "rd-sp" }, [
        el("div", { style: { fontWeight: "700", fontSize: "18px" }, text: t("Rider ops") }),
        el("div", { "class": "rd-muted", text: "09613-000222" })])])
    ]));
    body.appendChild(el("button", { "class": "rd-btn rd-btn-primary", type: "button", "data-testid": "rider-call-ops", onclick: function () { callOverlay(t("Rider ops"), "09613-000222", false); } }, [icon("phone"), t("Call rider ops")]));
    return el("div", { "class": "rd-screen", style: { display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: "0" } }, [header(t("Help")), body]);
  }

  function render() {
    root.innerHTML = "";
    ui = {};
    root.appendChild(statusBar());
    if (inJob()) {
      root.appendChild(jobScreen());
    } else {
      var screen = S.tab === "earnings" ? earningsScreen() : S.tab === "profile" ? profileScreen() : S.tab === "help" ? helpScreen() : homeScreen();
      root.appendChild(screen);
      root.appendChild(tabs());
      if (S.phase === "offer" && S.job) root.appendChild(offerOverlay());
    }
    if (S.lang === "bn") root.classList.add("fd-bn"); else root.classList.remove("fd-bn");
  }

  function tick() {
    simSec += 1;
    if (ui.clock) ui.clock.textContent = clockText();
    if (S.online) {
      S.onlineSec += 1;
      if (ui.onlineText) ui.onlineText.textContent = hm(S.onlineSec);
    }
    if (S.phase === "searching" && S.online) {
      S.searchLeft = (S.searchLeft === undefined ? 3 : S.searchLeft) - 1;
      if (S.searchLeft <= 0) makeOffer();
    } else if (S.phase === "offer") {
      S.offerLeft -= 1;
      if (ui.ringNum) ui.ringNum.textContent = String(Math.max(S.offerLeft, 0));
      if (ui.ringFg) ui.ringFg.setAttribute("stroke-dashoffset", String(2 * Math.PI * 52 * (1 - Math.max(S.offerLeft, 0) / OFFER_SECONDS)));
      if (S.offerLeft <= 0) endOffer(true);
    }
    if (simSec % 5 === 0) save();
  }

  function boot() {
    root = document.getElementById("rd-app");
    var saved = D.read("rd_state", null);
    S = defaultState();
    if (saved && typeof saved === "object") {
      Object.keys(saved).forEach(function (k) { S[k] = saved[k]; });
      if (S.phase === "offer") { S.phase = S.online ? "searching" : "idle"; S.job = null; }
      if (S.phase === "searching" && !S.online) S.phase = "idle";
      if (inJob() && !S.job) S.phase = S.online ? "searching" : "idle";
      if (S.phase === "done" && !S.trips.length) S.phase = S.online ? "searching" : "idle";
    }
    if (S.phase === "searching") S.searchLeft = 3;
    loadContext().catch(function () {  }).then(function () {
      if (!ctx.rider) ctx.rider = { name: "Rubel Ahmed", vehicle: "motorbike", joined: "2027-03-18", rating: null };
      render();
      timer = setInterval(tick, 1000);
    });
  }

  boot();
})();
