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
      className="relative overflow-hidden border-b border-brand-800 bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-brand-500/25 blur-3xl motion-safe:animate-pulse [animation-duration:6s]!" />
        <div className="absolute -bottom-40 -left-24 size-80 rounded-full bg-health-500/10 blur-3xl" />
        <div className="absolute -right-24 top-10 size-72 rounded-full bg-brand-400/15 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-brand-100 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-700 fill-mode-backwards motion-reduce:animate-none">
            <ShieldCheck className="size-3.5 text-health-500" />
            {l.verifiedBadge}
          </span>
          <h1 className="mt-6 text-balance font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards motion-reduce:animate-none">
            {l.heroTagline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-brand-100/80 sm:text-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-backwards motion-reduce:animate-none">
            {h.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700 delay-450 fill-mode-backwards motion-reduce:animate-none">
            <Button
              size="lg"
              className="bg-white text-brand-700 hover:bg-brand-100"
              render={<Link href="/profesionales" />}
            >
              <Search data-icon="inline-start" />
              {l.heroCta}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              render={<Link href="/register" />}
            >
              {l.heroCtaSecondary}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
