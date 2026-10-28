// Patch DB: set owner-confirmed phone numbers + WhatsApp number.
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
const db = new PrismaClient();
async function main() {
  const row = await db.restaurantSetting.findUnique({ where: { id: "main" } });
  let current = DEFAULT_SETTINGS;
  if (row) {
    try { current = { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) }; } catch {}
  }
  const patched = {
    ...current,
    whatsappNumber: "923052806919",
    contactPhone: "+92 305 2806919",
    contactPhoneSecondary: "+92 342 0663919",
  };
  await db.restaurantSetting.upsert({
    where: { id: "main" },
    update: { value: JSON.stringify(patched) },
    create: { id: "main", value: JSON.stringify(patched) },
  });
  console.log("✓ Numbers set:");
  console.log("  whatsappNumber:", patched.whatsappNumber);
  console.log("  contactPhone:", patched.contactPhone);
  console.log("  contactPhoneSecondary:", patched.contactPhoneSecondary);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect());
