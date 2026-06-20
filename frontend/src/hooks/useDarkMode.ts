import { useState, useEffect } from "react";

const KEY = "sinobras-theme";

function getInitial(): "light" | "dark" {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch { /* ignore */ }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
}

export function useDarkMode() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitial);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}
