export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const hasBody = options.body !== undefined && options.body !== null;
  const headers = new Headers(options.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: options.credentials ?? 'include',
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data: ApiResponse<T> | null = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.error?.message || `Error HTTP ${response.status}`);
    }

    if (!data?.success) {
      throw new Error(data?.error?.message || 'Error desconocido');
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servidor. Verificá la URL del API y CORS.');
    }
    throw error;
  }
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  const q = new URLSearchParams();
  for (const [k, v] of entries) {
    q.set(k, String(v));
  }
  return '?' + q.toString();
}

export const api = {
  auth: {
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
    exchangeCode: (code: string) =>
      fetchApi<{ token?: string; dest: string }>('/auth/exchange-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    logout: () =>
      fetchApi<{ logged_out: boolean }>('/auth/logout', { method: 'POST' }),
  },
  especialidades: {
    getAll: () => fetchApi<Especialidad[]>('/especialidades'),
  },
  profesionales: {
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
    }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<ProfesionalesPaginatedResponse>('/profesionales' + query);
    },
    getById: (id: string) => fetchApi<{ profesional: Profesional; disponibilidades: Disponibilidad[] }>(`/profesionales/${id}`),
    getSlots: (id: string, fecha: string, modalidad: string) =>
      fetchApi<{ hora: string; disponible: boolean }[]>(`/profesionales/${id}/slots-disponibles?fecha=${fecha}&modalidad=${modalidad}`),
    crearDisponibilidad: (id: string, data: { diaSemana: number; horaInicio: string; horaFin: string; modalidad: 'PRESENCIAL' | 'VIRTUAL'; lugarAtencion?: string }) =>
      fetchApi<Disponibilidad>(`/profesionales/${id}/disponibilidad`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    eliminarDisponibilidad: (id: string, dispId: string) =>
      fetchApi<void>(`/profesionales/${id}/disponibilidad/${dispId}`, { method: 'DELETE' }),
  },
  turnos: {
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
    reprogramar: (id: string, data: { fechaHora: string; modalidad?: 'PRESENCIAL' | 'VIRTUAL' }) =>
      fetchApi<Turno>(`/turnos/${id}/reprogramar`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reservar: (data: {
      profesionalId: string;
      fechaHora: string;
      modalidad: 'PRESENCIAL' | 'VIRTUAL';
      paciente?: { nombre?: string; apellido?: string; email?: string; telefono?: string };
    }) =>
      fetchApi<{ turno: Turno; linkPago: null }>('/turnos/reservar', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getPoliticaCancelacion: () =>
      fetchApi<{ horasMinimas: number }>('/turnos/politica-cancelacion'),
    getPreconsulta: (id: string) =>
      fetchApi<PreconsultaTurno>(`/turnos/${id}/preconsulta`),
    updatePreconsulta: (id: string, data: PreconsultaInput) =>
      fetchApi<PreconsultaTurno>(`/turnos/${id}/preconsulta`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getVideoToken: (id: string) =>
      fetchApi<{ ticket: string; roomId: string }>(`/turnos/${id}/video-token`),
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
  },
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
    getByProfesional: (params?: { desde?: string; hasta?: string; estado?: string; page?: number; limit?: number }) => {
      const query = buildQuery(params ?? {});
      return fetchApi<PagosDashboardResponse>(`/profesional/pagos${query}`);
    },
  },
  suscripciones: {
    estado: () => fetchApi<SuscripcionEstado>('/suscripciones/estado'),
    iniciar: () => fetchApi<{ initPoint: string }>('/suscripciones/iniciar', { method: 'POST' }),
    cancelar: () => fetchApi<{ cancelada: boolean }>('/suscripciones/cancelar', { method: 'POST' }),
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
  chat: {
    getUnread: (turnoId: string) => fetchApi<{ count: number }>(`/chat/${turnoId}/unread`),
    getMensajes: (turnoId: string) => fetchApi<{ id: string; remitenteId: string; contenido: string; createdAt: string }[]>(`/chat/${turnoId}`),
    enviar: (turnoId: string, contenido: string) =>
      fetchApi<{ id: string }>(`/chat/${turnoId}`, {
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
      fetchApi<ListaEsperaItem>('/lista-espera', {
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

export type RegisterData = {
  email: string;
  password: string;
  rol: 'PROFESIONAL' | 'PACIENTE' | 'CLINICA';
  nombre: string;
  apellido: string;
  telefono?: string;
  genero?: Genero;
  matricula?: string;
  especialidadId?: string;
  precioConsulta?: number;
  lugarAtencion?: string;
  bio?: string;
  fotoUrl?: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token?: string;
  user: {
    id: string;
    email: string;
    rol: 'PROFESIONAL' | 'PACIENTE' | 'ADMIN' | 'CLINICA';
    perfil?: Profesional | Paciente;
  };
};

export type User = {
  id: string;
  email: string;
  rol: 'PROFESIONAL' | 'PACIENTE' | 'ADMIN' | 'CLINICA';
  profesional?: Profesional;
  paciente?: Paciente;
  clinica?: Clinica;
};

export type Especialidad = {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
};

export type Genero = 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'NO_ESPECIFICADO';

export type Profesional = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  genero: Genero;
  precioConsulta: number;
  matricula?: string;
  bio?: string;
  lugarAtencion?: string;
  obrasSociales?: string[];
  fotoUrl?: string;
  activo?: boolean;
  clinicaId?: string | null;
  especialidad: Especialidad;
  disponibilidades?: Disponibilidad[];
  ratingPromedio?: number | null;
  totalResenas?: number;
};

export type Resena = {
  id: string;
  pacienteId: string;
  profesionalId: string;
  turnoId: string;
  rating: number;
  comentario?: string;
  respuesta?: string;
  respondidaAt?: string;
  createdAt: string;
  paciente?: { nombre: string; apellido: string; fotoUrl?: string };
  turno?: { fechaHora: string };
};

export type ResenasStats = {
  promedio: number | null;
  total: number;
  distribucion?: Record<string, number>;
};

export type Disponibilidad = {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  lugarAtencion?: string;
  activo: boolean;
};

export type Turno = {
  id: string;
  pacienteId: string;
  profesionalId: string;
  fechaHora: string;
  estado: 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE';
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  motivo?: string;
  precio: number;
  cuponId?: string;
  createdAt: string;
  updatedAt: string;
  lugarAtencion?: string;
  preconsultaRiesgo?: string;
  preconsultaCompletadaAt?: string;
  notasCancelacion?: string;
  paciente?: Paciente;
  profesional?: Profesional;
  preconsulta?: PreconsultaTurno;
  resena?: Resena;
};

export type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  genero?: Genero;
  fotoUrl?: string;
  fechaNacimiento?: string;
  obrasSociales?: string[];
  dni?: string;
  obraSocial?: string;
};

export type Clinica = {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
};

export type TurnosPaginatedResponse = {
  turnos: Turno[];
  total: number;
  page: number;
  limit: number;
  pagination?: { total: number; totalPages: number; page: number; limit: number };
};

export type ProfesionalesPaginatedResponse = {
  profesionales: Profesional[];
  total: number;
  page: number;
  limit: number;
  pagination?: { total: number; totalPages: number; page: number; limit: number };
};

export type PreconsultaTurno = {
  id: string;
  turnoId: string;
  motivo?: string;
  sintomas?: string;
  alergias?: string;
  medicacion?: string;
  historia?: string;
  completadaAt?: string;
  riesgo?: 'BAJO' | 'MEDIO' | 'ALTO' | 'URGENTE';
  escalaDolor?: number;
  escalaAnsiedad?: number;
  inicioSintomas?: string;
  temperatura?: number;
  notasPaciente?: string;
  aiGenerated?: boolean;
  resumen?: string;
  flags?: string[];
};

export type PreconsultaInput = {
  motivo?: string;
  sintomas?: string;
  alergias?: string;
  medicacion?: string;
  historia?: string;
};

export type RecetaIndicacion = {
  id: string;
  turnoId: string;
  diagnostico: string;
  indicaciones: string;
  planTratamiento?: string;
  medicamentos?: string;
  estudiosSolicitados?: string;
  proximoControl?: string;
  advertencias?: string;
  observaciones?: string;
  emitidaAt?: string;
  createdAt: string;
  updatedAt?: string;
};

export type RecetaIndicacionInput = {
  diagnostico: string;
  indicaciones: string;
  planTratamiento?: string;
  medicamentos?: string;
  estudiosSolicitados?: string;
  proximoControl?: string;
  advertencias?: string;
  observaciones?: string;
};

export type HistorialPaginatedResponse = {
  turnos: Turno[];
  total: number;
  page: number;
  limit: number;
};

export type HistorialTurno = Turno;

export type PacienteStats = {
  totalTurnos: number;
  turnosCompletados: number;
  turnosCancelados: number;
};

export type RecetaPaciente = {
  id: string;
  turnoId: string;
  fechaHora: string;
  receta: {
    diagnostico: string;
    medicamentos: { nombre: string; dosis: string; frecuencia: string; duracion: string }[];
    indicaciones: string;
    planTratamiento?: string;
    estudiosSolicitados?: string;
    proximoControl?: string;
    advertencias?: string;
    observaciones?: string;
    emitidaAt: string;
  };
  profesional: { nombre: string; apellido: string; especialidad: { nombre: string }; fotoUrl?: string };
};

export type CertificadoPaciente = {
  id: string;
  turnoId: string;
  fechaHora: string;
  certificado: {
    id: string;
    turnoId: string;
    tipo: TipoCertificado;
    diagnostico: string;
    texto: string;
    diasReposo?: number;
    emitidaAt: string;
    createdAt: string;
  };
  profesional: { nombre: string; apellido: string; especialidad: { nombre: string } };
};

export type PagosDashboardResponse = {
  pagos: Pago[];
  total: number;
  page: number;
  limit: number;
  mesesResumen?: { mes: string; bruto: number; neto: number; cantidad: number }[];
  totales?: { bruto: number; neto: number; pendiente: number; aprobados: number; pendientes: number };
  pagination?: { pages: number; total: number };
};

export type Pago = {
  id: string;
  turnoId: string;
  monto: number;
  montoNeto?: number;
  comisionPorcentaje?: number;
  mpPaymentId?: string;
  estado: string;
  metodo?: string;
  fechaPago?: string;
  createdAt: string;
  turno?: Turno;
};

export type SuscripcionEstado = {
  plan: PlanProfesional;
  estado: string;
  fechaInicio?: string;
  fechaVencimiento?: string;
  planVenceAt?: string;
  turnosEsteMes: number;
  limiteTurnos: number;
  turnosRestantes?: number;
};

export type PlanProfesional = 'FREE' | 'PRO';

export type Cupon = {
  id: string;
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  descripcion?: string;
  maxUsos?: number;
  usosActuales: number;
  activo: boolean;
  expiresAt?: string;
  createdAt: string;
};

export type TipoDescuento = 'PORCENTAJE' | 'MONTO_FIJO';

export type CuponValidado = {
  cuponId: string;
  tipo: string;
  valor: number;
  descripcion: string | null;
  montoOriginal: number;
  montoDescuento: number;
  montoFinal: number;
};

export type Notificacion = {
  id: string;
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
};

export type NotificationPreferences = {
  notifEmail?: boolean;
  notifWhatsapp?: boolean;
  aceptaRecordatorios?: boolean;
  notifRecordatorio24h?: boolean;
  notifRecordatorio2h?: boolean;
  notifPush?: boolean;
};

export type WebhookConfig = {
  url: string;
  secret?: string;
  eventos: string[];
  activo: boolean;
};

export type WebhookEventosPaginatedResponse = {
  eventos: WebhookEvento[];
  total: number;
  page: number;
  limit: number;
};

export type WebhookEvento = {
  id: string;
  tipo: string;
  payload: Record<string, unknown>;
  exito: boolean;
  respuestaHttp?: number;
  createdAt: string;
};

export type RecordatorioTurno = {
  id: string;
  fechaHora: string;
  paciente?: { nombre: string; apellido: string };
  profesional?: { nombre: string; apellido: string };
  estado: string;
  modalidad: string;
};

export type AuditoriaDisponibilidad = {
  id: string;
  tipoEvento: string;
  profesionalId: string;
  disponibilidadId?: string;
  turnoId?: string;
  datosAnteriores?: Record<string, unknown>;
  datosNuevos?: Record<string, unknown>;
  createdAt: string;
};

export type AuditoriaPaginatedResponse = {
  auditoria: AuditoriaDisponibilidad[];
  data?: AuditoriaDisponibilidad[];
  total: number;
  page: number;
  limit: number;
  meta?: { total: number };
};

export type StatsResponse = {
  totalTurnos: number;
  totalPacientes: number;
  totalIngresos: number;
  turnosPorEstado: Record<string, number>;
};

export type HistoriaClinicaPaciente = {
  id: string;
  pacienteId: string;
  fecha: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  observaciones?: string;
  profesional?: { nombre: string; apellido: string };
  turno?: Turno;
};

export type HistoriaClinicaEditableFields = {
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  observaciones?: string;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  alergias?: string;
  medicacionActual?: string;
  habitos?: string;
  diagnosticosPrevios?: string;
  notasClinicasGenerales?: string;
};

export type TurnoPaciente = {
  id: string;
  fechaHora: string;
  estado: string;
  modalidad: string;
  precio: number;
  profesional?: { nombre: string; apellido: string; especialidad: { nombre: string } };
  preconsulta?: PreconsultaTurno;
  resena?: Resena;
};

export type BloqueoDisponibilidad = {
  id: string;
  profesionalId: string;
  fechaInicio: string;
  fechaFin: string;
  horaInicio?: string;
  horaFin?: string;
  motivo?: string;
  createdAt: string;
};

export type CertificadoConDatos = {
  id: string;
  turnoId: string;
  tipo: TipoCertificado;
  datos?: Record<string, string>;
  diagnostico: string;
  texto: string;
  diasReposo?: number;
  contenido: string;
  emitidaAt?: string;
  createdAt: string;
};

export type TipoCertificado = 'AUSENTISMO' | 'ALTA_MEDICA' | 'REPOSO' | 'CONSULTA' | 'APTITUD' | 'LIBRE' | 'OTRO';

export type Evolucion = {
  id: string;
  turnoId: string;
  contenido: string;
  createdAt: string;
};

export type InAppNotification = {
  id: string;
  usuarioId: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
};

export type ListaEsperaItem = {
  id: string;
  profesionalId: string;
  fecha: string;
  modalidad: string;
  estado: string;
  profesional?: { nombre: string; apellido: string; especialidad?: { nombre: string } };
};

export type AdminStats = {
  totalUsuarios: number;
  totalProfesionales: number;
  totalPacientes: number;
  totalTurnos: number;
  totalEspecialidades: number;
  totalResenas: number;
  ingresosAprobados: number;
  turnosUltimos30: number;
  registrosUltimos30: number;
  turnosPorEstado: Record<string, number>;
};

export type AdminAnalytics = {
  revenueTotal: number;
  comisionesTotal: number;
  tasaCompletado: number;
  tasaCancelacion: number;
  revenueByMonth: { month: string; revenue: number }[];
  turnosByMonth: { month: string; count: number }[];
  turnosPorEspecialidad: { especialidad: string; count: number }[];
  topProfesionales: { id: string; nombre: string; apellido: string; especialidad: string; completados: number; revenue: number }[];
};

export type AdminUsuario = {
  id: string;
  email: string;
  rol: string;
  createdAt: string;
  profesional?: AdminProfesional;
  paciente?: Paciente;
};

export type AdminProfesional = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  especialidad: Especialidad;
  precioConsulta: number;
  ratingPromedio: number | null;
  totalResenas: number;
  activo: boolean;
  usuario: { email: string };
  _count: { turnos: number };
};

export type AdminTurno = {
  id: string;
  fechaHora: string;
  estado: string;
  modalidad: string;
  profesional: { nombre: string; apellido: string; especialidad: { nombre: string } };
  paciente?: { nombre: string; apellido: string };
  pago?: { monto: number };
};

export type ClinicaConRelaciones = {
  id: string;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  profesionales: Profesional[];
  invitaciones: InvitacionClinica[];
};

export type ClinicaStats = {
  turnosHoy: number;
  turnosMes: number;
  ingresosMes: number;
  profesionalesActivos: number;
  cancelacionesMes: number;
};

export type ClinicaAgendaTurno = {
  id: string;
  fechaHora: string;
  estado: string;
  modalidad: string;
  paciente?: { nombre: string; apellido: string };
  profesional: { nombre: string; apellido: string; especialidad?: { nombre: string } };
};

export type InvitacionClinica = {
  id: string;
  email: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'EXPIRADA';
  expiresAt: string;
  createdAt: string;
};

export const notificationsApi = {
  getInbox: () =>
    fetchApi<{ notifs: InAppNotification[]; unread: number }>('/notifications/inbox'),
  markRead: (id: string) =>
    fetchApi<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () =>
    fetchApi<void>('/notifications/read-all', { method: 'PATCH' }),
};
