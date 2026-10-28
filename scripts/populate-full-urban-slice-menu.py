import sqlite3
import uuid
import datetime

con = sqlite3.connect('db/custom.db')
cur = con.cursor()

def cuid():
    return 'cm' + uuid.uuid4().hex[:22]

now = datetime.datetime.utcnow().isoformat() + 'Z'

print("Clearing old demo menu items, option groups and deals...")
cur.execute("DELETE FROM ProductOption")
cur.execute("DELETE FROM ProductOptionGroup")
cur.execute("DELETE FROM Product")
cur.execute("DELETE FROM Deal")
cur.execute("DELETE FROM Category")

categories_data = [
    ("Pizza", "pizza", "Hand-tossed Classic, Royal & US Special Pizzas", "/images/hero-pizza.png", 1),
    ("Burgers", "burgers", "Crispy Zinger, Beef Mash & Gourmet Burgers", "/images/burger-zinger.png", 2),
    ("Wraps & Rolls", "wraps", "Shapatar, Tikka & Paratha Rolls, Shawarmas", "/images/hero-pizza.png", 3),
    ("Injected Broast", "broast", "Crispy Injected Broast & Fried Chicken", "/images/side-wings.png", 4),
    ("Special Pasta", "pasta", "Flaming, Crunchy & Malai Baked Pastas", "/images/restaurant-interior.png", 5),
    ("Sandwiches", "sandwiches", "Club, Malai Boti & Special Grilled Sandwiches", "/images/restaurant-interior.png", 6),
    ("Wings & Nuggets", "wings", "Hot Wings, Honey Wings & Crispy Nuggets", "/images/side-wings.png", 7),
    ("Special Fries", "fries", "Plain, Masala, Loaded & Pizza Fries", "/images/side-fries.png", 8),
    ("Beverages", "drinks", "Soft Drinks & Mineral Water", "/images/drink-cola.png", 9),
    ("Deals & Combos", "deals", "Hot Deals, Pizza Deals & Burger Value Combos", "/images/deal-combo.png", 10),
]

cat_ids = {}
for name, slug, desc, img, ord_num in categories_data:
    cid = cuid()
    cat_ids[slug] = cid
    cur.execute("""
        INSERT INTO Category (id, name, slug, description, imageUrl, [order], active, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    """, (cid, name, slug, desc, img, ord_num, now, now))

print("✓ 10 Categories inserted.")

def add_product(name, slug, desc, cat_slug, base_price, img, featured=False, popular=False, tags="[]"):
    pid = cuid()
    cid = cat_ids[cat_slug]
    cur.execute("""
        INSERT INTO Product (id, name, slug, description, categoryId, basePrice, imageUrl, available, featured, popular, prepTimeMin, promoPrice, tagsJson, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 20, NULL, ?, ?, ?)
    """, (pid, name, slug, desc, cid, float(base_price), img, 1 if featured else 0, 1 if popular else 0, tags, now, now))
    return pid

def add_option_group(pid, name, key, grp_type, required=False, min_val=0, max_val=0, ord_val=0):
    gid = cuid()
    cur.execute("""
        INSERT INTO ProductOptionGroup (id, productId, name, [key], type, required, min, max, [order])
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (gid, pid, name, key, grp_type, 1 if required else 0, min_val, max_val, ord_val))
    return gid

def add_option(gid, name, price_mod, ord_val=0, default_sel=False):
    oid = cuid()
    cur.execute("""
        INSERT INTO ProductOption (id, groupId, name, priceModifier, [order], defaultSel)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (oid, gid, name, float(price_mod), ord_val, 1 if default_sel else 0))
    return oid

# 1. CLASSIC PIZZAS (S: 499, M: 849, L: 1199, XL: 1799)
classic_pizzas = [
    ("Chicken Tikka Pizza", "classic-chicken-tikka", "Tender marinated chicken tikka chunks with onions and mozzarella", "/images/pizza-tikka.png", True, True, '["popular","classic"]'),
    ("Chicken Fajita Pizza", "classic-chicken-fajita", "Spicy fajita chicken with bell peppers, onions and mozzarella", "/images/pizza-fajita.png", True, False, '["classic"]'),
    ("Meat Lover Pizza", "classic-meat-lover", "Loaded with seasoned chicken and meat toppings with rich cheese", "/images/pizza-bbq-chicken.png", False, False, '["classic"]'),
    ("Cheese Lover Pizza", "classic-cheese-lover", "Double rich mozzarella layer for true cheese enthusiasts", "/images/pizza-cheese.png", False, True, '["vegetarian"]'),
    ("Veggie Lover Pizza", "classic-veggie-lover", "Crisp onions, bell peppers, tomatoes, mushrooms and olives", "/images/pizza-veg-supreme.png", False, False, '["vegetarian"]'),
    ("Hot Spicy Pizza", "classic-hot-spicy", "Fiery spicy chicken, jalapenos, chili flakes and hot sauce", "/images/pizza-pepperoni.png", False, False, '["spicy"]'),
]

for name, slug, desc, img, feat, pop, tags in classic_pizzas:
    pid = add_product(name, slug, desc, "pizza", 499, img, feat, pop, tags)
    gid = add_option_group(pid, "Pizza Size", "size", "single", required=True, min_val=1, max_val=1, ord_val=1)
    add_option(gid, "Small 7\"", 0, 1, default_sel=True)
    add_option(gid, "Medium 10\"", 350, 2)
    add_option(gid, "Large 13\"", 700, 3)
    add_option(gid, "Extra Large 16\"", 1300, 4)
    # Crust
    cgid = add_option_group(pid, "Crust Style", "crust", "single", required=False, min_val=0, max_val=1, ord_val=2)
    add_option(cgid, "Regular Pan Crust", 0, 1, default_sel=True)
    add_option(cgid, "Thin Crust", 0, 2)
    add_option(cgid, "Cheese Stuffed Crust", 250, 3)

# 2. ROYAL PIZZAS (S: 549, M: 899, L: 1299, XL: 2049)
royal_pizzas = [
    ("Malai Boti Pizza", "royal-malai-boti", "Creamy tender malai boti chicken, special white sauce and mozzarella", "/images/pizza-supreme.png", True, True, '["bestseller","royal"]'),
    ("B.B.Q Boti Pizza", "royal-bbq-boti", "Smoky grilled BBQ boti chicken, onions and BBQ drizzle", "/images/pizza-bbq-chicken.png", True, False, '["royal"]'),
    ("Peri Peri Pizza", "royal-peri-peri", "Zesty peri peri marinated chicken with fiery peri peri drizzle", "/images/pizza-tikka.png", False, True, '["spicy","royal"]'),
    ("Pepperoni Pizza", "royal-pepperoni", "Generous layer of premium beef pepperoni and mozzarella", "/images/pizza-pepperoni.png", False, False, '["royal"]'),
    ("Shahi Pizza", "royal-shahi", "Royal Mughlai spiced chicken with rich creamy cheese sauce", "/images/pizza-margherita.png", False, False, '["royal"]'),
    ("Mushroom Lover Pizza", "royal-mushroom-lover", "Fresh sauteed mushrooms, herbs, garlic and mozzarella", "/images/pizza-veg-supreme.png", False, False, '["royal"]'),
    ("Butter Lazania Pizza", "royal-butter-lazania", "Layered pasta, creamy butter sauce and rich mozzarella (Medium, Large, XL)", "/images/pizza-supreme.png", False, False, '["special"]'),
    ("Deep Pan Pizza", "royal-deep-pan", "Deep dish thick golden crust baked with double cheese & fillings", "/images/pizza-fajita.png", False, False, '["special"]'),
]

for name, slug, desc, img, feat, pop, tags in royal_pizzas:
    is_m_plus = ("butter-lazania" in slug or "deep-pan" in slug)
    base_p = 899 if is_m_plus else 549
    pid = add_product(name, slug, desc, "pizza", base_p, img, feat, pop, tags)
    gid = add_option_group(pid, "Pizza Size", "size", "single", required=True, min_val=1, max_val=1, ord_val=1)
    if not is_m_plus:
        add_option(gid, "Small 7\"", 0, 1, default_sel=True)
        add_option(gid, "Medium 10\"", 350, 2)
        add_option(gid, "Large 13\"", 750, 3)
        add_option(gid, "Extra Large 16\"", 1500, 4)
    else:
        add_option(gid, "Medium 10\"", 0, 1, default_sel=True)
        add_option(gid, "Large 13\"", 400, 2)
        add_option(gid, "Extra Large 16\"", 1150, 3)

# 3. U.S SPECIAL PIZZAS (M: 949/999/1199, L: 1499/1599/1799, XL: 2199/2399/2649)
us_specials = [
    ("Stuff Crust + Cheese Crust", "us-stuff-crust-cheese", "Stuffed crust oozing with melted cheese and premium toppings", 949, 1499, 2199, True, True),
    ("Kabab Crust Pizza", "us-kabab-crust", "Crust stuffed with spiced seekh kababs baked to perfection", 949, 1499, 2199, True, False),
    ("Crown Crust + Crunchy Kabab", "us-crown-crust-kabab", "Royal crown shaped crust filled with crunchy kabab bites", 949, 1499, 2199, True, True),
    ("Crunchy Pizza", "us-crunchy-pizza", "Crispy crunchy chicken bites layered over golden cheese", 949, 1499, 2199, False, False),
    ("Behari Kabab Pizza", "us-behari-kabab", "Tender behari spiced kabab pieces with mint mayo and mozzarella", 949, 1499, 2199, False, True),
    ("Salan Wala Pizza", "us-salan-wala", "Unique authentic desi salan spiced fusion topping", 999, 1599, 2399, False, False),
    ("U.S Special Pizza", "us-special-flagship", "The Urban Slice flagship recipe with chef's exclusive triple toppings", 999, 1599, 2399, True, True),
    ("Star Pizza", "us-star-pizza", "Handcrafted star folded crust with pockets of seasoned chicken and cheese", 999, 1599, 2399, True, False),
    ("Double Extreme Pizza", "us-double-extreme", "Double stuffed extreme filling, extra cheese and premium meats", 1199, 1799, 2649, False, True),
    ("London Peri Peri Pizza", "us-london-peri-peri", "Authentic London style peri peri grilled chicken with extreme flavor", 1199, 1799, 2649, False, False),
]

for name, slug, desc, m_p, l_p, xl_p, feat, pop in us_specials:
    pid = add_product(name, slug, desc, "pizza", m_p, "/images/pizza-supreme.png", feat, pop, '["us-special"]')
    gid = add_option_group(pid, "Pizza Size", "size", "single", required=True, min_val=1, max_val=1, ord_val=1)
    add_option(gid, "Medium 10\"", 0, 1, default_sel=True)
    add_option(gid, "Large 13\"", l_p - m_p, 2)
    add_option(gid, "Extra Large 16\"", xl_p - m_p, 3)

# 4. BURGERS
burgers = [
    ("Zinger Burger", "zinger-burger", "Crispy golden fried chicken fillet, fresh lettuce, and signature mayo in a sesame bun", "burgers", 350, "/images/burger-zinger.png", True, True, '["crispy","chicken"]'),
    ("Zinger Cheese Burger", "zinger-cheese-burger", "Crispy zinger fillet topped with melted cheddar cheese slice", "burgers", 400, "/images/burger-zinger.png", True, False, '["cheese"]'),
    ("Double Decker Burger", "double-decker-burger", "Double crispy chicken fillets with double cheese and secret sauce", "burgers", 650, "/images/burger-zinger.png", False, True, '["loaded"]'),
    ("Zinger Tower Burger", "zinger-tower-burger", "Tower high zinger with hashbrown and cheese layer", "burgers", 600, "/images/burger-zinger.png", False, False, '["tower"]'),
    ("Stake Burger", "stake-burger", "Grilled steak fillet burger with pepper sauce and onions", "burgers", 400, "/images/burger-beef.png", False, False, '["grilled"]'),
    ("Patty Burger", "patty-burger", "Classic chicken patty burger with fresh crunchy veggies", "burgers", 250, "/images/burger-zinger.png", False, False, '["classic"]'),
    ("Spicy Burger", "spicy-burger", "Spiced patty with jalapeño peppers and spicy peri dip", "burgers", 250, "/images/burger-zinger.png", False, False, '["spicy"]'),
    ("Pizza Burger", "pizza-burger", "Burger packed with pizza sauce, mozzarella cheese and pepperoni", "burgers", 250, "/images/burger-beef.png", False, True, '["fusion"]'),
    ("Veggie Burger", "veggie-burger", "Crispy vegetable patty with fresh lettuce and tangy sauce", "burgers", 180, "/images/burger-zinger.png", False, False, '["vegetarian"]'),
    # Beef
    ("Beef Mash Burger", "beef-mash-burger", "Juicy smashed beef patty, caramelized onions and melted cheese", "burgers", 500, "/images/burger-beef.png", True, True, '["beef"]'),
    ("Swiss Mushroom Burger", "swiss-mushroom-burger", "Grilled beef patty topped with creamy Swiss mushroom sauce", "burgers", 650, "/images/burger-beef.png", True, False, '["beef","gourmet"]'),
]

for name, slug, desc, cat, price, img, feat, pop, tags in burgers:
    pid = add_product(name, slug, desc, cat, price, img, feat, pop, tags)
    if "beef" in slug:
        gid = add_option_group(pid, "Patty Style", "patty", "single", required=True, min_val=1, max_val=1, ord_val=1)
        add_option(gid, "Single Patty", 0, 1, default_sel=True)
        add_option(gid, "Double Patty", 200 if "mash" in slug else 250, 2)

# 5. WRAPS & ROLLS
wraps = [
    ("Shapatar Wrap", "shapatar-wrap", "Signature heavy-duty wrap stuffed with crispy chicken, fries and loaded sauces", 600, True),
    ("Malai Wrap", "malai-wrap", "Tender malai boti rolled in soft tortilla with garlic mayo", 400, True),
    ("Tikka Wrap", "tikka-wrap", "Spicy chicken tikka chunks with onions and mint sauce", 350, False),
    ("Fajita Wrap", "fajita-wrap", "Sizzling fajita chicken with capsicum and chipotle sauce", 350, False),
    ("Bihari Wrap", "bihari-wrap", "Bihari flavored kabab wrap (2 pcs / 4 pcs)", 399, False),
    ("Crispy Roll", "crispy-roll", "Golden fried crispy strips rolled in flatbread with tangy mayo", 350, True),
    ("Stuff Roll", "stuff-roll", "Heavy stuffed roll packed with chicken, cheese and olives", 500, False),
    ("Twister Roll", "twister-roll", "Crunchy twister chicken with crisp iceberg lettuce", 300, False),
    ("Paratha Roll", "paratha-roll", "Crispy paratha filled with barbecue chicken and onions", 350, True),
    ("Chicken Shawarma", "chicken-shawarma", "Traditional chicken shawarma with pickled cucumber and garlic paste", 180, False),
    ("Crispy Shawarma", "crispy-shawarma", "Shawarma packed with crispy fried strips and spicy sauce", 300, True),
    ("Cheese Shawarma", "cheese-shawarma", "Classic chicken shawarma with rich melted cheese", 250, False),
]

for name, slug, desc, price, pop in wraps:
    pid = add_product(name, slug, desc, "wraps", price, "/images/hero-pizza.png", False, pop, '["wrap"]')
    if "bihari-wrap" in slug:
        gid = add_option_group(pid, "Portion", "portion", "single", required=True, min_val=1, max_val=1)
        add_option(gid, "2 Pieces", 0, 1, default_sel=True)
        add_option(gid, "4 Pieces", 350, 2)

# 6. INJECTED BROAST
broast_items = [
    ("Quarter Broast", "quarter-broast", "Crispy injected quarter chicken broast served with dip sauce and fries", 649, True, True),
    ("Half Broast", "half-broast", "Crispy injected half chicken broast with double dips and fries", 1149, True, False),
    ("Full Broast", "full-broast", "Complete full chicken injected broast family feast with fries and dips", 2099, True, True),
    ("Fried Chest Piece", "fried-chest", "Crispy golden fried chicken chest piece", 399, False, False),
    ("Fried Leg Piece", "fried-leg", "Juicy and crispy fried chicken drumstick", 349, False, False),
]

for name, slug, desc, price, feat, pop in broast_items:
    add_product(name, slug, desc, "broast", price, "/images/side-wings.png", feat, pop, '["broast"]')

# 7. SPECIAL PASTA
pastas = [
    ("Flaming Pasta", "flaming-pasta", "Spicy baked penne with chili flakes and flaming hot sauce", 350, 510, False),
    ("Crunchy Pasta", "crunchy-pasta", "Creamy baked pasta topped with crispy chicken crunch", 400, 550, True),
    ("Malai Pasta", "malai-pasta", "Rich creamy white sauce pasta with tender malai boti pieces", 400, 600, True),
    ("B.B.Q Pasta", "bbq-pasta", "Smoky BBQ chicken pasta with mozzarella crust", 400, 600, False),
]

for name, slug, desc, s_p, l_p, pop in pastas:
    pid = add_product(name, slug, desc, "pasta", s_p, "/images/restaurant-interior.png", False, pop, '["pasta"]')
    gid = add_option_group(pid, "Pasta Size", "size", "single", required=True, min_val=1, max_val=1)
    add_option(gid, "Small", 0, 1, default_sel=True)
    add_option(gid, "Large", l_p - s_p, 2)

# 8. SANDWICHES
sandwiches = [
    ("Malai Boti Sandwich", "malai-boti-sandwich", "Grilled sandwich filled with malai boti chicken and cheese", 400, True),
    ("Club Sandwich", "club-sandwich", "Three layer classic toasted sandwich with egg, chicken, lettuce and tomato", 330, True),
    ("Mexican Sandwich", "mexican-sandwich", "Spicy Mexican seasoned chicken with jalapenos and cheese", 550, False),
    ("Special Sandwich", "special-sandwich", "Chef's special loaded triple meat grilled sandwich", 600, True),
]

for name, slug, desc, price, pop in sandwiches:
    add_product(name, slug, desc, "sandwiches", price, "/images/restaurant-interior.png", False, pop, '["sandwich"]')

# 9. WINGS & NUGGETS
wings_items = [
    ("Crispy Nuggets", "crispy-nuggets", "Golden crispy chicken nuggets with honey mustard dip", 299, 499, False),
    ("U.S Nuggets", "us-nuggets", "Urban Slice signature seasoned crispy nuggets", 399, 599, True),
    ("Hot Wings", "hot-wings", "Spicy fried chicken wings tossed in hot pepper glaze", 349, 549, True),
    ("Honey Wings", "honey-wings", "Crispy wings coated in sweet savory honey glaze", 399, 599, False),
    ("Oven Baked Wings", "oven-baked-wings", "Marinated wings baked slowly in the pizza oven", 399, 599, False),
    ("Chicken Tender Strips", "chicken-tender-strips", "Juicy boneless chicken breast tender strips", 499, 849, True),
]

for name, slug, desc, p6, p12, pop in wings_items:
    pid = add_product(name, slug, desc, "wings", p6, "/images/side-wings.png", False, pop, '["wings"]')
    gid = add_option_group(pid, "Portion Size", "portion", "single", required=True, min_val=1, max_val=1)
    add_option(gid, "6 Pieces", 0, 1, default_sel=True)
    add_option(gid, "12 Pieces", p12 - p6, 2)

# 10. SPECIAL FRIES
fries_items = [
    ("Plain Fries", "plain-fries", "Golden crispy salted French fries", 130, 230, 350),
    ("Masala Fries", "masala-fries", "Crispy fries dusted with special spicy chaat masala", 150, 250, 380),
    ("Loaded Cheese Fries", "loaded-cheese-fries", "Crispy fries smothered in warm cheddar cheese sauce, chicken bites and jalapenos", 300, 450, None),
    ("Pizza Fries", "pizza-fries", "Fries baked under mozzarella cheese, pizza sauce and pepperoni chunks", 350, 500, None),
]

for name, slug, desc, reg_p, lrg_p, fam_p in fries_items:
    pid = add_product(name, slug, desc, "fries", reg_p, "/images/side-fries.png", False, ("loaded" in slug or "pizza" in slug), '["fries"]')
    gid = add_option_group(pid, "Fries Size", "size", "single", required=True, min_val=1, max_val=1)
    add_option(gid, "Regular", 0, 1, default_sel=True)
    add_option(gid, "Large", lrg_p - reg_p, 2)
    if fam_p:
        add_option(gid, "Family", fam_p - reg_p, 3)

# 11. BEVERAGES
drinks = [
    ("Mineral Water", "mineral-water", "Pure chilled drinking water", 60, [("Regular", 0), ("Large", 60)]),
    ("Cold Drink Regular", "cold-drink-regular", "Chilled soft drink (Cola, 7Up, Mirinda)", 70, None),
    ("Cold Drink Half Ltr", "cold-drink-half-ltr", "Chilled 500ml soft drink bottle", 120, None),
    ("Cold Drink 1 Ltr", "cold-drink-1-ltr", "Chilled 1 Litre soft drink bottle", 170, None),
    ("Cold Drink 1.5 Ltr", "cold-drink-1-5-ltr", "Chilled 1.5 Litre family soft drink bottle", 210, None),
]

for name, slug, desc, price, opts in drinks:
    pid = add_product(name, slug, desc, "drinks", price, "/images/drink-cola.png", False, False, '["drink"]')
    if opts:
        gid = add_option_group(pid, "Bottle Size", "size", "single", required=True, min_val=1, max_val=1)
        for oname, omod in opts:
            add_option(gid, oname, omod, default_sel=(omod == 0))

# 12. OFFICIAL DEALS
deals = [
    ("Pizza Deal 1", "pizza-deal-1", "1 Small Pizza + 6 Wings + 1 Drink 500 ML", 930, 1150, "/images/deal-combo.png", "Hot Value"),
    ("Pizza Deal 2", "pizza-deal-2", "1 Medium Pizza + 1 Small Pasta + 1 Drink 1 Ltr", 1250, 1550, "/images/deal-combo.png", "Popular"),
    ("Pizza Deal 3", "pizza-deal-3", "2 Medium Pizzas (Classic + Royal)", 1700, 2050, "/images/deal-family.png", "Best Seller"),
    ("Pizza Deal 4", "pizza-deal-4", "2 Large Pizzas (Classic + Royal) + 1 Drink 1.5 Ltr", 2600, 3100, "/images/deal-family.png", "Mega Saver"),
    ("Pizza Deal 5", "pizza-deal-5", "1 Large Pizza Crown + 12 Wings + 1 Drink 1.5 Ltr", 2250, 2750, "/images/deal-family.png", "Crown Feast"),
    ("Pizza Deal 6 - Grand Party Feast", "pizza-deal-6-grand-feast", "1 XL Bihari Pizza + 1 Large Malai Pizza + 1 Medium Tikka + 1 Large Fries + 1 Drink 1 Ltr + 1 Drink 1.5 Ltr", 4900, 6100, "/images/deal-family.png", "Grand Feast"),
    ("Hot Burger Deal", "hot-burger-deal", "2 Zinger Burgers + 2 Regular Fries + 2 Regular Drinks (Special Hours: 12:01 AM-01:59 AM & 02:01 PM-04:59 PM)", 749, 1000, "/images/deal-combo.png", "Time Special"),
    ("Hot Pizza Deal", "hot-pizza-deal", "1 Medium Pizza (R) + 2 Regular Drinks", 999, 1250, "/images/deal-combo.png", "Time Special"),
    ("Burger Deal 1", "burger-deal-1", "1 Zinger Burger + 1 Regular Fries + 1 Regular Drink", 500, 620, "/images/deal-combo.png", "Solo Meal"),
    ("Burger Deal 2", "burger-deal-2", "2 Zinger Burgers + 1 Regular Fries + 1 Drink 500 ML", 900, 1100, "/images/deal-combo.png", "Duo Meal"),
    ("Burger Deal 3", "burger-deal-3", "5 Zinger Burgers + 1 Large Fries + 1 Drink 1 Ltr", 1950, 2400, "/images/deal-family.png", "Family Pack"),
    ("Burger Deal 4", "burger-deal-4", "2 Large Pastas + 1 Small Fries + 1 Drink 1 Ltr", 1400, 1750, "/images/deal-family.png", "Pasta Duo"),
    ("Wings Combo Deal 5", "wings-combo-deal-5", "12 Oven Baked Wings + 12 Hot Wings + 1 Drink 1 Ltr", 1300, 1600, "/images/side-wings.png", "Wings Party"),
    ("Burger Deal 6", "burger-deal-6", "1 Beef Burger + 1 Small Pasta + 1 Drink 500 ML", 1000, 1250, "/images/deal-combo.png", "Beef & Pasta"),
]

for title, slug, desc, price, old_p, img, badge in deals:
    did = cuid()
    cur.execute("""
        INSERT INTO Deal (id, title, slug, description, imageUrl, price, oldPrice, active, itemsJson, badge, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, '[]', ?, ?, ?)
    """, (did, title, slug, desc, img, float(price), float(old_p) if old_p else None, badge, now, now))

con.commit()
print("✓ All products, option groups, and deals populated successfully!")
con.close()
