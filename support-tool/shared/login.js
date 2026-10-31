(function () {
  "use strict";

  if (!window.FD) {
    throw new Error("login.js requires common.js (window.FD) loaded first");
  }
  var FD = window.FD;
  var el = FD.el;

  var LOGIN_STRINGS = {
    en: { enter: "Log in", caption: "Demo login, credentials pre-filled", pw: "Password" },
    bn: { enter: "লগ ইন করুন", caption: "Demo login, credentials pre-filled", pw: "পাসওয়ার্ড" }
  };

  var PERSONA_DEFAULTS = {
    customer:  { lang: "bn", title: "Food Delivery", subtitle: "Order food",
              identifier: "01712 345 678", identifierLabel: "ফোন নম্বর", frame: true },
    rider:  { lang: "bn", title: "Food Delivery Rider", subtitle: "Deliver orders",
              identifier: "01822 900 300", identifierLabel: "ফোন নম্বর", frame: true },
    restaurant: { lang: "en", title: "Food Delivery Restaurant", subtitle: "Run your restaurant",
              identifier: "restaurant@fooddelivery.example", identifierLabel: "Email", frame: false },
    ops:    { lang: "en", title: "Food Delivery Ops", subtitle: "Back office console",
              identifier: "ops@fooddelivery.example", identifierLabel: "Email", frame: false }
  };

  function brandWordmark(text) {
    var span = el("span", { "class": "fd-wordmark" });
    span.innerHTML =
      '<svg class="fd-wordmark-mark" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M4 12h16a8 8 0 0 1-16 0Z"/>' +
      '<path d="M9 8.5c0-1.2.9-1.2.9-2.4M13 8.5c0-1.2.9-1.2.9-2.4"/></svg>';
    span.appendChild(el("span", { "class": "fd-wordmark-text", text: text }));
    return span;
  }

  function buildCard(opts) {
    var s = LOGIN_STRINGS[opts.lang === "bn" ? "bn" : "en"];
    var primaryClass = "fd-btn fd-btn-primary fd-btn-block fd-btn-lg" +
      (opts.lang === "bn" ? " fd-bn" : "");

    var idField = el("div", { "class": "fd-field" }, [
      el("label", { text: opts.identifierLabel || "Phone" }),
      el("input", {
        "class": "fd-input",
        type: "text",
        value: opts.identifier || "",
        readonly: "readonly",
        "data-testid": "login-identifier"
      })
    ]);

    var pwField = el("div", { "class": "fd-field" }, [
      el("label", { text: s.pw }),
      el("input", {
        "class": "fd-input",
        type: "password",
        value: "demopass1",
        readonly: "readonly",
        "data-testid": "login-password"
      })
    ]);

    var btn = el("button", {
      "class": primaryClass,
      type: "button",
      "data-testid": "login-enter",
      text: s.enter
    });

    var card = el("div", { "class": "fd-card fd-login-card" }, [
      el("div", { "class": "fd-login-head" }, [
        brandWordmark(opts.title || "Food Delivery"),
        opts.subtitle ? el("p", { "class": "fd-login-sub", text: opts.subtitle }) : null
      ]),
      idField,
      pwField,
      btn,
      el("p", { "class": "fd-login-caption", text: s.caption })
    ]);

    return { card: card, btn: btn };
  }

  function ensureStyles() {
    if (document.getElementById("fd-login-styles")) { return; }
    var css =
      ".fd-login-stage{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--fd-bg);}" +
      ".fd-login-card{width:100%;max-width:360px;padding:28px;display:flex;flex-direction:column;gap:16px;}" +
      ".fd-login-head{display:flex;flex-direction:column;gap:6px;margin-bottom:4px;}" +
      ".fd-login-sub{margin:0;font-size:14px;color:var(--fd-grey);}" +
      ".fd-login-caption{margin:2px 0 0;font-size:12px;color:var(--fd-grey-light);text-align:center;}";
    var style = el("style", { id: "fd-login-styles", type: "text/css" });
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function mountLogin(opts) {
    opts = opts || {};
    ensureStyles();
    var built = buildCard(opts);

    var mount = opts.mount || document.body;
    var stage = el("div", { "class": "fd-login-stage", "data-testid": "login-screen" }, built.card);
    mount.appendChild(stage);

    built.btn.addEventListener("click", function () {
      built.btn.disabled = true;
      FD.session(opts.persona).then(function () {
        stage.remove();
        if (typeof opts.onEnter === "function") { opts.onEnter(); }
      }).catch(function (err) {
        built.btn.disabled = false;
        var existing = built.card.querySelector(".fd-login-error");
        if (existing) { existing.remove(); }
        built.card.appendChild(el("p", {
          "class": "fd-login-error fd-login-caption",
          style: { color: "var(--fd-status-cancelled)" },
          text: "Could not start session: " + err.message
        }));
      });
    });

    return stage;
  }

  function requireSession(personaOrConfig, renderApp) {
    var persona = typeof personaOrConfig === "string" ? personaOrConfig : personaOrConfig.persona;
    var overrides = typeof personaOrConfig === "string" ? {} : personaOrConfig;
    var defaults = PERSONA_DEFAULTS[persona] || {};
    var opts = Object.assign({ persona: persona }, defaults, overrides);
    opts.onEnter = renderApp;

    FD.getSession().then(function (sess) {
      if (sess && sess.persona === persona) {
        renderApp();
      } else {
        mountLogin(opts);
      }
    });
  }

  FD.mountLogin = mountLogin;
  FD.requireSession = requireSession;
  FD.LOGIN_PERSONA_DEFAULTS = PERSONA_DEFAULTS;
})();
