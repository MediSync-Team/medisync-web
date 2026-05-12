'use client';

import Link from 'next/link';
import { Profesional } from '../lib/api';
import { useLang } from '../lib/i18n/context';
import { getSpecialtyDisplayName } from '../lib/specialty';
import { getLocale } from '../lib/date';
import StarRating from './StarRating';
import { BuildingIcon, VideoIcon, MapPinIcon, StethoscopeIcon } from './icons';

interface ProfCardProps {
  prof: Profesional;
  showDisponible?: boolean;
}

export default function ProfCard({ prof, showDisponible = false }: ProfCardProps) {
  const { t, lang } = useLang();
  const h = t('home');
  const locale = getLocale(lang);

  const modalidades = [...new Set(prof.disponibilidades?.map((d) => d.modalidad) ?? [])];
  const tienePresencial = modalidades.some((m) => m === 'PRESENCIAL' || m === 'AMBOS');
  const tieneVirtual = modalidades.some((m) => m === 'VIRTUAL' || m === 'AMBOS');

  const specialtyName = getSpecialtyDisplayName(
    prof.especialidad?.nombre || '',
    lang,
    (h.specialties as Record<string, string>) || {}
  );

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 hover:shadow-md transition-all flex flex-col ${showDisponible ? 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-300' : 'border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-600'}`}>
      {showDisponible && (
        <div className="flex items-center gap-1.5 mb-3 -mt-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{h.availableThisWeek}</span>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl shrink-0 border border-blue-100 dark:border-blue-800 overflow-hidden">
          {prof.fotoUrl
            ? <img src={prof.fotoUrl} alt={prof.nombre} className="w-full h-full object-cover" />
            : <StethoscopeIcon size={22} className="text-blue-700" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">Dr/a. {prof.nombre} {prof.apellido}</h3>
          <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mt-0.5">{specialtyName}</p>
          {prof.precioConsulta > 0 ? (
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm mt-1">
              ${Number(prof.precioConsulta).toLocaleString(locale)}
            </p>
          ) : (
              <p className="text-slate-400 text-xs mt-1">{h.consultPrice}</p>
          )}
          {prof.ratingPromedio != null && (
            <div className="flex items-center gap-1.5 mt-1">
              <StarRating value={prof.ratingPromedio} size={13} />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{prof.ratingPromedio} ({prof.totalResenas})</span>
            </div>
          )}
        </div>
      </div>

      {/* Modalidad badges */}
      {(tienePresencial || tieneVirtual) && (
        <div className="flex gap-1.5 mt-3">
          {tienePresencial && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-medium">
              <BuildingIcon size={12} /> {h.inPerson}
            </span>
          )}
          {tieneVirtual && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[11px] font-medium">
              <VideoIcon size={12} /> {h.virtual}
            </span>
          )}
        </div>
      )}

      {prof.lugarAtencion && (
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 flex items-center gap-1 truncate">
          <MapPinIcon size={12} className="text-slate-400" /> {prof.lugarAtencion}
        </p>
      )}

      {prof.obrasSociales && prof.obrasSociales.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prof.obrasSociales.slice(0, 3).map((os) => (
            <span key={os} className="inline-flex items-center px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-medium border border-emerald-100 dark:border-emerald-800">
              {os}
            </span>
          ))}
          {prof.obrasSociales.length > 3 && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded text-[10px]">
              {h.moreCount.replace('{{count}}', String(prof.obrasSociales.length - 3))}
            </span>
          )}
        </div>
      )}

      {prof.bio && (
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 line-clamp-2">{prof.bio}</p>
      )}

      <Link
        href={`/profesional/${prof.id}`}
        className="block mt-4 text-center py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
      >
        {h.viewProfile}
      </Link>
    </div>
  );
}
