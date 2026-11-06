# Di tích lịch sử – Phường Vạn Xuân

Site tĩnh (Bootstrap 5 + Leaflet), không cần build. Chạy được bằng cách mở file trực tiếp hoặc qua static server.

## Router – 4 trang

| Route    | File                    | URL / tham số                            |
|----------|-------------------------|------------------------------------------|
| `home`   | `index.html`            | Landing                                  |
| `detail` | `pages/di-tich.html`    | không `id` → danh sách; `?id=<id>` → chi tiết |
| `map`    | `pages/ban-do-so.html`  | Bản đồ số (MapLibre, bản build có sẵn) – đọc `root_data/map/map-data.js` |
| `vr360`  | `pages/vr360.html`      | `?id=<id>`                               |

Khai báo route ở `assets/js/router.js`. Luôn tạo link bằng `VX.url("detail", { id })`, ảnh bằng `VX.asset(path)`.
Mỗi trang đặt `<body data-route="...">`, `<div data-vx-header>` / `<div data-vx-footer>` (render bởi `assets/js/layout.js`).

Thứ tự nạp script: `root_data/vx-data.js` → `router.js` → `layout.js` → script của trang.

## Cấu trúc

```
index.html
pages/              di-tich.html, ban-do-so.html, vr360.html
assets/css/         theme.css (design tokens)
assets/js/          router.js, layout.js, data.js + app.js (landing), pages/*.js
assets/img/
  dia_diem/<id>/    ảnh gallery – tên thư mục = id di tích
  hero/<id>.png     ảnh hero    3x3_avatar/<id>.png  ảnh avatar
  le_hoi/<Ten>_<STT>/  ảnh lễ hội, STT khớp sheet "Lễ hội truyền thống"
root_data/
  Danh_sach_17_di_tich_phuong_Van_Xuan.xlsx   ← NGUỒN dữ liệu (sửa ở đây)
  di_tich.json, le_hoi.json, vx-data.js       ← tự sinh, không sửa tay
  map/map-data.js (+ .json)                   ← dữ liệu bản đồ số (schema maplibre-document v1)
tools/build_data.py
```

## Cập nhật dữ liệu

Sửa Excel hoặc thêm ảnh, rồi chạy:

```
python tools/build_data.py
python tools/build_map_data.py   # sinh root_data/map/map-data.js(.json) cho trang Bản đồ số
python tools/build_vr360.py      # sinh root_data/vr360/vr360-sites.js; tour từng di tích: root_data/vr360/tours/<id>.json
```

Ranh giới phường cho bản đồ số: `root_data/map/boundary_osm.geojson` (OpenStreetMap relation 19523082, © OpenStreetMap contributors, ODbL).

Script tự quét ảnh (bỏ qua `.HEIC`), đối chiếu toạ độ và in cảnh báo thiếu ảnh.
