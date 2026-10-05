import { create } from "zustand";
import type { Theme } from "@/types/theme/theme";

interface ThemeState {
  theme: Theme;
  setTheme: (newTheme: Theme) => void;
  toggleTheme: () => void;
  toggleLight: () => void;
  toggleDark: () => void;
  initializeTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem("theme") as Theme | null;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const defaultTheme = stored ?? (prefersDark ? "dark" : "light");

  document.documentElement.classList.toggle("dark", defaultTheme === "dark");
  return defaultTheme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),

  initializeTheme: () => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const defaultTheme = stored ?? (prefersDark ? "dark" : "light");

    get().setTheme(defaultTheme);
  },

  setTheme: (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    set({ theme: newTheme });
  },

  toggleTheme: () => {
    const { theme, setTheme } = get();
    setTheme(theme === "dark" ? "light" : "dark");
  },

  toggleLight: () => get().setTheme("light"),

  toggleDark: () => get().setTheme("dark"),
}));
