"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Pizza, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { extractErrors, type ApiError } from "@/components/admin/types";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next") || "/admin";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<ApiError[]>([]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        const errs = await extractErrors(res);
        setErrors(errs);
        if (errs.length === 0) setErrors([{ field: "form", message: "Sign-in failed" }]);
        return;
      }
      toast.success(`Welcome back, ${data.admin?.name || "Admin"}`);
      window.location.href = nextParam;
    } catch (e: any) {
      setErrors([{ field: "form", message: e?.message || "Network error" }]);
    } finally {
      setLoading(false);
    }
  };

  const formError = errors.find((e) => e.field === "form" || e.field === "server")?.message;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* Decorative background */}
      <div
        aria-hidden
        className="pizza-grid-bg pointer-events-none absolute inset-0 opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Pizza className="size-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Urban Slice Pizza
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin Console · Kabirwala
          </p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="gap-1.5">
            <CardTitle className="font-display text-lg">Sign in</CardTitle>
            <CardDescription>
              Enter your admin credentials to continue.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <ShieldCheck className="size-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@urbanslice.pk"
                  disabled={loading}
                  aria-invalid={!!errors.find((e) => e.field === "email")}
                />
                {errors.find((e) => e.field === "email") && (
                  <p className="text-xs text-destructive">
                    {errors.find((e) => e.field === "email")!.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  aria-invalid={!!errors.find((e) => e.field === "password")}
                />
                {errors.find((e) => e.field === "password") && (
                  <p className="text-xs text-destructive">
                    {errors.find((e) => e.field === "password")!.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch gap-3">
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="size-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Demo credentials</p>
                <p className="mt-0.5">admin@urbanslice.pk / admin123</p>
              </div>
              <Link
                href="/"
                className="text-center text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back to website
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
