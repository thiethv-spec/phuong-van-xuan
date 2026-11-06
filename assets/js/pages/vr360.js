/* =========================================================
   TRANG VR360 (route "vr360") – bố cục kiểu YouTube
   - Khung chính: iframe pages/vr360-dia-diem.html#diem=<id>&layout=youtube&embed=1
   - Chỉ các di tích có tour (root_data/vr360/tours/<id>.json -> tools/build_vr360.py)
   - Cột phải "Tiếp theo": các tour VR360 còn lại
   ========================================================= */
(function () {
  "use strict";
  var VX = window.VX;
  var CFG = window.VX_VR360 || { items: [] };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var TYPE = { dinh: "Đình", chua: "Chùa", khu_luu_niem: "Khu lưu niệm" };
  var thumb = function (s) { var m = s.media || {}; return m.hero || m.avatar || m.cover || (m.gallery || [])[0] || ""; };

  // Danh sách tour = di tích có tour, kèm dữ liệu di tích
  var tours = (CFG.items || []).map(function (t) { var s = VX.site(t.id); return s ? { tour: t, site: s } : null; }).filter(Boolean);

  function player(t) {
    document.getElementById("vrPlayer").innerHTML =
      '<iframe src="vr360-dia-diem.html#diem=' + encodeURIComponent(t.site.id) + '&layout=youtube&embed=1" title="VR360 ' + esc(t.site.name) +
      '" allow="fullscreen; gyroscope; accelerometer; xr-spatial-tracking" allowfullscreen></iframe>';
  }

  function info(t) {
    var s = t.site, rec = s.recognition || {};
    document.title = "VR360 – " + s.name + " – Phường Vạn Xuân";
    document.getElementById("vrTitle").textContent = s.name;
    document.getElementById("vrRank").textContent = [TYPE[s.type], s.rank ? "Di tích " + s.rank.toLowerCase() : ""].filter(Boolean).join(" · ");

    var actions = [
      '<a class="vxv-pill" href="vr360-dia-diem.html#diem=' + encodeURIComponent(s.id) + '&layout=youtube" target="_blank" rel="noopener"><i class="bi bi-arrows-fullscreen"></i> Toàn màn hình</a>',
      '<a class="vxv-pill" href="' + VX.url("detail", { id: s.id }) + '"><i class="bi bi-info-circle"></i> Chi tiết di tích</a>'
    ];
    if (s.gmaps && s.gmaps.search) actions.push('<a class="vxv-pill" href="' + esc(s.gmaps.search) + '" target="_blank" rel="noopener"><i class="bi bi-sign-turn-right"></i> Chỉ đường</a>');
    actions.push('<button type="button" class="vxv-pill" id="vrShare"><i class="bi bi-share"></i> Chia sẻ</button>');
    document.getElementById("vrActions").innerHTML = actions.join("");
    document.getElementById("vrShare").addEventListener("click", function () {
      var btn = this, url = location.href;
      if (navigator.share) return navigator.share({ title: s.name, url: url }).catch(function () {});
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { btn.innerHTML = '<i class="bi bi-check2"></i> Đã sao chép'; });
    });

    var meta = [t.tour.scenes.length + " khung cảnh 360°", s.address];
    if (rec.number) meta.push("QĐ " + rec.number + (rec.date ? " (" + rec.date.slice(0, 4) + ")" : ""));
    document.getElementById("vrMeta").textContent = meta.filter(Boolean).join("  •  ");

    // Mô tả: chỉ đoạn tóm tắt ngắn của di tích
    document.getElementById("vrBody").innerHTML = s.summary ? "<p>" + esc(s.summary) + "</p>" : "";
  }

  function list(t) {
    document.getElementById("vrList").innerHTML = tours.filter(function (x) { return x !== t; }).map(function (x) {
      var img = thumb(x.site);
      return '<a class="vxv-item" href="' + VX.url("vr360", { id: x.site.id }) + '">' +
        '<span class="vxv-item__thumb">' + (img ? '<img src="' + esc(VX.asset(img)) + '" alt="" loading="lazy">' : '<i class="bi bi-image"></i>') +
        '<span class="vxv-item__badge is-on"><i class="bi bi-badge-vr"></i> ' + x.tour.scenes.length + " cảnh</span></span>" +
        '<span class="vxv-item__text"><strong>' + esc(x.site.name) + "</strong><small>" + esc(x.site.address || "") + "</small>" +
        "<small>" + esc([TYPE[x.site.type], x.site.rank].filter(Boolean).join(" · ")) + "</small></span></a>";
    }).join("");
  }

  function render() {
    if (!tours.length) {
      document.getElementById("vrPlayer").innerHTML = '<div class="vxv-player__state"><strong>Chưa có tour VR360.</strong></div>';
      return;
    }
    var id = VX.param("id");
    var t = tours.filter(function (x) { return x.site.id === id; })[0] || tours[0];
    player(t); info(t); list(t);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
