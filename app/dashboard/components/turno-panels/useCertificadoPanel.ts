'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, CertificadoConDatos, TipoCertificado } from '../../../lib/api';

export interface CertificadoFormState {
  tipo: TipoCertificado;
  diagnostico: string;
  texto: string;
  diasReposo: number;
}

type EmitirPayload = Parameters<typeof api.certificados.emitir>[0];
export type EmitResult =
  | { ok: true; response: Awaited<ReturnType<typeof api.certificados.emitir>> }
  | { ok: false; message: string | null };

/** Owns the certificado slice of TurnoModal: load existing + emit a new one. */
export function useCertificadoPanel(turnoId: string) {
  const [certificado, setCertificado] = useState<CertificadoConDatos | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CertificadoFormState>({ tipo: 'CONSULTA', diagnostico: '', texto: '', diasReposo: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.certificados.getByTurno(turnoId);
      setCertificado(data);
      setForm({ tipo: data.tipo, diagnostico: data.diagnostico, texto: data.texto, diasReposo: data.diasReposo || 0 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.toLowerCase().includes('no encontrado') && !msg.toLowerCase().includes('not found')) {
        console.error(err);
      }
      setCertificado(null);
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  useEffect(() => { load(); }, [load]);

  const emit = useCallback(async (payload: EmitirPayload): Promise<EmitResult> => {
    setSaving(true);
    try {
      const response = await api.certificados.emitir(payload);
      setCertificado(response as unknown as CertificadoConDatos);
      return { ok: true, response };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : null };
    } finally {
      setSaving(false);
    }
  }, []);

  return { certificado, loading, saving, form, setForm, emit };
}
