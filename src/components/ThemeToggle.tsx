import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { playSfx } from "../lib/sfx";

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kongsi-theme") === "light";
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("kongsi-theme", isLight ? "light" : "dark");
  }, [isLight]);

  return (
    <button
      type="button"
      onClick={() => {
        playSfx(isLight ? "toggle-on" : "toggle-off");
        setIsLight(!isLight);
      }}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="border border-ink-600 p-2 text-mist-300 transition-colors hover:border-brass-400 hover:text-brass-300"
    >
      {isLight ? <Moon size={16} strokeWidth={1.75} /> : <Sun size={16} strokeWidth={1.75} />}
    </button>
  );
}

export function applyInitialTheme() {
  const saved = localStorage.getItem("kongsi-theme");
  if (saved === "light") {
    document.documentElement.classList.add("light");
  }
}
