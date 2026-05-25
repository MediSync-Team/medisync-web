'use client';

import { useState, useEffect } from 'react';
import {
  api,
  Turno,
  Evolucion,
  HistoriaClinicaPaciente,
  HistoriaClinicaEditableFields,
  PreconsultaTurno,
  RecetaIndicacionInput,
  RecetaIndicacion,
  CertificadoConDatos,
  TipoCertificado,
  ArchivoTurno,
} from '../../lib/api';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../lib/auth-context';
import { useLang } from '../../lib/i18n/context';
import { formatClinicInstantDate, formatClinicInstantTime, getLocale } from '../../lib/date';
import { buildReprogrammingFechaHora, getReprogrammingMinDate } from '../../lib/reprogramming';
import { canCancelTurnoFromModal, canCompleteTurno, canReprogramTurno } from '../../lib/turno-actions';
import { estadoBadge, estadoLabel } from '../../lib/utils';
import { imprimirReceta } from '../../lib/receta-pdf';
import { imprimirCertificado } from '../../lib/certificado-pdf';
import { exportarHistoriaClinicaPDF } from '../../lib/historia-clinica-pdf';
import {
  CalendarIcon,
  TrashIcon,
  ClipboardIcon,
  PaperclipIcon,
  XIcon,
  CheckIcon,
  VideoIcon,
  BuildingIcon,
  InfoIcon,
  ChatIcon,
} from '../../components/icons';
import VideoCallModal from '../../components/VideoCallModal';
import ChatModal from '../../components/ChatModal';
import EmitirCertificadoModal from './EmitirCertificadoModal';

function TurnoModal({ turno, onClose, onUpdate, translateSpecialty }: { turno: Turno; onClose: () => void; onUpdate: () => void; translateSpecialty: (name?: string) => string }) {
  const [evolucion, setEvolucion] = useState<Evolucion | null>(null);
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [loadingEvolucion, setLoadingEvolucion] = useState(true);
  const [archivos, setArchivos] = useState<ArchivoTurno[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState('OTRO');
  const [savedMessage, setSavedMessage] = useState('');
  const [historiaClinica, setHistoriaClinica] = useState<HistoriaClinicaPaciente | null>(null);
  const [historiaForm, setHistoriaForm] = useState<HistoriaClinicaEditableFields>({});
  const [loadingHistoria, setLoadingHistoria] = useState(true);
  const [savingHistoria, setSavingHistoria] = useState(false);
  const [historiaMessage, setHistoriaMessage] = useState('');
  const [preconsulta, setPreconsulta] = useState<PreconsultaTurno | null>(null);
  const [loadingPreconsulta, setLoadingPreconsulta] = useState(true);
  const { t, lang } = useLang();
  const d = t('dashboard');
  const common = t('common');
  const modal = d.turnoModal;
  const status = t('status');
  const [receta, setReceta] = useState<RecetaIndicacion | null>(null);
  const [recetaForm, setRecetaForm] = useState<RecetaIndicacionInput>({ diagnostico: '', indicaciones: '' });
  const [loadingReceta, setLoadingReceta] = useState(true);
  const [savingReceta, setSavingReceta] = useState(false);
  const [shareText, setShareText] = useState('');
  const [modalNotice, setModalNotice] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReprogramar, setShowReprogramar] = useState(false);
  const [reprogramarFecha, setReprogramarFecha] = useState('');
  const [reprogramarSlots, setReprogramarSlots] = useState<{ hora: string; disponible: boolean }[]>([]);
  const [reprogramarHora, setReprogramarHora] = useState('');
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [reprogramando, setReprogramando] = useState(false);
  const [unreadChat, setUnreadChat] = useState(0);
  const { user: authUser } = useAuth();
  const [certificado, setCertificado] = useState<CertificadoConDatos | null>(null);
  const [loadingCertificado, setLoadingCertificado] = useState(true);
  const [showEmitirCertificado, setShowEmitirCertificado] = useState(false);
  const [certificadoForm, setCertificadoForm] = useState<{
    tipo: TipoCertificado;
    diagnostico: string;
    texto: string;
    diasReposo: number;
  }>({
    tipo: 'CONSULTA',
    diagnostico: '',
    texto: '',
    diasReposo: 0,
  });
  const [savingCertificado, setSavingCertificado] = useState(false);

  useEffect(() => {
    if (turno.estado !== 'CANCELADO') {
      api.chat.getUnread(turno.id).then(d => setUnreadChat(d.count)).catch(() => {});
    }
  }, [turno.id, turno.estado]);

  useEffect(() => { loadEvolucion(); loadArchivos(); }, [turno.id]);
  useEffect(() => { loadPreconsulta(); }, [turno.id]);
  useEffect(() => { loadReceta(); }, [turno.id]);
  useEffect(() => { loadCertificado(); }, [turno.id]);
  useEffect(() => {
    if (turno.paciente?.id) {
      loadHistoriaClinica(turno.paciente.id);
      return;
    }

    setHistoriaClinica(null);
    setHistoriaForm({});
    setLoadingHistoria(false);
  }, [turno.id, turno.paciente?.id]);

  const loadHistoriaClinica = async (pacienteId: string) => {
    setLoadingHistoria(true);
    try {
      const data = await api.pacientes.getHistoriaClinica(pacienteId);
      setHistoriaClinica(data);
      setHistoriaForm({
        antecedentesPersonales: data.paciente.antecedentesPersonales ?? '',
        antecedentesFamiliares: data.paciente.antecedentesFamiliares ?? '',
        alergias: data.paciente.alergias ?? '',
        medicacionActual: data.paciente.medicacionActual ?? '',
        habitos: data.paciente.habitos ?? '',
        diagnosticosPrevios: data.paciente.diagnosticosPrevios ?? '',
        notasClinicasGenerales: data.paciente.notasClinicasGenerales ?? '',
      });
    } catch (err) {
      console.error(err);
      setHistoriaClinica(null);
      setHistoriaForm({});
    } finally {
      setLoadingHistoria(false);
    }
  };

  const loadPreconsulta = async () => {
    setLoadingPreconsulta(true);
    try {
      const data = await api.turnos.getPreconsulta(turno.id);
      setPreconsulta(data);
    } catch (err) {
      console.error(err);
      setPreconsulta(null);
    } finally {
      setLoadingPreconsulta(false);
    }
  };

  const loadReceta = async () => {
    setLoadingReceta(true);
    try {
      const data = await api.turnos.getReceta(turno.id);
      setReceta(data);
      if (data) {
        setRecetaForm({
          diagnostico: data.diagnostico,
          planTratamiento: data.planTratamiento || '',
          medicamentos: data.medicamentos || '',
          indicaciones: data.indicaciones,
          estudiosSolicitados: data.estudiosSolicitados || '',
          proximoControl: data.proximoControl || '',
          advertencias: data.advertencias || '',
          observaciones: data.observaciones || '',
        });
      }
    } catch (err) {
      console.error(err);
      setReceta(null);
    } finally {
      setLoadingReceta(false);
    }
  };

  const loadCertificado = async () => {
    setLoadingCertificado(true);
    try {
      const data = await api.certificados.getByTurno(turno.id);
      setCertificado(data);
      setCertificadoForm({
        tipo: data.tipo,
        diagnostico: data.diagnostico,
        texto: data.texto,
        diasReposo: data.diasReposo || 0,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.toLowerCase().includes('no encontrado') && !msg.toLowerCase().includes('not found')) {
        console.error(err);
      }
      setCertificado(null);
    } finally {
      setLoadingCertificado(false);
    }
  };

  const handleSaveReceta = async () => {
    if (recetaForm.diagnostico.trim().length < 5 || recetaForm.indicaciones.trim().length < 5) {
      setModalNotice({ type: 'error', text: modal.notices.completePrescription });
      return;
    }

    setSavingReceta(true);
    try {
      const response = await api.turnos.guardarReceta(turno.id, {
        ...recetaForm,
        diagnostico: recetaForm.diagnostico.trim(),
        indicaciones: recetaForm.indicaciones.trim(),
      });
      setReceta(response.receta);
      setShareText(response.shareText);
      setSavedMessage(modal.notices.prescriptionSavedBadge);
      setTimeout(() => setSavedMessage(''), 2500);
      setModalNotice({ type: 'success', text: modal.notices.prescriptionSaved });
    } catch (err) {
      setModalNotice({ type: 'error', text: err instanceof Error ? err.message : modal.notices.prescriptionError });
    } finally {
      setSavingReceta(false);
    }
  };

  const handleCopyShareText = async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setSavedMessage(modal.notices.prescriptionCopied);
      setTimeout(() => setSavedMessage(''), 2500);
    } catch {
      setModalNotice({ type: 'error', text: modal.notices.clipboardError });
    }
  };

  const handleSaveCertificado = async () => {
    if (certificadoForm.diagnostico.trim().length < 5 || certificadoForm.texto.trim().length < 5) {
      setModalNotice({ type: 'error', text: modal.notices.completeCertificate });
      return;
    }
    if (certificadoForm.tipo === 'REPOSO' && certificadoForm.diasReposo <= 0) {
      setModalNotice({ type: 'error', text: modal.notices.restDaysRequired });
      return;
    }

    setSavingCertificado(true);
    try {
      const response = await api.certificados.emitir({
        turnoId: turno.id,
        tipo: certificadoForm.tipo,
        diagnostico: certificadoForm.diagnostico.trim(),
        texto: certificadoForm.texto.trim(),
        diasReposo: certificadoForm.tipo === 'REPOSO' ? certificadoForm.diasReposo : undefined,
      });
      setCertificado(response as any);
      setShowEmitirCertificado(false);
      setModalNotice({ type: 'success', text: modal.notices.certificateSaved });
      if (turno.profesional && turno.paciente) {
        imprimirCertificado({
          ...response,
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
        } as CertificadoConDatos);
      }
    } catch (err) {
      setModalNotice({ type: 'error', text: err instanceof Error ? err.message : modal.notices.certificateError });
    } finally {
      setSavingCertificado(false);
    }
  };

  const handleSaveHistoriaClinica = async () => {
    if (!turno.paciente?.id) return;

    setSavingHistoria(true);
    try {
      await api.pacientes.updateHistoriaClinica(turno.paciente.id, historiaForm);
      setHistoriaMessage(modal.notices.historySaved);
      setTimeout(() => setHistoriaMessage(''), 3000);
      await loadHistoriaClinica(turno.paciente.id);
    } catch (err) {
      setModalNotice({ type: 'error', text: err instanceof Error ? err.message : modal.notices.historyError });
    } finally {
      setSavingHistoria(false);
    }
  };

  const historiaFields: { key: keyof HistoriaClinicaEditableFields; label: string; placeholder: string }[] = [
    {
      key: 'antecedentesPersonales',
      label: modal.history.fields.antecedentesPersonales.label,
      placeholder: modal.history.fields.antecedentesPersonales.placeholder,
    },
    {
      key: 'antecedentesFamiliares',
      label: modal.history.fields.antecedentesFamiliares.label,
      placeholder: modal.history.fields.antecedentesFamiliares.placeholder,
    },
    {
      key: 'alergias',
      label: modal.history.fields.alergias.label,
      placeholder: modal.history.fields.alergias.placeholder,
    },
    {
      key: 'medicacionActual',
      label: modal.history.fields.medicacionActual.label,
      placeholder: modal.history.fields.medicacionActual.placeholder,
    },
    {
      key: 'habitos',
      label: modal.history.fields.habitos.label,
      placeholder: modal.history.fields.habitos.placeholder,
    },
    {
      key: 'diagnosticosPrevios',
      label: modal.history.fields.diagnosticosPrevios.label,
      placeholder: modal.history.fields.diagnosticosPrevios.placeholder,
    },
    {
      key: 'notasClinicasGenerales',
      label: modal.history.fields.notasClinicasGenerales.label,
      placeholder: modal.history.fields.notasClinicasGenerales.placeholder,
    },
  ];

  const loadEvolucion = async () => {
    try {
      const data = await api.turnos.getEvolucion(turno.id);
      if (data) { setEvolucion(data); setNotas(data.contenido || ''); }
    } catch (err) { console.error(err); }
    finally { setLoadingEvolucion(false); }
  };

  const loadArchivos = async () => {
    try {
      const data = await api.archivos.getByTurno(turno.id);
      setArchivos(data || []);
    } catch (err) { console.error(err); }
  };

  const handleGuardarNotas = async () => {
    setGuardando(true);
    try {
      await api.turnos.guardarEvolucion(turno.id, notas);
      setSavedMessage(modal.notices.notesSaved);
      setTimeout(() => setSavedMessage(''), 2500);
      onUpdate();
    } catch (err) { console.error(err); }
    finally { setGuardando(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.archivos.subir(turno.id, file, fileType);
      loadArchivos();
    } catch (err) { console.error(err); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDeleteArchivo = async (id: string) => {
    try {
      await api.archivos.eliminar(id);
      loadArchivos();
      setModalNotice({ type: 'success', text: modal.notices.fileDeleted });
    } catch (err) { console.error(err); }
  };

  const handleActualizarEstado = async (nuevoEstado: Turno['estado']) => {
    try {
      await api.turnos.updateEstado(turno.id, nuevoEstado);
      onUpdate();
      onClose();
    } catch (err) { console.error(err); }
  };

  const cargarSlots = async (fecha: string) => {
    setReprogramarHora('');
    setReprogramarSlots([]);
    if (!fecha) return;
    setCargandoSlots(true);
    try {
      const slots = await api.profesionales.getSlots(turno.profesional?.id ?? '', fecha, turno.modalidad);
      setReprogramarSlots(slots.filter((s) => s.disponible));
    } catch (err) { console.error(err); }
    finally { setCargandoSlots(false); }
  };

  const handleReprogramar = async () => {
    if (!reprogramarFecha || !reprogramarHora) {
      setModalNotice({ type: 'error', text: modal.notices.rescheduleMissingFields });
      return;
    }
    const fechaHoraISO = buildReprogrammingFechaHora(reprogramarFecha, reprogramarHora);
    setReprogramando(true);
    try {
      await api.turnos.reprogramar(turno.id, { fechaHora: fechaHoraISO });
      setModalNotice({ type: 'success', text: modal.notices.rescheduleSaved });
      setShowReprogramar(false);
      onUpdate();
      setTimeout(onClose, 1200);
    } catch (err) {
      setModalNotice({ type: 'error', text: err instanceof Error ? err.message : modal.notices.rescheduleError });
    } finally {
      setReprogramando(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const preconsultaRiskClass = (riesgo: PreconsultaTurno['riesgo']) => {
    if (riesgo === 'URGENTE') return 'badge-red';
    if (riesgo === 'ALTO') return 'badge-yellow';
    if (riesgo === 'MEDIO') return 'badge-blue';
    if (riesgo === 'BAJO') return 'badge-green';
    return 'badge-gray';
  };

  const certificateTypeLabel = (tipo: TipoCertificado) => {
    if (tipo === 'REPOSO') return modal.certificate.types.REPOSO;
    if (tipo === 'CONSULTA') return modal.certificate.types.CONSULTA;
    if (tipo === 'APTITUD') return modal.certificate.types.APTITUD;
    return modal.certificate.types.LIBRE;
  };

  const fileTypeLabel = (tipo?: string | null) => {
    if (tipo === 'LABORATORIO') return modal.files.types.LABORATORIO;
    if (tipo === 'IMAGEN') return modal.files.types.IMAGEN;
    if (tipo === 'EVOLUCION') return modal.files.types.EVOLUCION;
    return modal.files.types.OTRO;
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

          {/* Evolución clínica */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">{d.preconsulta}</h4>
            </div>
            {loadingPreconsulta ? (
              <div className="skeleton h-24 rounded-lg" />
            ) : !preconsulta?.completadaAt ? (
              <p className="text-sm text-slate-500">{modal.preconsulta.notCompleted}</p>
            ) : (
              <div className="space-y-2.5 text-sm">
                {/* Header row: timestamp + risk badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-slate-700 text-xs">
                    {modal.preconsulta.completed} {new Date(preconsulta.completadaAt).toLocaleDateString(getLocale(lang))}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {preconsulta.aiGenerated && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 font-medium">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                        {modal.preconsulta.ai}
                      </span>
                    )}
                    <span className={`badge ${preconsultaRiskClass(preconsulta.riesgo)}`}>
                      {modal.preconsulta.risk} {preconsulta.riesgo}
                    </span>
                  </div>
                </div>

                {/* AI-generated summary — highlighted box */}
                {preconsulta.resumen && (
                  <div className={`rounded-lg border p-3 ${preconsulta.aiGenerated ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`text-xs font-semibold mb-1 ${preconsulta.aiGenerated ? 'text-violet-700' : 'text-slate-600'}`}>
                      {preconsulta.aiGenerated ? `✦ ${modal.preconsulta.aiSummary}` : modal.preconsulta.summary}
                    </p>
                    <p className={`text-sm leading-relaxed ${preconsulta.aiGenerated ? 'text-violet-900' : 'text-slate-700'}`}>
                      {preconsulta.resumen}
                    </p>
                  </div>
                )}

                {/* Scales */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5">
                    <p className="text-xs text-slate-500 mb-1">{modal.preconsulta.pain}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{preconsulta.escalaDolor}/10</p>
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${(preconsulta.escalaDolor ?? 0) >= 8 ? 'bg-red-500' : (preconsulta.escalaDolor ?? 0) >= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                             style={{ width: `${((preconsulta.escalaDolor ?? 0) / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-2.5">
                    <p className="text-xs text-slate-500 mb-1">{modal.preconsulta.anxiety}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{preconsulta.escalaAnsiedad}/10</p>
                      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${(preconsulta.escalaAnsiedad ?? 0) >= 8 ? 'bg-red-500' : (preconsulta.escalaAnsiedad ?? 0) >= 5 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                             style={{ width: `${((preconsulta.escalaAnsiedad ?? 0) / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <p><span className="font-medium text-slate-700">{modal.preconsulta.reason}</span> <span className="text-slate-600">{preconsulta.motivo}</span></p>
                <p><span className="font-medium text-slate-700">{modal.preconsulta.symptoms}</span> <span className="text-slate-600">{preconsulta.sintomas}</span></p>
                {preconsulta.inicioSintomas && (
                  <p><span className="font-medium text-slate-700">{modal.preconsulta.symptomsStart}</span> <span className="text-slate-600">{preconsulta.inicioSintomas}</span></p>
                )}
                {typeof preconsulta.temperatura === 'number' && (
                  <p><span className="font-medium text-slate-700">{modal.preconsulta.temperature}</span> <span className="text-slate-600">{preconsulta.temperatura.toFixed(1)} °C</span></p>
                )}
                {preconsulta.flags && preconsulta.flags.length > 0 && (
                  <div>
                    <p className="font-medium text-slate-700 mb-1">
                      {preconsulta.aiGenerated ? modal.preconsulta.aiAlerts : modal.preconsulta.alerts}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {preconsulta.flags.map((flag) => (
                        <span key={flag} className="badge badge-red">{flag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {preconsulta.notasPaciente && (
                  <p className="text-slate-600"><span className="font-medium text-slate-700">{modal.preconsulta.patientNotes}</span> {preconsulta.notasPaciente}</p>
                )}
              </div>
            )}
          </div>

          {/* Evolución clínica */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">{d.evolution}</h4>
              {savedMessage && (
                <span className="badge badge-green ml-auto text-xs flex items-center gap-1">
                  <CheckIcon size={10} /> {savedMessage}
                </span>
              )}
            </div>
            {loadingEvolucion ? (
              <div className="skeleton h-24 rounded-lg" />
            ) : (
              <>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder={modal.evolution.placeholder}
                  className="field-input resize-none h-28 text-sm"
                />
                <button
                  onClick={handleGuardarNotas}
                  disabled={guardando}
                  className="btn btn-primary btn-sm mt-2"
                >
                  {guardando ? t('common').saving : d.saveNotes}
                </button>
              </>
            )}
          </div>

          {/* Historia clinica longitudinal */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <InfoIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">{modal.history.title}</h4>
              {historiaMessage && (
                <span className="badge badge-green ml-auto text-xs flex items-center gap-1">
                  <CheckIcon size={10} /> {historiaMessage}
                </span>
              )}
            </div>

            {!turno.paciente ? (
              <div className="alert alert-warning text-xs">
                <InfoIcon size={14} className="shrink-0" />
                <span>{modal.history.noLinkedPatient}</span>
              </div>
            ) : loadingHistoria ? (
              <div className="space-y-2">
                <div className="skeleton h-20 rounded-lg" />
                <div className="skeleton h-20 rounded-lg" />
                <div className="skeleton h-20 rounded-lg" />
              </div>
            ) : (
              <>
                {historiaClinica && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">{modal.history.totalConsults}</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{historiaClinica.resumen.totalConsultas}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">{modal.history.completed}</p>
                      <p className="text-lg font-bold text-emerald-600">{historiaClinica.resumen.consultasCompletadas}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                      <p className="text-[11px] text-slate-500 uppercase tracking-wide">{modal.history.lastConsult}</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {historiaClinica.resumen.ultimaConsulta
                          ? formatClinicInstantDate(historiaClinica.resumen.ultimaConsulta, getLocale(lang))
                          : modal.history.noRecords}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {historiaFields.map((field) => (
                    <div key={field.key}>
                      <label className="field-label">{field.label}</label>
                      <textarea
                        value={(historiaForm[field.key] ?? '') as string}
                        onChange={(e) => setHistoriaForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="field-input resize-none min-h-[72px] text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-slate-500">
                    {modal.history.sharedNote}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => exportarHistoriaClinicaPDF(historiaClinica!, {
                        nombre: turno.profesional?.nombre ?? '',
                        apellido: turno.profesional?.apellido ?? '',
                        especialidad: translateSpecialty(turno.profesional?.especialidad?.nombre),
                        matricula: turno.profesional?.matricula,
                        lugarAtencion: turno.profesional?.lugarAtencion,
                      })}
                      className="btn btn-secondary btn-sm flex items-center gap-1.5"
                      title={modal.history.exportTitle}
                    >
                      {/* Download icon */}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      {modal.history.exportPdf}
                    </button>
                    <button
                      onClick={handleSaveHistoriaClinica}
                      disabled={savingHistoria}
                      className="btn btn-primary btn-sm"
                    >
                      {savingHistoria ? modal.history.saving : modal.history.save}
                    </button>
                  </div>
                </div>

                {historiaClinica && historiaClinica.timeline.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h5 className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">
                      {modal.history.timeline}
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {historiaClinica.timeline.slice(0, 8).map((item) => (
                        <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-700">
                              {formatClinicInstantDate(item.fechaHora, getLocale(lang), { day: 'numeric', month: 'short', year: 'numeric' })}
                              {' · '}
                              {formatClinicInstantTime(item.fechaHora, getLocale(lang))}
                            </p>
                            <span className={estadoBadge(item.estado)}>{estadoLabel(item.estado, status)}</span>
                          </div>
                          {item.evolucion?.contenido && (
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.evolucion.contenido}</p>
                          )}
                          {item.archivos.length > 0 && (
                            <p className="text-[11px] text-slate-500 mt-1">{item.archivos.length} {modal.history.attachedFiles}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Receta e indicaciones post-consulta */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">{modal.prescription.title}</h4>
              {receta?.emitidaAt && (
                <span className="badge badge-blue ml-auto text-xs">
                  {modal.prescription.emitted} {formatClinicInstantDate(receta.emitidaAt, getLocale(lang))}
                </span>
              )}
            </div>

            {loadingReceta ? (
              <div className="skeleton h-24 rounded-lg" />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="field-label">{modal.prescription.diagnosisLabel}</label>
                  <textarea
                    value={recetaForm.diagnostico}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, diagnostico: e.target.value }))}
                    className="field-input resize-none min-h-[72px] text-sm"
                    placeholder={modal.prescription.diagnosisPlaceholder}
                  />
                </div>
                <div>
                  <label className="field-label">{modal.prescription.treatmentPlanLabel}</label>
                  <textarea
                    value={recetaForm.planTratamiento || ''}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, planTratamiento: e.target.value }))}
                    className="field-input resize-none min-h-[64px] text-sm"
                    placeholder={modal.prescription.treatmentPlanPlaceholder}
                  />
                </div>
                <div>
                  <label className="field-label">{modal.prescription.medicinesLabel}</label>
                  <textarea
                    value={recetaForm.medicamentos || ''}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, medicamentos: e.target.value }))}
                    className="field-input resize-none min-h-[72px] text-sm"
                    placeholder={modal.prescription.medicinesPlaceholder}
                  />
                </div>
                <div>
                  <label className="field-label">{modal.prescription.indicationsLabel}</label>
                  <textarea
                    value={recetaForm.indicaciones}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, indicaciones: e.target.value }))}
                    className="field-input resize-none min-h-[88px] text-sm"
                    placeholder={modal.prescription.indicationsPlaceholder}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">{modal.prescription.studiesLabel}</label>
                    <textarea
                      value={recetaForm.estudiosSolicitados || ''}
                      onChange={(e) => setRecetaForm((prev) => ({ ...prev, estudiosSolicitados: e.target.value }))}
                      className="field-input resize-none min-h-[64px] text-sm"
                      placeholder={modal.prescription.studiesPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="field-label">{modal.prescription.nextControlLabel}</label>
                    <input
                      value={recetaForm.proximoControl || ''}
                      onChange={(e) => setRecetaForm((prev) => ({ ...prev, proximoControl: e.target.value }))}
                      className="field-input"
                      placeholder={modal.prescription.nextControlPlaceholder}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">{modal.prescription.warningsLabel}</label>
                  <textarea
                    value={recetaForm.advertencias || ''}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, advertencias: e.target.value }))}
                    className="field-input resize-none min-h-[64px] text-sm"
                    placeholder={modal.prescription.warningsPlaceholder}
                  />
                </div>
                <div>
                  <label className="field-label">{modal.prescription.observationsLabel}</label>
                  <textarea
                    value={recetaForm.observaciones || ''}
                    onChange={(e) => setRecetaForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                    className="field-input resize-none min-h-[64px] text-sm"
                    placeholder={modal.prescription.observationsPlaceholder}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={handleSaveReceta}
                    disabled={savingReceta}
                    className="btn btn-success btn-sm"
                  >
                    {savingReceta ? modal.prescription.issuing : modal.prescription.issue}
                  </button>
                  <button
                    onClick={handleCopyShareText}
                    disabled={!shareText}
                    className="btn btn-secondary btn-sm"
                  >
                    {modal.prescription.copy}
                  </button>
                  {receta && turno.profesional && (
                    <button
                      onClick={() => imprimirReceta({
                        receta,
                        profesional: {
                          nombre: turno.profesional!.nombre,
                          apellido: turno.profesional!.apellido,
                          especialidad: translateSpecialty(turno.profesional!.especialidad?.nombre ?? ''),
                          matricula: turno.profesional!.matricula,
                          lugarAtencion: turno.profesional!.lugarAtencion,
                          telefono: turno.profesional!.telefono,
                          fotoUrl: turno.profesional!.fotoUrl,
                        },
                        paciente: turno.paciente
                          ? { nombre: turno.paciente.nombre, apellido: turno.paciente.apellido, email: turno.paciente.email }
                          : null,
                        fechaHora: turno.fechaHora,
                        modalidad: turno.modalidad,
                      })}
                      className="btn btn-primary btn-sm flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {modal.prescription.downloadPdf}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Certificado médico */}
          {turno.estado === 'COMPLETADO' && (
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

              {loadingCertificado ? (
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
                      })}
                      className="btn btn-primary btn-sm flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {modal.certificate.printPdf}
                    </button>
                    <button
                      onClick={() => { setShowEmitirCertificado(true); setCertificadoForm({ tipo: certificado.tipo, diagnostico: certificado.diagnostico, texto: certificado.texto, diasReposo: certificado.diasReposo || 0 }); }}
                      className="btn btn-secondary btn-sm"
                    >
                      {modal.certificate.edit}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowEmitirCertificado(true)}
                  className="btn btn-primary btn-sm"
                >
                  {modal.certificate.issue}
                </button>
              )}
            </div>
          )}

          {/* Archivos */}
          <div className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <PaperclipIcon size={15} className="text-slate-400" />
              <h4 className="font-semibold text-slate-700 text-sm">{d.files}</h4>
            </div>

            <div className="flex gap-2 mb-3">
              <select value={fileType} onChange={(e) => setFileType(e.target.value)} className="field-select text-xs">
                <option value="LABORATORIO">{modal.files.types.LABORATORIO}</option>
                <option value="IMAGEN">{modal.files.types.IMAGEN}</option>
                <option value="EVOLUCION">{modal.files.types.EVOLUCION}</option>
                <option value="OTRO">{modal.files.types.OTRO}</option>
              </select>
              <label className="flex-1">
                <input type="file" onChange={handleUpload} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.gif" className="hidden" />
                <span className={`btn btn-secondary btn-sm w-full justify-center cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                  {uploading ? common.saving : `+ ${d.uploadFile}`}
                </span>
              </label>
            </div>

            {archivos.length > 0 ? (
              <div className="space-y-2">
                {archivos.map((archivo) => (
                  <div key={archivo.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-2xl shrink-0">
                      {archivo.mimeType?.includes('pdf') ? '📄' : '🖼️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{archivo.nombreOriginal}</p>
                      <p className="text-xs text-slate-400">{fileTypeLabel(archivo.tipo)} · {formatFileSize(archivo.tamanoBytes ?? 0)}</p>
                    </div>
                    <a href={archivo.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost p-1.5 text-blue-500 hover:text-blue-700 text-xs">{modal.files.view}</a>
                    <button onClick={() => handleDeleteArchivo(archivo.id)} className="btn btn-ghost p-1.5 text-red-400 hover:text-red-600">
                      <TrashIcon size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">{d.noFiles}</p>
            )}
          </div>
        </div>

        {/* Reprogramar panel */}
        {showReprogramar && (
          <div className="mx-6 mb-4 border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                <CalendarIcon size={15} className="text-blue-600" />
                {modal.reschedule.title}
              </h4>
              <button onClick={() => setShowReprogramar(false)} className="text-blue-400 hover:text-blue-600">
                <XIcon size={15} />
              </button>
            </div>
            <p className="text-xs text-blue-700">
              {modal.reschedule.patientNotified}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">{modal.reschedule.newDate}</label>
                <input
                  type="date"
                  value={reprogramarFecha}
                  min={getReprogrammingMinDate()}
                  onChange={(e) => {
                    setReprogramarFecha(e.target.value);
                    cargarSlots(e.target.value);
                  }}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">{modal.reschedule.availableTime}</label>
                {cargandoSlots ? (
                  <div className="field-input flex items-center gap-2 text-slate-400 text-sm">
                    <Spinner size={16} />
                    {modal.reschedule.loadingSlots}
                  </div>
                ) : reprogramarSlots.length === 0 ? (
                  <div className="field-input text-slate-400 text-sm">
                    {reprogramarFecha ? modal.reschedule.noAvailability : modal.reschedule.selectDate}
                  </div>
                ) : (
                  <select
                    value={reprogramarHora}
                    onChange={(e) => setReprogramarHora(e.target.value)}
                    className="field-select"
                  >
                    <option value="">{modal.reschedule.selectTime}</option>
                    {reprogramarSlots.map((s) => (
                      <option key={s.hora} value={s.hora}>{s.hora}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setShowReprogramar(false)} className="btn btn-secondary btn-sm">
                {modal.reschedule.cancel}
              </button>
              <button
                onClick={handleReprogramar}
                disabled={reprogramando || !reprogramarFecha || !reprogramarHora}
                className="btn btn-primary btn-sm"
              >
                {reprogramando ? modal.reschedule.reprogramming : modal.reschedule.confirm}
              </button>
            </div>
          </div>
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
        profesionalNombre={turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : modal.fallbackPatient}
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

    {showEmitirCertificado && (
      <EmitirCertificadoModal
        form={certificadoForm}
        setForm={setCertificadoForm}
        onSave={handleSaveCertificado}
        loading={savingCertificado}
        onClose={() => setShowEmitirCertificado(false)}
        translateSpecialty={translateSpecialty}
      />
    )}
    </>
  );
}

export default TurnoModal;
