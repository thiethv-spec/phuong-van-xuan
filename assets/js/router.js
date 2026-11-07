/* =========================================================
   ROUTER – khai báo 4 trang của site + helper tạo link / đọc tham số.
   Site tĩnh nhiều trang (không cần build), chạy được cả http:// lẫn file://.

   Dùng:
     VX.url("detail", { id: "dinh_thu_lam" })  -> ".../pages/di-tich.html?id=dinh_thu_lam"
     VX.param("id")                            -> "dinh_thu_lam"
     VX.asset("assets/img/hero/x.png")         -> đường dẫn đúng dù đang ở trang nào
     VX.route                                  -> route hiện tại (lấy từ <body data-route="...">)
   ========================================================= */
(function () {
  "use strict";

  var ROUTES = {
    home:   { path: "index.html",           label: "Trang chủ" },
    detail: { path: "pages/di-tich.html",   label: "Di tích",   params: ["id"] },
    map:    { path: "pages/ban-do.html",    label: "Bản đồ số", params: ["id"] },
    vr360:  { path: "pages/vr360.html",     label: "VR360",     params: ["id"] }
  };
  /* Thứ tự menu chính */
  var NAV = ["home", "map", "detail", "vr360"];

  /* Gốc site = thư mục chứa assets/ (router.js nằm ở assets/js/) */
  var me = document.currentScript || document.querySelector('script[src*="router.js"]');
  var ROOT = new URL("../../", me.src).href;

  function asset(path) {
    if (!path || /^(https?:|data:|blob:)/.test(path)) return path;
    return new URL(path.replace(/^\/+/, ""), ROOT).href;
  }

  function url(name, params, hash) {
    var r = ROUTES[name];
    if (!r) throw new Error("Route không tồn tại: " + name);
    var u = new URL(r.path, ROOT);
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] != null && params[k] !== "") u.searchParams.set(k, params[k]);
    });
    if (hash) u.hash = hash;
    return u.href;
  }

  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function go(name, params, hash) { location.href = url(name, params, hash); }

  var db = window.VX_DB || { sites: [], festivals: [], meta: {} };
  var byId = {};
  db.sites.forEach(function (s) { byId[s.id] = s; });
  var festById = {};
  db.festivals.forEach(function (f) { festById[f.id] = f; });

  var norm = function (s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  };

  window.VX = {
    ROUTES: ROUTES,
    NAV: NAV,
    ROOT: ROOT,
    route: document.body ? document.body.getAttribute("data-route") : null,
    url: url,
    go: go,
    param: param,
    asset: asset,
    db: db,
    site: function (id) { return byId[id] || null; },
    festival: function (id) { return festById[id] || null; },
    festivalsOf: function (siteId) {
      var s = byId[siteId];
      return s ? s.festivals.map(function (id) { return festById[id]; }).filter(Boolean) : [];
    },
    /* Tìm kiếm không dấu theo tên + tên gọi khác */
    search: function (q) {
      q = norm(q).trim();
      if (!q) return [];
      return db.sites.filter(function (s) {
        return [s.name].concat(s.aliases || []).some(function (n) { return norm(n).indexOf(q) > -1; });
      });
    }
  };

  /* data-route có thể chưa có nếu script đặt trong <head> */
  document.addEventListener("DOMContentLoaded", function () {
    window.VX.route = document.body.getAttribute("data-route");
  });
})();
