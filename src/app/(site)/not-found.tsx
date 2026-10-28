import Link from "next/link";
import { Home, Pizza } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid place-items-center px-4 py-20 text-center">
      <div className="mx-auto max-w-md">
        <div className="mx-auto size-24 grid place-items-center rounded-full bg-primary/10 mb-6">
          <Pizza className="size-12 text-primary" />
        </div>
        <p className="font-display font-extrabold text-7xl text-primary">404</p>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl mt-2">
          Slice not found
        </h1>
        <p className="mt-2 text-muted-foreground">
          Looks like this page got eaten! The link may be broken or the page may
          have been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">
              <Home className="size-4" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/menu">
              <Pizza className="size-4" />
              Browse menu
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
