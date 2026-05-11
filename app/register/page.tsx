'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { api, API_BASE, Especialidad, Genero } from '../lib/api';
import { getDashboardPath } from '../lib/auth-redirects';
import { useLang } from '../lib/i18n/context';
import { GoogleIcon, UserIcon, StethoscopeIcon, HospitalIcon } from '../components/icons';
import ThemeLangToggle from '../components/ThemeLangToggle';
import PasswordInput from '../components/PasswordInput';
import PasswordStrengthIndicator, { getRequirements } from '../components/PasswordStrengthIndicator';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLang();
  const a = t('auth');
  const v = a.validation;
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    rol: 'PACIENTE' as 'PROFESIONAL' | 'PACIENTE' | 'CLINICA',
    nombre: '', apellido: '', telefono: '',
    genero: 'NO_ESPECIFICADO' as Genero,
    matricula: '', especialidadId: '', precioConsulta: '',
    lugarAtencion: '', bio: '', fotoUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.especialidades.getAll().then(setEspecialidades).catch(console.error); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError(v.passwordsNoMatch); return; }
    const reqs = getRequirements(formData.password);
    if (!reqs.minLength || !reqs.hasUppercase || !reqs.hasLowercase || !reqs.hasNumber || !reqs.hasSpecial) {
      setError(v.passwordRequirements);
      return;
    }
    if (formData.nombre.length < 2 || formData.apellido.length < 2) { setError(v.nameMinLength); return; }
    if (formData.telefono && !/^[\d\s\-\+\(\)]{8,20}$/.test(formData.telefono)) { setError(v.invalidPhone); return; }
    setLoading(true);
    try {
      await register({
        email: formData.email, password: formData.password, rol: formData.rol,
        nombre: formData.nombre, apellido: formData.apellido,
        telefono: formData.telefono || undefined, genero: formData.genero,
        matricula: formData.rol === 'PROFESIONAL' ? formData.matricula : undefined,
        especialidadId: formData.rol === 'PROFESIONAL' ? formData.especialidadId : undefined,
        precioConsulta: formData.rol === 'PROFESIONAL' && formData.precioConsulta ? Number(formData.precioConsulta) : undefined,
        lugarAtencion: formData.rol === 'PROFESIONAL' ? formData.lugarAtencion : undefined,
        bio: formData.rol === 'PROFESIONAL' ? formData.bio : undefined,
        fotoUrl: formData.rol === 'PROFESIONAL' ? formData.fotoUrl : undefined,
      });
      router.push(getDashboardPath({ rol: formData.rol }));
    } catch (err) {
      setError(err instanceof Error ? err.message : a.registerBtn);
    } finally {
      setLoading(false);
    }
  };

  const inp = 'field-input mt-1';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="fixed top-4 right-4"><ThemeLangToggle /></div>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">MediSync</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{a.logoSubtitle}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6">{a.createAccount}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="alert alert-error text-sm" role="alert" aria-live="polite" aria-atomic="true">{error}</div>}

            {/* Role */}
            <div>
              <label className="field-label mb-2 block">{a.role}</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'PACIENTE', icon: <UserIcon size={22} className="text-blue-700" />, title: a.patient, desc: a.roleDescPatient },
                  { value: 'PROFESIONAL', icon: <StethoscopeIcon size={22} className="text-blue-700" />, title: a.professional, desc: a.roleDescProfessional },
                  { value: 'CLINICA', icon: <HospitalIcon size={22} className="text-blue-700" />, title: a.clinic, desc: a.roleDescClinic },
                ] as const).map(({ value, icon, title, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, rol: value }))}
                    className={`flex flex-col items-center text-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      formData.rol === value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                        : 'border-slate-200 dark:border-slate-600 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-2xl" aria-hidden>{icon}</span>
                    <span className={`text-xs font-semibold ${formData.rol === value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name grid */}
            {formData.rol === 'CLINICA' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="nombre" className="field-label">{a.managerFirstName}</label>
                  <input id="nombre" name="nombre" required value={formData.nombre} onChange={handleChange} className={inp} placeholder="Juan" />
                </div>
                <div>
                  <label htmlFor="apellido" className="field-label">{a.lastName}</label>
                  <input id="apellido" name="apellido" required value={formData.apellido} onChange={handleChange} className={inp} placeholder="García" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="nombre" className="field-label">{a.firstName}</label>
                  <input id="nombre" name="nombre" required value={formData.nombre} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label htmlFor="apellido" className="field-label">{a.lastName}</label>
                  <input id="apellido" name="apellido" required value={formData.apellido} onChange={handleChange} className={inp} />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="field-label">{a.email}</label>
              <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className={inp} />
            </div>

            <div>
              <label htmlFor="telefono" className="field-label">{a.phone} <span className="text-slate-400 text-xs">({t('common').optional})</span></label>
              <input id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} className={inp} placeholder="+54 11 1234 5678" />
            </div>

            <div>
              <label htmlFor="genero" className="field-label">{a.gender}</label>
              <select id="genero" name="genero" value={formData.genero} onChange={handleChange} className="field-select mt-1">
                <option value="NO_ESPECIFICADO">{a.genderNS}</option>
                <option value="MASCULINO">{a.genderM}</option>
                <option value="FEMENINO">{a.genderF}</option>
                <option value="OTRO">{a.genderO}</option>
              </select>
            </div>

            {formData.rol === 'PROFESIONAL' && (
              <>
                <div>
                  <label htmlFor="matricula" className="field-label">{a.license}</label>
                  <input id="matricula" name="matricula" required value={formData.matricula} onChange={handleChange} className={inp} placeholder="MP 12345" />
                </div>
                <div>
                  <label htmlFor="especialidadId" className="field-label">{a.specialty}</label>
                  <select id="especialidadId" name="especialidadId" required value={formData.especialidadId} onChange={handleChange} className="field-select mt-1">
                    <option value="">—</option>
                    {especialidades.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="precioConsulta" className="field-label">{a.price}</label>
                  <input id="precioConsulta" name="precioConsulta" type="number" value={formData.precioConsulta} onChange={handleChange} className={inp} placeholder="5000" />
                </div>
                <div>
                  <label htmlFor="lugarAtencion" className="field-label">{a.location}</label>
                  <input id="lugarAtencion" name="lugarAtencion" value={formData.lugarAtencion} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label htmlFor="fotoUrl" className="field-label">{t('profile').photoUrl}</label>
                  <input id="fotoUrl" name="fotoUrl" type="url" value={formData.fotoUrl} onChange={handleChange} className={inp} placeholder="https://..." />
                </div>
                <div>
                  <label htmlFor="bio" className="field-label">{a.bio}</label>
                  <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} className="field-input mt-1 resize-none" />
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="field-label">{a.password}</label>
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={(value) => handleChange({ target: { name: 'password', value } } as any)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="field-label">{a.confirmPassword}</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={(value) => handleChange({ target: { name: 'confirmPassword', value } } as any)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
              {loading ? a.registering : a.registerBtn}
            </button>

            {formData.rol && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs text-slate-400 dark:text-slate-500">
                    <span className="bg-white dark:bg-slate-800 px-3">{a.orContinueWith}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a href={`${API_BASE}/auth/google?rol=${formData.rol}`} className="btn btn-secondary flex-1 justify-center gap-2">
                    <GoogleIcon size={16} />
                    Google
                  </a>
                </div>
              </>
            )}

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
              {a.haveAccount}{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">{a.loginBtn}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
