'use client';

import { useState, useEffect } from 'react';
import { api, Profesional, Paciente, Genero } from '../lib/api';

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

const GENERO_OPCIONES: { value: Genero; label: string }[] = [
  { value: 'NO_ESPECIFICADO', label: 'Prefiero no decirlo' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'OTRO', label: 'Otro' },
];

const validateTelefono = (telefono: string): boolean => {
  return /^[\d\s\-\+\(\)]{8,20}$/.test(telefono);
};

const validateDNI = (dni: string): boolean => {
  return /^\d{7,8}$/.test(dni);
};

export default function ProfileModal({ isOpen, onClose, userType, user, onUpdate }: ProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    }
  }, [isOpen, userType, user]);

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
        });
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

      setSuccess('¡Perfil actualizado correctamente!');
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
          <h2 className="text-xl font-bold text-gray-900">Editar Perfil</h2>
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
                Nombre
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
                Apellido
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
              Género
            </label>
            <select
              name="genero"
              value={formData.genero}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {GENERO_OPCIONES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
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
              URL de Foto de Perfil
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
                  Precio de Consulta ($)
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
                  Lugar de Atención
                </label>
                <input
                  type="text"
                  name="lugarAtencion"
                  value={formData.lugarAtencion}
                  onChange={handleChange}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección del consultorio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Breve descripción profesional..."
                />
              </div>
            </>
          )}

          {userType === 'paciente' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento
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
                  DNI
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
                  Obra Social
                </label>
                <input
                  type="text"
                  name="obraSocial"
                  value={formData.obraSocial}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre de obra social (opcional)"
                />
              </div>
            </>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
