"use client"

import Link from "next/link"
import { Search, ShieldCheck } from "lucide-react"
import { useLang } from "@/app/lib/i18n/context"
import { Button } from "@/components/ui/button"

export function Hero() {
  const h = useLang().t("home")
  const l = h.landing

  return (
    <section
      data-onboarding="hero"
      className="relative overflow-hidden border-b bg-gradient-to-b from-primary/15 via-accent to-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-success" />
            {l.verifiedBadge}
          </span>
          <h1 className="mt-6 text-balance font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {l.heroTagline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {h.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/profesionales" />}>
              <Search data-icon="inline-start" />
              {l.heroCta}
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/register" />}>
              {l.heroCtaSecondary}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
