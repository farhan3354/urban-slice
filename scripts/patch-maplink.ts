// Patch DB: set the verified Google Maps listing link from the owner.
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
const db = new PrismaClient();
async function main() {
  const row = await db.restaurantSetting.findUnique({ where: { id: "main" } });
  let current = DEFAULT_SETTINGS;
  if (row) {
    try { current = { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) }; } catch {}
  }
  const patched = { ...current, mapLink: "https://share.google/IrwMc8yaUJTIhxX2F" };
  await db.restaurantSetting.upsert({
    where: { id: "main" },
    update: { value: JSON.stringify(patched) },
    create: { id: "main", value: JSON.stringify(patched) },
  });
  console.log("✓ mapLink set to verified Google Maps listing:", patched.mapLink);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect());
