import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  recordFailedLogin,
  clearFailedLogin,
  verifyPassword,
  createSession,
  setSessionCookie,
  audit,
} from "@/lib/auth";
import { getClientIP, getUserAgent } from "@/lib/admin-guard";
import { ensureBootstrapAdmin } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password is required"),
});

export async function POST(req: Request) {
  // Ensure bootstrap admin exists (env-based)
  await ensureBootstrapAdmin();
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;
    const ip = getClientIP(req);
    const ua = getUserAgent(req);

    const rl = checkRateLimit(ip);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, errors: [{ field: "form", message: `Too many attempts. Try again in ${rl.retryAfterSec}s.` }] },
        { status: 429 }
      );
    }

    const admin = await db.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    if (!admin || !admin.active) {
      recordFailedLogin(ip);
      return NextResponse.json(
        { ok: false, errors: [{ field: "form", message: "Invalid email or password" }] },
        { status: 401 }
      );
    }
    const ok = await verifyPassword(password, admin.passwordHash);
    if (!ok) {
      recordFailedLogin(ip);
      await audit(admin.id, "login_failed", `admin:${admin.email}`, { ip });
      return NextResponse.json(
        { ok: false, errors: [{ field: "form", message: "Invalid email or password" }] },
        { status: 401 }
      );
    }

    clearFailedLogin(ip);
    const { token, expiresAt } = await createSession(admin.id, ip, ua);
    await setSessionCookie(token, expiresAt);
    await audit(admin.id, "login_success", `admin:${admin.email}`, { ip });
    return NextResponse.json({
      ok: true,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, errors: [{ field: "server", message: e?.message || "Login failed" }] },
      { status: 500 }
    );
  }
}
