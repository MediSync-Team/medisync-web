'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, clinicasApi, Especialidad } from '../../lib/api';
import { useLang } from '../../lib/i18n/context';
import ThemeLangToggle from '../../components/ThemeLangToggle';
import { MediSyncLogo } from '../../components/icons';

export default function CompletaPerfilPage() {
  const router = useRouter();
  const { t } = useLang();
  const a = t('auth');
  const cp = a.completeProfile;
  const [user, setUser] = useState<any>(null);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    telefono: '',
    genero: 'NO_ESPECIFICADO' as string,
    matricula: '',
    especialidadId: '',
    precioConsulta: '',
    lugarAtencion: '',
    bio: '',
    fotoUrl: '',
    nombre: '',
    descripcion: '',
    direccion: '',
    website: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const me = await api.auth.me();
        setUser(me);
        setFormData(prev => ({
          ...prev,
          telefono: me.paciente?.telefono || me.clinica?.telefono || '',
          genero: me.paciente?.genero || 'NO_ESPECIFICADO',
          nombre: me.clinica?.nombre || '',
          descripcion: me.clinica?.descripcion || '',
          direccion: me.clinica?.direccion || '',
          website: me.clinica?.website || '',
        }));

        if (me.rol === 'PROFESIONAL') {
          const espec = await api.especialidades.getAll();
          setEspecialidades(espec);
        }
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (user.rol === 'PROFESIONAL') {
        if (!formData.matricula || !formData.especialidadId) {
          setError(cp.licenseAndSpecialtyRequired);
          return;
        }
        await api.profesional.updatePerfil(user.profesional.id, {
          matricula: formData.matricula,
          especialidadId: formData.especialidadId,
          precioConsulta: formData.precioConsulta ? Number(formData.precioConsulta) : undefined,
          lugarAtencion: formData.lugarAtencion || undefined,
          bio: formData.bio || undefined,
          fotoUrl: formData.fotoUrl || undefined,
        } as any);
      } else if (user.rol === 'PACIENTE') {
        await api.pacientes.updatePerfil({
          telefono: formData.telefono || undefined,
          genero: formData.genero as any,
        });
      } else if (user.rol === 'CLINICA') {
        if (!formData.nombre.trim()) {
          setError(cp.clinicNameRequired);
          return;
        }
        await clinicasApi.updateMe({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion || undefined,
          direccion: formData.direccion || undefined,
          telefono: formData.telefono || undefined,
          website: formData.website || undefined,
        });
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : cp.updateProfileError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MediSyncLogo />
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('common').loading}</p>
        </div>
      </div>
    );
  }

  const inp = 'field-input mt-1';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      <div className="fixed top-4 right-4"><ThemeLangToggle /></div>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3 shadow-lg">
            <MediSyncLogo size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">MediSync</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{cp.title}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">
            {user?.rol === 'PROFESIONAL'
              ? cp.professionalInfo
              : user?.rol === 'PACIENTE'
              ? cp.personalInfo
              : cp.clinicInfo}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="alert alert-error text-sm" role="alert" aria-live="polite" aria-atomic="true">{error}</div>}

            {user?.rol === 'PROFESIONAL' && (
              <>
                <div>
                  <label htmlFor="matricula" className="field-label">{cp.licenseLabel}</label>
                  <input
                    id="matricula"
                    name="matricula"
                    required
                    value={formData.matricula}
                    onChange={handleChange}
                    className={inp}
                    placeholder="MP 12345 / LP 54321"
                  />
                </div>

                <div>
                  <label htmlFor="especialidadId" className="field-label">{cp.specialtyLabel}</label>
                  <select
                    id="especialidadId"
                    name="especialidadId"
                    required
                    value={formData.especialidadId}
                    onChange={handleChange}
                    className="field-select mt-1"
                  >
                    <option value="">{cp.specialtyPlaceholder}</option>
                    {especialidades.map(e => (
                      <option key={e.id} value={e.id}>{e.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="precioConsulta" className="field-label">{cp.priceLabel}</label>
                  <input
                    id="precioConsulta"
                    name="precioConsulta"
                    type="number"
                    min="0"
                    value={formData.precioConsulta}
                    onChange={handleChange}
                    className={inp}
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label htmlFor="lugarAtencion" className="field-label">{cp.locationLabel}</label>
                  <input
                    id="lugarAtencion"
                    name="lugarAtencion"
                    value={formData.lugarAtencion}
                    onChange={handleChange}
                    className={inp}
                    placeholder={cp.locationPlaceholder}
                  />
                </div>

                <div>
                  <label htmlFor="fotoUrl" className="field-label">{cp.photoLabel}</label>
                  <input
                    id="fotoUrl"
                    name="fotoUrl"
                    type="url"
                    value={formData.fotoUrl}
                    onChange={handleChange}
                    className={inp}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="field-label">{cp.bioLabel}</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="field-input mt-1 resize-none"
                    placeholder={cp.bioPlaceholder}
                  />
                </div>
              </>
            )}

            {user?.rol === 'PACIENTE' && (
              <>
                <div>
                  <label htmlFor="telefono" className="field-label">{a.phone}</label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    className={inp}
                    placeholder={cp.phonePlaceholder}
                  />
                </div>

                <div>
                  <label htmlFor="genero" className="field-label">{a.gender}</label>
                  <select
                    id="genero"
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    className="field-select mt-1"
                  >
                    <option value="NO_ESPECIFICADO">{a.genderNS}</option>
                    <option value="MASCULINO">{a.genderM}</option>
                    <option value="FEMENINO">{a.genderF}</option>
                    <option value="OTRO">{a.genderO}</option>
                  </select>
                </div>
              </>
            )}

            {user?.rol === 'CLINICA' && (
              <>
                <div>
                  <label htmlFor="nombre" className="field-label">{cp.clinicNameLabel}</label>
                  <input
                    id="nombre"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    className={inp}
                  />
                </div>

                <div>
                  <label htmlFor="direccion" className="field-label">{cp.clinicAddressLabel}</label>
                  <input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className={inp}
                  />
                </div>

                <div>
                  <label htmlFor="telefono" className="field-label">{a.phone}</label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    className={inp}
                    placeholder={cp.phonePlaceholder}
                  />
                </div>

                <div>
                  <label htmlFor="website" className="field-label">{cp.clinicWebsiteLabel}</label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleChange}
                    className={inp}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="descripcion" className="field-label">{cp.clinicDescriptionLabel}</label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows={3}
                    className="field-input mt-1 resize-none"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="btn btn-secondary flex-1"
              >
                {cp.completeLater}
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
                {submitting ? cp.saving : cp.continue}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
