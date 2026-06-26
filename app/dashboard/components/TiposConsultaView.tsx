'use client';

import { useEffect, useState } from 'react';
import { useLang } from '../../lib/i18n/context';
import { api, TipoConsulta } from '../../lib/api';
import { ClockIcon, TrashIcon } from '../../components/icons';

const DURACIONES = [15, 20, 30, 45, 60, 90];

export default function TiposConsultaView({ profesionalId }: { profesionalId: string }) {
  const { t } = useLang();
  const common = t('common');

  const [tipos, setTipos] = useState<TipoConsulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState({ nombre: '', duracionMin: 30, precio: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.profesionales.getTiposConsulta(profesionalId);
      setTipos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [profesionalId]);

  const handleAgregar = async () => {
    setError('');
    if (!nuevo.nombre.trim()) { setError('El nombre es requerido'); return; }
    setSaving(true);
    try {
      await api.profesionales.crearTipoConsulta(profesionalId, {
        nombre: nuevo.nombre.trim(),
        duracionMin: nuevo.duracionMin,
        precio: nuevo.precio === '' ? null : Number(nuevo.precio),
      });
      setNuevo({ nombre: '', duracionMin: 30, precio: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el tipo de consulta');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    setEliminandoId(id);
    try {
      await api.profesionales.eliminarTipoConsulta(profesionalId, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el tipo de consulta');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="space-y-6 border-t border-slate-200 dark:border-slate-700 pt-6">
      <div>
        <h3 className="section-title mb-1">Tipos de consulta</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Definí consultas de distinta duración. El paciente elige el tipo al reservar y el turno toma esa duración.
        </p>

        {loading ? (
          <div className="py-6 flex justify-center text-slate-400 dark:text-slate-500 text-sm">{common.loading}</div>
        ) : tipos.length === 0 ? (
          <div className="py-8 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <ClockIcon size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{common.noResults}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tipos.map((tipo) => (
              <div key={tipo.id} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{tipo.nombre}</p>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-sm">
                  <ClockIcon size={13} className="text-slate-400 dark:text-slate-500" />
                  {tipo.duracionMin} min
                </span>
                {tipo.precio != null && tipo.precio > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">${Number(tipo.precio).toLocaleString()}</span>
                )}
                <button
                  onClick={() => handleEliminar(tipo.id)}
                  disabled={eliminandoId === tipo.id}
                  className={`ml-auto btn btn-ghost p-1.5 ${eliminandoId === tipo.id ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-red-400 hover:text-red-600 dark:hover:text-red-300'}`}
                  title={common.delete}
                >
                  <TrashIcon size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Agregar tipo de consulta</h4>
        {error && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="field-label">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Primera vez"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Duración</label>
            <select
              value={nuevo.duracionMin}
              onChange={(e) => setNuevo({ ...nuevo, duracionMin: parseInt(e.target.value) })}
              className="field-select"
            >
              {DURACIONES.map((min) => <option key={min} value={min}>{min} min</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Precio <span className="text-slate-400 dark:text-slate-500 font-normal">- opcional</span></label>
            <input
              type="number"
              min={0}
              placeholder="—"
              value={nuevo.precio}
              onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
        <button onClick={handleAgregar} disabled={saving} className="btn btn-primary mt-4">
          {saving ? common.loading : '+ Agregar tipo de consulta'}
        </button>
      </div>
    </div>
  );
}
