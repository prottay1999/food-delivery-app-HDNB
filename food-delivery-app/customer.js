(function () {
  "use strict";

  var D = window.FD_DATA;
  var FD = window.FD;
  var el = FD.el;

  var VERSION = "6.4";
  var FREE_DELIVERY_MIN = 500;
  var STAFF_PHONE = "01999000001";
  var DEMO_PHONE = "01712345678";
  var CANCELLED_PHONE = "01712000002";
  var MAX_HOME_KM = 8;
  var MAX_DELIVER_KM = 6;
  var SMALL_BASKET_MIN = 300;
  var AREAS = ["Mirpur", "Dhanmondi", "Uttara", "Gulshan", "Mohammadpur", "Banani", "Bashundhara",
    "Malibagh", "Badda", "Rampura", "Tejgaon", "Mohakhali", "Farmgate", "Khilgaon", "Motijheel",
    "Old Dhaka", "Shyamoli", "Karwan Bazar", "Jatrabari", "Aftabnagar", "Keraniganj", "Purbachal"];

  var S = {
    lang: D.read("customer_lang", "en"),
    account: D.read("customer_account", null, true),
    stack: [],
    meta: {}, restaurants: [], menuRows: [], orderRows: [], riders: [],
    byId: {}, menuCache: {},
    cleanups: [],
    bkashTries: 0,
    promo: "",
    addrPick: false,
    phoneOs: "android",
    cartNotice: ""
  };
  var app, view, layer, tabbar;

  var BN = window.BX_BN || {};
  function t(s, vars) {
    var out = (S.lang === "bn" && BN[s]) ? BN[s] : s;
    if (vars) { for (var k in vars) { out = out.split("{" + k + "}").join(vars[k]); } }
    return out;
  }

  var IC = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>',
    orders: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    cart: '<circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/><path d="M2 3h2.2l1.9 11.2a1.5 1.5 0 0 0 1.5 1.25h9.1a1.5 1.5 0 0 0 1.47-1.2l1.33-6.55H5.4"/>',
    back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevR: '<path d="m9 6 6 6-6 6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8z"/>',
    share: '<path d="M12 15V4"/><path d="m8 8 4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',
    pin: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bike: '<circle cx="5.5" cy="17.5" r="3.2"/><circle cx="18.5" cy="17.5" r="3.2"/><path d="M8.5 17.5h6l-3.5-8H8"/><path d="M14 9.5h3l1.5 8"/>',
    store: '<path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3.5 9l1.4-4.4A1 1 0 0 1 5.85 4h12.3a1 1 0 0 1 .95.6L20.5 9a2.5 2.5 0 0 1-4.25 2 2.5 2.5 0 0 1-4.25 0 2.5 2.5 0 0 1-4.25 0A2.5 2.5 0 0 1 3.5 9Z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3 9h18v3H3zM12 9v11"/><path d="M12 9c-2.5 0-4-1-4-2.5S9 4 10.5 4C12 4 12 7 12 9zM12 9c2.5 0 4-1 4-2.5S15 4 13.5 4C12 4 12 7 12 9z"/>',
    chat: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
    locate: '<circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M16 14.5h2"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/>',
    cash: '<rect x="3" y="7" width="18" height="10" rx="1.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 12h.01M17.5 12h.01"/>',
    bowl: '<path d="M4 12h16a8 8 0 0 1-16 0Z"/><path d="M9 8.5c0-1.2.9-1.2.9-2.4M13 8.5c0-1.2.9-1.2.9-2.4"/>',
    alert: '<path d="M12 4 3 20h18z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    send: '<path d="M4 12 20 4l-4 16-4-7z"/><path d="M12 13l8-9"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><path d="M7.5 8h.01"/>',
    logout: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9"/>',
    headset: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2Z"/><path d="M20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2Z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14 4l2-2"/><path d="M20 20v-5h-5"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    doc: '<path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/>'
  };
  function ic(name, cls) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "bx-ic " + (cls || ""));
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = IC[name] || "";
    return svg;
  }
  function starFill(on) {
    var s = ic("star", "bx-star" + (on ? " is-on" : ""));
    return s;
  }

  function arr(x) { return Array.isArray(x) ? x : ((x && x.rows) || []); }
  function num(x) { if (x === null || x === undefined || x === "") { return null; } var n = Number(x); return isNaN(n) ? null : n; }
  function first() { for (var i = 0; i < arguments.length; i++) { if (arguments[i] !== undefined && arguments[i] !== null && arguments[i] !== "") { return arguments[i]; } } return null; }
  function titleCase(s) {
    s = String(s || "").replace(/_/g, " ").trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }
  function money(n) { return FD.money(n); }
  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function hasBangla(s) { return /[ঀ-৿]/.test(s); }
  function safeLoad(name) {
    return D.loadData(name).then(arr).catch(function () { return []; });
  }
  function nowIso() { return S.meta.now || "2027-03-29 13:10:00"; }
  function addMin(iso, m) {
    var p = D.parseIso(iso) || { hh: 13, mm: 0 };
    var total = p.hh * 60 + p.mm + m;
    var hh = Math.floor(total / 60) % 24, mm = total % 60;
    return (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;
  }
  function baseFee() { var f = num(S.meta.delivery_fee); return f === null ? 45 : f; }
  function nextId() {
    var max = 1000;
    S.orderRows.concat(D.read("orders_new", [])).forEach(function (o) {
      var n = parseInt(first(o.id, o.order_id), 10);
      if (!isNaN(n) && n > max) { max = n; }
    });
    return max + 1;
  }

  function normRestaurant(r) {
    var id = first(r.restaurant_id, r.id);
    var status = r.status;
    var live = status ? status === "live" : true;
    var cuisineRaw = String(r.cuisine || "").toLowerCase();
    return {
      id: id,
      name: r.name || "Restaurant",
      area: r.area || "",
      cuisineKey: cuisineRaw,
      cuisine: titleCase(cuisineRaw),
      rating: num(r.rating),
      live: live,
      open: r.open !== false && r.open !== 0 && live,
      orders: 0,
      type: String(r.restaurant_type || "restaurant"),
      photoPct: num(r.photo_items_pct),
      minOrder: num(r.min_order_tk),
      inMall: r.in_mall
    };
  }

  function hash(s) {
    var h = 2166136261;
    s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mod(s, n) { return hash(s) % n; }

  function photoPct(r) {
    if (r.photoPct !== null && r.photoPct !== undefined) { return r.photoPct; }
    return (r.type === "restaurant" && r.orders >= 2) ? 90 : 14;
  }
  function hasPhoto(r, item) { return mod("photo|" + r.id + "|" + item.name, 100) < photoPct(r); }

  function minOrderOf(r) {
    if (!r) { return 0; }
    if (r.minOrder !== null && r.minOrder !== undefined) { return r.minOrder; }
    return (r.type === "street_food" || r.type === "home_kitchen") ? SMALL_BASKET_MIN : 0;
  }

  function areaWord(a) { return String(a || "").toLowerCase().split(/[ ,(]/)[0]; }
  function distanceKm(r, addr) {
    if (!r) { return 0; }
    var area = addr ? addr.area : "";
    var h = hash("km|" + r.id + "|" + areaWord(area));
    var d;
    if (areaWord(r.area) === areaWord(area) && area) { d = 0.6 + (h % 14) / 10; }
    else { var u = (h % 1000) / 1000; d = 1.4 + 6.6 * u * u * u; }
    return Math.round(d * 10) / 10;
  }
  function etaMinutes(km) { return Math.round(25 + 4 * km); }

  var TEMPLATES = {
    biryani: [["Biryani", "Kacchi Biryani", 420], ["Biryani", "Chicken Tehari", 260], ["Biryani", "Beef Tehari", 300], ["Sides", "Egg Curry", 60], ["Sides", "Salad and Raita", 40], ["Drinks", "Borhani", 60]],
    kacchi: [["Kacchi", "Mutton Kacchi", 480], ["Kacchi", "Kacchi Biryani Half", 300], ["Sides", "Chicken Roast", 120], ["Sides", "Salad and Raita", 40], ["Drinks", "Borhani", 60]],
    burger: [["Burgers", "Beef Burger", 320], ["Burgers", "Chicken Burger", 280], ["Burgers", "Cheese Burger", 340], ["Sides", "French Fries", 120], ["Drinks", "Soft Drink", 50]],
    pizza: [["Pizza", "Chicken Pizza 8 inch", 520], ["Pizza", "Beef Pizza 8 inch", 580], ["Pizza", "Cheese Pizza 8 inch", 480], ["Sides", "Garlic Bread", 150], ["Drinks", "Soft Drink", 50]],
    chinese: [["Noodles and rice", "Chicken Chowmein", 280], ["Noodles and rice", "Egg Fried Rice", 240], ["Mains", "Chilli Chicken", 330], ["Mains", "Thai Soup", 220], ["Drinks", "Lemon Tea", 60]],
    bangla: [["Rice meals", "Bhuna Khichuri", 220], ["Rice meals", "Rice with Beef Curry", 260], ["Rice meals", "Rice with Hilsa", 380], ["Sides", "Dal", 60], ["Sides", "Mixed Vegetables", 80]],
    street_food: [["Snacks", "Fuchka", 80], ["Snacks", "Chotpoti", 90], ["Snacks", "Samosa 4 pcs", 60], ["Snacks", "Jhal Muri", 50], ["Drinks", "Lemonade", 40]],
    cafe: [["Coffee", "Cappuccino", 220], ["Coffee", "Cold Coffee", 250], ["Bites", "Club Sandwich", 300], ["Bites", "Chicken Wrap", 280], ["Sweets", "Brownie", 160]],
    home_food: [["Home meals", "Chicken Curry with Rice", 250], ["Home meals", "Beef Rezala with Polao", 330], ["Home meals", "Vegetable Khichuri", 200], ["Sides", "Dal", 60], ["Desserts", "Firni", 90]],
    desserts: [["Desserts", "Rasmalai", 140], ["Desserts", "Mishti Doi", 90], ["Desserts", "Chocolate Cake Slice", 180], ["Desserts", "Ice Cream Cup", 120]]
  };
  function templateFor(r) {
    var key = r.cuisineKey;
    var list = TEMPLATES[key] || TEMPLATES[key.replace(/ /g, "_")] || null;
    if (!list) {
      var found = Object.keys(TEMPLATES).filter(function (k) { return key.indexOf(k) !== -1; })[0];
      list = TEMPLATES[found || "bangla"];
    }
    return list.map(function (row, i) {
      return { id: "t" + r.id + "-" + i, name: row[1], name_bn: "", category: row[0], price: row[2], restaurant_id: r.id };
    });
  }

  var MORE = {
    bangla: [["Beef Rezala", 340], ["Mutton Kosha", 420], ["Hilsa Bhapa", 460], ["Chicken Roast", 180], ["Plain Polao", 160], ["Vegetable Khichuri", 200], ["Shorshe Ilish", 480], ["Beef Kala Bhuna", 380], ["Duck Curry", 360], ["Fish Fry", 220], ["Egg Bhuna", 120], ["Mixed Vegetables", 90], ["Dal Fry", 70], ["Begun Bhaja", 60], ["Aloo Bhorta", 50], ["Shutki Bhuna", 140], ["Rui Fish Curry", 240], ["Pabda Jhal", 300], ["Chingri Malai Curry", 420], ["Tehari Plate", 260]],
    burger: [["Double Beef Burger", 420], ["Spicy Chicken Burger", 300], ["Crispy Chicken Burger", 310], ["Mushroom Burger", 330], ["BBQ Burger", 360], ["Fish Burger", 340], ["Veggie Burger", 240], ["Chicken Nuggets", 190], ["Onion Rings", 140], ["Cheese Fries", 180], ["Chicken Hot Dog", 200], ["Beef Hot Dog", 230], ["Club Sandwich", 280], ["Chicken Wrap", 260], ["Coleslaw", 80], ["Milkshake", 220], ["Chocolate Shake", 240], ["Brownie", 150], ["Ice Cream Cup", 120], ["Soft Drink", 50]],
    chinese: [["Beef Chowmein", 330], ["Egg Fried Rice", 240], ["Vegetable Chowmein", 250], ["Sweet and Sour Chicken", 360], ["Chicken Manchurian", 350], ["Hot and Sour Soup", 210], ["Corn Soup", 200], ["Prawn Chili", 480], ["Beef Chili Onion", 390], ["Cashew Chicken", 420], ["Spring Rolls", 180], ["Chicken Dumplings", 240], ["Szechuan Noodles", 320], ["Singapore Rice", 330], ["Mixed Fried Rice", 360], ["Thai Fried Rice", 340], ["Schezwan Chicken", 380], ["Egg Drop Soup", 190], ["Vegetable Spring Roll", 160], ["Lemon Tea", 60]],
    pizza: [["Pepperoni Pizza", 560], ["BBQ Chicken Pizza", 540], ["Margherita Pizza", 420], ["Veggie Pizza", 460], ["Supreme Pizza", 640], ["Beef Sausage Pizza", 580], ["Chicken Alfredo Pasta", 380], ["Beef Bolognese Pasta", 400], ["Mac and Cheese", 320], ["Cheese Sticks", 210], ["Chicken Wings", 280], ["Caesar Salad", 260], ["Lasagna", 450], ["Garlic Knots", 160], ["Tiramisu", 240], ["Lemon Soda", 90], ["Mint Lemonade", 110], ["Chocolate Lava Cake", 220], ["Cheese Burst Pizza", 620], ["Calzone", 380]],
    cafe: [["Americano", 160], ["Latte", 230], ["Mocha", 250], ["Espresso", 140], ["Caramel Macchiato", 280], ["Iced Latte", 260], ["Hot Chocolate", 220], ["Green Tea", 120], ["Chicken Sandwich", 290], ["Tuna Sandwich", 310], ["Chicken Pasta", 360], ["Waffle", 260], ["Pancakes", 240], ["Cheesecake Slice", 260], ["Donut", 110], ["Muffin", 130], ["Cookies", 100], ["Fruit Smoothie", 240], ["Mango Lassi", 180], ["Egg Sandwich", 200]],
    kacchi: [["Mutton Roast", 220], ["Chicken Roast", 130], ["Plain Polao", 120], ["Mutton Tehari", 340], ["Chicken Tehari", 260], ["Egg Curry", 70], ["Salad and Raita", 50], ["Shahi Jorda", 120], ["Chicken Rezala", 280], ["Beef Kala Bhuna", 360], ["Lassi", 90], ["Cold Drink", 50], ["Mineral Water", 30], ["Rasmalai", 140], ["Mishti Doi", 90], ["Kheer", 110], ["Seekh Kabab", 210], ["Chicken Tikka", 240], ["Naan", 40], ["Paratha", 30]],
    biryani: [["Beef Biryani", 320], ["Mutton Tehari", 340], ["Chicken Tehari", 260], ["Egg Curry", 70], ["Plain Polao", 120], ["Chicken Roast", 130], ["Mutton Roast", 220], ["Chicken Rezala", 280], ["Seekh Kabab", 210], ["Chicken Tikka", 240], ["Shahi Jorda", 120], ["Salad and Raita", 50], ["Lassi", 90], ["Cold Drink", 50], ["Mineral Water", 30], ["Rasmalai", 140], ["Kheer", 110], ["Naan", 40], ["Paratha", 30], ["Beef Bhuna", 340]],
    street_food: [["Dahi Fuchka", 90], ["Beef Samosa", 40], ["Singara", 30], ["Piyaju", 25], ["Beguni", 25], ["Egg Chop", 40], ["Aloo Chop", 30], ["Jhal Muri Special", 60], ["Chana Chatpati", 70], ["Kebab Roll", 120], ["Chicken Roll", 140], ["Beef Roll", 160], ["Hotdog", 100], ["Nuggets", 140], ["Chicken Pakora", 90], ["Muri Ghonto", 80], ["Doi Fuchka", 100], ["Lassi", 70], ["Lemon Soda", 40], ["Cha", 20]],
    home_food: [["Beef Curry with Rice", 280], ["Hilsa Curry with Rice", 380], ["Egg Curry with Rice", 180], ["Dal Bhat Set", 190], ["Vegetable Curry", 120], ["Chicken Bhuna", 240], ["Mutton Curry", 380], ["Rui Fish Curry", 240], ["Begun Bhaja", 60], ["Mashed Potato Set", 100], ["Dim Bhuna", 110], ["Pulao Set", 260], ["Rezala Set", 340], ["Tehari Home Style", 240], ["Khichuri and Egg", 190], ["Payesh", 90], ["Sheddho Bhat Set", 200], ["Halua", 80], ["Pitha Platter", 150], ["Lassi", 70]],
    shared: [["Soft Drink", 50], ["Mineral Water", 30], ["Lemon Soda", 90], ["Borhani", 60], ["Salad", 50], ["Firni", 90], ["Rasmalai", 140], ["Mishti Doi", 90], ["Ice Cream Cup", 120], ["Brownie", 150]]
  };
  var DRINK_NAME_RE = /borhani|soft drink|cold drink|water|soda|lassi|tea$|coffee|shake|smoothie|lemonade|latte|mocha|espresso|americano|macchiato|hot chocolate|^cha$/i;
  var SWEET_NAME_RE = /firni|rasmalai|mishti|ice cream|brownie|kheer|payesh|halua|tiramisu|cheesecake|cake|donut|muffin|cookie|waffle|pancake|pitha|lava/i;
  function categoryOf(name) {
    if (DRINK_NAME_RE.test(name)) { return "Drinks"; }
    if (SWEET_NAME_RE.test(name)) { return "Desserts"; }
    return "Mains";
  }
  function menuLength(r) {
    var h = mod("len|" + r.id, 100);
    if (r.type === "street_food" || r.type === "home_kitchen") { return 6 + h % 8; }
    if (r.type === "cloud_kitchen") { return 8 + h % 14; }
    if (h < 35) { return 8 + h % 7; }
    if (h < 75) { return 16 + h % 23; }
    return 40 + h % 25;
  }
  function extendMenu(r, rows) {
    var want = menuLength(r);
    if (rows.length >= 15 || rows.length >= want) { return rows; }
    var key = MORE[r.cuisineKey] ? r.cuisineKey : (MORE[r.cuisineKey.replace(/ /g, "_")] ? r.cuisineKey.replace(/ /g, "_") : "bangla");
    var pool = MORE[key].concat(MORE.shared);
    var seen = {};
    rows.forEach(function (m) { seen[m.name.toLowerCase()] = true; });
    var scale = 0.9 + mod("scale|" + r.id, 26) / 100;
    var n = 0;
    function push(name, price) {
      if (seen[name.toLowerCase()] || rows.length >= want) { return; }
      seen[name.toLowerCase()] = true;
      rows.push({ id: "g" + r.id + "-" + (n++), name: name, name_bn: "", category: categoryOf(name), price: Math.round(price * scale / 5) * 5, restaurant_id: r.id });
    }
    pool.forEach(function (p) { push(p[0], p[1]); });

    pool.slice(0, 20).forEach(function (p) { if (categoryOf(p[0]) === "Mains") { push(p[0] + " Combo", p[1] + 90); } });
    pool.slice(0, 20).forEach(function (p) { if (categoryOf(p[0]) === "Mains") { push(p[0] + " Family Pack", p[1] * 2 + 60); } });
    return rows;
  }

  function shuffled(r, rows) {
    var key = {};
    rows.forEach(function (m) { key[m.name] = hash("ord|" + r.id + "|" + m.name); });
    return rows.slice().sort(function (a, b) { return key[a.name] - key[b.name]; });
  }

  var SIZED_RE = /kacchi|biryani|tehari/i;
  function menuFor(r) {
    if (S.menuCache[r.id]) { return S.menuCache[r.id]; }
    var rows = S.menuRows.filter(function (m) { return String(first(m.restaurant_id)) === String(r.id); }).map(function (m) {
      return {
        id: first(m.item_id, m.id), name: m.name || "Item", name_bn: m.name_bn || "",
        category: m.category ? titleCase(m.category) : "Menu", price: num(first(m.price, m.price_tk)) || 0, restaurant_id: r.id
      };
    });
    if (!rows.length) { rows = templateFor(r); }

    var out = [];
    rows.forEach(function (m) {
      var mm = /^(.*)\s\((half|full)\)$/i.exec(m.name);
      if (!mm) { out.push(m); return; }
      var base = mm[1], kind = mm[2].toLowerCase();
      var host = out.filter(function (x) { return x.pair === base; })[0];
      if (!host) { host = { id: m.id, name: base, name_bn: m.name_bn, category: m.category, price: m.price, restaurant_id: r.id, pair: base }; out.push(host); }
      if (kind === "full") { host.price = m.price; host.id = m.id; } else { host.halfPrice = m.price; }
    });
    out = extendMenu(r, out);
    out.forEach(function (m) {
      m.kind = categoryOf(m.name);
      m.sized = SIZED_RE.test(m.name);
      if (m.sized) {
        var delta = m.halfPrice ? m.price - m.halfPrice : Math.round(m.price * 0.4 / 10) * 10;
        m.halfDelta = Math.max(20, delta);
      }
    });
    rows = shuffled(r, out);
    S.menuCache[r.id] = rows;
    return rows;
  }

  function optionsFor(item) {
    if (item.kind && item.kind !== "Mains" && !item.sized) { return []; }
    var groups = [
      { id: "extra", title: "Add extras", required: false, multi: true,
        choices: [{ label: "Extra salad", price: 20 }, { label: "Fried egg", price: 25 }, { label: "Extra raita", price: 25 }] }
    ];
    if (item.sized) {
      groups.push({ id: "drink", title: "Add a drink", required: false, multi: true,
        choices: [{ label: "Soft drink", price: 40 }, { label: "Borhani", price: 50 }, { label: "Lemon soda", price: 45 }] });
      groups.push({ id: "size", title: "Size", required: true, multi: false,
        choices: [{ label: "Half", price: -item.halfDelta }, { label: "Full", price: 0 }] });
    }
    return groups;
  }

  var PAY_LABEL = { cod: "Cash on delivery", cash: "Cash on delivery", prepaid: "Paid online", bkash: "bKash", nagad: "Nagad", card: "Card" };
  function payLabel(m) { return PAY_LABEL[m] || titleCase(m || "Cash"); }

  function phaseOf(status) {
    if (status === "cancelled") { return -1; }
    if (status === "delivered" || status === "completed") { return 3; }
    if (status === "assigned" || status === "picked_up") { return 2; }
    if (status === "accepted" || status === "ready") { return 1; }
    return 0;
  }

  function normOrder(o, patches) {
    var id = first(o.id, o.order_id);
    var p = patches[id];
    var status = p ? p.status : (o.status || "placed");
    var rid = first(o.restaurant_id);
    var r = S.byId[rid] || {};
    var items = (o.items || []).map(function (i) {
      return {
        name: i.name || "Item", qty: i.qty || 1, price: num(i.price) || 0, opts: i.opts || "",
        id: first(i.menu_item_id), base: num(i.base_price), optList: i.opt_list || null
      };
    });
    var sub = num(first(o.items_total_tk, o.item_total));
    if (!items.length && sub) {
      var m = r.id !== undefined ? menuFor(r)[0] : null;

      items = [{ name: m ? m.name : "Food order", qty: 1, price: sub, opts: "", id: m ? m.id : null, base: null, optList: null, assumed: true }];
    }
    if (sub === null) { sub = items.reduce(function (s, i) { return s + i.qty * i.price; }, 0); }
    var fee = num(first(o.delivery_fee, o.delivery_fee_tk)) || 0;
    var disc = num(first(o.discount_amount, o.discount_tk)) || 0;
    var addr = o.address || {};
    return {
      id: id, restaurant_id: rid, restaurant_name: o.restaurant_name || r.name || "Restaurant",
      placed_at: o.placed_at || nowIso(), status: status, phase: phaseOf(status),
      items: items, subtotal: sub, delivery_fee: fee, discount: disc, promo_code: o.promo_code || "",
      total: sub + fee - disc, payment_method: o.payment_method || "cod",
      address: addr.label ? addr.label + ", " + (addr.text || "") : [addr.street, addr.area].filter(Boolean).join(", "),
      timeline: (o.timeline || []).concat(p ? (p.timeline_add || []) : []),
      rider_id: p && p.rider_id != null ? p.rider_id : o.rider_id,
      mine: !!o.customer_phone
    };
  }

  function cancelledOrderFor(acc) {
    var live = S.restaurants.filter(function (r) { return r.live && r.type === "restaurant"; });
    var r = live[0] || S.restaurants[0];
    if (!r) { return null; }
    var menu = menuFor(r).filter(function (m) { return !m.sized && m.kind === "Mains"; });
    var pick = menu.slice(0, 2);
    var at = D.addDays(nowIso(), -2) + " 20:15:00";
    return {
      id: 90101, customer_id: S.meta.personas ? S.meta.personas.customer_id : 1, restaurant_id: r.id, status: "cancelled",
      payment_method: "cod", delivery_fee: baseFee(), discount_amount: 0, placed_at: at,
      address: { label: "Home", text: "House 7, Road 3", area: "Mirpur" },
      items: pick.map(function (m) { return { menu_item_id: m.id, name: m.name, qty: 1, price: m.price, base_price: m.price }; }),
      timeline: [{ status: "placed", at: at }, { status: "cancelled", at: D.addDays(nowIso(), -2) + " 20:41:00" }]
    };
  }
  function ordersForAccount() {
    var acc = S.account;
    if (!acc) { return []; }
    var patches = D.read("orders_patch", {});
    var list = [];
    if (acc.cancelledOnly) {
      var co = cancelledOrderFor(acc);
      if (co) { list.push(co); }
    } else if (!acc.isNew) {
      list = S.pastOrders.slice();
    }
    D.read("orders_new", []).forEach(function (o) {
      if (o.customer_phone === acc.phone) { list.push(o); }
    });
    var out = list.map(function (o) { return normOrder(o, patches); });
    out.sort(function (a, b) {
      var c = String(b.placed_at).localeCompare(String(a.placed_at));
      return c !== 0 ? c : (Number(b.id) || 0) - (Number(a.id) || 0);
    });
    return out;
  }
  function orderById(id) {
    return ordersForAccount().filter(function (o) { return String(o.id) === String(id); })[0] || null;
  }
  function activeOrder() {
    return ordersForAccount().filter(function (o) { return o.phase >= 0 && o.phase < 3 && o.mine; })[0] || null;
  }
  function ratings() { return D.read("customer_ratings", {}); }

  function cart() { return D.read("customer_cart", { restaurant_id: null, lines: [] }); }
  function saveCart(c) { D.write("customer_cart", c); if (S.onCart) { S.onCart(); } }
  function lineUnit(l) { return l.price + (l.opts || []).reduce(function (s, o) { return s + o.price; }, 0); }
  function cartCount() { return cart().lines.reduce(function (s, l) { return s + l.qty; }, 0); }
  function cartSubtotal() { return cart().lines.reduce(function (s, l) { return s + lineUnit(l) * l.qty; }, 0); }
  function cartRestaurant() { var c = cart(); return c.restaurant_id != null ? S.byId[c.restaurant_id] : null; }

  function addToCart(r, item, opts, qty) {
    var c = cart();
    if (c.restaurant_id === null || String(c.restaurant_id) !== String(r.id)) { c = { restaurant_id: r.id, lines: [] }; }
    var key = item.id + "|" + opts.map(function (o) { return o.label; }).join(",");
    var line = c.lines.filter(function (l) { return l.key === key; })[0];
    if (line) { line.qty += qty; }
    else { c.lines.push({ key: key, item_id: item.id, name: item.name, price: item.price, qty: qty, opts: opts }); }
    saveCart(c);
    return true;
  }

  function isFirstOrder() { return !!(S.account && S.account.isNew && ordersForAccount().length === 0); }
  function linesMatching(lines, re) {
    return lines.filter(function (l) { return re.test(l.name); });
  }
  function sumLines(ls) { return ls.reduce(function (s, l) { return s + lineUnit(l) * l.qty; }, 0); }
  function checkCode(raw, sub, isFirst) {
    var code = String(raw || "").trim().toUpperCase();
    if (!code) { return { ok: false, err: "" }; }
    var lines = cart().lines;
    var rest = cartRestaurant();
    var noFit = { ok: false, err: t("This code does not apply to your basket.") };
    if (code === "FREEDEL500") {
      if (sub >= FREE_DELIVERY_MIN) { return { ok: true, code: code, free: true }; }
      return { ok: false, err: t("Add {n} more to use this code.", { n: money(FREE_DELIVERY_MIN - sub) }) };
    }
    if (code === "FIRSTFREE") {
      return isFirst ? { ok: true, code: code, free: true } : { ok: false, err: t("This code is only for your first order.") };
    }
    if (code === "TELCO100" || code === "TEHARI10") { return { ok: false, err: t("This code has ended.") }; }
    if (code === "KACCHI20") {
      var k = linesMatching(lines, /kacchi/i);
      if (!k.length) { return noFit; }
      return { ok: true, code: code, discount: Math.min(120, Math.round(sumLines(k) * 0.2)) };
    }
    if (code === "BURGER2X") {
      var units = [];
      linesMatching(lines, /burger/i).forEach(function (l) { for (var i = 0; i < l.qty; i++) { units.push(lineUnit(l)); } });
      if (units.length < 2) { return noFit; }
      units.sort(function (a, b) { return b - a; });
      var half = 0;
      for (var j = 1; j < units.length; j += 2) { half += Math.round(units[j] / 2); }
      return { ok: true, code: code, discount: half };
    }
    if (code === "PIZZA150") {
      var pz = linesMatching(lines, /pizza/i);
      if (!pz.length || sumLines(pz) <= 900) { return noFit; }
      return { ok: true, code: code, discount: 150 };
    }
    if (code === "HOMEFOOD50") {
      if (!rest || rest.type !== "home_kitchen") { return noFit; }
      return { ok: true, code: code, discount: 50 };
    }
    if (code === "CAFE15") {
      var cf = linesMatching(lines, /coffee|latte|mocha|cappuccino|espresso|americano|macchiato/i);
      if (!cf.length) { return noFit; }
      return { ok: false, err: t("This code is valid before 11 am.") };
    }
    var hit = (Array.isArray(S.meta.promo_codes) ? S.meta.promo_codes : []).filter(function (p) { return String(p.code).toUpperCase() === code; })[0];
    if (hit && num(hit.discount_amount)) { return { ok: true, code: code, discount: num(hit.discount_amount) }; }
    return { ok: false, err: t("This code is not valid.") };
  }

  function basketFree() { return isFirstOrder() || cartSubtotal() >= FREE_DELIVERY_MIN; }

  function pricing() {
    var sub = cartSubtotal();
    var isFirst = isFirstOrder();
    var out = { subtotal: sub, deliveryFee: baseFee(), discount: 0, code: "", err: "", free: false, total: 0 };
    var viaCode = false;
    if (S.promo) {
      var r = checkCode(S.promo, sub, isFirst);
      if (r.ok) { out.code = r.code; out.discount = r.discount || 0; viaCode = !!r.free; }
      else { out.err = r.err; }
    }
    var food = Math.max(0, sub - out.discount);
    out.free = isFirst || viaCode || food >= FREE_DELIVERY_MIN;
    if (!out.code) {
      if (isFirst) { out.code = "FIRSTFREE"; }
      else if (sub >= FREE_DELIVERY_MIN) { out.code = "FREEDEL500"; }
    }
    if (out.free) { out.deliveryFee = 0; }
    out.total = food + out.deliveryFee;
    return out;
  }

  function addrKey() { return "customer_addresses_" + (S.account ? S.account.phone : "none"); }
  function addresses() { return D.read(addrKey(), []); }
  function saveAddresses(a) { D.write(addrKey(), a); }
  function currentAddress() {
    var a = addresses();
    return a.filter(function (x) { return x.default; })[0] || a[0] || null;
  }
  function seedAddresses() {
    if (D.read(addrKey(), null) !== null) { return; }
    if (S.account.cancelledOnly) {
      saveAddresses([{ id: 1, label: "Home", area: "Mirpur", text: "House 7, Road 3", note: "", pin: true, default: true }]);
      return;
    }
    if (S.account.isNew) { saveAddresses([]); return; }
    var addr = (S.personaOrders[0] || {}).address || {};
    saveAddresses([
      { id: 1, label: "Home", area: addr.area || "Dhanmondi", text: addr.street || "House 42, Road 9/A", note: "", pin: true, default: true },
      { id: 2, label: "Office", area: "Tejgaon", text: "Level 5, Tejgaon Industrial Area", note: "Call at the gate", pin: true, default: false }
    ]);
  }

  function iconBtn(name, onclick, testid, label) {
    return el("button", { type: "button", class: "bx-iconbtn", onclick: onclick, "data-testid": testid, "aria-label": label || name }, ic(name));
  }
  function btn(text, cls, onclick, testid) {
    return el("button", { type: "button", class: "bx-btn " + (cls || ""), onclick: onclick, "data-testid": testid, text: text });
  }
  function cartIconBtn() {
    var n = cartCount();
    var b = iconBtn("cart", function () { nav("cart"); }, "customer-open-cart", t("Basket"));
    if (n) { b.appendChild(el("span", { class: "bx-badge", text: n })); }
    return b;
  }
  function header(title, opts) {
    opts = opts || {};
    var kids = [];
    if (opts.back !== false) { kids.push(iconBtn("back", opts.onBack || back, "customer-back", t("Back"))); }
    kids.push(el("div", { class: "bx-hd-title", text: title }));
    kids.push(el("div", { class: "bx-grow" }));
    if (opts.right) { kids.push(opts.right); }
    return el("div", { class: "bx-hd" }, kids);
  }
  function section(title, right) {
    return el("div", { class: "bx-sec-hd" }, [el("h3", { text: title }), right || null]);
  }
  function toast(msg) {
    var n = el("div", { class: "bx-toast", role: "status", text: t(msg) });
    Array.prototype.slice.call(layer.querySelectorAll(".bx-toast")).forEach(function (x) { x.parentNode.removeChild(x); });
    layer.appendChild(n);
    setTimeout(function () { if (n.parentNode) { n.parentNode.removeChild(n); } }, 2400);
  }
  function sheet(build, opts) {
    opts = opts || {};
    var scrim = el("div", { class: "bx-scrim" });
    var box = el("div", { class: "bx-sheet", role: "dialog" });
    var wrap = el("div", { class: "bx-sheet-wrap" }, [scrim, box]);
    function close() { if (wrap.parentNode) { wrap.parentNode.removeChild(wrap); } if (opts.onClose) { opts.onClose(); } }
    if (!opts.modal) { scrim.addEventListener("click", close); }
    box.appendChild(build(close, box));
    layer.appendChild(wrap);
    return close;
  }
  function confirmBox(title, text, okLabel, onOk) {
    sheet(function (close) {
      return el("div", { class: "bx-pad" }, [
        el("h3", { class: "bx-sheet-title", text: title }),
        el("p", { class: "bx-muted", text: text }),
        el("div", { class: "bx-stack-8" }, [
          btn(okLabel, "bx-btn-primary bx-btn-block", function () { close(); onOk(); }, "customer-confirm-ok"),
          btn(t("Cancel"), "bx-btn-ghost bx-btn-block", close, "customer-confirm-cancel")
        ])
      ]);
    });
  }
  function spinner() { return el("span", { class: "bx-spin", "aria-hidden": "true" }); }

  var TAB_SCREENS = { home: "home", search: "search", orders: "orders", account: "account" };
  function cleanup() {
    S.cleanups.forEach(function (fn) { try { fn(); } catch (e) {   } });
    S.cleanups = [];
    S.onCart = null;
  }
  function nav(name, params) { S.stack.push({ name: name, params: params || {} }); render(); }
  function back() {
    if (S.stack.length > 1) { S.stack.pop(); render(); } else { tab("home"); }
  }
  function tab(name) { S.stack = [{ name: name, params: {} }]; render(); }
  function replace(name, params) { S.stack[S.stack.length - 1] = { name: name, params: params || {} }; render(); }
  function resetTo(list) { S.stack = list; render(); }

  function render() {
    cleanup();
    Array.prototype.slice.call(layer.querySelectorAll(".bx-toast")).forEach(function (x) { x.parentNode.removeChild(x); });
    if (!S.account && S.stack[S.stack.length - 1].name !== "login") { S.stack = [{ name: "login", params: {} }]; }
    var top = S.stack[S.stack.length - 1];
    var fn = SCREENS[top.name] || SCREENS.home;
    view.innerHTML = "";
    view.appendChild(fn(top.params || {}));
    view.firstChild.classList.add("bx-screen");
    var tabName = TAB_SCREENS[top.name];
    drawTabbar(tabName);
    app.setAttribute("data-screen", top.name);
  }

  function drawTabbar(active) {
    tabbar.innerHTML = "";
    if (!active || !S.account) { tabbar.classList.add("is-hidden"); return; }
    tabbar.classList.remove("is-hidden");
    [["home", "Home", "home"], ["search", "Search", "search"], ["orders", "Orders", "orders"], ["account", "Account", "user"]].forEach(function (x) {
      var b = el("button", {
        type: "button", class: "bx-tab" + (active === x[0] ? " is-active" : ""),
        "data-testid": "customer-tab-" + x[0], onclick: function () { tab(x[0]); }
      }, [ic(x[2]), el("span", { text: t(x[1]) })]);
      tabbar.appendChild(b);
    });
  }

  function tile(kind) { return el("div", { class: "bx-tile" }, ic(kind || "bowl")); }
  function ratingChip(r) {
    if (r.rating === null) { return null; }
    return el("span", { class: "bx-rating" }, [ic("star", "bx-ic-xs"), String(r.rating.toFixed ? r.rating.toFixed(1) : r.rating)]);
  }

  var FOOD_COLOURS = [["#C2410C", "#F59E0B", "#7C2D12"], ["#B45309", "#FCD34D", "#78350F"], ["#9A3412", "#FDBA74", "#431407"], ["#A16207", "#FDE68A", "#713F12"], ["#B91C1C", "#FCA5A5", "#7F1D1D"]];
  function photoTile(r, item) {
    var h = hash("img|" + r.id + "|" + item.name);
    var c = FOOD_COLOURS[h % FOOD_COLOURS.length];
    var name = item.name.toLowerCase();
    var food;
    if (/burger|hot dog|sandwich|wrap|roll/.test(name)) {
      food = '<ellipse cx="42" cy="32" rx="22" ry="10" fill="' + c[1] + '"/><rect x="20" y="36" width="44" height="6" rx="3" fill="#4D7C0F"/><rect x="20" y="42" width="44" height="8" rx="4" fill="' + c[2] + '"/><ellipse cx="42" cy="54" rx="22" ry="7" fill="' + c[1] + '"/>';
    } else if (/pizza|calzone|lasagna/.test(name)) {
      food = '<circle cx="42" cy="42" r="26" fill="' + c[1] + '"/><circle cx="42" cy="42" r="21" fill="' + c[0] + '"/><circle cx="34" cy="36" r="4" fill="' + c[2] + '"/><circle cx="48" cy="40" r="4" fill="' + c[2] + '"/><circle cx="40" cy="50" r="4" fill="' + c[2] + '"/><circle cx="52" cy="52" r="3" fill="#4D7C0F"/>';
    } else if (/biryani|tehari|polao|rice|khichuri|kacchi/.test(name)) {
      food = '<ellipse cx="42" cy="50" rx="28" ry="12" fill="' + c[1] + '"/><path d="M18 50c2-18 14-26 24-26s22 8 24 26z" fill="' + c[0] + '"/><circle cx="36" cy="38" r="3" fill="' + c[1] + '"/><circle cx="48" cy="42" r="3" fill="' + c[1] + '"/><circle cx="42" cy="32" r="3" fill="' + c[2] + '"/>';
    } else if (/soup|curry|bhuna|rezala|kosha|dal|payesh|firni|kheer/.test(name)) {
      food = '<circle cx="42" cy="42" r="27" fill="' + c[2] + '"/><circle cx="42" cy="42" r="22" fill="' + c[0] + '"/><circle cx="36" cy="38" r="5" fill="' + c[1] + '"/><circle cx="50" cy="46" r="5" fill="' + c[1] + '"/>';
    } else {
      food = '<circle cx="42" cy="42" r="27" fill="' + c[1] + '"/><circle cx="34" cy="38" r="9" fill="' + c[0] + '"/><circle cx="50" cy="40" r="10" fill="' + c[2] + '"/><circle cx="42" cy="52" r="8" fill="' + c[0] + '"/><circle cx="52" cy="30" r="4" fill="#4D7C0F"/>';
    }
    var d = el("div", { class: "bx-photo", "data-photo": "1" });
    d.innerHTML = '<svg viewBox="0 0 84 84" aria-hidden="true"><rect width="84" height="84" fill="#E7D3B5"/><circle cx="42" cy="42" r="36" fill="#FFFFFF"/><circle cx="42" cy="42" r="31" fill="#F3EDE3"/>' + food + '</svg>';
    return d;
  }
  function restaurantCard(r, compact) {

    var kids = [
      tile("bowl"),
      el("div", { class: "bx-rc-body" }, [
        el("div", { class: "bx-rc-name", text: r.name }),
        el("div", { class: "bx-rc-meta" }, [ratingChip(r), el("span", { text: [r.cuisine, r.area].filter(Boolean).join(" · ") })]),
        r.open ? null : el("div", { class: "bx-closed", text: t("Closed now") })
      ])
    ];
    return el("button", {
      type: "button", class: "bx-rc" + (compact ? " is-compact" : ""),
      "data-testid": "customer-restaurant-card", "data-restaurant": r.name,
      onclick: function () { nav("restaurant", { id: r.id }); }
    }, kids);
  }

  var SCREENS = {};

  SCREENS.login = function (p) {
    var step = p.step || "phone";
    var root = el("div", { class: "bx-login" });
    root.appendChild(el("div", { class: "bx-login-top" }, [
      el("span", { class: "bx-wordmark" }, [ic("bowl", "bx-ic-lg"), el("span", { text: "Food Delivery" })])
    ]));
    if (step === "phone") {
      var input = el("input", {
        class: "bx-input", type: "tel", inputmode: "numeric", maxlength: "13", placeholder: "01XXXXXXXXX",
        "data-testid": "customer-phone-input", "aria-label": t("Phone number"), autocomplete: "off"
      });
      var go = btn(t("Continue"), "bx-btn-primary bx-btn-block bx-btn-lg", function () {
        var d = digits(input.value);

        if (/^8801\d{9}$/.test(d)) d = d.slice(2);
        if (/^1\d{9}$/.test(d)) d = "0" + d;
        if (!/^01\d{9}$/.test(d)) { err.textContent = t("Enter a valid 11 digit mobile number."); return; }
        replace("login", { step: "otp", phone: d });
      }, "customer-continue");
      var err = el("div", { class: "bx-error", "data-testid": "customer-phone-error" });
      input.addEventListener("input", function () { input.value = input.value.replace(/\D/g, ""); err.textContent = ""; });
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { go.click(); } });

      var osSeg = el("div", { class: "bx-seg", role: "radiogroup", "aria-label": "Phone" }, [
        el("button", { type: "button", class: S.phoneOs === "android" ? "is-on" : "", "data-testid": "customer-os-android", role: "radio", "aria-checked": S.phoneOs === "android" ? "true" : "false", text: "Android",
          onclick: function () { S.phoneOs = "android"; D.write("customer_phone_os", "android"); replace("login", { step: "phone" }); } }),
        el("button", { type: "button", class: S.phoneOs === "ios" ? "is-on" : "", "data-testid": "customer-os-ios", role: "radio", "aria-checked": S.phoneOs === "ios" ? "true" : "false", text: "iPhone",
          onclick: function () { S.phoneOs = "ios"; D.write("customer_phone_os", "ios"); replace("login", { step: "phone" }); } })
      ]);
      root.appendChild(el("div", { class: "bx-login-body" }, [
        el("h1", { text: t("Enter your phone number") }),
        el("p", { class: "bx-muted", text: t("We will send you a code by SMS to log in or sign up.") }),
        el("div", { class: "bx-phone-row" }, [el("span", { class: "bx-prefix", text: "+880" }), input]),
        err,
        go,
        el("p", { class: "bx-fine", text: t("By continuing you agree to the Terms of Use and Privacy Policy.") })

      ]));
    } else if (step === "signup") {
      root.appendChild(signupForm(p.phone));
    } else {
      var phone = p.phone;
      var boxes = [];
      var row = el("div", { class: "bx-otp-row" });
      for (var i = 0; i < 6; i++) { (function (idx) {
        var b = el("input", { class: "bx-otp", type: "tel", inputmode: "numeric", maxlength: "6", "aria-label": "Digit " + (idx + 1), "data-testid": "customer-otp-" + (idx + 1) });
        b.addEventListener("input", function () {
          var v = b.value.replace(/\D/g, "");
          if (v.length > 1) {
            for (var k = 0; k < v.length && idx + k < 6; k++) { boxes[idx + k].value = v.charAt(k); }
            boxes[Math.min(5, idx + v.length - 1)].focus();
          } else { b.value = v; if (v && idx < 5) { boxes[idx + 1].focus(); } }
          verifyBtn.disabled = code().length < 6;
          errO.textContent = "";
        });
        b.addEventListener("keydown", function (e) { if (e.key === "Backspace" && !b.value && idx > 0) { boxes[idx - 1].focus(); } });
        boxes.push(b); row.appendChild(b);
      })(i); }
      var code = function () { return boxes.map(function (b) { return b.value; }).join(""); };
      var errO = el("div", { class: "bx-error", "data-testid": "customer-otp-error" });
      var verifyBtn = btn(t("Verify"), "bx-btn-primary bx-btn-block bx-btn-lg", function () {
        if (code().length < 6) { errO.textContent = t("Enter the 6 digit code."); return; }
        signIn(phone);
      }, "customer-verify");
      verifyBtn.disabled = true;
      var secs = 60;
      var resend = el("button", { type: "button", class: "bx-link", disabled: true, "data-testid": "customer-resend", text: t("Resend in {s}s", { s: secs }) });
      var timer = setInterval(function () {
        secs -= 1;
        if (secs <= 0) {
          clearInterval(timer); resend.disabled = false; resend.textContent = t("Resend code");
        } else { resend.textContent = t("Resend in {s}s", { s: secs }); }
      }, 1000);
      S.cleanups.push(function () { clearInterval(timer); });
      resend.addEventListener("click", function () {
        secs = 60; resend.disabled = true; resend.textContent = t("Resend in {s}s", { s: secs });
        timer = setInterval(function () {
          secs -= 1;
          if (secs <= 0) { clearInterval(timer); resend.disabled = false; resend.textContent = t("Resend code"); }
          else { resend.textContent = t("Resend in {s}s", { s: secs }); }
        }, 1000);
        S.cleanups.push(function () { clearInterval(timer); });
        toast("Code sent again");
      });
      root.appendChild(el("div", { class: "bx-login-body" }, [
        el("h1", { text: t("Enter the code") }),
        el("p", { class: "bx-muted", text: t("We sent a 6 digit code to {phone}.", { phone: phone.slice(0, 5) + " " + phone.slice(5) }) }),
        row, errO, verifyBtn,
        el("div", { class: "bx-center" }, resend),
        el("div", { class: "bx-center" }, el("button", { type: "button", class: "bx-link", "data-testid": "customer-change-number", onclick: function () { replace("login", { step: "phone" }); }, text: t("Change number") })),
        el("p", { class: "bx-fine", text: t("Prototype: type any 6 digits.") })
      ]));
      setTimeout(function () { boxes[0].focus(); }, 30);
    }
    return root;
  };

  function signupForm(phone) {
    var ios = S.phoneOs === "ios";
    var F = {};
    function field(key, label, attrs, optional) {
      var inp = attrs.tag === "select"
        ? el("select", { class: "bx-input", "data-testid": "customer-su-" + key, "aria-label": label }, attrs.options.map(function (o) { return el("option", { value: o[0], text: o[1] }); }))
        : el("input", { class: "bx-input", type: attrs.type || "text", placeholder: attrs.ph || "", autocomplete: "off", "data-testid": "customer-su-" + key, "aria-label": label });
      var er = el("div", { class: "bx-error bx-su-err", "data-testid": "customer-su-" + key + "-error" });
      inp.addEventListener("input", function () { er.textContent = ""; });
      F[key] = { inp: inp, er: er };
      return el("div", { class: "bx-field bx-su-field" }, [el("label", { text: label + (optional ? " (" + t("optional") + ")" : "") }), inp, er]);
    }
    var kids = [
      field("name", t("Full name"), { ph: t("Your name") }),
      field("email", t("Email"), { type: "email", ph: "name@example.com" }, ios)
    ];
    if (!ios) {
      kids.push(field("gender", t("Gender"), { tag: "select", options: [["", t("Select")], ["female", t("Female")], ["male", t("Male")], ["other", t("Other")]] }, true));
      kids.push(field("dob", t("Date of birth"), { ph: "DD/MM/YYYY" }));
      kids.push(field("password", t("Password"), { type: "password", ph: t("At least 8 characters") }));
      kids.push(field("confirm", t("Confirm password"), { type: "password", ph: t("Type the password again") }));
    }
    kids.push(field("referral", t("Referral code"), { ph: "" }, true));
    function bad(key, msg) { F[key].er.textContent = msg; return false; }
    var submit = btn(t("Create account"), "bx-btn-primary bx-btn-block bx-btn-lg", function () {
      var ok = true;
      Object.keys(F).forEach(function (k) { F[k].er.textContent = ""; });
      var name = F.name.inp.value.trim();
      if (!name) { ok = bad("name", t("Enter your name.")); }
      var email = F.email.inp.value.trim();
      if (!ios && !email) { ok = bad("email", t("Enter your email address.")); }
      else if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { ok = bad("email", t("Enter a valid email address.")); }
      if (!ios) {
        var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(F.dob.inp.value.trim());
        var okDob = !!m && +m[1] >= 1 && +m[1] <= 31 && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1930 && +m[3] <= 2020;
        if (!okDob) { ok = bad("dob", t("Enter your date of birth as DD/MM/YYYY.")); }
        var pw = F.password.inp.value;
        if (pw.length < 8) { ok = bad("password", t("Password must be at least 8 characters.")); }
        if (F.confirm.inp.value !== pw || !F.confirm.inp.value) { ok = bad("confirm", t("Passwords do not match.")); }
      }
      if (!ok) { return; }
      startSession(phone, { name: name });
    }, "customer-su-submit");
    return el("div", { class: "bx-login-body", "data-testid": "customer-signup" }, [
      el("h1", { text: t("Create your account") }),
      el("p", { class: "bx-muted", text: t("Tell us a little about you.") }),
      el("div", { class: "bx-stack-12" }, kids),
      submit
    ]);
  }

  function signIn(phone) {
    var known = S.knownPhones.indexOf(phone) !== -1;
    if (!known && phone !== STAFF_PHONE && phone !== CANCELLED_PHONE) { replace("login", { step: "signup", phone: phone }); return; }
    startSession(phone, null);
  }
  function startSession(phone, profile) {
    var known = S.knownPhones.indexOf(phone) !== -1;
    var staff = phone === STAFF_PHONE;
    var cancelled = phone === CANCELLED_PHONE;
    var fresh = !known && !staff && !cancelled;
    S.account = {
      phone: phone, isNew: fresh || cancelled, cancelledOnly: cancelled, staff: staff, locDenied: false,
      name: profile ? profile.name : (staff ? "Staff tester" : (cancelled ? "Customer" : (known ? (S.personaName || "Customer") : "Customer")))
    };
    D.write("customer_account", S.account, true);
    D.write("customer_cart", { restaurant_id: null, lines: [] });
    S.promo = ""; S.payMethod = "cash"; S.bkashTries = 0; S.cartNotice = "";
    seedAddresses();
    S.stack = [{ name: "home", params: {} }];
    render();

    if (fresh) { showLocationPrompt(function () {}); }
  }

  function showLocationPrompt(done) {
    var ios = S.phoneOs === "ios";
    var wrap;
    function finish() { if (wrap.parentNode) { wrap.parentNode.removeChild(wrap); } done(); }
    function allow() {
      saveAddresses([{ id: 1, label: "Current location", area: "Dhanmondi", text: "Road 9/A, near your pin", note: "", pin: true, default: true }]);
      S.account.locDenied = false;
      D.write("customer_account", S.account, true);
      render(); finish();
    }
    function deny() {
      S.account.locDenied = true;
      D.write("customer_account", S.account, true);
      render(); finish();
    }
    var title = ios ? "Allow “Food Delivery” to use your location?" : "Allow Food Delivery to access this device’s location?";
    var body = ios ? "Your location is used to show restaurants near you." : "";
    var labels = ios ? ["Allow While Using App", "Allow Once", "Don’t Allow"] : ["While using the app", "Only this time", "Don’t allow"];
    var dlg = el("div", { class: "bx-sysdlg " + (ios ? "is-ios" : "is-android"), role: "alertdialog", "data-testid": "customer-location-prompt" }, [
      ios ? null : el("div", { class: "bx-sysdlg-ic" }, ic("pin", "bx-ic-lg")),
      el("div", { class: "bx-sysdlg-t", text: title }),
      body ? el("div", { class: "bx-sysdlg-b", text: body }) : null,
      el("div", { class: "bx-sysdlg-btns" }, [
        el("button", { type: "button", "data-testid": "customer-location-allow", text: labels[0], onclick: allow }),
        el("button", { type: "button", "data-testid": "customer-location-once", text: labels[1], onclick: allow }),
        el("button", { type: "button", "data-testid": "customer-location-deny", text: labels[2], onclick: deny })
      ])
    ]);
    wrap = el("div", { class: "bx-sys-wrap" }, [el("div", { class: "bx-sys-scrim" }), dlg]);
    layer.appendChild(wrap);
  }

  function popupList() {
    var r = S.restaurants.filter(function (x) { return x.live; })[0] || { id: null, name: "a restaurant near you" };
    return [
      { title: "Free delivery on orders above Tk 500", text: "Use code FREEDEL500. It is applied for you at checkout.", cta: "Order now", icon: "bike", go: function () { tab("home"); } },
      { title: "Weekend special at {name}", vars: { name: r.name }, text: "Try the most ordered dish this weekend.", cta: "See menu", icon: "store", go: function () { if (r.id !== null) { nav("restaurant", { id: r.id }); } } },
      { title: "Pay with bKash or Nagad", text: "Pay online when you check out, no change needed at the door.", cta: "Got it", icon: "wallet", go: function () {} },
      { title: "Help us improve the app", text: "Tell us what you think in a one minute survey.", cta: "Take the survey", icon: "chat", go: function () { toast("The survey is not open yet. Thank you."); } }
    ];
  }
  function showPopups() {
    var list = popupList();
    function showAt(i) {
      if (i >= list.length || !S.account) { return; }
      var pop = list[i];
      var wrap = el("div", { class: "bx-popup", "data-testid": "customer-popup" }, [
        el("button", { type: "button", class: "bx-popup-x", "data-testid": "customer-popup-close", "aria-label": "Close", onclick: function () { done(false); } }, ic("x")),
        el("div", { class: "bx-popup-art" }, ic(pop.icon, "bx-ic-xl")),
        el("div", { class: "bx-popup-body" }, [
          el("h2", { text: t(pop.title, pop.vars) }),
          el("p", { text: t(pop.text) }),
          btn(t(pop.cta), "bx-btn-primary bx-btn-block bx-btn-lg", function () { done(true); }, "customer-popup-cta")
        ])
      ]);
      function done(acted) {
        if (wrap.parentNode) { wrap.parentNode.removeChild(wrap); }
        if (acted) { pop.go(); }
        setTimeout(function () { showAt(i + 1); }, 150);
      }
      layer.appendChild(wrap);
    }
    showAt(0);
  }

  SCREENS.home = function () {
    var acc = S.account;
    var addr = currentAddress();
    var root = el("div", { class: "bx-col" });

    if (!addr && acc.locDenied) {
      root.appendChild(el("div", { class: "bx-hd bx-hd-home" }, [
        el("span", { class: "bx-wordmark" }, [ic("bowl", "bx-ic-lg"), el("span", { text: "Food Delivery" })]),
        el("div", { class: "bx-grow" }),
        cartIconBtn()
      ]));
      root.appendChild(el("div", { class: "bx-body", "data-testid": "customer-home-empty" }, [
        el("div", { class: "bx-pad" }, el("button", { type: "button", class: "bx-link bx-link-sm", "data-testid": "customer-set-location", onclick: function () { nav("addresses", { pick: false }); }, text: t("Set location") }))
      ]));
      return root;
    }
    root.appendChild(el("div", { class: "bx-hd bx-hd-home" }, [
      el("button", { type: "button", class: "bx-addr", "data-testid": "customer-address-picker", onclick: function () { nav("addresses", { pick: false }); } }, [
        ic("pin", "bx-ic-sm"),
        el("span", { class: "bx-addr-text" }, [
          el("span", { class: "bx-addr-l", text: t("Deliver to") }),
          el("span", { class: "bx-addr-v" }, [addr ? t(addr.label) + ", " + addr.area : t("Add your address"), ic("chevD", "bx-ic-xs")])
        ])
      ]),
      el("div", { class: "bx-grow" }),
      cartIconBtn()
    ]));
    var body = el("div", { class: "bx-body" });
    root.appendChild(body);

    body.appendChild(el("button", { type: "button", class: "bx-searchbar", "data-testid": "customer-home-search", onclick: function () { tab("search"); } }, [ic("search"), el("span", { text: t("Search restaurants and dishes") })]));

    var act = activeOrder();
    if (act) {
      body.appendChild(el("button", { type: "button", class: "bx-active", "data-testid": "customer-active-order", onclick: function () { nav("status", { id: act.id }); } }, [
        el("div", {}, [el("div", { class: "bx-active-t", text: phaseTitle(act.phase) }), el("div", { class: "bx-muted", text: act.restaurant_name })]),
        el("span", { class: "bx-link-text", text: t("Track order") })
      ]));
    }

    var listBox = el("div", { class: "bx-list" });
    var showN = 20;
    function paintList() {
      listBox.innerHTML = "";
      var rows = S.restaurants.filter(function (r) { return r.live && distanceKm(r, addr) <= MAX_HOME_KM; });
      rows.slice(0, showN).forEach(function (r) { listBox.appendChild(restaurantCard(r)); });
      if (rows.length > showN) {
        listBox.appendChild(btn(t("Show more restaurants"), "bx-btn-block", function () { showN += 20; paintList(); }, "customer-show-more"));
      }
      if (!rows.length) { listBox.appendChild(el("p", { class: "bx-muted bx-pad", text: t("No restaurants here yet.") })); }
    }

    var banners = [
      { t: "Free delivery above Tk 500", s: "Code FREEDEL500. Applied at checkout." },
      { t: "Order from the best rated", s: "Restaurants people near you love." }
    ];
    if (acc.isNew) { banners.unshift({ t: "Free delivery on your first order", s: "Code FIRSTFREE. Applied for you." }); }
    body.appendChild(el("div", { class: "bx-banners" }, banners.map(function (b) {
      return el("div", { class: "bx-banner", "data-testid": "customer-banner" }, [el("div", { class: "bx-banner-t", text: t(b.t) }), el("div", { class: "bx-muted", text: t(b.s) })]);
    })));

    if (acc.isNew) {
      var pop = S.restaurants.filter(function (r) { return r.live; }).slice().sort(function (a, b) {
        return (b.orders - a.orders) || ((b.rating || 0) - (a.rating || 0));
      }).slice(0, 10);
      body.appendChild(section(t("Popular near you")));
      body.appendChild(el("div", { class: "bx-hscroll", "data-testid": "customer-popular" }, pop.map(function (r) { return restaurantCard(r, true); })));
    }

    var past = ordersForAccount().filter(function (o) { return o.phase === 3; }).slice(0, 6);
    if (past.length) {
      body.appendChild(section(t("Order again")));
      body.appendChild(el("div", { class: "bx-hscroll", "data-testid": "customer-order-again-row" }, past.map(function (o) {
        return el("div", { class: "bx-again" }, [
          el("div", { class: "bx-rc-name", text: o.restaurant_name }),
          el("div", { class: "bx-muted bx-clamp", text: o.items.map(function (i) { return i.qty + " x " + i.name; }).join(", ") }),
          btn(t("Order again"), "bx-btn-sm", function () { orderAgain(o); }, "customer-order-again")
        ]);
      })));
    }

    body.appendChild(section(t("Restaurants near you")));
    body.appendChild(listBox);
    paintList();
    body.appendChild(el("div", { class: "bx-spacer" }));
    S.onCart = function () {   };
    return root;
  };

  function orderPill(o) {
    var map = { "-1": ["cancelled", "Cancelled"], "0": ["placed", "Placed"], "1": ["accepted", "Accepted"], "2": ["transit", "Rider assigned"], "3": ["delivered", "Delivered"] };
    var m = map[String(o.phase)] || map["0"];
    return el("span", { class: "fd-pill", "data-status": m[0], text: t(m[1]) });
  }
  function phaseTitle(phase) {
    return [t("Waiting for restaurant"), t("Preparing your order"), t("Rider on the way"), t("Delivered")][phase] || t("Order cancelled");
  }

  SCREENS.search = function () {
    var root = el("div", { class: "bx-col" });
    var input = el("input", { class: "bx-input bx-input-search", type: "search", enterkeyhint: "search", placeholder: t("Search restaurants and dishes"), "data-testid": "customer-search-input", "aria-label": t("Search"), value: S.q || "" });
    var results = el("div", { class: "bx-body" });
    var clear = iconBtn("x", function () { input.value = ""; S.q = ""; run(); input.focus(); }, "customer-search-clear", t("Clear"));
    var go = iconBtn("search", function () { run(); }, "customer-search-go", t("Search"));
    root.appendChild(el("div", { class: "bx-hd" }, [el("div", { class: "bx-searchfield" }, [go, input, clear])]));
    root.appendChild(results);

    function run() {
      var q = input.value.trim();
      S.q = q;
      results.innerHTML = "";
      if (!q) { return; }
      var rs = [], ds = [];

      if (!hasBangla(q)) {
        var low = q.toLowerCase();
        S.restaurants.forEach(function (r) {
          if (!r.live) { return; }
          if (r.name.toLowerCase() === low) { rs.push(r); }
          menuFor(r).forEach(function (m) {
            if (m.name.toLowerCase() === low) { ds.push({ r: r, m: m }); }
          });
        });
      }
      if (!rs.length && !ds.length) {
        results.appendChild(el("div", { class: "bx-empty", "data-testid": "customer-no-results" }, [
          ic("search", "bx-ic-xl"), el("h3", { text: t("No results found") })
        ]));
        return;
      }
      if (rs.length) {
        results.appendChild(section(t("Restaurants")));
        rs.slice(0, 20).forEach(function (r) { results.appendChild(restaurantCard(r)); });
      }
      if (ds.length) {
        results.appendChild(section(t("Dishes")));
        ds.slice(0, 20).forEach(function (x) {
          results.appendChild(el("button", { type: "button", class: "bx-dish", "data-testid": "customer-dish-result", onclick: function () { nav("restaurant", { id: x.r.id }); } }, [
            el("div", { class: "bx-grow bx-left" }, [el("div", { class: "bx-rc-name", text: x.m.name }), el("div", { class: "bx-muted", text: x.r.name })]),
            el("span", { class: "bx-money", text: money(x.m.price) })
          ]));
        });
      }
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { run(); } });
    run();
    setTimeout(function () { input.focus(); }, 30);
    return root;
  };

  SCREENS.restaurant = function (p) {
    var r = S.byId[p.id];
    var root = el("div", { class: "bx-col bx-rel" });
    if (!r) { root.appendChild(header(t("Restaurant"))); root.appendChild(el("p", { class: "bx-pad bx-muted", text: t("This restaurant is not available.") })); return root; }
    var items = menuFor(r);

    var body = el("div", { class: "bx-body" });
    var hero = el("div", { class: "bx-hero" }, [
      tile("bowl"),
      el("div", { class: "bx-hero-top" }, [
        iconBtn("back", back, "customer-back", t("Back")),
        el("div", { class: "bx-grow" }),
        iconBtn("share", function () { openShare(r); }, "customer-share", t("Share"))
      ])
    ]);
    body.appendChild(hero);
    body.appendChild(el("div", { class: "bx-pad bx-rest-head" }, [
      el("h1", { text: r.name, "data-testid": "customer-restaurant-name" }),
      el("div", { class: "bx-rc-meta" }, [ratingChip(r), el("span", { text: [r.cuisine, r.area].filter(Boolean).join(" · ") })]),
      r.open ? null : el("div", { class: "bx-closed-bar", text: t("This restaurant is closed right now.") })
    ]));
    var box = el("div", { class: "bx-cat bx-menu-list", "data-testid": "customer-menu-list" });
    items.forEach(function (m) {
      box.appendChild(el("div", { class: "bx-menu-item", "data-testid": "customer-menu-item", "data-item": m.name, "data-photo": hasPhoto(r, m) ? "1" : "0" }, [
        el("div", { class: "bx-grow bx-left" }, [
          el("div", { class: "bx-rc-name", text: m.name }),
          el("div", { class: "bx-money", text: money(m.price) })
        ]),
        el("div", { class: "bx-item-img" }, [hasPhoto(r, m) ? photoTile(r, m) : tile("bowl"), el("button", {
          type: "button", class: "bx-plus", "data-testid": "customer-add-to-cart", "aria-label": t("Add {name}", { name: m.name }),
          disabled: r.open ? null : "true", onclick: function () { openItem(r, m); }
        }, ic("plus"))])
      ]));
    });
    body.appendChild(box);
    body.appendChild(el("div", { class: "bx-spacer" }));
    root.appendChild(body);

    var bar = el("div", { class: "bx-cartbar-wrap" });
    root.appendChild(bar);
    function paintBar() {
      bar.innerHTML = "";
      var c = cart();
      if (!c.lines.length) { return; }
      bar.appendChild(el("button", { type: "button", class: "bx-cartbar", "data-testid": "customer-view-basket", onclick: function () { nav("cart"); } }, [
        el("span", { class: "bx-cartbar-n", text: cartCount() }),
        el("span", { class: "bx-grow bx-left", text: t("View basket") }),
        el("span", { class: "bx-money", text: money(cartSubtotal()) })
      ]));
    }
    paintBar();
    S.onCart = paintBar;
    return root;
  };

  function openShare(r) {
    sheet(function (close) {
      return el("div", { class: "bx-pad" }, [
        el("h3", { class: "bx-sheet-title", text: t("Share this restaurant") }),
        el("p", { class: "bx-muted", text: t("Friends who open the link land on {name} in the app.", { name: r.name }) }),
        el("div", { class: "bx-stack-8" }, [
          btn(t("Share on Facebook"), "bx-btn-block", function () { close(); toast("Facebook share is ready"); }, "customer-share-facebook"),
          btn(t("Copy link"), "bx-btn-block", function () { close(); toast("Link copied"); }, "customer-share-copy"),
          btn(t("Close"), "bx-btn-ghost bx-btn-block", close, "customer-share-close")
        ])
      ]);
    });
  }

  function optMoney(p) { return p > 0 ? "+" + money(p) : (p < 0 ? "- " + money(-p) : ""); }
  function openItem(r, item) {
    var groups = optionsFor(item);
    var sel = {};
    var qty = 1;
    sheet(function (close, box) {
      box.classList.add("bx-sheet-item");
      var scroller = el("div", { class: "bx-sheet-scroll bx-pad", "data-testid": "customer-item-scroll" });
      var footer = el("div", { class: "bx-sheet-foot" });
      function unit() {
        var pr = item.price;
        groups.forEach(function (g) { (sel[g.id] || []).forEach(function (i) { pr += g.choices[i].price; }); });
        return pr;
      }
      function valid() { return groups.every(function (g) { return !g.required || (sel[g.id] || []).length > 0; }); }
      function draw() {
        var keep = scroller.scrollTop;
        scroller.innerHTML = ""; footer.innerHTML = "";
        scroller.appendChild(el("div", { class: "bx-item-head" }, [
          el("div", { class: "bx-grow bx-left" }, [el("h3", { class: "bx-sheet-title", text: item.name }), el("div", { class: "bx-muted", text: r.name })]),
          iconBtn("x", close, "customer-sheet-close", t("Close"))
        ]));
        scroller.appendChild(el("div", { class: "bx-money bx-item-price", text: money(item.price) }));
        function optGroup(g) {
          var picked = sel[g.id] || [];
          scroller.appendChild(el("div", { class: "bx-opt-hd", "data-group": g.id }, [
            el("span", { class: "bx-rc-name", text: t(g.title) }),
            el("span", { class: "bx-chip-tag", text: g.required ? t("Required") : t("Optional") })
          ]));
          g.choices.forEach(function (c, i) {
            var on = picked.indexOf(i) !== -1;
            scroller.appendChild(el("button", {
              type: "button", class: "bx-opt" + (on ? " is-on" : ""), "data-testid": "customer-option", "data-group": g.id, role: g.multi ? "checkbox" : "radio", "aria-checked": on ? "true" : "false",
              onclick: function () {
                if (g.multi) { sel[g.id] = on ? picked.filter(function (x) { return x !== i; }) : picked.concat([i]); }
                else { sel[g.id] = [i]; }
                draw();
              }
            }, [
              el("span", { class: "bx-mark" + (g.multi ? " is-box" : ""), }, on ? ic("check", "bx-ic-xs") : null),
              el("span", { class: "bx-grow bx-left", text: t(c.label) }),
              el("span", { class: "bx-muted", text: optMoney(c.price) })
            ]));
          });
        }
        var optional = groups.filter(function (g) { return !g.required; });
        var required = groups.filter(function (g) { return g.required; });
        optional.forEach(optGroup);
        scroller.appendChild(el("div", { class: "bx-qtyrow" }, [
          el("span", { class: "bx-rc-name", text: t("Quantity") }),
          stepper(qty, function (n) { qty = n; draw(); })
        ]));
        required.forEach(optGroup);
        scroller.scrollTop = keep;
        var add = btn(t("Add to basket") + " · " + money(unit() * qty), "bx-btn-primary bx-btn-block bx-btn-lg", function () {
          if (!valid()) { return; }
          var opts = [];
          groups.forEach(function (g) { (sel[g.id] || []).forEach(function (i) { opts.push({ label: g.choices[i].label, price: g.choices[i].price }); }); });
          if (addToCart(r, item, opts, qty)) { close(); toast("Added to basket"); }
        }, "customer-confirm-add");
        footer.appendChild(add);
      }
      draw();
      return el("div", { class: "bx-sheet-in" }, [scroller, footer]);
    });
  }
  function stepper(n, onChange, min) {
    var lo = min === undefined ? 1 : min;
    return el("div", { class: "bx-stepper" }, [
      el("button", { type: "button", "aria-label": "Less", "data-testid": "customer-qty-minus", onclick: function () { onChange(Math.max(lo, n - 1)); } }, ic("minus")),
      el("span", { class: "bx-stepper-n", text: n }),
      el("button", { type: "button", "aria-label": "More", "data-testid": "customer-qty-plus", onclick: function () { onChange(n + 1); } }, ic("plus"))
    ]);
  }

  SCREENS.cart = function () {
    var c = cart();
    var r = cartRestaurant();
    var root = el("div", { class: "bx-col" });
    root.appendChild(header(t("Your basket")));
    var body = el("div", { class: "bx-body" });
    root.appendChild(body);
    var notice = S.cartNotice;
    S.cartNotice = "";
    if (!c.lines.length) {
      body.appendChild(el("div", { class: "bx-empty", "data-testid": "customer-cart-empty" }, [
        ic("cart", "bx-ic-xl"),
        notice ? el("div", { class: "bx-cart-notice", role: "alert", "data-testid": "customer-cart-notice", text: notice }) : null,
        el("h3", { text: t("Your basket is empty") }), el("p", { class: "bx-muted", text: t("Add something tasty from a restaurant.") }),
        btn(t("Find food"), "bx-btn-primary", function () { tab("home"); }, "customer-find-food")
      ]));
      return root;
    }
    var sub = cartSubtotal();
    var free = basketFree();
    var min = minOrderOf(r);
    var short = min > sub ? min - sub : 0;
    body.appendChild(el("div", { class: "bx-pad" }, [
      el("div", { class: "bx-cart-rest" }, [ic("store", "bx-ic-sm"), el("span", { class: "bx-rc-name", text: r ? r.name : "" })])
    ]));
    var lines = el("div", { class: "bx-pad bx-lines" });
    c.lines.forEach(function (l) {
      lines.appendChild(el("div", { class: "bx-line", "data-testid": "customer-cart-line" }, [
        el("div", { class: "bx-grow bx-left" }, [
          el("div", { class: "bx-rc-name", text: l.name }),
          l.opts.length ? el("div", { class: "bx-muted", text: l.opts.map(function (o) { return t(o.label); }).join(", ") }) : null,
          el("div", { class: "bx-muted", text: t("Quantity") + ": " + l.qty }),
          el("div", { class: "bx-money", text: money(lineUnit(l) * l.qty) })
        ]),
        iconBtn("trash", function () { removeLine(l.key); }, "customer-cart-remove", t("Delete"))
      ]));
    });
    body.appendChild(lines);
    body.appendChild(el("div", { class: "bx-pad" }, btn(t("Add more items"), "bx-btn-block", function () { if (r) { nav("restaurant", { id: r.id }); } }, "customer-add-more")));

    if (short > 0) {
      body.appendChild(el("div", { class: "bx-nudge", "data-testid": "customer-min-order" }, [
        ic("alert", "bx-ic-sm"), el("span", { text: t("Minimum order {min}. Add {n} more", { min: money(min), n: money(short) }) })
      ]));
    }
    if (!free) {
      body.appendChild(el("div", { class: "bx-nudge", "data-testid": "customer-free-delivery-nudge" }, [
        ic("bike", "bx-ic-sm"), el("span", { text: t("Add {n} more for free delivery", { n: money(FREE_DELIVERY_MIN - sub) }) })
      ]));
    }
    body.appendChild(el("div", { class: "bx-pad bx-bill" }, [
      billRow(t("Subtotal"), money(sub)),
      billRow(t("Delivery"), free ? t("Free delivery") : t("Calculated at checkout"))
    ]));
    body.appendChild(el("div", { class: "bx-spacer" }));
    var go = btn(t("Go to checkout"), "bx-btn-primary bx-btn-block bx-btn-lg", function () { if (!short) { nav("checkout", { step: "address" }); } }, "customer-go-checkout");
    go.disabled = short > 0;
    root.appendChild(el("div", { class: "bx-foot" }, go));
    return root;
  };
  function billRow(l, v, total) {
    return el("div", { class: "bx-bill-row" + (total ? " is-total" : "") }, [el("span", { text: l }), el("span", { class: "bx-money", text: v })]);
  }
  function removeLine(key) {
    var c = cart();
    c.lines = c.lines.filter(function (l) { return l.key !== key; });
    if (!c.lines.length) { c.restaurant_id = null; }
    saveCart(c);
    render();
  }

  function itemChanged(r, i, orderId) {
    var menu = menuFor(r);
    var m = menu.filter(function (x) { return (i.id !== null && i.id !== undefined && String(x.id) === String(i.id)) || x.name === i.name; })[0];
    if (!m) { return true; }
    if (i.assumed) { return mod("changed|" + orderId, 100) < 40; }
    var then = i.base !== null && i.base !== undefined ? i.base : i.price;
    return then !== m.price;
  }
  function orderAgain(o) {
    var r = S.byId[o.restaurant_id];
    if (!r) { toast("This restaurant is not available."); return; }
    var menu = menuFor(r);
    var c = { restaurant_id: r.id, lines: [] };
    var failed = false;
    o.items.forEach(function (i) {
      if (itemChanged(r, i, o.id)) { failed = true; return; }
      var m = menu.filter(function (x) { return (i.id !== null && i.id !== undefined && String(x.id) === String(i.id)) || x.name === i.name; })[0];
      var opts = (i.optList || []).map(function (x) { return { label: x.label, price: x.price }; });
      c.lines.push({ key: m.id + "|" + opts.map(function (x) { return x.label; }).join(",") + "|again", item_id: m.id, name: m.name, price: m.price, qty: i.qty, opts: opts });
    });
    if (failed) {
      saveCart({ restaurant_id: null, lines: [] });
      S.cartNotice = t("Some items are not available");
      nav("cart");
      return;
    }
    saveCart(c);
    nav("cart");
  }

  var CHECKOUT_TITLES = { address: "Delivery address", time: "Delivery time", payment: "Payment", review: "Review order" };
  SCREENS.checkout = function (p) {
    var step = p.step || "address";
    var c = cart();
    var r = cartRestaurant();
    var root = el("div", { class: "bx-col", "data-step": step });
    root.appendChild(header(t(CHECKOUT_TITLES[step] || "Checkout")));
    if (!c.lines.length) { root.appendChild(el("p", { class: "bx-pad bx-muted", text: t("Your basket is empty") })); return root; }
    var body = el("div", { class: "bx-body" });
    root.appendChild(body);
    var addr = currentAddress();
    var method = S.payMethod || "cash";
    var km = distanceKm(r, addr);
    var foot;

    function next(to) { nav("checkout", { step: to }); }
    function cont(label, to, disabled) {
      var b = btn(label, "bx-btn-primary bx-btn-block bx-btn-lg", function () { next(to); }, "customer-checkout-continue");
      b.disabled = !!disabled;
      return b;
    }

    if (step === "address") {
      var blocked = !!addr && km > MAX_DELIVER_KM;
      body.appendChild(el("div", { class: "bx-pad" }, [
        el("h3", { class: "bx-h3", text: t("Delivery address") }),
        el("div", { class: "bx-card bx-addrcard", "data-testid": "customer-checkout-address" }, [
          ic("pin"),
          el("div", { class: "bx-grow bx-left" }, addr
            ? [el("div", { class: "bx-rc-name", text: t(addr.label) }), el("div", { class: "bx-muted", text: addr.text + ", " + addr.area })]
            : [el("div", { class: "bx-rc-name", text: t("No address yet") }), el("div", { class: "bx-muted", text: t("Add where we should deliver") })]),
          el("button", { type: "button", class: "bx-link", "data-testid": "customer-change-address", onclick: function () { nav("addresses", { pick: true }); }, text: addr ? t("Change") : t("Add") })
        ]),
        blocked ? el("div", { class: "bx-pay-fail", role: "alert", "data-testid": "customer-not-deliverable", text: t("This restaurant does not deliver to your area") }) : null
      ]));
      foot = addr ? cont(t("Continue"), "time", blocked)
        : btn(t("Continue"), "bx-btn-primary bx-btn-block bx-btn-lg", function () { toast("Add a delivery address first"); nav("addresses", { pick: true }); }, "customer-checkout-continue");
    } else if (step === "time") {
      var note = el("input", { class: "bx-input", placeholder: t("Note for the rider (optional)"), "data-testid": "customer-rider-note", value: S.riderNote || "" });
      note.addEventListener("input", function () { S.riderNote = note.value; });
      body.appendChild(el("div", { class: "bx-pad" }, [
        el("h3", { class: "bx-h3", text: t("Delivery time") }),
        el("div", { class: "bx-card bx-paylist" }, el("div", { class: "bx-pay is-on", "data-testid": "customer-time-now", role: "radio", "aria-checked": "true" }, [
          ic("clock"), el("div", { class: "bx-grow bx-left" }, [el("div", { class: "bx-rc-name", text: t("Deliver now") }), el("div", { class: "bx-muted", text: t("Your order is prepared as soon as the restaurant accepts it") })]),
          el("span", { class: "bx-mark is-radio is-on" })
        ]))
      ]));
      body.appendChild(el("div", { class: "bx-pad" }, [el("h3", { class: "bx-h3", text: t("Delivery instructions") }), note]));
      foot = cont(t("Continue"), "payment");
    } else if (step === "payment") {
      var pay = el("div", { class: "bx-pad" }, [el("h3", { class: "bx-h3", text: t("Pay with") })]);
      var payList = el("div", { class: "bx-card bx-paylist" });
      [["cash", "Cash on delivery", "Pay when your food arrives", "cash"], ["bkash", "bKash", "Pay with your bKash account", "wallet"], ["nagad", "Nagad", "Pay with your Nagad account", "wallet"], ["card", "Card", "Visa or Mastercard", "card"]].forEach(function (m) {
        payList.appendChild(el("button", {
          type: "button", class: "bx-pay" + (method === m[0] ? " is-on" : ""), "data-testid": "customer-pay-" + m[0], role: "radio", "aria-checked": method === m[0] ? "true" : "false",
          onclick: function () { S.payMethod = m[0]; render(); }
        }, [ic(m[3]), el("div", { class: "bx-grow bx-left" }, [el("div", { class: "bx-rc-name", text: t(m[1]) }), el("div", { class: "bx-muted", text: t(m[2]) })]), el("span", { class: "bx-mark is-radio" + (method === m[0] ? " is-on" : "") })]));
      });
      pay.appendChild(payList);
      body.appendChild(pay);
      foot = cont(t("Continue"), "review");
    } else {
      var pr = pricing();
      body.appendChild(el("div", { class: "bx-pad" }, [
        el("h3", { class: "bx-h3", text: r ? r.name : "" }),
        orderPreview(c.lines)
      ]));
      body.appendChild(el("div", { class: "bx-pad" }, el("div", { class: "bx-card bx-pad bx-bill" }, [
        billRow(t("Deliver to"), addr ? t(addr.label) + ", " + addr.area : ""),
        billRow(t("Payment"), t(payLabel(method))),
        billRow(t("Estimated delivery"), etaMinutes(km) + " " + t("min"))
      ])));
      var codeIn = el("input", { class: "bx-input", placeholder: t("Promo code"), "data-testid": "customer-promo-input", value: S.promo || "", "aria-label": t("Promo code") });
      var msg = el("div", { class: pr.err ? "bx-error" : "bx-ok", "data-testid": "customer-promo-msg", text: pr.err || (S.promo && pr.code ? t("{code} applied", { code: pr.code }) : "") });
      body.appendChild(el("div", { class: "bx-pad" }, [
        el("h3", { class: "bx-h3", text: t("Promo code") }),
        el("div", { class: "bx-promo-row" }, [codeIn, btn(t("Apply"), "", function () { S.promo = codeIn.value.trim(); render(); }, "customer-promo-apply")]),
        msg
      ]));
      body.appendChild(el("div", { class: "bx-pad bx-bill" }, [
        el("h3", { class: "bx-h3", text: t("Order summary") }),
        billRow(t("Subtotal"), money(pr.subtotal)),
        pr.discount ? billRow(t("Discount"), "- " + money(pr.discount)) : null,
        feeRow(pr),
        billRow(t("Total"), money(pr.total), true)
      ]));
      foot = btn(t("Place order") + " · " + money(pr.total), "bx-btn-primary bx-btn-block bx-btn-lg", function () {
        if (!addr) { toast("Add a delivery address first"); nav("addresses", { pick: true }); return; }
        if (method === "cash") { placeOrder("cash", pr, addr, km); }
        else { openPay(method, pr, addr, km); }
      }, "customer-place-order");
    }
    body.appendChild(el("div", { class: "bx-spacer" }));
    root.appendChild(el("div", { class: "bx-foot" }, foot));
    return root;
  };

  function feeRow(pr) {
    if (pr.deliveryFee) { return billRow(t("Delivery fee"), money(pr.deliveryFee)); }
    return el("div", { class: "bx-bill-row" }, [
      el("span", { text: t("Delivery fee") }),
      el("span", { class: "bx-money" }, [el("s", { class: "bx-strike", text: money(baseFee()) }), " " + t("Free")])
    ]);
  }
  function orderPreview(lines) {
    var box = el("div", { class: "bx-card bx-pad bx-bill", "data-testid": "customer-review-lines" });
    lines.forEach(function (l) {
      box.appendChild(el("div", { class: "bx-bill-row" }, [
        el("span", { text: l.qty + " x " + l.name + (l.opts.length ? " (" + l.opts.map(function (o) { return o.label; }).join(", ") + ")" : "") }),
        el("span", { class: "bx-money", text: money(lineUnit(l) * l.qty) })
      ]));
    });
    return box;
  }

  function openPay(method, pr, addr, km) {
    var title = method === "bkash" ? "bKash" : (method === "nagad" ? "Nagad" : t("Card"));
    sheet(function (close) {
      var content = el("div", { class: "bx-pad" });
      var errBox = el("div", { class: "bx-pay-fail", role: "alert", "data-testid": "customer-pay-error" });
      errBox.hidden = true;
      var fields = [];
      var inputs = {};
      if (method === "card") {
        inputs.num = el("input", { class: "bx-input", inputmode: "numeric", placeholder: "Card number", maxlength: "19", "data-testid": "customer-card-number", "aria-label": t("Card number") });
        inputs.exp = el("input", { class: "bx-input", placeholder: "MM/YY", maxlength: "5", "data-testid": "customer-card-expiry", "aria-label": "MM/YY" });
        inputs.cvc = el("input", { class: "bx-input", inputmode: "numeric", placeholder: "CVC", maxlength: "4", "data-testid": "customer-card-cvc", "aria-label": "CVC" });
        fields = [inputs.num, el("div", { class: "bx-two" }, [inputs.exp, inputs.cvc])];
      } else {
        inputs.num = el("input", { class: "bx-input", inputmode: "numeric", maxlength: "11", placeholder: "01XXXXXXXXX", value: S.account.phone, "data-testid": "customer-wallet-number", "aria-label": t("Account number") });
        inputs.pin = el("input", { class: "bx-input", type: "password", inputmode: "numeric", maxlength: "5", placeholder: t("PIN"), "data-testid": "customer-wallet-pin", "aria-label": t("PIN") });
        fields = [inputs.num, inputs.pin];
      }
      var payBtn = btn(t("Pay {amount}", { amount: money(pr.total) }), "bx-btn-primary bx-btn-block bx-btn-lg", function () {
        errBox.hidden = true;
        var ok = method === "card"
          ? (digits(inputs.num.value).length >= 12 && /^\d\d\/\d\d$/.test(inputs.exp.value) && digits(inputs.cvc.value).length >= 3)
          : (/^01\d{9}$/.test(digits(inputs.num.value)) && digits(inputs.pin.value).length >= 4);
        if (!ok) { errBox.hidden = false; errBox.textContent = t("Check the details and try again."); return; }
        payBtn.disabled = true; payBtn.textContent = ""; payBtn.appendChild(spinner());
        setTimeout(function () {
          if (method === "bkash" && S.bkashTries === 0) {
            S.bkashTries += 1;
            payBtn.disabled = false; payBtn.textContent = t("Pay {amount}", { amount: money(pr.total) });
            errBox.hidden = false; errBox.textContent = t("Payment failed. Try again");
            return;
          }
          close();
          placeOrder(method, pr, addr, km);
        }, 1100);
      }, "customer-pay-confirm");
      content.appendChild(el("div", { class: "bx-item-head" }, [
        el("h3", { class: "bx-sheet-title", text: t("Pay with {m}", { m: title }) }),
        iconBtn("x", close, "customer-sheet-close", t("Close"))
      ]));
      content.appendChild(el("div", { class: "bx-pay-amt" }, [el("span", { class: "bx-muted", text: t("Amount") }), el("span", { class: "bx-money bx-pay-amt-v", text: money(pr.total) })]));
      fields.forEach(function (f) { content.appendChild(f); });
      content.appendChild(errBox);
      content.appendChild(payBtn);
      return content;
    }, { modal: true });
  }

  function placeOrder(method, pr, addr, km) {
    var c = cart();
    var r = S.byId[c.restaurant_id];

    var ov = el("div", { class: "bx-placing", "data-testid": "customer-placing" }, [
      spinner(), el("h2", { text: t("Placing your order") }), el("p", { class: "bx-muted", text: r ? r.name : "" })
    ]);
    layer.appendChild(ov);
    setTimeout(function () {
      var id = nextId();
      var created = {
        id: id, customer_id: S.meta.personas ? S.meta.personas.customer_id : 1, customer_phone: S.account.phone,
        restaurant_id: c.restaurant_id, rider_id: null, status: "placed",
        payment_method: method === "cash" ? "cod" : "prepaid", payment_label: method,
        delivery_fee: pr.deliveryFee, discount_amount: pr.discount, promo_code: pr.code, placed_at: nowIso(),
        address: { name: S.account.name, phone: S.account.phone, label: addr.label, text: addr.text + ", " + addr.area, area: addr.area, street: addr.text, city: "Dhaka", postcode: "" },
        rider_note: S.riderNote || "",
        drop_distance_km: km, phone_os: S.phoneOs, app_version: VERSION,
        items: c.lines.map(function (l) { return { menu_item_id: l.item_id, name: l.name, qty: l.qty, price: lineUnit(l), base_price: l.price, opt_list: l.opts, opts: l.opts.map(function (o) { return o.label; }).join(", ") }; }),
        timeline: [{ status: "placed", at: nowIso() }], deliveries: []
      };
      var list = D.read("orders_new", []);
      list.push(created);
      D.write("orders_new", list);
      D.write("customer_cart", { restaurant_id: null, lines: [] });
      S.promo = ""; S.bkashTries = 0; S.riderNote = "";
      if (ov.parentNode) { ov.parentNode.removeChild(ov); }
      resetTo([{ name: "home", params: {} }, { name: "status", params: { id: id } }]);
    }, 1700);
  }

  function mapSvg(opts) {
    opts = opts || {};
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 370 300");
    svg.setAttribute("class", "bx-map");
    svg.setAttribute("preserveAspectRatio", opts.fit ? "xMidYMid meet" : "xMidYMid slice");
    var blocks = "";
    for (var x = 0; x < 6; x++) { for (var y = 0; y < 5; y++) {
      blocks += '<rect x="' + (14 + x * 62) + '" y="' + (12 + y * 60) + '" width="48" height="46" rx="4" class="bx-map-block"/>';
    } }
    svg.innerHTML = '<rect width="370" height="300" class="bx-map-bg"/>' + blocks +
      (opts.plain ? "" : '<path d="M70 70 L70 190 L270 190 L270 70" class="bx-map-route"/>' +
      '<g transform="translate(70 70)"><circle r="14" class="bx-map-pin"/><path d="M-5 -2h10v6h-10z" class="bx-map-glyph"/></g>' +
      '<g transform="translate(270 70)"><circle r="14" class="bx-map-pin"/><path d="M-6 1 0 -5 6 1v6h-12z" class="bx-map-glyph"/></g>') +
      (opts.rider ? '<g transform="translate(' + opts.rider.x + ' ' + opts.rider.y + ')"><circle r="10" class="bx-map-rider"/><circle r="3" class="bx-map-rider-dot"/></g>' : "");
    return svg;
  }

  SCREENS.status = function (p) {
    var o = orderById(p.id);
    var root = el("div", { class: "bx-col bx-rel", "data-testid": "customer-status" });
    if (!o) { root.appendChild(header(t("Order"))); return root; }
    var phase = o.phase;
    root.appendChild(el("div", { class: "bx-statusmap" }, [
      mapSvg({}),
      el("div", { class: "bx-hero-top" }, [
        iconBtn("x", function () { resetTo([{ name: "home", params: {} }]); }, "customer-status-close", t("Close")),
        el("div", { class: "bx-grow" }),
        el("button", { type: "button", class: "bx-helpchip", "data-testid": "customer-status-help", onclick: function () { nav("chat", { order: o.id }); }, text: t("Help") })
      ])
    ]));
    var sheetBox = el("div", { class: "bx-statussheet bx-body" });
    root.appendChild(sheetBox);
    var steps = [["Waiting for restaurant", "store"], ["Preparing", "bowl"], ["Rider on the way", "bike"], ["Delivered", "check"]];
    sheetBox.appendChild(el("div", { class: "bx-pad" }, [
      el("h1", { class: "bx-status-title", "data-testid": "customer-status-title", text: phaseTitle(phase) }),

      phase === 3 ? el("div", { class: "bx-muted", text: t("Delivered. We hope you enjoy your food.") }) : null,
      el("div", { class: "bx-steps", "data-testid": "customer-steps" }, steps.map(function (s, i) {
        return el("div", { class: "bx-step" + (i <= phase ? " is-done" : "") + (i === phase ? " is-now" : ""), "data-step": i }, [
          el("span", { class: "bx-step-dot" }, ic(s[1], "bx-ic-sm")), el("span", { class: "bx-step-l", text: t(s[0]) })
        ]);
      }))
    ]));
    var det = el("div", { class: "bx-pad bx-hidden", "data-testid": "customer-status-details" });
    var tog = el("button", { type: "button", class: "bx-chipbtn", "data-testid": "customer-order-details", onclick: function () {
      det.classList.toggle("bx-hidden");
    } }, [ic("doc", "bx-ic-sm"), el("span", { text: t("Order details") })]);
    var actions = el("div", { class: "bx-actions" }, [tog]);
    if (S.account.staff && phase >= 2) {
      actions.appendChild(el("button", { type: "button", class: "bx-chipbtn", "data-testid": "customer-live-map", onclick: function () { nav("livemap", { id: o.id }); } }, [ic("map", "bx-ic-sm"), el("span", { text: t("Live map (beta)") })]));
    }
    if (phase === 3) {
      actions.appendChild(el("button", { type: "button", class: "bx-chipbtn", "data-testid": "customer-status-rate", onclick: function () { openRate(o); }, }, [ic("star", "bx-ic-sm"), el("span", { text: t("Rate your order") })]));
    }
    sheetBox.appendChild(el("div", { class: "bx-pad" }, actions));
    det.appendChild(orderLines(o));
    sheetBox.appendChild(det);
    if (phase === 3) {
      sheetBox.appendChild(el("div", { class: "bx-pad bx-stack-8" }, [
        btn(t("Order again"), "bx-btn-primary bx-btn-block", function () { orderAgain(o); }, "customer-status-order-again"),
        btn(t("Done"), "bx-btn-block", function () { resetTo([{ name: "home", params: {} }]); }, "customer-status-done")
      ]));
      if (!ratings()[o.id] && !S.ratedShown[o.id]) { S.ratedShown[o.id] = true; setTimeout(function () { openRate(o); }, 250); }
    }

    var last = o.status;
    var poll = setInterval(function () {
      var cur = orderById(p.id);
      if (cur && cur.status !== last) { replace("status", p); }
    }, 1200);
    S.cleanups.push(function () { clearInterval(poll); });
    return root;
  };
  function riderName(id) {
    var r = S.riders.filter(function (x) { return String(first(x.id, x.rider_id)) === String(id); })[0];
    return r && r.name ? r.name : "Karim";
  }
  function orderLines(o) {
    var box = el("div", { class: "bx-card bx-pad bx-bill" }, [
      el("div", { class: "bx-rc-name", text: o.restaurant_name })
    ]);
    o.items.forEach(function (i) {
      box.appendChild(el("div", { class: "bx-bill-row" }, [el("span", { text: i.qty + " x " + i.name + (i.opts ? " (" + i.opts + ")" : "") }), el("span", { class: "bx-money", text: money(i.qty * i.price) })]));
    });
    box.appendChild(billRow(t("Subtotal"), money(o.subtotal)));
    box.appendChild(billRow(t("Delivery fee"), o.delivery_fee ? money(o.delivery_fee) : t("Free")));
    if (o.discount) { box.appendChild(billRow(t("Discount"), "- " + money(o.discount))); }
    box.appendChild(billRow(t("Total"), money(o.total), true));
    return box;
  }

  SCREENS.livemap = function (p) {
    var o = orderById(p.id);
    var root = el("div", { class: "bx-col bx-rel", "data-testid": "customer-livemap" });
    var pts = [[70, 190], [120, 190], [170, 190], [220, 190], [270, 190], [270, 130], [270, 70]];
    var i = 0;
    var holder = el("div", { class: "bx-livemap" });
    function draw() { holder.innerHTML = ""; holder.appendChild(mapSvg({ fit: true, rider: { x: pts[i][0], y: pts[i][1] } })); }
    draw();
    var tm = setInterval(function () { i = Math.min(pts.length - 1, i + 1); draw(); if (i === pts.length - 1) { clearInterval(tm); } }, 1500);
    S.cleanups.push(function () { clearInterval(tm); });
    root.appendChild(el("div", { class: "bx-hd" }, [iconBtn("back", back, "customer-back", t("Back")), el("div", { class: "bx-hd-title", text: t("Live map (beta)") })]));
    root.appendChild(holder);
    root.appendChild(el("div", { class: "bx-pad" }, [
      el("div", { class: "bx-chip-tag", text: t("Beta. Only staff accounts can see this.") }),
      el("p", { class: "bx-muted", text: o ? t("Your rider is bringing order from {name}.", { name: o.restaurant_name }) : "" })
    ]));
    return root;
  };

  function openRate(o) {
    var stars = ratings()[o.id] || 0;
    var comment = "";
    sheet(function (close) {
      var content = el("div", { class: "bx-pad" });
      function draw() {
        content.innerHTML = "";
        content.appendChild(el("div", { class: "bx-item-head" }, [
          el("h3", { class: "bx-sheet-title", text: t("Rate your order") }),
          iconBtn("x", close, "customer-sheet-close", t("Close"))
        ]));
        content.appendChild(el("p", { class: "bx-muted", text: t("How was your food from {name}?", { name: o.restaurant_name }) }));
        var row = el("div", { class: "bx-rate", "data-testid": "customer-rate-stars" });
        for (var i = 1; i <= 5; i++) { (function (n) {
          row.appendChild(el("button", { type: "button", class: "bx-ratebtn", "data-testid": "customer-star-" + n, "aria-label": n + " star", onclick: function () { stars = n; draw(); } }, starFill(n <= stars)));
        })(i); }
        content.appendChild(row);
        var ta = el("textarea", { class: "bx-input bx-ta", rows: "3", placeholder: t("Tell us more (optional)"), "data-testid": "customer-rate-comment" });
        ta.value = comment;
        ta.addEventListener("input", function () { comment = ta.value; });
        content.appendChild(ta);
        var sub = btn(t("Submit"), "bx-btn-primary bx-btn-block bx-btn-lg", function () {
          var r = ratings(); r[o.id] = stars; D.write("customer_ratings", r);
          close();
          if (S.stack[S.stack.length - 1].name === "orders") { render(); }
          toast("Thanks for your rating");
        }, "customer-rate-submit");
        sub.disabled = !stars;
        content.appendChild(sub);
      }
      draw();
      return content;
    });
  }

  SCREENS.orders = function () {
    var root = el("div", { class: "bx-col" });
    root.appendChild(el("div", { class: "bx-hd" }, el("div", { class: "bx-hd-title bx-big", text: t("Orders") })));
    var body = el("div", { class: "bx-body" });
    root.appendChild(body);
    var list = ordersForAccount();
    if (!list.length) {
      body.appendChild(el("div", { class: "bx-empty", "data-testid": "customer-orders-empty" }, [
        ic("orders", "bx-ic-xl"), el("h3", { text: t("No orders yet") }), el("p", { class: "bx-muted", text: t("Your orders will show up here.") }),
        btn(t("Find food"), "bx-btn-primary", function () { tab("home"); }, "customer-find-food")
      ]));
      return root;
    }
    var rated = ratings();
    var active = list.filter(function (o) { return o.phase >= 0 && o.phase < 3; });
    var past = list.filter(function (o) { return !(o.phase >= 0 && o.phase < 3); });
    function card(o) {
      var kids = [
        el("div", { class: "bx-order-top" }, [
          el("div", { class: "bx-grow bx-left" }, [el("div", { class: "bx-rc-name", text: o.restaurant_name }), el("div", { class: "bx-muted", text: D.fmtDateTime(o.placed_at) })]),
          orderPill(o)
        ]),
        el("div", { class: "bx-muted bx-clamp", text: o.items.map(function (i) { return i.qty + " x " + i.name; }).join(", ") }),
        el("div", { class: "bx-order-bottom" }, [el("span", { class: "bx-money", text: money(o.total) })])
      ];
      var acts = el("div", { class: "bx-order-acts" });
      if (o.phase >= 0 && o.phase < 3) { acts.appendChild(btn(t("Track order"), "bx-btn-sm bx-btn-primary", function () { nav("status", { id: o.id }); }, "customer-track-order")); }
      else {
        acts.appendChild(btn(t("Order again"), "bx-btn-sm", function () { orderAgain(o); }, "customer-order-again"));
        if (o.phase === 3 && !rated[o.id]) { acts.appendChild(btn(t("Rate"), "bx-btn-sm", function () { openRate(o); }, "customer-rate-order")); }
      }
      kids.push(acts);
      var c = el("div", { class: "bx-card bx-order", "data-testid": "customer-order-card" });
      var tap = el("button", { type: "button", class: "bx-order-tap", "data-testid": "customer-order-open", onclick: function () { nav("orderdetail", { id: o.id }); } }, kids.slice(0, 3));
      c.appendChild(tap); c.appendChild(acts);
      return c;
    }
    if (active.length) { body.appendChild(section(t("Active"))); body.appendChild(el("div", { class: "bx-pad bx-stack-8" }, active.map(card))); }
    if (past.length) { body.appendChild(section(t("Past orders"))); body.appendChild(el("div", { class: "bx-pad bx-stack-8" }, past.map(card))); }
    body.appendChild(el("div", { class: "bx-spacer" }));
    return root;
  };

  SCREENS.orderdetail = function (p) {
    var o = orderById(p.id);
    var root = el("div", { class: "bx-col" });
    root.appendChild(header(o ? t("Order #{id}", { id: o.id }) : t("Order")));
    if (!o) { return root; }
    var body = el("div", { class: "bx-body" });
    root.appendChild(body);
    var rated = ratings()[o.id];
    body.appendChild(el("div", { class: "bx-pad" }, [
      el("div", { class: "bx-order-top" }, [el("div", { class: "bx-grow bx-left" }, [el("h2", { class: "bx-h2", text: o.restaurant_name }), el("div", { class: "bx-muted", text: D.fmtDateTime(o.placed_at) })]),
        orderPill(o)])
    ]));
    body.appendChild(el("div", { class: "bx-pad" }, orderLines(o)));
    body.appendChild(el("div", { class: "bx-pad" }, el("div", { class: "bx-card bx-pad bx-bill" }, [
      billRow(t("Payment"), t(payLabel(o.payment_method))),
      o.promo_code ? billRow(t("Promo code"), o.promo_code) : null,
      o.address ? billRow(t("Deliver to"), o.address) : null
    ])));
    if (o.timeline.length) {
      body.appendChild(section(t("Order timeline")));
      body.appendChild(el("div", { class: "bx-pad bx-timeline" }, o.timeline.map(function (e) {
        return el("div", { class: "bx-tl-row" }, [el("span", { class: "bx-tl-dot" }), el("span", { class: "bx-grow", text: t(FD.STATUS_LABELS[e.status] || e.status) }), el("span", { class: "bx-muted", text: D.fmtDateTime(e.at) })]);
      })));
    }
    var acts = el("div", { class: "bx-pad bx-stack-8" });
    if (o.phase >= 0 && o.phase < 3) { acts.appendChild(btn(t("Track order"), "bx-btn-primary bx-btn-block", function () { nav("status", { id: o.id }); }, "customer-detail-track")); }
    else { acts.appendChild(btn(t("Order again"), "bx-btn-primary bx-btn-block", function () { orderAgain(o); }, "customer-detail-order-again")); }
    if (o.phase === 3) { acts.appendChild(btn(rated ? t("You rated {n} of 5", { n: rated }) : t("Rate your order"), "bx-btn-block", function () { openRate(o); }, "customer-detail-rate")); }
    acts.appendChild(btn(t("Get help with this order"), "bx-btn-block", function () { nav("chat", { order: o.id }); }, "customer-detail-help"));
    body.appendChild(acts);
    return root;
  };

  SCREENS.help = function () {
    var root = el("div", { class: "bx-col" });
    root.appendChild(header(t("Help")));
    var body = el("div", { class: "bx-body" });
    root.appendChild(body);
    var recent = ordersForAccount()[0];
    if (recent) {
      body.appendChild(section(t("Recent order")));
      body.appendChild(el("div", { class: "bx-pad" }, el("button", { type: "button", class: "bx-card bx-addrcard bx-wide", "data-testid": "customer-help-recent", onclick: function () { nav("orderdetail", { id: recent.id }); } }, [
        el("div", { class: "bx-grow bx-left" }, [el("div", { class: "bx-rc-name", text: recent.restaurant_name }), el("div", { class: "bx-muted", text: D.fmtDateTime(recent.placed_at) + " · " + money(recent.total) })]),
        ic("chevR")
      ])));
    }
    body.appendChild(section(t("Need help?")));
    body.appendChild(el("div", { class: "bx-pad bx-stack-8" }, [
      el("p", { class: "bx-muted", text: t("Chat with us about an order, a payment or a refund. An agent will reply to you.") }),
      btn(t("Chat with us"), "bx-btn-primary bx-btn-block bx-btn-lg", function () { nav("chat", { order: recent ? recent.id : null }); }, "customer-chat-with-us")
    ]));
    body.appendChild(section(t("Refunds")));
    body.appendChild(el("div", { class: "bx-pad" }, el("p", { class: "bx-muted", text: t("If something went wrong with an order, tell us in the chat. An agent checks it and sends the refund to the way you paid.") })));
    return root;
  };
  SCREENS.chat = function (p) {
    var o = p.order ? orderById(p.order) : null;
    var root = el("div", { class: "bx-col" });
    root.appendChild(header(t("Chat with us")));
    var body = el("div", { class: "bx-body bx-chat", "data-testid": "customer-chat-thread" });
    root.appendChild(body);
    function bubble(text, mine) { body.appendChild(el("div", { class: "bx-bubble" + (mine ? " is-mine" : ""), text: text })); body.scrollTop = body.scrollHeight; }
    bubble(t("Hi. Tell us how we can help. An agent will join this chat."), false);
    if (o) { body.appendChild(el("div", { class: "bx-chat-order" }, [el("span", { class: "bx-muted", text: t("About order #{id} from {name}", { id: o.id, name: o.restaurant_name }) })])); }
    var input = el("input", { class: "bx-input", placeholder: t("Type your message"), "data-testid": "customer-chat-input", "aria-label": t("Type your message") });
    var replied = false;
    function send() {
      var v = input.value.trim();
      if (!v) { return; }
      bubble(v, true); input.value = "";
      if (!replied) { replied = true; setTimeout(function () { bubble(t("Thanks. You are in the queue. An agent will reply here soon."), false); }, 700); }
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { send(); } });
    root.appendChild(el("div", { class: "bx-chat-bar" }, [input, iconBtn("send", send, "customer-chat-send", t("Send"))]));
    return root;
  };

  SCREENS.addresses = function (p) {
    var root = el("div", { class: "bx-col" });
    root.appendChild(header(p.pick ? t("Choose address") : t("Saved addresses")));
    var body = el("div", { class: "bx-body" });
    root.appendChild(body);
    var list = addresses();
    var box = el("div", { class: "bx-pad bx-stack-8" });
    if (!list.length) { box.appendChild(el("p", { class: "bx-muted", "data-testid": "customer-no-address", text: t("You have no saved addresses.") })); }
    list.forEach(function (a) {
      box.appendChild(el("div", { class: "bx-card bx-addrcard", "data-testid": "customer-address-row" }, [
        el("button", { type: "button", class: "bx-addr-main", "data-testid": "customer-address-select", onclick: function () {
          var all = addresses().map(function (x) { x.default = x.id === a.id; return x; });
          saveAddresses(all);
          if (p.pick) { back(); } else { render(); }
        } }, [
          ic("pin"),
          el("div", { class: "bx-grow bx-left" }, [el("div", { class: "bx-rc-name", text: t(a.label) }), el("div", { class: "bx-muted", text: a.text + ", " + a.area })]),
          a.default ? el("span", { class: "bx-chip-tag", text: t("Selected") }) : null
        ]),
        iconBtn("trash", function () {
          var all = addresses().filter(function (x) { return x.id !== a.id; });
          if (all.length && !all.some(function (x) { return x.default; })) { all[0].default = true; }
          saveAddresses(all); render();
        }, "customer-address-delete", t("Delete"))
      ]));
    });
    box.appendChild(btn(t("Add new address"), "bx-btn-block", function () { nav("addaddress", { pick: p.pick }); }, "customer-add-address"));
    body.appendChild(box);
    return root;
  };
  SCREENS.addaddress = function (p) {
    var root = el("div", { class: "bx-col" });
    root.appendChild(header(t("New address")));
    var body = el("div", { class: "bx-body" });
    root.appendChild(body);
    var pinned = false;
    var mapBox = el("div", { class: "bx-addmap" });
    var pinMsg = el("div", { class: "bx-muted", "data-testid": "customer-pin-msg", text: t("Pin your location with GPS, then type the address.") });
    function drawMap() { mapBox.innerHTML = ""; mapBox.appendChild(mapSvg({ plain: true })); mapBox.appendChild(el("div", { class: "bx-pinmark" + (pinned ? " is-on" : "") }, ic("pin", "bx-ic-lg"))); }
    drawMap();
    var area = el("select", { class: "bx-input", "data-testid": "customer-address-area", "aria-label": t("Area") }, [el("option", { value: "", text: t("Choose area") })].concat(AREAS.map(function (a) { return el("option", { value: a, text: a }); })));
    var text = el("input", { class: "bx-input", placeholder: t("House, road, block"), "data-testid": "customer-address-text", "aria-label": t("House, road, block") });
    var note = el("input", { class: "bx-input", placeholder: t("Note for the rider (optional)"), "aria-label": t("Note for the rider (optional)") });
    var label = "Home";
    var labelRow = el("div", { class: "bx-chips" });
    function drawLabels() {
      labelRow.innerHTML = "";
      ["Home", "Office", "Other"].forEach(function (l) {
        labelRow.appendChild(el("button", { type: "button", class: "bx-chip" + (label === l ? " is-on" : ""), "data-testid": "customer-label-" + l.toLowerCase(), text: t(l), onclick: function () { label = l; drawLabels(); } }));
      });
    }
    drawLabels();
    var err = el("div", { class: "bx-error", "data-testid": "customer-address-error" });
    body.appendChild(el("div", { class: "bx-pad bx-stack-12" }, [
      mapBox, pinMsg,
      btn(t("Use my current location"), "bx-btn-block", function () {
        pinned = true; drawMap(); area.value = "Dhanmondi";
        pinMsg.textContent = t("Location pinned. Now type the address below.");
      }, "customer-use-location"),
      el("div", { class: "bx-field" }, [el("label", { text: t("Area") }), area]),
      el("div", { class: "bx-field" }, [el("label", { text: t("House, road, block") }), text]),
      el("div", { class: "bx-field" }, [el("label", { text: t("Save as") }), labelRow]),
      el("div", { class: "bx-field" }, [el("label", { text: t("Note for the rider (optional)") }), note]),
      err,
      btn(t("Save address"), "bx-btn-primary bx-btn-block bx-btn-lg", function () {
        if (!area.value || !text.value.trim()) { err.textContent = t("Choose an area and type the address."); return; }
        var all = addresses();
        all.forEach(function (a) { a.default = false; });
        all.push({ id: Date.now(), label: label, area: area.value, text: text.value.trim(), note: note.value, pin: pinned, default: true });
        saveAddresses(all);
        S.stack.pop();
        if (p.pick) { S.stack.pop(); }
        render();
        toast("Address saved");
      }, "customer-save-address")
    ]));
    return root;
  };

  SCREENS.account = function () {
    var acc = S.account;
    var root = el("div", { class: "bx-col" });
    root.appendChild(el("div", { class: "bx-hd" }, el("div", { class: "bx-hd-title bx-big", text: t("Account") })));
    var body = el("div", { class: "bx-body" });
    root.appendChild(body);
    body.appendChild(el("div", { class: "bx-pad bx-profile", "data-testid": "customer-profile" }, [
      el("span", { class: "bx-avatar", text: (acc.name || "C").charAt(0).toUpperCase() }),
      el("div", {}, [el("div", { class: "bx-rc-name", text: acc.name }), el("div", { class: "bx-muted", text: "+880 " + acc.phone.slice(1) })])
    ]));
    function row(icon, label, onclick, testid, right) {
      return el("button", { type: "button", class: "bx-menu-row", "data-testid": testid, onclick: onclick }, [ic(icon), el("span", { class: "bx-grow bx-left", text: label }), right || ic("chevR", "bx-ic-sm")]);
    }
    var langSeg = el("div", { class: "bx-seg", role: "radiogroup", "aria-label": t("App language") }, [
      el("button", { type: "button", class: S.lang === "en" ? "is-on" : "", "data-testid": "customer-lang-en", role: "radio", "aria-checked": S.lang === "en" ? "true" : "false", onclick: function () { setLang("en"); }, text: "English" }),
      el("button", { type: "button", class: S.lang === "bn" ? "is-on" : "", "data-testid": "customer-lang-bn", role: "radio", "aria-checked": S.lang === "bn" ? "true" : "false", onclick: function () { setLang("bn"); }, text: "বাংলা" })
    ]);
    body.appendChild(el("div", { class: "bx-menu" }, [
      row("pin", t("Saved addresses"), function () { nav("addresses", { pick: false }); }, "customer-menu-addresses"),
      el("div", { class: "bx-menu-row bx-menu-lang" }, [ic("globe"), el("span", { class: "bx-grow bx-left", text: t("App language") }), langSeg]),
      row("headset", t("Help"), function () { nav("help"); }, "customer-menu-help"),
      row("logout", t("Log out"), function () { logout(); }, "customer-logout")
    ]));
    body.appendChild(el("div", { class: "bx-version", "data-testid": "customer-version", text: t("Version {v}", { v: VERSION }) }));
    return root;
  };
  function setLang(l) {
    S.lang = l; D.write("customer_lang", l);
    document.documentElement.lang = l === "bn" ? "bn" : "en";
    app.classList.toggle("is-bn", l === "bn");
    render();
  }
  function logout() {
    D.write("customer_account", null, true);
    S.account = null; S.promo = ""; S.payMethod = "cash";
    render();
  }

  function advanceLatest() {
    var list = D.read("orders_new", []);
    var mine = list.filter(function (o) { return S.account && o.customer_phone === S.account.phone; });
    var latest = mine[mine.length - 1] || list[list.length - 1];
    if (!latest) { return; }
    var patches = D.read("orders_patch", {});
    var cur = patches[latest.id] ? patches[latest.id].status : latest.status;
    var next = { placed: "accepted", accepted: "assigned", ready: "assigned", assigned: "picked_up", picked_up: "delivered" }[cur];
    if (!next) { return; }
    var prev = patches[latest.id] || { timeline_add: [], rider_id: latest.rider_id };
    var rid = prev.rider_id;
    if (next === "assigned") { var rr = S.riders[0]; rid = rr ? first(rr.id, rr.rider_id) : 1; }
    patches[latest.id] = { status: next, rider_id: rid, timeline_add: (prev.timeline_add || []).concat([{ status: next, at: nowIso() }]) };
    D.write("orders_patch", patches);
    var topScreen = S.stack[S.stack.length - 1].name;
    if (topScreen === "status" || topScreen === "home" || topScreen === "orders" || topScreen === "orderdetail") { render(); }
  }

  function build() {
    app = document.getElementById("bx-app");
    app.innerHTML = "";
    var status = el("div", { class: "bx-status", "aria-hidden": "true" }, [
      el("span", { class: "bx-status-time", text: D.fmtTime(nowIso()) || "13:10" }),
      el("span", { class: "bx-status-icons" }, [ic("bike", "bx-ic-xs")])
    ]);
    status.lastChild.innerHTML = '<svg viewBox="0 0 40 12" class="bx-sysicons"><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="5" width="3" height="7" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/><rect x="23" y="1" width="16" height="10" rx="2.5" fill="none" stroke="currentColor"/><rect x="25" y="3" width="10" height="6" rx="1"/></svg>';
    view = el("div", { class: "bx-view" });
    tabbar = el("nav", { class: "bx-tabbar is-hidden", "aria-label": "Main" });
    layer = el("div", { class: "bx-layer" });
    app.appendChild(status); app.appendChild(view); app.appendChild(tabbar); app.appendChild(layer);
    app.classList.toggle("is-bn", S.lang === "bn");
    document.documentElement.lang = S.lang === "bn" ? "bn" : "en";
  }

  function init(res) {
    S.meta = res[0] && !Array.isArray(res[0]) ? res[0] : {};
    S.restaurants = arr(res[1]).map(normRestaurant);
    S.menuRows = arr(res[2]);
    S.orderRows = arr(res[3]);
    S.riders = arr(res[4]);
    S.byId = {};
    S.restaurants.forEach(function (r) { S.byId[r.id] = r; });
    S.ratedShown = {};

    S.orderRows.forEach(function (o) { var r = S.byId[first(o.restaurant_id)]; if (r) { r.orders += 1; } });

    var pid = S.meta.personas ? S.meta.personas.customer_id : 1;
    S.personaOrders = S.orderRows.filter(function (o) { return String(o.customer_id) === String(pid); });
    var pa = (S.personaOrders[0] || {}).address || {};
    S.personaName = pa.name || "Rahim Uddin";
    S.knownPhones = [DEMO_PHONE];
    if (pa.phone) { S.knownPhones.push(digits(pa.phone)); }

    var live = S.restaurants.filter(function (r) { return r.live; });
    S.pastOrders = S.personaOrders.filter(function (o) { return phaseOf(o.status) === 3 || phaseOf(o.status) === -1; });
    var need = 4 - S.pastOrders.length;
    for (var i = 0; i < need && live.length; i++) {
      var r = live[i % live.length];
      var menu = menuFor(r);
      var pick = [menu[i % menu.length], menu[(i + 2) % menu.length]];
      S.pastOrders.push({
        id: 90001 + i, customer_id: pid, restaurant_id: r.id, status: "delivered",
        payment_method: i % 2 ? "prepaid" : "cod", delivery_fee: baseFee(), discount_amount: 0,
        placed_at: D.addDays(nowIso(), -(2 + i * 3)) + " 13:05:00",
        address: { label: "Home", text: pa.street || "House 42, Road 9/A", area: pa.area || "Dhanmondi" },

        items: [
          { menu_item_id: pick[0].id, name: pick[0].name, qty: 1 + (i % 2), price: pick[0].price, base_price: i % 2 === 0 ? pick[0].price - 20 : pick[0].price },
          { menu_item_id: pick[1].id, name: pick[1].name, qty: 1, price: pick[1].price, base_price: pick[1].price }
        ],
        timeline: [{ status: "placed", at: D.addDays(nowIso(), -(2 + i * 3)) + " 13:05:00" }, { status: "delivered", at: D.addDays(nowIso(), -(2 + i * 3)) + " 13:48:00" }]
      });
    }
    build();
    if (S.account) { seedAddresses(); }
    var deep = (window.location.hash || "").replace("#/", "");
    S.stack = [{ name: S.account ? (SCREENS[deep] && deep !== "login" ? deep : "home") : "login", params: {} }];
    render();

    document.getElementById("bx-proto-advance").addEventListener("click", advanceLatest);
    document.getElementById("bx-proto-reset").addEventListener("click", function () {
      D.resetState(); window.location.href = window.location.pathname;
    });
  }

  Promise.all([
    D.loadData("meta").catch(function () { return {}; }),
    safeLoad("restaurants"), safeLoad("menu_items"), safeLoad("orders"), safeLoad("riders")
  ]).then(init).catch(function (e) {
    var a = document.getElementById("bx-app");
    if (a) { a.textContent = "Could not load data: " + e.message; }
    if (window.console) { console.error(e); }
  });

})();
