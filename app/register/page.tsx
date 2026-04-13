'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { api, Especialidad, Genero } from '../lib/api';

const GENERO_OPCIONES: { value: Genero; label: string }[] = [
  { value: 'NO_ESPECIFICADO', label: 'Prefiero no decirlo' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'OTRO', label: 'Otro' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'PACIENTE' as 'PROFESIONAL' | 'PACIENTE',
    nombre: '',
    apellido: '',
    telefono: '',
    genero: 'NO_ESPECIFICADO' as Genero,
    matricula: '',
    especialidadId: '',
    precioConsulta: '',
    lugarAtencion: '',
    bio: '',
    fotoUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.especialidades.getAll().then(setEspecialidades).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.nombre.length < 2 || formData.apellido.length < 2) {
      setError('El nombre y apellido deben tener al menos 2 caracteres');
      return;
    }

    if (formData.telefono && !/^[\d\s\-\+\(\)]{8,20}$/.test(formData.telefono)) {
      setError('El teléfono debe contener solo números y tener entre 8 y 20 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        rol: formData.rol,
        nombre: formData.nombre,
        apellido: formData.apellido,
        telefono: formData.telefono || undefined,
        genero: formData.genero,
        matricula: formData.rol === 'PROFESIONAL' ? formData.matricula : undefined,
        especialidadId: formData.rol === 'PROFESIONAL' ? formData.especialidadId : undefined,
        precioConsulta: formData.rol === 'PROFESIONAL' && formData.precioConsulta 
          ? Number(formData.precioConsulta) 
          : undefined,
        lugarAtencion: formData.rol === 'PROFESIONAL' ? formData.lugarAtencion : undefined,
        bio: formData.rol === 'PROFESIONAL' ? formData.bio : undefined,
        fotoUrl: formData.rol === 'PROFESIONAL' ? formData.fotoUrl : undefined,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">MediSync</h1>
          <p className="mt-2 text-gray-600">Crear cuenta</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Soy...
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="rol"
                    value="PACIENTE"
                    checked={formData.rol === 'PACIENTE'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Paciente
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="rol"
                    value="PROFESIONAL"
                    checked={formData.rol === 'PROFESIONAL'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Profesional
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">
                  Apellido
                </label>
                <input
                  id="apellido"
                  name="apellido"
                  required
                  value={formData.apellido}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="+54 11 1234 5678"
                pattern="[\d\s\-\+\(\)]{8,20}"
                title="Solo números, espacios, guiones, paréntesis y +"
              />
            </div>

            <div>
              <label htmlFor="genero" className="block text-sm font-medium text-gray-700">
                Género
              </label>
              <select
                id="genero"
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {GENERO_OPCIONES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.rol === 'PROFESIONAL' && (
              <>
                <div>
                  <label htmlFor="matricula" className="block text-sm font-medium text-gray-700">
                    Matrícula Profesional
                  </label>
                  <input
                    id="matricula"
                    name="matricula"
                    required
                    value={formData.matricula}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="MP 12345"
                  />
                </div>

                <div>
                  <label htmlFor="especialidadId" className="block text-sm font-medium text-gray-700">
                    Especialidad
                  </label>
                  <select
                    id="especialidadId"
                    name="especialidadId"
                    required
                    value={formData.especialidadId}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Seleccionar especialidad</option>
                    {especialidades.map((esp) => (
                      <option key={esp.id} value={esp.id}>
                        {esp.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="precioConsulta" className="block text-sm font-medium text-gray-700">
                    Precio de Consulta ($)
                  </label>
                  <input
                    id="precioConsulta"
                    name="precioConsulta"
                    type="number"
                    value={formData.precioConsulta}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label htmlFor="lugarAtencion" className="block text-sm font-medium text-gray-700">
                    Lugar de Atención
                  </label>
                  <input
                    id="lugarAtencion"
                    name="lugarAtencion"
                    value={formData.lugarAtencion}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Dirección o consultorio"
                  />
                </div>

                <div>
                  <label htmlFor="fotoUrl" className="block text-sm font-medium text-gray-700">
                    URL de Foto de Perfil
                  </label>
                  <input
                    id="fotoUrl"
                    name="fotoUrl"
                    type="url"
                    value={formData.fotoUrl}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Biografía
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    placeholder="Breve descripción sobre vos..."
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">¿Ya tenés cuenta? </span>
            <Link href="/login" className="text-blue-600 hover:text-blue-500">
              Iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
