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
  },
  recordatorios: {
    getProfesional: () => fetchApi<any>('/recordatorios/profesional'),
    getPaciente: () => fetchApi<any>('/recordatorios/paciente'),
  },
  pacientes: {
    getPerfil: () => fetchApi<Paciente>('/pacientes/perfil'),
    updatePerfil: (data: Partial<Paciente>) =>
      fetchApi<Paciente>('/pacientes/perfil', {
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
