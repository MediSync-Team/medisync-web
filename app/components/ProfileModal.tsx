'use client';

import { useState, useEffect } from 'react';
import { X, User, Bell, Plug, Stethoscope, type LucideIcon } from 'lucide-react';
import { api, Profesional, Paciente, Genero, NotificationPreferences } from '../lib/api';
import { loadObrasSociales, getObrasSociales } from '../lib/obras-sociales';
import { useLang } from '../lib/i18n/context';
import GoogleCalendarConnect from './GoogleCalendarConnect';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'profesional' | 'paciente';
  user: {
    profesional?: Profesional;
    paciente?: Paciente;
    email?: string;
  };
  onUpdate?: () => void;
}

type SectionId = 'cuenta' | 'profesional' | 'notificaciones' | 'integraciones';

const GENERO_OPCIONES: { value: Genero; labelKey: string }[] = [
  { value: 'NO_ESPECIFICADO', labelKey: 'genderNS' },
  { value: 'MASCULINO', labelKey: 'genderM' },
  { value: 'FEMENINO', labelKey: 'genderF' },
  { value: 'OTRO', labelKey: 'genderO' },
];

const validateTelefono = (telefono: string): boolean => {
  return /^[\d\s\-\+\(\)]{8,20}$/.test(telefono);
};

const validateDNI = (dni: string): boolean => {
  return /^\d{7,8}$/.test(dni);
};

export default function ProfileModal({ isOpen, onClose, userType, user, onUpdate }: ProfileModalProps) {
  const { t } = useLang();
  const p = t('profile');
  const c = t('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeSection, setActiveSection] = useState<SectionId>('cuenta');
  const [imgError, setImgError] = useState(false);

  const [obrasSociales, setObrasSociales] = useState<string[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [notifMsg, setNotifMsg] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    genero: 'NO_ESPECIFICADO' as Genero,
    precioConsulta: '',
    lugarAtencion: '',
    bio: '',
    fechaNacimiento: '',
    dni: '',
    obraSocial: '',
    fotoUrl: '',
  });
  const fill = (template: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)), template);

  useEffect(() => {
    if (isOpen) {
      if (userType === 'profesional' && user.profesional) {
        setFormData({
          nombre: user.profesional.nombre || '',
          apellido: user.profesional.apellido || '',
          telefono: user.profesional.telefono || '',
          genero: user.profesional.genero || 'NO_ESPECIFICADO',
          precioConsulta: user.profesional.precioConsulta?.toString() || '',
          lugarAtencion: user.profesional.lugarAtencion || '',
          bio: user.profesional.bio || '',
          fechaNacimiento: '',
          dni: '',
          obraSocial: '',
          fotoUrl: user.profesional.fotoUrl || '',
        });
        setObrasSociales(user.profesional.obrasSociales ?? []);
      } else if (userType === 'paciente' && user.paciente) {
        setFormData({
          nombre: user.paciente.nombre || '',
          apellido: user.paciente.apellido || '',
          telefono: user.paciente.telefono || '',
          genero: user.paciente.genero || 'NO_ESPECIFICADO',
          precioConsulta: '',
          lugarAtencion: '',
          bio: '',
          fechaNacimiento: user.paciente.fechaNacimiento ? user.paciente.fechaNacimiento.split('T')[0] : '',
          dni: user.paciente.dni || '',
          obraSocial: user.paciente.obraSocial || '',
          fotoUrl: user.paciente.fotoUrl || '',
        });
      }
      setError('');
      setSuccess('');
      setNotifMsg('');
      setActiveSection('cuenta');
      api.notifications.getPreferences().then(setNotifPrefs).catch(() => {});
      loadObrasSociales();
    }
  }, [isOpen, userType, user]);

  // Reset broken-image fallback whenever the photo URL changes (live avatar preview).
  useEffect(() => {
    setImgError(false);
  }, [formData.fotoUrl]);

  const toggleNotif = async (field: keyof NotificationPreferences) => {
    if (!notifPrefs) return;
    const updated = { ...notifPrefs, [field]: !notifPrefs[field] };
    setNotifPrefs(updated);
    setNotifMsg('');
    try {
      await api.notifications.updatePreferences(updated);
    } catch {
      setNotifMsg(p.notificationSaveError);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.telefono && !validateTelefono(formData.telefono)) {
      setError(p.phoneError);
      setActiveSection('cuenta');
      setLoading(false);
      return;
    }

    if (userType === 'paciente' && formData.dni && !validateDNI(formData.dni)) {
      setError(p.dniError);
      setActiveSection('cuenta');
      setLoading(false);
      return;
    }

    if (formData.fechaNacimiento) {
      const fecha = new Date(formData.fechaNacimiento);
      const hoy = new Date();
      if (fecha > hoy) {
        setError(p.birthDateFutureError);
        setActiveSection('cuenta');
        setLoading(false);
        return;
      }
    }

    try {
      if (userType === 'profesional' && user.profesional) {
        await api.profesional.updatePerfil(user.profesional.id, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono || '',
          genero: formData.genero,
          precioConsulta: formData.precioConsulta ? Number(formData.precioConsulta) : undefined,
          lugarAtencion: formData.lugarAtencion || undefined,
          bio: formData.bio || undefined,
          fotoUrl: formData.fotoUrl || undefined,
          obrasSociales,
        } as any);
      } else if (userType === 'paciente' && user.paciente) {
        await api.pacientes.updatePerfil({
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono || undefined,
          genero: formData.genero,
          fechaNacimiento: formData.fechaNacimiento || undefined,
          dni: formData.dni || undefined,
          obraSocial: formData.obraSocial || undefined,
          fotoUrl: formData.fotoUrl || undefined,
        });
      }

      setSuccess(p.saveSuccess);
      setTimeout(() => {
        onClose();
        // onUpdate owns the refresh (callers reload); fall back to a reload only if absent.
        if (onUpdate) onUpdate();
        else window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : p.saveError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sections: { id: SectionId; label: string; icon: LucideIcon }[] = [
    { id: 'cuenta', label: p.accountSection || 'Cuenta', icon: User },
    ...(userType === 'profesional'
      ? [{ id: 'profesional' as const, label: p.professionalSection || 'Perfil profesional', icon: Stethoscope }]
      : []),
    { id: 'notificaciones', label: p.notifications_, icon: Bell },
    { id: 'integraciones', label: p.integrations, icon: Plug },
  ];

  const nombreCompleto = `${formData.nombre} ${formData.apellido}`.trim();
  const initials =
    (`${formData.nombre.charAt(0)}${formData.apellido.charAt(0)}` || '').toUpperCase() || '?';

  const notifFields = (
    [
      { field: 'notifEmail' as const, labelKey: 'notifEmail' },
      { field: 'notifWhatsapp' as const, labelKey: 'notifWhatsapp' },
      ...(userType === 'paciente'
        ? [
            { field: 'aceptaRecordatorios' as const, labelKey: 'reminders' },
            { field: 'notifRecordatorio24h' as const, labelKey: 'reminder24h' },
            { field: 'notifRecordatorio2h' as const, labelKey: 'reminder2h' },
          ]
        : []),
    ] as { field: keyof NotificationPreferences; labelKey: 'notifEmail' | 'notifWhatsapp' | 'reminders' | 'reminder24h' | 'reminder2h' }[]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-card text-card-foreground rounded-2xl shadow-2xl ring-1 ring-foreground/10 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label={c.cancel}
          className="absolute top-3 right-3 z-20 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col sm:flex-row">
          {/* ── Nav lateral ─────────────────────────────── */}
          <nav className="shrink-0 sm:w-60 border-b sm:border-b-0 sm:border-r bg-muted/40 flex flex-col">
            <div className="flex items-center gap-3 px-5 py-5">
              {formData.fotoUrl && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={formData.fotoUrl}
                  onError={() => setImgError(true)}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/25 shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center text-lg font-semibold ring-2 ring-primary/15 shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-display text-base font-semibold leading-tight text-foreground truncate">
                  {nombreCompleto || p.title}
                </p>
                {user.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>
            </div>

            <div className="flex sm:flex-col gap-1 overflow-x-auto px-3 pb-3 sm:pb-5">
              {sections.map((s) => {
                const Icon = s.icon;
                const active = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSection(s.id)}
                    data-active={active}
                    className="group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  >
                    <span className="absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary opacity-0 transition-opacity group-data-[active=true]:opacity-100 sm:block" />
                    <Icon className="h-4 w-4 shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ── Panel de contenido ──────────────────────── */}
          <div className="flex flex-1 min-h-0 flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
              <div key={activeSection} className="animate-in fade-in-50 duration-200">
                {/* CUENTA */}
                {activeSection === 'cuenta' && (
                  <div className="space-y-5">
                    <header>
                      <h3 className="text-lg font-semibold text-foreground">{p.accountSection || 'Cuenta'}</h3>
                      <p className="text-sm text-muted-foreground">{p.accountSectionHelp || 'Tus datos personales y de contacto.'}</p>
                    </header>

                    <div>
                      <label className="field-label">{p.photoUrl}</label>
                      <input
                        type="url"
                        name="fotoUrl"
                        value={formData.fotoUrl}
                        onChange={handleChange}
                        className="field-input"
                        placeholder={p.photoUrlPlaceholder}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="field-label">{p.firstName}</label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          required
                          minLength={2}
                          maxLength={50}
                          className="field-input"
                        />
                      </div>
                      <div>
                        <label className="field-label">{p.lastName}</label>
                        <input
                          type="text"
                          name="apellido"
                          value={formData.apellido}
                          onChange={handleChange}
                          required
                          minLength={2}
                          maxLength={50}
                          className="field-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="field-label">{p.gender}</label>
                        <select name="genero" value={formData.genero} onChange={handleChange} className="field-select">
                          {GENERO_OPCIONES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {p[opt.labelKey as keyof Pick<typeof p, 'genderM' | 'genderF' | 'genderO' | 'genderNS'>] || opt.value}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">{p.phone}</label>
                        <input
                          type="tel"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          pattern="[\d\s\-\+\(\)]{8,20}"
                          title={p.phoneInputTitle}
                          className="field-input"
                          placeholder="+54 11 1234 5678"
                        />
                      </div>
                    </div>

                    {userType === 'paciente' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="field-label">{p.birthday}</label>
                          <input
                            type="date"
                            name="fechaNacimiento"
                            value={formData.fechaNacimiento}
                            onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className="field-input"
                          />
                        </div>
                        <div>
                          <label className="field-label">{p.dni}</label>
                          <input
                            type="text"
                            name="dni"
                            value={formData.dni}
                            onChange={handleChange}
                            pattern="\d{7,8}"
                            title={p.dniInputTitle}
                            className="field-input"
                            placeholder="12345678"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="field-label">{p.obraSocial}</label>
                          <input
                            type="text"
                            name="obraSocial"
                            value={formData.obraSocial}
                            onChange={handleChange}
                            maxLength={100}
                            className="field-input"
                            placeholder={p.patientInsurancePlaceholder}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PERFIL PROFESIONAL */}
                {activeSection === 'profesional' && userType === 'profesional' && (
                  <div className="space-y-5">
                    <header>
                      <h3 className="text-lg font-semibold text-foreground">{p.professionalSection || 'Perfil profesional'}</h3>
                      <p className="text-sm text-muted-foreground">{p.professionalSectionHelp || 'Información que ven tus pacientes.'}</p>
                    </header>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="field-label">{p.consultationFee}</label>
                        <input
                          type="number"
                          name="precioConsulta"
                          value={formData.precioConsulta}
                          onChange={handleChange}
                          min="0"
                          max="999999"
                          className="field-input"
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <label className="field-label">{p.practiceLocation}</label>
                        <input
                          type="text"
                          name="lugarAtencion"
                          value={formData.lugarAtencion}
                          onChange={handleChange}
                          maxLength={200}
                          className="field-input"
                          placeholder={p.practiceLocationPlaceholder}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between">
                        <label className="field-label">{p.biography}</label>
                        <span className="text-xs text-muted-foreground tabular-nums">{formData.bio.length}/500</span>
                      </div>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        maxLength={500}
                        className="field-input"
                        placeholder={p.biographyPlaceholder}
                      />
                    </div>

                    <div>
                      <label className="field-label">{p.acceptedInsurance}</label>
                      <p className="text-xs text-muted-foreground mb-2">{p.acceptedInsuranceHelp}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-56 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                        {getObrasSociales().map((os) => {
                          const checked = obrasSociales.includes(os);
                          return (
                            <label key={os} className="flex items-center gap-2.5 cursor-pointer rounded px-1.5 py-1 hover:bg-muted">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setObrasSociales(checked ? obrasSociales.filter((o) => o !== os) : [...obrasSociales, os])
                                }
                                className="w-4 h-4 accent-primary shrink-0"
                              />
                              <span className="text-sm text-foreground">{os}</span>
                            </label>
                          );
                        })}
                      </div>
                      {obrasSociales.length > 0 && (
                        <p className="text-xs text-primary mt-1.5 font-medium">
                          {fill(obrasSociales.length === 1 ? p.coverageSelectedSingular : p.coverageSelectedPlural, {
                            count: obrasSociales.length,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* NOTIFICACIONES */}
                {activeSection === 'notificaciones' && (
                  <div className="space-y-5">
                    <header>
                      <h3 className="text-lg font-semibold text-foreground">{p.notifications_}</h3>
                    </header>
                    {notifPrefs ? (
                      <div className="divide-y rounded-lg border">
                        {notifFields.map(({ field, labelKey }) =>
                          notifPrefs[field] !== undefined ? (
                            <label
                              key={field}
                              className="flex items-center justify-between gap-4 px-4 py-3 cursor-pointer select-none"
                            >
                              <span className="text-sm text-foreground">{p[labelKey]}</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={!!notifPrefs[field]}
                                onClick={() => toggleNotif(field)}
                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                                  notifPrefs[field] ? 'bg-primary' : 'bg-muted-foreground/40'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    notifPrefs[field] ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </label>
                          ) : null
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">…</p>
                    )}
                    {notifMsg && (
                      <p className={`text-xs ${notifMsg.startsWith('Error') ? 'text-destructive' : 'text-success'}`}>
                        {notifMsg}
                      </p>
                    )}
                  </div>
                )}

                {/* INTEGRACIONES */}
                {activeSection === 'integraciones' && (
                  <div className="space-y-5">
                    <header>
                      <h3 className="text-lg font-semibold text-foreground">{p.integrations}</h3>
                    </header>
                    <GoogleCalendarConnect />
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer sticky ───────────────────────────── */}
            <div className="border-t bg-card px-6 py-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                {error && <p className="text-sm text-destructive truncate">{error}</p>}
                {success && <p className="text-sm text-success truncate">{success}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border text-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                {c.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {loading && (
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                )}
                {loading ? c.saving : p.save}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
