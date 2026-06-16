'use client';

import { useState, useCallback } from 'react';
import { api, Turno } from '../../../lib/api';

type Slot = { hora: string; disponible: boolean };

/** Owns the reprogramar slice of TurnoModal: slot loading + reschedule call. */
export function useReprogramarPanel(turno: Turno) {
  const [fecha, setFecha] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [hora, setHora] = useState('');
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [reprogramando, setReprogramando] = useState(false);

  const cargarSlots = useCallback(async (nuevaFecha: string) => {
    setHora('');
    setSlots([]);
    if (!nuevaFecha) return;
    setCargandoSlots(true);
    try {
      const data = await api.profesionales.getSlots(turno.profesional?.id ?? '', nuevaFecha, turno.modalidad);
      setSlots(data.filter((s) => s.disponible));
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoSlots(false);
    }
  }, [turno.profesional?.id, turno.modalidad]);

  const reprogramar = useCallback(async (fechaHoraISO: string): Promise<{ ok: boolean; message?: string | null }> => {
    setReprogramando(true);
    try {
      await api.turnos.reprogramar(turno.id, { fechaHora: fechaHoraISO });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : null };
    } finally {
      setReprogramando(false);
    }
  }, [turno.id]);

  return { fecha, setFecha, slots, hora, setHora, cargandoSlots, reprogramando, cargarSlots, reprogramar };
}
