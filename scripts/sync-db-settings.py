import sqlite3
import json

SETTINGS = {
  "restaurantName": "Urban Slice",
  "tagline": "Slice Into Happiness",
  "logoUrl": "/images/logo-official.jpg",
  "address": "New Lari Adda, Near Bank Al Habib, Jhang Road, Kabirwala",
  "mapLink": "https://share.google/IrwMc8yaUJTIhxX2F",
  "whatsappNumber": "923052806919",
  "contactPhone": "0305-2806919",
  "contactPhoneSecondary": "0342-0663919",
  "contactEmail": "hello@urbanslice.pk",
  "openingHours": [
    { "day": "monday",    "open": "13:00", "close": "03:00", "closed": False },
    { "day": "tuesday",   "open": "13:00", "close": "03:00", "closed": False },
    { "day": "wednesday", "open": "13:00", "close": "03:00", "closed": False },
    { "day": "thursday",  "open": "13:00", "close": "03:00", "closed": False },
    { "day": "friday",    "open": "13:00", "close": "03:00", "closed": False },
    { "day": "saturday",  "open": "13:00", "close": "03:00", "closed": False },
    { "day": "sunday",    "open": "13:00", "close": "03:00", "closed": False },
  ],
  "temporarilyClosed": False,
  "deliveryAreas": [
    { "name": "Kabirwala City",  "fee": 60,  "etaMin": 25 },
    { "name": "Mian Channu Road", "fee": 100, "etaMin": 35 },
    { "name": "Khanewal Road",   "fee": 120, "etaMin": 40 },
  ],
  "defaultDeliveryFee": 60,
  "minOrderValue": 350,
  "freeDeliveryThreshold": 2500,
  "prepTimeMin": 25,
  "currency": "PKR",
  "announcementBar": {
    "enabled": True,
    "text": "🍕 Free Home Delivery Available · Open Daily 1:00 PM – 3:00 AM · Order on WhatsApp: 0305-2806919",
    "link": "/deals",
  },
  "hero": {
    "headline": "Good Food, Good Mood",
    "subheadline": "Kabirwala's favourite pizza, burgers, wraps & deals — made fresh every day. Take Away · Home Delivery · Casual Dining · Family Dining. Order on WhatsApp in seconds!",
    "primaryCta": "Order Now on WhatsApp",
    "secondaryCta": "View Full Menu",
    "imageUrl": "/images/hero-pizza.png",
  },
  "social": {
    "facebook": "https://www.facebook.com/share/1DbF9Q7r6Z/",
    "instagram": "#",
    "tiktok": "#",
  },
  "policies": {
    "about": "Urban Slice is Kabirwala's premier pizza & fast food destination, serving hand-tossed pizzas, crispy burgers, fresh wraps, broast, pasta, sandwiches and more. We believe in Good Food, Good Mood — every order is made fresh, with quality ingredients and bold flavours. Visit us at New Lari Adda, Near Bank Al Habib, Jhang Road, Kabirwala, or order for free home delivery via WhatsApp.",
    "deliveryInfo": "We offer FREE Home Delivery across Kabirwala and nearby areas. Estimated delivery time is 25–40 minutes depending on your area and order size. Minimum order: Rs. 350. Pickup is always free — just come to New Lari Adda, Near Bank Al Habib, Jhang Road, Kabirwala.",
    "refundPolicy": "If your order is incorrect or unsatisfactory, please contact us on WhatsApp (0305-2806919) within 30 minutes of delivery. We will replace the item or issue a store credit at our discretion.",
    "privacyPolicy": "We only collect the information needed to fulfil your order (name, phone, address). We do not sell your data. We use WhatsApp to confirm and coordinate orders.",
    "terms": "By placing an order you agree to provide accurate contact information. Prices are in Pakistani Rupees and may change without notice. Orders are confirmed only when the restaurant acknowledges them on WhatsApp.",
  },
  "footerNote": "Urban Slice — Slice Into Happiness. New Lari Adda, Near Bank Al Habib, Jhang Road, Kabirwala. Tel: 0305-2806919 | 0342-0663919",
}

con = sqlite3.connect('db/custom.db')
cur = con.cursor()

# Update or insert into RestaurantSetting
val = json.dumps(SETTINGS)
cur.execute("""
INSERT INTO RestaurantSetting (id, value)
VALUES ('main', ?)
ON CONFLICT(id) DO UPDATE SET value = excluded.value
""", (val,))

con.commit()
print("✓ SQLite database RestaurantSetting synced successfully!")

# Verify
row = cur.execute("SELECT value FROM RestaurantSetting WHERE id='main'").fetchone()
data = json.loads(row[0])
print("Restaurant Name:", data.get("restaurantName"))
print("Phones:", data.get("contactPhone"), "/", data.get("contactPhoneSecondary"))
print("Address:", data.get("address"))
print("Hero headline:", data.get("hero", {}).get("headline"))
print("Announcement:", data.get("announcementBar", {}).get("text"))

con.close()
