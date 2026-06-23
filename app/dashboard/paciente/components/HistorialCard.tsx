'use client';

import { useState } from 'react';
import { api, HistorialTurno, CertificadoConDatos } from '../../../lib/api';
import { Translations } from '../../../lib/i18n/translations';
import { useLang } from '../../../lib/i18n/context';
import { formatClinicInstantDate, formatClinicInstantTime, getLocale } from '../../../lib/date';
// Lazy-load the PDF generators so they ship only when the user actually prints.
const imprimirReceta = (...args: Parameters<typeof import('../../../lib/receta-pdf').imprimirReceta>) =>
  import('../../../lib/receta-pdf').then((m) => m.imprimirReceta(...args));
const imprimirCertificado = (...args: Parameters<typeof import('../../../lib/certificado-pdf').imprimirCertificado>) =>
  import('../../../lib/certificado-pdf').then((m) => m.imprimirCertificado(...args));
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
  d: Translations['dashboard'];
  m: Translations['modality'];
  s: Translations['status'];
  translateSpecialty: (name?: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { t, lang } = useLang();
  const p = t('paciente');
  const locale = getLocale(lang);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header bar */}
      <div className="px-4 py-2 bg-primary/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <CalendarIcon size={13} />
          {formatClinicInstantDate(item.fechaHora, locale, { day: 'numeric', month: 'long', year: 'numeric' })}
          <span className="text-primary/70 font-normal text-xs">
            {formatClinicInstantTime(item.fechaHora, locale)}
          </span>
        </div>
        <span className="badge badge-green text-[10px]">{(s as any)[item.estado] || item.estado}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Profesional info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {item.profesional?.fotoUrl
              ? <img src={item.profesional.fotoUrl} alt="" className="w-full h-full object-cover" />
              : <UserIcon size={16} className="text-primary" />}
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">
              Dr/a. {item.profesional?.nombre} {item.profesional?.apellido}
            </p>
            <p className="text-xs text-primary">{translateSpecialty(item.profesional?.especialidad?.nombre)}</p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            {item.modalidad === 'VIRTUAL'
              ? <><VideoIcon size={11} /> {m.VIRTUAL}</>
              : <><BuildingIcon size={11} /> {m.PRESENCIAL}</>}
          </span>
        </div>

        {/* {d.clinicalEvolution} */}
        {item.evolucion?.contenido && (
          <div className="bg-muted/30 rounded-lg p-3 text-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{d.clinicalEvolution}</p>
            <p className={`text-foreground leading-relaxed whitespace-pre-wrap ${!expanded && 'line-clamp-3'}`}>
              {item.evolucion.contenido}
            </p>
            {item.evolucion.contenido.length > 200 && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline mt-1">
                {expanded ? p.showLess : p.showMore}
              </button>
            )}
          </div>
        )}

        {/* Receta / indicaciones */}
        {item.recetaIndicacion && (
          <div className="border border-success/20 rounded-lg p-3 text-sm bg-success/10">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-success uppercase tracking-wide">{p.prescriptionAndIndications}</p>
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
                  }, lang)}
                  className="flex items-center gap-1 text-xs text-success hover:text-success/80 font-semibold"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {p.downloadPdf}
                </button>
              )}
            </div>
            <p className="text-foreground font-medium">{item.recetaIndicacion.diagnostico}</p>
            {item.recetaIndicacion.medicamentos && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold">{p.medicines}:</span> {item.recetaIndicacion.medicamentos}
              </p>
            )}
            {item.recetaIndicacion.proximoControl && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold">{p.nextControl}:</span> {item.recetaIndicacion.proximoControl}
              </p>
            )}
          </div>
        )}

        {/* Certificado médico */}
        {item.certificado && (
          <div className="border border-primary/20 rounded-lg p-3 text-sm bg-primary/10">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">{p.medicalCertificate}</p>
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
                    } as unknown as CertificadoConDatos, lang);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-semibold"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {p.downloadPdf}
              </button>
            </div>
            <p className="text-foreground font-medium">
              {item.certificado.tipo === 'REPOSO' ? p.certificateTypeRest
                : item.certificado.tipo === 'CONSULTA' ? p.certificateTypeConsultation
                : item.certificado.tipo === 'APTITUD' ? p.certificateTypeFitness
                : p.certificateTypeGeneric}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {p.issuedOn} {formatClinicInstantDate(item.certificado.emitidaAt ?? item.fechaHora, locale)}
            </p>
          </div>
        )}

        {/* Archivos adjuntos */}
        {(item.archivos ?? []).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{p.attachedDocuments}</p>
            <div className="flex flex-wrap gap-2">
              {(item.archivos ?? []).map(archivo => (
                <a
                  key={archivo.id}
                  href={archivo.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted hover:bg-accent border hover:border-primary/30 rounded-lg text-xs text-foreground hover:text-primary transition-colors"
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
          <p className="text-xs text-muted-foreground italic">{d.noClinicalEvolution}</p>
        )}

        {/* Calificación */}
        {item.resena ? (
          <div className="border border-warning/20 rounded-lg p-3 bg-warning/10 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-warning uppercase tracking-wide">{p.yourRating}</p>
              <div className="flex items-center gap-1.5">
                <StarDisplay rating={item.resena.rating} size={13} />
                <span className="text-xs font-bold text-warning">{item.resena.rating}/5</span>
              </div>
            </div>
            {item.resena.comentario && (
              <p className="text-xs text-muted-foreground italic">"{item.resena.comentario}"</p>
            )}
            {item.resena.respuesta && (
              <div className="mt-2 pt-2 border-t border-warning/20">
                <p className="text-xs font-semibold text-primary mb-1">
                  {p.professionalResponse} {item.profesional?.nombre} {item.profesional?.apellido}
                  {item.resena.respondidaAt && (
                    <span className="font-normal text-muted-foreground ml-1">
                      · {new Date(item.resena.respondidaAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </p>
                <p className="text-xs text-foreground leading-relaxed">{item.resena.respuesta}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={() => onCalificar(item)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-warning border border-warning/20 bg-warning/10 hover:bg-warning/20 rounded-lg transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-warning">
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
