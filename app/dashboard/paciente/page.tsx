'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api, Turno } from '../../lib/api';
import ProfileModal from '../../components/ProfileModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function PacienteDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proximos' | 'pasados'>('proximos');
  const [recordatorios, setRecordatorios] = useState<any[]>([]);
  const [pagosPendientes, setPagosPendientes] = useState<Record<string, { necesitaPago: boolean; initPoint?: string }>>({});
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.paciente) {
        loadTurnos();
        loadRecordatorios();
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const loadTurnos = async () => {
    try {
      const data = await api.turnos.misTurnos();
      setTurnos(data);
      loadPagosInfo(data);
    } catch (err) {
      console.error('Error loading turnos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPagosInfo = async (turnosData: Turno[]) => {
    const token = localStorage.getItem('token');
    const pagos: Record<string, any> = {};
    
    for (const turno of turnosData) {
      if (turno.estado === 'RESERVADO' && Number(turno.profesional?.precioConsulta) > 0) {
        try {
          const res = await fetch(`${API_URL}/pagos/estado/${turno.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            pagos[turno.id] = data.data;
          }
        } catch (err) {
          console.error('Error loading pago:', err);
        }
      }
    }
    setPagosPendientes(pagos);
  };

  const loadRecordatorios = async () => {
    try {
      const data = await api.recordatorios.getPaciente();
      setRecordatorios(data.turnos || []);
    } catch (err) {
      console.error('Error loading recordatorios:', err);
    }
  };

  const handlePagar = async (turnoId: string) => {
    router.push(`/pago?turno=${turnoId}`);
  };

  const handleCancelar = async (turnoId: string) => {
    if (!confirm('¿Estás seguro de que querés cancelar este turno?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/turnos/${turnoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: 'CANCELADO' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Turno cancelado');
        loadTurnos();
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al cancelar turno');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (authLoading || !user || !user.paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  const ahora = new Date();
  const proximos = turnos.filter(t => new Date(t.fechaHora) >= ahora && t.estado !== 'CANCELADO');
  const pasados = turnos.filter(t => new Date(t.fechaHora) < ahora || t.estado === 'CANCELADO');

  const turnosMostrar = activeTab === 'proximos' ? proximos : pasados;

  return (
    <div className="min-h-screen bg-gray-100">
      {recordatorios.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔔</span>
              <div>
                <p className="font-medium text-yellow-800">
                  Tenés {recordatorios.length} turno{recordatorios.length > 1 ? 's' : ''} en las próximas 24 horas
                </p>
                {recordatorios.map((rec: any) => (
                  <p key={rec.id} className="text-sm text-yellow-700">
                    📅 {new Date(rec.fechaHora).toLocaleDateString('es-AR')} às {new Date(rec.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} con {rec.profesional?.nombre} {rec.profesional?.apellido}
                    {rec.modalidad === 'VIRTUAL' && ' 📹 Virtual'}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-blue-600">MediSync</h1>
              <span className="text-gray-500">|</span>
              <span className="text-gray-600">Mi Panel</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm">
                Buscar profesionales
              </Link>
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-gray-600 hover:text-blue-600 text-sm flex items-center gap-1"
              >
                <span>👤</span>
                <span>Mi Perfil</span>
              </button>
              <span className="text-gray-600">
                {user.paciente.nombre} {user.paciente.apellido}
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

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('proximos')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'proximos'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Turnos Próximos ({proximos.length})
              </button>
              <button
                onClick={() => setActiveTab('pasados')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'pasados'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Turnos Pasados ({pasados.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {turnosMostrar.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  {activeTab === 'proximos' 
                    ? 'No tenés turnos próximos reservados.' 
                    : 'No tenés turnos anteriores.'}
                </p>
                {activeTab === 'proximos' && (
                  <Link 
                    href="/" 
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Buscar profesional
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {turnosMostrar.map((turno) => (
                  <div key={turno.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-lg">
                          {turno.profesional?.nombre} {turno.profesional?.apellido}
                        </p>
                        <p className="text-blue-600 text-sm">
                          {turno.profesional?.especialidad?.nombre}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        turno.estado === 'CONFIRMADO' ? 'bg-green-100 text-green-700' :
                        turno.estado === 'RESERVADO' ? 'bg-yellow-100 text-yellow-700' :
                        turno.estado === 'CANCELADO' ? 'bg-red-100 text-red-700' :
                        turno.estado === 'COMPLETADO' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {turno.estado}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>📅</span>
                        <span>
                          {new Date(turno.fechaHora).toLocaleDateString('es-AR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🕐</span>
                        <span>
                          {new Date(turno.fechaHora).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{turno.modalidad === 'VIRTUAL' ? '📹' : '🏥'}</span>
                        <span>{turno.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}</span>
                      </div>
                    </div>

                    {turno.modalidad === 'VIRTUAL' && turno.linkVideollamada && (
                      <div className="mt-3">
                        <a 
                          href={turno.linkVideollamada} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                        >
                          Unirse a la videollamada
                        </a>
                      </div>
                    )}

                    {turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO' ? (
                      <div className="mt-4 pt-4 border-t flex flex-wrap gap-3">
                        {turno.profesional?.precioConsulta && Number(turno.profesional.precioConsulta) > 0 && (
                          <button
                            onClick={() => handlePagar(turno.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                          >
                            💳 Pagar ${Number(turno.profesional.precioConsulta).toLocaleString('es-AR')}
                          </button>
                        )}
                        <Link 
                          href={`/profesional/${turno.profesional?.id}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                        >
                          Ver profesional
                        </Link>
                        <button 
                          onClick={() => handleCancelar(turno.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-sm"
                        >
                          Cancelar turno
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showProfileModal && user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userType="paciente"
          user={user}
          onUpdate={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
