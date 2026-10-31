(function () {
  "use strict";

  var el = FD.el;
  var D = FD_DATA;
  var root = document.getElementById("app-root");
  var QUEUE_MAX = 4;
  var PAGE = 50;

  var ICONS = {
    popup: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h16M7 7h.01M10 7h.01"/>',
    bell: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.5v.01"/>',
    chevL: '<path d="M15 6l-6 6 6 6"/>',
    chevR: '<path d="M9 6l6 6-6 6"/>',
    send: '<path d="M21 3L10 14"/><path d="M21 3l-7 18-4-7-7-4z"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V6H3z"/><path d="M13 6v12"/>'
  };
  function ic(name) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("class", "fd-icon fd-icon-sm");
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = ICONS[name] || "";
    return s;
  }

  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }
  function rows(x) {
    if (Array.isArray(x)) { return x; }
    if (x && typeof x === "object") {
      var keys = ["rows", "data", "items", "promo_codes", "codes"];
      for (var i = 0; i < keys.length; i++) { if (Array.isArray(x[keys[i]])) { return x[keys[i]]; } }
    }
    return [];
  }
  function tryLoad(names) {
    var i = 0;
    function next() {
      if (i >= names.length) { return Promise.resolve([]); }
      return D.loadData(names[i++]).then(rows, next);
    }
    return next();
  }
  var memo = {};
  function once(key, fn) { if (!memo[key]) { memo[key] = fn(); } return memo[key]; }
  function now() { return once("now", function () { return D.loadData("meta").then(function (m) { return (m && m.now) || "2027-03-29 13:10:00"; }, function () { return "2027-03-29 13:10:00"; }); }); }
  function saved(key, dflt) { return D.read("mk_" + key, dflt); }
  function save(key, val) { D.write("mk_" + key, val); }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " "); }
  function day(n, off) { return D.addDays(n.slice(0, 10), off); }
  var TEAMS = [["marketing", "Marketing"], ["kam_restaurant_promo", "KAM restaurant promo"], ["partnerships", "Partnerships"], ["product", "Product"]];
  function teamLabel(k) { var t = TEAMS.filter(function (x) { return x[0] === k; })[0]; return t ? t[1] : cap(k); }
  var TEAM_PERSON = { marketing: "Nabila", kam_restaurant_promo: "Ayesha", partnerships: "Tanzil", product: "PM" };

  function seedPopups(n) {
    return [
      { id: "P1", name: "Free delivery above Tk 500", team: "marketing", state: "published", start: "2026-12-01", end: "", link: "app://promo/FREEDEL500", head: "Free delivery on orders Tk 500 or more", body: "Add something extra and the delivery is on us.", button: "Order now", image: "freedel500_full.png", by: "Nabila", edited: day(n, -60) },
      { id: "P2", name: "Biryani House weekly offer", team: "kam_restaurant_promo", state: "published", start: day(n, -3), end: day(n, 4), link: "app://restaurants?cuisine=biryani", head: "20% off biryani this week", body: "Selected restaurants, until Friday.", button: "See restaurants", image: "biryani_week.png", by: "Ayesha", edited: day(n, -3) },
      { id: "P3", name: "Nagad payment offer", team: "partnerships", state: "published", start: day(n, -10), end: day(n, 20), link: "app://checkout?pay=nagad", head: "Pay with Nagad, get Tk 40 off", body: "On orders above Tk 400.", button: "Got it", image: "nagad_offer.png", by: "Tanzil", edited: day(n, -10) },
      { id: "P4", name: "Update to app 6.4", team: "product", state: "published", start: day(n, -70), end: "", link: "app://update", head: "Order again in one tap", body: "Update the app to version 6.4.", button: "Update", image: "update64.png", by: "PM", edited: day(n, -70) },
      { id: "P5", name: "Home kitchens launch", team: "kam_restaurant_promo", state: "published", start: day(n, 5), end: day(n, 19), link: "app://restaurants?type=home_kitchen", head: "Home cooked food, new this month", body: "Try the new home kitchens near you.", button: "Explore", image: "home_kitchen.png", by: "Ayesha", edited: day(n, -1) },
      { id: "P6", name: "Refer a friend (not ready)", team: "product", state: "draft", start: "", end: "", link: "app://invite", head: "Invite a friend, both get Tk 100 off", body: "", button: "Invite", image: "", by: "PM", edited: day(n, -14) },
      { id: "P7", name: "Eid Mubarak", team: "marketing", state: "published", start: "2027-03-08", end: "2027-03-14", link: "app://home", head: "Eid Mubarak", body: "Order your Eid feast.", button: "Order now", image: "eid_mubarak.png", by: "Nabila", edited: "2027-03-07" },
      { id: "P8", name: "Iftar combos", team: "marketing", state: "published", start: "2027-02-08", end: "2027-03-09", link: "app://collection/iftar", head: "Iftar combos from 5 pm", body: "", button: "See combos", image: "iftar.png", by: "Nabila", edited: "2027-02-07" }
    ];
  }
  function seedPush(n) {
    function at(off, hm) { return day(n, off) + " " + hm; }
    return [
      { id: "H1", name: "Lunch reminder 12:15", title: "Lunch time?", body: "Your usual lunch spots are open now.", link: "app://home", audience: "Segment: ordered lunch 2+ times (set up by Engineering)", state: "sent", when: at(-1, "12:15:00"), by: "Engineering", daily: true },
      { id: "H2", name: "Weekend biryani", title: "Biryani weekend", body: "20% off at selected restaurants.", link: "app://restaurants?cuisine=biryani", audience: "All users", state: "sent", when: at(-6, "11:00:00"), by: "Nabila" },
      { id: "H3", name: "Free delivery reminder", title: "Free delivery above Tk 500", body: "Add one more item and skip the delivery fee.", link: "app://promo/FREEDEL500", audience: "All users", state: "sent", when: at(-4, "18:30:00"), by: "Nabila" },
      { id: "H4", name: "Android update 6.4", title: "Update available", body: "Order again in one tap. Update now.", link: "app://update", audience: "Android", state: "sent", when: at(-12, "10:00:00"), by: "Nabila" },
      { id: "H5", name: "Dinner deals", title: "Dinner tonight?", body: "See what is open near you.", link: "app://home", audience: "All users", state: "sent", when: at(-2, "19:00:00"), by: "Nabila" },
      { id: "H6", name: "iPhone share feature", title: "Share a restaurant", body: "Send your favourite place to a friend.", link: "app://home", audience: "iPhone", state: "sent", when: at(-17, "17:00:00"), by: "Nabila" },
      { id: "H7", name: "Home kitchens", title: "New: home cooked food", body: "Home kitchens are live in your area.", link: "app://restaurants?type=home_kitchen", audience: "All users", state: "scheduled", when: at(5, "12:00:00"), by: "Nabila" },
      { id: "H8", name: "Pohela Boishakh offer", title: "Shubho Noboborsho", body: "", link: "app://home", audience: "All users", state: "draft", when: "", by: "Nabila" }
    ];
  }
  function seedTickets(n) {
    return [
      { id: "ENG-1", subject: "Segment: ordered lunch 2+ times in 30 days", raised: "2027-01-13", needed: "2027-01-20", status: "Done", by: "Nabila" },
      { id: "ENG-2", subject: "Segment: no order in 30 days, for a push", raised: "2027-03-04", needed: "2027-03-12", status: "Open", by: "Nabila" }
    ];
  }
  function seedBanners(n) {
    return [
      { slot: 1, position: "Home, top (large)", image: "freedel500_home.png", link: "app://promo/FREEDEL500", start: "2026-11-01", end: "", owner: "Marketing" },
      { slot: 2, position: "Home, second row", image: "biryani_week_banner.png", link: "app://restaurants?cuisine=biryani", start: day(n, -3), end: day(n, 4), owner: "KAM restaurant promo" },
      { slot: 3, position: "Home, third row", image: "order_again.png", link: "app://orders", start: "2027-01-17", end: "", owner: "Product" },
      { slot: 4, position: "Home, fourth row", image: "", link: "", start: "", end: "", owner: "" },
      { slot: 5, position: "Home, bottom", image: "", link: "", start: "", end: "", owner: "" }
    ];
  }
  function seedPromos() {
    return [
      { code: "FREEDEL500", team: "marketing", rule: "Free delivery on orders Tk 500 or more", start: "2026-11-01", end: "", cap: null, funded: "app" },
      { code: "FIRSTFREE", team: "marketing", rule: "Free delivery on a first order", start: "2027-01-10", end: "", cap: null, funded: "app" },
      { code: "TELCO100", team: "partnerships", rule: "Tk 100 off for Robi customers", start: "2026-11-15", end: "2026-11-30", cap: null, funded: "telco" },
      { code: "BIRYANIWK", team: "kam_restaurant_promo", rule: "20% off at selected biryani restaurants", start: "2027-03-26", end: "2027-04-02", cap: null, funded: "shared" },
      { code: "KACCHI15", team: "kam_restaurant_promo", rule: "15% off kacchi", start: "2027-02-01", end: "2027-04-30", cap: null, funded: "shared" },
      { code: "BURGER10", team: "kam_restaurant_promo", rule: "10% off burgers", start: "2027-03-01", end: "", cap: null, funded: "restaurant" },
      { code: "HOMEFOOD", team: "kam_restaurant_promo", rule: "Tk 50 off home kitchen orders", start: "2026-12-05", end: "", cap: null, funded: "shared" },
      { code: "CHINESE20", team: "kam_restaurant_promo", rule: "20% off Chinese, weekdays", start: "2027-01-20", end: "2027-03-20", cap: null, funded: "shared" },
      { code: "CAFE30", team: "kam_restaurant_promo", rule: "Tk 30 off at cafes", start: "2027-02-10", end: "", cap: null, funded: "restaurant" }
    ];
  }

  function getPopups(n) { return saved("popups", null) || seedPopups(n); }
  function getPush(n) { return saved("push", null) || seedPush(n); }
  function getTickets(n) { return saved("tickets", null) || seedTickets(n); }
  function getBanners(n) { return saved("banners", null) || seedBanners(n); }
  function popStatus(p, today) {
    if (p.state === "draft") { return "Draft"; }
    if (p.state === "ended") { return "Ended"; }
    if (p.start && p.start > today) { return "Scheduled"; }
    if (p.end && p.end < today) { return "Ended"; }
    return "Live";
  }
  function livePops(list, today) {
    return list.filter(function (p) { return popStatus(p, today) === "Live"; })
      .sort(function (a, b) { return (a.start || "") < (b.start || "") ? -1 : (a.start || "") > (b.start || "") ? 1 : 0; });
  }
  function promos(n) {
    return tryLoad(["promo_codes"]).then(function (list) {
      var base = list.length ? list.map(function (r) {
        return { code: String(r.code || ""), team: r.owner_team || "marketing", rule: r.rule || "", start: String(r.start_on || "").slice(0, 10), end: String(r.end_on || "").slice(0, 10), cap: num(r.budget_cap_tk), funded: r.funded_by || "" };
      }) : seedPromos();
      var made = saved("promos_new", []);
      var ends = saved("promo_end", {});
      return made.concat(base).map(function (p) {
        return Object.prototype.hasOwnProperty.call(ends, p.code) ? Object.assign({}, p, { end: ends[p.code] }) : p;
      });
    });
  }
  function promoStatus(p, today) {
    if (p.start && p.start > today) { return "Scheduled"; }
    if (p.end && p.end < today) { return "Ended"; }
    return "Live";
  }

  var flashMsg = null;
  function flash(msg, isErr) { flashMsg = { msg: msg, err: !!isErr }; }
  function flashEl() {
    if (!flashMsg) { return null; }
    var f = el("div", { "class": "mk-flash" + (flashMsg.err ? " is-err" : ""), "data-testid": "mk-flash" }, [ic(flashMsg.err ? "alert" : "check"), flashMsg.msg]);
    flashMsg = null;
    return f;
  }
  function btn(label, onclick, opts) {
    opts = opts || {};
    var kids = [];
    if (opts.icon) { kids.push(ic(opts.icon)); }
    kids.push(label);
    return el("button", {
      type: "button", "class": "mk-b" + (opts.primary ? " is-primary" : "") + (opts.sm ? " is-sm" : ""),
      onclick: onclick, disabled: opts.disabled ? "disabled" : null, "data-testid": opts.tid || null
    }, kids);
  }
  function link(label, onclick) { return el("button", { type: "button", "class": "mk-link", onclick: onclick }, label); }
  function note(msg, warn) { return el("div", { "class": "mk-note" + (warn ? " is-warn" : "") }, [ic(warn ? "alert" : "info"), el("div", { text: msg })]); }
  function statusEl(s) {
    var map = { Live: "delivered", Scheduled: "transit", Sent: "delivered", Open: "placed", Done: "delivered" };
    if (map[s]) { return el("span", { "class": "fd-pill", dataset: { status: map[s] }, text: s }); }
    return el("span", { "class": "mk-chip", text: s });
  }
  function table(heads, body, tid) {
    return el("div", { "class": "mk-tw", "data-testid": tid || null }, el("table", { "class": "fd-table fd-table-dense" }, [
      el("thead", null, el("tr", null, heads.map(function (h) { return el("th", { text: h }); }))),
      el("tbody", null, body)
    ]));
  }
  function td(c, cls) { return el("td", { "class": cls || null }, c); }
  function field(label, input, hint, top) {
    var out = [el("label", { "class": top ? "is-top" : null, text: label }), input];
    if (hint) { out.push(el("div", { "class": "mk-hint", text: hint })); }
    return out;
  }
  function go(h) { if (location.hash === h) { render(); } else { location.hash = h; } }
  function overlay(small) {
    var ov = el("div", { "class": "mk-ov" });
    document.body.appendChild(ov);
    function close() { if (ov.parentNode) { ov.parentNode.removeChild(ov); } }
    return { ov: ov, close: close };
  }
  function tabs(active, items) {
    return el("div", { "class": "mk-tabs" }, items.map(function (t) {
      return el("button", { type: "button", "class": "mk-tab" + (t[0] === active ? " is-on" : ""), onclick: function () { go(t[2]); }, "data-testid": "mk-tab-" + t[0], text: t[1] });
    }));
  }

  var NAV = [
    { key: "popups", label: "Pop-ups", icon: "popup", hash: "#/popups" },
    { key: "push", label: "Push", icon: "bell", hash: "#/push" },
    { key: "promos", label: "Promo codes", icon: "tag", hash: "#/promos" },
    { key: "banners", label: "Banners", icon: "image", hash: "#/banners" }
  ];
  var main, navEl, topMeta;
  function shell() {
    root.innerHTML = "";
    navEl = el("nav", { "class": "mk-nav", "data-testid": "mk-nav" }, NAV.map(function (n) {
      return el("a", { dataset: { nav: n.key }, "data-testid": "mk-nav-" + n.key, onclick: function () { go(n.hash); } }, [ic(n.icon), n.label]);
    }));
    topMeta = el("span", { "class": "mk-top-meta" });
    main = el("main", { "class": "mk-main", "data-testid": "mk-main" });
    root.appendChild(el("header", { "class": "mk-top" }, [
      el("span", { "class": "mk-brand" }, [ic("send"), "Marketing CMS"]),
      el("span", { "class": "mk-top-meta", text: "In-app content" }),
      el("span", { "class": "mk-top-sp" }),
      topMeta,
      el("span", { "class": "mk-top-meta", text: "Signed in: Nabila (CRM manager)" })
    ]));
    root.appendChild(el("div", { "class": "mk-body" }, [navEl, main]));
    now().then(function (n) { topMeta.textContent = D.fmtDateTime(n); });
  }
  function render() {
    var parts = location.hash.replace(/^#\/?/, "").split("?")[0].split("/");
    var screen = parts[0] || "popups";
    var arg = parts[1] ? decodeURIComponent(parts[1]) : null;
    main.innerHTML = "";
    main.scrollTop = 0;
    Array.prototype.forEach.call(navEl.querySelectorAll("a"), function (a) { a.classList.toggle("is-active", a.dataset.nav === screen); });
    var f = flashEl();
    if (f) { main.appendChild(f); }
    var fn = { popups: screenPopups, push: screenPush, promos: screenPromos, banners: screenBanners }[screen] || screenPopups;
    fn(arg);
  }

  var popFilter = { status: "all", team: "all" };

  function screenPopups(arg) {
    if (arg) { return screenPopupEdit(arg); }
    main.appendChild(el("div", { "class": "mk-bar" }, [
      el("h1", { "class": "mk-h1", style: { margin: 0 }, text: "Pop-ups" }),
      el("span", { "class": "mk-bar-sp" }),
      btn("New pop-up", function () { go("#/popups/new"); }, { icon: "plus", primary: true, tid: "mk-popup-new" })
    ]));
    main.appendChild(el("p", { "class": "mk-sub", text: "Every team adds its pop-ups to this one queue. Live pop-ups show one after another when a user opens the app." }));
    now().then(function (n) {
      var today = n.slice(0, 10);
      var list = getPopups(today);
      var live = livePops(list, today);
      main.appendChild(el("div", { "class": "mk-stats" }, [
        el("span", null, [el("b", { text: String(live.length) }), " live"]),
        el("span", null, [el("b", { text: String(list.filter(function (p) { return popStatus(p, today) === "Scheduled"; }).length) }), " scheduled"]),
        el("span", null, [el("b", { text: String(list.filter(function (p) { return popStatus(p, today) === "Draft"; }).length) }), " drafts"]),
        el("span", null, [el("b", { text: String(list.filter(function (p) { return popStatus(p, today) === "Ended"; }).length) }), " ended"])
      ]));
      var bar = el("div", { "class": "mk-bar" });
      var holder = el("div");
      function sel(key, opts) {
        var s = el("select", { "class": "mk-in", "data-testid": "mk-popup-filter-" + key, onchange: function () { popFilter[key] = s.value; draw(); } }, opts.map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
        s.value = popFilter[key];
        return s;
      }
      bar.appendChild(sel("status", [["all", "All statuses"], ["Live", "Live"], ["Scheduled", "Scheduled"], ["Draft", "Draft"], ["Ended", "Ended"]]));
      bar.appendChild(sel("team", [["all", "All teams"]].concat(TEAMS)));
      main.appendChild(bar); main.appendChild(holder);
      function draw() {
        holder.innerHTML = "";
        var shown = list.filter(function (p) {
          return (popFilter.status === "all" || popStatus(p, today) === popFilter.status) && (popFilter.team === "all" || p.team === popFilter.team);
        });
        var order = { Live: 0, Scheduled: 1, Draft: 2, Ended: 3 };
        shown.sort(function (a, b) {
          var sa = order[popStatus(a, today)], sb = order[popStatus(b, today)];
          if (sa !== sb) { return sa - sb; }
          if (sa === 0) { return live.indexOf(a) - live.indexOf(b); }
          return (b.start || "") < (a.start || "") ? -1 : 1;
        });
        if (!shown.length) { holder.appendChild(el("div", { "class": "mk-tw" }, el("div", { "class": "mk-empty", text: "No pop-ups match." }))); return; }
        holder.appendChild(table(["Position", "Name", "Owner team", "Status", "Start", "End", "Link", "Edited by", ""], shown.map(function (p) {
          var st = popStatus(p, today);
          var pos = st === "Live" ? live.indexOf(p) + 1 : 0;
          return el("tr", { "data-testid": "mk-popup-row" }, [
            td(pos ? pos + " of " + live.length : "", "mk-mono"), td(el("b", { text: p.name })), td(teamLabel(p.team)), td(statusEl(st)),
            td(p.start ? D.fmtDate(p.start) : ""), td(p.end ? D.fmtDate(p.end) : ""), td(p.link, "is-trunc"),
            td(p.by || ""),
            td(el("span", { "class": "mk-actions" }, [
              btn("Edit", function () { go("#/popups/" + encodeURIComponent(p.id)); }, { sm: true, tid: "mk-popup-edit" }),
              st === "Live" ? btn("End now", function () {
                var all = getPopups(today).map(function (x) { return x.id === p.id ? Object.assign({}, x, { state: "ended", edited: today, by: "Nabila" }) : x; });
                save("popups", all); flash(p.name + " ended"); render();
              }, { sm: true, tid: "mk-popup-end" }) : null
            ]))
          ]);
        }), "mk-popups"));
      }
      draw();
    });
  }

  function screenPopupEdit(arg) {
    now().then(function (n) {
      var today = n.slice(0, 10);
      var list = getPopups(today);
      var isNew = arg === "new";
      var p = isNew ? { id: "", name: "", team: "marketing", state: "draft", start: today, end: "", link: "", head: "", body: "", button: "", image: "", by: "Nabila", edited: today } : list.filter(function (x) { return x.id === arg; })[0];
      if (!p) { main.appendChild(note("Pop-up not found.")); return; }
      main.appendChild(el("div", { "class": "mk-crumb" }, [link("Pop-ups", function () { go("#/popups"); }), " / " + (isNew ? "New pop-up" : p.name)]));
      main.appendChild(el("h1", { "class": "mk-h1", text: isNew ? "New pop-up" : "Edit pop-up", style: { marginBottom: "10px" } }));

      var f = {
        name: el("input", { "class": "mk-in is-w100", value: p.name, "data-testid": "mk-pop-name" }),
        team: el("select", { "class": "mk-in", "data-testid": "mk-pop-team" }, TEAMS.map(function (t) { return el("option", { value: t[0], text: t[1] }); })),
        image: el("input", { type: "file", accept: "image/*", "data-testid": "mk-pop-image" }),
        head: el("input", { "class": "mk-in is-w100", value: p.head, "data-testid": "mk-pop-head" }),
        body: el("textarea", { "class": "mk-in", rows: 3, "data-testid": "mk-pop-body" }),
        button: el("input", { "class": "mk-in", value: p.button, style: { width: "180px" }, "data-testid": "mk-pop-button" }),
        link: el("input", { "class": "mk-in is-w100", value: p.link, placeholder: "app://...", "data-testid": "mk-pop-link" }),
        start: el("input", { "class": "mk-in", type: "date", value: p.start, "data-testid": "mk-pop-start" }),
        end: el("input", { "class": "mk-in", type: "date", value: p.end, "data-testid": "mk-pop-end" })
      };
      f.team.value = p.team; f.body.value = p.body;
      var imgName = p.image;
      var imgNote = el("span", { "class": "mk-hint", text: imgName ? "Current file: " + imgName : "No image chosen" });
      f.image.addEventListener("change", function () { if (f.image.files && f.image.files[0]) { imgName = f.image.files[0].name; imgNote.textContent = "Chosen: " + imgName; } });
      var err = el("div", { "class": "mk-badge-err", "data-testid": "mk-pop-err" });

      function collect(state) {
        return Object.assign({}, p, { name: f.name.value.trim(), team: f.team.value, head: f.head.value.trim(), body: f.body.value.trim(), button: f.button.value.trim(), link: f.link.value.trim(), start: f.start.value, end: f.end.value, image: imgName, state: state, by: "Nabila", edited: today });
      }
      function commit(rec, msg) {
        if (isNew) { rec.id = "P" + (list.length + 100); list = [rec].concat(list); }
        else { list = list.map(function (x) { return x.id === rec.id ? rec : x; }); }
        save("popups", list); flash(msg); go("#/popups");
      }
      function check(rec, publish) {
        if (!rec.name) { return "Give the pop-up a name."; }
        if (rec.end && rec.start && rec.end < rec.start) { return "The end date is before the start date."; }
        if (publish) {
          if (!rec.head) { return "Add the headline text."; }
          if (!rec.link) { return "Add the link the button opens."; }
          if (!rec.start) { return "Add a start date."; }
          if (!rec.image) { return "Choose an image."; }
          var others = livePops(list.filter(function (x) { return x.id !== rec.id; }), today);
          if (popStatus(Object.assign({}, rec, { state: "published" }), today) === "Live" && others.length >= QUEUE_MAX) {
            return "The queue is full: " + others.length + " pop-ups are live. End one of them first, or start this one later.";
          }
        }
        return "";
      }

      var form = el("div", { "class": "mk-form is-wide" }, [].concat(
        field("Name (internal)", f.name),
        field("Owner team", f.team),
        field("Image", el("div", null, [f.image, el("div", null, imgNote)])),
        field("Headline", f.head),
        field("Text", f.body, null, true),
        field("Button label", f.button),
        field("Link", f.link, "Where the button goes, for example app://promo/CODE"),
        field("Start date", f.start),
        field("End date", f.end, "Leave empty to run until someone ends it.")
      ));
      var actions = el("div", { "class": "mk-bar", style: { marginTop: "14px" } }, [
        btn("Save as draft", function () {
          var rec = collect("draft"); var m = check(rec, false);
          if (m) { err.textContent = m; return; }
          commit(rec, "Saved as draft");
        }, { tid: "mk-pop-draft" }),
        btn("Publish", function () {
          var rec = collect("published"); var m = check(rec, true);
          if (m) { err.textContent = m; return; }
          commit(rec, "Published: " + rec.name);
        }, { primary: true, tid: "mk-pop-publish" }),
        btn("Cancel", function () { go("#/popups"); }, { tid: "mk-pop-cancel" }),
        err
      ]);

      var others = livePops(list.filter(function (x) { return x.id !== p.id; }), today);
      var side = el("div", null, [
        el("div", { "class": "mk-box" }, [
          el("div", { "class": "mk-h2", text: "Preview" }),
          el("div", { "class": "mk-ph", text: "Preview is not available. Check the pop-up on a test phone after publishing." })
        ]),
        el("div", { "class": "mk-box" }, [
          el("div", { "class": "mk-h2", text: "Live queue now (" + others.length + ")" }),
          others.length ? el("ol", { "class": "mk-queue", "data-testid": "mk-queue" }, others.map(function (x, i) {
            return el("li", null, [el("span", { "class": "mk-n", text: String(i + 1) }), el("span", null, [el("b", { text: x.name }), " (" + teamLabel(x.team) + ")"])]);
          })) : el("div", { "class": "mk-hint", text: "Nothing is live." })
        ])
      ]);
      main.appendChild(el("div", { "class": "mk-split" }, [el("div", null, [form, actions]), side]));
    });
  }

  function screenPush(arg) {
    if (arg === "new") { return screenPushNew(); }
    main.appendChild(el("div", { "class": "mk-bar" }, [
      el("h1", { "class": "mk-h1", style: { margin: 0 }, text: "Push" }),
      el("span", { "class": "mk-bar-sp" }),
      btn("New push", function () { go("#/push/new"); }, { icon: "plus", primary: true, tid: "mk-push-new" })
    ]));
    main.appendChild(el("p", { "class": "mk-sub", text: "Send a push notification to all users, Android users or iPhone users." }));
    now().then(function (n) {
      var list = getPush(n.slice(0, 10));
      var sorted = list.slice().sort(function (a, b) { return (b.when || "9") < (a.when || "9") ? -1 : 1; });
      main.appendChild(table(["Campaign", "Title", "Audience", "Status", "When", "By"], sorted.map(function (c) {
        var st = c.state === "sent" ? "Sent" : c.state === "scheduled" ? "Scheduled" : "Draft";
        return el("tr", { "data-testid": "mk-push-row" }, [
          td(el("b", { text: c.name })), td(c.title), td(c.audience), td(statusEl(st)), td(c.when ? D.fmtDateTime(c.when) + (c.daily ? ", daily" : "") : ""), td(c.by)
        ]);
      }), "mk-push-list"));
      main.appendChild(el("div", { "class": "mk-h2", style: { margin: "16px 0 8px" }, text: "Custom audiences" }));
      main.appendChild(note("For custom audiences, raise a ticket to Engineering."));
      main.appendChild(ticketsBlock(n));
    });
  }
  function ticketsBlock(n) {
    var wrap = el("div");
    var list = getTickets(n.slice(0, 10));
    wrap.appendChild(el("div", { "class": "mk-bar" }, [btn("Raise a ticket to Engineering", function () { openTicket(n); }, { icon: "ticket", tid: "mk-ticket-open" })]));
    wrap.appendChild(table(["Ticket", "Audience asked for", "Raised", "Needed by", "Status"], list.map(function (t) {
      return el("tr", { "data-testid": "mk-ticket-row" }, [td(t.id), td(t.subject, "is-wrap"), td(D.fmtDate(t.raised)), td(t.needed ? D.fmtDate(t.needed) : ""), td(statusEl(t.status))]);
    }), "mk-tickets"));
    return wrap;
  }
  function openTicket(n) {
    var o = overlay();
    var subj = el("textarea", { "class": "mk-in", rows: 4, placeholder: "Describe the audience, for example: users who ordered biryani 2 or more times in 30 days", "data-testid": "mk-ticket-subject" });
    var need = el("input", { "class": "mk-in", type: "date", "data-testid": "mk-ticket-needed" });
    var err = el("div", { "class": "mk-badge-err" });
    o.ov.appendChild(el("div", { "class": "mk-modal is-small", "data-testid": "mk-ticket-modal" }, [
      el("h3", { style: { margin: "0 0 4px" }, text: "Ticket to Engineering" }),
      el("p", { "class": "mk-sub", text: "An engineer builds the audience and adds it for you." }),
      el("div", { "class": "mk-form", style: { gridTemplateColumns: "110px 1fr" } }, [].concat(field("Audience", subj, null, true), field("Needed by", need))),
      el("div", { "class": "mk-bar", style: { marginTop: "14px" } }, [
        btn("Send ticket", function () {
          if (!subj.value.trim()) { err.textContent = "Describe the audience."; return; }
          var list = getTickets(n.slice(0, 10));
          list.push({ id: "ENG-" + (list.length + 1), subject: subj.value.trim(), raised: n.slice(0, 10), needed: need.value, status: "Open", by: "Nabila" });
          save("tickets", list); o.close(); flash("Ticket sent to Engineering"); render();
        }, { primary: true, tid: "mk-ticket-send" }),
        btn("Cancel", o.close, { tid: "mk-ticket-cancel" }), err
      ])
    ]));
  }

  function screenPushNew() {
    now().then(function (n) {
      main.appendChild(el("div", { "class": "mk-crumb" }, [link("Push", function () { go("#/push"); }), " / New push"]));
      main.appendChild(el("h1", { "class": "mk-h1", text: "New push", style: { marginBottom: "10px" } }));
      var f = {
        name: el("input", { "class": "mk-in is-w100", "data-testid": "mk-push-name" }),
        title: el("input", { "class": "mk-in is-w100", maxlength: 50, "data-testid": "mk-push-title" }),
        body: el("textarea", { "class": "mk-in", rows: 3, maxlength: 120, "data-testid": "mk-push-body" }),
        link: el("input", { "class": "mk-in is-w100", value: "app://home", "data-testid": "mk-push-link" }),
        audience: el("select", { "class": "mk-in", "data-testid": "mk-push-audience" }, ["All users", "Android", "iPhone"].map(function (a) { return el("option", { value: a, text: a }); })),
        when: el("input", { "class": "mk-in", type: "datetime-local", disabled: "disabled", "data-testid": "mk-push-when" })
      };
      var tc = el("span", { "class": "mk-count", text: "0 / 50" });
      var bc = el("span", { "class": "mk-count", text: "0 / 120" });
      f.title.addEventListener("input", function () { tc.textContent = f.title.value.length + " / 50"; });
      f.body.addEventListener("input", function () { bc.textContent = f.body.value.length + " / 120"; });
      var mode = "now";
      var rNow = el("input", { type: "radio", name: "pm", checked: "checked", id: "pm-now", "data-testid": "mk-push-now" });
      var rLater = el("input", { type: "radio", name: "pm", id: "pm-later", "data-testid": "mk-push-later" });
      rNow.addEventListener("change", function () { mode = "now"; f.when.disabled = true; });
      rLater.addEventListener("change", function () { mode = "later"; f.when.disabled = false; });
      var err = el("div", { "class": "mk-badge-err", "data-testid": "mk-push-err" });
      var confirmBox = el("div");

      function record(state) {
        var whenIso = mode === "later" && f.when.value ? f.when.value.replace("T", " ") + ":00" : n;
        return { id: "H" + (getPush(n.slice(0, 10)).length + 100), name: f.name.value.trim() || f.title.value.trim(), title: f.title.value.trim(), body: f.body.value.trim(), link: f.link.value.trim(), audience: f.audience.value, state: state, when: state === "draft" ? "" : whenIso, by: "Nabila" };
      }
      function commit(state, msg) {
        var list = getPush(n.slice(0, 10)); list.unshift(record(state)); save("push", list); flash(msg); go("#/push");
      }
      function validate() {
        if (!f.title.value.trim()) { return "Add a title."; }
        if (!f.body.value.trim()) { return "Add the message text."; }
        if (mode === "later" && !f.when.value) { return "Pick the date and time to send."; }
        return "";
      }
      var form = el("div", { "class": "mk-form is-wide" }, [].concat(
        field("Campaign name", f.name, "Only your team sees this."),
        field("Title", el("div", null, [f.title, tc])),
        field("Message", el("div", null, [f.body, bc]), null, true),
        field("Link", f.link, "Opens when the user taps the push."),
        field("Audience", f.audience),
        field("Send", el("div", { "class": "mk-lock" }, [rNow, el("label", { "for": "pm-now", text: "Now" }), rLater, el("label", { "for": "pm-later", text: "Later" }), f.when]))
      ));
      var actions = el("div", { "class": "mk-bar", style: { marginTop: "14px" } }, [
        btn("Send", function () {
          var m = validate(); if (m) { err.textContent = m; return; }
          err.textContent = "";
          confirmBox.innerHTML = "";
          confirmBox.appendChild(el("div", { "class": "mk-note", "data-testid": "mk-push-confirm" }, [ic("alert"), el("div", null, [
            el("div", { text: (mode === "now" ? "Send now to " : "Schedule for " + f.when.value.replace("T", " ") + " to ") + f.audience.value + "?" }),
            el("div", { "class": "mk-bar", style: { margin: "8px 0 0" } }, [
              btn(mode === "now" ? "Confirm send" : "Confirm schedule", function () { commit(mode === "now" ? "sent" : "scheduled", mode === "now" ? "Push sent to " + f.audience.value : "Push scheduled"); }, { primary: true, sm: true, tid: "mk-push-confirm-yes" }),
              btn("Cancel", function () { confirmBox.innerHTML = ""; }, { sm: true, tid: "mk-push-confirm-no" })
            ])
          ])]));
        }, { primary: true, icon: "send", tid: "mk-push-send" }),
        btn("Save as draft", function () { if (!f.title.value.trim() && !f.name.value.trim()) { err.textContent = "Add a title or a name first."; return; } commit("draft", "Saved as draft"); }, { tid: "mk-push-draft" }),
        btn("Cancel", function () { go("#/push"); }, { tid: "mk-push-cancel" }),
        err
      ]);
      var side = el("div", null, [
        el("div", { "class": "mk-box" }, [
          el("div", { "class": "mk-h2", text: "Audience" }),
          el("p", { style: { margin: "0 0 8px" }, text: "You can send to All users, Android or iPhone." }),
          note("For custom audiences, raise a ticket to Engineering."),
          btn("Raise a ticket to Engineering", function () { openTicket(n); }, { icon: "ticket", tid: "mk-ticket-open" })
        ])
      ]);
      main.appendChild(el("div", { "class": "mk-split" }, [el("div", null, [form, actions, confirmBox]), side]));
    });
  }

  function screenPromos(arg) {
    if (arg === "new") { return screenPromoNew(); }
    main.appendChild(el("div", { "class": "mk-bar" }, [
      el("h1", { "class": "mk-h1", style: { margin: 0 }, text: "Promo codes" }),
      el("span", { "class": "mk-bar-sp" }),
      btn("New promo code", function () { go("#/promos/new"); }, { icon: "plus", primary: true, tid: "mk-promo-new" })
    ]));
    main.appendChild(el("p", { "class": "mk-sub", text: "Codes customers type at checkout, and codes that apply by themselves." }));
    now().then(function (n) {
      var today = n.slice(0, 10);
      promos(today).then(function (list) {
        var order = { Live: 0, Scheduled: 1, Ended: 2 };
        list = list.slice().sort(function (a, b) {
          var d = order[promoStatus(a, today)] - order[promoStatus(b, today)];
          return d || (a.code < b.code ? -1 : 1);
        });
        var q = el("input", { "class": "mk-in", placeholder: "Search code", style: { width: "180px" }, "data-testid": "mk-promo-search" });
        var st = el("select", { "class": "mk-in", "data-testid": "mk-promo-status" }, [["all", "All"], ["Live", "Live"], ["Scheduled", "Scheduled"], ["Ended", "Ended"]].map(function (o) { return el("option", { value: o[0], text: o[1] }); }));
        var holder = el("div");
        main.appendChild(el("div", { "class": "mk-bar" }, [q, st]));
        main.appendChild(holder);
        function draw() {
          holder.innerHTML = "";
          var qq = q.value.trim().toUpperCase();
          var shown = list.filter(function (p) { return (!qq || p.code.toUpperCase().indexOf(qq) !== -1) && (st.value === "all" || promoStatus(p, today) === st.value); });
          if (!shown.length) { holder.appendChild(el("div", { "class": "mk-tw" }, el("div", { "class": "mk-empty", text: "No promo codes match." }))); return; }
          holder.appendChild(table(["Code", "Owner team", "Rule", "Funded by", "Start", "End", "Budget cap", "Status", ""], shown.map(function (p) {
            var s = promoStatus(p, today);
            return el("tr", { "data-testid": "mk-promo-row" }, [
              td(el("span", { "class": "mk-code", text: p.code })), td(teamLabel(p.team)), td(p.rule, "is-wrap"), td(cap(p.funded)),
              td(p.start ? D.fmtDate(p.start) : ""), td(p.end ? D.fmtDate(p.end) : "No end date"), td(p.cap != null ? D.formatTk(p.cap) : "None", "mk-mono"),
              td(statusEl(s)), td(btn("Edit end date", function () { openPromoEdit(p, today); }, { sm: true, tid: "mk-promo-edit" }))
            ]);
          }), "mk-promos"));
        }
        q.addEventListener("input", draw); st.addEventListener("change", draw);
        draw();
      });
    });
  }
  function openPromoEdit(p, today) {
    var o = overlay();
    var end = el("input", { "class": "mk-in", type: "date", value: p.end, "data-testid": "mk-promo-end" });
    var err = el("div", { "class": "mk-badge-err" });
    function setEnd(v, msg) { var m = saved("promo_end", {}); m[p.code] = v; save("promo_end", m); o.close(); flash(msg); render(); }
    o.ov.appendChild(el("div", { "class": "mk-modal is-small", "data-testid": "mk-promo-modal" }, [
      el("h3", { style: { margin: "0 0 4px" }, text: p.code }),
      el("p", { "class": "mk-sub", text: p.rule }),
      el("div", { "class": "mk-form", style: { gridTemplateColumns: "110px 1fr" } }, [].concat(field("End date", end, "Leave empty for no end date."))),
      el("div", { "class": "mk-bar", style: { marginTop: "14px" } }, [
        btn("Save", function () {
          if (end.value && p.start && end.value < p.start) { err.textContent = "The end date is before the start date."; return; }
          setEnd(end.value, end.value ? p.code + " now ends on " + D.fmtDate(end.value) : p.code + " has no end date");
        }, { primary: true, tid: "mk-promo-save" }),
        btn("Stop now", function () { setEnd(D.addDays(today, -1), p.code + " stopped"); }, { tid: "mk-promo-stop" }),
        btn("Cancel", o.close, { tid: "mk-promo-cancel" }), err
      ])
    ]));
  }
  function screenPromoNew() {
    now().then(function (n) {
      var today = n.slice(0, 10);
      promos(today).then(function (existing) {
        main.appendChild(el("div", { "class": "mk-crumb" }, [link("Promo codes", function () { go("#/promos"); }), " / New promo code"]));
        main.appendChild(el("h1", { "class": "mk-h1", text: "New promo code", style: { marginBottom: "10px" } }));
        var f = {
          code: el("input", { "class": "mk-in", style: { width: "200px", textTransform: "uppercase" }, "data-testid": "mk-promo-code" }),
          team: el("select", { "class": "mk-in", "data-testid": "mk-promo-team" }, TEAMS.map(function (t) { return el("option", { value: t[0], text: t[1] }); })),
          type: el("select", { "class": "mk-in", "data-testid": "mk-promo-type" }, [["free_delivery", "Free delivery"], ["percent", "Percent off the food"], ["flat", "Flat Tk off"]].map(function (t) { return el("option", { value: t[0], text: t[1] }); })),
          value: el("input", { "class": "mk-in", type: "number", style: { width: "100px" }, "data-testid": "mk-promo-value" }),
          min: el("input", { "class": "mk-in", type: "number", style: { width: "100px" }, "data-testid": "mk-promo-min" }),
          funded: el("select", { "class": "mk-in", "data-testid": "mk-promo-funded" }, [["app", "App"], ["restaurant", "Restaurant"], ["shared", "Shared"], ["telco", "Telco partner"]].map(function (t) { return el("option", { value: t[0], text: t[1] }); })),
          start: el("input", { "class": "mk-in", type: "date", value: today, "data-testid": "mk-promo-start" }),
          end: el("input", { "class": "mk-in", type: "date", "data-testid": "mk-promo-end-new" })
        };
        var err = el("div", { "class": "mk-badge-err", "data-testid": "mk-promo-err" });
        var form = el("div", { "class": "mk-form is-wide" }, [].concat(
          field("Code", f.code, "Letters and numbers, no spaces."),
          field("Owner team", f.team),
          field("Type", f.type),
          field("Value", f.value, "Tk or percent. Leave empty for free delivery."),
          field("Minimum basket (Tk)", f.min),
          field("Funded by", f.funded),
          field("Start date", f.start),
          field("End date", f.end, "Optional. Leave empty to run until someone stops it.")
        ));
        main.appendChild(el("div", null, [form, el("div", { "class": "mk-bar", style: { marginTop: "14px" } }, [
          btn("Save promo code", function () {
            var code = f.code.value.trim().toUpperCase();
            if (!/^[A-Z0-9]{3,20}$/.test(code)) { err.textContent = "Code must be 3 to 20 letters or numbers."; return; }
            if (existing.some(function (x) { return x.code === code; })) { err.textContent = "This code already exists."; return; }
            if (f.type.value !== "free_delivery" && !(num(f.value.value) > 0)) { err.textContent = "Add the value."; return; }
            if (f.end.value && f.start.value && f.end.value < f.start.value) { err.textContent = "The end date is before the start date."; return; }
            var rule = f.type.value === "free_delivery" ? "Free delivery" : f.type.value === "percent" ? f.value.value + "% off the food" : "Tk " + f.value.value + " off";
            if (num(f.min.value) > 0) { rule += " on orders Tk " + f.min.value + " or more"; }
            var made = saved("promos_new", []);
            made.unshift({ code: code, team: f.team.value, rule: rule, start: f.start.value, end: f.end.value, cap: null, funded: f.funded.value });
            save("promos_new", made); flash("Promo code " + code + " saved"); go("#/promos");
          }, { primary: true, tid: "mk-promo-save-new" }),
          btn("Cancel", function () { go("#/promos"); }, { tid: "mk-promo-cancel-new" }), err
        ])]));
      });
    });
  }

  function screenBanners() {
    main.appendChild(el("h1", { "class": "mk-h1", text: "Banners" }));
    main.appendChild(el("p", { "class": "mk-sub", text: "The banner slots on the home screen." }));
    now().then(function (n) {
      var today = n.slice(0, 10);
      var list = getBanners(today);
      main.appendChild(table(["Slot", "Position", "Image", "Link", "Owner", "Start", "End", "Status", ""], list.map(function (b) {
        var empty = !b.image;
        var st = empty ? "Empty" : (b.start && b.start > today) ? "Scheduled" : (b.end && b.end < today) ? "Ended" : "Live";
        return el("tr", { "data-testid": "mk-banner-row" }, [
          td(String(b.slot), "mk-mono"), td(b.position), td(b.image || ""), td(b.link || ""), td(b.owner || ""),
          td(b.start ? D.fmtDate(b.start) : ""), td(b.end ? D.fmtDate(b.end) : ""), td(statusEl(st)),
          td(btn(empty ? "Add" : "Edit", function () { openBanner(b, list, today); }, { sm: true, tid: "mk-banner-edit" }))
        ]);
      }), "mk-banners"));
    });
  }
  function openBanner(b, list, today) {
    var o = overlay();
    var img = b.image;
    var file = el("input", { type: "file", accept: "image/*", "data-testid": "mk-banner-file" });
    var cur = el("span", { "class": "mk-hint", text: img ? "Current file: " + img : "No image chosen" });
    file.addEventListener("change", function () { if (file.files && file.files[0]) { img = file.files[0].name; cur.textContent = "Chosen: " + img; } });
    var link_ = el("input", { "class": "mk-in is-w100", value: b.link, placeholder: "app://...", "data-testid": "mk-banner-link" });
    var start = el("input", { "class": "mk-in", type: "date", value: b.start, "data-testid": "mk-banner-start" });
    var end = el("input", { "class": "mk-in", type: "date", value: b.end, "data-testid": "mk-banner-end" });
    var owner = el("select", { "class": "mk-in", "data-testid": "mk-banner-owner" }, TEAMS.map(function (t) { return el("option", { value: t[1], text: t[1] }); }));
    owner.value = b.owner || "Marketing";
    var err = el("div", { "class": "mk-badge-err" });
    function put(rec, msg) { save("banners", list.map(function (x) { return x.slot === b.slot ? rec : x; })); o.close(); flash(msg); render(); }
    o.ov.appendChild(el("div", { "class": "mk-modal is-small", "data-testid": "mk-banner-modal" }, [
      el("h3", { style: { margin: "0 0 4px" }, text: "Slot " + b.slot + ": " + b.position }),
      el("div", { "class": "mk-form", style: { gridTemplateColumns: "110px 1fr" } }, [].concat(
        field("Image", el("div", null, [file, el("div", null, cur)])),
        field("Link", link_), field("Owner team", owner), field("Start date", start), field("End date", end)
      )),
      el("div", { "class": "mk-bar", style: { marginTop: "14px" } }, [
        btn("Save", function () {
          if (!img) { err.textContent = "Choose an image."; return; }
          if (!link_.value.trim()) { err.textContent = "Add a link."; return; }
          if (end.value && start.value && end.value < start.value) { err.textContent = "The end date is before the start date."; return; }
          put(Object.assign({}, b, { image: img, link: link_.value.trim(), owner: owner.value, start: start.value || today, end: end.value }), "Slot " + b.slot + " saved");
        }, { primary: true, tid: "mk-banner-save" }),
        b.image ? btn("Clear slot", function () { put(Object.assign({}, b, { image: "", link: "", owner: "", start: "", end: "" }), "Slot " + b.slot + " cleared"); }, { tid: "mk-banner-clear" }) : null,
        btn("Cancel", o.close, { tid: "mk-banner-cancel" }), err
      ])
    ]));
  }

  shell();
  window.addEventListener("hashchange", render);
  if (!location.hash) { location.hash = "#/popups"; } else { render(); }
})();
