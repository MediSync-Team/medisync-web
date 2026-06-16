'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, RecetaIndicacion, RecetaIndicacionInput } from '../../../lib/api';

export type SaveResult = { ok: true } | { ok: false; message: string | null };

/**
 * Owns the receta slice of TurnoModal: loads the existing receta for the turno,
 * derives the editable form, and persists it. Feedback (success/error banners,
 * the "saved" badge) is surfaced by the panel component, not here.
 */
export function useRecetaPanel(turnoId: string) {
  const [receta, setReceta] = useState<RecetaIndicacion | null>(null);
  const [form, setForm] = useState<RecetaIndicacionInput>({ diagnostico: '', indicaciones: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shareText, setShareText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.turnos.getReceta(turnoId);
      setReceta(data);
      if (data) {
        setForm({
          diagnostico: data.diagnostico,
          planTratamiento: data.planTratamiento || '',
          medicamentos: data.medicamentos || '',
          indicaciones: data.indicaciones,
          estudiosSolicitados: data.estudiosSolicitados || '',
          proximoControl: data.proximoControl || '',
          advertencias: data.advertencias || '',
          observaciones: data.observaciones || '',
        });
      }
    } catch (err) {
      console.error(err);
      setReceta(null);
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (): Promise<SaveResult> => {
    setSaving(true);
    try {
      const response = await api.turnos.guardarReceta(turnoId, {
        ...form,
        diagnostico: form.diagnostico.trim(),
        indicaciones: form.indicaciones.trim(),
      });
      setReceta(response.receta);
      setShareText(response.shareText);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : null };
    } finally {
      setSaving(false);
    }
  }, [turnoId, form]);

  return { receta, form, setForm, loading, saving, shareText, save };
}
