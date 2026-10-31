(function () {
  "use strict";

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var registered = {};
  var cache = {};

  function dataUrl(name, ext) {
    return new URL("data/" + name + "." + ext, window.location.href).href;
  }

  function loadViaFetch(name) {
    return fetch(dataUrl(name, "json")).then(function (res) {
      if (!res.ok) { throw new Error("Data file not found: data/" + name + ".json (" + res.status + ")"); }
      return res.json();
    });
  }

  function loadViaScript(name) {
    return new Promise(function (resolve, reject) {
      if (Object.prototype.hasOwnProperty.call(registered, name)) { resolve(registered[name]); return; }
      var s = document.createElement("script");
      s.src = dataUrl(name, "js");
      s.onload = function () {
        if (Object.prototype.hasOwnProperty.call(registered, name)) { resolve(registered[name]); }
        else { reject(new Error("data/" + name + ".js did not register its data")); }
      };
      s.onerror = function () {
        reject(new Error("Data file not found: data/" + name + ".js (run _base/make_data_js.py)"));
      };
      document.head.appendChild(s);
    });
  }

  function loadData(name) {
    if (!cache[name]) {
      var useScript = window.location.protocol === "file:";
      cache[name] = (useScript ? loadViaScript(name) : loadViaFetch(name)).catch(function (e) {
        delete cache[name];
        throw e;
      });
    }
    return cache[name];
  }

  function register(name, data) { registered[name] = data; }

  function groupBd(n) {
    var v = Math.round(Number(n) || 0);
    var neg = v < 0;
    var s = String(Math.abs(v));
    if (s.length > 3) {
      var head = s.slice(0, -3);
      var tail = s.slice(-3);
      head = head.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
      s = head + "," + tail;
    }
    return (neg ? "-" : "") + s;
  }
  function formatTk(n) {
    var g = groupBd(n);
    return g.charAt(0) === "-" ? "Tk -" + g.slice(1) : "Tk " + g;
  }

  function parseIso(iso) {
    if (!iso || typeof iso !== "string") { return null; }
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(iso);
    if (!m) { return null; }
    return {
      y: +m[1], mo: +m[2], d: +m[3],
      hh: m[4] !== undefined ? +m[4] : 0,
      mm: m[5] !== undefined ? +m[5] : 0,
      ss: m[6] !== undefined ? +m[6] : 0,
      hasTime: m[4] !== undefined
    };
  }
  function two(n) { return (n < 10 ? "0" : "") + n; }
  function fmtDate(iso) {
    var p = parseIso(iso);
    return p ? p.d + " " + MONTHS[p.mo - 1] + " " + p.y : (iso || "");
  }
  function fmtTime(iso) {
    var p = parseIso(iso);
    return p && p.hasTime ? two(p.hh) + ":" + two(p.mm) : "";
  }
  function fmtDateTime(iso) {
    var p = parseIso(iso);
    if (!p) { return iso || ""; }
    var base = p.d + " " + MONTHS[p.mo - 1] + " " + p.y;
    return p.hasTime ? base + ", " + two(p.hh) + ":" + two(p.mm) : base;
  }
  function epoch(p) { return Date.UTC(p.y, p.mo - 1, p.d, p.hh, p.mm, p.ss) / 1000; }
  function diffSeconds(fromIso, toIso) {
    var a = parseIso(fromIso), b = parseIso(toIso);
    if (!a || !b) { return null; }
    var d = epoch(b) - epoch(a);
    return d < 0 ? 0 : d;
  }
  function diffMinutes(fromIso, toIso) {
    var s = diffSeconds(fromIso, toIso);
    return s === null ? null : Math.floor(s / 60);
  }
  function relTime(fromIso, nowIso) {
    var d = diffSeconds(fromIso, nowIso);
    if (d === null) { return ""; }
    var MIN = 60, HR = 3600, DAY = 86400, WK = 604800;
    if (d < MIN) { return "just now"; }
    if (d < HR) { var n = Math.round(d / MIN); return n + " minute" + (n > 1 ? "s" : "") + " ago"; }
    if (d < DAY) { var h = Math.round(d / HR); return h + " hour" + (h > 1 ? "s" : "") + " ago"; }
    if (d < WK) { var dd = Math.round(d / DAY); return dd + " day" + (dd > 1 ? "s" : "") + " ago"; }
    if (d < WK * 8) { var w = Math.round(d / WK); return w + " week" + (w > 1 ? "s" : "") + " ago"; }
    var mo = Math.round(d / (DAY * 30));
    return mo + " month" + (mo > 1 ? "s" : "") + " ago";
  }
  function addDays(iso, days) {
    var p = parseIso(iso);
    if (!p) { return null; }
    var t = new Date(Date.UTC(p.y, p.mo - 1, p.d + days));
    return t.getUTCFullYear() + "-" + two(t.getUTCMonth() + 1) + "-" + two(t.getUTCDate());
  }

  var memory = {};
  function store(perTab) {
    try { return perTab ? window.sessionStorage : window.localStorage; } catch (e) { return null; }
  }
  function read(key, dflt, perTab) {
    try {
      var st = store(perTab);
      var raw = st ? st.getItem("fd:" + key) : null;
      if (raw !== null) { return JSON.parse(raw); }
    } catch (e) {   }
    return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : dflt;
  }
  function write(key, val, perTab) {
    memory[key] = val;
    try { var st = store(perTab); if (st) { st.setItem("fd:" + key, JSON.stringify(val)); } } catch (e) {   }
  }

  function resetState() {
    memory = {};
    [true, false].forEach(function (perTab) {
      try {
        var st = store(perTab);
        if (!st) { return; }
        Object.keys(st).filter(function (k) { return k.indexOf("fd:") === 0; })
          .forEach(function (k) { st.removeItem(k); });
      } catch (e) {   }
    });
  }

  window.loadData = loadData;
  window.FD_DATA = {
    loadData: loadData, register: register,
    formatTk: formatTk, groupBd: groupBd,
    parseIso: parseIso, fmtDate: fmtDate, fmtTime: fmtTime, fmtDateTime: fmtDateTime,
    diffSeconds: diffSeconds, diffMinutes: diffMinutes, relTime: relTime, addDays: addDays,
    read: read, write: write, resetState: resetState
  };
})();
