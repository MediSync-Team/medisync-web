'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';

/** Owns the editable evolución (notas) slice of TurnoModal. */
export function useEvolucionNotasPanel(turnoId: string) {
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.turnos.getEvolucion(turnoId);
      if (data) setNotas(data.contenido || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      await api.turnos.guardarEvolucion(turnoId, notas);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [turnoId, notas]);

  return { notas, setNotas, loading, saving, save };
}
