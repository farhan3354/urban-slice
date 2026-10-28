// Resilient image generation — retries, continues on error, idempotent (skips existing).
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'public', 'images');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

type Job = { name: string; prompt: string; size: string };

const jobs: Job[] = [
  { name: 'hero-pizza.png', prompt: 'Top-down hero shot of a freshly baked pepperoni pizza with bubbling melted mozzarella cheese, golden crust, basil leaves, on a dark rustic wooden table, dramatic warm side lighting, steam rising, premium food photography, ultra detailed, appetizing, deep shadows, charcoal background', size: '1344x768' },
  { name: 'logo.png', prompt: 'Modern minimal logo for an urban pizza brand, circular badge with a pizza slice icon, red and gold colors on cream background, clean vector style, flat design, no text', size: '1024x1024' },
  { name: 'pizza-margherita.png', prompt: 'Professional food photography of a classic Margherita pizza with fresh basil, tomato sauce, and mozzarella, top-down view on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'pizza-pepperoni.png', prompt: 'Professional food photography of a pepperoni pizza with crispy pepperoni slices, melted cheese, golden crust, top-down view on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'pizza-supreme.png', prompt: 'Professional food photography of a supreme pizza loaded with bell peppers, onions, olives, mushrooms, sausage and cheese, top-down view on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'pizza-bbq-chicken.png', prompt: 'Professional food photography of a BBQ chicken pizza with grilled chicken, red onions, cilantro, and barbecue sauce drizzle, top-down view on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'pizza-veg-supreme.png', prompt: 'Professional food photography of a vegetarian supreme pizza with capsicum, mushrooms, olives, onions, corn, jalapenos and extra cheese, top-down view on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'pizza-tikka.png', prompt: 'Professional food photography of a chicken tikka pizza with spicy chicken tikka chunks, green chilies, onions, and cheese, top-down view on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'pizza-fajita.png', prompt: 'Professional food photography of a chicken fajita pizza with colorful bell peppers, marinated chicken, onions and cheese, top-down view on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'pizza-cheese.png', prompt: 'Professional food photography of a four cheese pizza with mozzarella, cheddar, parmesan and feta, golden bubbling cheese, top-down view on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'side-garlic-bread.png', prompt: 'Professional food photography of golden garlic bread sticks with melted cheese and herbs, served with marinara dip, on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'side-wings.png', prompt: 'Professional food photography of crispy buffalo chicken wings glazed with spicy sauce, served with ranch dip and celery sticks, on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'side-fries.png', prompt: 'Professional food photography of loaded fries with melted cheese, jalapenos, and sauces, on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'side-nuggets.png', prompt: 'Professional food photography of crispy golden chicken nuggets with dipping sauces, on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'burger-beef.png', prompt: 'Professional food photography of a juicy double beef cheeseburger with lettuce, tomato, and melted cheese, on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'burger-zinger.png', prompt: 'Professional food photography of a crispy zinger chicken burger with lettuce, mayo and cheese, on a white ceramic plate, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'drink-cola.png', prompt: 'Professional food photography of a chilled glass of cola with ice cubes and a straw, condensation droplets, on a white surface, soft studio lighting, isolated on light cream background, ultra detailed, refreshing', size: '1024x1024' },
  { name: 'drink-mint.png', prompt: 'Professional food photography of a refreshing mint lemonade drink in a tall glass with ice and mint leaves, on a white surface, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'deal-family.png', prompt: 'Professional food photography of a family meal deal, two large pizzas, garlic bread, chicken wings and drinks arranged on a dark wooden table, top-down view, warm lighting, appetizing, ultra detailed', size: '1024x1024' },
  { name: 'deal-combo.png', prompt: 'Professional food photography of a combo deal with one medium pizza, garlic bread and a drink, on a white surface, soft studio lighting, isolated on light cream background, ultra detailed, appetizing', size: '1024x1024' },
  { name: 'restaurant-interior.png', prompt: 'Warm cozy urban pizzeria interior with exposed brick, warm pendant lights, wooden tables, red accents, plants, inviting atmosphere, professional interior photography, ultra detailed', size: '1344x768' },
  { name: 'cta-whatsapp-bg.png', prompt: 'Close up of a delicious pizza being pulled with melted cheese strings, dramatic warm lighting, dark moody background, premium food photography, ultra detailed, appetizing', size: '1344x768' },
];

async function genOne(zai: any, job: Job): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await zai.images.generations.create({ prompt: job.prompt, size: job.size as any });
      const b64 = res.data[0].base64;
      const buf = Buffer.from(b64, 'base64');
      fs.writeFileSync(path.join(OUT, job.name), buf);
      console.log(`OK  ${job.name} (${buf.length} bytes, attempt ${attempt})`);
      return true;
    } catch (e: any) {
      console.error(`ERR ${job.name} attempt ${attempt}: ${e.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 5000 * attempt));
    }
  }
  return false;
}

async function main() {
  const zai = await ZAI.create();
  let ok = 0, fail = 0, skip = 0;
  for (const job of jobs) {
    const outPath = path.join(OUT, job.name);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
      console.log(`SKIP ${job.name}`);
      skip++;
      continue;
    }
    const success = await genOne(zai, job);
    if (success) ok++; else fail++;
  }
  console.log(`--- DONE: ${ok} generated, ${skip} skipped, ${fail} failed ---`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
