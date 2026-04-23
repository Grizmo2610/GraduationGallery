from flask import Flask, jsonify, render_template
import sqlite3
import os

app = Flask(__name__)
DB_PATH = "db.sqlite3"


def get_db():
    return sqlite3.connect(DB_PATH)


def init_db_if_needed():
    if os.path.exists(DB_PATH):
        return
    import db
    db.init_db()


def load_data():
    conn = get_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            i.id,
            i.image_id,
            GROUP_CONCAT(s.name)
        FROM images i
        JOIN image_subjects isub ON i.id = isub.image_id
        JOIN subjects s ON s.id = isub.subject_id
        GROUP BY i.id
    """)

    data = []
    for row in cur.fetchall():
        image_id = row[1]
        subjects = row[2].split(",") if row[2] else []

        data.append({
            "id": row[0],
            "image_id": image_id,
            "subjects": subjects,
            "view_link": f"https://drive.google.com/file/d/{image_id}/view",
            "download_link": f"https://drive.google.com/uc?id={image_id}&export=download",
            "img_src": f"https://lh3.googleusercontent.com/d/{image_id}"
        })

    conn.close()
    return data


@app.route("/")
def index():
    return render_template("index.html", images=load_data())


@app.route("/api/images")
def api_images():
    return jsonify(load_data())


if __name__ == "__main__":
    init_db_if_needed()
    app.run(host="0.0.0.0", port=5000)