"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function MenuSearch({
  defaultValue,
  className,
}: {
  defaultValue?: string;
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = React.useState(defaultValue || "");
  const [debounced, setDebounced] = React.useState(defaultValue || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), 250);
    return () => clearTimeout(t);
  }, [value]);

  const isMounted = React.useRef(false);
  React.useEffect(() => {
    isMounted.current = true;
  }, []);

  React.useEffect(() => {
    if (!isMounted.current) return;
    const cur = params.get("q") || "";
    if (debounced === cur) return;
    const next = new URLSearchParams(params.toString());
    if (debounced) next.set("q", debounced);
    else next.delete("q");
    const qs = next.toString();
    React.startTransition(() => {
      router.replace(qs ? `/menu?${qs}` : "/menu", { scroll: false });
    });
  }, [debounced, params, router]);

  return (
    <div className={cn("relative flex-1 max-w-md", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search pizzas, sides, drinks…"
        className="pl-9 pr-9"
        aria-label="Search menu"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
