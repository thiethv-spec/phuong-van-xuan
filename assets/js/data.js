/* =========================================================
   DỮ LIỆU CHO TRANG CHỦ – lấy từ root_data/vx-data.js (window.VX_DB, sinh từ Excel
   bằng tools/build_data.py). Chỉ phần ranh giới / nhãn địa danh bản đồ còn là dữ liệu MẪU.
   ========================================================= */
(function () {
  var DB = window.VX_DB || { sites: [], festivals: [] };
  var VX = window.VX;
  var A = VX ? VX.asset : function (p) { return p; };
  var detail = function (id) { return VX ? VX.url("detail", { id: id }) : "#"; };
  var withHero = DB.sites.filter(function (s) { return s.media.hero; });

window.VX_DATA = {
  /* Khám phá di tích (carousel): thẻ giới thiệu + các di tích có ảnh hero */
  heritage: [
    {
      type: "info",
      title: "Khu Lưu niệm<br>Tiến sĩ Nguyễn Cấu",
      desc: (VX && VX.site("khu_luu_niem_ts_nguyen_cau") || {}).summary || "",
      cta: "Xem chi tiết",
      url: detail("khu_luu_niem_ts_nguyen_cau")
    }
  ].concat(withHero.map(function (s) {
    return { title: s.name, image: A(s.media.hero), url: detail(s.id) };
  })),

  /* Sự kiện và Lễ hội: các lễ hội có ảnh */
  festivals: DB.festivals.filter(function (f) { return f.media.cover; }).slice(0, 6).map(function (f) {
    return { title: f.name, image: A(f.media.cover), url: detail(f.sites[0]) + "#le-hoi" };
  }),

  /* Bản đồ số */
  map: {
    center: DB.meta && DB.meta.center ? [DB.meta.center.lat, DB.meta.center.lng] : [21.398, 105.912],
    zoom: 14,
    places: [
      { name: "Xã Đắc Sơn", latlng: [21.4465, 105.815], size: 13 },
      { name: "Thị Xã<br>Phổ Yên", latlng: [21.4250, 105.8530], size: 16 },
      { name: "Xã Tân", latlng: [21.4050, 105.8690], size: 12 },
      { name: "Tiên", latlng: [21.4230, 105.8870], size: 12 },
      { name: "Tiên Phong", latlng: [21.3995, 105.8935], size: 12 }
    ],
    boundary: [
      [21.44673, 105.87179], [21.44673, 105.89604], [21.44346, 105.8951], [21.43577, 105.8966], [21.42615, 105.9007],
      [21.42327, 105.90723], [21.42231, 105.91375], [21.41269, 105.91841], [21.40692, 105.92494], [21.405, 105.92867],
      [21.39923, 105.93054], [21.39346, 105.93333], [21.38577, 105.93147], [21.37808, 105.92867], [21.37423, 105.92494],
      [21.37327, 105.91375], [21.37615, 105.90629], [21.37904, 105.89883], [21.38288, 105.89324], [21.38865, 105.88765],
      [21.39346, 105.88578], [21.39538, 105.88205], [21.39923, 105.87925], [21.39538, 105.87739], [21.39154, 105.87459],
      [21.38962, 105.87086], [21.38962, 105.86527], [21.38192, 105.85874], [21.37423, 105.85221], [21.37712, 105.84569],
      [21.38481, 105.84103], [21.38962, 105.83263], [21.39923, 105.82984], [21.41173, 105.8276], [21.41558, 105.8289],
      [21.41654, 105.83636], [21.41942, 105.84476], [21.42327, 105.85035], [21.42615, 105.85874], [21.43385, 105.85967],
      [21.43, 105.86247], [21.43385, 105.8662], [21.43577, 105.87086]
    ],
    /* 17 di tích – cover: ảnh bìa (có -> marker ảnh, không có -> marker số) */
    relics: DB.sites.map(function (s) {
      return { id: s.stt, key: s.id, name: s.name, latlng: [s.coords.lat, s.coords.lng],
               cover: s.media.avatar || s.media.cover ? A(s.media.avatar || s.media.cover) : undefined,
               url: detail(s.id) };
    })
  }
};
})();
