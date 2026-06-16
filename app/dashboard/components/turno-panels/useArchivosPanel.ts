'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ArchivoTurno } from '../../../lib/api';

/** Owns the archivos slice of TurnoModal: list, upload and delete. */
export function useArchivosPanel(turnoId: string) {
  const [archivos, setArchivos] = useState<ArchivoTurno[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.archivos.getByTurno(turnoId);
      setArchivos(data || []);
    } catch (err) { console.error(err); }
  }, [turnoId]);

  useEffect(() => { load(); }, [load]);

  const upload = useCallback(async (file: File, tipo: string) => {
    setUploading(true);
    try {
      await api.archivos.subir(turnoId, file, tipo);
      await load();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  }, [turnoId, load]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.archivos.eliminar(id);
      await load();
      return true;
    } catch (err) { console.error(err); return false; }
  }, [load]);

  return { archivos, uploading, upload, remove };
}
