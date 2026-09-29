"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { SortOrder } from "./filter";

export interface Settings {
  columns: 2 | 3;
  sort: SortOrder;
  density: "comfortable" | "compact";
  startView: "library" | "resources" | "starred";
}

export const DEFAULT_SETTINGS: Settings = {
  columns: 2,
  sort: "newest",
  density: "comfortable",
  startView: "library",
};

const KEY = "gleanings-settings";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cached: Settings = DEFAULT_SETTINGS;

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// Must return the same object until the stored value changes, or React loops.
function getSnapshot(): Settings {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = { ...DEFAULT_SETTINGS, ...JSON.parse(raw ?? "{}") };
    } catch {
      cached = DEFAULT_SETTINGS;
    }
  }
  return cached;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Per-device preferences in localStorage; defaults during server render. */
export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SETTINGS);

  const update = useCallback((patch: Partial<Settings>) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...getSnapshot(), ...patch }));
    } catch {
      // Storage blocked (private mode) — the change just won't persist.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { settings, update };
}
