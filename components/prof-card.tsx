"use client"

import Link from "next/link"
import { Video, MapPin, BadgeCheck } from "lucide-react"
import type { Profesional } from "@/app/lib/api"
import { useLang } from "@/app/lib/i18n/context"
import { getSpecialtyDisplayName } from "@/app/lib/specialty"
import { getLocale } from "@/app/lib/date"
import { StarRating } from "@/components/star-rating"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

function initials(nombre: string, apellido: string) {
  return `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase()
}

export function ProfCard({
  prof,
  showDisponible = false,
}: {
  prof: Profesional
  showDisponible?: boolean
}) {
  const { t, lang } = useLang()
  const h = t("home")
  const modality = t("modality")
  const locale = getLocale(lang)

  const modalidades = [
    ...new Set(prof.disponibilidades?.map((d) => d.modalidad) ?? []),
  ]
  const tienePresencial = modalidades.some(
    (m) => m === "PRESENCIAL" || m === "AMBOS"
  )
  const tieneVirtual = modalidades.some(
    (m) => m === "VIRTUAL" || m === "AMBOS"
  )

  const specialtyName = getSpecialtyDisplayName(
    prof.especialidad?.nombre || "",
    lang,
    (h.specialties as Record<string, string>) || {}
  )
  const obras = prof.obrasSociales ?? []

  return (
    <Card
      className={`group flex flex-col overflow-hidden rounded-2xl py-0 shadow-sm transition-all hover:shadow-md ${
        showDisponible
          ? "border-success/40 hover:border-success/60"
          : "border-border/80 hover:border-primary/30"
      }`}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        {showDisponible && (
          <div className="flex items-center gap-1.5">
            <span className="size-2 animate-pulse rounded-full bg-success" />
            <span className="text-xs font-semibold text-success">
              {h.availableThisWeek}
            </span>
          </div>
        )}

        <div className="flex items-start gap-4">
          <Avatar className="size-16 rounded-xl ring-1 ring-border">
            <AvatarImage src={prof.fotoUrl || undefined} alt={prof.nombre} />
            <AvatarFallback className="rounded-xl bg-primary/10 text-base font-semibold text-primary">
              {initials(prof.nombre, prof.apellido)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-heading text-base font-semibold">
                Dr/a. {prof.nombre} {prof.apellido}
              </h3>
              {prof.matricula && (
                <BadgeCheck className="size-4 shrink-0 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{specialtyName}</p>
            {prof.ratingPromedio != null && (
              <div className="mt-1.5">
                <StarRating
                  rating={prof.ratingPromedio}
                  size={14}
                  showValue
                  count={prof.totalResenas}
                />
              </div>
            )}
            {prof.distanciaKm != null && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <MapPin className="size-3.5" />
                {h.landing.kmAway.replace("{n}", prof.distanciaKm.toLocaleString(locale))}
              </p>
            )}
          </div>
        </div>

        {(tienePresencial || tieneVirtual) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {tieneVirtual && (
              <span className="inline-flex items-center gap-1">
                <Video className="size-3.5 text-info" /> {modality.VIRTUAL}
              </span>
            )}
            {tienePresencial && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-success" /> {modality.PRESENCIAL}
              </span>
            )}
          </div>
        )}

        {obras.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {obras.slice(0, 3).map((o) => (
              <Badge key={o} variant="outline" className="font-normal">
                {o}
              </Badge>
            ))}
            {obras.length > 3 && (
              <Badge variant="outline" className="font-normal">
                +{obras.length - 3}
              </Badge>
            )}
          </div>
        )}

        {prof.bio && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {prof.bio}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t bg-muted/40 px-5 py-4">
        <div className="flex flex-col">
          {prof.precioConsulta > 0 ? (
            <>
              <span className="text-xs text-muted-foreground">
                {h.landing.from}
              </span>
              <span className="font-heading text-lg font-bold">
                ${Number(prof.precioConsulta).toLocaleString(locale)}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              {h.consultPrice}
            </span>
          )}
        </div>
        <Button render={<Link href={`/profesional/${prof.id}`} />}>
          {h.viewProfile}
        </Button>
      </CardFooter>
    </Card>
  )
}
