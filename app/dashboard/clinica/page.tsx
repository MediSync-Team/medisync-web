'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { useLang } from '../../lib/i18n/context';
import {
  clinicasApi,
  ClinicaConRelaciones,
  ClinicaStats,
  ClinicaAgendaTurno,
  InvitacionClinica,
  Profesional,
} from '../../lib/api';
import { BuildingIcon, VideoIcon, CheckIcon } from '../../components/icons';
import { Notice } from '../../lib/ui-notice';
import ThemeLangToggle from '../../components/ThemeLangToggle';
import { estadoLabel, invitacionEstadoLabel } from '../../lib/utils';
import {
  addDaysToClinicDateKey,
  formatClinicDateKeyForDisplay,
  formatClinicInstantTime,
  getLocale,
  todayInputValue,
} from '../../lib/date';
import { useTranslateSpecialty } from '../../lib/i18n/use-translate-specialty';

// -- helpers ------------------------------------------------------------------
const ESTADO_COLORS: Record<string, string> = {
  RESERVADO:   'bg-blue-100 text-blue-700',
  CONFIRMADO:  'bg-emerald-100 text-emerald-700',
  COMPLETADO:  'bg-slate-100 text-slate-600',
  CANCELADO:   'bg-red-100 text-red-600',
  AUSENTE:     'bg-amber-100 text-amber-700',
};
function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ''));
}

// -- sub-components -----------------------------------------------------------
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color ?? 'text-slate-800 dark:text-slate-200'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function Avatar({ p }: { p: Pick<Profesional, 'nombre' | 'apellido' | 'fotoUrl'> }) {
  const initials = `${p.nombre[0]}${p.apellido[0]}`.toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 overflow-hidden">
      {p.fotoUrl ? <img src={p.fotoUrl} alt="" className="w-full h-full object-cover" /> : initials}
    </div>
  );
}

// -- Page ---------------------------------------------------------------------
type Tab = 'overview' | 'profesionales' | 'agenda' | 'invitaciones' | 'configuracion';
type Feedback = Notice;

export default function ClinicaDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { lang, t } = useLang();
  const d = t('dashboard');
  const c = t('clinica');
  const status = t('status');
  const modality = t('modality');
  const translateSpecialty = useTranslateSpecialty();
  const locale = getLocale(lang);
  const dayLabel = (day: number) => {
    const base = new Date(2026, 4, 10 + day);
    return base.toLocaleDateString(locale, { weekday: 'short' }).replace(/\.$/, '');
  };
  const cancellationsLabel = (count: number) =>
    interpolate(count === 1 ? c.stats.cancellationThisMonth : c.stats.cancellationsThisMonth, { count });

  const [tab, setTab]               = useState<Tab>('overview');
  const [clinica, setClinica]       = useState<ClinicaConRelaciones | null>(null);
  const [stats, setStats]           = useState<ClinicaStats | null>(null);
  const [agenda, setAgenda]         = useState<ClinicaAgendaTurno[]>([]);
  const [agendaDateKey, setAgendaDateKey] = useState(() => todayInputValue());
  const [loadingMain, setLoadingMain] = useState(true);

  // Invite modal
  const [showInvite, setShowInvite]     = useState(false);
  const [inviteEmail, setInviteEmail]   = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError]   = useState('');
  const [inviteOk, setInviteOk]         = useState('');

  // Config form
  const [cfgNombre, setCfgNombre]         = useState('');
  const [cfgDesc, setCfgDesc]             = useState('');
  const [cfgDir, setCfgDir]               = useState('');
  const [cfgTel, setCfgTel]               = useState('');
  const [cfgWeb, setCfgWeb]               = useState('');
  const [cfgSaving, setCfgSaving]         = useState(false);
  const [cfgFeedback, setCfgFeedback]     = useState<Feedback | null>(null);
  const [pageError, setPageError]         = useState('');

  // Remove prof confirmation
  const [removeTarget, setRemoveTarget] = useState<Profesional | null>(null);
  const [removing, setRemoving]         = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user?.rol !== 'CLINICA') { router.push('/dashboard'); return; }
  }, [user, authLoading, router]);

  const load = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([clinicasApi.getMe(), clinicasApi.getStats()]);
      setClinica(c);
      setStats(s);
      setCfgNombre(c.nombre);
      setCfgDesc(c.descripcion ?? '');
      setCfgDir(c.direccion ?? '');
      setCfgTel(c.telefono ?? '');
      setCfgWeb(c.website ?? '');
    } catch {
      /* ignore */
    } finally {
      setLoadingMain(false);
    }
  }, []);

  const loadAgenda = useCallback(async (dateKey: string) => {
    try {
      const data = await clinicasApi.getAgenda(dateKey);
      setAgenda(data);
    } catch { setAgenda([]); }
  }, []);

  useEffect(() => { if (user?.rol === 'CLINICA') load(); }, [user, load]);
  useEffect(() => { if (tab === 'agenda') loadAgenda(agendaDateKey); }, [tab, agendaDateKey, loadAgenda]);

  const handleInvite = async () => {
    setInviteError('');
    setInviteOk('');
    if (!inviteEmail.trim()) { setInviteError(c.inviteModal.emailRequired); return; }
    setInviteLoading(true);
    try {
      await clinicasApi.invitar(inviteEmail.trim().toLowerCase());
      setInviteOk(interpolate(c.inviteModal.sentTo, { email: inviteEmail }));
      setInviteEmail('');
      load();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : c.inviteModal.error);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvitacion = async (id: string) => {
    setPageError('');
    try {
      await clinicasApi.cancelarInvitacion(id);
      load();
    } catch (err) {
      setPageError(err instanceof Error ? err.message : c.invitations.cancelError);
    }
  };

  const handleRemoveProfesional = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    setPageError('');
    try {
      await clinicasApi.removerProfesional(removeTarget.id);
      load();
      setRemoveTarget(null);
    }
    catch (err) {
      setPageError(err instanceof Error ? err.message : c.removeModal.error);
    }
    finally { setRemoving(false); }
  };

  const handleSaveConfig = async () => {
    setCfgSaving(true);
    setCfgFeedback(null);
    try {
      await clinicasApi.updateMe({ nombre: cfgNombre, descripcion: cfgDesc, direccion: cfgDir, telefono: cfgTel, website: cfgWeb });
      setCfgFeedback({ type: 'success', text: c.config.saved });
      load();
    } catch (err) {
      setCfgFeedback({ type: 'error', text: err instanceof Error ? err.message : c.config.saveError });
    }
    finally { setCfgSaving(false); }
  };

  if (authLoading || loadingMain) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',       label: c.tabs.overview },
    { key: 'profesionales',  label: `${c.tabs.professionals} (${clinica?.profesionales.length ?? 0})` },
    { key: 'agenda',         label: c.tabs.agenda },
    { key: 'invitaciones',   label: c.tabs.invitations },
    { key: 'configuracion',  label: c.tabs.settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              {clinica?.logoUrl
                ? <img src={clinica.logoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              }
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm leading-tight">{clinica?.nombre ?? c.defaultName}</p>
              <p className="text-xs text-slate-500">{c.panelSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeLangToggle compact />
            <button
              onClick={() => setShowInvite(true)}
              className="btn btn-primary btn-sm"
            >
              + {c.inviteProfessional}
            </button>
            <button onClick={logout} className="btn btn-secondary btn-sm">
              {d.logout}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {pageError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {pageError}
          </div>
        )}

        {/* -- OVERVIEW -- */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label={c.stats.todayAppointments} value={stats.turnosHoy} color="text-blue-600" />
              <StatCard label={c.stats.monthAppointments} value={stats.turnosMes} color="text-emerald-600" />
              <StatCard label={c.stats.monthRevenue} value={`$${stats.ingresosMes.toLocaleString(locale)}`} color="text-emerald-600" sub={c.stats.net} />
              <StatCard label={c.stats.professionals} value={stats.profesionalesActivos} sub={cancellationsLabel(stats.cancelacionesMes)} />
            </div>

            {/* Quick professional cards */}
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-3">{c.team.title}</h2>
              {!clinica?.profesionales.length ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="text-slate-500 text-sm mb-3">{c.team.empty}</p>
                  <button onClick={() => setShowInvite(true)} className="btn btn-primary btn-sm">
                    {c.inviteFirst}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clinica.profesionales.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
                      <Avatar p={p} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.nombre} {p.apellido}</p>
                        <p className="text-xs text-blue-600 truncate">{translateSpecialty(p.especialidad?.nombre)}</p>
                        <p className="text-xs text-slate-400">
                          {(p.disponibilidades ?? []).length} {(p.disponibilidades ?? []).length === 1 ? c.team.scheduleBlock : c.team.scheduleBlocks}{c.team.scheduleBlocksSuffix ? ` ${c.team.scheduleBlocksSuffix}` : ''}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${p.activo ? 'bg-emerald-400' : 'bg-slate-300'}`} title={p.activo ? c.team.active : c.team.inactive} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -- PROFESIONALES -- */}
        {tab === 'profesionales' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">{c.team.clinicProfessionals}</h2>
              <button onClick={() => setShowInvite(true)} className="btn btn-primary btn-sm">
                + {c.inviteShort}
              </button>
            </div>

            {!clinica?.profesionales.length ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
                <p className="text-slate-500">{c.team.inviteProfessionalsEmpty}</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                {clinica.profesionales.map(p => {
                  const dias = [...new Set((p.disponibilidades ?? []).map(d => d.diaSemana))].sort();
                  return (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                      <Avatar p={p} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.nombre} {p.apellido}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {p.activo ? c.team.active : c.team.inactive}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600">{translateSpecialty(p.especialidad?.nombre)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {dias.length ? dias.map(d => dayLabel(d)).join(' · ') : c.team.noAvailability}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {Number(p.precioConsulta) > 0 && (
                          <span className="text-xs font-medium text-slate-600">
                            ${Number(p.precioConsulta).toLocaleString(locale)}
                          </span>
                        )}
                        <button
                          onClick={() => setRemoveTarget(p as Profesional)}
                          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          {c.team.unlink}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -- AGENDA -- */}
        {tab === 'agenda' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">{c.agenda.combined}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAgendaDateKey(prev => addDaysToClinicDateKey(prev, -1))}
                  className="btn btn-secondary btn-sm"
                >←</button>
                <span className="text-sm font-medium text-slate-700 min-w-[140px] text-center">
                  {formatClinicDateKeyForDisplay(agendaDateKey, locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <button
                  onClick={() => setAgendaDateKey(prev => addDaysToClinicDateKey(prev, 1))}
                  className="btn btn-secondary btn-sm"
                >→</button>
                <button onClick={() => setAgendaDateKey(todayInputValue())} className="btn btn-secondary btn-sm text-xs">{c.agenda.today}</button>
              </div>
            </div>

            {agenda.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
                {c.agenda.noAppointments}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                {agenda.map(t => {
                  return (
                    <div key={t.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatClinicInstantTime(t.fechaHora, locale)}</p>
                      </div>
                      <div className="w-px h-8 bg-slate-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : c.agenda.noPatient}
                        </p>
                        <p className="text-xs text-slate-500">
                          {c.agenda.withProfessional} {t.profesional.nombre} {t.profesional.apellido} · {translateSpecialty(t.profesional.especialidad?.nombre)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ESTADO_COLORS[t.estado] ?? 'bg-slate-100 text-slate-600'}`}>
                          {estadoLabel(t.estado, status)}
                        </span>
                        <span title={modality[t.modalidad as keyof typeof modality] ?? t.modalidad} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${t.modalidad === 'VIRTUAL' ? 'text-purple-600 border-purple-200 bg-purple-50' : 'text-slate-500 border-slate-200 bg-slate-50'}`}>
                          {t.modalidad === 'VIRTUAL' ? <VideoIcon size={12} className="text-blue-600" /> : <BuildingIcon size={12} className="text-slate-500" />}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -- INVITACIONES -- */}
        {tab === 'invitaciones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">{c.invitations.sent}</h2>
              <button onClick={() => setShowInvite(true)} className="btn btn-primary btn-sm">
                + {c.newInvitation}
              </button>
            </div>

            {!clinica?.invitaciones.length ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400 text-sm">
                {c.invitations.empty}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                {clinica.invitaciones.map(inv => (
                  <InvitacionRow key={inv.id} inv={inv} onCancel={() => handleCancelInvitacion(inv.id)} locale={locale} labels={c.invitations} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* -- CONFIGURACIÓN -- */}
        {tab === 'configuracion' && (
          <div className="max-w-lg space-y-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">{c.config.title}</h2>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <Field label={c.config.name} value={cfgNombre} onChange={setCfgNombre} />
              <Field label={c.config.description} value={cfgDesc} onChange={setCfgDesc} multiline />
              <Field label={c.config.address} value={cfgDir} onChange={setCfgDir} placeholder={c.config.addressPlaceholder} />
              <Field label={c.config.phone} value={cfgTel} onChange={setCfgTel} placeholder={c.config.phonePlaceholder} />
              <Field label={c.config.website} value={cfgWeb} onChange={setCfgWeb} placeholder={c.config.websitePlaceholder} />
              <div className="flex items-center gap-3">
                <button onClick={handleSaveConfig} disabled={cfgSaving} className="btn btn-primary btn-sm">
                  {cfgSaving ? c.config.saving : c.config.saveChanges}
                </button>
                {cfgFeedback && (
                  <p className={`text-xs ${cfgFeedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {cfgFeedback.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* -- Invite modal -- */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">{c.inviteModal.title}</h3>
              <button onClick={() => { setShowInvite(false); setInviteEmail(''); setInviteError(''); setInviteOk(''); }} className="text-slate-400 hover:text-slate-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p className="text-sm text-slate-600">
              {c.inviteModal.description}
            </p>

            {inviteError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{inviteError}</p>}
             {inviteOk    && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 inline-flex items-center gap-1.5"><CheckIcon size={12} /> {inviteOk}</p>}

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{c.inviteModal.emailLabel}</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleInvite()}
                className="field-input"
                placeholder={c.inviteModal.emailPlaceholder}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowInvite(false); setInviteEmail(''); setInviteError(''); setInviteOk(''); }}
                className="btn btn-secondary flex-1"
              >
                {c.inviteModal.close}
              </button>
              <button onClick={handleInvite} disabled={inviteLoading} className="btn btn-primary flex-1">
                {inviteLoading ? c.inviteModal.sending : c.inviteModal.send}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Remove confirmation -- */}
      {removeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{c.removeModal.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                {interpolate(c.removeModal.description, { name: `${removeTarget.nombre} ${removeTarget.apellido}` })}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRemoveTarget(null)} className="btn btn-secondary flex-1">{c.removeModal.cancel}</button>
              <button onClick={handleRemoveProfesional} disabled={removing} className="btn flex-1 bg-red-600 text-white hover:bg-red-700 rounded-xl px-4 py-2 text-sm font-semibold">
                {removing ? c.removeModal.removing : c.removeModal.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -- Helpers components --------------------------------------------------------
type InvitacionLabels = {
  expires: string;
  expired: string;
  on: string;
  cancel: string;
  states: Record<string, string>;
};

function InvitacionRow({
  inv,
  onCancel,
  locale,
  labels,
}: {
  inv: InvitacionClinica;
  onCancel: () => void;
  locale: string;
  labels: InvitacionLabels;
}) {
  const expiry  = new Date(inv.expiresAt);
  const expired = expiry < new Date();
  const ESTADO_STYLE: Record<string, string> = {
    PENDIENTE: 'bg-amber-100 text-amber-700',
    ACEPTADA:  'bg-emerald-100 text-emerald-700',
    RECHAZADA: 'bg-red-100 text-red-600',
    EXPIRADA:  'bg-slate-100 text-slate-500',
  };
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{inv.email}</p>
        <p className="text-xs text-slate-400">
          {expired ? labels.expired : labels.expires} {labels.on} {expiry.toLocaleDateString(locale)}
        </p>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${ESTADO_STYLE[inv.estado] ?? ''}`}>
        {invitacionEstadoLabel(inv.estado, { invitations: { status: labels.states } })}
      </span>
      {inv.estado === 'PENDIENTE' && !expired && (
        <button onClick={onCancel} className="text-xs text-red-500 hover:text-red-700">{labels.cancel}</button>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, multiline,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="field-input resize-none" placeholder={placeholder} />
        : <input value={value} onChange={e => onChange(e.target.value)} className="field-input" placeholder={placeholder} />
      }
    </div>
  );
}
