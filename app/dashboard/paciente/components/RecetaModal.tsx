'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../../lib/i18n/context';
import { api, Turno, RecetaIndicacion } from '../../../lib/api';
import { formatClinicInstantDateTime, getLocale } from '../../../lib/date';
import { useTranslateSpecialty } from '../../../lib/i18n/use-translate-specialty';
import { imprimirReceta } from '../../../lib/receta-pdf';
import { InfoIcon, XIcon } from '../../../components/icons';

export default function RecetaModal({ turno, onClose }: { turno: Turno; onClose: () => void }) {
  const { t, lang } = useLang();
  const d = t("dashboard");
  const translateSpecialty = useTranslateSpecialty();
  const [loading, setLoading] = useState(true);
  const [receta, setReceta] = useState<RecetaIndicacion | null>(null);

  useEffect(() => {
    const loadReceta = async () => {
      setLoading(true);
      try {
        const data = await api.turnos.getReceta(turno.id);
        setReceta(data);
      } catch (err) {
        console.error(err);
        setReceta(null);
      } finally {
        setLoading(false);
      }
    };

    loadReceta();
  }, [turno.id]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Receta e indicaciones</h3>
          <button aria-label="Cerrar modal" onClick={onClose} className="btn btn-ghost p-2 text-slate-400"><XIcon size={16} /></button>
        </div>

        <div className="px-6 py-5">
          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-20 rounded-lg" />
              <div className="skeleton h-20 rounded-lg" />
            </div>
          ) : !receta ? (
            <div className="alert alert-warning text-sm">
              <InfoIcon size={14} className="shrink-0" />
              <span>Aun no hay receta/indicaciones emitidas para este turno.</span>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-xs text-slate-500">Emitida: {formatClinicInstantDateTime(receta.emitidaAt ?? receta.createdAt, getLocale(lang))}</p>
              <div>
                <p className="font-semibold text-slate-700">Diagnostico</p>
                <p className="text-slate-600 whitespace-pre-wrap">{receta.diagnostico}</p>
              </div>
              {receta.planTratamiento && (
                <div>
                  <p className="font-semibold text-slate-700">Plan de tratamiento</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.planTratamiento}</p>
                </div>
              )}
              {receta.medicamentos && (
                <div>
                  <p className="font-semibold text-slate-700">Medicamentos</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.medicamentos}</p>
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-700">Indicaciones</p>
                <p className="text-slate-600 whitespace-pre-wrap">{receta.indicaciones}</p>
              </div>
              {receta.estudiosSolicitados && (
                <div>
                  <p className="font-semibold text-slate-700">Estudios solicitados</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.estudiosSolicitados}</p>
                </div>
              )}
              {receta.proximoControl && (
                <div>
                  <p className="font-semibold text-slate-700">Proximo control</p>
                  <p className="text-slate-600">{receta.proximoControl}</p>
                </div>
              )}
              {receta.advertencias && (
                <div>
                  <p className="font-semibold text-slate-700">Advertencias</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.advertencias}</p>
                </div>
              )}
              {receta.observaciones && (
                <div>
                  <p className="font-semibold text-slate-700">Observaciones</p>
                  <p className="text-slate-600 whitespace-pre-wrap">{receta.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          {receta && turno.profesional && (
            <button
              onClick={() => imprimirReceta({
                receta,
                profesional: {
                  nombre: turno.profesional!.nombre,
                  apellido: turno.profesional!.apellido,
                  especialidad: translateSpecialty(turno.profesional!.especialidad?.nombre ?? ''),
                  matricula: turno.profesional!.matricula ?? undefined,
                  lugarAtencion: turno.lugarAtencion ?? turno.profesional!.lugarAtencion ?? undefined,
                  telefono: turno.profesional!.telefono ?? undefined,
                  fotoUrl: turno.profesional!.fotoUrl ?? undefined,
                },
                paciente: turno.paciente
                  ? { nombre: turno.paciente.nombre, apellido: turno.paciente.apellido, email: turno.paciente.email }
                  : null,
                fechaHora: turno.fechaHora,
                modalidad: turno.modalidad,
              })}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar PDF
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary flex-1">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
