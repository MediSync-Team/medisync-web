'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../../lib/i18n/context';
import { api, Turno, RecetaIndicacion } from '../../../lib/api';
import { formatClinicInstantDateTime, getLocale } from '../../../lib/date';
import { useTranslateSpecialty } from '../../../lib/i18n/use-translate-specialty';
// Lazy-load the PDF generator so it ships only when the user actually prints.
const imprimirReceta = (...args: Parameters<typeof import('../../../lib/receta-pdf').imprimirReceta>) =>
  import('../../../lib/receta-pdf').then((m) => m.imprimirReceta(...args));
import { InfoIcon, XIcon } from '../../../components/icons';
import { useScrollLock } from '../../../hooks/useScrollLock';

export default function RecetaModal({ turno, onClose }: { turno: Turno; onClose: () => void }) {
  useScrollLock();
  const { t, lang } = useLang();
  const p = t('paciente');
  const common = t('common');
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
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-card z-10">
          <h3 className="font-bold text-foreground">{p.prescriptionModalTitle}</h3>
          <button aria-label={p.closeModal} onClick={onClose} className="btn btn-ghost p-2 text-muted-foreground"><XIcon size={16} /></button>
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
              <span>{p.noPrescriptionForAppointment}</span>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">{p.issued}: {formatClinicInstantDateTime(receta.emitidaAt ?? receta.createdAt, getLocale(lang))}</p>
              <div>
                <p className="font-semibold text-foreground">{p.diagnosis}</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{receta.diagnostico}</p>
              </div>
              {receta.planTratamiento && (
                <div>
                  <p className="font-semibold text-foreground">{p.treatmentPlan}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{receta.planTratamiento}</p>
                </div>
              )}
              {receta.medicamentos && (
                <div>
                  <p className="font-semibold text-foreground">{p.medicines}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{receta.medicamentos}</p>
                </div>
              )}
              <div>
                <p className="font-semibold text-foreground">{p.indications}</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{receta.indicaciones}</p>
              </div>
              {receta.estudiosSolicitados && (
                <div>
                  <p className="font-semibold text-foreground">{p.requestedStudies}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{receta.estudiosSolicitados}</p>
                </div>
              )}
              {receta.proximoControl && (
                <div>
                  <p className="font-semibold text-foreground">{p.nextControl}</p>
                  <p className="text-muted-foreground">{receta.proximoControl}</p>
                </div>
              )}
              {receta.advertencias && (
                <div>
                  <p className="font-semibold text-foreground">{p.warnings}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{receta.advertencias}</p>
                </div>
              )}
              {receta.observaciones && (
                <div>
                  <p className="font-semibold text-foreground">{p.observations}</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{receta.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-muted/30 flex gap-3">
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
              }, lang)}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {p.downloadPdf}
            </button>
          )}
          <button onClick={onClose} className="btn btn-secondary flex-1">{common.close}</button>
        </div>
      </div>
    </div>
  );
}
