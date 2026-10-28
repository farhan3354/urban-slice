"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 grid place-items-center px-4 py-20 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto size-20 grid place-items-center rounded-full bg-red-100 mb-6">
            <AlertTriangle className="size-10 text-red-600" />
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl">
            Something went wrong
          </h1>
          <p className="mt-2 text-muted-foreground">
            An unexpected error occurred. Please try again — if the problem
            persists, refresh the page or come back later.
          </p>
          {error.digest && (
            <p className="mt-3 text-xs text-muted-foreground">
              Error reference: <span className="font-mono">{error.digest}</span>
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>
              <RotateCcw className="size-4" />
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="size-4" />
                Go home
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <footer className="mt-auto border-t bg-card py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground">
          Urban Slice Pizza · Kabirwala, Punjab, Pakistan
        </div>
      </footer>
    </div>
  );
}
