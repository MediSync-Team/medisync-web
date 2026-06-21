'use client';

/**
 * MediSync — Patient dashboard, design preview.
 *
 * Same LANDING design language as the professional preview: @/components/ui/*,
 * Geist font-heading, primary/success tokens, gradient band, bg-primary/10
 * tiles, lucide icons, one display accent (Newsreader via --font-display).
 * Token-based → dark-safe. Self-contained mock data, no api/auth.
 * View at /dashboard/paciente/preview.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Clock, Video, MapPin, Pill, FileText, Activity, HeartPulse,
  ChevronRight, Bell, LogOut, Search, Sparkles, Stethoscope, ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';

/* ----------------------------------------------------------------- mock data */

const PAC = { nombre: 'Sofía', apellido: 'Mendoza', inicial: 'SM' };

function proximoDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(14, 30, 0, 0);
  return d;
}

const PROXIMO = {
  prof: 'Dra. Valentina Ríos',
  especialidad: 'Cardiología',
  modalidad: 'Presencial',
  lugar: 'Consultorio 4B · Clínica del Parque',
  ini: 'VR',
};

const METRICS = [
  { icon: CalendarDays, label: 'Próximos turnos', value: '3', hint: 'esta quincena' },
  { icon: Pill, label: 'Recetas activas', value: '2', hint: '1 por renovar' },
  { icon: FileText, label: 'Certificados', value: '4', hint: 'disponibles' },
  { icon: Activity, label: 'Adherencia', value: '94%', hint: '+8% esta semana' },
];

const AGENDA = [
  { id: 1, hora: '09:00', dia: 'Mié 25', prof: 'Lic. Tomás Aguirre', esp: 'Nutrición', modalidad: 'Virtual', estado: 'Confirmado' },
  { id: 2, hora: '11:30', dia: 'Vie 27', prof: 'Dr. Iván Solé', esp: 'Clínica Médica', modalidad: 'Presencial', estado: 'Reservado' },
  { id: 3, hora: '16:00', dia: 'Lun 30', prof: 'Dra. Paula Esquivel', esp: 'Dermatología', modalidad: 'Presencial', estado: 'Reservado' },
];

const RECETAS = [
  { id: 1, droga: 'Enalapril 10mg', pauta: '1 comp · cada 24h', restante: 12, total: 30 },
  { id: 2, droga: 'Rosuvastatina 20mg', pauta: '1 comp · noche', restante: 21, total: 30 },
];

const FICHA = { grupo: '0+', cobertura: 'OSDE 310', alergias: ['Penicilina', 'AINEs'] };

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: Activity },
  { id: 'proximos', label: 'Próximos', icon: CalendarDays },
  { id: 'historial', label: 'Historial', icon: Clock },
  { id: 'recetas', label: 'Recetas', icon: Pill },
  { id: 'certificados', label: 'Certificados', icon: FileText },
  { id: 'datos', label: 'Datos médicos', icon: HeartPulse },
];

/* ------------------------------------------------------------------ helpers */

function ModalidadBadge({ m }: { m: string }) {
  const virt = m === 'Virtual';
  return (
    <Badge variant="outline" className="gap-1 border-border/70">
      {virt ? <Video className="text-primary" /> : <MapPin className="text-success" />}
      {m}
    </Badge>
  );
}

/* --------------------------------------------------------------------- page */

export default function PacientePreview() {
  const [tab, setTab] = useState('resumen');
  const target = useMemo(() => proximoDate(), []);
  const [now, setNow] = useState<Date>(() => new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const cd = useMemo(() => {
    const ms = Math.max(0, target.getTime() - now.getTime());
    return {
      d: Math.floor(ms / 86_400_000),
      h: Math.floor((ms % 86_400_000) / 3_600_000),
      m: Math.floor((ms % 3_600_000) / 60_000),
    };
  }, [target, now]);

  const fechaLarga = useMemo(
    () => new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(target),
    [target],
  );
  const hora = useMemo(
    () => new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(target),
    [target],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{css}</style>

      {/* ── Hero band ─────────────────────────────────────────────── */}
      <header className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Logo href="/dashboard/paciente/preview" />
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Search data-icon="inline-start" /> Buscar profesional
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Notificaciones" className="relative">
                <Bell />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
              </Button>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {PAC.inicial}
              </span>
              <Button variant="outline" size="sm">
                <LogOut data-icon="inline-start" /> <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>

          <div className="reveal pb-8 pt-6" style={{ '--d': '40ms' } as React.CSSProperties}>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Tu salud, en un lugar
            </p>
            <h1 className="font-display mt-2 text-balance text-4xl font-medium tracking-tight sm:text-5xl">
              Hola, {PAC.nombre}.
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-muted-foreground" suppressHydrationWarning>
              Tu próximo turno es en{' '}
              <strong className="font-semibold text-foreground">{mounted ? `${cd.d} días` : '—'}</strong>. La
              adherencia al tratamiento subió a{' '}
              <span className="font-medium text-success">94%</span> esta semana.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Próximo turno (destacado) ───────────────────────────── */}
        <Card
          className="reveal overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.06] to-card shadow-sm"
          style={{ '--d': '110ms' } as React.CSSProperties}
        >
          <CardContent className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                {PROXIMO.ini}
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Próximo turno</p>
                <h2 className="font-heading mt-0.5 text-xl font-semibold">{PROXIMO.prof}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Stethoscope className="size-4 text-primary" /> {PROXIMO.especialidad}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                  <span className="font-display text-lg font-medium capitalize">{fechaLarga}</span>
                  <span className="font-display text-lg font-medium tabular-nums">{hora} hs</span>
                  <ModalidadBadge m={PROXIMO.modalidad} />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" /> {PROXIMO.lugar}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 md:items-end">
              <div className="flex gap-2" suppressHydrationWarning>
                {mounted
                  ? [
                      { n: cd.d, l: 'días' },
                      { n: cd.h, l: 'hs' },
                      { n: cd.m, l: 'min' },
                    ].map((u) => (
                      <div
                        key={u.l}
                        className="flex min-w-14 flex-col items-center rounded-xl border bg-background/70 px-3 py-2"
                      >
                        <span className="font-display text-2xl font-medium leading-none tabular-nums">{u.n}</span>
                        <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{u.l}</span>
                      </div>
                    ))
                  : null}
              </div>
              <div className="flex gap-2">
                <Button>
                  Ver detalles <ArrowRight data-icon="inline-end" />
                </Button>
                <Button variant="outline">Reprogramar</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Metrics row ─────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <Card
              key={m.label}
              className="reveal rounded-2xl shadow-sm transition-shadow hover:shadow-md"
              style={{ '--d': `${180 + i * 60}ms` } as React.CSSProperties}
            >
              <CardContent className="flex flex-col gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <m.icon className="size-5" />
                </div>
                <span className="font-display text-3xl font-medium leading-none tracking-tight">{m.value}</span>
                <div>
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.hint}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tab bar ─────────────────────────────────────────────── */}
        <div className="reveal mt-8 overflow-x-auto" style={{ '--d': '440ms' } as React.CSSProperties}>
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
        {tab === 'resumen' ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Agenda timeline */}
            <Card className="reveal rounded-2xl shadow-sm lg:col-span-2" style={{ '--d': '500ms' } as React.CSSProperties}>
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="size-4 text-primary" /> Tu agenda
                </CardTitle>
                <CardAction>
                  <Button variant="ghost" size="xs">
                    Ver todo <ArrowRight data-icon="inline-end" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="p-0">
                <ol className="relative ml-5 border-l py-2 pl-6 pr-4">
                  {AGENDA.map((a) => (
                    <li key={a.id} className="relative flex items-center gap-4 py-3">
                      <span className="absolute -left-[1.95rem] size-2.5 rounded-full border-2 border-primary bg-background" />
                      <div className="w-16 shrink-0">
                        <p className="font-display text-base font-medium tabular-nums leading-none">{a.hora}</p>
                        <p className="mt-0.5 text-xs capitalize text-muted-foreground">{a.dia}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{a.prof}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.esp}</p>
                      </div>
                      <ModalidadBadge m={a.modalidad} />
                      {a.estado === 'Confirmado' ? (
                        <Badge className="bg-success/12 text-success">{a.estado}</Badge>
                      ) : (
                        <Badge variant="secondary">{a.estado}</Badge>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Right column */}
            <div className="flex flex-col gap-6">
              {/* Recetas activas */}
              <Card className="reveal rounded-2xl shadow-sm" style={{ '--d': '560ms' } as React.CSSProperties}>
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Pill className="size-4 text-primary" /> Recetas activas
                  </CardTitle>
                  <CardAction>
                    <Badge variant="secondary">{RECETAS.length}</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                  {RECETAS.map((r) => {
                    const pct = Math.round((r.restante / r.total) * 100);
                    const low = pct <= 40;
                    return (
                      <div key={r.id} className="space-y-1.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-semibold">{r.droga}</span>
                          <span className={`text-xs font-medium ${low ? 'text-warning' : 'text-success'}`}>
                            {r.restante}/{r.total}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{r.pauta}</p>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${low ? 'bg-warning' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Ficha médica */}
              <Card className="reveal rounded-2xl shadow-sm" style={{ '--d': '620ms' } as React.CSSProperties}>
                <CardHeader className="border-b pb-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="size-4 text-primary" /> Ficha médica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between border-b border-dashed pb-2.5">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Grupo</span>
                    <span className="font-display text-base font-medium">{FICHA.grupo}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-dashed pb-2.5">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Cobertura</span>
                    <span className="font-display text-base font-medium">{FICHA.cobertura}</span>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">Alergias</span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {FICHA.alergias.map((a) => (
                        <Badge key={a} variant="destructive">{a}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Actualizar datos médicos
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Placeholder tab={TABS.find((t) => t.id === tab)!} />
        )}

        <footer className="mt-10 flex items-center justify-between border-t pt-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <HeartPulse className="size-3.5 text-primary" /> MediSync · preview de diseño
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
