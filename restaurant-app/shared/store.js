(function () {
  "use strict";

  var D = window.FD_DATA;
  var load = D.loadData;

  var NEXT = {
    accept:  { from: "placed",    to: "accepted" },
    ready:   { from: "accepted",  to: "ready" },
    assign:  { from: "ready",     to: "assigned" },
    pickup:  { from: "assigned",  to: "picked_up" },
    deliver: { from: "picked_up", to: "delivered" }
  };

  function fail(code, message) {
    var e = new Error(message);
    e.error = code;
    return e;
  }

  function byId(rows) {
    var m = {};
    rows.forEach(function (r) { m[r.id] = r; });
    return m;
  }

  function meta() { return load("meta"); }

  function promo(code) {
    var c = String(code || "").trim().toUpperCase();
    return meta().then(function (m) {
      var hit = (m.promo_codes || []).filter(function (p) { return p.code === c; })[0];
      return hit ? { valid: true, discount_amount: hit.discount_amount } : { valid: false };
    });
  }

  function menu(opts) {
    opts = opts || {};
    return Promise.all([load("menu_items"), load("restaurants")]).then(function (res) {
      var rmap = byId(res[1]);
      var stock = D.read("stock", {});
      var rows = res[0].map(function (m) {
        var r = rmap[m.restaurant_id] || {};
        var copy = Object.assign({}, m, {
          restaurant_name: r.name || "",
          restaurant_city: r.city || "",
          restaurant_rating: r.rating != null ? r.rating : null
        });
        if (stock[m.id]) {
          copy.stock_qty = stock[m.id].qty;
          copy.stock_last_updated_at = stock[m.id].at;
        }
        return copy;
      });
      if (opts.restaurant_id != null) {
        rows = rows.filter(function (m) { return m.restaurant_id === opts.restaurant_id; });
      }
      if (opts.category) {
        rows = rows.filter(function (m) { return m.category === opts.category; });
      }
      if (opts.search) {
        var q = String(opts.search).toLowerCase();
        rows = rows.filter(function (m) {
          return (m.name + " " + (m.name_bn || "") + " " + m.restaurant_name).toLowerCase().indexOf(q) !== -1;
        });
      }
      return rows;
    });
  }

  function menuItem(id) {
    return menu().then(function (rows) {
      return rows.filter(function (m) { return String(m.id) === String(id); })[0] || null;
    });
  }

  function setStock(id, qty) {
    return meta().then(function (m) {
      var stock = D.read("stock", {});
      stock[id] = { qty: qty, at: m.now };
      D.write("stock", stock);
      return menuItem(id);
    });
  }

  function itemTotal(o) {
    return (o.items || []).reduce(function (s, i) { return s + i.qty * i.price; }, 0);
  }

  function allOrders() {
    return Promise.all([load("orders"), load("restaurants"), load("riders")]).then(function (res) {
      var rmap = byId(res[1]);
      var ridermap = byId(res[2]);
      var created = D.read("orders_new", []);
      var patches = D.read("orders_patch", {});
      return res[0].concat(created).map(function (o) {
        var p = patches[o.id];
        var out = Object.assign({}, o);
        if (p) {
          out.status = p.status;
          out.rider_id = p.rider_id != null ? p.rider_id : o.rider_id;
          out.timeline = (o.timeline || []).concat(p.timeline_add || []);
        }
        var r = rmap[out.restaurant_id] || {};
        var rd = ridermap[out.rider_id] || null;
        out.restaurant_name = r.name || "";
        out.restaurant_city = r.city || "";
        out.restaurant_area = r.area || "";
        out.rider_name = rd ? rd.name : null;
        out.item_total = itemTotal(out);
        out.postcode = out.address ? out.address.postcode : "";
        out.total = out.item_total + (out.delivery_fee || 0) - (out.discount_amount || 0);
        return out;
      });
    });
  }

  function orders(opts) {
    opts = opts || {};
    return allOrders().then(function (rows) {
      rows = rows.filter(function (o) {
        if (opts.status && o.status !== opts.status) { return false; }
        if (opts.customer_id != null && o.customer_id !== opts.customer_id) { return false; }
        if (opts.restaurant_id != null && o.restaurant_id !== opts.restaurant_id) { return false; }
        if (opts.rider_id != null && o.rider_id !== opts.rider_id) { return false; }
        return true;
      });
      rows.sort(function (a, b) {
        var t = String(b.placed_at).localeCompare(String(a.placed_at));
        return t !== 0 ? t : b.id - a.id;
      });
      return rows;
    });
  }

  function order(id) {
    return allOrders().then(function (rows) {
      return rows.filter(function (o) { return String(o.id) === String(id); })[0] || null;
    });
  }

  function createOrder(payload) {
    return Promise.all([menu(), meta(), allOrders()]).then(function (res) {
      var items = (payload.items || []).map(function (line) {
        var m = res[0].filter(function (x) { return String(x.id) === String(line.menu_item_id); })[0];
        if (!m) { throw fail("unknown_item", "Menu item " + line.menu_item_id + " not found"); }
        return { menu_item_id: m.id, name: m.name, name_bn: m.name_bn, qty: line.qty, price: m.price, restaurant_id: m.restaurant_id };
      });
      if (!items.length) { throw fail("empty_order", "No items in the order"); }
      var maxId = res[2].reduce(function (mx, o) { return Math.max(mx, o.id); }, 1000);
      var discount = 0;
      var code = String(payload.promo_code || "").trim().toUpperCase();
      var hit = (res[1].promo_codes || []).filter(function (p) { return p.code === code; })[0];
      if (hit) { discount = hit.discount_amount; }
      var created = {
        id: maxId + 1,
        customer_id: res[1].personas.customer_id,
        restaurant_id: items[0].restaurant_id,
        rider_id: null,
        status: "placed",
        payment_method: payload.payment_method || "cod",
        delivery_fee: res[1].delivery_fee,
        discount_amount: discount,
        placed_at: res[1].now,
        address: payload.address || {},
        items: items.map(function (i) { return { menu_item_id: i.menu_item_id, name: i.name, name_bn: i.name_bn, qty: i.qty, price: i.price }; }),
        timeline: [{ status: "placed", at: res[1].now }],
        deliveries: []
      };
      var list = D.read("orders_new", []);
      list.push(created);
      D.write("orders_new", list);
      return order(created.id);
    });
  }

  function advance(id, action, extra) {
    var step = NEXT[action];
    if (!step) { return Promise.reject(fail("bad_action", "Unknown action " + action)); }
    return Promise.all([order(id), meta()]).then(function (res) {
      var o = res[0];
      if (!o) { throw fail("not_found", "Order " + id + " not found"); }
      if (o.status !== step.from) { throw fail("invalid_transition", "Order " + id + " is " + o.status + ", not " + step.from); }
      var patches = D.read("orders_patch", {});
      var prev = patches[id] || { timeline_add: [] };
      var next = {
        status: step.to,
        rider_id: o.rider_id,
        timeline_add: (prev.timeline_add || []).concat([{ status: step.to, at: res[1].now }])
      };
      if (action === "assign") {
        if (!extra || extra.rider_id == null) { throw fail("rider_required", "Pick a rider first"); }
        next.rider_id = extra.rider_id;
      }
      patches[id] = next;
      D.write("orders_patch", patches);
      return order(id);
    });
  }

  function riders(opts) {
    opts = opts || {};
    return load("riders").then(function (rows) {
      return rows.filter(function (r) {
        if (opts.city && r.city !== opts.city) { return false; }
        if (opts.active != null && !!r.active !== !!opts.active) { return false; }
        return true;
      });
    });
  }

  function deliveries(riderId) {
    return orders({ rider_id: riderId }).then(function (rows) {
      return rows.filter(function (o) { return o.status === "assigned" || o.status === "picked_up"; })
        .sort(function (a, b) { return String(a.placed_at).localeCompare(String(b.placed_at)); });
    });
  }

  function tickets(opts) {
    opts = opts || {};
    var per = 25;
    var page = opts.page || 1;
    return load("tickets").then(function (rows) {
      if (opts.category) { rows = rows.filter(function (t) { return t.category === opts.category; }); }
      rows = rows.slice().sort(function (a, b) {
        if (!!b.verbatim !== !!a.verbatim) { return b.verbatim - a.verbatim; }
        return String(b.created_at).localeCompare(String(a.created_at));
      });
      return { tickets: rows.slice((page - 1) * per, page * per), total: rows.length, per: per, page: page };
    });
  }

  function averageTabs() {
    return load("tickets").then(function (rows) {
      if (!rows.length) { return null; }
      var sum = rows.reduce(function (s, t) { return s + t.tabs_opened; }, 0);
      return Math.round((sum / rows.length) * 10) / 10;
    });
  }

  function payouts(restaurantId) {
    return load("payouts").then(function (p) {
      return {
        payouts: p.history.filter(function (h) { return h.restaurant_id === restaurantId; }),
        pending: p.pending.restaurant_id === restaurantId ? p.pending : { gross: 0, orders: 0, estimated_commission: 0 }
      };
    });
  }

  function reconciliation() {
    return load("payouts").then(function (p) {
      var done = D.read("reconciled", {});
      return p.reconciliation.map(function (r) {
        return Object.assign({}, r, { reconciled: !!done[r.restaurant_id] });
      }).sort(function (a, b) {
        var ax = a.reconciliation_type === "exception" ? 0 : 1;
        var bx = b.reconciliation_type === "exception" ? 0 : 1;
        return ax - bx;
      });
    });
  }

  function reconcile(restaurantId) {
    var done = D.read("reconciled", {});
    done[restaurantId] = true;
    D.write("reconciled", done);
    return Promise.resolve(true);
  }

  window.FD_STORE = {
    meta: meta, promo: promo,
    menu: menu, menuItem: menuItem, setStock: setStock,
    orders: orders, order: order, createOrder: createOrder, advance: advance,
    riders: riders, deliveries: deliveries,
    tickets: tickets, averageTabs: averageTabs,
    payouts: payouts, reconciliation: reconciliation, reconcile: reconcile
  };
})();
