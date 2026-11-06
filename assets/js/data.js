/* =========================================================
   DỮ LIỆU CHO TRANG CHỦ – lấy từ root_data/vx-data.js (window.VX_DB, sinh từ Excel
   bằng tools/build_data.py). Bản đồ số ở trang chủ nhúng iframe pages/ban-do-so.html.
   ========================================================= */
(function () {
  var DB = window.VX_DB || { sites: [], festivals: [] };
  var VX = window.VX;
  var A = VX ? VX.asset : function (p) { return p; };
  var detail = function (id) { return VX ? VX.url("detail", { id: id }) : "#"; };
  var byId = function (id) { return DB.sites.filter(function (s) { return s.id === id; })[0]; };
  var img = function (s) { return s.media.hero || s.media.cover; };
  /* Mô tả ngắn cho thẻ: lấy summary, bỏ các câu ghi chú biên tập ("file gốc", "cần chuẩn hóa"...) */
  var NOTE = /(file gốc|cần chuẩn hóa|chưa thống nhất|ghi chú|nguồn công khai)/i;
  var blurb = function (s) {
    return String(s.summary || "").split(/(?<=\.)\s+/).filter(function (x) { return x && !NOTE.test(x); }).slice(0, 2).join(" ");
  };

  /* Thứ tự carousel theo thiết kế. Chỉ dùng di tích đã có file ảnh thực tế
     (đình Giã Trung chưa có ảnh -> dùng chùa Giã Trung). */
  var ORDER = ["chua_man_tang", "chua_gia_trung", "dinh_phuc_duyen", "chua_doi_cao",
               "dinh_thanh_thu", "dinh_thanh_quang", "dinh_thu_lam"];
  var carouselSites = ORDER.map(byId).filter(function (s) { return s && img(s); });

  /* 3 lễ hội nổi bật có ảnh thật (le_hoi_11, le_hoi_01, le_hoi_03) */
  var FEATURED = ["le_hoi_11", "le_hoi_01", "le_hoi_03"];

window.VX_DATA = {
  /* Hero: slide ảnh các di tích có ảnh hero (assets/img/hero/<id>.png) */
  hero: ORDER.map(byId).concat(DB.sites).filter(function (s, i, arr) {
    return s && s.media.hero && arr.indexOf(s) === i;
  }).map(function (s) { return { title: s.name, image: A(s.media.hero), url: detail(s.id) }; }),

  /* Khám phá di tích (carousel): thẻ giới thiệu + các di tích có ảnh hero */
  /* Mọi thẻ: ảnh + tên, hover mới hiện khung thông tin (di tích nào chưa có ảnh mới mở sẵn) */
  heritage: [byId("khu_luu_niem_ts_nguyen_cau")].filter(Boolean).concat(carouselSites).map(function (s) {
    return { title: s.name, desc: blurb(s), image: img(s) ? A(img(s)) : "", url: detail(s.id) };
  }),

  /* Sự kiện và Lễ hội: 3 lễ hội nổi bật */
  festivals: DB.festivals.filter(function (f) { return FEATURED.indexOf(f.id) !== -1 && f.media.cover; })
    .sort(function (a, b) { return FEATURED.indexOf(a.id) - FEATURED.indexOf(b.id); }).map(function (f) {
    return { title: f.name.replace(/\s*\(.*\)\s*$/, ""), image: A(f.media.cover), url: detail(f.sites[0]) + "#le-hoi" };
  }),

  /* Bản đồ số: trang chủ nhúng iframe pages/ban-do-so.html (dữ liệu: root_data/map/map-data.js) */
  map: null
};
})();
