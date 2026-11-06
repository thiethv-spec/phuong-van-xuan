"""Sinh dữ liệu VR360 theo di tích Vạn Xuân.

Đầu vào
  root_data/vx-data.js                   danh sách di tích (id, tên, ảnh...)
  root_data/vr360/tours/<site_id>.json   tour xuất từ vr360-builder ({"title", "scenes": [...]})
                                         tên file = id di tích, vd chua_man_tang.json
Đầu ra
  root_data/vr360/vr360-sites.js         window.VX_VR360 = { locations, tours, items }
                                         (đọc bởi pages/vr360.html, pages/vr360-dia-diem.html, trang chi tiết)
  root_data/vr360/tours/<site_id>.js     tour nạp lười theo điểm (chạy được cả file://)

Chạy:  python tools/build_vr360.py   (sau tools/build_data.py)
"""
import glob
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VR_DIR = os.path.join(ROOT, "root_data", "vr360")
TOUR_DIR = os.path.join(VR_DIR, "tours")


def load_db():
    s = open(os.path.join(ROOT, "root_data", "vx-data.js"), encoding="utf-8").read()
    return json.loads(s[s.index("{"):s.rindex("}") + 1])


def main():
    sites = {s["id"]: s for s in load_db()["sites"]}
    files = {os.path.basename(f)[:-5]: f for f in glob.glob(os.path.join(TOUR_DIR, "*.json"))}
    unknown = sorted(k for k in files if k not in sites)
    tour_ids = sorted((k for k in files if k in sites), key=lambda k: sites[k]["stt"])

    # xoá file .js cũ không còn tour tương ứng
    for old in glob.glob(os.path.join(TOUR_DIR, "*.js")):
        if os.path.basename(old)[:-3] not in tour_ids:
            os.remove(old)

    locations, items = {}, []
    for sid in tour_ids:
        tour = json.load(open(files[sid], encoding="utf-8"))
        tour = tour.get("data", tour) if "scenes" not in tour else tour
        if not tour.get("title") or tour.get("title") == "VR360 Virtual Tour":
            tour["title"] = sites[sid]["name"]  # màn mở đầu hiện tên di tích (không sửa file .json gốc)
        with open(os.path.join(TOUR_DIR, sid + ".js"), "w", encoding="utf-8", newline="\n") as fh:
            fh.write("window.VX_VR360_TOUR = window.VX_VR360_TOUR || {};\n")
            fh.write("window.VX_VR360_TOUR[%s] = " % json.dumps(sid))
            json.dump(tour, fh, ensure_ascii=False, separators=(",", ":"))
            fh.write(";\n")
        site = sites[sid]
        locations[sid] = {"locationId": None, "locationName": site["name"]}
        items.append({"id": sid, "name": site["name"],
                      "scenes": [str(sc.get("name", "")).strip() for sc in tour.get("scenes", [])]})

    out = {"locations": locations, "tours": tour_ids, "items": items}
    with open(os.path.join(VR_DIR, "vr360-sites.js"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("/* Tự sinh bởi tools/build_vr360.py – không sửa tay */\n")
        fh.write("window.VX_VR360 = ")
        json.dump(out, fh, ensure_ascii=False, indent=2)
        fh.write(";\n")
    print("vr360: %d tour -> %s" % (len(items), ", ".join("%s (%d cảnh)" % (i["id"], len(i["scenes"])) for i in items)))
    if unknown:
        print("  ! file tour không khớp id di tích nào (bỏ qua):", ", ".join(unknown))


if __name__ == "__main__":
    main()
