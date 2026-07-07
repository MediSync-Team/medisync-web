"use client"

import { Search, CalendarCheck, Video, ClipboardList } from "lucide-react"
import { useLang } from "@/app/lib/i18n/context"
import { useInView } from "@/hooks/use-in-view"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export function HowItWorks() {
  const l = useLang().t("home").landing
  const { ref, inView } = useInView<HTMLDivElement>()
  const steps = [
    { icon: Search, ...l.steps.search },
    { icon: CalendarCheck, ...l.steps.book },
    { icon: Video, ...l.steps.attend },
    { icon: ClipboardList, ...l.steps.manage },
  ]

  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-t bg-muted/30 py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {l.howItWorksTitle}
          </h2>
          <p className="mt-3 text-muted-foreground">{l.howItWorksSubtitle}</p>
        </div>
        <div ref={ref} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Card
              key={step.title}
              className={cn(
                "relative rounded-2xl border-border/80 shadow-sm",
                inView
                  ? "animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-backwards motion-reduce:animate-none"
                  : "opacity-0"
              )}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                </div>
                <span className="font-heading text-xs font-semibold text-muted-foreground">
                  {l.step} {i + 1}
                </span>
                <h3 className="font-heading text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
