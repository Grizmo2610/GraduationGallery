from flask import Flask, jsonify, render_template, request
import json
import os

app = Flask(__name__)

IMAGES_META_PATH = "images_data.json"
OBJECTS_META_PATH = "objects_meta.json"

_cache_images = None
_cache_objects = None


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


def build_images():
    images_data = get_images()
    objects_meta = get_objects()

    result = []

    for item in images_data:
        image_path = item.get("image_path")
        subject_ids = item.get("subjects", [])

        subjects = []
        for sid in subject_ids:
            obj = objects_meta.get(sid)
            if obj:
                subjects.append(obj.get("name"))

        filename = os.path.basename(image_path) if image_path else ""

        result.append({
            "id": filename,
            "img_src": image_path,
            "view_link": image_path,
            "download_link": image_path,
            "subjects": subjects
        })

    return result


@app.route("/")
def index():
    return render_template("index.html", images=[])


@app.route("/api/images")
def api_images():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 30))

    selected = request.args.get("selected", "")
    strict = request.args.get("strict", "0") == "1"

    selected_list = selected.split(",") if selected else []

    data = build_images()

    # FILTER FULL DATASET
    if selected_list:
        filtered = []
        for img in data:
            subjects = img["subjects"]

            if strict:
                ok = all(s in subjects for s in selected_list)
            else:
                ok = any(s in subjects for s in selected_list)

            if ok:
                filtered.append(img)

        data = filtered

    start = (page - 1) * limit
    end = start + limit

    return jsonify({
        "page": page,
        "limit": limit,
        "has_more": end < len(data),
        "data": data[start:end]
    })

@app.route("/api/subjects")
def api_subjects():
    objects_meta = get_objects()

    subjects = [
        obj["name"]
        for obj in objects_meta.values()
        if obj.get("name")
    ]

    return jsonify(sorted(set(subjects)))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)