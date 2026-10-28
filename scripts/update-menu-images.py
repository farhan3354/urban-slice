import shutil
import os
import sqlite3

brain_dir = r"C:\Users\DIRECT BUY\.gemini\antigravity-ide\brain\d96a5001-8027-4aea-aa5e-0906f30d6241"
pub_images = r"c:\Users\DIRECT BUY\Downloads\mohsin\public\images"

mappings = {
    "wrap_chicken_1793185799230.jpg": "wrap-chicken.jpg",
    "pasta_creamy_1793185835880.jpg": "pasta-creamy.jpg",
    "sandwich_club_1793185862721.jpg": "sandwich-club.jpg",
    "broast_crispy_1793185898633.jpg": "broast-crispy.jpg",
}

for src_name, dst_name in mappings.items():
    src_path = os.path.join(brain_dir, src_name)
    dst_path = os.path.join(pub_images, dst_name)
    shutil.copy2(src_path, dst_path)
    print(f"Copied {src_name} -> {dst_name} ({os.path.getsize(dst_path)} bytes)")

conn = sqlite3.connect(r"c:\Users\DIRECT BUY\Downloads\mohsin\db\custom.db")
c = conn.cursor()

c.execute("UPDATE Category SET imageUrl = '/images/wrap-chicken.jpg' WHERE slug = 'wraps'")
c.execute("UPDATE Category SET imageUrl = '/images/pasta-creamy.jpg' WHERE slug = 'pasta'")
c.execute("UPDATE Category SET imageUrl = '/images/sandwich-club.jpg' WHERE slug = 'sandwiches'")
c.execute("UPDATE Category SET imageUrl = '/images/broast-crispy.jpg' WHERE slug = 'broast'")

c.execute("""
    UPDATE Product SET imageUrl = '/images/wrap-chicken.jpg'
    WHERE categoryId IN (SELECT id FROM Category WHERE slug = 'wraps')
""")
c.execute("""
    UPDATE Product SET imageUrl = '/images/pasta-creamy.jpg'
    WHERE categoryId IN (SELECT id FROM Category WHERE slug = 'pasta')
""")
c.execute("""
    UPDATE Product SET imageUrl = '/images/sandwich-club.jpg'
    WHERE categoryId IN (SELECT id FROM Category WHERE slug = 'sandwiches')
""")
c.execute("""
    UPDATE Product SET imageUrl = '/images/broast-crispy.jpg'
    WHERE categoryId IN (SELECT id FROM Category WHERE slug = 'broast')
""")
c.execute("""
    UPDATE Product SET imageUrl = '/images/side-nuggets.png'
    WHERE name LIKE '%Nugget%'
""")

conn.commit()
print("Database categories and products updated successfully!")
