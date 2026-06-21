'use client';

import { useState, useEffect } from 'react';
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
      api.notifications.getPreferences().then(setNotifPrefs).catch(() => {});
      loadObrasSociales();
    }
  }, [isOpen, userType, user]);

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
      setLoading(false);
      return;
    }

    if (userType === 'paciente' && formData.dni && !validateDNI(formData.dni)) {
      setError(p.dniError);
      setLoading(false);
      return;
    }

    if (formData.fechaNacimiento) {
      const fecha = new Date(formData.fechaNacimiento);
      const hoy = new Date();
      if (fecha > hoy) {
        setError(p.birthDateFutureError);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-foreground">{p.title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/10 text-success p-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {p.firstName}
              </label>
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
              <label className="block text-sm font-medium text-foreground mb-1">
                {p.lastName}
              </label>
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {p.gender}
            </label>
            <select
              name="genero"
              value={formData.genero}
              onChange={handleChange}
              className="field-select"
            >
              {GENERO_OPCIONES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {p[opt.labelKey as keyof Pick<typeof p, 'genderM' | 'genderF' | 'genderO' | 'genderNS'>] || opt.value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {p.phone}
            </label>
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {p.photoUrl}
            </label>
            <input
              type="url"
              name="fotoUrl"
              value={formData.fotoUrl}
              onChange={handleChange}
              className="field-input"
              placeholder={p.photoUrlPlaceholder}
            />
          </div>

          {userType === 'profesional' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {p.consultationFee}
                </label>
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  {p.practiceLocation}
                </label>
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {p.biography}
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  className="field-input"
                  placeholder={p.biographyPlaceholder}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {p.acceptedInsurance}
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  {p.acceptedInsuranceHelp}
                </p>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {getObrasSociales().map((os) => {
                    const checked = obrasSociales.includes(os);
                    return (
                      <label key={os} className="flex items-center gap-2.5 cursor-pointer hover:bg-muted rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setObrasSociales(
                            checked
                              ? obrasSociales.filter((o) => o !== os)
                              : [...obrasSociales, os]
                          )}
                          className="w-4 h-4 accent-primary shrink-0"
                        />
                        <span className="text-sm text-foreground">{os}</span>
                      </label>
                    );
                  })}
                </div>
                {obrasSociales.length > 0 && (
                  <p className="text-xs text-primary mt-1.5 font-medium">
                    {fill(obrasSociales.length === 1 ? p.coverageSelectedSingular : p.coverageSelectedPlural, { count: obrasSociales.length })}
                  </p>
                )}
              </div>
            </>
          )}

          {userType === 'paciente' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {p.birthday}
                </label>
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  {p.dni}
                </label>
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {p.obraSocial}
                </label>
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
            </>
          )}

          {notifPrefs && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-foreground mb-3">{p.notifications_}</h3>
              <div className="space-y-3">
                {(
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
                ).map(({ field, labelKey }) =>
                  notifPrefs[field] !== undefined ? (
                    <label key={field} className="flex items-center justify-between cursor-pointer select-none">
                      <span className="text-sm text-muted-foreground">{p[labelKey]}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!notifPrefs[field]}
                        onClick={() => toggleNotif(field)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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

              {notifMsg && (
                <p className={`mt-2 text-xs ${notifMsg.startsWith('Error') ? 'text-destructive' : 'text-success'}`}>
                  {notifMsg}
                </p>
              )}


            </div>
          )}

          {(userType === 'profesional' || userType === 'paciente') && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-foreground mb-3">{p.integrations}</h3>
              <GoogleCalendarConnect />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md text-foreground hover:bg-muted"
            >
                {c.cancel}
              </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? c.saving : p.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
