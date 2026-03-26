'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api, Turno } from '../../lib/api';

export default function PacienteDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proximos' | 'pasados'>('proximos');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.paciente) {
        loadTurnos();
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const loadTurnos = async () => {
    try {
      const data = await api.turnos.misTurnos();
      setTurnos(data);
    } catch (err) {
      console.error('Error loading turnos:', err);
    } finally {
      setLoading(false);
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
                      <div className="mt-4 pt-4 border-t flex gap-3">
                        <Link 
                          href={`/profesional/${turno.profesional?.id}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                        >
                          Ver profesional
                        </Link>
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-sm">
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
    </div>
  );
}
