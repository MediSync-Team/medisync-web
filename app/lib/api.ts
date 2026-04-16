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
    getAll: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
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
    misTurnos: (tipo?: 'proximos' | 'pasados') => {
      const params = tipo ? `?tipo=${tipo}` : '';
      return fetchApi<Turno[]>('/turnos/mis-turnos' + params);
    },
    getByProfesional: (id: string, params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchApi<Turno[]>(`/turnos/profesional/${id}${query}`);
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
    rol: 'PROFESIONAL' | 'PACIENTE';
    perfil?: Profesional | Paciente;
  };
};

export type User = {
  id: string;
  email: string;
  rol: 'PROFESIONAL' | 'PACIENTE';
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
  bio?: string;
  lugarAtencion?: string;
  fotoUrl?: string;
  especialidad: Especialidad;
  disponibilidades?: Disponibilidad[];
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

export type ProfesionalesResponse = {
  profesionales: Profesional[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
