"use client";

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const DEFAULT_THEME: Theme = "light";
const THEMES = ["light", "dark", "system"] as const;

const listeners = new Set<() => void>();

let currentTheme: Theme = DEFAULT_THEME;
let initialized = false;

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolveTheme(theme));
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function getTheme(): Theme {
  return currentTheme;
}

function getServerTheme(): Theme {
  return DEFAULT_THEME;
}

function subscribe(listener: () => void): () => void {
  if (!initialized) {
    initialized = true;
    currentTheme = readStoredTheme();
  }

  // Re-apply tiap subscribe: menangani dev Strict Mode remount yang me-reset
  // atribut <html>, dan memastikan tema aktif sinkron dengan store.
  applyTheme(currentTheme);
  listeners.add(listener);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemChange = () => {
    if (currentTheme !== "system") return;
    applyTheme(currentTheme);
    emit();
  };
  media.addEventListener("change", handleSystemChange);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", handleSystemChange);
  };
}

export function setTheme(theme: Theme): void {
  currentTheme = theme;

  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage bisa diblokir (private mode); abaikan.
  }

  applyTheme(theme);
  emit();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  return {
    theme,
    resolvedTheme: resolveTheme(theme),
    setTheme,
    themes: THEMES,
  };
}
