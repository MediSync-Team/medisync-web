'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Stethoscope, Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { api, API_BASE, Especialidad, Genero } from '../lib/api';
import { getDashboardPath } from '../lib/auth-redirects';
import { useLang } from '../lib/i18n/context';
import { GoogleIcon } from '../components/icons';
import PasswordInput from '../components/PasswordInput';
import PasswordStrengthIndicator, { getRequirements } from '../components/PasswordStrengthIndicator';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
    especialidadId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.especialidades.getAll().then(setEspecialidades).catch(console.error); }, []);

  const setField = (name: string, value: string) => setFormData((f) => ({ ...f, [name]: value }));
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setField(e.target.name, e.target.value);

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
        especialidadId: formData.rol === 'PROFESIONAL' ? formData.especialidadId : undefined,
      });
      router.push(getDashboardPath({ rol: formData.rol }));
    } catch (err) {
      setError(err instanceof Error ? err.message : a.registerBtn);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'PACIENTE', icon: User, title: a.patient, desc: a.roleDescPatient },
    { value: 'PROFESIONAL', icon: Stethoscope, title: a.professional, desc: a.roleDescProfessional },
    { value: 'CLINICA', icon: Building2, title: a.clinic, desc: a.roleDescClinic },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="fixed top-4 right-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="text-sm text-muted-foreground">{a.logoSubtitle}</p>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-8">
            <h2 className="mb-6 font-heading text-lg font-semibold">{a.createAccount}</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <Alert variant="destructive" aria-live="polite">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Role */}
              <div>
                <Label className="mb-2 block">{a.role}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(({ value, icon: Icon, title, desc }) => {
                    const active = formData.rol === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData((f) => ({ ...f, rol: value }))}
                        className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all ${
                          active
                            ? 'border-primary bg-accent'
                            : 'border-border hover:border-primary/40 hover:bg-muted'
                        }`}
                      >
                        <Icon className={`size-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-xs font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>{title}</span>
                        <span className="text-[10px] leading-tight text-muted-foreground">{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nombre">{formData.rol === 'CLINICA' ? a.managerFirstName : a.firstName}</Label>
                  <Input id="nombre" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder={formData.rol === 'CLINICA' ? 'Juan' : undefined} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="apellido">{a.lastName}</Label>
                  <Input id="apellido" name="apellido" required value={formData.apellido} onChange={handleChange} placeholder={formData.rol === 'CLINICA' ? 'García' : undefined} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">{a.email}</Label>
                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="telefono">
                  {a.phone} <span className="text-xs text-muted-foreground">({t('common').optional})</span>
                </Label>
                <Input id="telefono" name="telefono" type="tel" value={formData.telefono} onChange={handleChange} placeholder="+54 11 1234 5678" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{a.gender}</Label>
                <Select value={formData.genero} onValueChange={(val) => val && setField('genero', val)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO_ESPECIFICADO">{a.genderNS}</SelectItem>
                    <SelectItem value="MASCULINO">{a.genderM}</SelectItem>
                    <SelectItem value="FEMENINO">{a.genderF}</SelectItem>
                    <SelectItem value="OTRO">{a.genderO}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.rol === 'PROFESIONAL' && (
                <div className="flex flex-col gap-1.5">
                  <Label>{a.specialty}</Label>
                  <Select value={formData.especialidadId} onValueChange={(val) => val && setField('especialidadId', val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">{a.password}</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(value) => setField('password', value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                <PasswordStrengthIndicator password={formData.password} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">{a.confirmPassword}</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(value) => setField('confirmPassword', value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" disabled={loading} className="mt-2 w-full">
                {loading ? a.registering : a.registerBtn}
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs text-muted-foreground">
                  <span className="bg-card px-3">{a.orContinueWith}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                render={<a href={`${API_BASE}/auth/google?rol=${formData.rol}`} />}
              >
                <GoogleIcon size={16} />
                Google
              </Button>

              <p className="pt-2 text-center text-sm text-muted-foreground">
                {a.haveAccount}{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">{a.loginBtn}</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
