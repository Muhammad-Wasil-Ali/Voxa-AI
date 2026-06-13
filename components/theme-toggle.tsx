"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full bg-card/80 shadow-sm backdrop-blur"
    >
      <Sun className="size-4 scale-100 transition-transform dark:scale-0" />
      <Moon className="absolute size-4 scale-0 transition-transform dark:scale-100" />
    </Button>
  );
}
