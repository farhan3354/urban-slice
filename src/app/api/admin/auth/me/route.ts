import { NextResponse } from "next/server";
import { getSessionAdmin } from "@/lib/auth";

export async function GET() {
  const admin = await getSessionAdmin();
  if (!admin) return NextResponse.json({ admin: null }, { status: 401 });
  return NextResponse.json({
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}
