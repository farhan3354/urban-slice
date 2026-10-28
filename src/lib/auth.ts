// Auth — server-side cookie session for admin.
// Uses bcryptjs (pure JS, no native deps) + httpOnly session token.
// Includes basic in-memory rate limiting for login attempts.

import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const COOKIE_NAME = "usp_admin_session";
const SESSION_TTL_DAYS = 7;

// ---------- Rate limiting (in-memory, per-process) ----------
const loginAttempts = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000; // 10 min

export function checkRateLimit(ip: string): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec) return { ok: true, retryAfterSec: 0 };
  if (now - rec.firstAt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { ok: true, retryAfterSec: 0 };
  }
  if (rec.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - rec.firstAt)) / 1000);
    return { ok: false, retryAfterSec };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function recordFailedLogin(ip: string) {
  const now = Date.now();
  const rec = loginAttempts.get(ip) || { count: 0, firstAt: now };
  rec.count += 1;
  if (now - rec.firstAt > WINDOW_MS) {
    rec.firstAt = now;
    rec.count = 1;
  }
  loginAttempts.set(ip, rec);
}

export function clearFailedLogin(ip: string) {
  loginAttempts.delete(ip);
}

// ---------- Session management ----------

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function createSession(adminId: string, ip?: string, userAgent?: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { adminId, token, expiresAt, ip, userAgent },
  });
  return { token, expiresAt };
}

export async function destroySession(token: string) {
  try {
    await db.session.delete({ where: { token } });
  } catch {}
}

export async function getSessionAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { admin: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (!session.admin.active) return null;
  return session.admin;
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const AUTH_COOKIE = COOKIE_NAME;

// ---------- Audit ----------

export async function audit(
  adminId: string | null,
  action: string,
  target?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await db.auditEvent.create({
      data: {
        adminId,
        action,
        target,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch {}
}

// ---------- Bootstrap ----------

export async function ensureBootstrapAdmin() {
  const count = await db.adminUser.count();
  if (count > 0) return false;
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@urbanslice.pk";
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "admin123";
  const name = process.env.ADMIN_BOOTSTRAP_NAME || "Demo Admin";
  const hash = await hashPassword(password);
  await db.adminUser.create({
    data: { email, name, passwordHash: hash, role: "super_admin", active: true },
  });
  return true;
}
