"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/app/lib/theme-context"
import { useLang } from "@/app/lib/i18n/context"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const labels = useLang().t("theme")
  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={labels.toggle}
      title={isDark ? labels.light : labels.dark}
      onClick={toggleTheme}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
