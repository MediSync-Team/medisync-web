'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Turno } from '../../../lib/api';
import { Translations } from '../../../lib/i18n/translations';
import { useLang } from '../../../lib/i18n/context';
import { formatClinicInstantDate, formatClinicInstantTime, getLocale } from '../../../lib/date';
import {
  VideoIcon, BuildingIcon, MapPinIcon, CreditCardIcon, RefreshIcon, XIcon, ChatIcon, ClipboardIcon, PaperclipIcon,
} from '../../../components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AgendarCalendario from '../../../components/AgendarCalendario';
import ArchivosPanel from '../../components/turno-panels/ArchivosPanel';

interface TurnoCardProps {
  turno: Turno;
  pagoInfo?: { necesitaPago: boolean };
  canCancel: boolean;
  isCancelling?: boolean;
  horasMinCancelacion: number;
  onPagar: () => void;
  onCancelar: () => void;
  onReprogramar: () => void;
  onCompletarPreconsulta: () => void;
  onVerReceta: () => void;
  onCalificar: () => void;
  onVideoCall: () => void;
  onChat: () => void;
  d: Translations['dashboard'];
  s: Translations['status'];
  translateSpecialty: (name?: string) => string;
}

export default function TurnoCard({
  turno, pagoInfo, canCancel, isCancelling = false, onPagar, onCancelar, onReprogramar, onCompletarPreconsulta, onVerReceta, onCalificar, onVideoCall, onChat, horasMinCancelacion, d, s, translateSpecialty,
}: TurnoCardProps) {
  const { t, lang } = useLang();
  const p = t('paciente');
  const locale = getLocale(lang);
  const isActive = turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO';
  const isFuture = new Date(turno.fechaHora) >= new Date();
  const preconsultaCompletada = Boolean(turno.preconsultaCompletadaAt);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showArchivos, setShowArchivos] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    api.chat.getUnread(turno.id).then(d => setUnreadCount(d.count)).catch(() => {});
  }, [turno.id, isActive]);

  const pagado = pagoInfo?.necesitaPago === false;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Status bar */}
      <div className={`flex items-center justify-between px-4 py-1.5 text-xs font-semibold ${
        turno.estado === 'CONFIRMADO' ? 'bg-success/12 text-success' :
        turno.estado === 'RESERVADO' ? 'bg-warning/12 text-warning' :
        turno.estado === 'CANCELADO' ? 'bg-destructive/12 text-destructive' :
        'bg-primary/12 text-primary'
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
            <p className="font-semibold text-foreground">
              {turno.profesional?.nombre} {turno.profesional?.apellido}
            </p>
            <p className="mt-0.5 text-xs font-medium text-primary">{translateSpecialty(turno.profesional?.especialidad?.nombre)}</p>
          </div>
          {/* Date/time */}
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-foreground">
              {formatClinicInstantDate(turno.fechaHora, locale, { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatClinicInstantTime(turno.fechaHora, locale)}
            </p>
          </div>
        </div>

        {/* Location (PRESENCIAL only) */}
        {turno.modalidad === 'PRESENCIAL' && (turno.lugarAtencion || turno.profesional?.lugarAtencion) && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPinIcon size={11} className="shrink-0" />
            <span className="truncate">{turno.lugarAtencion ?? turno.profesional?.lugarAtencion}</span>
          </div>
        )}

        {/* Video call */}
        {turno.modalidad === 'VIRTUAL' && (turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO') && (
          <Button
            size="sm"
            onClick={onVideoCall}
            className="mt-3 w-full bg-success text-white hover:bg-success/90"
          >
            <VideoIcon size={13} /> {p.joinVideoCall}
          </Button>
        )}

        {/* Cancellation reason */}
        {turno.estado === 'CANCELADO' && turno.notasCancelacion && (
          <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <p className="mb-1 text-xs font-semibold text-destructive">{p.cancelReasonLabel}</p>
            <p className="text-sm text-destructive/90">{turno.notasCancelacion}</p>
          </div>
        )}

        {/* Actions */}
        {isActive && isFuture && (
          <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
            {/* Pay button */}
            {turno.profesional?.precioConsulta && Number(turno.profesional.precioConsulta) > 0 && (
              <Button
                size="sm"
                onClick={onPagar}
                disabled={pagado}
                variant={pagado ? 'secondary' : 'default'}
                className={`flex-1 ${pagado ? '' : 'bg-success text-white hover:bg-success/90'}`}
              >
                <CreditCardIcon size={13} />
                {pagado
                  ? p.paid
                  : `${p.pay} $${Number(turno.profesional.precioConsulta).toLocaleString(locale)}`}
              </Button>
            )}

            {/* Reschedule */}
            <Button
              size="sm"
              variant="secondary"
              onClick={onReprogramar}
              disabled={!canCancel}
              title={!canCancel ? `Requiere ${horasMinCancelacion}h de anticipación` : undefined}
            >
              <RefreshIcon size={13} /> {p.reschedule}
            </Button>

            {/* Cancel */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelar}
              disabled={!canCancel || isCancelling}
              className={canCancel && !isCancelling ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground'}
              title={!canCancel ? `Requiere ${horasMinCancelacion}h de anticipación` : undefined}
            >
              <XIcon size={13} /> {isCancelling ? t('common').saving : p.cancel}
            </Button>

            <Button size="sm" variant="ghost" className="text-muted-foreground" render={<Link href={`/profesional/${turno.profesional?.id}`} />}>
              {p.viewProfessional}
            </Button>

            {/* Chat button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { onChat(); setUnreadCount(0); }}
              className="relative text-primary hover:bg-primary/10"
            >
              <ChatIcon size={13} />
              {p.chatLabel}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {!preconsultaCompletada ? (
              <Button size="sm" onClick={onCompletarPreconsulta}>
                <ClipboardIcon size={13} /> {p.preconsulta}
              </Button>
            ) : (
              <Badge className="bg-success/12 text-success">{t('dashboard').preconsulta}</Badge>
            )}

            {(turno.estado === 'COMPLETADO' || turno.estado === 'CONFIRMADO') && (
              <Button size="sm" variant="secondary" onClick={onVerReceta}>
                <ClipboardIcon size={13} /> {p.viewPrescription}
              </Button>
            )}

            {turno.estado === 'COMPLETADO' && (
              <Button size="sm" variant="ghost" onClick={onCalificar} className="text-warning hover:bg-warning/10">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" /></svg>
                {p.rate}
              </Button>
            )}
          </div>
        )}

        {/* Calendar buttons for active future turnos */}
        {isActive && isFuture && turno.profesional && (
          <div className="mt-3 border-t pt-3">
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

        {/* Chat + archivos access for past / cancelled turnos (the action row above is
            upcoming-only). Lets the patient still read the conversation — including the
            in-call chat — and review the attached files after the turno is completed or
            cancelled. */}
        {!(isActive && isFuture) && (
          <div className="mt-3 border-t pt-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { onChat(); setUnreadCount(0); }}
                className="relative text-primary hover:bg-primary/10"
              >
                <ChatIcon size={13} />
                {p.chatLabel}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowArchivos(v => !v)}
                className="text-primary hover:bg-primary/10"
              >
                <PaperclipIcon size={13} />
                {d.files}
              </Button>
            </div>
            {showArchivos && (
              <div className="mt-3">
                <ArchivosPanel turnoId={turno.id} readOnly />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
