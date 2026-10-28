"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";

const DISMISS_KEY = "usp-announcement-dismissed";

export function AnnouncementBar() {
  const { settings } = useSettings();
  const [dismissed, setDismissed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {}
  }, []);

  if (!mounted) return null;
  if (!settings.announcementBar?.enabled) return null;
  if (dismissed) return null;
  if (!settings.announcementBar.text) return null;

  const text = settings.announcementBar.text;
  const link = settings.announcementBar.link || undefined;

  return (
    <div className="relative z-50 bg-primary text-primary-foreground text-sm">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-center gap-3 text-center">
        <p className="flex-1 min-w-0 truncate sm:whitespace-normal">
          {link ? (
            <a href={link} className="underline-offset-2 hover:underline font-medium">
              {text}
            </a>
          ) : (
            <span className="font-medium">{text}</span>
          )}
        </p>
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={() => {
            try {
              sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {}
            setDismissed(true);
          }}
          className="rounded-full p-1 hover:bg-primary-foreground/15 transition-colors -mr-1"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
