import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className = "" }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 ${className}`}
        aria-hidden="true"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`relative p-2 rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer select-none
        border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700
        dark:border-zinc-800 dark:hover:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300
        shadow-sm hover:shadow
        ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun
          size={17}
          className="text-amber-400 transition-transform duration-300 hover:rotate-45"
        />
      ) : (
        <Moon
          size={17}
          className="text-indigo-600 transition-transform duration-300 hover:-rotate-12"
        />
      )}
    </button>
  );
};
