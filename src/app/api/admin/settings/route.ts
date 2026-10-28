import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-guard";
import { getSettings, saveSettings } from "@/lib/settings";
import { z } from "zod";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const s = await getSettings();
  return NextResponse.json({ settings: s });
}

const Schema = z.record(z.string(), z.any());

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }, { status: 400 });
    const current = await getSettings();
    const merged = { ...current, ...parsed.data };
    await saveSettings(merged);
    await audit(guard.admin.id, "settings.update", "main", { keys: Object.keys(parsed.data) });
    return NextResponse.json({ ok: true, settings: merged });
  } catch (e: any) {
    return NextResponse.json({ ok: false, errors: [{ field: "server", message: e?.message }] }, { status: 500 });
  }
}
