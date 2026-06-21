'use client';

import { CertificadoPaciente } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { imprimirCertificado } from '../../../lib/certificado-pdf';
import CertificadoCard from './CertificadoCard';
import CardListSkeleton from './CardListSkeleton';
import { ClipboardIcon } from '../../../components/icons';

export interface CertificadoViewPaciente {
  nombre: string;
  apellido: string;
  email: string;
  dni?: string | null;
  fechaNacimiento?: string | null;
  obraSocial?: string | null;
}

interface CertificadosViewProps {
  certificados: CertificadoPaciente[];
  loading: boolean;
  paciente: CertificadoViewPaciente | null;
}

/** "Certificados" tab body (extracted from the paciente dashboard page). */
export default function CertificadosView({ certificados, loading, paciente }: CertificadosViewProps) {
  const { t, lang } = useLang();
  const p = t('paciente');

  if (loading) return <CardListSkeleton />;

  if (certificados.length === 0) {
    return (
      <div className="py-12 text-center">
        <ClipboardIcon size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{p.noCertificates}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {certificados.map((cert) => (
        <CertificadoCard
          key={cert.turnoId}
          certificado={cert}
          onDescargar={() => {
            imprimirCertificado({
              id: cert.certificado.id,
              turnoId: cert.certificado.turnoId,
              tipo: cert.certificado.tipo,
              diagnostico: cert.certificado.diagnostico,
              texto: cert.certificado.texto,
              diasReposo: cert.certificado.diasReposo,
              emitidaAt: cert.certificado.emitidaAt,
              createdAt: cert.certificado.createdAt,
              turno: {
                fechaHora: cert.fechaHora,
                modalidad: 'VIRTUAL',
                profesional: {
                  nombre: cert.profesional.nombre,
                  apellido: cert.profesional.apellido,
                  matricula: null,
                  fotoUrl: null,
                  lugarAtencion: null,
                  telefono: '',
                  especialidad: { nombre: '' },
                },
                paciente: paciente ? {
                  nombre: paciente.nombre,
                  apellido: paciente.apellido,
                  email: paciente.email,
                  dni: paciente.dni || null,
                  fechaNacimiento: paciente.fechaNacimiento || null,
                  obraSocial: paciente.obraSocial || null,
                } : null,
              },
            }, lang);
          }}
        />
      ))}
    </div>
  );
}
