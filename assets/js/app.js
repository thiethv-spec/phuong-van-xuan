(function () {
  "use strict";
  var D = window.VX_DATA || {};
  var css = getComputedStyle(document.documentElement);
  var token = function (name) { return css.getPropertyValue(name).trim(); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var state = { map: null, markers: [] };
  var tpl = function (id) { return document.getElementById(id).content.firstElementChild; };

  /* ---------- Khám phá di tích ---------- */
  function renderHeritage() {
    var track = document.getElementById("heritageTrack");
    if (!track || !D.heritage) return;
    D.heritage.forEach(function (item) {
      var node;
      if (item.type === "info") {
        node = tpl("tplCardInfo").cloneNode(true);
        node.querySelector("h3").innerHTML = item.title; // cho phép <br>
        node.querySelector("p").textContent = item.desc;
        var btn = node.querySelector(".btn");
        btn.textContent = item.cta; btn.href = item.url;
      } else {
        node = tpl("tplCardPhoto").cloneNode(true);
        var a = node.querySelector(".vx-card");
        a.href = item.url; a.setAttribute("aria-label", item.title);
        var img = node.querySelector("img");
        img.src = item.image; img.alt = item.title;
        node.querySelector(".vx-card__title").textContent = item.title;
      }
      track.appendChild(node);
    });
    initCarousel(track);
  }

  function initCarousel(track) {
    var prev = document.querySelector("[data-carousel-prev]");
    var next = document.querySelector("[data-carousel-next]");
    var step = function () {
      var item = track.querySelector(".vx-carousel__item");
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return item ? item.getBoundingClientRect().width + gap : track.clientWidth;
    };
    // Cuộn theo từng thẻ, hết danh sách thì quay vòng
    var go = function (dir) {
      var max = track.scrollWidth - track.clientWidth;
      var left = track.scrollLeft;
      if (dir > 0 && left >= max - 2) return track.scrollTo({ left: 0, behavior: "smooth" });
      if (dir < 0 && left <= 2) return track.scrollTo({ left: max, behavior: "smooth" });
      track.scrollBy({ left: dir * step(), behavior: "smooth" });
    };
    prev.addEventListener("click", function () { go(-1); });
    next.addEventListener("click", function () { go(1); });
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

  /* ---------- Bản đồ số ---------- */
  function initMap() {
    var el = document.getElementById("vxMap");
    if (!el || typeof L === "undefined" || !D.map) return;
    var M = D.map;
    var map = L.map(el, { zoomControl: false, scrollWheelZoom: false, attributionControl: true }).setView(M.center, M.zoom);
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

    var baseStreet = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: 'Tile © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    var baseSat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, attribution: "Tiles © Esri"
    });

    // Ranh giới phường
    var boundary = L.polygon(M.boundary, {
      color: token("--vx-crimson-800"), weight: 2.5, dashArray: "6 6",
      fillColor: token("--vx-gold-350"), fillOpacity: 0.32
    }).addTo(map);

    // Nhãn địa danh
    (M.places || []).forEach(function (p) {
      L.tooltip({ permanent: true, direction: "center", className: "vx-place", interactive: false })
        .setLatLng(p.latlng).setContent('<span style="font-size:' + (p.size || 12) + 'px">' + p.name + "</span>").addTo(map);
    });

    // Marker di tích
    var markers = L.layerGroup().addTo(map);
    var markerList = [];
    M.relics.forEach(function (r) {
      var hasCover = !!r.cover;
      var size = hasCover ? 40 : 30;
      var html = hasCover
        ? '<div class="vx-marker__pin"><img src="' + esc(r.cover) + '" alt=""></div><span class="vx-marker__num">' + r.id + "</span>"
        : '<div class="vx-marker__pin">' + r.id + "</div>";
      var icon = L.divIcon({
        className: "vx-marker" + (hasCover ? "" : " vx-marker--plain"),
        html: html, iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2]
      });
      var m = L.marker(r.latlng, { icon: icon, title: r.name, riseOnHover: true })
        .bindPopup('<div class="vx-popup">' + (hasCover ? '<img src="' + esc(r.cover) + '" alt="">' : "") +
          "<h4>" + esc(r.name) + "</h4><small>Điểm số " + r.id + "</small>" +
          (r.url ? '<br><a href="' + esc(r.url) + '">Xem chi tiết</a>' : "") + "</div>")
        .bindTooltip(esc(r.name), { direction: "top", offset: [0, -size / 2], className: "vx-label" });
      m.addTo(markers);
      markerList.push({ data: r, marker: m });
    });

    // Cặp điểm gần nhau (mỗi điểm nối với láng giềng gần nhất) + cặp xa nhất
    var colorFor = function (d) {
      if (d < 250) return token("--vx-dist-1");
      if (d < 750) return token("--vx-dist-2");
      if (d < 1500) return token("--vx-dist-3");
      return token("--vx-dist-4");
    };
    var near = L.layerGroup().addTo(map);
    var far = L.layerGroup().addTo(map);
    var pts = M.relics.map(function (r) { return L.latLng(r.latlng); });
    var seen = {}, farPair = null, farDist = 0;
    pts.forEach(function (a, i) {
      var best = -1, bestD = Infinity;
      pts.forEach(function (b, j) {
        if (i === j) return;
        var d = a.distanceTo(b);
        if (d < bestD) { bestD = d; best = j; }
        if (d > farDist) { farDist = d; farPair = [a, b]; }
      });
      var key = Math.min(i, best) + "-" + Math.max(i, best);
      if (best > -1 && !seen[key]) {
        seen[key] = 1;
        L.polyline([a, pts[best]], { color: colorFor(bestD), weight: 2.5, opacity: 0.9 })
          .bindTooltip(Math.round(bestD) + " m", { sticky: true, className: "vx-label" }).addTo(near);
      }
    });
    if (farPair) {
      L.polyline(farPair, { color: token("--vx-dist-far"), weight: 2, dashArray: "6 6" })
        .bindTooltip("Cặp xa nhất: " + (farDist / 1000).toFixed(2) + " km", { sticky: true, className: "vx-label" }).addTo(far);
    }
    state.map = map; state.markers = markerList;
    markers.eachLayer(function (l) { l.bringToFront && l.bringToFront(); });

    // Toolbar
    var bind = function (id, layer) {
      var cb = document.getElementById(id);
      if (!cb) return;
      cb.addEventListener("change", function () { cb.checked ? layer.addTo(map) : map.removeLayer(layer); });
    };
    bind("fltBoundary", boundary);
    bind("fltNear", near);
    bind("fltFar", far);

    var labels = document.getElementById("fltLabels");
    labels && labels.addEventListener("change", function () {
      markerList.forEach(function (o) {
        var t = o.marker.getTooltip();
        o.marker.unbindTooltip();
        o.marker.bindTooltip(t.getContent(), { direction: "top", offset: t.options.offset, className: "vx-label", permanent: labels.checked });
        if (labels.checked) o.marker.openTooltip();
      });
    });

    var allBounds = boundary.getBounds();
    M.relics.forEach(function (r) { allBounds.extend(r.latlng); });
    var fit = function () { map.fitBounds(allBounds, { paddingTopLeft: [24, 64], paddingBottomRight: [24, 24] }); };
    document.getElementById("btnFitBoundary").addEventListener("click", fit);
    fit();

    var layerBtn = document.getElementById("btnLayer");
    layerBtn.addEventListener("click", function () {
      var sat = map.hasLayer(baseSat);
      map.removeLayer(sat ? baseSat : baseStreet);
      (sat ? baseStreet : baseSat).addTo(map);
      layerBtn.classList.toggle("is-active", !sat);
      el.classList.toggle("is-satellite", !sat);
    });

    var legendBtn = document.getElementById("btnLegend");
    legendBtn && legendBtn.addEventListener("click", function () {
      document.querySelector(".vx-legend").classList.toggle("is-open");
    });

    // Cho phép cuộn zoom sau khi người dùng chạm vào bản đồ
    map.once("focus", function () { map.scrollWheelZoom.enable(); });
  }

  /* ---------- Tìm kiếm (hero) ---------- */
  function initSearch() {
    var form = document.getElementById("heroSearch");
    form && form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = form.q.value.trim().toLowerCase();
      if (!q) return;
      document.getElementById("ban-do").scrollIntoView({ behavior: "smooth" });
      var hit = state.markers.filter(function (o) { return o.data.name.toLowerCase().indexOf(q) > -1; })[0];
      if (hit && state.map) {
        state.map.setView(hit.data.latlng, 16);
        setTimeout(function () { hit.marker.openPopup(); }, 400);
      }
    });
    var list = document.getElementById("relicNames");
    if (list && D.map) D.map.relics.forEach(function (r) {
      var o = document.createElement("option"); o.value = r.name; list.appendChild(o);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderHeritage();
    renderFestivals();
    initMap();
    initSearch();
  });
})();
