import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { clearSessionCookie, audit, getSessionAdmin } from "@/lib/auth";

export async function POST() {
  const admin = await getSessionAdmin();
  const store = await cookies();
  const token = store.get("usp_admin_session")?.value;
  if (token) {
    await db.session.delete({ where: { token } }).catch(() => {});
  }
  if (admin) await audit(admin.id, "logout", `admin:${admin.email}`);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
