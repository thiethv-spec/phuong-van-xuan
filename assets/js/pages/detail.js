/* =========================================================
   TRANG CHI TIẾT ĐỊA ĐIỂM (route "detail")
   - ?id=<id>  : đổ dữ liệu 1 di tích vào template trong pages/di-tich.html ([data-slot])
   - không id  : danh sách 17 di tích
   Dữ liệu: window.VX_DB (root_data/vx-data.js). Trường tuỳ chọn hỗ trợ sẵn nếu sau này bổ sung
   vào dữ liệu: site.tagline, site.headline, site.quote {text, cite}, site.visitTime, site.captions[].
   ========================================================= */
(function () {
  "use strict";
  var VX = window.VX;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var paras = function (s) { return String(s || "").split(/\n{2,}|\n/).filter(Boolean).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""); };
  var cap = function (s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); };
  var lunar = function (t) { return t ? cap(t) + (/âm lịch/i.test(t) ? "" : " âm lịch") : ""; };
  var fmtDate = function (iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? m[3] + "/" + m[2] + "/" + m[1] : (iso || ""); };

  /* ---------- helpers đổ dữ liệu ---------- */
  function slots(name) { return document.querySelectorAll('[data-slot="' + name + '"]'); }
  function setText(name, v) { slots(name).forEach(function (el) { el.textContent = v || ""; }); }
  function setHTML(name, v) { slots(name).forEach(function (el) { el.innerHTML = v || ""; }); }
  function setHref(name, v) { slots(name).forEach(function (el) { el.href = v; }); }
  function slot(name) { return document.querySelector('[data-slot="' + name + '"]'); }

  /* ---------- dữ liệu suy ra ---------- */
  function rankShort(s) { return cap(String(s.rank || "").toLowerCase()); }               // "Cấp tỉnh"
  function decisionText(s) {
    var r = s.recognition || {};
    return [r.number, fmtDate(r.date)].filter(Boolean).join(" • ") || "Đang cập nhật";
  }
  function headline(s) {
    if (s.headline) return s.headline;
    if (s.narration && s.narration.sections[0] && s.narration.sections[0].title) return s.narration.sections[0].title;
    var first = String(s.history || s.summary || s.name).split(/[.;]/)[0];
    return first.length > 90 ? s.name : first;
  }
  /* Số liệu nổi bật rút từ văn bản: diện tích, số sắc phong / bia / câu đối / hoành phi / gian */
  function stats(s) {
    var text = [s.summary, s.architecture].join(" ");
    var out = [];
    var area = /([\d.]+(?:,\d+)?)\s*m²/.exec(text);
    if (area) out.push({ num: area[1] + " m²", label: /cả cụm|toàn cụm/.test(text) ? "Diện tích cả cụm di tích" : "Tổng diện tích khuôn viên" });
    [["sắc phong", "Sắc phong còn lưu giữ"], ["bia", "Bia đá cổ"], ["câu đối", "Câu đối"], ["hoành phi", "Hoành phi"], ["cột đá", "Cột đá có văn khắc"], ["gian", "Nhà thờ chính"]]
      .forEach(function (k) {
        var m = new RegExp("(\\d+)\\s+" + k[0] + "(?![a-zà-ỹ])", "i").exec(s.architecture || "");
        if (m) out.push({ num: m[1] + (k[0] === "gian" ? " gian" : ""), label: k[1] });
      });
    return out.slice(0, 2);
  }
  function timeline(s) {
    var items = (s.timeline || []).map(function (t) {
      var m = /^(?:\d{1,2}\/\d{1,2}\/)?(\d{4})$/.exec(t.time || "");
      var full = m && t.time !== m[1];
      return { title: m ? m[1] : (t.time || ""), text: cap(t.text) + (full ? " (" + t.time + ")" : "") };
    });
    var f = VX.festivalsOf(s.id)[0];
    if (f && f.lunarTime) items.push({ title: lunar(f.lunarTime), text: f.name + " được tổ chức hằng năm." });
    return items;
  }
  function images(s) {
    var list = (s.media.gallery || []).slice();
    if (!list.length && s.media.hero) list.push(s.media.hero);
    return list.map(function (src, i) {
      var caps = s.captions || [];
      var labels = s.media.captions || {};
      return { src: VX.asset(src), caption: labels[src] || caps[i] || "Không gian " + s.name };
    });
  }

  /* ---------- render từng khối ---------- */
  function renderProse(s) {
    var html = "";
    if (s.narration && s.narration.sections.length) {
      s.narration.sections.forEach(function (sec, i) {
        if (i > 0 && sec.title) html += "<h3>" + esc(sec.title) + "</h3>";
        html += paras(sec.content);
        if (sec.source) html += '<small class="vxd-src">Nguồn: ' + esc(sec.source) + "</small>";
      });
    } else {
      html += paras(s.history || s.summary);
    }
    if (s.architecture) html += "<h3>Kiến trúc &amp; di vật</h3>" + paras(s.architecture);
    setHTML("prose", html);
    var prose = slot("prose");
    var text = prose.textContent.trim();
    if (text.length > 320) {
      var firstParagraph = prose.querySelector("p");
      var preview = (firstParagraph ? firstParagraph.textContent : text).trim();
      if (preview.length > 320) preview = preview.slice(0, 320).replace(/\s+\S*$/, "") + "…";
      prose.innerHTML = '<div data-intro-preview><p>' + esc(preview) + '</p></div>' +
        '<div id="introFull" hidden>' + html + '</div>' +
        '<button type="button" class="btn btn-sm btn-outline-danger" aria-expanded="false" aria-controls="introFull">Xem thêm</button>';
      var toggle = prose.querySelector("button");
      toggle.addEventListener("click", function () {
        var expanded = toggle.getAttribute("aria-expanded") !== "true";
        prose.querySelector("[data-intro-preview]").hidden = expanded;
        prose.querySelector("#introFull").hidden = !expanded;
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.textContent = expanded ? "Thu gọn" : "Xem thêm";
      });
    }

    var q = slot("quote");
    if (s.quote && s.quote.text) {
      q.hidden = false;
      q.querySelector("p").textContent = "“" + s.quote.text + "”";
      q.querySelector("cite").textContent = s.quote.cite || "";
    }
  }

  function renderStats(s) {
    setHTML("stats", stats(s).map(function (x, i) {
      return '<div class="vxd-stat"><b' + (i ? ' class="is-green"' : "") + ">" + esc(x.num) + "</b><span>" + esc(x.label) + "</span></div>";
    }).join(""));
  }

  function renderTimeline(s) {
    var items = timeline(s);
    slot("timelineSection").hidden = !items.length;
    slot("timeline").style.setProperty("--n", items.length);
    setHTML("timeline", items.map(function (t) {
      return "<li><h3>" + esc(t.title) + "</h3><p>" + esc(t.text) + "</p></li>";
    }).join(""));
  }

  function renderFestivals(s) {
    var list = VX.festivalsOf(s.id);
    if (!list.length) return setHTML("festivals", '<div class="vxd-empty">Thông tin lễ hội đang được cập nhật.</div>');
    setHTML("festivals", list.map(function (f) {
      var media = f.media || {};
      var image = media.cover || (media.gallery || [])[0];
      return '<article class="vxd-fest' + (image ? ' vxd-fest--with-image' : '') + '">' +
        (image ? '<img class="vxd-fest__image" src="' + esc(VX.asset(image)) + '" alt="' + esc(f.name) + '" loading="lazy">' : '') +
        '<div class="vxd-fest__body">' +
        '<div class="vxd-fest__head">' +
        "<h3>" + esc(f.name) + "<small>" + esc([lunar(f.lunarTime), f.solarTime].filter(Boolean).join(" · ")) + "</small></h3></div>" +
        (f.rituals ? "<p><strong>Nghi lễ:</strong> " + esc(f.rituals) + "</p>" : "") +
        (f.activities ? "<p><strong>Phần hội:</strong> " + esc(f.activities) + "</p>" : "") +
        "</div></article>";
    }).join(""));
  }

  function renderMap(s) {
    var el = slot("map");
    if (!el || typeof L === "undefined") return;
    var ll = [s.coords.lat, s.coords.lng];
    var map = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(ll, 15);
    /* Esri: không cần API key / Referer (OSM & CARTO chặn khi mở bằng file://) */
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, attribution: "Tiles © Esri"
    }).addTo(map);
    L.marker(ll, {
      title: s.name,
      icon: L.divIcon({ className: "vxd-pin", iconSize: [0, 0], html: '<span class="vxd-pin__label"><i class="bi bi-geo-alt-fill"></i> ' + esc(s.name) + '</span><span class="vxd-pin__dot"></span>' })
    }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);
  }

  function renderGallery(s) {
    var imgs = images(s);
    var shots = document.querySelectorAll(".vxd-gallery .vxd-shot");
    var btns = document.querySelectorAll("[data-gallery]");
    var start = 0;
    var gallery = document.getElementById("anh");
    var timer = null;
    var hovered = false;
    var touching = false;
    var inView = false;
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.getElementById("anh").hidden = !imgs.length;
    if (!imgs.length) return;
    function autoplay() {
      window.clearInterval(timer);
      timer = null;
      if (imgs.length <= 1 || hovered || touching || gallery.contains(document.activeElement) || document.hidden || !inView || reducedMotion.matches) return;
      timer = window.setInterval(function () {
        start = (start + 1) % imgs.length;
        draw();
      }, 5000);
    }
    function draw() {
      shots.forEach(function (fig, k) {
        var item = imgs.length ? imgs[(start + k) % imgs.length] : null;
        var show = item && (imgs.length > k || k === 0);
        fig.hidden = !show;
        var frame = fig.querySelector(".vxd-shot__frame");
        frame.innerHTML = show ? '<img loading="lazy" width="1200" height="900" src="' + esc(item.src) + '" alt="' + esc(item.caption) + '">' : "";
        fig.querySelector("figcaption").textContent = show ? item.caption : "";
      });
      var counter = document.querySelector("[data-gallery-status]");
      counter.textContent = String(start + 1).padStart(2, "0") + " / " + String(imgs.length).padStart(2, "0");
      counter.setAttribute("aria-label", "Ảnh " + (start + 1) + " trên " + imgs.length);
      btns.forEach(function (b) { b.disabled = imgs.length <= 1; });
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        start = (start + Number(b.getAttribute("data-gallery")) + imgs.length) % imgs.length;
        draw();
        autoplay();
      });
    });
    draw();
    gallery.addEventListener("mouseenter", function () { hovered = true; autoplay(); });
    gallery.addEventListener("mouseleave", function () { hovered = false; autoplay(); });
    gallery.addEventListener("focusin", autoplay);
    gallery.addEventListener("focusout", function () { window.setTimeout(autoplay, 0); });
    gallery.addEventListener("touchstart", function () { touching = true; autoplay(); }, { passive: true });
    function endTouch() { touching = false; autoplay(); }
    gallery.addEventListener("touchend", endTouch, { passive: true });
    gallery.addEventListener("touchcancel", endTouch, { passive: true });
    document.addEventListener("visibilitychange", autoplay);
    reducedMotion.addEventListener("change", autoplay);
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      autoplay();
    }, { threshold: 0.2 }).observe(gallery);
  }

  function renderQR() {
    var el = slot("qr");
    if (!el || typeof QRCode === "undefined") return;
    new QRCode(el, { text: location.href, width: 152, height: 152, colorDark: "#5c1114", colorLight: "#faf7f2", correctLevel: QRCode.CorrectLevel.M });
    el.removeAttribute("title");
    el.setAttribute("aria-label", "Mã QR mở trang này");
  }

  function renderDetail(s) {
    document.title = s.name + " – Di tích phường Vạn Xuân";
    document.getElementById("detailView").hidden = false;
    document.querySelectorAll("[data-href]").forEach(function (a) { a.href = VX.url(a.getAttribute("data-href")); });

    var hero = slot("heroImg");
    var heroSrc = s.media.hero || s.media.cover;
    if (heroSrc) { hero.src = VX.asset(heroSrc); hero.alt = s.name; } else hero.remove();

    setText("name", s.name);
    setText("crumbName", s.name);
    setText("address", s.address);
    setText("rank", rankShort(s));
    setText("rankLong", "Di tích " + rankShort(s).toLowerCase());
    setText("decision", decisionText(s));
    if (s.visitTime) setText("visitTime", s.visitTime);
    setText("headline", headline(s));
    setText("subline", s.tagline || (s.formerArea ? "Thuộc địa bàn " + s.formerArea : ""));
    setHref("directions", "https://www.google.com/maps/dir/?api=1&destination=" + s.coords.lat + "," + s.coords.lng);
    var hasVr = ((window.VX_VR360 || {}).tours || []).indexOf(s.id) > -1;
    setHref("vrLink", VX.url("vr360", { id: s.id }));
    slots("vrLink").forEach(function (el) { el.hidden = !hasVr; });
    setHref("mapLink", VX.url("map", { id: s.id }));

    renderProse(s);
    renderStats(s);
    renderTimeline(s);
    renderFestivals(s);
    renderGallery(s);
    renderMap(s);
    renderQR();
    if (location.hash) { var t = document.querySelector(location.hash); t && t.scrollIntoView(); }
  }

  function renderList() {
    var query = (VX.param("q") || "").trim();
    var sites = query ? VX.search(query) : VX.db.sites;
    document.title = (query ? "Tìm kiếm: " + query : "Danh sách di tích") + " – Phường Vạn Xuân";
    document.getElementById("listView").hidden = false;
    document.getElementById("listBody").innerHTML =
      '<div class="vx-head"><div class="vx-eyebrow">' + sites.length + (query ? ' kết quả tìm kiếm' : ' điểm di tích cấp tỉnh') + '</div><h1 class="vx-title">' + (query ? 'Kết quả cho “' + esc(query) + '”' : 'Danh sách di tích') + '</h1></div>' +
      (query ? '<p><a href="' + VX.url("detail") + '">Xem tất cả di tích</a></p>' : '') +
      (!sites.length ? '<p role="status">Không tìm thấy di tích phù hợp. Hãy thử tên khác hoặc từ khóa ngắn hơn.</p>' : '') +
      '<div class="vx-place-list">' + sites.map(function (s) {
        var media = s.media || {};
        var gallery = media.gallery || [];
        var firstPhoto = gallery.find(function (src) { return /\/1\.[^/]+$/i.test(src); }) || gallery[0];
        var image = media.avatar || firstPhoto;
        return '<div class="vx-place-list__item"><a class="vx-place-card' + (media.avatar ? ' vx-place-card--avatar' : '') + '" aria-labelledby="place-' + esc(s.id) + '" href="' + VX.url("detail", { id: s.id }) + '">' +
          (image ? '<img class="vx-place-card__image" width="1200" height="' + (media.avatar ? '1200' : '900') + '" loading="lazy" src="' + esc(VX.asset(image)) + '" alt="">' : "") +
          '<span class="vx-place-card__badge">' + esc(cap(String(s.rank || "Di tích").toLowerCase())) + '</span>' +
          '<div class="vx-place-card__content"><h2 id="place-' + esc(s.id) + '" class="vx-place-card__title">' + esc(s.name) + '</h2>' +
          '<div class="vx-place-card__reveal"><div class="vx-place-card__details"><p>' + esc(s.address) + '</p>' +
          '<span class="vx-place-card__cta">Xem chi tiết di tích <i class="bi bi-arrow-right" aria-hidden="true"></i></span>' +
          '</div></div></div></a></div>';
      }).join("") + "</div>";
  }

  function render() {
    var id = VX.param("id");
    if (!id) return renderList();
    var s = VX.site(id);
    if (!s) {
      document.getElementById("listView").hidden = false;
      document.getElementById("listBody").innerHTML = '<div class="alert alert-warning">Không tìm thấy di tích "<code>' + esc(id) + '</code>". <a href="' + VX.url("detail") + '">Xem danh sách</a></div>';
      return;
    }
    renderDetail(s);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
