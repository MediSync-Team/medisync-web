import Link from "next/link"
import { Logo } from "@/components/logo"

const groups = [
  {
    title: "Plataforma",
    links: [
      { label: "Buscar profesionales", href: "/profesionales" },
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "Para profesionales", href: "/register" },
      { label: "Para clínicas", href: "/register" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre nosotros", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contacto", href: "#" },
      { label: "Trabajá con nosotros", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Términos y condiciones", href: "#" },
      { label: "Política de privacidad", href: "#" },
      { label: "Protección de datos", href: "#" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Tu salud, sincronizada. La plataforma que conecta pacientes y
              profesionales de la salud.
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
            © {new Date().getFullYear()} MediSync. Todos los derechos
            reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Hecho con cuidado para tu salud.
          </p>
        </div>
      </div>
    </footer>
  )
}
