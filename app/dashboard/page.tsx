'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { api, Turno, Disponibilidad, Evolucion } from '../lib/api';
import StatsPanel from '../components/StatsPanel';
import ProfileModal from '../components/ProfileModal';

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface StatsData {
  turnosPorMes: any[];
  ingresosPorMes: any[];
  resumen: {
    totalTurnos: number;
    totalPacientes: number;
  };
}

export default function ProfesionalDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calendario' | 'disponibilidad' | 'stats'>('calendario');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [turnosDelDia, setTurnosDelDia] = useState<Turno[]>([]);
  const [nuevaDisp, setNuevaDisp] = useState({ diaSemana: 1, horaInicio: '09:00', horaFin: '17:00', modalidad: 'PRESENCIAL' as const });
  const [slotActual, setSlotActual] = useState<Turno | null>(null);
  const [recordatorios, setRecordatorios] = useState<any[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user?.paciente) {
      router.push('/dashboard/paciente');
    }
    if (user?.profesional) {
      loadData();
      loadRecordatorios();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!selectedDate) return;
    const delDia = turnos.filter(t => {
      const fechaTurno = new Date(t.fechaHora);
      return fechaTurno.toDateString() === selectedDate.toDateString();
    });
    setTurnosDelDia(delDia);
  }, [turnos, selectedDate]);

  const loadData = async () => {
    if (!user?.profesional) return;
    
    try {
      const [turnosData, dispData] = await Promise.all([
        api.turnos.getByProfesional(user.profesional.id, {
          desde: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          hasta: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        }),
        api.profesionales.getById(user.profesional.id),
      ]);
      setTurnos(turnosData);
      setDisponibilidades(dispData.disponibilidades || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecordatorios = async () => {
    try {
      const data = await api.recordatorios.getProfesional();
      setRecordatorios(data.turnos || []);
    } catch (err) {
      console.error('Error loading recordatorios:', err);
    }
  };

  const handleAgregarDisponibilidad = async () => {
    if (!user?.profesional) return;
    
    try {
      await api.profesionales.crearDisponibilidad(user.profesional.id, nuevaDisp);
      alert('Horario agregado correctamente');
      loadData();
    } catch (err) {
      console.error('Error:', err);
      alert(err instanceof Error ? err.message : 'Error al agregar horario');
    }
  };

  const handleEliminarDisponibilidad = async (disponibilidadId: string) => {
    if (!user?.profesional) return;
    
    try {
      await api.profesionales.eliminarDisponibilidad(user.profesional.id, disponibilidadId);
      alert('Horario eliminado correctamente');
      loadData();
    } catch (err) {
      console.error('Error:', err);
      alert(err instanceof Error ? err.message : 'Error al eliminar horario');
    }
  };

  const getSemanaActual = () => {
    const dias = [];
    const hoy = new Date();
    for (let i = 0; i < 14; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      dias.push(fecha);
    }
    return dias;
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${baseUrl}/profesional/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user?.profesional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No sos profesional</p>
      </div>
    );
  }

  const hoyTurnos = turnos.filter(t => 
    new Date(t.fechaHora).toDateString() === new Date().toDateString() &&
    t.estado !== 'CANCELADO'
  ).length;

  return (
    <div className="min-h-screen bg-gray-100">
      {recordatorios.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="font-medium text-blue-800">
                  Tenés {recordatorios.length} turno{recordatorios.length > 1 ? 's' : ''} en las próximas 24 horas
                </p>
                {recordatorios.map((rec: any) => (
                  <p key={rec.id} className="text-sm text-blue-700">
                    {new Date(rec.fechaHora).toLocaleDateString('es-AR')} às {new Date(rec.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - {rec.paciente?.nombre} {rec.paciente?.apellido}
                    {rec.modalidad === 'VIRTUAL' && ' 📹'}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-blue-600">MediSync</h1>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">Panel Profesional</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-gray-600 hover:text-blue-600 text-sm flex items-center gap-1"
              >
                <span>👤</span>
                <span>Mi Perfil</span>
              </button>
              <span className="text-gray-600">
                Dr/a. {user.profesional.nombre} {user.profesional.apellido}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Turnos de Hoy</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{hoyTurnos}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Turnos del Mes</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {turnos.filter(t => {
                const fecha = new Date(t.fechaHora);
                const ahora = new Date();
                return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear() && t.estado !== 'CANCELADO';
              }).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Profesión</h3>
            <p className="text-xl font-bold text-purple-600 mt-2">
              {user.profesional.especialidad?.nombre || 'Sin especialidad'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('calendario')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'calendario'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Calendario
              </button>
              <button
                onClick={() => setActiveTab('disponibilidad')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'disponibilidad'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Disponibilidad
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'stats'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Estadísticas
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'calendario' ? (
              <CalendarioView
                selectedDate={selectedDate ?? new Date()}
                setSelectedDate={setSelectedDate}
                getSemanaActual={getSemanaActual}
                turnosDelDia={turnosDelDia}
                onSelectTurno={setSlotActual}
              />
            ) : activeTab === 'disponibilidad' ? (
              <DisponibilidadView
                disponibilidades={disponibilidades}
                nuevaDisp={nuevaDisp}
                setNuevaDisp={setNuevaDisp}
                onAgregar={handleAgregarDisponibilidad}
                onEliminar={handleEliminarDisponibilidad}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                <StatsPanel stats={stats} />
              </div>
            )}
          </div>
        </div>
      </main>

      {slotActual && (
        <TurnoModal turno={slotActual} onClose={() => setSlotActual(null)} onUpdate={loadData} />
      )}

      {showProfileModal && user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userType="profesional"
          user={user}
          onUpdate={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function CalendarioView({
  selectedDate,
  setSelectedDate,
  getSemanaActual,
  turnosDelDia,
  onSelectTurno,
}: {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  getSemanaActual: () => Date[];
  turnosDelDia: Turno[];
  onSelectTurno: (turno: Turno) => void;
}) {
  const hoy = typeof window !== 'undefined' ? new Date().toDateString() : '';
  
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-6">
        {getSemanaActual().map((fecha) => {
          const isSelected = selectedDate ? fecha.toDateString() === selectedDate.toDateString() : false;
          const isToday = fecha.toDateString() === hoy;
          return (
            <button
              key={fecha.toISOString()}
              onClick={() => setSelectedDate(fecha)}
              className={`p-3 rounded-lg text-center min-w-[70px] ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isToday
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="text-xs">{DIAS_SEMANA[fecha.getDay()].slice(0, 3)}</div>
              <div className="font-bold">{fecha.getDate()}</div>
            </button>
          );
        })}
      </div>

      <h3 className="text-lg font-semibold mb-4">
        {selectedDate ? `Turnos del ${selectedDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Seleccioná un día'}
      </h3>

      {turnosDelDia.length === 0 ? (
        <p className="text-gray-500">No hay turnos para este día.</p>
      ) : (
        <div className="space-y-3">
          {turnosDelDia
            .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
            .map((turno) => (
              <div
                key={turno.id}
                onClick={() => onSelectTurno(turno)}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <div className="text-lg font-bold text-gray-700">
                  {new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : 'Paciente sin cuenta'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {turno.modalidad === 'VIRTUAL' ? '📹 Virtual' : '🏥 Presencial'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  turno.estado === 'CONFIRMADO' ? 'bg-green-100 text-green-700' :
                  turno.estado === 'RESERVADO' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {turno.estado}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function DisponibilidadView({
  disponibilidades,
  nuevaDisp,
  setNuevaDisp,
  onAgregar,
  onEliminar,
}: {
  disponibilidades: Disponibilidad[];
  nuevaDisp: { diaSemana: number; horaInicio: string; horaFin: string; modalidad: 'PRESENCIAL' | 'VIRTUAL' };
  setNuevaDisp: (disp: any) => void;
  onAgregar: () => void;
  onEliminar: (disponibilidadId: string) => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Horarios de Atención</h3>

      {disponibilidades.length === 0 ? (
        <p className="text-gray-500 mb-6">No hay horarios configurados.</p>
      ) : (
        <div className="mb-6 space-y-2">
          {disponibilidades.map((disp) => (
            <div key={disp.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <span className="font-medium w-24">{DIAS_SEMANA[disp.diaSemana]}</span>
              <span className="text-gray-600">
                {disp.horaInicio} - {disp.horaFin}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                disp.modalidad === 'VIRTUAL' ? 'bg-blue-100 text-blue-700' :
                disp.modalidad === 'PRESENCIAL' ? 'bg-green-100 text-green-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {disp.modalidad}
              </span>
              <button
                onClick={() => {
                  if (confirm('¿Eliminar este horario?')) {
                    onEliminar(disp.id);
                  }
                }}
                className="ml-auto text-red-500 hover:text-red-700 p-1"
                title="Eliminar horario"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      <h4 className="font-medium mb-3">Agregar nuevo horario</h4>
      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Día</label>
          <select
            value={nuevaDisp.diaSemana}
            onChange={(e) => setNuevaDisp({ ...nuevaDisp, diaSemana: parseInt(e.target.value) })}
            className="px-3 py-2 border rounded-md"
          >
            {DIAS_SEMANA.map((dia, i) => (
              <option key={i} value={i}>{dia}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Desde</label>
          <input
            type="time"
            value={nuevaDisp.horaInicio}
            onChange={(e) => setNuevaDisp({ ...nuevaDisp, horaInicio: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Hasta</label>
          <input
            type="time"
            value={nuevaDisp.horaFin}
            onChange={(e) => setNuevaDisp({ ...nuevaDisp, horaFin: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Modalidad</label>
          <select
            value={nuevaDisp.modalidad}
            onChange={(e) => setNuevaDisp({ ...nuevaDisp, modalidad: e.target.value as any })}
            className="px-3 py-2 border rounded-md"
          >
            <option value="PRESENCIAL">Presencial</option>
            <option value="VIRTUAL">Virtual</option>
          </select>
        </div>
        <button
          onClick={onAgregar}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

type Archivo = {
  id: string;
  url: string;
  nombreOriginal: string;
  tipo: string;
  tamanoBytes: number;
  mimeType: string;
};

function TurnoModal({ turno, onClose, onUpdate }: { turno: Turno; onClose: () => void; onUpdate: () => void }) {
  const [evolucion, setEvolucion] = useState<Evolucion | null>(null);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [loadingEvolucion, setLoadingEvolucion] = useState(true);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState('OTRO');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    loadEvolucion();
    loadArchivos();
  }, [turno.id]);

  const loadEvolucion = async () => {
    try {
      const data = await fetch(`${API_URL}/turnos/${turno.id}/evolucion`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).then(res => res.json());
      if (data.success && data.data) {
        setEvolucion(data.data);
        setNotas(data.data.contenido || '');
      }
    } catch (err) {
      console.error('Error loading evolucion:', err);
    } finally {
      setLoadingEvolucion(false);
    }
  };

  const loadArchivos = async () => {
    try {
      const res = await fetch(`${API_URL}/archivos/turno/${turno.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setArchivos(data.data || []);
      }
    } catch (err) {
      console.error('Error loading archivos:', err);
    }
  };

  const handleGuardarNotas = async () => {
    setGuardando(true);
    try {
      await fetch(`${API_URL}/turnos/${turno.id}/evolucion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ contenido: notas }),
      });
      alert('Notas guardadas correctamente');
      onUpdate();
    } catch (err) {
      console.error('Error guardando:', err);
      alert('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', fileType);

    try {
      const res = await fetch(`${API_URL}/archivos/${turno.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert('Archivo subido correctamente');
        loadArchivos();
      } else {
        alert(data.error?.message || 'Error al subir archivo');
      }
    } catch (err) {
      console.error('Error uploading:', err);
      alert('Error al subir archivo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteArchivo = async (id: string) => {
    if (!confirm('¿Eliminar este archivo?')) return;

    try {
      const res = await fetch(`${API_URL}/archivos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        loadArchivos();
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleActualizarEstado = async (nuevoEstado: string) => {
    if (!confirm(`¿Marcar este turno como ${nuevoEstado.toLowerCase()}?`)) return;

    try {
      const res = await fetch(`${API_URL}/turnos/${turno.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Turno marcado como ${nuevoEstado.toLowerCase()}`);
        onUpdate();
        onClose();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al actualizar estado');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold">Detalle del Turno</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Fecha y Hora</p>
            <p className="font-medium">
              {new Date(turno.fechaHora).toLocaleDateString('es-AR')} às{' '}
              {new Date(turno.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Modalidad</p>
            <p className="font-medium">
              {turno.modalidad === 'VIRTUAL' ? '📹 Virtual' : '🏥 Presencial'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Paciente</p>
            <p className="font-medium">
              {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : 'Sin cuenta'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contacto</p>
            <p className="font-medium">{turno.paciente?.telefono || '-'}</p>
          </div>
          {turno.modalidad === 'VIRTUAL' && turno.linkVideollamada && (
            <div>
              <p className="text-sm text-gray-500">Link de Videollamada</p>
              <a href={turno.linkVideollamada} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                {turno.linkVideollamada}
              </a>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              turno.estado === 'CONFIRMADO' ? 'bg-green-100 text-green-700' :
              turno.estado === 'RESERVADO' ? 'bg-yellow-100 text-yellow-700' :
              turno.estado === 'COMPLETADO' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {turno.estado}
            </span>
          </div>
        </div>

        <div className="border-t pt-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">📋 Evolución Clínica</h4>
          
          {loadingEvolucion ? (
            <p className="text-gray-500">Cargando...</p>
          ) : (
            <div>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Escribí las notas de la consulta, diagnóstico, tratamiento..."
                className="w-full h-32 p-3 border rounded-lg resize-none text-sm"
              />
              <button
                onClick={handleGuardarNotas}
                disabled={guardando}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {guardando ? 'Guardando...' : 'Guardar Notas'}
              </button>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">📎 Archivos</h4>
          
          <div className="flex gap-2 mb-4">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="LABORATORIO">Laboratorio</option>
              <option value="IMAGEN">Imagen</option>
              <option value="EVOLUCION">Evolución</option>
              <option value="OTRO">Otro</option>
            </select>
            <label className="flex-1">
              <input
                type="file"
                onChange={handleUpload}
                disabled={uploading}
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                className="hidden"
              />
              <span className={`inline-block w-full px-4 py-2 text-center border rounded-md cursor-pointer text-sm ${
                uploading ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 hover:bg-gray-100'
              }`}>
                {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
              </span>
            </label>
          </div>

          {archivos.length > 0 ? (
            <div className="space-y-2">
              {archivos.map((archivo) => (
                <div key={archivo.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                  <span className="text-2xl">
                    {archivo.mimeType.includes('pdf') ? '📄' : '🖼️'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{archivo.nombreOriginal}</p>
                    <p className="text-xs text-gray-500">
                      {archivo.tipo} • {formatFileSize(archivo.tamanoBytes)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteArchivo(archivo.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No hay archivos adjuntos</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t flex gap-3">
          {turno.estado !== 'COMPLETADO' && (
            <button 
              onClick={() => handleActualizarEstado('COMPLETADO')}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Marcar Completado
            </button>
          )}
          {turno.estado !== 'CANCELADO' && (
            <button 
              onClick={() => handleActualizarEstado('CANCELADO')}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Cancelar Turno
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
