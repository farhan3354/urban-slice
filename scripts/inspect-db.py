import sqlite3
import json

con = sqlite3.connect('db/custom.db')
cur = con.cursor()
row = cur.execute("SELECT value FROM RestaurantSetting WHERE id='main'").fetchone()
if row:
    data = json.loads(row[0])
    print("Restaurant Name:", data.get("restaurantName"))
    print("Tagline:", data.get("tagline"))
    print("Phones:", data.get("contactPhone"), "/", data.get("contactPhoneSecondary"))
    print("WhatsApp:", data.get("whatsappNumber"))
    print("Address:", data.get("address"))
    print("Map link:", data.get("mapLink"))
    print("Hero headline:", data.get("hero", {}).get("headline"))
    print("Hero subheadline:", data.get("hero", {}).get("subheadline"))
    print("Announcement:", data.get("announcementBar", {}).get("text"))
else:
    print("No settings found in DB")
con.close()
