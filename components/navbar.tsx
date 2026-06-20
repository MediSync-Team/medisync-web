"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLang } from "@/app/lib/i18n/context"
import { useAuth } from "@/app/lib/auth-context"
import { getDashboardPath } from "@/app/lib/auth-redirects"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Navbar() {
  const { t } = useLang()
  const nav = t("nav")
  const auth = t("auth")
  const { user, logout } = useAuth()

  const links: { label: string; href: string }[] = [
    { label: nav.search, href: "/#buscar" },
    { label: nav.howItWorks, href: "/#como-funciona" },
    { label: nav.forProfessionals, href: "/register" },
    { label: nav.pricing, href: "/#precios" },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                render={<Link href={link.href} />}
              >
                {link.label}
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href={getDashboardPath(user)} data-onboarding="nav-register" />}
                >
                  {nav.dashboard}
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  {nav.logout}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  {auth.login}
                </Button>
                <Button size="sm" render={<Link href="/register" data-onboarding="nav-register" />}>
                  {auth.register}
                </Button>
              </>
            )}
          </div>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Menú"
                />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {links.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    className="justify-start"
                    render={<Link href={link.href} />}
                  >
                    {link.label}
                  </Button>
                ))}
                <div className="mt-4 flex flex-col gap-2">
                  {user ? (
                    <>
                      <Button variant="outline" render={<Link href={getDashboardPath(user)} />}>
                        {nav.dashboard}
                      </Button>
                      <Button onClick={logout}>{nav.logout}</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" render={<Link href="/login" />}>
                        {auth.login}
                      </Button>
                      <Button render={<Link href="/register" />}>
                        {auth.register}
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
