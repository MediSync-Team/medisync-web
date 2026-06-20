"use client"

import * as React from "react"
import { Search, SlidersHorizontal, X, Check } from "lucide-react"
import { api, type Especialidad, type Profesional } from "@/app/lib/api"
import { useAuth } from "@/app/lib/auth-context"
import { useLang } from "@/app/lib/i18n/context"
import {
  getSavedCoverageFilter,
  isAutoCoverageDisabled,
  setAutoCoverageDisabled,
  shouldDisableAutoCoverage,
} from "@/app/lib/home-filters"
import { loadObrasSociales, getObrasSociales } from "@/app/lib/obras-sociales"
import { getSpecialtyDisplayName } from "@/app/lib/specialty"
import { getLocale, todayInputValue, formatClinicDateKeyForDisplay } from "@/app/lib/date"
import { ProfCard } from "@/components/prof-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

const LIMIT = 9
const ALL = "todas"
const REL = "relevancia"
const PRICE_MAX = 25000

type Modalidad = "PRESENCIAL" | "VIRTUAL" | ""
type OrderBy = "precio_asc" | "precio_desc" | "nombre_asc" | ""

interface Filters {
  search: string
  especialidad: string
  modalidad: Modalidad
  obraSocial: string
  precio: [number, number]
  fecha: string
  orderBy: OrderBy
  disponibleEstaSemana: boolean
}

const EMPTY_FILTERS: Filters = {
  search: "",
  especialidad: "",
  modalidad: "",
  obraSocial: "",
  precio: [0, PRICE_MAX],
  fecha: "",
  orderBy: "",
  disponibleEstaSemana: false,
}

export function SearchSection() {
  const { user, loading: authLoading } = useAuth()
  const { t, lang } = useLang()
  const h = t("home")
  const l = h.landing
  const locale = getLocale(lang)

  const [especialidades, setEspecialidades] = React.useState<Especialidad[]>([])
  const [profesionales, setProfesionales] = React.useState<Profesional[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [pagination, setPagination] = React.useState({ total: 0, totalPages: 1 })

  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = React.useState("")
  const initialised = React.useRef(false)

  const fetchProfesionales = React.useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    try {
      const params: Parameters<typeof api.profesionales.getAll>[0] = {
        page: String(p),
        limit: String(LIMIT),
      }
      if (f.search) params.especialidad = f.search
      else if (f.especialidad) params.especialidad = f.especialidad
      if (f.precio[0] > 0) params.precioMin = String(f.precio[0])
      if (f.precio[1] < PRICE_MAX) params.precioMax = String(f.precio[1])
      if (f.modalidad) params.modalidad = f.modalidad
      if (f.fecha) params.fecha = f.fecha
      if (f.orderBy) params.orderBy = f.orderBy
      if (f.disponibleEstaSemana) params.disponibleEstaSemana = "true"
      if (f.obraSocial) params.obraSocial = f.obraSocial.trim().toUpperCase()

      const data = await api.profesionales.getAll(params)
      setProfesionales(data.profesionales)
      setPagination({
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      })
    } catch (err) {
      console.error("Error loading profesionales:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    api.especialidades.getAll().then(setEspecialidades).catch(() => {})
    loadObrasSociales()
  }, [])

  // Initialise once auth resolves (auto-apply saved obra social).
  React.useEffect(() => {
    if (authLoading || initialised.current) return
    initialised.current = true
    const initial = { ...EMPTY_FILTERS }
    const savedCoverage = getSavedCoverageFilter(user?.paciente?.obraSocial)
    if (savedCoverage && !isAutoCoverageDisabled(user?.id)) {
      initial.obraSocial = savedCoverage
    }
    setFilters(initial)
    fetchProfesionales(initial, 1)
  }, [authLoading, fetchProfesionales, user?.id, user?.paciente?.obraSocial])

  const apply = React.useCallback(
    (next: Filters) => {
      const savedCoverage = getSavedCoverageFilter(user?.paciente?.obraSocial)
      if (shouldDisableAutoCoverage(next.obraSocial, savedCoverage)) {
        setAutoCoverageDisabled(user?.id, true)
      } else if (next.obraSocial) {
        setAutoCoverageDisabled(user?.id, false)
      }
      setFilters(next)
      setPage(1)
      fetchProfesionales(next, 1)
    },
    [fetchProfesionales, user?.id, user?.paciente?.obraSocial]
  )

  const patch = (p: Partial<Filters>) => apply({ ...filters, ...p })

  const handleSearch = () => patch({ search: searchInput, especialidad: "" })

  const handlePageChange = (next: number) => {
    setPage(next)
    fetchProfesionales(filters, next)
    document.getElementById("buscar")?.scrollIntoView({ behavior: "smooth" })
  }

  const resetFilters = () => {
    setSearchInput("")
    apply(EMPTY_FILTERS)
  }

  const hasFilters =
    filters.search !== "" ||
    filters.especialidad !== "" ||
    filters.modalidad !== "" ||
    filters.obraSocial !== "" ||
    filters.fecha !== "" ||
    filters.orderBy !== "" ||
    filters.disponibleEstaSemana ||
    filters.precio[0] !== 0 ||
    filters.precio[1] !== PRICE_MAX

  const featurePills = [
    h.featurePills.onlineAppointments,
    h.featurePills.securePayment,
    h.featurePills.medicalHistory,
    h.featurePills.inPersonVirtual,
  ]

  // Active filter chips
  const chips: { key: string; label: string; clear: () => void }[] = [
    ...(filters.disponibleEstaSemana
      ? [{ key: "disp", label: h.availableThisWeek, clear: () => patch({ disponibleEstaSemana: false }) }]
      : []),
    ...(filters.modalidad
      ? [{ key: "mod", label: filters.modalidad === "PRESENCIAL" ? h.inPerson : h.virtual, clear: () => patch({ modalidad: "" }) }]
      : []),
    ...(filters.obraSocial
      ? [{ key: "os", label: `${h.obraSocial}: ${filters.obraSocial}`, clear: () => patch({ obraSocial: "" }) }]
      : []),
    ...(filters.fecha
      ? [{ key: "fecha", label: `${h.date}: ${formatClinicDateKeyForDisplay(filters.fecha, locale, { day: "numeric", month: "short" })}`, clear: () => patch({ fecha: "" }) }]
      : []),
    ...(filters.orderBy
      ? [{ key: "order", label: { precio_asc: h.priceAsc, precio_desc: h.priceDesc, nombre_asc: h.nameAsc }[filters.orderBy], clear: () => patch({ orderBy: "" }) }]
      : []),
  ]

  return (
    <section
      id="buscar"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-2">
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {l.searchTitle}
        </h2>
        <p className="text-muted-foreground">{l.searchSubtitle}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:h-fit" data-onboarding="search-bar">
          <Card className="gap-5 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 font-heading text-sm font-semibold">
                <SlidersHorizontal className="size-4 text-primary" />
                {l.filtersLabel}
              </span>
              {hasFilters && (
                <Button variant="ghost" size="xs" onClick={resetFilters}>
                  <X data-icon="inline-start" /> {l.clear}
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="q">{l.searchLabel}</Label>
              <Input
                id="q"
                placeholder={l.searchFieldPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{t("auth").specialty}</Label>
              <Select
                value={filters.especialidad || ALL}
                onValueChange={(v) => patch({ especialidad: !v || v === ALL ? "" : v, search: "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL}>{h.allSpecialties}</SelectItem>
                    {especialidades.map((e) => (
                      <SelectItem key={e.id} value={e.nombre}>
                        {getSpecialtyDisplayName(e.nombre, lang, h.specialties as Record<string, string>)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{h.modality}</Label>
              <Select
                value={filters.modalidad || ALL}
                onValueChange={(v) => patch({ modalidad: (v === ALL ? "" : v) as Modalidad })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL}>{h.allModalities}</SelectItem>
                    <SelectItem value="PRESENCIAL">{h.inPerson}</SelectItem>
                    <SelectItem value="VIRTUAL">{h.virtual}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{h.healthInsurance}</Label>
              <Select
                value={filters.obraSocial || ALL}
                onValueChange={(v) => patch({ obraSocial: !v || v === ALL ? "" : v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={ALL}>{h.allCoverages}</SelectItem>
                    {getObrasSociales().map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label>{h.priceRange}</Label>
                <span className="text-xs font-medium text-muted-foreground">
                  ${filters.precio[0].toLocaleString(locale)} – $
                  {filters.precio[1].toLocaleString(locale)}
                </span>
              </div>
              <Slider
                value={filters.precio}
                onValueChange={(v) => {
                  const a = Array.isArray(v) ? v : [v, v]
                  setFilters((f) => ({ ...f, precio: [a[0], a[1]] }))
                }}
                onValueCommitted={(v) => {
                  const a = Array.isArray(v) ? v : [v, v]
                  patch({ precio: [a[0], a[1]] })
                }}
                min={0}
                max={PRICE_MAX}
                step={500}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha">{h.date}</Label>
              <Input
                id="fecha"
                type="date"
                value={filters.fecha}
                min={todayInputValue()}
                onChange={(e) => patch({ fecha: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>{h.orderBy}</Label>
              <Select
                value={filters.orderBy || REL}
                onValueChange={(v) => patch({ orderBy: (v === REL ? "" : v) as OrderBy })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={REL}>{h.relevance}</SelectItem>
                    <SelectItem value="precio_asc">{h.priceAsc}</SelectItem>
                    <SelectItem value="precio_desc">{h.priceDesc}</SelectItem>
                    <SelectItem value="nombre_asc">{h.nameAsc}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 p-3">
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-success">
                  {h.availableThisWeek}
                </span>
                <span className="text-xs text-muted-foreground">
                  {h.availableThisWeekSubtext}
                </span>
              </span>
              <Switch
                checked={filters.disponibleEstaSemana}
                onCheckedChange={(c) => patch({ disponibleEstaSemana: c })}
              />
            </label>

            <Button className="w-full" onClick={handleSearch}>
              <Search data-icon="inline-start" />
              {h.buttons.search}
            </Button>
          </Card>
        </aside>

        <div className="flex flex-col gap-6">
          {/* Feature pills */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {featurePills.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-success" /> {f}
              </span>
            ))}
          </div>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {h.activeFilters}:
              </span>
              {chips.map((c) => (
                <span
                  key={c.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
                >
                  {c.label}
                  <button onClick={c.clear} aria-label={c.label}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={resetFilters}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {h.clearAll}
              </button>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {pagination.total}
            </span>{" "}
            {l.resultsSuffix}
          </p>

          {loading ? (
            <div
              data-onboarding="prof-list"
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="gap-4 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <Skeleton className="size-16 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                  <Skeleton className="mt-2 h-9 w-full rounded-lg" />
                </Card>
              ))}
            </div>
          ) : profesionales.length > 0 ? (
            <div
              data-onboarding="prof-list"
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              {profesionales.map((p) => (
                <ProfCard
                  key={p.id}
                  prof={p}
                  showDisponible={filters.disponibleEstaSemana}
                />
              ))}
            </div>
          ) : (
            <Empty className="rounded-2xl border border-dashed py-16">
              <EmptyHeader>
                <EmptyTitle>{h.noResultsTitle}</EmptyTitle>
                <EmptyDescription>{h.noResultsDesc}</EmptyDescription>
              </EmptyHeader>
              {hasFilters && (
                <Button variant="outline" onClick={resetFilters}>
                  {h.clearAll}
                </Button>
              )}
            </Empty>
          )}

          {pagination.totalPages > 1 && (
            <Pagination className="mt-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#buscar"
                    onClick={(e) => {
                      e.preventDefault()
                      if (page > 1) handlePageChange(page - 1)
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: pagination.totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#buscar"
                      isActive={i + 1 === page}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(i + 1)
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#buscar"
                    onClick={(e) => {
                      e.preventDefault()
                      if (page < pagination.totalPages) handlePageChange(page + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </section>
  )
}
