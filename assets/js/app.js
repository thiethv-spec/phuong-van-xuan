(function () {
  "use strict";
  var D = window.VX_DATA || {};
  var tpl = function (id) { return document.getElementById(id).content.firstElementChild; };

  /* ---------- Hero: slide ảnh nền (fade, tự chạy) ---------- */
  function renderHero() {
    var track = document.getElementById("heroTrack");
    var el = document.getElementById("heroSwiper");
    if (!track || !D.hero || !D.hero.length) return;
    D.hero.forEach(function (h, i) {
      var slide = document.createElement("div");
      slide.className = "swiper-slide vx-hero__slide";
      slide.innerHTML = '<img src="' + h.image + '" alt="' + h.title.replace(/"/g, "&quot;") + '"' + (i ? ' loading="lazy"' : "") + ">" +
        '<a class="vx-hero__caption" href="' + h.url + '"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ' + h.title + "</a>";
      track.appendChild(slide);
    });
    if (typeof Swiper === "undefined" || D.hero.length < 2) return;
    new Swiper(el, {
      effect: "fade", fadeEffect: { crossFade: true }, speed: 1200, loop: true,
      autoplay: { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true },
      pagination: { el: el.querySelector(".swiper-pagination"), clickable: true }
    });
  }

  /* ---------- Khám phá di tích (Swiper, thẻ so le, hover hiện thông tin) ---------- */
  function renderHeritage() {
    var track = document.getElementById("heritageTrack");
    if (!track || !D.heritage) return;
    D.heritage.forEach(function (item) {
      var node = tpl("tplCardPhoto").cloneNode(true);
      var a = node.querySelector(".vx-card");
      a.href = item.url; a.setAttribute("aria-label", item.title);
      var img = node.querySelector("img");
      if (item.image) { img.src = item.image; img.alt = item.title; }
      else { img.remove(); a.classList.add("is-open", "no-img"); }
      node.querySelector(".vx-card__title").textContent = item.title;
      node.querySelector(".vx-card__info-title").textContent = item.title;
      node.querySelector(".vx-card__info-desc").textContent = item.desc || "";
      track.appendChild(node);
    });
    initCarousel();
  }

  function initCarousel() {
    var el = document.getElementById("heritageSwiper");
    var prev = document.querySelector("[data-carousel-prev]");
    var next = document.querySelector("[data-carousel-next]");
    if (typeof Swiper === "undefined") { // CDN lỗi -> vẫn cuộn ngang được
      el.classList.add("is-fallback");
      return;
    }
    new Swiper(el, {
      slidesPerView: 1.25,
      spaceBetween: 16,
      rewind: true,
      grabCursor: true,
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: { prevSlideMessage: "Lùi lại", nextSlideMessage: "Xem tiếp" },
      navigation: { prevEl: prev, nextEl: next },
      breakpoints: {
        576: { slidesPerView: 2.2, spaceBetween: 20 },
        768: { slidesPerView: 3, spaceBetween: 24 },
        1200: { slidesPerView: 4, spaceBetween: 32 }
      }
    });
  }

  /* ---------- Lễ hội ---------- */
  function renderFestivals() {
    var grid = document.getElementById("festivalGrid");
    if (!grid || !D.festivals) return;
    D.festivals.forEach(function (f) {
      var node = tpl("tplFestival").cloneNode(true);
      var a = node.querySelector(".vx-fest");
      a.href = f.url; a.setAttribute("aria-label", "Xem chi tiết " + f.title);
      var img = node.querySelector("img"); img.src = f.image; img.alt = f.title;
      node.querySelector(".vx-fest__title").textContent = f.title;
      grid.appendChild(node);
    });
  }

  /* ---------- Tìm kiếm (hero): tìm không dấu, mở trang chi tiết di tích ---------- */
  function initSearch() {
    var form = document.getElementById("heroSearch");
    var VX = window.VX;
    if (!form || !VX) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = form.q.value.trim();
      if (!q) return;
      var hit = VX.search(q)[0];
      if (hit) VX.go("detail", { id: hit.id });
      else document.getElementById("ban-do").scrollIntoView({ behavior: "smooth" });
    });
    var list = document.getElementById("relicNames");
    list && VX.db.sites.forEach(function (site) {
      var o = document.createElement("option"); o.value = site.name; list.appendChild(o);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHero();
    renderHeritage();
    renderFestivals();
    initSearch();
  });
})();
