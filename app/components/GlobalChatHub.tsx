'use client';

import { useState, useRef, useEffect } from 'react';
import { api, Turno, User } from '../lib/api';
import { ChatIcon, UserIcon } from './icons';
import ChatModal from './ChatModal';
import { formatClinicInstantDate } from '../lib/date';

export function GlobalChatHub({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTurno, setActiveTurno] = useState<Turno | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnread = () => {
    api.chat.getUnreadGlobal().then(d => setUnread(d.count)).catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    const int = setInterval(fetchUnread, 30000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      if (user.rol === 'PACIENTE') {
        api.turnos.getMisTurnos({ limit: 50 }).then(d => {
          const filtered = d.turnos.filter(t => ['RESERVADO', 'CONFIRMADO', 'COMPLETADO'].includes(t.estado));
          // Group by profesionalId so we only show 1 chat per professional
          const grouped: { [key: string]: Turno } = {};
          filtered.forEach(t => {
            const key = t.profesionalId;
            if (!grouped[key] || new Date(t.fechaHora) > new Date(grouped[key].fechaHora)) {
              grouped[key] = t;
            }
          });
          const sorted = Object.values(grouped).sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
          setTurnos(sorted);
          setLoading(false);
        }).catch(() => setLoading(false));
      } else if (user.rol === 'PROFESIONAL' && user.profesional) {
        api.turnos.getByProfesional(user.profesional.id, { limit: 50 }).then(d => {
          const filtered = d.turnos.filter(t => ['RESERVADO', 'CONFIRMADO', 'COMPLETADO'].includes(t.estado));
          // Group by pacienteId so we only show 1 chat per patient
          const grouped: { [key: string]: Turno } = {};
          filtered.forEach(t => {
            // fallback to t.id if pacienteId is null/undefined
            const key = t.pacienteId || t.id;
            if (!grouped[key] || new Date(t.fechaHora) > new Date(grouped[key].fechaHora)) {
              grouped[key] = t;
            }
          });
          const sorted = Object.values(grouped).sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
          setTurnos(sorted);
          setLoading(false);
        }).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [open, user]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <>
      <div ref={containerRef} className="relative z-40">
        <button
          onClick={() => setOpen(o => !o)}
          className="relative p-2 mr-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Chats"
        >
          <ChatIcon size={20} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Tus Chats</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">Cargando chats...</div>
              ) : turnos.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No tenés chats activos.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {turnos.map(turno => {
                    const isPaciente = user.rol === 'PACIENTE';
                    const otherName = isPaciente 
                      ? `Dr/a. ${turno.profesional?.nombre} ${turno.profesional?.apellido}` 
                      : `${turno.paciente?.nombre} ${turno.paciente?.apellido}`;
                    const fecha = formatClinicInstantDate(turno.fechaHora, 'es-AR', { day: '2-digit', month: '2-digit' });

                    return (
                      <button
                        key={turno.id}
                        onClick={() => {
                          setActiveTurno(turno);
                          setOpen(false);
                        }}
                        className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <UserIcon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{otherName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Último turno: {fecha}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {activeTurno && (
        <ChatModal
          turnoId={activeTurno.id}
          myUserId={user.id}
          otherName={user.rol === 'PACIENTE' 
            ? `Dr/a. ${activeTurno.profesional?.nombre} ${activeTurno.profesional?.apellido}` 
            : `${activeTurno.paciente?.nombre} ${activeTurno.paciente?.apellido}`
          }
          onClose={() => {
            setActiveTurno(null);
            fetchUnread(); // refetch unread after closing chat
          }}
        />
      )}
    </>
  );
}
