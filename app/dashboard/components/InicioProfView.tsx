'use client';

import { Turno } from '../../lib/api';
import { useLang } from '../../lib/i18n/context';
import { formatClinicInstantTime, getLocale } from '../../lib/date';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays, Video, MapPin, Star, TrendingUp, ChevronRight, ArrowUpRight,
} from 'lucide-react';

const MES_LABELS: Record<string, Record<string, string>> = {
  es: { '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic' },
  en: { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' },
};

interface IngresoMes { mes: string; bruto: number; neto: number }
interface ResenaLite {
  id: string;
  rating: number;
  comentario?: string | null;
  paciente?: { nombre?: string; apellido?: string } | null;
}

interface InicioProfViewProps {
  hoyTurnos: Turno[];
  ingresosPorMes: IngresoMes[];
  resenas: ResenaLite[];
  ratingPromedio: number | null;
  ratingTotal: number;
  onSelectTurno: (t: Turno) => void;
  translateSpecialty: (name?: string) => string;
}

/** Hand-drawn revenue bars (pixel heights so they don't depend on parent %). */
function IngresosBars({ data, labels }: { data: IngresoMes[]; labels: Record<string, string> }) {
  const slice = data.slice(-6);
  const max = Math.max(...slice.map((d) => d.neto), 1);
  const AREA = 104;
  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height: AREA }}>
        {slice.map((d, i) => {
          const last = i === slice.length - 1;
          return (
            <div
              key={d.mes}
              className={`flex-1 rounded-md transition-all ${last ? 'bg-primary' : 'bg-primary/20'}`}
              style={{ height: Math.max(4, (d.neto / max) * AREA) }}
            />
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between gap-2">
        {slice.map((d) => (
          <span key={d.mes} className="flex-1 text-center text-[10px] text-muted-foreground">
            {labels[d.mes.split('-')[1]] ?? d.mes.split('-')[1]}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function InicioProfView({
  hoyTurnos, ingresosPorMes, resenas, ratingPromedio, ratingTotal, onSelectTurno, translateSpecialty,
}: InicioProfViewProps) {
  const { t, lang } = useLang();
  const i = t('inicio');
  const s = t('status');
  const mod = t('modality');
  const locale = getLocale(lang);
  const labels = MES_LABELS[lang] ?? MES_LABELS.es;

  const agenda = [...hoyTurnos]
    .filter((tn) => tn.estado !== 'CANCELADO')
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());

  const ingresos = ingresosPorMes ?? [];
  const ultimoNeto = ingresos.length ? ingresos[ingresos.length - 1].neto : 0;
  const prevNeto = ingresos.length > 1 ? ingresos[ingresos.length - 2].neto : 0;
  const delta = prevNeto > 0 ? Math.round(((ultimoNeto - prevNeto) / prevNeto) * 1000) / 10 : null;

  const estadoBadge = (estado: string) => {
    const label = (s as Record<string, string>)[estado] || estado;
    if (estado === 'CONFIRMADO') return <Badge className="bg-success/12 text-success">{label}</Badge>;
    if (estado === 'RESERVADO') return <Badge className="bg-warning/15 text-warning">{label}</Badge>;
    return <Badge variant="secondary">{label}</Badge>;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Agenda de hoy */}
      <Card className="rounded-2xl shadow-sm lg:col-span-2">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" /> {i.agendaHoy}
          </CardTitle>
          <CardAction>
            <Badge variant="secondary">{agenda.length}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          {agenda.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">{i.sinAgendaHoy}</p>
          ) : (
            <div className="divide-y">
              {agenda.map((tn) => (
                <button
                  key={tn.id}
                  onClick={() => onSelectTurno(tn)}
                  className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="w-12 shrink-0 text-right">
                    <span className="font-display text-lg font-medium tabular-nums">
                      {formatClinicInstantTime(tn.fechaHora, locale)}
                    </span>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {(tn.paciente?.nombre?.[0] ?? '?')}{tn.paciente?.apellido?.[0] ?? ''}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {tn.paciente ? `${tn.paciente.nombre} ${tn.paciente.apellido}` : '—'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {translateSpecialty(tn.profesional?.especialidad?.nombre)}
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1 border-border/70">
                    {tn.modalidad === 'VIRTUAL' ? <Video className="text-primary" /> : <MapPin className="text-success" />}
                    {tn.modalidad === 'VIRTUAL' ? mod.VIRTUAL : mod.PRESENCIAL}
                  </Badge>
                  {estadoBadge(tn.estado)}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right column */}
      <div className="flex flex-col gap-6">
        {/* Ingresos */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" /> {i.ingresosMes}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="font-display text-3xl font-medium tracking-tight">
                ${ultimoNeto.toLocaleString(locale)}
              </span>
              {delta !== null && (
                <span className={`inline-flex items-center gap-1 text-sm font-medium ${delta >= 0 ? 'text-success' : 'text-destructive'}`}>
                  <ArrowUpRight className="size-4" /> {Math.abs(delta)}%
                </span>
              )}
            </div>
            {ingresos.length > 0 ? (
              <IngresosBars data={ingresos} labels={labels} />
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">—</p>
            )}
            <p className="text-xs text-muted-foreground">{i.ingresosHint}</p>
          </CardContent>
        </Card>

        {/* Reseñas */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="size-4 text-primary" /> {i.resenasRecientes}
            </CardTitle>
            {ratingPromedio !== null && (
              <CardAction>
                <span className="inline-flex items-center gap-1 text-sm font-semibold">
                  {ratingPromedio} <Star className="size-3.5 fill-warning text-warning" />
                </span>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {resenas.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">{i.sinResenas}</p>
            ) : (
              <div className="divide-y">
                {resenas.slice(0, 3).map((r) => (
                  <div key={r.id} className="space-y-1.5 px-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {r.paciente ? `${r.paciente.nombre ?? ''} ${(r.paciente.apellido ?? '').charAt(0)}.` : '—'}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={`size-3 ${idx < r.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                    </div>
                    {r.comentario && <p className="text-sm leading-relaxed text-muted-foreground">“{r.comentario}”</p>}
                  </div>
                ))}
              </div>
            )}
            {ratingTotal > 0 && (
              <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">
                {i.ratingHint.replace('{count}', String(ratingTotal))}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
