import { NextResponse } from "next/server";
import { validateAndPriceCart, type RawCartLineInput } from "@/lib/cart-validate";

// Recompute prices server-side; client must NEVER submit totals.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lines: RawCartLineInput[] = Array.isArray(body?.lines) ? body.lines : [];
    const result = await validateAndPriceCart(lines);
    if (!result.ok) {
      return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      lines: result.lines,
      subtotal: result.subtotal,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, errors: [{ field: "body", message: e?.message || "Invalid request" }] }, { status: 400 });
  }
}
