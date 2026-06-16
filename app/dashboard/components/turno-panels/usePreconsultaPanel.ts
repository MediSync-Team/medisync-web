'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, PreconsultaTurno } from '../../../lib/api';

/** Loads the read-only preconsulta summary for a turno. */
export function usePreconsultaPanel(turnoId: string) {
  const [preconsulta, setPreconsulta] = useState<PreconsultaTurno | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPreconsulta(await api.turnos.getPreconsulta(turnoId));
    } catch (err) {
      console.error(err);
      setPreconsulta(null);
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  useEffect(() => { load(); }, [load]);

  return { preconsulta, loading };
}
