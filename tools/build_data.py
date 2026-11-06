"""
Chuyển file Excel di tích -> dữ liệu dùng cho website.

Nguồn : root_data/Danh_sach_17_di_tich_phuong_Van_Xuan.xlsx
Đích  : root_data/di_tich.json   – 17 di tích (thông tin chung + lịch sử + xếp hạng + thuyết minh + ảnh)
        root_data/le_hoi.json    – 14 lễ hội truyền thống
        root_data/vx-data.js     – gói 2 file trên thành window.VX_DB (chạy được cả khi mở file:// )

Chạy lại mỗi khi sửa Excel hoặc thêm ảnh:
    python tools/build_data.py
"""
import datetime as dt
import json
import re
import sys
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "root_data" / "Danh_sach_17_di_tich_phuong_Van_Xuan.xlsx"
OUT = ROOT / "root_data"
IMG_SITE = ROOT / "assets" / "img" / "dia_diem"
IMG_FEST = ROOT / "assets" / "img" / "le_hoi"
WEB_IMG = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}  # .HEIC không hiển thị được trên trình duyệt

# STT trong Excel -> id (= tên thư mục ảnh trong assets/img/dia_diem)
SITE_IDS = {
    1: "dinh_thu_lam", 2: "chua_doi_cao", 3: "dinh_gia_thu", 4: "chua_di",
    5: "dinh_phuc_duyen", 6: "khu_luu_niem_ts_nguyen_cau", 7: "dinh_xuan_tru",
    8: "chua_xuan_tru", 9: "dinh_phu_huong", 10: "dinh_yen_trung",
    11: "dinh_nguyen_hau", 12: "chua_nguyen_hau", 13: "dinh_gia_trung",
    14: "chua_gia_trung", 15: "dinh_thanh_thu", 16: "dinh_thanh_quang",
    17: "chua_man_tang",
}
# Tên hiển thị chuẩn hoá (Excel ghi tắt / sai chính tả ở một số dòng)
DISPLAY_NAME = {
    "khu_luu_niem_ts_nguyen_cau": "Khu lưu niệm Tiến sĩ Nguyễn Cấu",
}
# Tên gọi khác – dùng cho tìm kiếm
ALIASES = {
    "chua_doi_cao": ["Chùa Đôi Cao"],
    "chua_di": ["Chùa Cổ Di"],
    "khu_luu_niem_ts_nguyen_cau": ["Khu LN TS Nguyễn Cầu", "Nguyễn Cấu", "Nguyễn Cầu"],
    "dinh_thu_lam": ["Đình làng Thù Lâm"],
    "dinh_nguyen_hau": ["Đình làng Nguyễn Hậu"],
    "dinh_xuan_tru": ["Đình làng Xuân Trù"],
    "dinh_thanh_quang": ["Đình làng Thanh Quang"],
    "dinh_thanh_thu": ["Đình làng Thanh Thù"],
    "dinh_yen_trung": ["Đình làng Yên Trung"],
}
# Lễ hội (STT) -> các di tích gắn liền
FESTIVAL_SITES = {
    1: ["dinh_thu_lam"], 2: ["dinh_thu_lam"], 3: ["chua_doi_cao"],
    4: ["dinh_gia_thu", "chua_di"], 5: ["dinh_phuc_duyen"],
    6: ["khu_luu_niem_ts_nguyen_cau"], 7: ["dinh_xuan_tru", "chua_xuan_tru"],
    8: ["dinh_phu_huong"], 9: ["dinh_yen_trung"],
    10: ["dinh_nguyen_hau", "chua_nguyen_hau"], 11: ["dinh_gia_trung", "chua_gia_trung"],
    12: ["dinh_thanh_thu"], 13: ["dinh_thanh_quang"], 14: ["chua_man_tang"],
}
# Toạ độ do người dùng cung cấp (06/11/2026) – dùng để đối chiếu với Excel
COORDS_CHECK = {
    "khu_luu_niem_ts_nguyen_cau": (21.402397207031022, 105.90006894640375),
    "dinh_thu_lam": (21.384312206156693, 105.93443788340366),
    "dinh_nguyen_hau": (21.38825448805629, 105.93713202889045),
    "chua_man_tang": (21.404025917650767, 105.92972564432247),
    "dinh_xuan_tru": (21.383692005182358, 105.9300060169541),
    "chua_xuan_tru": (21.383302926875082, 105.9291047939877),
    "dinh_gia_trung": (21.378078312226464, 105.92115100046557),
    "chua_gia_trung": (21.379319873684935, 105.92475125534638),
    "dinh_phuc_duyen": (21.395907815879795, 105.89924430674282),
    "dinh_thanh_quang": (21.417667777409804, 105.88687191673559),
    "dinh_thanh_thu": (21.414199841875142, 105.89628676503541),
    "dinh_yen_trung": (21.397255823314165, 105.93827548950883),
    "chua_nguyen_hau": (21.390645844323682, 105.93673885773858),
    "dinh_phu_huong": (21.3893693514507, 105.88439125323049),
    "chua_doi_cao": (21.397359913497535, 105.89377327318726),
    "chua_di": (21.380684598093666, 105.91400822290848),
    "dinh_gia_thu": (21.384510766659222, 105.91784564667735),
}


# ---------------- helpers ----------------
def clean(v):
    if v is None:
        return None
    if isinstance(v, (dt.datetime, dt.date)):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, float) and v.is_integer():
        return int(v)
    if isinstance(v, str):
        v = v.strip()
        return None if v in ("", "—", "-") else v
    return v


HYPERLINK = re.compile(r'^=HYPERLINK\(\s*"([^"]+)"\s*,\s*"([^"]*)"\s*\)$', re.I)


def link(v):
    """=HYPERLINK("url","label") -> {url,label}; công thức ghép chuỗi -> None."""
    v = clean(v)
    if not v:
        return None
    m = HYPERLINK.match(v)
    if m:
        return {"url": m.group(1), "label": m.group(2)}
    if v.startswith("http"):
        return {"url": v, "label": v}
    return {"url": None, "label": v} if not v.startswith("=") else None


def rows(ws, header_row):
    """Trả về list dict theo dòng tiêu đề."""
    header = [clean(c) for c in next(ws.iter_rows(min_row=header_row, max_row=header_row, values_only=True))]
    out = []
    for r in ws.iter_rows(min_row=header_row + 1, values_only=True):
        if not any(c is not None for c in r):
            continue
        out.append(dict(zip(header, r)))
    return out


def find_header(ws):
    for i, r in enumerate(ws.iter_rows(values_only=True), start=1):
        if r and clean(r[0]) == "STT":
            return i
    raise ValueError(f"Không thấy dòng tiêu đề STT trong sheet {ws.title}")


def parse_timeline(text):
    """'12/11/2004: xếp hạng...\n2009: ...' -> [{time, text}]"""
    items = []
    for line in (text or "").splitlines():
        line = line.strip()
        if not line:
            continue
        time, sep, rest = line.partition(": ")
        items.append({"time": time.strip(), "text": rest.strip()} if sep else {"time": None, "text": line})
    return sort_timeline(items)


def sort_timeline(items):
    """Xếp theo năm (Excel có dòng ghi lệch thứ tự). Mốc không có năm giữ vị trí tương đối."""
    keyed, last = [], (-10**6,)
    for i, t in enumerate(items):
        time = t.get("time") or ""
        m = re.search(r"(?:(\d{1,2})/)?(?:(\d{1,2})/)?(\d{4})", time)
        if m:
            d, mo, y = m.group(1), m.group(2), int(m.group(3))
            if d and not mo:  # "5/2019" = tháng/năm
                d, mo = None, d
            last = (y, int(mo or 0), int(d or 0))
        keyed.append((last, i, t))
    return [t for _, _, t in sorted(keyed, key=lambda x: (x[0], x[1]))]


# ---------------- hiệu đính (root_data/hieu_dinh.json) ----------------
def set_path(obj, path, value):
    keys = [int(k) if k.isdigit() else k for k in path.split(".")]
    for k in keys[:-1]:
        obj = obj[k] if isinstance(k, int) else obj.setdefault(k, {})
    obj[keys[-1]] = value


def apply_corrections(records, corrections, warnings, kind):
    """corrections: {id: {"set": {"field.path": value}, "sources": [...]}}.
    Mỗi mục áp lên bản ghi và ghi vết vào record['corrections'] để truy nguồn."""
    by_id = {r["id"]: r for r in records}
    for rid, c in corrections.items():
        r = by_id.get(rid)
        if not r:
            warnings.append(f"hieu_dinh.json: không có {kind} '{rid}'")
            continue
        for path, value in (c.get("set") or {}).items():
            set_path(r, path, value)
        if "timeline" in r:
            r["timeline"] = sort_timeline(r["timeline"])
        r["corrections"] = c.get("log", [])


def images(folder: Path):
    if not folder.is_dir():
        return []
    files = [f for f in folder.iterdir() if f.suffix.lower() in WEB_IMG]
    key = lambda f: [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", f.stem)]
    return [f.relative_to(ROOT).as_posix() for f in sorted(files, key=key)]


def opt_file(p: Path):
    return p.relative_to(ROOT).as_posix() if p.is_file() else None


def site_type(name):
    n = name.lower()
    if n.startswith("đình"):
        return "dinh"
    if n.startswith("chùa"):
        return "chua"
    return "khu_luu_niem"


# ---------------- build ----------------
def main():
    wb = openpyxl.load_workbook(XLSX)
    s_list, s_detail, s_narr, s_fest = (wb[n] for n in wb.sheetnames[:4])

    detail_by_stt = {clean(r["STT"]): r for r in rows(s_detail, find_header(s_detail))}

    # --- thuyết minh: gom theo di tích (các dòng con ngay sau dòng tổng) ---
    narration = {}
    current = None
    for r in rows(s_narr, find_header(s_narr)):
        stt = r["STT"]
        topic, content = clean(r["Chủ đề / Phân đoạn thuyết minh"]), clean(r["Nội dung thuyết minh chi tiết"])
        if isinstance(stt, (int, float)):  # dòng tổng của 1 di tích
            current = {
                "siteName": clean(r["Tên di tích"]),
                "address": clean(r["Địa chỉ chi tiết"]),
                "gmapsApp": (link(r["Google Maps App"]) or {}).get("url"),
                "overview": {"title": topic, "content": content, "source": clean(r["Nguồn tư liệu & Căn cứ"])},
                "sections": [],
            }
            narration[int(stt)] = current
        elif current is not None:  # đoạn con (1.1, 1.2... bị Excel đổi thành ngày)
            title = re.sub(r"^Đoạn\s*\d+\s*:\s*", "", topic or "")
            current["sections"].append({"title": title, "content": content, "source": clean(r["Nguồn tư liệu & Căn cứ"])})
    # thuyết minh dùng STT riêng -> ghép theo tên
    def narr_for(names):
        for n in narration.values():
            nn = (n["siteName"] or "").lower().replace("niện", "niệm")
            if any(x.lower() in nn or nn in x.lower() for x in names):
                return n
        return None

    sites, warnings = [], []
    for r in rows(s_list, find_header(s_list)):
        stt = clean(r["STT"])
        sid = SITE_IDS[stt]
        raw_name = clean(r["Tên địa điểm"])
        name = DISPLAY_NAME.get(sid, raw_name)
        d = detail_by_stt.get(stt, {})
        lat, lng = (float(x) for x in clean(r["Tọa độ GPS"]).split(","))

        exp = COORDS_CHECK.get(sid)
        if exp and (abs(exp[0] - lat) > 1e-9 or abs(exp[1] - lng) > 1e-9):
            warnings.append(f"Toạ độ {sid} khác danh sách đối chiếu: excel={lat},{lng} vs {exp}")

        n = narr_for([name, raw_name])
        narr = None
        if n:
            secs = n["sections"] or [n["overview"]]
            narr = {"sections": secs, "address": n["address"]}

        gallery = images(IMG_SITE / sid)
        hero = opt_file(ROOT / "assets/img/hero" / f"{sid}.png")
        avatar = opt_file(ROOT / "assets/img/3x3_avatar" / f"{sid}.png")
        sources = [x for x in (link(d.get("Nguồn chính")), link(d.get("Nguồn bổ sung"))) if x and x.get("url")]
        extra_src = clean(d.get("Nguồn thuyết minh / đối chiếu thêm"))

        sites.append({
            "id": sid,
            "stt": stt,
            "name": name,
            "nameInSource": raw_name if raw_name != name else None,
            "aliases": ALIASES.get(sid, []),
            "type": site_type(name),
            "rank": clean(r["Loại di tích"]),
            "address": clean(r["Địa chỉ"]),
            "formerArea": clean(r["Địa bàn trước sáp nhập"]),
            "coords": {"lat": lat, "lng": lng},
            "gmaps": {
                "search": f"https://www.google.com/maps/search/?api=1&query={lat},{lng}",
                "app": n["gmapsApp"] if n else None,
                "listed": clean(r["Ghi chú"]) == "Vị trí đúng",
                "note": clean(r["Ghi chú"]),
            },
            "summary": clean(r["Thông tin chung"]),
            # Cột tuỳ chọn ở sheet "Thông tin chi tiết" – thêm vào Excel khi có nội dung biên tập
            "headline": clean(d.get("Tiêu đề giới thiệu")),
            "tagline": clean(d.get("Câu dẫn")),
            "quote": ({"text": clean(d.get("Câu trích dẫn")), "cite": clean(d.get("Nguồn trích dẫn"))}
                      if clean(d.get("Câu trích dẫn")) else None),
            "history": clean(d.get("Câu chuyện lịch sử")),
            "timeline": parse_timeline(clean(d.get("Các mốc thời gian quan trọng"))),
            "architecture": clean(d.get("Kiến trúc / di vật")),
            "recognition": {
                "text": clean(d.get("Quyết định chứng nhận di tích")),
                "number": clean(d.get("Số quyết định")),
                "date": clean(d.get("Ngày quyết định theo nguồn")),
                "issuer": clean(d.get("Cơ quan ban hành")),
                "scope": clean(d.get("Phạm vi xếp hạng")),
                "catalogRef": clean(d.get("Vị trí trong danh mục")),
                "docType": clean(d.get("Loại tài liệu đối chiếu")),
                "verifyStatus": clean(d.get("Trạng thái đối chiếu")),
                "verifyNote": clean(d.get("Ghi chú kiểm chứng")),
                "checkedAt": clean(d.get("Ngày tra cứu cấp tỉnh")),
            },
            "sources": sources + ([{"url": None, "label": extra_src}] if extra_src else []),
            "narration": narr,
            "festivals": [f"le_hoi_{k:02d}" for k, v in FESTIVAL_SITES.items() if sid in v],
            "media": {"hero": hero, "avatar": avatar, "cover": hero or (gallery[0] if gallery else None), "gallery": gallery},
            "vr360": None,  # TODO: điền khi có tour VR360 (vd: {"type": "pannellum", "src": "..."})
        })

    # --- lễ hội ---
    fest_dirs = {int(m.group(1)): p for p in IMG_FEST.iterdir() if p.is_dir() and (m := re.search(r"_(\d+)$", p.name))}
    festivals = []
    for r in rows(s_fest, find_header(s_fest)):
        stt = clean(r["STT"])
        fid = f"le_hoi_{stt:02d}"
        folder = fest_dirs.get(stt)
        gallery = images(folder) if folder else []
        festivals.append({
            "id": fid,
            "stt": stt,
            "name": clean(r["Tên lễ hội"]),
            "sites": FESTIVAL_SITES.get(stt, []),
            "sitesText": clean(r["Di tích gắn liền"]),
            "place": clean(r["Địa bàn tổ chức"]),
            "lunarTime": clean(r["Thời gian tổ chức (Âm lịch)"]),
            "solarTime": clean(r["Thời gian quy đổi (Dương lịch tham khảo)"]),
            "worship": clean(r["Đối tượng thờ phụng / Suy tôn"]),
            "rituals": clean(r["Nghi lễ chính"]),
            "activities": clean(r["Phần hội & Hoạt động đặc trưng"]),
            "source": clean(r["Nguồn tư liệu kiểm chứng"]),
            "sourceType": clean(r["Loại tư liệu"]),
            "article": link(r["Bài viết & Phóng sự ảnh"]),
            "video": link(r["Video tư liệu"]),
            "media": {"cover": gallery[0] if gallery else None, "gallery": gallery,
                      "folder": folder.relative_to(ROOT).as_posix() if folder else None},
        })

    # --- hiệu đính đã kiểm chứng (ưu tiên hơn Excel) ---
    hd_file = OUT / "hieu_dinh.json"
    if hd_file.is_file():
        hd = json.loads(hd_file.read_text(encoding="utf-8"))
        apply_corrections(sites, hd.get("sites", {}), warnings, "di tích")
        apply_corrections(festivals, hd.get("festivals", {}), warnings, "lễ hội")

    # --- kiểm tra ---
    if len(sites) != 17:
        warnings.append(f"Số di tích = {len(sites)} (kỳ vọng 17)")
    for s in sites:
        if not s["media"]["gallery"]:
            warnings.append(f"Chưa có ảnh: assets/img/dia_diem/{s['id']}/")
    for f in festivals:
        if not f["media"]["gallery"]:
            warnings.append(f"Lễ hội chưa có ảnh: {f['id']} ({f['name']})")
    heic = sorted(p.relative_to(ROOT).as_posix() for p in IMG_SITE.rglob("*") if p.suffix.lower() == ".heic")
    if heic:
        warnings.append(f"{len(heic)} ảnh .HEIC bị bỏ qua (trình duyệt không hỗ trợ) – cần đổi sang .jpg: " + ", ".join(heic))

    meta = {
        "title": "Di tích lịch sử – Phường Vạn Xuân, Tỉnh Thái Nguyên",
        "source": XLSX.name,
        "generatedAt": dt.datetime.now().isoformat(timespec="seconds"),
        "counts": {"sites": len(sites), "festivals": len(festivals)},
        "center": {"lat": round(sum(s["coords"]["lat"] for s in sites) / len(sites), 6),
                   "lng": round(sum(s["coords"]["lng"] for s in sites) / len(sites), 6)},
    }

    dump = lambda o: json.dumps(o, ensure_ascii=False, indent=2)
    (OUT / "di_tich.json").write_text(dump(sites), encoding="utf-8")
    (OUT / "le_hoi.json").write_text(dump(festivals), encoding="utf-8")
    (OUT / "vx-data.js").write_text(
        "/* TỰ SINH bởi tools/build_data.py từ " + XLSX.name + " – KHÔNG sửa tay. */\n"
        "window.VX_DB = " + dump({"meta": meta, "sites": sites, "festivals": festivals}) + ";\n",
        encoding="utf-8",
    )

    print(f"OK: {len(sites)} di tích, {len(festivals)} lễ hội -> root_data/di_tich.json, le_hoi.json, vx-data.js")
    for w in warnings:
        print("  ! " + w)


if __name__ == "__main__":
    sys.exit(main())
