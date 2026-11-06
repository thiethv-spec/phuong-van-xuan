/* =========================================================
   LAYOUT – header + footer dùng chung cho mọi trang.
   Trang chỉ cần đặt <div data-vx-header></div> và <div data-vx-footer></div>.
   Cần nạp sau router.js.
   ========================================================= */
(function () {
  "use strict";
  var VX = window.VX;

  function navItems(cls) {
    return VX.NAV.map(function (name) {
      var active = VX.route === name;
      return '<li class="nav-item"><a class="' + cls + (active ? " active" : "") + '"' +
        (active ? ' aria-current="page"' : "") + ' href="' + VX.url(name) + '">' + VX.ROUTES[name].label + "</a></li>";
    }).join("");
  }

  function header() {
    return '' +
      '<header class="vx-header">' +
      '  <nav class="navbar navbar-expand-lg" data-bs-theme="dark" aria-label="Điều hướng chính">' +
      '    <div class="container container-vx-narrow">' +
      '      <a class="vx-brand navbar-brand me-auto" href="' + VX.url("home") + '">' +
      '        <span class="vx-brand__title">Di tích lịch sử</span>' +
      '        <span class="vx-brand__sub">Phường Vạn Xuân, Tỉnh Thái Nguyên</span>' +
      '      </a>' +
      '      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Mở menu">' +
      '        <span class="navbar-toggler-icon"></span>' +
      '      </button>' +
      '      <div class="collapse navbar-collapse justify-content-end" id="mainNav">' +
      '        <ul class="navbar-nav">' + navItems("nav-link") + "</ul>" +
      "      </div>" +
      "    </div>" +
      "  </nav>" +
      "</header>";
  }

  function footer() {
    return '' +
      '<footer class="vx-footer">' +
      '  <div class="container container-vx-narrow">' +
      '    <div class="row vx-footer__cols gy-4">' +
      '      <div class="col-md-4 vx-footer__brand"><h4>Di tích lịch sử</h4><p class="mb-0">Phường Vạn Xuân, Tỉnh Thái Nguyên</p></div>' +
      '      <div class="col-md-5 ps-md-4"><h4>Thông tin liên hệ</h4><ul>' +
      "        <li><strong>Đơn vị quản lý:</strong> UBND phường Vạn Xuân</li>" +
      "        <li><strong>Địa chỉ:</strong> Phường Vạn Xuân, tỉnh Thái Nguyên</li>" +
      "        <li><strong>Điện thoại:</strong> Đang cập nhật</li>" +
      "        <li><strong>Email:</strong> Đang cập nhật</li>" +
      "      </ul></div>" +
      '      <div class="col-md-3 ps-md-4"><h4>Liên kết nhanh</h4><ul>' + navItems("") + "</ul></div>" +
      "    </div>" +
      '    <p class="vx-footer__copy mb-0">© 2026 Di tích lịch sử Phường Vạn Xuân</p>' +
      "  </div>" +
      "</footer>";
  }

  function mount() {
    VX.route = document.body.getAttribute("data-route");
    document.querySelectorAll("[data-vx-header]").forEach(function (el) { el.outerHTML = header(); });
    document.querySelectorAll("[data-vx-footer]").forEach(function (el) { el.outerHTML = footer(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
