"use client";

import { Button } from "@heroui/react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label="Toggle theme"
      onPress={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className="size-4 dark:hidden" />
      <MoonIcon className="hidden size-4 dark:block" />
    </Button>
  );
}
