import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, audit } from "@/lib/admin-guard";
import { canTransition } from "@/app/api/admin/orders/route";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const o = await db.order.findUnique({ where: { id } });
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    order: {
      ...o,
      items: JSON.parse(o.itemsJson || "[]"),
    },
  });
}

const PatchSchema = z.object({
  status: z.string().optional(),
  internalNotes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  const { id } = await params;
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }, { status: 400 });
  const d = parsed.data;

  const existing = await db.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update: any = {};
  if (d.status !== undefined) {
    if (!canTransition(existing.status, d.status)) {
      return NextResponse.json({ ok: false, errors: [{ field: "status", message: `Cannot move from ${existing.status} to ${d.status}` }] }, { status: 400 });
    }
    update.status = d.status;
    if (d.status === "confirmed") update.confirmedAt = new Date();
    if (d.status === "completed") update.completedAt = new Date();
    if (d.status === "cancelled") update.cancelledAt = new Date();
  }
  if (d.internalNotes !== undefined) update.internalNotes = d.internalNotes;

  const updated = await db.order.update({ where: { id }, data: update });
  await audit(guard.admin.id, "order.update_status", id, { from: existing.status, to: d.status });
  return NextResponse.json({ ok: true, order: { ...updated, items: JSON.parse(updated.itemsJson || "[]") } });
}
