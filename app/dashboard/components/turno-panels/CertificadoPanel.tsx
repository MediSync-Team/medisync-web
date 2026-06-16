'use client';

import { useState } from 'react';
import { Turno, CertificadoConDatos, TipoCertificado } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { formatClinicInstantDate, getLocale } from '../../../lib/date';
import { imprimirCertificado } from '../../../lib/certificado-pdf';
import { ClipboardIcon } from '../../../components/icons';
import { Notice } from '../../../lib/ui-notice';
import EmitirCertificadoModal from '../EmitirCertificadoModal';
import { useCertificadoPanel } from './useCertificadoPanel';

interface CertificadoPanelProps {
  turno: Turno;
  translateSpecialty: (name?: string) => string;
  onNotice: (notice: Notice) => void;
}

/**
 * Certificado médico (extracted from TurnoModal). Renders only for COMPLETADO
 * turnos; owns both the inline card and the emit/edit modal it opens.
 */
export default function CertificadoPanel({ turno, translateSpecialty, onNotice }: CertificadoPanelProps) {
  const { t, lang } = useLang();
  const modal = t('dashboard').turnoModal;
  const [showEmitir, setShowEmitir] = useState(false);
  const { certificado, loading, saving, form, setForm, emit } = useCertificadoPanel(turno.id);

  if (turno.estado !== 'COMPLETADO') return null;

  const certificateTypeLabel = (tipo: TipoCertificado) => {
    if (tipo === 'REPOSO') return modal.certificate.types.REPOSO;
    if (tipo === 'CONSULTA') return modal.certificate.types.CONSULTA;
    if (tipo === 'APTITUD') return modal.certificate.types.APTITUD;
    return modal.certificate.types.LIBRE;
  };

  const handleSave = async () => {
    if (form.diagnostico.trim().length < 5 || form.texto.trim().length < 5) {
      onNotice({ type: 'error', text: modal.notices.completeCertificate });
      return;
    }
    if (form.tipo === 'REPOSO' && form.diasReposo <= 0) {
      onNotice({ type: 'error', text: modal.notices.restDaysRequired });
      return;
    }

    const res = await emit({
      turnoId: turno.id,
      tipo: form.tipo,
      diagnostico: form.diagnostico.trim(),
      texto: form.texto.trim(),
      diasReposo: form.tipo === 'REPOSO' ? form.diasReposo : undefined,
    });

    if (!res.ok) {
      onNotice({ type: 'error', text: res.message ?? modal.notices.certificateError });
      return;
    }

    setShowEmitir(false);
    onNotice({ type: 'success', text: modal.notices.certificateSaved });
    if (turno.profesional && turno.paciente) {
      imprimirCertificado({
        ...res.response,
        turno: {
          fechaHora: turno.fechaHora,
          modalidad: turno.modalidad,
          profesional: {
            nombre: turno.profesional.nombre,
            apellido: turno.profesional.apellido,
            matricula: turno.profesional.matricula ?? null,
            fotoUrl: turno.profesional.fotoUrl ?? null,
            lugarAtencion: turno.lugarAtencion ?? turno.profesional.lugarAtencion ?? null,
            telefono: turno.profesional.telefono ?? '',
            especialidad: { nombre: translateSpecialty(turno.profesional.especialidad?.nombre ?? '') },
          },
          paciente: turno.paciente
            ? {
                nombre: turno.paciente.nombre,
                apellido: turno.paciente.apellido,
                email: turno.paciente.email,
                dni: turno.paciente.dni ?? null,
                fechaNacimiento: turno.paciente.fechaNacimiento ?? null,
                obraSocial: turno.paciente.obraSocial ?? null,
              }
            : null,
        },
      } as CertificadoConDatos, lang);
    }
  };

  return (
    <>
      <div className="border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardIcon size={15} className="text-slate-400" />
          <h4 className="font-semibold text-slate-700 text-sm">{modal.certificate.title}</h4>
          {certificado?.emitidaAt && (
            <span className="badge badge-blue ml-auto text-xs">
              {modal.certificate.emitted} {formatClinicInstantDate(certificado.emitidaAt, getLocale(lang))}
            </span>
          )}
        </div>

        {loading ? (
          <div className="skeleton h-24 rounded-lg" />
        ) : certificado ? (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{modal.certificate.type}</p>
              <p className="font-semibold text-slate-700">
                {certificateTypeLabel(certificado.tipo)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => imprimirCertificado({
                  ...certificado,
                  turno: {
                    fechaHora: turno.fechaHora,
                    modalidad: turno.modalidad,
                    profesional: {
                      nombre: turno.profesional!.nombre,
                      apellido: turno.profesional!.apellido,
                      matricula: turno.profesional!.matricula ?? null,
                      fotoUrl: turno.profesional!.fotoUrl ?? null,
                      lugarAtencion: turno.profesional!.lugarAtencion ?? null,
                      telefono: turno.profesional!.telefono ?? '',
                      especialidad: { nombre: translateSpecialty(turno.profesional!.especialidad?.nombre ?? '') },
                    },
                    paciente: turno.paciente
                      ? {
                          nombre: turno.paciente.nombre,
                          apellido: turno.paciente.apellido,
                          email: turno.paciente.email,
                          dni: turno.paciente.dni ?? null,
                          fechaNacimiento: turno.paciente.fechaNacimiento ?? null,
                          obraSocial: turno.paciente.obraSocial ?? null,
                        }
                      : null,
                  },
                }, lang)}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {modal.certificate.printPdf}
              </button>
              <button
                onClick={() => { setShowEmitir(true); setForm({ tipo: certificado.tipo, diagnostico: certificado.diagnostico, texto: certificado.texto, diasReposo: certificado.diasReposo || 0 }); }}
                className="btn btn-secondary btn-sm"
              >
                {modal.certificate.edit}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowEmitir(true)}
            className="btn btn-primary btn-sm"
          >
            {modal.certificate.issue}
          </button>
        )}
      </div>

      {showEmitir && (
        <EmitirCertificadoModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          loading={saving}
          onClose={() => setShowEmitir(false)}
          translateSpecialty={translateSpecialty}
        />
      )}
    </>
  );
}
