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
      return { src: VX.asset(src), caption: caps[i] || (i === 0 ? "Toàn cảnh " + s.name : s.name + " – ảnh " + (i + 1)) };
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
    setHTML("festivals", list.map(function (f, i) {
      var links = "";
      if (f.article && f.article.url) links += '<a target="_blank" rel="noopener" href="' + esc(f.article.url) + '"><i class="bi bi-newspaper" aria-hidden="true"></i> ' + esc(f.article.label || "Đọc bài viết") + "</a>";
      if (f.video && f.video.url) links += '<a target="_blank" rel="noopener" href="' + esc(f.video.url) + '"><i class="bi bi-play-circle" aria-hidden="true"></i> ' + esc(f.video.label || "Xem video") + "</a>";
      return '<article class="vxd-fest">' +
        '<div class="vxd-fest__head"><span class="vxd-fest__icon"><i class="bi bi-flag" aria-hidden="true"></i></span>' +
        "<h4>" + (i + 1) + ". " + esc(f.name) + "<small>" + esc([lunar(f.lunarTime), f.solarTime].filter(Boolean).join(" · ")) + "</small></h4></div>" +
        (f.rituals ? "<p><strong>Nghi lễ:</strong> " + esc(f.rituals) + "</p>" : "") +
        (f.activities ? "<p><strong>Phần hội:</strong> " + esc(f.activities) + "</p>" : "") +
        (links ? '<div class="vxd-fest__links">' + links + "</div>" : "") +
        "</article>";
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
    document.getElementById("anh").hidden = !imgs.length;
    if (!imgs.length) return;
    function draw() {
      shots.forEach(function (fig, k) {
        var item = imgs.length ? imgs[(start + k) % imgs.length] : null;
        var show = item && (imgs.length > k || k === 0);
        var frame = fig.querySelector(".vxd-shot__frame");
        frame.innerHTML = show ? '<img loading="lazy" src="' + esc(item.src) + '" alt="' + esc(item.caption) + '">' : "";
        fig.querySelector("figcaption").textContent = show ? item.caption : "";
      });
      btns.forEach(function (b) { b.disabled = imgs.length <= shots.length; });
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        start = (start + Number(b.getAttribute("data-gallery")) + imgs.length) % imgs.length;
        draw();
      });
    });
    draw();
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
    document.title = "Danh sách di tích – Phường Vạn Xuân";
    document.getElementById("listView").hidden = false;
    document.getElementById("listBody").innerHTML =
      '<div class="vx-head"><div class="vx-eyebrow">' + VX.db.sites.length + ' điểm di tích cấp tỉnh</div><h1 class="vx-title">Danh sách di tích</h1></div>' +
      '<div class="row g-3">' + VX.db.sites.map(function (s) {
        return '<div class="col-12 col-md-6 col-lg-4"><a class="card h-100 text-decoration-none" href="' + VX.url("detail", { id: s.id }) + '">' +
          (s.media.cover ? '<img class="card-img-top" style="aspect-ratio:4/3;object-fit:cover" loading="lazy" src="' + VX.asset(s.media.cover) + '" alt="">' : "") +
          '<div class="card-body"><small class="text-muted">' + s.stt + " · " + esc(s.rank) + '</small><h2 class="h6 mt-1 mb-1">' + esc(s.name) + "</h2>" +
          '<small class="text-muted">' + esc(s.address) + "</small></div></a></div>";
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
