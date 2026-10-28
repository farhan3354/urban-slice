// One-off patch: apply the real logo + 1pm-3am hours + new tagline to the DB.
import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const db = new PrismaClient();

async function main() {
  const row = await db.restaurantSetting.findUnique({ where: { id: "main" } });
  let current = DEFAULT_SETTINGS;
  if (row) {
    try {
      current = { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) };
    } catch {}
  }
  // Sync database with the latest DEFAULT_SETTINGS
  const patched = {
    ...DEFAULT_SETTINGS,
    ...current,
    restaurantName: DEFAULT_SETTINGS.restaurantName,
    tagline: DEFAULT_SETTINGS.tagline,
    logoUrl: DEFAULT_SETTINGS.logoUrl,
    address: DEFAULT_SETTINGS.address,
    mapLink: DEFAULT_SETTINGS.mapLink,
    whatsappNumber: DEFAULT_SETTINGS.whatsappNumber,
    contactPhone: DEFAULT_SETTINGS.contactPhone,
    contactPhoneSecondary: DEFAULT_SETTINGS.contactPhoneSecondary,
    openingHours: DEFAULT_SETTINGS.openingHours,
    announcementBar: DEFAULT_SETTINGS.announcementBar,
    hero: DEFAULT_SETTINGS.hero,
    social: DEFAULT_SETTINGS.social,
    policies: DEFAULT_SETTINGS.policies,
    footerNote: DEFAULT_SETTINGS.footerNote,
  };
  await db.restaurantSetting.upsert({
    where: { id: "main" },
    update: { value: JSON.stringify(patched) },
    create: { id: "main", value: JSON.stringify(patched) },
  });
  console.log("✓ Settings patched in database:");
  console.log("  restaurantName:", patched.restaurantName);
  console.log("  logoUrl:", patched.logoUrl);
  console.log("  tagline:", patched.tagline);
  console.log("  phones:", patched.contactPhone, "/", patched.contactPhoneSecondary);
  console.log("  whatsapp:", patched.whatsappNumber);
  console.log("  hero headline:", patched.hero.headline);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
