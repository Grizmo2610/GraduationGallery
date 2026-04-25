from flask import Flask, jsonify, render_template, request
import json
import os

app = Flask(__name__)

IMAGES_META_PATH = "images_data.json"
OBJECTS_META_PATH = "objects_meta.json"
IDS_PATH = "ids.json"

_cache_images = None
_cache_objects = None
_cache_ids = None
_cache_built = None          # Cache build_images() result
_cache_filtered = {}         # Cache filtered results theo key


def load_json(path):
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_images():
    global _cache_images
    if _cache_images is None:
        _cache_images = load_json(IMAGES_META_PATH) or []
    return _cache_images


def get_objects():
    global _cache_objects
    if _cache_objects is None:
        _cache_objects = load_json(OBJECTS_META_PATH) or {}
    return _cache_objects


def get_ids():
    global _cache_ids
    if _cache_ids is None:
        _cache_ids = load_json(IDS_PATH) or {}
    return _cache_ids


def build_images():
    """Build một lần, cache mãi mãi."""
    global _cache_built
    if _cache_built is not None:
        return _cache_built

    images_data = get_images()
    objects_meta = get_objects()
    ids = get_ids()

    result = []
    for item in images_data:
        image_path = item.get("image_path", "")
        subject_ids = item.get("subjects", [])

        subjects = []
        for sid in subject_ids:
            obj = objects_meta.get(sid)
            if obj:
                raw_name = obj.get("name")
                encoded_name = ids.get(raw_name)
                if encoded_name:
                    subjects.append(encoded_name)

        filename = os.path.basename(image_path) if image_path else ""
        result.append({
            "id": filename,
            "img_src": image_path,
            "view_link": image_path,
            "download_link": image_path,
            "subjects": subjects,
            # Lưu thêm set để filter nhanh O(1)
            "_subjects_set": set(subjects),
        })

    _cache_built = result
    return result


def get_filtered(selected_list, strict):
    """Cache filtered list theo (selected_tuple, strict)."""
    global _cache_filtered

    key = (tuple(sorted(selected_list)), strict)
    if key in _cache_filtered:
        return _cache_filtered[key]

    data = build_images()

    if not selected_list:
        _cache_filtered[key] = data
        return data

    selected_set = set(selected_list)
    filtered = []
    for img in data:
        s = img["_subjects_set"]
        ok = selected_set.issubset(s) if strict else not selected_set.isdisjoint(s)
        if ok:
            filtered.append(img)

    _cache_filtered[key] = filtered
    return filtered


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/images")
def api_images():
    page  = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 30))

    selected  = request.args.get("selected", "")
    strict    = request.args.get("strict", "0") == "1"
    selected_list = [s for s in selected.split(",") if s]

    data  = get_filtered(selected_list, strict)
    total = len(data)
    start = (page - 1) * limit
    end   = start + limit

    # Bỏ _subjects_set trước khi trả về
    page_data = [
        {k: v for k, v in img.items() if k != "_subjects_set"}
        for img in data[start:end]
    ]

    return jsonify({
        "page":     page,
        "limit":    limit,
        "total":    total,
        "has_more": end < total,
        "data":     page_data,
    })


@app.route("/api/subjects")
def api_subjects():
    objects_meta = get_objects()
    ids = get_ids()

    seen = set()
    for obj in objects_meta.values():
        raw_name = obj.get("name")
        if raw_name and raw_name in ids:
            seen.add(ids[raw_name])

    return jsonify(sorted(seen))


if __name__ == "__main__":
    # Warm up cache ngay khi khởi động
    build_images()
    app.run(host="0.0.0.0", port=5000)