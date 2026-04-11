'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Profesional, Slot } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ProfesionalPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [profesional, setProfesional] = useState<Profesional | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [modalidad, setModalidad] = useState<'PRESENCIAL' | 'VIRTUAL'>('PRESENCIAL');
  const [reservando, setReservando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfesional();
  }, [params.id]);

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate);
    }
  }, [selectedDate, modalidad]);

  const loadProfesional = async () => {
    try {
      const data = await api.profesionales.getById(params.id as string);
      setProfesional(data);
    } catch (err) {
      console.error('Error loading profesional:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (date: Date) => {
    try {
      const fecha = date.toISOString().split('T')[0];
      const data = await api.profesionales.getSlots(params.id as string, fecha, modalidad);
      setSlots(data);
    } catch (err) {
      console.error('Error loading slots:', err);
    }
  };

  const getProximosDias = () => {
    const dias = [];
    const hoy = new Date();
    for (let i = 0; i < 14; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      dias.push(fecha);
    }
    return dias;
  };

  const handleReservar = async () => {
    if (!selectedSlot || !selectedDate || !profesional) return;

    if (!user) {
      router.push('/login');
      return;
    }

    setReservando(true);
    setError('');

    try {
      const fechaHora = new Date(selectedDate);
      const [hora, minuto] = selectedSlot.split(':');
      fechaHora.setHours(parseInt(hora), parseInt(minuto), 0, 0);

      const reservaData: Parameters<typeof api.turnos.reservar>[0] = {
        profesionalId: profesional.id,
        fechaHora: fechaHora.toISOString(),
        modalidad,
      };

      if (user.paciente) {
        reservaData.paciente = {
          nombre: user.paciente.nombre,
          apellido: user.paciente.apellido,
          email: user.paciente.email,
          telefono: user.paciente.telefono,
          dni: user.paciente.dni,
        };
      }

      const reserva = await api.turnos.reservar(reservaData);

      if (profesional.precioConsulta > 0) {
        router.push(`/pago?turno=${reserva.turno.id}`);
        return;
      }

      alert('¡Turno reservado con éxito!');
      router.push('/dashboard/paciente');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reservar');
    } finally {
      setReservando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!profesional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Profesional no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Volver al inicio
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
              👨‍⚕️
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {profesional.nombre} {profesional.apellido}
              </h1>
              <p className="text-blue-600 font-medium">{profesional.especialidad?.nombre}</p>
              {profesional.precioConsulta > 0 && (
                <p className="text-green-600 font-bold text-xl mt-2">
                  ${Number(profesional.precioConsulta).toLocaleString('es-AR')}
                </p>
              )}
              {profesional.lugarAtencion && (
                <p className="text-gray-500 mt-2">📍 {profesional.lugarAtencion}</p>
              )}
              {profesional.telefono && (
                <p className="text-gray-500">📞 {profesional.telefono}</p>
              )}
              {profesional.bio && (
                <p className="text-gray-600 mt-4">{profesional.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Reservar Turno</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modalidad
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="modalidad"
                  value="PRESENCIAL"
                  checked={modalidad === 'PRESENCIAL'}
                  onChange={() => setModalidad('PRESENCIAL')}
                  className="mr-2"
                />
                Presencial
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="modalidad"
                  value="VIRTUAL"
                  checked={modalidad === 'VIRTUAL'}
                  onChange={() => setModalidad('VIRTUAL')}
                  className="mr-2"
                />
                Virtual
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccioná un día
            </label>
            <div className="flex gap-2 flex-wrap">
              {getProximosDias().map((fecha) => {
                const isSelected = selectedDate?.toDateString() === fecha.toDateString();
                return (
                  <button
                    key={fecha.toISOString()}
                    onClick={() => {
                      setSelectedDate(fecha);
                      setSelectedSlot(null);
                    }}
                    className={`p-3 rounded-lg text-center min-w-[70px] ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-xs">{DIAS_SEMANA[fecha.getDay()].slice(0, 3)}</div>
                    <div className="font-bold">{fecha.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horarios disponibles para el {selectedDate.toLocaleDateString('es-AR')}
              </label>
              {slots.length === 0 ? (
                <p className="text-gray-500">No hay horarios disponibles para este día.</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {slots.map((slot) => (
                    <button
                      key={slot.hora}
                      onClick={() => slot.disponible && setSelectedSlot(slot.hora)}
                      disabled={!slot.disponible}
                      className={`px-4 py-2 rounded-md ${
                        !slot.disponible
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : selectedSlot === slot.hora
                          ? 'bg-blue-600 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {slot.hora}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">{error}</div>
          )}

          {selectedSlot && (
            <div className="border-t pt-4">
              <p className="text-gray-600 mb-4">
                Vas a reservar el{' '}
                <strong>
                  {selectedDate?.toLocaleDateString('es-AR')} a las {selectedSlot}
                </strong>{' '}
                con <strong>{profesional.nombre} {profesional.apellido}</strong>
              </p>
              <button
                onClick={handleReservar}
                disabled={reservando}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {reservando ? 'Reservando...' : 'Confirmar Reserva'}
              </button>
              {!user && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Necesitás{' '}
                  <Link href="/login" className="text-blue-600 hover:underline">
                    iniciar sesión
                  </Link>{' '}
                  para completar la reserva.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
