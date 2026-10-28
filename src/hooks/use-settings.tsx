"use client";

import * as React from "react";
import type { PublicSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/settings";

// Default public settings (omit policies) used while loading.
const DEFAULT_PUBLIC: PublicSettings = (() => {
  const { policies: _policies, ...rest } = DEFAULT_SETTINGS;
  return rest;
})();

type SettingsContextValue = {
  settings: PublicSettings;
  loading: boolean;
};

const SettingsContext = React.createContext<SettingsContextValue>({
  settings: DEFAULT_PUBLIC,
  loading: true,
});

// Module-level promise so all hooks share a single in-flight fetch.
let settingsPromise: Promise<PublicSettings> | null = null;
let cache: PublicSettings | null = null;

function fetchSettings(): Promise<PublicSettings> {
  if (cache) return Promise.resolve(cache);
  if (settingsPromise) return settingsPromise;
  settingsPromise = fetch("/api/settings", { cache: "no-store" })
    .then((r) => r.json())
    .then((data: PublicSettings) => {
      cache = data;
      return data;
    })
    .catch(() => {
      cache = DEFAULT_PUBLIC;
      return DEFAULT_PUBLIC;
    });
  return settingsPromise;
}

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: PublicSettings;
}) {
  const [settings, setSettings] = React.useState<PublicSettings>(
    initialSettings || DEFAULT_PUBLIC
  );
  const [loading, setLoading] = React.useState(!initialSettings);

  React.useEffect(() => {
    if (initialSettings) {
      cache = initialSettings;
      return; // No client fetch needed — server provided settings.
    }
    let alive = true;
    fetchSettings().then((s) => {
      if (!alive) return;
      setSettings(s);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [initialSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return React.useContext(SettingsContext);
}

export function getDefaultSettings(): PublicSettings {
  return DEFAULT_PUBLIC;
}

// Today's open label, computed client-side.
// Handles overnight hours (close <= open means closes next day).
export function todayOpenLabel(s: PublicSettings): {
  open: boolean;
  label: string;
} {
  if (s.temporarilyClosed) return { open: false, label: "Temporarily closed" };
  const now = new Date();
  const dayName = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const today = s.openingHours.find((h) => h.day === dayName);

  const cur = now.getHours() * 60 + now.getMinutes();
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const yesterdayName = DAY_NAMES[(now.getDay() + 6) % 7];
  const yesterday = s.openingHours.find((h) => h.day === yesterdayName);

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  // Inside yesterday's overnight window?
  if (yesterday && !yesterday.closed) {
    const yOpen = toMin(yesterday.open);
    const yClose = toMin(yesterday.close);
    if (yClose <= yOpen && cur < yClose) {
      return { open: true, label: `Open · closes ${yesterday.close}` };
    }
  }

  if (!today || today.closed) return { open: false, label: "Closed today" };

  const open = toMin(today.open);
  const close = toMin(today.close);

  if (close > open) {
    if (cur >= open && cur < close) {
      return { open: true, label: `Open · closes ${today.close}` };
    }
  } else {
    // Overnight window
    if (cur >= open || cur < close) {
      return { open: true, label: `Open · closes ${today.close}` };
    }
  }
  return { open: false, label: `Closed · opens ${today.open}` };
}

export function getDayLabel(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}
