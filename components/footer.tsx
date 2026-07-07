"use client"

import Link from "next/link"
import { useLang } from "@/app/lib/i18n/context"
import { Logo } from "@/components/logo"

export function Footer() {
  const footer = useLang().t("home").footer
  const groups = [
    {
      title: footer.platform,
      links: [
        { label: footer.searchProfessionals, href: "/profesionales" },
        { label: footer.howItWorks, href: "/#como-funciona" },
        { label: footer.forProfessionals, href: "/register" },
        { label: footer.forClinics, href: "/register" },
      ],
    },
  ]

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {footer.description}
            </p>
          </div>
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h3 className="font-heading text-sm font-semibold">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {footer.rights.replace("{{year}}", String(new Date().getFullYear()))}
          </p>
          <p className="text-sm text-muted-foreground">
            {footer.care}
          </p>
        </div>
      </div>
    </footer>
  )
}
