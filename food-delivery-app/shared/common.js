(function () {
  "use strict";

  var STATUS_LABELS = {
    placed: "Placed",
    accepted: "Accepted",
    ready: "Ready for pickup",
    assigned: "Rider assigned",
    picked_up: "Picked up",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };
  var STATUS_TO_PILL = {
    placed: "placed",
    accepted: "accepted",
    ready: "accepted",
    assigned: "transit",
    picked_up: "transit",
    delivered: "delivered",
    cancelled: "cancelled"
  };

  function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  }

  function applyNoMotion() {
    if (qs("nomotion") === "1") {
      document.documentElement.classList.add("nomotion");
    }
  }

  var D = window.FD_DATA;
  if (!D) { throw new Error("common.js needs data.js loaded first"); }

  function getMeta() { return D.loadData("meta"); }

  function session(persona) {
    D.write("persona", persona, true);
    return Promise.resolve({ persona: persona });
  }
  function getSession() {
    var persona = D.read("persona", null, true);
    return Promise.resolve(persona ? { persona: persona } : null);
  }

  var money = D.formatTk;
  var fmtDate = D.fmtDate;
  var fmtDateTime = D.fmtDateTime;

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) { continue; }
        var v = attrs[k];
        if (v === null || v === undefined || v === false) { continue; }
        if (k === "class" || k === "className") { node.className = v; }
        else if (k === "text") { node.textContent = v; }
        else if (k === "html") { node.innerHTML = v; }
        else if (k === "dataset") {
          for (var dk in v) { node.dataset[dk] = v[dk]; }
        }
        else if (k === "style" && typeof v === "object") {
          for (var sk in v) { node.style[sk] = v[sk]; }
        }
        else if (k.slice(0, 2) === "on" && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        }
        else { node.setAttribute(k, v); }
      }
    }
    appendKids(node, kids);
    return node;
  }
  function appendKids(node, kids) {
    if (kids === null || kids === undefined) { return; }
    if (Array.isArray(kids)) {
      kids.forEach(function (c) { appendKids(node, c); });
    } else if (typeof kids === "string" || typeof kids === "number") {
      node.appendChild(document.createTextNode(String(kids)));
    } else {
      node.appendChild(kids);
    }
  }

  var SPRITE_URL = (function () {
    var cs = document.currentScript;
    return cs && cs.src ? new URL("icons.svg", cs.src).href : "../_base/shared/icons.svg";
  })();
  function icon(name, cls) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", cls || "fd-icon");
    svg.setAttribute("aria-hidden", "true");
    var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", SPRITE_URL + "#icon-" + name);
    svg.appendChild(use);
    return svg;
  }

  function statusPill(status) {
    var pillType = STATUS_TO_PILL[status] || "placed";
    var label = STATUS_LABELS[status] || status;
    return el("span", {
      "class": "fd-pill",
      dataset: { status: pillType },
      text: label
    });
  }

  window.FD = {
    getMeta: getMeta,
    session: session,
    getSession: getSession,
    money: money,
    fmtDate: fmtDate,
    fmtDateTime: fmtDateTime,
    applyNoMotion: applyNoMotion,
    el: el,
    icon: icon,
    statusPill: statusPill,
    qs: qs,
    STATUS_LABELS: STATUS_LABELS,
    STATUS_TO_PILL: STATUS_TO_PILL
  };

  applyNoMotion();
})();
