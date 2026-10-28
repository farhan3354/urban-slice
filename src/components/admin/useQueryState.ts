"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

// Tiny helper to manage query params with browser history.
export function useQueryState(
  key: string,
  defaultValue = "",
): [string, (v: string, opts?: { replace?: boolean }) => void] {
  const pathname = usePathname() ?? "/";
  const initial = React.useMemo(() => {
    if (typeof window === "undefined") return defaultValue;
    const params = new URLSearchParams(window.location.search);
    return params.get(key) ?? defaultValue;
  }, [key, defaultValue]);

  const [value, setValue] = React.useState<string>(initial);

  const set = React.useCallback(
    (v: string, opts?: { replace?: boolean }) => {
      setValue(v);
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      if (v === "" || v === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, v);
      }
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.replace) {
        window.history.replaceState(null, "", url);
      } else {
        window.history.pushState(null, "", url);
      }
    },
    [key, defaultValue, pathname],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key) ?? defaultValue);
  }, [key, defaultValue]);

  return [value, set];
}
