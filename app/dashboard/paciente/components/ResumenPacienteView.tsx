'use client';

import { useLang } from '../../../lib/i18n/context';
import { formatClinicInstantDate, formatClinicInstantTime, getLocale } from '../../../lib/date';
import { Turno, RecetaPaciente, CertificadoPaciente, PacienteStats } from '../../../lib/api';
import { CalendarIcon, CreditCardIcon, BellIcon, UserIcon } from '../../../components/icons';

function ResumenPacienteView({
  turnosProximos,
  misRecetas,
  misCertificados,
  pacienteStats,
  recordatorios,
  d,
}: {
  turnosProximos: Turno[];
  misRecetas: RecetaPaciente[];
  misCertificados: CertificadoPaciente[];
  pacienteStats: PacienteStats | null;
  recordatorios: any[];
  d: any;
}) {
  const { t, lang } = useLang();
  const p = t('paciente');
  const locale = getLocale(lang);
  const proximoTurno = turnosProximos.length > 0 ? turnosProximos[0] : null;
  const recetasActivas = misRecetas.filter(r => {
    if (!r.receta.proximoControl) return true;
    const proximoControlDate = new Date(r.receta.proximoControl);
    const hoy = new Date();
    return proximoControlDate >= hoy;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
            <CalendarIcon size={12} /> {d.nextAppointment}
          </p>
          {proximoTurno ? (
            <>
              <p className="font-heading text-sm font-bold text-foreground">
                {proximoTurno.profesional?.nombre} {proximoTurno.profesional?.apellido}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatClinicInstantDate(proximoTurno.fechaHora, locale, { day: 'numeric', month: 'short' })} {p.atTime}{' '}
                {formatClinicInstantTime(proximoTurno.fechaHora, locale)}
              </p>
            </>
          ) : (
            <p className="text-xs font-medium text-muted-foreground">{d.noScheduledAppointments}</p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-success">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg> {d.activeRecipes}
          </p>
          <p className="font-heading text-2xl font-bold text-foreground">{recetasActivas.length}</p>
          {recetasActivas.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{d.latest}: {recetasActivas[0].profesional.nombre}</p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-warning">
            <CreditCardIcon size={12} /> {d.spendingThisMonth}
          </p>
          <p className="font-heading text-2xl font-bold text-foreground">
            ${(pacienteStats?.totalGastado || 0).toLocaleString(locale)}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg> {d.certificates_}
          </p>
          <p className="font-heading text-2xl font-bold text-foreground">{misCertificados.length}</p>
        </div>
      </div>

      {recordatorios.length > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-warning">
            <BellIcon size={14} /> {d.remindersActive}
          </p>
          <div className="space-y-2">
            {recordatorios.map(r => (
              <p key={r.id} className="text-xs text-muted-foreground">
                • Turno {formatClinicInstantDate(r.fechaHora, locale)} {p.atTime}{' '}
                {formatClinicInstantTime(r.fechaHora, locale)} {p.withProfessional}{' '}
                {r.turno?.profesional?.nombre || 'profesional'}
              </p>
            ))}
          </div>
        </div>
      )}

      {(pacienteStats?.topProfesionales || []).length > 0 && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-foreground">{d.mostVisitedProfessionals}</p>
          <div className="flex flex-wrap gap-3">
            {pacienteStats!.topProfesionales.map((prof) => (
              prof.profesional && (
                <div
                  key={prof.profesional.id}
                  className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                >
                  {prof.profesional.fotoUrl ? (
                    <img
                      src={prof.profesional.fotoUrl}
                      alt={prof.profesional.nombre}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <UserIcon size={12} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {prof.profesional.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">{prof.totalTurnos} {prof.totalTurnos === 1 ? d.appointment : d.appointments}</p>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumenPacienteView;
