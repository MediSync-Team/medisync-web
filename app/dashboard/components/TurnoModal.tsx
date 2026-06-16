'use client';

import { useState, useEffect } from 'react';
import { api, Turno } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLang } from '../../lib/i18n/context';
import { formatClinicInstantDate, formatClinicInstantTime, getLocale } from '../../lib/date';
import { canCancelTurnoFromModal, canCompleteTurno, canReprogramTurno } from '../../lib/turno-actions';
import { estadoBadge, estadoLabel } from '../../lib/utils';
import { Notice } from '../../lib/ui-notice';
import {
  CalendarIcon,
  XIcon,
  CheckIcon,
  VideoIcon,
  BuildingIcon,
  InfoIcon,
  ChatIcon,
} from '../../components/icons';
import VideoCallModal from '../../components/VideoCallModal';
import ChatModal from '../../components/ChatModal';
import RecetaPanel from './turno-panels/RecetaPanel';
import ArchivosPanel from './turno-panels/ArchivosPanel';
import CertificadoPanel from './turno-panels/CertificadoPanel';
import HistoriaClinicaPanel from './turno-panels/HistoriaClinicaPanel';
import PreconsultaPanel from './turno-panels/PreconsultaPanel';
import EvolucionNotasPanel from './turno-panels/EvolucionNotasPanel';
import ReprogramarPanel from './turno-panels/ReprogramarPanel';

function TurnoModal({ turno, onClose, onUpdate, translateSpecialty }: { turno: Turno; onClose: () => void; onUpdate: () => void; translateSpecialty: (name?: string) => string }) {
  const [savedMessage, setSavedMessage] = useState('');
  const { t, lang } = useLang();
  const d = t('dashboard');
  const modal = d.turnoModal;
  const status = t('status');
  const [modalNotice, setModalNotice] = useState<Notice | null>(null);

  // Transient "saved" badge shared by the evolution notes and receta panels.
  const flashSaved = (text: string) => {
    setSavedMessage(text);
    setTimeout(() => setSavedMessage(''), 2500);
  };
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReprogramar, setShowReprogramar] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (turno.estado !== 'CANCELADO') {
      api.chat.getUnread(turno.id).then(d => setUnreadChat(d.count)).catch(() => {});
    }
  }, [turno.id, turno.estado]);

  const handleActualizarEstado = async (nuevoEstado: Turno['estado']) => {
    try {
      await api.turnos.updateEstado(turno.id, nuevoEstado);
      onUpdate();
      onClose();
    } catch (err) { console.error(err); }
  };

  return (
    <>
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{d.appointmentDetail}</h3>
          <button aria-label={modal.closeModal} onClick={onClose} className="btn btn-ghost p-2 text-slate-400 hover:text-slate-600">
            <XIcon size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {modalNotice && (
            <div className={`alert ${modalNotice.type === 'error' ? 'alert-error' : modalNotice.type === 'success' ? 'alert-success' : 'alert-info'}`} role="status" aria-live="polite">
              <InfoIcon size={14} className="shrink-0" />
              <span>{modalNotice.text}</span>
              <button className="ml-auto text-xs underline" onClick={() => setModalNotice(null)}>{d.hide}</button>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">{d.dateTime}</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {formatClinicInstantDate(turno.fechaHora, getLocale(lang), { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <p className="text-blue-600 font-bold">
                {formatClinicInstantTime(turno.fechaHora, getLocale(lang))}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">{d.status}</p>
              <span className={estadoBadge(turno.estado)}>{estadoLabel(turno.estado, status)}</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">{d.patient}</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : modal.noAccount}
              </p>
              {turno.paciente?.telefono && (
                <p className="text-xs text-slate-500 mt-0.5">{turno.paciente.telefono}</p>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5">
              <p className="text-xs text-slate-500 mb-1">{t('professional').modality}</p>
              <div className="flex items-center gap-1.5">
                {turno.modalidad === 'VIRTUAL' ? (
                  <><VideoIcon size={14} className="text-blue-500" /><span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{t('home').virtual}</span></>
                ) : (
                  <><BuildingIcon size={14} className="text-emerald-500" /><span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{t('home').inPerson}</span></>
                )}
              </div>
              {turno.modalidad === 'VIRTUAL' && (turno.estado === 'RESERVADO' || turno.estado === 'CONFIRMADO') && (
                <button
                  onClick={() => setShowVideoCall(true)}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                >
                  <VideoIcon size={12} /> {d.startVideoCall}
                </button>
              )}
            </div>
          </div>

          {/* Chat pre-turno */}
          {turno.estado !== 'CANCELADO' && turno.paciente && (
            <button
              onClick={() => { setShowChat(true); setUnreadChat(0); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium transition-colors relative"
            >
              <ChatIcon size={15} />
              {modal.chatWith} {turno.paciente.nombre} {turno.paciente.apellido}
              {unreadChat > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadChat} {unreadChat === 1 ? modal.unreadSingular : modal.unreadPlural}
                </span>
              )}
            </button>
          )}

          {/* Preconsulta (resumen read-only) */}
          <PreconsultaPanel turnoId={turno.id} />

          {/* Evolución clínica (notas editables) */}
          <EvolucionNotasPanel
            turnoId={turno.id}
            savedMessage={savedMessage}
            flashSaved={flashSaved}
            onUpdate={onUpdate}
          />

          {/* Historia clinica longitudinal */}
          <HistoriaClinicaPanel turno={turno} translateSpecialty={translateSpecialty} onNotice={setModalNotice} />

          {/* Receta e indicaciones post-consulta */}
          <RecetaPanel
            turno={turno}
            translateSpecialty={translateSpecialty}
            onNotice={setModalNotice}
            flashSaved={flashSaved}
          />

          {/* Certificado médico */}
          <CertificadoPanel turno={turno} translateSpecialty={translateSpecialty} onNotice={setModalNotice} />

          {/* Archivos */}
          <ArchivosPanel turnoId={turno.id} onNotice={setModalNotice} />
        </div>

        {/* Reprogramar panel */}
        {showReprogramar && (
          <ReprogramarPanel
            turno={turno}
            onNotice={setModalNotice}
            onClose={() => setShowReprogramar(false)}
            onRescheduled={() => { onUpdate(); setTimeout(onClose, 1200); }}
          />
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap gap-3 bg-slate-50 rounded-b-2xl">
          {canReprogramTurno(turno.estado) && (
            <button
              onClick={() => { setShowReprogramar((v) => !v); setModalNotice(null); }}
              className="btn btn-secondary flex-1"
            >
              <CalendarIcon size={15} /> {modal.reschedule.action}
            </button>
          )}
          {canCompleteTurno(turno.estado) && (
            <button onClick={() => handleActualizarEstado('COMPLETADO')} className="btn btn-success flex-1">
              <CheckIcon size={15} /> {d.complete}
            </button>
          )}
          {canCancelTurnoFromModal(turno.estado) && (
            <button onClick={() => handleActualizarEstado('CANCELADO')} className="btn btn-danger flex-1">
              <XIcon size={15} /> {d.cancel}
            </button>
          )}
        </div>
      </div>
    </div>

    {showVideoCall && (
      <VideoCallModal
        turnoId={turno.id}
        participantName={turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : modal.fallbackPatient}
        participantRoleLabel={modal.fallbackPatient}
        fechaHora={turno.fechaHora}
        onClose={() => setShowVideoCall(false)}
      />
    )}

    {showChat && authUser && turno.paciente && (
      <ChatModal
        turnoId={turno.id}
        myUserId={authUser.id}
        otherName={`${turno.paciente.nombre} ${turno.paciente.apellido}`}
        onClose={() => setShowChat(false)}
      />
    )}

    </>
  );
}

export default TurnoModal;
