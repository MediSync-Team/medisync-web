'use client';

import { RecetaPaciente } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
// Lazy-load the PDF generator so it ships only when the user actually prints.
const imprimirReceta = (...args: Parameters<typeof import('../../../lib/receta-pdf').imprimirReceta>) =>
  import('../../../lib/receta-pdf').then((m) => m.imprimirReceta(...args));
import RecetaCard from './RecetaCard';
import CardListSkeleton from './CardListSkeleton';
import { ClipboardIcon } from '../../../components/icons';

interface RecetasViewProps {
  recetas: RecetaPaciente[];
  loading: boolean;
}

/** "Recetas" tab body (extracted from the paciente dashboard page). */
export default function RecetasView({ recetas, loading }: RecetasViewProps) {
  const { t, lang } = useLang();
  const p = t('paciente');

  if (loading) return <CardListSkeleton />;

  if (recetas.length === 0) {
    return (
      <div className="py-12 text-center">
        <ClipboardIcon size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{p.noRecipes}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recetas.map((receta) => (
        <RecetaCard
          key={receta.turnoId}
          receta={receta}
          onDescargar={() => {
            imprimirReceta({
              receta: {
                id: receta.turnoId,
                turnoId: receta.turnoId,
                diagnostico: receta.receta.diagnostico,
                medicamentos: receta.receta.medicamentos,
                indicaciones: receta.receta.indicaciones,
                planTratamiento: receta.receta.planTratamiento,
                estudiosSolicitados: receta.receta.estudiosSolicitados,
                proximoControl: receta.receta.proximoControl,
                advertencias: receta.receta.advertencias,
                observaciones: receta.receta.observaciones,
                emitidaAt: receta.receta.emitidaAt,
                createdAt: receta.receta.emitidaAt,
                updatedAt: receta.receta.emitidaAt,
              },
              profesional: {
                nombre: receta.profesional.nombre,
                apellido: receta.profesional.apellido,
                especialidad: receta.profesional.especialidad,
                fotoUrl: receta.profesional.fotoUrl || undefined,
              },
              fechaHora: receta.fechaHora,
              modalidad: 'VIRTUAL',
            }, lang);
          }}
        />
      ))}
    </div>
  );
}
