"use client"

import { useLang } from "@/app/lib/i18n/context"
import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { lang, setLang, t } = useLang()
  const labels = t("lang")
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={labels.toggle}
      title={lang === "es" ? labels.switchToEnglish : labels.switchToSpanish}
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="font-medium"
    >
      {lang === "es" ? "EN" : "ES"}
    </Button>
  )
}
