"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- legitimate use for hydration safety */
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark = stored === "dark" || (!stored && prefersDark);
    setIsDarkMode(shouldBeDark);
    setMounted(true);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    document.documentElement.classList.toggle("dark", newValue);
    localStorage.setItem("theme", newValue ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {mounted && isDarkMode ? (
        <Sun className="size-5" />
      ) : (
        <Moon className="size-5" />
      )}
    </button>
  );
}
