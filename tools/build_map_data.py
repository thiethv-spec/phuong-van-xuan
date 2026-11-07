"""Sinh dữ liệu bản đồ số (root_data/map/map-data.json + map-data.js) cho pages/ban-do-so.html.

Nguồn:
  - root_data/vx-data.js            (17 di tích + 14 lễ hội, sinh bởi tools/build_data.py)
  - root_data/map/boundary_osm.geojson  (ranh giới phường Vạn Xuân – OSM relation 19523082)
  - configs/ssot/tour-routes.json   (4 tuyến tham quan di sản chuyên đề phường Vạn Xuân)

Chạy:  python tools/build_map_data.py      (sau khi chạy tools/build_data.py)
Không bịa dữ liệu: trường nào nguồn không có thì để trống.
"""
import json
import os
import re
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAP_DIR = os.path.join(ROOT, "root_data", "map")
CONFIGS_DIR = os.path.join(ROOT, "configs", "ssot")
SCENE = "van-xuan"
PLACEHOLDER = "https://placehold.co/800x600/EFE6D2/9E3B2E?text=No+Image"
SITE_COLOR = "#9e3b2e"

TYPE_VI = {"dinh": "Đình", "chua": "Chùa", "den": "Đền", "khu_luu_niem": "Khu lưu niệm"}
TYPE_EN = {"dinh": "Communal house", "chua": "Pagoda", "den": "Temple", "khu_luu_niem": "Memorial site"}

LUNAR_MONTH = {"giêng": 1, "chạp": 12}

RELIC_ID_TO_STT = {
    "relic-01": 1, "relic-02": 2, "relic-03": 3, "relic-04": 4,
    "relic-05": 5, "relic-06": 6, "relic-07": 7, "relic-08": 8,
    "relic-09": 9, "relic-10": 10, "relic-11": 11, "relic-12": 12,
    "relic-13": 13, "relic-14": 14, "relic-15": 15, "relic-16": 16,
    "relic-17": 17,
}

TOUR_EN_NAMES = {
    "T01": "Tien Phong Heritage Journey - Along Cau River",
    "T02": "Spiritual Space & Historical Figures Doi Cao - Thanh Thu",
    "T03": "Trans-Van Xuan Cultural Heritage Axis",
    "T04": "Van Xuan Heritage Loop (17 relics)",
}


def load_db():
    s = open(os.path.join(ROOT, "root_data", "vx-data.js"), encoding="utf-8").read()
    return json.loads(s[s.index("{"): s.rindex("}") + 1])


def load_tour_routes():
    path = os.path.join(CONFIGS_DIR, "tour-routes.json")
    if os.path.isfile(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def img(path):
    """Đường dẫn ảnh tính từ pages/ ; dùng khi file tồn tại hoặc trong môi trường build độc lập."""
    if path:
        if os.path.isfile(os.path.join(ROOT, path)) or not os.path.isdir(os.path.join(ROOT, "assets")):
            return "../" + path.replace("\\", "/")
    return None


def site_images(media):
    first = None
    for key in ("avatar", "hero", "cover"):
        first = first or img(media.get(key))
    gallery = [p for p in (img(g) for g in media.get("gallery") or []) if p]
    if first and first not in gallery:
        gallery.insert(0, first)
    first = first or (gallery[0] if gallery else None)
    return first or PLACEHOLDER, gallery or [PLACEHOLDER]


def parse_lunar(text):
    """'Mùng 6 - mùng 8 tháng Giêng' -> (tháng 1, ngày 6, 3 ngày). None nếu không đọc được ngày cụ thể."""
    t = (text or "").lower()
    month = None
    m = re.search(r"tháng\s+(giêng|chạp|\d+)", t)
    if m:
        g = m.group(1)
        month = int(g) if g.isdigit() else LUNAR_MONTH[g]
    if month is None:
        return None
    if "rằm" in t and not re.search(r"\d", t.split("rằm")[0]):
        return month, 15, 1
    days = [int(x) for x in re.findall(r"(?:mùng|ngày|đến|-)\s*(\d{1,2})", t)]
    if not days:
        nums = [int(x) for x in re.findall(r"\b(\d{1,2})\b", t.split("tháng")[0])]
        days = nums
    if not days:
        return None
    if "rằm" in t:
        days.append(15)
    return month, min(days), max(days) - min(days) + 1


def main():
    db = load_db()
    sites = sorted(db["sites"], key=lambda s: s["stt"])
    fests = db["festivals"]
    stt_to_site = {s["stt"]: s for s in sites}

    boundary = json.load(open(os.path.join(MAP_DIR, "boundary_osm.geojson"), encoding="utf-8"))
    ring = boundary["features"][0]["geometry"]["coordinates"][0]
    lats = [s["coords"]["lat"] for s in sites]
    lngs = [s["coords"]["lng"] for s in sites]
    center = [round((min(lngs) + max(lngs)) / 2, 6), round((min(lats) + max(lats)) / 2, 6)]

    items, legacy_sites, details = [], [], {}
    poi_members = []
    for s in sites:
        ll = [s["coords"]["lng"], s["coords"]["lat"]]
        image, images = site_images(s.get("media") or {})
        rec = s.get("recognition") or {}
        year = int(rec["date"][:4]) if rec.get("date") else None
        desc = s.get("summary") or ""
        t_vi = TYPE_VI.get(s.get("type"), "Di tích")
        items.append({
            "id": s["stt"], "map_scene": SCENE, "kind": "point", "name": s["name"],
            "data": {"ll": ll, "desc": desc, "color": SITE_COLOR, "size": 8, "marker": {
                "version": 1, "category_id": "cultural_heritage", "entity_type": "cultural_heritage",
                "tier": 2, "priority": 5, "stem_level": 0, "has_3d_model": False,
                "min_zoom": 0, "max_zoom": 24, "icon": str(s["stt"]),
                "custom_attributes": {"source_id": s["id"]},
                "action": "fly_to", "action_config": {}}},
            "is_visible": True, "sort_order": s["stt"],
        })
        poi_members.append({"entity_id": s["stt"], "entity_type": "marker", "role": "secondary_facility",
                            "stop_order": None, "transit_time_from_prev": 0})
        legacy_sites.append({
            "id": s["id"], "ll": ll, "stem": 0, "image": image, "images": images,
            "yearRanked": year,
            "vi": {"n": s["name"], "t": t_vi, "d": desc},
            "en": {"n": s["name"], "t": TYPE_EN.get(s.get("type"), "Heritage site"), "d": desc},
        })
        timeline = [{"no": str(i + 1), "year": e.get("time") or "", "text": e.get("text") or ""}
                    for i, e in enumerate(s.get("timeline") or [])]
        details[s["id"]] = {
            "name": s["name"], "nameEn": s["name"],
            "rank": "Di tích lịch sử " + (s.get("rank") or "").lower() if s.get("rank") else "",
            "rankMeta": rec.get("text") or "",
            "worship": "", "era": "",
            "location": s.get("address") or "", "distance": "", "access": "",
            "overview": s.get("history") or desc,
            "facts": [f for f in [
                {"k": "Xếp hạng", "v": (s.get("rank") or "") + (" · " + str(year) if year else "")} if s.get("rank") else None,
                {"k": "Quyết định", "v": rec.get("number")} if rec.get("number") else None,
                {"k": "Khu vực cũ", "v": s.get("formerArea")} if s.get("formerArea") else None,
            ] if f],
            "timeline": timeline,
            "deitiesTitle": "", "deitiesIntro": "", "deities": [],
            "architecturePlan": s.get("architecture") or "",
            "exterior": [], "interior": [], "relicsIntro": "", "relics": [],
            "festivalDays": [], "festivalRite": "", "festivalImg": image,
            "conservation": "",
            "gallery": images,
        }

    by_id = {s["id"]: s for s in sites}
    legacy_fests = []
    for f in fests:
        site_ids = [x for x in f.get("sites") or [] if x in by_id]
        if not site_ids:
            continue
        first = by_id[site_ids[0]]
        parsed = parse_lunar(f.get("lunarTime"))
        entry = {
            "id": f["id"], "group": "le-hoi", "ll": [first["coords"]["lng"], first["coords"]["lat"]],
            "c": SITE_COLOR, "cal": "al", "siteIds": site_ids,
            "vi": {"n": f["name"], "d": f.get("activities") or "", "s": "",
                   "dl": f.get("lunarTime") or "",
                   "intro": [p for p in [f.get("worship") and "Thờ: " + f["worship"],
                                         f.get("rituals") and "Phần lễ: " + f["rituals"],
                                         f.get("activities") and "Phần hội: " + f["activities"]] if p]},
            "en": {"n": f["name"], "d": "", "s": "", "dl": f.get("solarTime") or "", "intro": []},
        }
        if parsed:
            entry["m"], entry["d"], entry["dur"] = parsed
        cover = img((f.get("media") or {}).get("cover"))
        if cover:
            entry["img"] = cover
        legacy_fests.append(entry)
        for sid in site_ids:
            details[sid]["festivalDays"].append({"k": f.get("lunarTime") or "", "v": f["name"]})

    boundary_id = len(sites) + 1
    items.append({"id": boundary_id, "map_scene": SCENE, "kind": "landscape", "name": "Ranh giới phường Vạn Xuân",
                  "data": {"polygon": ring}, "is_visible": True, "sort_order": boundary_id})

    # --- Tuyến tham quan (Tour routes) ---
    tour_routes = load_tour_routes()
    entity_groups = [
        {"group_id": "van-xuan-ranh-gioi", "group_type": "zoning_cluster", "group_name": "Ranh giới hành chính",
         "slug": "ranh-gioi", "theme_color": "#ff7a3d", "icon": "V", "filter_priority": 5,
         "visibility_default": True, "inherit_styling": False,
         "members": [{"entity_id": boundary_id, "entity_type": "polygon", "role": "boundary",
                      "stop_order": None, "transit_time_from_prev": 0}],
         "route_polyline_id": None, "metadata": {}},
        {"group_id": "van-xuan-dia-diem", "group_type": "poi_category", "group_name": "Di tích",
         "slug": "dia-diem", "theme_color": SITE_COLOR, "icon": "VX", "filter_priority": 0,
         "visibility_default": True, "inherit_styling": False, "members": poi_members,
         "route_polyline_id": None, "metadata": {}},
    ]

    legacy_tours = []
    if tour_routes and "features" in tour_routes:
        for idx, feat in enumerate(tour_routes["features"], start=1):
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [])
            route_id = props.get("route_id", f"T{idx:02d}")
            name = props.get("name", f"Tuyến {idx}")
            dist = props.get("distance_km", 0)
            dur = props.get("duration_hours", 0)
            color = props.get("color", "#d6493a")
            relic_ids = props.get("relic_ids", [])

            line_item_id = boundary_id + idx
            items.append({
                "id": line_item_id,
                "map_scene": SCENE,
                "kind": "line",
                "name": name,
                "data": {
                    "coords": coords,
                    "cap_duong": "duong_xa",
                    "route_type": "tourist_trail",
                    "colorOverride": color,
                    "animation_config": {
                        "version": 1,
                        "timing": "duration",
                        "duration_ms": max(int(dur * 3600), 12000),
                        "fit_bounds": True,
                        "focus_duration_ms": 2500,
                        "chase_cam": {
                            "enabled": True,
                            "pitch": 38,
                            "smoothing": 0.045,
                            "follow_distance_m": 200,
                        },
                    },
                },
                "is_visible": True,
                "sort_order": line_item_id,
            })

            stt_list = [RELIC_ID_TO_STT[rid] for rid in relic_ids if rid in RELIC_ID_TO_STT]
            route_members = [{
                "entity_id": line_item_id,
                "entity_type": "polyline",
                "role": "primary_path",
                "stop_order": None,
                "transit_time_from_prev": 0,
            }]
            for stop_idx, stt in enumerate(stt_list, start=1):
                route_members.append({
                    "entity_id": stt,
                    "entity_type": "marker",
                    "role": "stop_point",
                    "stop_order": stop_idx,
                    "transit_time_from_prev": 3,
                })

            entity_groups.append({
                "group_id": f"van-xuan-{route_id.lower()}",
                "group_type": "tour_route",
                "group_name": f"{route_id}: {name}",
                "slug": route_id.lower(),
                "theme_color": color,
                "icon": "T",
                "filter_priority": idx,
                "visibility_default": True,
                "inherit_styling": False,
                "members": route_members,
                "route_polyline_id": line_item_id,
                "metadata": {
                    "total_distance_km": dist,
                    "estimated_duration_hours": dur,
                    "hold_ms": 6000,
                    "fly_ms": 3000,
                    "orbit_speed_deg_s": 3.5,
                    "transport_mode": "car" if idx in (2, 3) else "mixed",
                },
            })

            site_keys = [stt_to_site[stt]["id"] for stt in stt_list if stt in stt_to_site]
            legacy_tours.append({
                "id": route_id,
                "color": color,
                "vi": {"n": name},
                "en": {"n": TOUR_EN_NAMES.get(route_id, name)},
                "sites": site_keys,
                "wp": coords,
            })

    doc = {
        "schema": "maplibre-document", "version": 1,
        "title": "Bản đồ số di tích — Phường Vạn Xuân",
        "payload": {
            "map_info": {
                "id": SCENE, "name": "Bản đồ số di tích — Phường Vạn Xuân",
                "project_name": "Phường Vạn Xuân · Thái Nguyên",
                "center": center, "zoom": 13, "pitch": 0, "bearing": 0, "fov": 45,
                "default_layer": "satellite",
                "layer_config": {
                    "boundary_geojson": boundary,
                    "boundary_style": {"color": "#ff7a3d", "width": 3, "fill": 0.04, "dash": True, "dashColor": "#ffffff"},
                    "document_mask_outside": True,
                    "dem_enabled": False,
                    "entity_groups": entity_groups,
                    "document_provenance": {
                        "source": "tools/build_map_data.py từ root_data/vx-data.js",
                        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                        "boundary": "OpenStreetMap relation 19523082 (Phường Vạn Xuân, admin_level 6), © OpenStreetMap contributors, ODbL",
                        "ubnd": "Chưa có toạ độ trụ sở UBND phường trong dữ liệu nguồn -> ẩn",
                        "festival_dates": "m/d/dur đọc từ cột 'lunarTime'; lễ hội không có ngày cụ thể thì bỏ trống",
                        "tour_routes": "configs/ssot/tour-routes.json (4 tuyến tham quan di sản Phường Vạn Xuân)",
                    },
                },
            },
            "editor_items": items,
            "models": [], "vegetation_layers": [], "embed_options": {},
        },
        "presentation": {"legacy": {
            "sites": legacy_sites, "villages": [], "festivals": legacy_fests,
            "tienich": [], "dulich": [],
            "ubnd": {"hidden": True, "ll": center, "image": PLACEHOLDER,
                     "vi": {"n": "", "t": "", "d": ""}, "en": {"n": "", "t": "", "d": ""}},
            "tours": legacy_tours, "proads": [], "details": details, "audio": {},
            "default_basemap": "hybrid",
        }},
    }

    with open(os.path.join(MAP_DIR, "map-data.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=2)
    with open(os.path.join(MAP_DIR, "map-data.js"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("window.__MAPLIBRE_DOCUMENT__ = ")
        json.dump(doc, fh, ensure_ascii=False, indent=2)
        fh.write(";\n")
    no_img = [s["id"] for s in legacy_sites if s["image"] == PLACEHOLDER]
    no_date = [f["id"] for f in legacy_fests if "m" not in f]
    print("map-data: %d di tích, %d lễ hội, %d tuyến tham quan" % (len(legacy_sites), len(legacy_fests), len(legacy_tours)))
    if no_img:
        print("  ! thiếu ảnh:", ", ".join(no_img))
    if no_date:
        print("  ! lễ hội chưa có ngày cụ thể:", ", ".join(no_date))


if __name__ == "__main__":
    main()
