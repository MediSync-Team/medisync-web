'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Especialidad, Profesional } from './lib/api';

export default function HomePage() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [espData, profData] = await Promise.all([
        api.especialidades.getAll(),
        api.profesionales.getAll(),
      ]);
      setEspecialidades(espData);
      setProfesionales(profData.profesionales);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.especialidad = search;
      if (selectedEspecialidad) params.especialidad = selectedEspecialidad;
      
      const data = await api.profesionales.getAll(params);
      setProfesionales(data.profesionales);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">MediSync</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Iniciar sesión
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Registrate
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="bg-blue-600 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Encontrá a tu especialista y reservá al instante
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Conectá con profesionales de la salud cerca de vos
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Buscar por especialidad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <select
                value={selectedEspecialidad}
                onChange={(e) => setSelectedEspecialidad(e.target.value)}
                className="px-4 py-3 rounded-lg text-gray-900"
              >
                <option value="">Todas las especialidades</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.nombre}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium"
              >
                Buscar
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Profesionales Disponibles
          </h2>
          
          {loading ? (
            <p className="text-gray-500">Cargando...</p>
          ) : profesionales.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">
                No hay profesionales disponibles en este momento.
              </p>
              <p className="text-gray-400">
                Sé el primero en registrarte como profesional.
              </p>
              <Link 
                href="/register" 
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Registrarme como profesional
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profesionales.map((prof) => (
                <div key={prof.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                      👨‍⚕️
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {prof.nombre} {prof.apellido}
                      </h3>
                      <p className="text-blue-600 text-sm">
                        {prof.especialidad?.nombre}
                      </p>
                      {prof.precioConsulta > 0 && (
                        <p className="text-green-600 font-medium mt-1">
                          ${Number(prof.precioConsulta).toLocaleString('es-AR')}
                        </p>
                      )}
                    </div>
                  </div>
                  {prof.lugarAtencion && (
                    <p className="text-gray-500 text-sm mt-3">
                      📍 {prof.lugarAtencion}
                    </p>
                  )}
                  <Link
                    href={`/profesional/${prof.id}`}
                    className="block mt-4 text-center py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                  >
                    Ver perfil y reservar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
