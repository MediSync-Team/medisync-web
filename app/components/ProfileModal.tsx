'use client';

import { useState, useEffect } from 'react';
import { api, Profesional, Paciente, Genero, NotificationPreferences } from '../lib/api';
import { OBRAS_SOCIALES } from '../lib/obras-sociales';
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
  const { t, lang } = useLang();
  const p = t('profile');
  const c = t('common');
  const isEs = lang === 'es';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [obrasSociales, setObrasSociales] = useState<string[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

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
    }
  }, [isOpen, userType, user]);

  const toggleNotif = (field: keyof NotificationPreferences) => {
    if (!notifPrefs) return;
    setNotifPrefs({ ...notifPrefs, [field]: !notifPrefs[field] });
  };

  const saveNotifPrefs = async () => {
    if (!notifPrefs) return;
    setSavingNotif(true);
    setNotifMsg('');
    try {
      await api.notifications.updatePreferences(notifPrefs);
      setNotifMsg(isEs ? 'Preferencias guardadas' : 'Preferences saved');
    } catch {
      setNotifMsg(isEs ? 'Error al guardar preferencias' : 'Error saving preferences');
    } finally {
      setSavingNotif(false);
    }
  };

  const sendTestNotif = async (canal: 'EMAIL' | 'WHATSAPP') => {
    setSendingTest(true);
    setNotifMsg('');
    try {
      await api.notifications.sendTest(canal);
      setNotifMsg(isEs
        ? `Prueba de ${canal === 'EMAIL' ? 'email' : 'WhatsApp'} enviada`
        : `${canal === 'EMAIL' ? 'Email' : 'WhatsApp'} test sent`);
    } catch {
      setNotifMsg(isEs ? 'Error al enviar notificación de prueba' : 'Error sending test notification');
    } finally {
      setSendingTest(false);
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
      setError('El teléfono debe tener entre 8 y 20 caracteres (solo números, espacios, +, - y paréntesis)');
      setLoading(false);
      return;
    }

    if (userType === 'paciente' && formData.dni && !validateDNI(formData.dni)) {
      setError('El DNI debe tener entre 7 y 8 dígitos numéricos');
      setLoading(false);
      return;
    }

    if (formData.fechaNacimiento) {
      const fecha = new Date(formData.fechaNacimiento);
      const hoy = new Date();
      if (fecha > hoy) {
        setError('La fecha de nacimiento no puede ser futura');
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

      setSuccess(isEs ? '¡Perfil actualizado correctamente!' : 'Profile updated successfully!');
      setTimeout(() => {
        onClose();
        if (onUpdate) onUpdate();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{p.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {p.gender}
            </label>
            <select
              name="genero"
              value={formData.genero}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {GENERO_OPCIONES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {p[opt.labelKey as keyof typeof p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {p.phone}
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              pattern="[\d\s\-\+\(\)]{8,20}"
              title="Solo números, espacios, +, - y paréntesis (8-20 caracteres)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="+54 11 1234 5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {p.photoUrl}
            </label>
            <input
              type="url"
              name="fotoUrl"
              value={formData.fotoUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://ejemplo.com/foto.jpg"
            />
          </div>

          {userType === 'profesional' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEs ? 'Precio de Consulta ($)' : 'Consultation Fee ($)'}
                </label>
                <input
                  type="number"
                  name="precioConsulta"
                  value={formData.precioConsulta}
                  onChange={handleChange}
                  min="0"
                  max="999999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEs ? 'Lugar de Atención' : 'Practice Location'}
                </label>
                <input
                  type="text"
                  name="lugarAtencion"
                  value={formData.lugarAtencion}
                  onChange={handleChange}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isEs ? 'Dirección del consultorio' : 'Practice address'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEs ? 'Biografía' : 'Biography'}
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isEs ? 'Breve descripción profesional...' : 'Short professional bio...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEs ? 'Obras sociales / prepagas aceptadas' : 'Accepted health insurance providers'}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {isEs
                    ? 'Seleccioná las coberturas que aceptás. Los pacientes podrán filtrar por su obra social.'
                    : 'Select accepted coverages. Patients will be able to filter by insurance.'}
                </p>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {OBRAS_SOCIALES.map((os) => {
                    const checked = obrasSociales.includes(os);
                    return (
                      <label key={os} className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setObrasSociales(
                            checked
                              ? obrasSociales.filter((o) => o !== os)
                              : [...obrasSociales, os]
                          )}
                          className="w-4 h-4 accent-blue-600 shrink-0"
                        />
                        <span className="text-sm text-gray-700">{os}</span>
                      </label>
                    );
                  })}
                </div>
                {obrasSociales.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1.5 font-medium">
                    {isEs
                      ? `${obrasSociales.length} cobertura${obrasSociales.length > 1 ? 's' : ''} seleccionada${obrasSociales.length > 1 ? 's' : ''}`
                      : `${obrasSociales.length} coverage${obrasSociales.length > 1 ? 's' : ''} selected`}
                  </p>
                )}
              </div>
            </>
          )}

          {userType === 'paciente' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {p.birthday}
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {p.dni}
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  pattern="\d{7,8}"
                  title="7 u 8 dígitos numéricos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {p.obraSocial}
                </label>
                <input
                  type="text"
                  name="obraSocial"
                  value={formData.obraSocial}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={isEs ? 'Nombre de obra social (opcional)' : 'Insurance provider name (optional)'}
                />
              </div>
            </>
          )}

          {notifPrefs && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{p.notifications_}</h3>
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
                  ] as { field: keyof NotificationPreferences; labelKey: keyof typeof p }[]
                ).map(({ field, labelKey }) =>
                  notifPrefs[field] !== undefined ? (
                    <label key={field} className="flex items-center justify-between cursor-pointer select-none">
                      <span className="text-sm text-gray-600">{p[labelKey]}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!notifPrefs[field]}
                        onClick={() => toggleNotif(field)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifPrefs[field] ? 'bg-blue-600' : 'bg-gray-300'
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
                <p className={`mt-2 text-xs ${notifMsg.startsWith('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
                  {notifMsg}
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={saveNotifPrefs}
                  disabled={savingNotif}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                >
                  {savingNotif ? c.saving : (isEs ? 'Guardar preferencias' : 'Save preferences')}
                </button>
                <button
                  type="button"
                  onClick={() => sendTestNotif('EMAIL')}
                  disabled={sendingTest}
                  title={isEs ? 'Enviar email de prueba' : 'Send test email'}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {sendingTest ? '...' : '✉️'}
                </button>
                <button
                  type="button"
                  onClick={() => sendTestNotif('WHATSAPP')}
                  disabled={sendingTest}
                  title={isEs ? 'Enviar WhatsApp de prueba' : 'Send test WhatsApp'}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {sendingTest ? '...' : '💬'}
                </button>
              </div>
            </div>
          )}

          {(userType === 'profesional' || userType === 'paciente') && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{p.integrations}</h3>
              <GoogleCalendarConnect />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
                {c.cancel}
              </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? c.saving : p.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
