'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, HistoriaClinicaPaciente, HistoriaClinicaEditableFields } from '../../../lib/api';

/**
 * Owns the longitudinal historia clínica slice of TurnoModal, keyed by the
 * turno's paciente. With no linked paciente it resolves to an empty state.
 */
export function useHistoriaClinicaPanel(pacienteId: string | undefined) {
  const [historia, setHistoria] = useState<HistoriaClinicaPaciente | null>(null);
  const [form, setForm] = useState<HistoriaClinicaEditableFields>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!pacienteId) {
      setHistoria(null);
      setForm({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.pacientes.getHistoriaClinica(pacienteId);
      setHistoria(data);
      setForm({
        antecedentesPersonales: data.paciente.antecedentesPersonales ?? '',
        antecedentesFamiliares: data.paciente.antecedentesFamiliares ?? '',
        alergias: data.paciente.alergias ?? '',
        medicacionActual: data.paciente.medicacionActual ?? '',
        habitos: data.paciente.habitos ?? '',
        diagnosticosPrevios: data.paciente.diagnosticosPrevios ?? '',
        notasClinicasGenerales: data.paciente.notasClinicasGenerales ?? '',
      });
    } catch (err) {
      console.error(err);
      setHistoria(null);
      setForm({});
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (): Promise<{ ok: boolean; message?: string | null }> => {
    if (!pacienteId) return { ok: false };
    setSaving(true);
    try {
      await api.pacientes.updateHistoriaClinica(pacienteId, form);
      await load();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : null };
    } finally {
      setSaving(false);
    }
  }, [pacienteId, form, load]);

  return { historia, form, setForm, loading, saving, save };
}
