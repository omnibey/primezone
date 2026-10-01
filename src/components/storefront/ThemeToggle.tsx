"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="header-icon-btn" aria-label="Toggle theme">
        <i className="ph ph-moon" style={{ visibility: "hidden" }}></i>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      className="header-icon-btn theme-toggle-btn"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <i className="ph ph-sun"></i>
      ) : (
        <i className="ph ph-moon"></i>
      )}
    </button>
  );
}
