'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Turno } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';
import { getLocale } from '../../../lib/date';
import {
  VideoIcon, BuildingIcon, MapPinIcon, CreditCardIcon, RefreshIcon, XIcon, ChatIcon, ClipboardIcon,
} from '../../../components/icons';
import AgendarCalendario from '../../../components/AgendarCalendario';

interface TurnoCardProps {
  turno: Turno;
  pagoInfo?: { necesitaPago: boolean };
  canCancel: boolean;
  horasMinCancelacion: number;
  onPagar: () => void;
  onCancelar: () => void;
  onReprogramar: () => void;
  onCompletarPreconsulta: () => void;
  onVerReceta: () => void;
  onCalificar: () => void;
  onVideoCall: () => void;
  onChat: () => void;
  d: any;
  s: any;
  translateSpecialty: (name?: string) => string;
}

export default function TurnoCard({
  turno, pagoInfo, canCancel, onPagar, onCancelar, onReprogramar, onCompletarPreconsulta, onVerReceta, onCalificar, onVideoCall, onChat, horasMinCancelacion, d, s, translateSpecialty,
}: TurnoCardProps) {
  const { t, lang } = useLang();
  const p = t('paciente');
  const locale = getLocale(lang);
  const isActive = turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO';
  const isFuture = new Date(turno.fechaHora) >= new Date();
  const preconsultaCompletada = Boolean(turno.preconsultaCompletadaAt);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    api.chat.getUnread(turno.id).then(d => setUnreadCount(d.count)).catch(() => {});
  }, [turno.id, isActive]);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Status bar */}
      <div className={`px-4 py-1.5 text-xs font-semibold flex items-center justify-between ${
        turno.estado === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-700' :
        turno.estado === 'RESERVADO' ? 'bg-amber-50 text-amber-700' :
        turno.estado === 'CANCELADO' ? 'bg-red-50 text-red-700' :
        'bg-blue-50 text-blue-700'
      }`}>
        <span className="flex items-center gap-1.5">
          {(s as any)[turno.estado] || turno.estado}
        </span>
        {turno.modalidad === 'VIRTUAL' ? (
          <span className="flex items-center gap-1"><VideoIcon size={11} /> {t('home').virtual}</span>
        ) : (
          <span className="flex items-center gap-1"><BuildingIcon size={11} /> {t('home').inPerson}</span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Professional info */}
          <div className="flex-1">
            <p className="font-semibold text-slate-800">
              {turno.profesional?.nombre} {turno.profesional?.apellido}
            </p>
            <p className="text-xs text-blue-600 font-medium mt-0.5">{translateSpecialty(turno.profesional?.especialidad?.nombre)}</p>
          </div>
          {/* Date/time */}
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-slate-700">
              {new Date(turno.fechaHora).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-xs text-slate-500">
              {new Date(turno.fechaHora).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Location (PRESENCIAL only) */}
        {turno.modalidad === 'PRESENCIAL' && (turno.lugarAtencion || turno.profesional?.lugarAtencion) && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <MapPinIcon size={11} className="shrink-0" />
            <span className="truncate">{turno.lugarAtencion ?? turno.profesional?.lugarAtencion}</span>
          </div>
        )}

        {/* Video call */}
        {turno.modalidad === 'VIRTUAL' && (turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO') && (
          <button
            onClick={onVideoCall}
            className="btn btn-success btn-sm mt-3 w-full"
          >
            <VideoIcon size={13} /> {p.joinVideoCall}
          </button>
        )}

        {/* Cancellation reason */}
        {turno.estado === 'CANCELADO' && turno.notasCancelacion && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xs font-semibold text-red-700 mb-1">Motivo de cancelación</p>
            <p className="text-sm text-red-600">{turno.notasCancelacion}</p>
          </div>
        )}

        {/* Actions */}
        {isActive && isFuture && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            {/* Pay button */}
            {turno.profesional?.precioConsulta && Number(turno.profesional.precioConsulta) > 0 && (
              <button
                onClick={onPagar}
                disabled={pagoInfo?.necesitaPago === false}
                className={`btn btn-sm flex-1 ${pagoInfo?.necesitaPago === false ? 'btn-secondary opacity-60 cursor-not-allowed' : 'btn-success'}`}
              >
                <CreditCardIcon size={13} />
                {pagoInfo?.necesitaPago === false
                  ? p.paid
                  : `${p.pay} $${Number(turno.profesional.precioConsulta).toLocaleString(locale)}`}
              </button>
            )}

            {/* Reschedule */}
            <button
              onClick={onReprogramar}
              disabled={!canCancel}
              className="btn btn-secondary btn-sm"
              title={!canCancel ? `Requiere ${horasMinCancelacion}h de anticipación` : undefined}
            >
              <RefreshIcon size={13} /> {p.reschedule}
            </button>

            {/* Cancel */}
            <button
              onClick={onCancelar}
              disabled={!canCancel}
              className={`btn btn-sm ${canCancel ? 'btn-ghost text-red-500 hover:bg-red-50' : 'btn-ghost text-slate-400 cursor-not-allowed'}`}
              title={!canCancel ? `Requiere ${horasMinCancelacion}h de anticipación` : undefined}
            >
              <XIcon size={13} /> {p.cancel}
            </button>

            <Link href={`/profesional/${turno.profesional?.id}`} className="btn btn-ghost btn-sm text-slate-500">
              {p.viewProfessional}
            </Link>

            {/* Chat button */}
            <button
              onClick={() => { onChat(); setUnreadCount(0); }}
              className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50 relative"
            >
              <ChatIcon size={13} />
              {p.chatLabel}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {!preconsultaCompletada ? (
              <button onClick={onCompletarPreconsulta} className="btn btn-primary btn-sm">
                <ClipboardIcon size={13} /> {p.preconsulta}
              </button>
            ) : (
              <span className="badge badge-green">{t('dashboard').preconsulta}</span>
            )}

            {(turno.estado === 'COMPLETADO' || turno.estado === 'CONFIRMADO') && (
              <button onClick={onVerReceta} className="btn btn-secondary btn-sm">
                <ClipboardIcon size={13} /> {p.viewPrescription}
              </button>
            )}

            {turno.estado === 'COMPLETADO' && (
              <button onClick={onCalificar} className="btn btn-ghost btn-sm text-amber-600 hover:bg-amber-50">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                {p.rate}
              </button>
            )}
          </div>
        )}

        {/* Calendar buttons for active future turnos */}
        {isActive && isFuture && turno.profesional && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <AgendarCalendario
              variant="compact"
              turno={{
                turnoId: turno.id,
                fechaHora: turno.fechaHora,
                duracionMin: turno.duracionMin,
                modalidad: turno.modalidad,
                profesionalNombre: turno.profesional.nombre,
                profesionalApellido: turno.profesional.apellido,
                especialidad: translateSpecialty(turno.profesional.especialidad?.nombre ?? ''),
                lugarAtencion: turno.lugarAtencion ?? turno.profesional.lugarAtencion,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
