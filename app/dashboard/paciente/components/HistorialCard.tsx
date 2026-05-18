'use client';

import { useState } from 'react';
import { api, HistorialTurno, CertificadoConDatos } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { getLocale } from '../../../lib/date';
import { imprimirReceta } from '../../../lib/receta-pdf';
import { imprimirCertificado } from '../../../lib/certificado-pdf';
import { BuildingIcon, CalendarIcon, UserIcon, VideoIcon } from '../../../components/icons';

function StarDisplay({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="1.5">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

export default function HistorialCard({
  item,
  onCalificar,
  d,
  m,
  s,
  translateSpecialty,
}: {
  item: HistorialTurno;
  onCalificar: (turno: HistorialTurno) => void;
  d: any;
  m: any;
  s: any;
  translateSpecialty: (name?: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLang();
  const locale = getLocale(lang);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header bar */}
      <div className="px-4 py-2 bg-blue-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
          <CalendarIcon size={13} />
          {new Date(item.fechaHora).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
          <span className="text-blue-500 font-normal text-xs">
            {new Date(item.fechaHora).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <span className="badge badge-green text-[10px]">{(s as any)[item.estado] || item.estado}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Profesional info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
            {item.profesional?.fotoUrl
              ? <img src={item.profesional.fotoUrl} alt="" className="w-full h-full object-cover" />
              : <UserIcon size={16} className="text-blue-500" />}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              Dr/a. {item.profesional?.nombre} {item.profesional?.apellido}
            </p>
            <p className="text-xs text-blue-600">{translateSpecialty(item.profesional?.especialidad?.nombre)}</p>
          </div>
          <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
            {item.modalidad === 'VIRTUAL'
              ? <><VideoIcon size={11} /> {m.VIRTUAL}</>
              : <><BuildingIcon size={11} /> {m.PRESENCIAL}</>}
          </span>
        </div>

        {/* {d.clinicalEvolution} */}
        {item.evolucion?.contenido && (
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{d.clinicalEvolution}</p>
            <p className={`text-slate-700 leading-relaxed whitespace-pre-wrap ${!expanded && 'line-clamp-3'}`}>
              {item.evolucion.contenido}
            </p>
            {item.evolucion.contenido.length > 200 && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline mt-1">
                {expanded ? 'Ver menos' : 'Ver más'}
              </button>
            )}
          </div>
        )}

        {/* Receta / indicaciones */}
        {item.recetaIndicacion && (
          <div className="border border-emerald-200 rounded-lg p-3 text-sm bg-emerald-50">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Receta e indicaciones</p>
              {item.profesional && (
                <button
                  onClick={() => imprimirReceta({
                    receta: item.recetaIndicacion!,
                    profesional: {
                      nombre: item.profesional!.nombre ?? '',
                      apellido: item.profesional!.apellido ?? '',
                      especialidad: translateSpecialty(item.profesional!.especialidad?.nombre ?? ''),
                      matricula: item.profesional!.matricula ?? undefined,
                      lugarAtencion: item.lugarAtencion ?? item.profesional!.lugarAtencion ?? undefined,
                      telefono: item.profesional!.telefono ?? undefined,
                      fotoUrl: item.profesional!.fotoUrl ?? undefined,
                    },
                    paciente: null,
                    fechaHora: item.fechaHora,
                    modalidad: item.modalidad,
                  })}
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Descargar PDF
                </button>
              )}
            </div>
            <p className="text-slate-700 font-medium">{item.recetaIndicacion.diagnostico}</p>
            {item.recetaIndicacion.medicamentos && (
              <p className="text-xs text-slate-600 mt-1">
                <span className="font-semibold">Medicamentos:</span> {item.recetaIndicacion.medicamentos}
              </p>
            )}
            {item.recetaIndicacion.proximoControl && (
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-semibold">Próximo control:</span> {item.recetaIndicacion.proximoControl}
              </p>
            )}
          </div>
        )}

        {/* Certificado médico */}
        {item.certificado && (
          <div className="border border-blue-200 rounded-lg p-3 text-sm bg-blue-50">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Certificado médico</p>
              <button
                onClick={async () => {
                  try {
                    const certData = await api.certificados.getByTurno(item.id);
                    imprimirCertificado({
                      ...certData,
                      turno: {
                        fechaHora: item.fechaHora,
                        modalidad: item.modalidad,
                        profesional: {
                          nombre: item.profesional?.nombre ?? '',
                          apellido: item.profesional?.apellido ?? '',
                          matricula: item.profesional?.matricula ?? undefined,
                          fotoUrl: item.profesional?.fotoUrl ?? undefined,
                          lugarAtencion: item.lugarAtencion ?? item.profesional?.lugarAtencion ?? undefined,
                          telefono: item.profesional?.telefono ?? undefined,
                          especialidad: { nombre: translateSpecialty(item.profesional?.especialidad?.nombre ?? '') },
                        },
                        paciente: null,
                      },
                    } as unknown as CertificadoConDatos);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-semibold"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar PDF
              </button>
            </div>
            <p className="text-slate-700 font-medium">
              {item.certificado.tipo === 'REPOSO' ? 'Reposo Médico'
                : item.certificado.tipo === 'CONSULTA' ? 'Justificación de Consulta'
                : item.certificado.tipo === 'APTITUD' ? 'Aptitud Física'
                : 'Certificado Médico'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Emitido el {new Date(item.certificado.emitidaAt ?? item.fechaHora).toLocaleDateString(locale)}
            </p>
          </div>
        )}

        {/* Archivos adjuntos */}
        {(item.archivos ?? []).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Documentos adjuntos</p>
            <div className="flex flex-wrap gap-2">
              {(item.archivos ?? []).map(archivo => (
                <a
                  key={archivo.id}
                  href={archivo.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs text-slate-700 hover:text-blue-700 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {archivo.nombreOriginal}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!item.evolucion && !item.recetaIndicacion && (item.archivos ?? []).length === 0 && (
          <p className="text-xs text-slate-400 italic">{d.noClinicalEvolution}</p>
        )}

        {/* Calificación */}
        {item.resena ? (
          <div className="border border-amber-200 rounded-lg p-3 bg-amber-50 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Tu calificación</p>
              <div className="flex items-center gap-1.5">
                <StarDisplay rating={item.resena.rating} size={13} />
                <span className="text-xs font-bold text-amber-700">{item.resena.rating}/5</span>
              </div>
            </div>
            {item.resena.comentario && (
              <p className="text-xs text-slate-600 italic">"{item.resena.comentario}"</p>
            )}
            {item.resena.respuesta && (
              <div className="mt-2 pt-2 border-t border-amber-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">
                  Respuesta de Dr/a. {item.profesional?.nombre} {item.profesional?.apellido}
                  {item.resena.respondidaAt && (
                    <span className="font-normal text-slate-400 ml-1">
                      · {new Date(item.resena.respondidaAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">{item.resena.respuesta}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={() => onCalificar(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              {d.rateConsultation}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
