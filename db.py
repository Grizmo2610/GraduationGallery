import sqlite3

import pandas as pd

def load_raw_data(csv_path="data.csv"):
    raw_data = []
    data = pd.read_csv(csv_path)
    for idx, row in data.iterrows():
        image_id = row["image_id"].strip()
        subjects = row["subjects"].strip()
        raw_data.append((
            len(raw_data) + 1,
            image_id,
            subjects
        ))
    return raw_data

def init_db():
    conn = sqlite3.connect("db.sqlite3")
    cur = conn.cursor()

    cur.executescript("""
    DROP TABLE IF EXISTS image_subjects;
    DROP TABLE IF EXISTS images;
    DROP TABLE IF EXISTS subjects;

    CREATE TABLE images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_id TEXT NOT NULL
    );

    CREATE TABLE subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE image_subjects (
        image_id INTEGER,
        subject_id INTEGER
    );
    """)

    # CSV data
    raw_data = load_raw_data("data.csv")

    subject_cache = {}

    def get_subject_id(name):
        if name in subject_cache:
            return subject_cache[name]

        cur.execute("SELECT id FROM subjects WHERE name=?", (name,))
        row = cur.fetchone()

        if row:
            sid = row[0]
        else:
            cur.execute("INSERT INTO subjects(name) VALUES (?)", (name,))
            sid = cur.lastrowid

        subject_cache[name] = sid
        return sid

    # insert data
    for _, image_id, subjects in raw_data:
        cur.execute("INSERT INTO images(image_id) VALUES (?)", (image_id,))
        img_id = cur.lastrowid

        for s in subjects.split("|"):
            sid = get_subject_id(s)
            cur.execute(
                "INSERT INTO image_subjects(image_id, subject_id) VALUES (?, ?)",
                (img_id, sid)
            )

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()