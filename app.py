from flask import Flask, render_template, request, redirect, session, url_for, jsonify, abort
from db import get_conn, init_db

app = Flask(__name__)
app.secret_key = "dev-secret-change-me"

def is_logged_in():
    return session.get("admin") is True

@app.before_request
def _init():
    init_db()

@app.get("/")
def index():
    conn = get_conn()
    featured = conn.execute("SELECT * FROM artwork WHERE featured=1 ORDER BY id DESC LIMIT 8").fetchall()
    exhibition = conn.execute("SELECT * FROM exhibition ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    return render_template("index.html", featured=featured, exhibition=exhibition)

@app.get("/gallery")
def gallery():
    conn = get_conn()
    artworks = conn.execute("SELECT * FROM artwork ORDER BY id DESC").fetchall()
    conn.close()
    return render_template("gallery.html", artworks=artworks)

@app.get("/artwork/<int:art_id>")
def artwork_detail(art_id: int):
    conn = get_conn()
    art = conn.execute("SELECT * FROM artwork WHERE id=?", (art_id,)).fetchone()
    if not art:
        conn.close()
        abort(404)
    related = conn.execute(
        "SELECT * FROM artwork WHERE category=? AND id!=? ORDER BY id DESC LIMIT 6",
        (art["category"], art_id)
    ).fetchall()
    conn.close()
    return render_template("artwork.html", art=art, related=related)

@app.get("/exhibition")
def exhibition():
    conn = get_conn()
    ex = conn.execute("SELECT * FROM exhibition ORDER BY id DESC LIMIT 1").fetchone()
    featured = conn.execute("SELECT * FROM artwork WHERE featured=1 ORDER BY id DESC LIMIT 12").fetchall()
    conn.close()
    return render_template("exhibition.html", ex=ex, featured=featured)


# --- Admin APIs for exhibition and data tools ---
@app.get('/api/exhibition')
def api_exhibition_get():
        conn = get_conn()
        ex = conn.execute("SELECT * FROM exhibition ORDER BY id DESC LIMIT 1").fetchone()
        conn.close()
        return jsonify(dict(ex) if ex else None)


@app.post('/api/exhibition')
def api_exhibition_save():
        if not is_logged_in():
                abort(401)
        data = request.json or {}
        title = data.get('title','').strip()
        date_range = data.get('date_range','').strip()
        statement = data.get('statement','').strip()
        cover = data.get('cover_image_url','').strip() or data.get('cover','').strip()

        conn = get_conn()
        cur = conn.cursor()
        # if an exhibition exists, update the latest; otherwise insert new
        row = conn.execute("SELECT * FROM exhibition ORDER BY id DESC LIMIT 1").fetchone()
        if row:
            cur.execute("UPDATE exhibition SET title=?, date_range=?, statement=?, cover_image_url=? WHERE id=?",
                                    (title, date_range, statement, cover, row['id']))
        else:
            cur.execute("INSERT INTO exhibition (title, date_range, statement, cover_image_url) VALUES (?,?,?,?)",
                                    (title, date_range, statement, cover))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})


@app.get('/api/export')
def api_export():
        if not is_logged_in():
                abort(401)
        conn = get_conn()
        arts = conn.execute('SELECT * FROM artwork ORDER BY id').fetchall()
        ex = conn.execute('SELECT * FROM exhibition ORDER BY id DESC LIMIT 1').fetchone()
        conn.close()
        payload = {
            'artworks': [dict(r) for r in arts],
            'exhibition': dict(ex) if ex else None,
        }
        # return as JSON with content-disposition for download
        from flask import Response
        import json
        body = json.dumps(payload, ensure_ascii=False, indent=2)
        resp = Response(body, mimetype='application/json; charset=utf-8')
        resp.headers['Content-Disposition'] = 'attachment; filename="export.json"'
        return resp


@app.post('/api/import')
def api_import():
        if not is_logged_in():
                abort(401)
        data = request.json or {}
        artworks = data.get('artworks') or []
        exhibition = data.get('exhibition')
        conn = get_conn()
        cur = conn.cursor()
        try:
            # overwrite artworks
            cur.execute('DELETE FROM artwork')
            for a in artworks:
                cur.execute("""
                    INSERT INTO artwork (title,artist,year,medium,dimensions,category,color_tag,description,image_url,featured)
                    VALUES (?,?,?,?,?,?,?,?,?,?)
                """, (
                    a.get('title'), a.get('artist'), int(a.get('year') or 0), a.get('medium'), a.get('dimensions'),
                    a.get('category'), a.get('color_tag'), a.get('description'), a.get('image_url'), 1 if a.get('featured') else 0
                ))

            # overwrite exhibition (simple approach: delete and insert if provided)
            cur.execute('DELETE FROM exhibition')
            if exhibition:
                cur.execute("INSERT INTO exhibition (title,date_range,statement,cover_image_url) VALUES (?,?,?,?)",
                                        (exhibition.get('title'), exhibition.get('date_range'), exhibition.get('statement'), exhibition.get('cover_image_url')))

            conn.commit()
        except Exception as e:
            conn.rollback()
            conn.close()
            return jsonify({'ok': False, 'error': str(e)}), 500
        conn.close()
        return jsonify({'ok': True})

@app.get("/about")
def about():
    return render_template("about.html")

@app.get("/contact")
def contact():
    return render_template("contact.html")

# -------- Admin --------

@app.get("/admin/login")
def admin_login_page():
    return render_template("admin_login.html", error=None)

@app.post("/admin/login")
def admin_login_post():
    username = request.form.get("username", "")
    password = request.form.get("password", "")

    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM admin_user WHERE username=? AND password_plain=?",
        (username, password)
    ).fetchone()
    conn.close()

    if not row:
        return render_template("admin_login.html", error="Giriş bilgisi hatalı.")
    session["admin"] = True
    return redirect("/admin")

@app.post("/admin/logout")
def admin_logout():
    session.clear()
    return redirect("/")

@app.get("/admin")
def admin_panel():
    if not is_logged_in():
        return redirect(url_for("admin_login_page"))
    return render_template("admin.html")

# -------- JSON API (Admin panel bunu kullanır) --------

@app.get("/api/artworks")
def api_artworks_list():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM artwork ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.post("/api/artworks")
def api_artworks_create():
    if not is_logged_in():
        abort(401)
    data = request.json or {}
    fields = ["title","artist","year","medium","dimensions","category","color_tag","description","image_url","featured"]
    item = {k: data.get(k) for k in fields}
    item["featured"] = 1 if item.get("featured") else 0

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
      INSERT INTO artwork (title,artist,year,medium,dimensions,category,color_tag,description,image_url,featured)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (
        item["title"], item["artist"], int(item["year"]), item["medium"], item["dimensions"],
        item["category"], item["color_tag"], item["description"], item["image_url"], item["featured"]
    ))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return jsonify({"ok": True, "id": new_id})

@app.put("/api/artworks/<int:art_id>")
def api_artworks_update(art_id: int):
    if not is_logged_in():
        abort(401)
    data = request.json or {}
    conn = get_conn()
    conn.execute("""
      UPDATE artwork SET
        title=?, artist=?, year=?, medium=?, dimensions=?, category=?, color_tag=?, description=?, image_url=?, featured=?
      WHERE id=?
    """, (
        data.get("title"), data.get("artist"), int(data.get("year")), data.get("medium"),
        data.get("dimensions"), data.get("category"), data.get("color_tag"),
        data.get("description"), data.get("image_url"),
        1 if data.get("featured") else 0,
        art_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

@app.delete("/api/artworks/<int:art_id>")
def api_artworks_delete(art_id: int):
    if not is_logged_in():
        abort(401)
    conn = get_conn()
    conn.execute("DELETE FROM artwork WHERE id=?", (art_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(debug=True)
