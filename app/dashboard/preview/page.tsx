'use client';

/**
 * MediSync — Professional dashboard, design preview.
 *
 * Built on the LANDING design language: shadcn/base-ui primitives
 * (@/components/ui/*), Geist font-heading, primary-blue + success-green tokens,
 * rounded cards, bg-primary/10 icon tiles, from-accent/60 gradient band, lucide
 * icons. One display accent (Newsreader, via --font-display in layout.tsx) for
 * the greeting + large metric numbers. Fully token-based → dark-safe.
 *
 * Self-contained: mock Spanish data, no api/auth. View at /dashboard/preview.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Clock, Video, MapPin, Star, TrendingUp, Users, Bell,
  Share2, LogOut, ChevronRight, Stethoscope, BarChart3, Ticket, CreditCard,
  Sparkles, CheckCheck, ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';

/* ----------------------------------------------------------------- mock data */

const PRO = { nombre: 'Valentina Ríos', especialidad: 'Cardiología', inicial: 'VR' };

const METRICS = [
  { icon: CalendarDays, label: 'Turnos hoy', value: '8', hint: '5 confirmados' },
  { icon: CheckCheck, label: 'Confirmados', value: '5', hint: 'de 8 de hoy' },
  { icon: Users, label: 'Turnos del mes', value: '142', hint: '+12% vs. mayo' },
  { icon: Star, label: 'Calificación', value: '4.8', hint: '96 reseñas' },
];

const AGENDA = [
  { id: 1, hora: '09:00', pac: 'Martín Aguirre', motivo: 'Control anual', modalidad: 'Presencial', estado: 'Confirmado', ini: 'MA' },
  { id: 2, hora: '09:45', pac: 'Lucía Fernández', motivo: 'Primera consulta', modalidad: 'Virtual', estado: 'Confirmado', ini: 'LF' },
  { id: 3, hora: '10:30', pac: 'Diego Sosa', motivo: 'Seguimiento HTA', modalidad: 'Presencial', estado: 'Reservado', ini: 'DS' },
  { id: 4, hora: '11:15', pac: 'Carla Méndez', motivo: 'Resultados estudios', modalidad: 'Virtual', estado: 'Reservado', ini: 'CM' },
  { id: 5, hora: '12:00', pac: 'Bruno Vega', motivo: 'Electrocardiograma', modalidad: 'Presencial', estado: 'En riesgo', ini: 'BV' },
];

const INGRESOS = [
  { mes: 'Ene', v: 62 }, { mes: 'Feb', v: 70 }, { mes: 'Mar', v: 66 },
  { mes: 'Abr', v: 81 }, { mes: 'May', v: 88 }, { mes: 'Jun', v: 97 },
];

const RESENAS = [
  { id: 1, pac: 'Sofía M.', rating: 5, texto: 'Excelente atención, muy clara explicando el tratamiento. Volvería sin dudas.', cuando: 'hace 2 días' },
  { id: 2, pac: 'Joaquín R.', rating: 5, texto: 'Puntual y muy profesional. La consulta virtual funcionó perfecto.', cuando: 'hace 5 días' },
  { id: 3, pac: 'Andrea T.', rating: 4, texto: 'Buena predisposición y seguimiento por chat después del turno.', cuando: 'hace 1 semana' },
];

const TABS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'disponibilidad', label: 'Disponibilidad', icon: Clock },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
  { id: 'resenas', label: 'Reseñas', icon: Star },
  { id: 'cupones', label: 'Cupones', icon: Ticket },
];

/* ------------------------------------------------------ modality / estado UI */

function ModalidadBadge({ m }: { m: string }) {
  const virt = m === 'Virtual';
  return (
    <Badge variant="outline" className="gap-1 border-border/70">
      {virt ? <Video className="text-primary" /> : <MapPin className="text-success" />}
      {m}
    </Badge>
  );
}

function EstadoBadge({ e }: { e: string }) {
  if (e === 'Confirmado')
    return <Badge className="bg-success/12 text-success">{e}</Badge>;
  if (e === 'En riesgo')
    return <Badge className="bg-warning/15 text-warning">{e}</Badge>;
  return <Badge variant="secondary">{e}</Badge>;
}

/* ------------------------------------------------------- hand-drawn bar chart */

function IngresosBars({ data }: { data: { mes: string; v: number }[] }) {
  const max = Math.max(...data.map((d) => d.v));
  const AREA = 104; // px — fixed so bar pixel heights don't depend on parent %
  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height: AREA }}>
        {data.map((d, i) => {
          const last = i === data.length - 1;
          return (
            <div
              key={d.mes}
              className={`flex-1 rounded-md transition-all ${last ? 'bg-primary' : 'bg-primary/20'}`}
              style={{ height: Math.max(6, (d.v / max) * AREA) }}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between gap-2">
        {data.map((d) => (
          <span key={d.mes} className="flex-1 text-center text-[10px] text-muted-foreground">
            {d.mes}
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------- page */

export default function ProfesionalPreview() {
  const [tab, setTab] = useState('agenda');
  const fecha = useMemo(
    () =>
      new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
        .format(new Date()),
    [],
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="font-display-scope min-h-screen bg-background text-foreground">
      <style>{css}</style>

      {/* ── Hero band ─────────────────────────────────────────────── */}
      <header className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* top bar */}
          <div className="flex h-16 items-center justify-between">
            <Logo href="/dashboard/preview" />
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon-sm" aria-label="Notificaciones" className="relative">
                <Bell />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
              </Button>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Share2 data-icon="inline-start" /> Compartir perfil
              </Button>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {PRO.inicial}
              </span>
              <Button variant="outline" size="sm">
                <LogOut data-icon="inline-start" /> <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>

          {/* greeting */}
          <div className="reveal pb-8 pt-6" style={{ '--d': '40ms' } as React.CSSProperties}>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium capitalize text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> {fecha}
            </p>
            <h1 className="font-display mt-2 text-balance text-4xl font-medium tracking-tight sm:text-5xl">
              Buen día, Dra. {PRO.nombre.split(' ')[1]}.
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
              Tenés <strong className="font-semibold text-foreground">8 turnos</strong> hoy,{' '}
              <strong className="font-semibold text-foreground">5 confirmados</strong>. Tu agenda del
              mes creció <span className="font-medium text-success">+12%</span>.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Metrics row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <Card
              key={m.label}
              className="reveal rounded-2xl shadow-sm transition-shadow hover:shadow-md"
              style={{ '--d': `${120 + i * 70}ms` } as React.CSSProperties}
            >
              <CardContent className="flex flex-col gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <m.icon className="size-5" />
                </div>
                <span className="font-display text-3xl font-medium leading-none tracking-tight">
                  {m.value}
                </span>
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.hint}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────── */}
        <div className="reveal mt-8 overflow-x-auto" style={{ '--d': '420ms' } as React.CSSProperties}>
          <div className="flex w-fit min-w-full gap-1 border-b pb-px sm:w-full">
            {TABS.map((tb) => {
              const active = tab === tb.id;
              return (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <tb.icon className="size-4" />
                  {tb.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────── */}
        {tab === 'agenda' ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Agenda de hoy */}
            <Card className="reveal rounded-2xl shadow-sm lg:col-span-2" style={{ '--d': '480ms' } as React.CSSProperties}>
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="size-4 text-primary" /> Agenda de hoy
                </CardTitle>
                <CardAction>
                  <Badge variant="secondary" className="capitalize">{fecha}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {AGENDA.map((a) => (
                  <div
                    key={a.id}
                    className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="w-12 shrink-0 text-right">
                      <span className="font-display text-lg font-medium tabular-nums">{a.hora}</span>
                    </div>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                      {a.ini}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.pac}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.motivo}</p>
                    </div>
                    <ModalidadBadge m={a.modalidad} />
                    <EstadoBadge e={a.estado} />
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Right column */}
            <div className="flex flex-col gap-6">
              {/* Ingresos */}
              <Card className="reveal rounded-2xl shadow-sm" style={{ '--d': '540ms' } as React.CSSProperties}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4 text-primary" /> Ingresos del mes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                    <span className="font-display text-3xl font-medium tracking-tight">$1,94M</span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                      <ArrowUpRight className="size-4" /> 9,8%
                    </span>
                  </div>
                  <IngresosBars data={INGRESOS} />
                  <p className="text-xs text-muted-foreground">
                    Neto acreditado vía MercadoPago, últimos 6 meses.
                  </p>
                </CardContent>
              </Card>

              {/* Reseñas */}
              <Card className="reveal rounded-2xl shadow-sm" style={{ '--d': '600ms' } as React.CSSProperties}>
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Star className="size-4 text-primary" /> Reseñas recientes
                  </CardTitle>
                  <CardAction>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold">
                      4.8 <Star className="size-3.5 fill-warning text-warning" />
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {RESENAS.map((r) => (
                    <div key={r.id} className="space-y-1.5 px-4 py-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{r.pac}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3 ${i < r.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">“{r.texto}”</p>
                      <p className="text-xs text-muted-foreground/70">{r.cuando}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Placeholder tab={TABS.find((t) => t.id === tab)!} />
        )}

        <footer className="mt-10 flex items-center justify-between border-t pt-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Stethoscope className="size-3.5 text-primary" /> MediSync · preview de diseño
          </span>
          <span suppressHydrationWarning>{mounted ? 'Datos de demostración' : ''}</span>
        </footer>
      </main>
    </div>
  );
}

function Placeholder({ tab }: { tab: { label: string; icon: React.ComponentType<{ className?: string }> } }) {
  const Icon = tab.icon;
  return (
    <Card className="mt-6 rounded-2xl border-dashed shadow-none">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
        <p className="font-heading text-lg font-semibold">{tab.label}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Esta sección usa el mismo sistema visual. En la migración se conecta con la vista real
          (mismo dato, estilo del landing).
        </p>
      </CardContent>
    </Card>
  );
}

const css = `
.font-display{ font-family: var(--font-display), Georgia, 'Times New Roman', serif; }
.reveal{ opacity:0; transform:translateY(12px); animation:pv-rise .6s cubic-bezier(.2,.7,.2,1) forwards; animation-delay:var(--d,0ms); }
@keyframes pv-rise{ to{ opacity:1; transform:none; } }
@media (prefers-reduced-motion:reduce){ .reveal{ animation:none; opacity:1; transform:none; } }
`;
