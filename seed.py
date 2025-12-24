from db import init_db, get_conn

def seed():
    init_db()
    conn = get_conn()
    cur = conn.cursor()

    # Admin: admin / 1234
    cur.execute("SELECT COUNT(*) AS c FROM admin_user")
    if cur.fetchone()["c"] == 0:
        cur.execute(
            "INSERT INTO admin_user (username, password_plain) VALUES (?, ?)",
            ("admin", "1234")
        )

    # Exhibition
    cur.execute("SELECT COUNT(*) AS c FROM exhibition")
    if cur.fetchone()["c"] == 0:
        cur.execute("""
        INSERT INTO exhibition (title, date_range, statement, cover_image_url)
        VALUES (?, ?, ?, ?)
        """, (
            "Current Exhibition: Quiet Geometry",
            "Dec 2025 – Jan 2026",
            "A minimal selection exploring light, texture, and repetition.",
            "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80"
        ))

    # Artworks
    cur.execute("SELECT COUNT(*) AS c FROM artwork")
    if cur.fetchone()["c"] == 0:
        data = [
            # Paintings (6)
            ("Veil of Meridian", "Leyla Arslan", 2024, "Oil on linen", "120 × 90 cm", "Painting", "Neutral",
             "A measured study in layered brushwork and subtle tonal shifts, evoking cartographic space and memory.",
           "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=1600&q=80", 1),
            ("Afterlight Study", "Murat İpek", 2023, "Acrylic on board", "100 × 100 cm", "Painting", "Warm",
             "A rigorous exploration of color temperature and surface texture that collapses horizon and plane.",
           "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1600&q=80", 0),
            ("Catalogue of Quiet Things", "Selen Koru", 2022, "Egg tempera", "80 × 110 cm", "Painting", "Cool",
             "Precise, jewel-like passages of tempera form a restrained visual lexicon of domestic fragments.",
           "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80", 0),
            ("Temperate Field", "Baran Eren", 2021, "Oil on panel", "90 × 90 cm", "Painting", "Neutral",
             "A contemporary abstraction that negotiates gesture and restraint through layered glazing.",
           "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80", 0),
            ("Index of Light", "Nazan Öz", 2025, "Mixed media on canvas", "110 × 85 cm", "Painting", "Cool",
             "A curated interplay of reflective pigments and graphite, indexing the passage of light across time.",
           "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1600&q=80", 1),
            ("Threshold (No. 3)", "Kerem Polat", 2020, "Acrylic and wax", "70 × 100 cm", "Painting", "Warm",
             "A tactile assembly of colored planes creating a liminal threshold between surface and depth.",
           "https://images.unsplash.com/photo-1534637494485-6a0e7f9d2f03?auto=format&fit=crop&w=1600&q=80", 0),

            # Digital Art (5)
            ("Algorithmic Garden", "Derya Sel", 2024, "Generative print", "—", "Digital Art", "Vivid",
             "Generative compositions rendered as archival pigment prints; an investigation of pattern and entropy.",
           "https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=1600&q=80", 1),
            ("Latency", "Ozan Yalçın", 2023, "3D render", "—", "Digital Art", "Monochrome",
             "A sculptural simulation that interrogates the illusion of weight in virtual environments.",
           "https://images.unsplash.com/photo-1499084732479-de2c02d45fc4?auto=format&fit=crop&w=1600&q=80", 0),
            ("Signal", "Aylin Güneş", 2022, "Digital collage", "—", "Digital Art", "Neutral",
             "A precise montage of archival imagery that interrogates transmission, signal loss and recovery.",
           "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80", 0),
            ("Fragmented Panorama", "Efe Demirci", 2025, "VR capture", "—", "Digital Art", "Vivid",
             "A panoramic reconstruction from multiple VR viewpoints, printed as a single continuous field.",
           "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80", 0),
            ("Nocturne Render", "Zeynep Okan", 2021, "CGI", "—", "Digital Art", "Cool",
             "A nocturnal study in synthetic atmospheres and specular highlights; cinematic in its restraint.",
           "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80", 0),

            # Photography (5)
            ("Untitled #12 (Interior)", "Rıza Bulut", 2020, "Chromogenic print", "40 × 60 cm", "Photography", "Neutral",
             "A quiet interior captured with patient formalism; an economy of detail that rewards sustained looking.",
           "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=1600&q=80", 0),
            ("Coastline Index", "Merve Kaplan", 2022, "C-print", "50 × 75 cm", "Photography", "Cool",
             "A study of shoreline light and materiality, printed large to reveal subtle chromatic gradations.",
           "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?auto=format&fit=crop&w=1600&q=80", 0),
            ("Portrait of a Workshop", "Barış Yılmaz", 2021, "Gelatin silver print", "60 × 90 cm", "Photography", "Warm",
             "Documentary study rendered with formal sympathy to the craftspeople and their tools.",
           "https://images.unsplash.com/photo-1495555687398-37a1a6d3b6fa?auto=format&fit=crop&w=1600&q=80", 0),
            ("Dawn Over Quarry", "Selin Arıkan", 2023, "Archival inkjet", "80 × 120 cm", "Photography", "Monochrome",
             "An expansive landscape photograph that compresses scale through a rigorous tonal range.",
           "https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1600&q=80", 1),
            ("Threshold Portrait", "Can Özdemir", 2019, "Digital C-print", "40 × 60 cm", "Photography", "Neutral",
             "A controlled portrait that balances stillness and latent narrative; technical and contemplative.",
           "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80", 0),

            # Sculptures (8) — at least 8 entries as required
            ("Cast Field (I)", "Arda Tunç", 2018, "Bronze, patina", "35 × 25 × 20 cm", "Sculpture", "Neutral",
             "A compact bronze relief that reframes industrial detritus as formal sediment.",
           "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1600&q=80", 0),
            ("Lattice Monument", "Nilay Sarı", 2021, "Stainless steel", "180 × 70 × 60 cm", "Sculpture", "Cool",
             "An upright lattice that modulates light and shadow, designed for changing viewpoints.",
           "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1600&q=80", 1),
            ("Folded Terra", "Gökhan Ateş", 2022, "Ceramic and glaze", "60 × 45 × 30 cm", "Sculpture", "Warm",
             "Hand-built ceramics glazed to reveal layered strata—tactile, geological, intimate.",
           "https://images.unsplash.com/photo-1504198266286-1659872e6590?auto=format&fit=crop&w=1600&q=80", 0),
            ("Anchor (Study)", "Ece Demir", 2020, "Marble", "50 × 20 × 15 cm", "Sculpture", "Neutral",
             "A minimalist marble form whose carved surfaces register both tool and touch.",
           "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80", 0),
            ("Refracted Volume", "Burak Kara", 2019, "Glass and metal", "90 × 40 × 30 cm", "Sculpture", "Vivid",
             "A suspended glass composition that refracts ambient light into fragmentary color fields.",
           "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1600&q=80", 0),
            ("Component (No. 4)", "Aslı Kayhan", 2023, "Found materials", "—", "Sculpture", "Neutral",
             "An assemblage that repositions quotidian objects into a concise sculptural grammar.",
           "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80", 0),
            ("Suture", "Hakan Polat", 2024, "Steel and textile", "120 × 80 × 50 cm", "Sculpture", "Cool",
             "A seam-like intervention in steel and cloth, negotiating tension and repair as metaphor.",
           "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80", 0),
            ("Cartography of Silence", "Leyla Gür", 2025, "Concrete", "45 × 45 × 30 cm", "Sculpture", "Neutral",
             "A small-scale concrete work that maps absence through negative space and gentle erosion.",
           "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80", 1),
        ]

        cur.executemany("""
        INSERT INTO artwork
        (title, artist, year, medium, dimensions, category, color_tag, description, image_url, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, data)

    conn.commit()
    conn.close()

    # Ensure no artwork has an empty image_url: set a calm museum placeholder for any missing values
    conn = get_conn()
    cur = conn.cursor()
    placeholder = "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1600&q=80"
    cur.execute("UPDATE artwork SET image_url = ? WHERE image_url IS NULL OR trim(image_url) = ''", (placeholder,))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    seed()
    print("Seed tamam.")
