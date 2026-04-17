export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Error desconocido');
  }

  return data.data as T;
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
  },
  especialidades: {
    getAll: () => fetchApi<Especialidad[]>('/especialidades'),
  },
  profesionales: {
    getAll: (params?: {
      especialidad?: string;
      precioMin?: string;
      precioMax?: string;
      modalidad?: 'PRESENCIAL' | 'VIRTUAL';
      fecha?: string;
      orderBy?: 'precio_asc' | 'precio_desc' | 'nombre_asc';
      page?: string;
      limit?: string;
    }) => {
      const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
      return fetchApi<ProfesionalesResponse>(`/profesionales${query}`);
    },
    getById: (id: string) => fetchApi<Profesional>(`/profesionales/${id}`),
    getSlots: (id: string, fecha: string, modalidad?: string) => {
      const params = new URLSearchParams({ fecha });
      if (modalidad) params.append('modalidad', modalidad);
      return fetchApi<Slot[]>(`/profesionales/${id}/slots-disponibles?${params}`);
    },
    crearDisponibilidad: (profesionalId: string, data: { diaSemana: number; horaInicio: string; horaFin: string; modalidad: string }) =>
      fetchApi<Disponibilidad>(`/profesionales/${profesionalId}/disponibilidad`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    eliminarDisponibilidad: (profesionalId: string, disponibilidadId: string) =>
      fetchApi<{ deleted: boolean }>(`/profesionales/${profesionalId}/disponibilidad/${disponibilidadId}`, {
        method: 'DELETE',
      }),
  },
  turnos: {
    reservar: (data: ReservarTurnoData) =>
      fetchApi<{ turno: Turno; linkPago: string | null }>('/turnos/reservar', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    misTurnos: (params?: { tipo?: 'proximos' | 'pasados'; page?: number; limit?: number }) => {
      const q: Record<string, string> = {};
      if (params?.tipo)  q.tipo  = params.tipo;
      if (params?.page)  q.page  = String(params.page);
      if (params?.limit) q.limit = String(params.limit);
      const query = Object.keys(q).length ? '?' + new URLSearchParams(q).toString() : '';
      return fetchApi<TurnosPaginatedResponse>('/turnos/mis-turnos' + query);
    },
    getByProfesional: (id: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchApi<TurnosPaginatedResponse>(`/turnos/profesional/${id}${query}`);
    },
    reprogramar: (id: string, data: { fechaHora: string; modalidad?: 'PRESENCIAL' | 'VIRTUAL' }) =>
      fetchApi<Turno>(`/turnos/${id}/reprogramar`, {
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
      fetchApi<{ joinUrl: string; token: string | null; roomName: string }>(`/turnos/${id}/video-token`),
    getReceta: (id: string) =>
      fetchApi<RecetaIndicacion | null>(`/turnos/${id}/receta`),
    guardarReceta: (id: string, data: RecetaIndicacionInput) =>
      fetchApi<{ receta: RecetaIndicacion; shareText: string }>(`/turnos/${id}/receta`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  recordatorios: {
    getProfesional: () => fetchApi<any>('/recordatorios/profesional'),
    getPaciente: () => fetchApi<any>('/recordatorios/paciente'),
  },
  listaEspera: {
    misSuscripciones: () => fetchApi<ListaEsperaItem[]>('/lista-espera/mis-suscripciones'),
    suscribirme: (data: { profesionalId: string; fecha: string; modalidad: 'PRESENCIAL' | 'VIRTUAL' }) =>
      fetchApi<ListaEsperaItem>('/lista-espera/suscribirme', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    cancelar: (id: string) =>
      fetchApi<ListaEsperaItem>(`/lista-espera/${id}`, {
        method: 'DELETE',
      }),
  },
  pacientes: {
    getPerfil: () => fetchApi<Paciente>('/pacientes/perfil'),
    updatePerfil: (data: Partial<Paciente>) =>
      fetchApi<Paciente>('/pacientes/perfil', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getHistoriaClinica: (pacienteId: string) =>
      fetchApi<HistoriaClinicaPaciente>(`/pacientes/${pacienteId}/historia-clinica`),
    updateHistoriaClinica: (pacienteId: string, data: Partial<HistoriaClinicaEditableFields>) =>
      fetchApi<HistoriaClinicaEditableFields & { id: string; updatedAt: string }>(`/pacientes/${pacienteId}/historia-clinica`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
  profesional: {
    updatePerfil: (id: string, data: Partial<Profesional>) =>
      fetchApi<Profesional>(`/profesionales/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getPagos: (params?: { desde?: string; hasta?: string; estado?: string; page?: number; limit?: number }) => {
      const q = params ? '?' + new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
      ).toString() : '';
      return fetchApi<PagosDashboardResponse>(`/profesional/pagos${q}`);
    },
  },
  admin: {
    getStats: () => fetchApi<AdminStats>('/admin/stats'),
    getUsuarios: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
      return fetchApi<{ usuarios: AdminUsuario[]; pagination: PaginationMeta }>(`/admin/usuarios${q}`);
    },
    toggleActivo: (id: string) =>
      fetchApi<{ activo: boolean }>(`/admin/usuarios/${id}/toggle-activo`, { method: 'PATCH' }),
    getProfesionales: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
      return fetchApi<{ profesionales: AdminProfesional[]; pagination: PaginationMeta }>(`/admin/profesionales${q}`);
    },
    getTurnos: (params?: { page?: number; limit?: number; search?: string; estado?: string }) => {
      const q = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k, String(v)]))).toString() : '';
      return fetchApi<{ turnos: AdminTurno[]; pagination: PaginationMeta }>(`/admin/turnos${q}`);
    },
    crearEspecialidad: (data: { nombre: string; descripcion?: string; icono?: string }) =>
      fetchApi<Especialidad>('/admin/especialidades', { method: 'POST', body: JSON.stringify(data) }),
    editarEspecialidad: (id: string, data: { nombre?: string; descripcion?: string; icono?: string }) =>
      fetchApi<Especialidad>(`/admin/especialidades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    eliminarEspecialidad: (id: string) =>
      fetchApi<{ deleted: boolean }>(`/admin/especialidades/${id}`, { method: 'DELETE' }),
  },
  resenas: {
    crear: (data: { turnoId: string; rating: number; comentario?: string }) =>
      fetchApi<Resena>('/resenas', { method: 'POST', body: JSON.stringify(data) }),
    getByProfesional: (profesionalId: string, params?: { page?: number; limit?: number }) => {
      const q = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)]))).toString() : '';
      return fetchApi<ResenasResponse>(`/resenas/profesional/${profesionalId}${q}`);
    },
    getMiResena: (turnoId: string) =>
      fetchApi<Resena | null>(`/resenas/mi-resena/${turnoId}`),
  },
  notifications: {
    getPreferences: () => fetchApi<NotificationPreferences>('/notifications/preferences'),
    updatePreferences: (data: Partial<NotificationPreferences>) =>
      fetchApi<NotificationPreferences>('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    sendTest: (canal: 'EMAIL' | 'WHATSAPP' | 'IN_APP') =>
      fetchApi<{ ok: boolean; channel: string }>('/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ canal }),
      }),
  },
};

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  rol: 'PROFESIONAL' | 'PACIENTE';
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

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    rol: 'PROFESIONAL' | 'PACIENTE' | 'ADMIN';
    perfil?: Profesional | Paciente;
  };
};

export type User = {
  id: string;
  email: string;
  rol: 'PROFESIONAL' | 'PACIENTE' | 'ADMIN';
  profesional?: Profesional;
  paciente?: Paciente;
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
  fotoUrl?: string;
  especialidad: Especialidad;
  disponibilidades?: Disponibilidad[];
  ratingPromedio?: number | null;
  totalResenas?: number;
};

export type Resena = {
  id: string;
  turnoId: string;
  profesionalId: string;
  pacienteId: string;
  rating: number;
  comentario: string | null;
  createdAt: string;
  paciente?: { nombre: string; apellido: string; fotoUrl?: string | null };
};

export type ResenasResponse = {
  resenas: Resena[];
  pagination: PaginationMeta;
  stats: { promedio: number | null; total: number };
};

export type Paciente = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  genero: Genero;
  fechaNacimiento?: string;
  dni?: string;
  obraSocial?: string;
  fotoUrl?: string;
  antecedentesPersonales?: string | null;
  antecedentesFamiliares?: string | null;
  alergias?: string | null;
  medicacionActual?: string | null;
  habitos?: string | null;
  diagnosticosPrevios?: string | null;
  notasClinicasGenerales?: string | null;
};

export type HistoriaClinicaEditableFields = {
  antecedentesPersonales?: string | null;
  antecedentesFamiliares?: string | null;
  alergias?: string | null;
  medicacionActual?: string | null;
  habitos?: string | null;
  diagnosticosPrevios?: string | null;
  notasClinicasGenerales?: string | null;
};

export type HistoriaClinicaTimelineItem = {
  id: string;
  fechaHora: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  estado: 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE';
  profesional: {
    id: string;
    nombre: string;
    apellido: string;
    especialidad: string;
  };
  evolucion: {
    id: string;
    contenido: string;
    updatedAt: string;
  } | null;
  archivos: {
    id: string;
    tipo: string;
    nombreOriginal: string;
    url: string;
    createdAt: string;
  }[];
};

export type HistoriaClinicaPaciente = {
  paciente: Paciente;
  resumen: {
    totalConsultas: number;
    consultasCompletadas: number;
    ultimaConsulta: string | null;
  };
  timeline: HistoriaClinicaTimelineItem[];
};

export type Disponibilidad = {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL' | 'AMBOS';
};

export type Turno = {
  id: string;
  fechaHora: string;
  duracionMin: number;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  estado: 'RESERVADO' | 'CONFIRMADO' | 'COMPLETADO' | 'CANCELADO' | 'AUSENTE';
  linkVideollamada?: string;
  profesional?: Profesional;
  paciente?: Paciente;
  preconsultaRiesgo?: 'BAJO' | 'MEDIO' | 'ALTO' | 'URGENTE' | null;
  preconsultaCompletadaAt?: string | null;
};

export type PreconsultaInput = {
  motivo: string;
  sintomas: string;
  escalaDolor: number;
  escalaAnsiedad: number;
  inicioSintomas?: string | null;
  temperatura?: number | null;
  notasPaciente?: string | null;
};

export type PreconsultaTurno = {
  motivo: string | null;
  sintomas: string | null;
  escalaDolor: number | null;
  escalaAnsiedad: number | null;
  inicioSintomas: string | null;
  temperatura: number | null;
  notasPaciente: string | null;
  riesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'URGENTE' | null;
  flags: string[] | null;
  resumen: string | null;
  completadaAt: string | null;
};

export type RecetaIndicacion = {
  id: string;
  turnoId: string;
  diagnostico: string;
  planTratamiento: string | null;
  medicamentos: string | null;
  indicaciones: string;
  estudiosSolicitados: string | null;
  proximoControl: string | null;
  advertencias: string | null;
  observaciones: string | null;
  emitidaAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RecetaIndicacionInput = {
  diagnostico: string;
  planTratamiento?: string | null;
  medicamentos?: string | null;
  indicaciones: string;
  estudiosSolicitados?: string | null;
  proximoControl?: string | null;
  advertencias?: string | null;
  observaciones?: string | null;
};

export type Evolucion = {
  id: string;
  turnoId: string;
  contenido: string;
  createdAt: string;
  updatedAt: string;
};

export type Slot = {
  hora: string;
  disponible: boolean;
};

export type ListaEsperaItem = {
  id: string;
  profesionalId: string;
  pacienteId: string;
  fecha: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  estado: 'ACTIVA' | 'NOTIFICADA' | 'RESUELTA' | 'CANCELADA';
  profesional?: Profesional;
  createdAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProfesionalesResponse = {
  profesionales: Profesional[];
  pagination: PaginationMeta;
};

export type TurnosPaginatedResponse = {
  turnos: Turno[];
  pagination: PaginationMeta;
};

export type ReservarTurnoData = {
  profesionalId: string;
  fechaHora: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  paciente?: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    dni?: string;
  };
};


// ── Admin ──────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalUsuarios: number;
  totalProfesionales: number;
  totalPacientes: number;
  totalTurnos: number;
  turnosPorEstado: Record<string, number>;
  totalEspecialidades: number;
  totalResenas: number;
  ingresosAprobados: number;
  turnosUltimos30: number;
  registrosUltimos30: number;
};

export type AdminUsuario = {
  id: string;
  email: string;
  rol: 'PROFESIONAL' | 'PACIENTE' | 'ADMIN';
  createdAt: string;
  profesional?: { id: string; nombre: string; apellido: string; activo: boolean; especialidad: { nombre: string } } | null;
  paciente?: { id: string; nombre: string; apellido: string } | null;
};

export type AdminProfesional = Profesional & {
  activo: boolean;
  usuario: { email: string; createdAt: string };
  _count: { turnos: number; resenas: number };
  ratingPromedio: number | null;
  totalResenas: number;
};

export type AdminTurno = {
  id: string;
  fechaHora: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  estado: string;
  profesional: { id: string; nombre: string; apellido: string; especialidad: { nombre: string } };
  paciente: { id: string; nombre: string; apellido: string } | null;
  pago: { monto: number; estado: string } | null;
};

export type NotificationPreferences = {
  // Paciente
  aceptaRecordatorios?: boolean;
  notifEmail: boolean;
  notifWhatsapp: boolean;
  notifRecordatorio24h?: boolean;
  notifRecordatorio2h?: boolean;
};

export type PagoItem = {
  id: string;
  monto: number;
  montoNeto: number;
  comisionPorcentaje: number;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';
  mpPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  turno: {
    id: string;
    fechaHora: string;
    modalidad: 'PRESENCIAL' | 'VIRTUAL';
    estado: string;
    paciente: { nombre: string; apellido: string; email: string } | null;
  };
};

export type PagosMesResumen = {
  mes: string;
  bruto: number;
  neto: number;
  cantidad: number;
};

export type PagosDashboardResponse = {
  pagos: PagoItem[];
  pagination: { total: number; page: number; limit: number; pages: number };
  totales: {
    bruto: number;
    neto: number;
    pendiente: number;
    aprobados: number;
    pendientes: number;
  };
  mesesResumen: PagosMesResumen[];
};

export type InAppNotification = {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string;
  leida: boolean;
  link: string | null;
  createdAt: string;
};

export const notificationsApi = {
  getInbox: () => fetchApi<{ notifs: InAppNotification[]; unread: number }>('/notifications/inbox'),
  markRead: (id: string) => fetchApi<InAppNotification>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => fetchApi<{ marked: number }>('/notifications/read-all', { method: 'PATCH' }),
};
