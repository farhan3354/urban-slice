// Seed Urban Slice Pizza demo data.
// Run: bun run scripts/seed.ts
// Reset: bun run db:reset && bun run db:push && bun run scripts/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const db = new PrismaClient();

function opt(
  name: string,
  price: number,
  opts: { def?: boolean } = {}
) {
  return { name, priceModifier: price, defaultSel: !!opts.def };
}

async function main() {
  console.log("🌱 Seeding Urban Slice Pizza demo data...");

  // ---- Admin user ----
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@urbanslice.pk";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin123";
  const name = process.env.ADMIN_BOOTSTRAP_NAME || "Demo Admin";
  const existing = await db.adminUser.findUnique({ where: { email } });
  if (!existing) {
    await db.adminUser.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 10),
        role: "super_admin",
        active: true,
      },
    });
    console.log(`  ✓ Admin created: ${email} / ${password}`);
  } else {
    console.log(`  • Admin exists: ${email}`);
  }

  // ---- Settings ----
  await db.restaurantSetting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", value: JSON.stringify(DEFAULT_SETTINGS) },
  });
  console.log("  ✓ Restaurant settings seeded");

  // ---- Categories ----
  const cats = [
    { name: "Pizza", slug: "pizza", order: 1, description: "Hand-tossed, freshly baked", imageUrl: "/images/pizza-pepperoni.png" },
    { name: "Sides", slug: "sides", order: 2, description: "Garlic bread, wings & more", imageUrl: "/images/side-garlic-bread.png" },
    { name: "Fries", slug: "fries", order: 3, description: "Crispy & loaded", imageUrl: "/images/side-fries.png" },
    { name: "Burgers", slug: "burgers", order: 4, description: "Juicy & filling", imageUrl: "/images/burger-beef.png" },
    { name: "Drinks", slug: "drinks", order: 5, description: "Chilled refreshments", imageUrl: "/images/drink-cola.png" },
    { name: "Deals", slug: "deals", order: 6, description: "Save more with combos", imageUrl: "/images/deal-family.png" },
  ];
  const catMap: Record<string, string> = {};
  for (const c of cats) {
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, imageUrl: c.imageUrl, order: c.order, active: true },
      create: { ...c },
    });
    catMap[c.slug] = row.id;
  }
  console.log(`  ✓ ${cats.length} categories`);

  // ---- Helper to create a pizza with size/crust/toppings ----
  async function makePizza(data: {
    name: string;
    slug: string;
    desc: string;
    basePrice: number;
    image: string;
    featured?: boolean;
    popular?: boolean;
    tags?: string[];
    promoPrice?: number;
    prepTimeMin?: number;
  }) {
    const existing = await db.product.findUnique({ where: { slug: data.slug } });
    if (existing) {
      // update basic fields, keep options
      return db.product.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          description: data.desc,
          basePrice: data.basePrice,
          imageUrl: data.image,
          featured: data.featured ?? false,
          popular: data.popular ?? false,
          promoPrice: data.promoPrice ?? null,
          prepTimeMin: data.prepTimeMin ?? 25,
          tagsJson: JSON.stringify(data.tags || []),
          categoryId: catMap["pizza"],
        },
        include: { options: { include: { options: true } } },
      });
    }
    const p = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.desc,
        basePrice: data.basePrice,
        imageUrl: data.image,
        featured: data.featured ?? false,
        popular: data.popular ?? false,
        promoPrice: data.promoPrice ?? null,
        prepTimeMin: data.prepTimeMin ?? 25,
        tagsJson: JSON.stringify(data.tags || []),
        categoryId: catMap["pizza"],
      },
    });
    // Size group (single, required)
    const sizeG = await db.productOptionGroup.create({
      data: {
        productId: p.id,
        name: "Size",
        key: "size",
        type: "single",
        required: true,
        min: 1,
        max: 1,
        order: 0,
        options: {
          create: [
            { name: "Small (7\")", priceModifier: 0, order: 0, defaultSel: true },
            { name: "Medium (10\")", priceModifier: 450, order: 1 },
            { name: "Large (13\")", priceModifier: 950, order: 2 },
          ],
        },
      },
    });
    // Crust group (single, required)
    await db.productOptionGroup.create({
      data: {
        productId: p.id,
        name: "Crust",
        key: "crust",
        type: "single",
        required: true,
        min: 1,
        max: 1,
        order: 1,
        options: {
          create: [
            { name: "Classic Hand Tossed", priceModifier: 0, order: 0, defaultSel: true },
            { name: "Thin & Crispy", priceModifier: 0, order: 1 },
            { name: "Cheesy Stuffed Crust", priceModifier: 350, order: 2 },
            { name: "Garlic Parmesan", priceModifier: 150, order: 3 },
          ],
        },
      },
    });
    // Extra toppings (multiple)
    await db.productOptionGroup.create({
      data: {
        productId: p.id,
        name: "Extra Toppings",
        key: "toppings",
        type: "multiple",
        required: false,
        min: 0,
        max: 8,
        order: 2,
        options: {
          create: [
            { name: "Extra Cheese", priceModifier: 200, order: 0 },
            { name: "Extra Pepperoni", priceModifier: 250, order: 1 },
            { name: "Mushrooms", priceModifier: 120, order: 2 },
            { name: "Olives", priceModifier: 120, order: 3 },
            { name: "Onions", priceModifier: 100, order: 4 },
            { name: "Capsicum", priceModifier: 100, order: 5 },
            { name: "Jalapeños", priceModifier: 100, order: 6 },
            { name: "Corn", priceModifier: 100, order: 7 },
          ],
        },
      },
    });
    // Dips (multiple)
    await db.productOptionGroup.create({
      data: {
        productId: p.id,
        name: "Dips",
        key: "dips",
        type: "multiple",
        required: false,
        min: 0,
        max: 4,
        order: 3,
        options: {
          create: [
            { name: "Garlic Mayo", priceModifier: 60, order: 0 },
            { name: "Hot Sauce", priceModifier: 60, order: 1 },
            { name: "BBQ Sauce", priceModifier: 70, order: 2 },
            { name: "Ranch", priceModifier: 80, order: 3 },
          ],
        },
      },
    });
    return p;
  }

  const pizzas = [
    {
      name: "Margherita Classic",
      slug: "margherita-classic",
      desc: "San Marzano style tomato sauce, fresh mozzarella, basil & extra-virgin olive oil.",
      basePrice: 850,
      image: "/images/pizza-margherita.png",
      featured: true,
      popular: true,
      tags: ["veg", "classic"],
      promoPrice: 790,
    },
    {
      name: "Pepperoni Feast",
      slug: "pepperoni-feast",
      desc: "Loaded with crispy beef pepperoni, mozzarella and our signature tomato base.",
      basePrice: 1100,
      image: "/images/pizza-pepperoni.png",
      featured: true,
      popular: true,
      tags: ["beef", "popular"],
    },
    {
      name: "Supreme Pizza",
      slug: "supreme-pizza",
      desc: "Bell peppers, onions, olives, mushrooms, sausage and double cheese.",
      basePrice: 1300,
      image: "/images/pizza-supreme.png",
      popular: true,
      tags: ["loaded"],
    },
    {
      name: "BBQ Chicken",
      slug: "bbq-chicken",
      desc: "Grilled chicken, red onions, cilantro and smoky BBQ sauce drizzle.",
      basePrice: 1250,
      image: "/images/pizza-bbq-chicken.png",
      featured: true,
      tags: ["chicken", "bbq"],
    },
    {
      name: "Veggie Supreme",
      slug: "veggie-supreme",
      desc: "Capsicum, mushrooms, olives, onions, corn, jalapeños and extra cheese.",
      basePrice: 1150,
      image: "/images/pizza-veg-supreme.png",
      tags: ["veg"],
    },
    {
      name: "Chicken Tikka",
      slug: "chicken-tikka",
      desc: "Spicy chicken tikka chunks, green chilies, onions and double cheese.",
      basePrice: 1250,
      image: "/images/pizza-tikka.png",
      popular: true,
      tags: ["chicken", "spicy", "desi"],
    },
    {
      name: "Chicken Fajita",
      slug: "chicken-fajita",
      desc: "Marinated chicken, colorful bell peppers, onions and cheese blend.",
      basePrice: 1250,
      image: "/images/pizza-fajita.png",
      tags: ["chicken"],
    },
    {
      name: "Four Cheese",
      slug: "four-cheese",
      desc: "Mozzarella, cheddar, parmesan and feta on a golden crust.",
      basePrice: 1350,
      image: "/images/pizza-cheese.png",
      tags: ["veg", "cheese"],
    },
  ];
  for (const p of pizzas) {
    await makePizza(p);
  }
  console.log(`  ✓ ${pizzas.length} pizzas`);

  // ---- Helper for simple side products ----
  async function makeSimple(data: {
    name: string;
    slug: string;
    desc: string;
    basePrice: number;
    image: string;
    categorySlug: string;
    popular?: boolean;
    featured?: boolean;
    tags?: string[];
    withSize?: boolean;
    withQty?: boolean;
    promoPrice?: number;
  }) {
    const existing = await db.product.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return db.product.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          description: data.desc,
          basePrice: data.basePrice,
          imageUrl: data.image,
          popular: data.popular ?? false,
          featured: data.featured ?? false,
          promoPrice: data.promoPrice ?? null,
          tagsJson: JSON.stringify(data.tags || []),
          categoryId: catMap[data.categorySlug],
        },
      });
    }
    const p = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.desc,
        basePrice: data.basePrice,
        imageUrl: data.image,
        popular: data.popular ?? false,
        featured: data.featured ?? false,
        promoPrice: data.promoPrice ?? null,
        tagsJson: JSON.stringify(data.tags || []),
        categoryId: catMap[data.categorySlug],
        prepTimeMin: 15,
      },
    });
    if (data.withSize) {
      await db.productOptionGroup.create({
        data: {
          productId: p.id,
          name: "Size",
          key: "size",
          type: "single",
          required: true,
          min: 1,
          max: 1,
          order: 0,
          options: {
            create: [
              { name: "Regular", priceModifier: 0, order: 0, defaultSel: true },
              { name: "Large", priceModifier: 150, order: 1 },
            ],
          },
        },
      });
    }
    if (data.withQty) {
      await db.productOptionGroup.create({
        data: {
          productId: p.id,
          name: "Flavor",
          key: "flavor",
          type: "single",
          required: true,
          min: 1,
          max: 1,
          order: 1,
          options: {
            create: [
              { name: "Classic", priceModifier: 0, order: 0, defaultSel: true },
              { name: "Spicy", priceModifier: 0, order: 1 },
              { name: "BBQ", priceModifier: 30, order: 2 },
            ],
          },
        },
      });
    }
    return p;
  }

  const sides = [
    { name: "Garlic Bread Sticks", slug: "garlic-bread-sticks", desc: "Golden garlic bread with melted cheese & herbs, served with marinara dip.", basePrice: 450, image: "/images/side-garlic-bread.png", popular: true, featured: true, withSize: true },
    { name: "Chicken Wings (6 pc)", slug: "chicken-wings", desc: "Crispy buffalo wings glazed with spicy sauce, ranch dip & celery.", basePrice: 650, image: "/images/side-wings.png", popular: true, withQty: true },
    { name: "Chicken Nuggets (8 pc)", slug: "chicken-nuggets", desc: "Crispy golden nuggets with your choice of dip.", basePrice: 450, image: "/images/side-nuggets.png" },
  ];
  for (const s of sides) await makeSimple({ ...s, categorySlug: "sides" });

  const fries = [
    { name: "Loaded Cheese Fries", slug: "loaded-cheese-fries", desc: "Crispy fries smothered in melted cheese, jalapeños and sauces.", basePrice: 380, image: "/images/side-fries.png", popular: true, featured: true, withSize: true, tags: ["veg"] },
    { name: "Masala Fries", slug: "masala-fries", desc: "Classic fries tossed in our house chaat masala.", basePrice: 220, image: "/images/side-fries.png", tags: ["veg"] },
  ];
  for (const f of fries) await makeSimple({ ...f, categorySlug: "fries" });

  const burgers = [
    { name: "Double Beef Cheeseburger", slug: "double-beef-cheeseburger", desc: "Two juicy beef patties, cheddar, lettuce, tomato & house sauce.", basePrice: 750, image: "/images/burger-beef.png", popular: true, featured: true },
    { name: "Zinger Burger", slug: "zinger-burger", desc: "Crispy fried chicken fillet, lettuce, mayo & cheese.", basePrice: 550, image: "/images/burger-zinger.png", popular: true },
  ];
  for (const b of burgers) await makeSimple({ ...b, categorySlug: "burgers" });

  const drinks = [
    { name: "Cola (Reg)", slug: "cola-regular", desc: "Chilled cola with ice.", basePrice: 120, image: "/images/drink-cola.png", withSize: true, tags: ["chilled"] },
    { name: "Mint Lemonade", slug: "mint-lemonade", desc: "Refreshing mint & lemon cooler with ice.", basePrice: 180, image: "/images/drink-mint.png", popular: true, tags: ["fresh"] },
  ];
  for (const d of drinks) await makeSimple({ ...d, categorySlug: "drinks" });

  console.log(`  ✓ Sides, fries, burgers, drinks seeded`);

  // ---- Deals ----
  const dealsData = [
    {
      title: "Family Feast",
      slug: "family-feast",
      description: "2 Large pizzas + Garlic bread + 6 Chicken wings + 1.5L drink. Feeds 4–5.",
      imageUrl: "/images/deal-family.png",
      price: 2990,
      oldPrice: 3600,
      badge: "Best Value",
      couponCode: "FAMILY10",
      itemsJson: JSON.stringify([
        { name: "Any 2 Large Pizzas", qty: 2 },
        { name: "Garlic Bread Sticks", qty: 1 },
        { name: "Chicken Wings (6 pc)", qty: 1 },
        { name: "1.5L Drink", qty: 1 },
      ]),
    },
    {
      title: "Solo Combo",
      slug: "solo-combo",
      description: "1 Medium pizza + Garlic bread + drink. Perfect for one.",
      imageUrl: "/images/deal-combo.png",
      price: 1290,
      oldPrice: 1550,
      badge: "Popular",
      itemsJson: JSON.stringify([
        { name: "Medium Pizza", qty: 1 },
        { name: "Garlic Bread Sticks", qty: 1 },
        { name: "Drink", qty: 1 },
      ]),
    },
  ];
  for (const d of dealsData) {
    await db.deal.upsert({
      where: { slug: d.slug },
      update: { ...d },
      create: { ...d, active: true },
    });
  }
  console.log(`  ✓ ${dealsData.length} deals`);

  // ---- Demo orders for dashboard ----
  const existingOrders = await db.order.count();
  if (existingOrders === 0) {
    const sampleItems = JSON.stringify([
      {
        name: "Pepperoni Feast",
        qty: 1,
        unitPrice: 1100,
        lineTotal: 1100,
        options: [
          { groupName: "Size", optionName: "Medium (10\")", priceModifier: 450 },
          { groupName: "Crust", optionName: "Cheesy Stuffed Crust", priceModifier: 350 },
        ],
      },
      {
        name: "Garlic Bread Sticks",
        qty: 2,
        unitPrice: 450,
        lineTotal: 900,
        options: [],
      },
    ]);
    const statuses = ["pending_whatsapp", "confirmed", "preparing", "ready", "completed", "cancelled"];
    const customers = [
      ["Ali Khan", "03001234567", "delivery", "House 12, Block A, Kabirwala"],
      ["Sara Ahmed", "03214567890", "pickup", ""],
      ["Bilal Raza", "03332345678", "delivery", "Near Government College, Kabirwala"],
      ["Hina Tariq", "03124567890", "delivery", "Mian Channu Road, Kabirwala"],
      ["Usman Iqbal", "03457890123", "pickup", ""],
      ["Ayesha Noor", "03077890123", "delivery", "Khanewal Road, Kabirwala"],
    ];
    for (let i = 0; i < 12; i++) {
      const [cname, phone, type, addr] = customers[i % customers.length];
      const subtotal = 1100 + (i % 4) * 450;
      const fee = type === "delivery" ? 60 : 0;
      const total = subtotal + fee;
      const status = statuses[i % statuses.length];
      const created = new Date(Date.now() - i * 6 * 60 * 60 * 1000);
      await db.order.create({
        data: {
          orderRef: `USP-DEMO-${String(1001 + i)}`,
          customerName: cname,
          customerPhone: phone,
          type,
          address: addr || null,
          area: type === "delivery" ? "Kabirwala City" : null,
          notes: i % 3 === 0 ? "Extra spicy please" : null,
          itemsJson: sampleItems,
          subtotal,
          deliveryFee: fee,
          discount: 0,
          total,
          status,
          internalNotes: i % 4 === 0 ? "VIP customer" : null,
          whatsappSentAt: created,
          confirmedAt: status !== "pending_whatsapp" && status !== "cancelled" ? new Date(created.getTime() + 5 * 60000) : null,
          completedAt: status === "completed" ? new Date(created.getTime() + 40 * 60000) : null,
          cancelledAt: status === "cancelled" ? new Date(created.getTime() + 10 * 60000) : null,
          createdAt: created,
          updatedAt: created,
        },
      });
    }
    console.log(`  ✓ 12 demo orders`);
  }

  console.log("✅ Seed complete.");
  console.log(`   Admin login: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
