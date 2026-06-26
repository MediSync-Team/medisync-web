import { fetchApi, buildQuery } from './core';
import type {
  RegisterData,
  LoginData,
  AuthResponse,
  User,
  Especialidad,
  Profesional,
  Slot,
  TipoConsulta,
  Disponibilidad,
  ProfesionalesPaginatedResponse,
  TurnosPaginatedResponse,
  Turno,
  Evolucion,
  PreconsultaTurno,
  PreconsultaInput,
  RecetaIndicacion,
  RecetaIndicacionInput,
  HistorialPaginatedResponse,
  AuditoriaDisponibilidad,
  PagosDashboardResponse,
  PagoEstado,
  PagoPreferenciaResponse,
  ArchivoTurno,
  Paciente,
  TurnoPaciente,
  HistoriaClinicaEditableFields,
  HistoriaClinicaPaciente,
  PacienteStats,
  RecetaPaciente,
  CertificadoPaciente,
  AuditoriaPaginatedResponse,
  StatsResponse,
  RecordatorioTurno,
  SuscripcionEstado,
  Cupon,
  TipoDescuento,
  CuponValidado,
  Notificacion,
  WebhookConfig,
  WebhookEventosPaginatedResponse,
  BloqueoDisponibilidad,
  CertificadoConDatos,
  TipoCertificado,
  ChatMensaje,
  Resena,
  ResenasStats,
  AdminStats,
  AdminAnalytics,
  AdminUsuario,
  AdminProfesional,
  AdminTurno,
  ListaEsperaItem,
  NotificationPreferences,
  ClinicaConRelaciones,
  ClinicaStats,
  ClinicaAgendaTurno,
  InvitacionClinica,
  Clinica,
  InAppNotification,
} from './types';

export * from './core';
export * from './types';

const authApi = {
  register: (data: RegisterData) =>
    fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: LoginData) =>
    fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => fetchApi<User>('/auth/me'),
  forgotPassword: (email: string) =>
    fetchApi<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, newPassword: string) =>
    fetchApi<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),
  exchangeCode: (code: string) =>
    fetchApi<{ token?: string; dest: string }>('/auth/exchange-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  logout: () =>
    fetchApi<{ logged_out: boolean }>('/auth/logout', { method: 'POST' }),
};

const especialidadesApi = {
  getAll: () => fetchApi<Especialidad[]>('/especialidades'),
};

const profesionalesApi = {
  getAll: (params?: {
    especialidad?: string;
    precioMin?: string;
    precioMax?: string;
    modalidad?: string;
    fecha?: string;
    disponibleEstaSemana?: string;
    obraSocial?: string;
    orderBy?: string;
    page?: string;
    limit?: string;
    lat?: string;
    lng?: string;
    distanciaKm?: string;
  }) => {
    const query = buildQuery(params ?? {});
    return fetchApi<ProfesionalesPaginatedResponse>('/profesionales' + query);
  },
  getById: (id: string) => fetchApi<Profesional>(`/profesionales/${id}`),
  getSlots: (id: string, fecha: string, modalidad: string, tipoConsultaId?: string) =>
    fetchApi<Slot[]>(`/profesionales/${id}/slots-disponibles?fecha=${fecha}&modalidad=${modalidad}${tipoConsultaId ? `&tipoConsultaId=${tipoConsultaId}` : ''}`),
  crearDisponibilidad: (id: string, data: { diaSemana: number; horaInicio: string; horaFin: string; modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'AMBOS'; lugarAtencion?: string }) =>
    fetchApi<Disponibilidad>(`/profesionales/${id}/disponibilidad`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  eliminarDisponibilidad: (id: string, dispId: string) =>
    fetchApi<void>(`/profesionales/${id}/disponibilidad/${dispId}`, { method: 'DELETE' }),
  getTiposConsulta: (id: string) =>
    fetchApi<TipoConsulta[]>(`/profesionales/${id}/tipos-consulta`),
  crearTipoConsulta: (id: string, data: { nombre: string; duracionMin: number; precio?: number | null; color?: string | null; orden?: number }) =>
    fetchApi<TipoConsulta>(`/profesionales/${id}/tipos-consulta`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  actualizarTipoConsulta: (id: string, tipoId: string, data: { nombre: string; duracionMin: number; precio?: number | null; color?: string | null; orden?: number }) =>
    fetchApi<TipoConsulta>(`/profesionales/${id}/tipos-consulta/${tipoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  eliminarTipoConsulta: (id: string, tipoId: string) =>
    fetchApi<{ deleted: boolean }>(`/profesionales/${id}/tipos-consulta/${tipoId}`, { method: 'DELETE' }),
};

const turnosApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const query = buildQuery(params ? { page: params.page, limit: params.limit } : {});
    return fetchApi<TurnosPaginatedResponse>('/turnos' + query);
  },
  getMisTurnos: (params?: { tipo?: string; estado?: string; page?: number; limit?: number }) => {
    const query = buildQuery(params ? {
      tipo: params.tipo,
      estado: params.estado,
      page: params.page,
      limit: params.limit,
    } : {});
    return fetchApi<TurnosPaginatedResponse>('/turnos/mis-turnos' + query);
  },
  getByProfesional: (id: string, params?: Record<string, string | number | boolean | undefined>) => {
    return fetchApi<TurnosPaginatedResponse>(`/turnos/profesional/${id}${buildQuery(params || {})}`);
  },
  getById: (id: string) => fetchApi<Turno>(`/turnos/${id}`),
  updateEstado: (id: string, estado: Turno['estado'], notasCancelacion?: string) =>
    fetchApi<Turno>(`/turnos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, notasCancelacion }),
    }),
  reprogramar: (id: string, data: { fechaHora: string; modalidad?: 'PRESENCIAL' | 'VIRTUAL' }) =>
    fetchApi<Turno>(`/turnos/${id}/reprogramar`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reservar: (data: {
    profesionalId: string;
    fechaHora: string;
    modalidad: 'PRESENCIAL' | 'VIRTUAL';
    tipoConsultaId?: string;
  }) =>
    fetchApi<{ turno: Turno; linkPago: null }>('/turnos/reservar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPoliticaCancelacion: () =>
    fetchApi<{ horasMinimas: number }>('/turnos/politica-cancelacion'),
  getEvolucion: (id: string) =>
    fetchApi<Evolucion | null>(`/turnos/${id}/evolucion`),
  guardarEvolucion: (id: string, contenido: string) =>
    fetchApi<Evolucion>(`/turnos/${id}/evolucion`, {
      method: 'POST',
      body: JSON.stringify({ contenido }),
    }),
  getPreconsulta: (id: string) =>
    fetchApi<PreconsultaTurno>(`/turnos/${id}/preconsulta`),
  updatePreconsulta: (id: string, data: PreconsultaInput) =>
    fetchApi<PreconsultaTurno>(`/turnos/${id}/preconsulta`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getVideoToken: (id: string) =>
    fetchApi<{ ticket: string; roomId: string; iceServers?: RTCIceServer[] }>(`/turnos/${id}/video-token`),
  getReceta: (id: string) =>
    fetchApi<RecetaIndicacion | null>(`/turnos/${id}/receta`),
  guardarReceta: (id: string, data: RecetaIndicacionInput) =>
    fetchApi<{ receta: RecetaIndicacion; shareText: string }>(`/turnos/${id}/receta`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  miHistorial: (params?: { page?: number; limit?: number }) => {
    const query = buildQuery(params ? { page: params.page, limit: params.limit } : {});
    return fetchApi<HistorialPaginatedResponse>('/turnos/mi-historial' + query);
  },
  getAuditoriaCancelacion: (id: string) =>
    fetchApi<AuditoriaDisponibilidad | null>(`/turnos/${id}/auditoria-cancelacion`),
};

const pagosApi = {
  getByProfesional: (params?: { desde?: string; hasta?: string; estado?: string; page?: number; limit?: number }) => {
    const query = buildQuery(params ?? {});
    return fetchApi<PagosDashboardResponse>(`/profesional/pagos${query}`);
  },
  getEstado: (turnoId: string) => fetchApi<PagoEstado>(`/pagos/estado/${turnoId}`),
  crearPreferencia: (data: { turnoId: string; cuponCodigo?: string }) =>
    fetchApi<PagoPreferenciaResponse>('/pagos/crear-preferencia', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmarPago: (turnoId: string) =>
    fetchApi<{ confirmed: boolean; estado: string | null; turnoEstado?: Turno['estado'] }>(`/pagos/confirmar-pago${buildQuery({ turnoId })}`, {
      method: 'POST',
    }),
};

const archivosApi = {
  getByTurno: (turnoId: string) => fetchApi<ArchivoTurno[]>(`/archivos/turno/${turnoId}`),
  subir: (turnoId: string, archivo: File, tipo: string) => {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipo', tipo);
    return fetchApi<ArchivoTurno>(`/archivos/${turnoId}`, {
      method: 'POST',
      body: formData,
    });
  },
  eliminar: (id: string) => fetchApi<{ deleted: boolean }>(`/archivos/${id}`, { method: 'DELETE' }),
};

export const api = {
  auth: authApi,
  especialidades: especialidadesApi,
  profesionales: profesionalesApi,
  turnos: turnosApi,
  pacientes: {
    updatePerfil: (data: Partial<Paciente>) =>
      fetchApi<Paciente>('/pacientes/perfil', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getPerfil: () => fetchApi<Paciente & {
      antecedentesPersonales?: string;
      antecedentesFamiliares?: string;
      alergias?: string;
      medicacionActual?: string;
      habitos?: string;
      diagnosticosPrevios?: string;
      notasClinicasGenerales?: string;
    }>('/pacientes/perfil'),
    getHistorial: () => fetchApi<{ turnos: TurnoPaciente[] }>('/pacientes/mi-historial'),
    updateHistoriaClinica: (pacienteId: string, data: Partial<HistoriaClinicaEditableFields>) =>
      fetchApi<HistoriaClinicaEditableFields & { id: string; updatedAt: string }>(`/pacientes/${pacienteId}/historia-clinica`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getHistoriaClinica: (pacienteId: string) =>
      fetchApi<HistoriaClinicaPaciente & {
        paciente: {
          antecedentesPersonales?: string;
          antecedentesFamiliares?: string;
          alergias?: string;
          medicacionActual?: string;
          habitos?: string;
          diagnosticosPrevios?: string;
          notasClinicasGenerales?: string;
        };
        resumen: { totalConsultas: number; consultasCompletadas: number; ultimaConsulta: string | null };
        timeline: { id: string; fechaHora: string; estado: string; evolucion?: { contenido: string }; archivos: { id: string }[] }[];
      }>(`/pacientes/${pacienteId}/historia-clinica`),
    getMisStats: () => fetchApi<PacienteStats>('/pacientes/mis-stats'),
    getMisRecetas: () => fetchApi<{ recetas: RecetaPaciente[] }>('/pacientes/mis-recetas'),
    getMisCertificados: () => fetchApi<{ certificados: CertificadoPaciente[] }>('/pacientes/mis-certificados'),
  },
  profesional: {
    updatePerfil: (id: string, data: Partial<Profesional>) =>
      fetchApi<Profesional>(`/profesionales/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getPagos: (params?: { desde?: string; hasta?: string; estado?: string; page?: number; limit?: number }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<PagosDashboardResponse>(`/profesional/pagos${query}`);
    },
    getAuditoria: (id: string, params?: { page?: number; limit?: number; tipoEvento?: string; desde?: string; hasta?: string }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<AuditoriaPaginatedResponse>(`/profesionales/${id}/auditoria${query}`);
    },
    getStats: () => fetchApi<StatsResponse>('/profesional/stats'),
    getMisObrasSociales: () => fetchApi<{ obrasSociales: string[] }>('/profesional/obras-sociales'),
  },
  recordatorios: {
    getProfesional: () => fetchApi<{ turnos: RecordatorioTurno[] }>('/recordatorios/profesional'),
    getPaciente: () => fetchApi<{ turnos: RecordatorioTurno[] }>('/recordatorios/paciente'),
  },
  pagos: {
    ...pagosApi,
  },
  suscripciones: {
    estado: () => fetchApi<SuscripcionEstado>('/suscripciones/estado'),
    iniciar: () => fetchApi<{ initPoint: string }>('/suscripciones/iniciar', { method: 'POST' }),
    cancelar: () => fetchApi<{ cancelada: boolean }>('/suscripciones/cancelar', { method: 'POST' }),
  },
  obrasSociales: {
    getAll: () => fetchApi<string[]>('/obras-sociales'),
  },
  cupones: {
    getAll: () => fetchApi<Cupon[]>('/cupones'),
    listar: () => fetchApi<Cupon[]>('/cupones'),
    crear: (data: { codigo: string; tipo: TipoDescuento; valor: number; descripcion?: string; maxUsos?: number; expiresAt?: string }) =>
      fetchApi<Cupon>('/cupones', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    actualizar: (id: string, data: Partial<Cupon>) =>
      fetchApi<Cupon>(`/cupones/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    eliminar: (id: string) => fetchApi<void>(`/cupones/${id}`, { method: 'DELETE' }),
    validar: (codigo: string, turnoId: string) =>
      fetchApi<CuponValidado>('/cupones/validar', {
        method: 'POST',
        body: JSON.stringify({ codigo, turnoId }),
      }),
  },
  notificaciones: {
    getUnreadCount: () => fetchApi<{ count: number }>('/notificaciones/unread-count'),
    getAll: () => fetchApi<Notificacion[]>('/notificaciones'),
    marcarLeida: (id: string) =>
      fetchApi<Notificacion>(`/notificaciones/${id}/leer`, { method: 'POST' }),
    marcarTodasLeidas: () =>
      fetchApi<{ updated: number }>('/notificaciones/marcar-todas-leidas', { method: 'POST' }),
  },
  webhook: {
    getConfig: () => fetchApi<WebhookConfig>('/webhook/config'),
    updateConfig: (data: Partial<WebhookConfig>) =>
      fetchApi<WebhookConfig>('/webhook/config', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getEventos: (params?: { page?: number; limit?: number }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<WebhookEventosPaginatedResponse>('/webhook/eventos' + query);
    },
  },
  bloqueos: {
    getMisBloqueos: () => fetchApi<BloqueoDisponibilidad[]>('/bloqueos'),
    crear: (data: { fechaInicio: string; fechaFin: string; horaInicio?: string; horaFin?: string; motivo?: string }) =>
      fetchApi<BloqueoDisponibilidad>('/bloqueos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    eliminar: (id: string) => fetchApi<void>(`/bloqueos/${id}`, { method: 'DELETE' }),
  },
  certificados: {
    getByTurno: (turnoId: string) => fetchApi<CertificadoConDatos>(`/certificados/turno/${turnoId}`),
    emitir: (data: { turnoId: string; tipo: TipoCertificado; diagnostico: string; texto: string; diasReposo?: number }) =>
      fetchApi<CertificadoConDatos>('/certificados', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  archivos: archivosApi,
  chat: {
    getUnreadGlobal: () => fetchApi<{ count: number }>('/chat/unread-global'),
    getUnread: (turnoId: string) => fetchApi<{ count: number }>(`/chat/${turnoId}/unread`),
    getMensajes: (turnoId: string) => fetchApi<{ id: string; remitenteId: string; contenido: string; createdAt: string }[]>(`/chat/${turnoId}`),
    enviar: (turnoId: string, contenido: string) =>
      fetchApi<ChatMensaje>(`/chat/${turnoId}`, {
        method: 'POST',
        body: JSON.stringify({ contenido }),
      }),
  },
  google: {
    getStatus: () => fetchApi<{ connected: boolean }>('/google/status'),
    getAuthUrl: () => fetchApi<{ url: string }>('/google/auth-url'),
    disconnect: () => fetchApi<void>('/google/disconnect', { method: 'DELETE' }),
  },
  resenas: {
    getByProfesional: (profesionalId: string, params?: { page?: number; limit?: number }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<{ resenas: Resena[]; stats: ResenasStats; pagination: { page: number; totalPages: number; total: number } }>(`/resenas/profesional/${profesionalId}${query}`);
    },
    getMisResenas: (params?: { page?: number; limit?: number; rating?: number }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<{ resenas: Resena[]; stats: ResenasStats; pagination: { page: number; totalPages: number; total: number } }>(`/resenas/mis-resenas${query}`);
    },
    getMiResena: (turnoId: string) => fetchApi<Resena | null>(`/resenas/mi-resena/${turnoId}`),
    crear: (data: { turnoId: string; rating: number; comentario?: string }) =>
      fetchApi<Resena>('/resenas', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    responder: (id: string, respuesta: string) =>
      fetchApi<Resena>(`/resenas/${id}/respuesta`, {
        method: 'PATCH',
        body: JSON.stringify({ respuesta }),
      }),
    borrarRespuesta: (id: string) =>
      fetchApi<Resena>(`/resenas/${id}/respuesta`, { method: 'DELETE' }),
  },
  admin: {
    getStats: () => fetchApi<AdminStats>('/admin/stats'),
    getAnalytics: () => fetchApi<AdminAnalytics>('/admin/analytics'),
    getUsuarios: (params?: { page?: number; limit?: number; search?: string }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<{ usuarios: AdminUsuario[]; pagination: { page: number; totalPages: number; total: number; limit: number } }>(`/admin/usuarios${query}`);
    },
    toggleActivo: (id: string) => fetchApi<{ activo: boolean }>(`/admin/usuarios/${id}/toggle-activo`, { method: 'PATCH' }),
    getProfesionales: (params?: { page?: number; limit?: number; search?: string }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<{ profesionales: AdminProfesional[]; pagination: { page: number; totalPages: number; total: number; limit: number } }>(`/admin/profesionales${query}`);
    },
    getTurnos: (params?: { page?: number; limit?: number; search?: string; estado?: string }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<{ turnos: AdminTurno[]; pagination: { page: number; totalPages: number; total: number; limit: number } }>(`/admin/turnos${query}`);
    },
    crearEspecialidad: (data: { nombre: string; descripcion?: string; icono?: string }) =>
      fetchApi<Especialidad>('/admin/especialidades', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    editarEspecialidad: (id: string, data: { nombre: string; descripcion?: string; icono?: string }) =>
      fetchApi<Especialidad>(`/admin/especialidades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    eliminarEspecialidad: (id: string) => fetchApi<void>(`/admin/especialidades/${id}`, { method: 'DELETE' }),
  },
  listaEspera: {
    misSuscripciones: () => fetchApi<ListaEsperaItem[]>('/lista-espera/mis-suscripciones'),
    suscribirme: (data: { profesionalId: string; fecha: string; modalidad: string }) =>
      fetchApi<ListaEsperaItem>('/lista-espera/suscribirme', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    cancelar: (id: string) => fetchApi<void>(`/lista-espera/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    getPreferences: () => fetchApi<NotificationPreferences>('/notifications/preferences'),
    updatePreferences: (data: Partial<NotificationPreferences>) =>
      fetchApi<NotificationPreferences>('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    sendTest: (canal: 'EMAIL' | 'WHATSAPP') =>
      fetchApi<void>('/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ canal }),
      }),
    subscribePush: (data: { endpoint: string; p256dh: string; auth: string }) =>
      fetchApi<void>('/notifications/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    unsubscribePush: (data: { endpoint: string }) =>
      fetchApi<void>('/notifications/push/subscribe', {
        method: 'DELETE',
        body: JSON.stringify(data),
      }),
    testPush: () => fetchApi<void>('/notifications/push/test', { method: 'POST' }),
  },
};

export const clinicasApi = {
  getMe: () => fetchApi<ClinicaConRelaciones>('/clinicas/me'),
  updateMe: (data: Partial<ClinicaConRelaciones>) =>
    fetchApi<ClinicaConRelaciones>('/clinicas/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getStats: () => fetchApi<ClinicaStats>('/clinicas/me/stats'),
  getAgenda: (fecha: string) => fetchApi<ClinicaAgendaTurno[]>(`/clinicas/me/agenda${buildQuery({ fecha })}`),
  invitar: (email: string) =>
    fetchApi<{ id: string; email: string; expiresAt: string }>('/clinicas/me/invitar', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  cancelarInvitacion: (id: string) =>
    fetchApi<{ cancelled: boolean }>(`/clinicas/me/invitaciones/${id}`, { method: 'DELETE' }),
  removerProfesional: (id: string) =>
    fetchApi<{ removed: boolean }>(`/clinicas/me/profesionales/${id}`, { method: 'DELETE' }),
  getInvitacion: (token: string) =>
    fetchApi<InvitacionClinica & { clinica: Pick<Clinica, 'nombre' | 'descripcion' | 'logoUrl' | 'direccion'> }>(`/clinicas/invitaciones/${token}`),
  aceptarInvitacion: (token: string) =>
    fetchApi<{ accepted: boolean; clinica: string }>(`/clinicas/invitaciones/${token}/aceptar`, { method: 'POST' }),
  rechazarInvitacion: (token: string) =>
    fetchApi<{ rejected: boolean }>(`/clinicas/invitaciones/${token}/rechazar`, { method: 'POST' }),
};

export const notificationsApi = {
  getInbox: () =>
    fetchApi<{ notifs: InAppNotification[]; unread: number }>('/notifications/inbox'),
  markRead: (id: string) =>
    fetchApi<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () =>
    fetchApi<void>('/notifications/read-all', { method: 'PATCH' }),
};
