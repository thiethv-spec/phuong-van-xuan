/* =========================================================
   TRANG VR360 (route "vr360") – SKELETON
   Mỗi di tích có trường `vr360` trong root_data (hiện = null).
   Khi có tour: điền vr360 = { type: "...", src: "..." } trong tools/build_data.py
   rồi gắn viewer tại initViewer().
   ========================================================= */
(function () {
  "use strict";
  var VX = window.VX;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  function initViewer(el, site) {
    if (!site.vr360) {
      el.innerHTML = "<div><i class=\"bi bi-badge-vr fs-1 d-block mb-2\"></i>Tour VR360 của <strong>" + esc(site.name) +
        "</strong> đang được cập nhật.<br><a class=\"link-warning\" href=\"" + VX.url("detail", { id: site.id }) + "\">Xem thông tin di tích</a></div>";
      return;
    }
    // TODO: khởi tạo viewer 360 theo site.vr360
  }

  function render() {
    var id = VX.param("id");
    var site = id ? VX.site(id) : null;
    var viewer = document.getElementById("vrViewer");

    document.getElementById("vrList").innerHTML = VX.db.sites.map(function (s) {
      var on = site && s.id === site.id;
      return '<a class="vx-chip' + (on ? " vx-chip--solid" : "") + '" href="' + VX.url("vr360", { id: s.id }) + '">' + esc(s.name) + "</a>";
    }).join("");

    if (!site) {
      viewer.innerHTML = "<div>" + (id ? "Không tìm thấy di tích \"" + esc(id) + "\". " : "") + "Chọn một di tích bên dưới.</div>";
      return;
    }
    document.title = "VR360 – " + site.name;
    document.getElementById("vrTitle").textContent = site.name;
    document.getElementById("vrLead").textContent = site.address;
    initViewer(viewer, site);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
