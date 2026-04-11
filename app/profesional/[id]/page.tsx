'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Profesional, Slot, ListaEsperaItem } from '../../lib/api';
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
  const [suscribiendoLista, setSuscribiendoLista] = useState(false);
  const [suscripcionesLista, setSuscripcionesLista] = useState<ListaEsperaItem[]>([]);

  useEffect(() => {
    loadProfesional();
  }, [params.id]);

  useEffect(() => {
    loadListaEsperaActiva();
  }, [params.id, user?.paciente?.id]);

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

  const loadListaEsperaActiva = async () => {
    if (!user?.paciente) {
      setSuscripcionesLista([]);
      return;
    }

    try {
      const data = await api.listaEspera.misSuscripciones();
      const items = data.filter((x) => x.profesionalId === (params.id as string));
      setSuscripcionesLista(items);
    } catch (err) {
      console.error('Error loading waitlist:', err);
    }
  };

  const selectedDateKey = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const selectedWaitlistItem = selectedDateKey
    ? suscripcionesLista.find(
        (x) => x.modalidad === modalidad && new Date(x.fecha).toISOString().split('T')[0] === selectedDateKey
      )
    : null;

  const handleUnirseListaEspera = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!selectedDate) {
      alert('Primero selecciona un dia para lista de espera');
      return;
    }

    if (selectedWaitlistItem) {
      alert(`Ya estas en lista de espera para ${selectedDate.toLocaleDateString('es-AR')} (${modalidad.toLowerCase()}).`);
      return;
    }

    setSuscribiendoLista(true);
    try {
      const fecha = selectedDate.toISOString().split('T')[0];
      await api.listaEspera.suscribirme({
        profesionalId: params.id as string,
        fecha,
        modalidad,
      });
      alert('Te anotamos en lista de espera. Te avisamos si se libera un turno.');
      await loadListaEsperaActiva();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo registrar en lista de espera';
      if (message.toLowerCase().includes('ya estas en la lista')) {
        alert(`Ya estas anotado para ${selectedDate.toLocaleDateString('es-AR')} en modalidad ${modalidad.toLowerCase()}.`);
      } else {
        alert(message);
      }
    } finally {
      setSuscribiendoLista(false);
    }
  };

  const handleSalirListaEspera = async () => {
    if (!selectedWaitlistItem) return;

    setSuscribiendoLista(true);
    try {
      await api.listaEspera.cancelar(selectedWaitlistItem.id);
      alert('Saliste de la lista de espera.');
      await loadListaEsperaActiva();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo cancelar la suscripcion');
    } finally {
      setSuscribiendoLista(false);
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
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="text-amber-900 font-medium">No hay horarios disponibles para este dia.</p>
                  <p className="text-amber-800 text-sm mt-1">
                    Si queres, te anotamos en lista de espera y te avisamos cuando se libere un turno.
                  </p>

                  {selectedWaitlistItem ? (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-sm text-amber-900">
                        Ya estas en lista de espera para {selectedDate.toLocaleDateString('es-AR')} ({selectedWaitlistItem.estado}).
                      </span>
                      <button
                        onClick={handleSalirListaEspera}
                        disabled={suscribiendoLista}
                        className="px-3 py-2 text-sm rounded-md bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                      >
                        {suscribiendoLista ? 'Procesando...' : 'Salir de lista'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleUnirseListaEspera}
                      disabled={suscribiendoLista || !selectedDate}
                      className="mt-3 px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {suscribiendoLista ? 'Guardando...' : 'Unirme a lista de espera'}
                    </button>
                  )}
                </div>
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
