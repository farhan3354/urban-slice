import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const deals = await db.deal.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  const now = new Date();
  const visible = deals.filter((d) => {
    if (d.startDate && now < d.startDate) return false;
    if (d.endDate && now > d.endDate) return false;
    return true;
  });
  return NextResponse.json({ deals: visible });
}
