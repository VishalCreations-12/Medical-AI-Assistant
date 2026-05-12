"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const next =
    theme === "system"
      ? resolvedTheme === "dark"
        ? "light"
        : "dark"
      : theme === "dark"
        ? "light"
        : "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(next)}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:inline" />
    </Button>
  );
}
