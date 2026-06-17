'use client';

import { useEffect, useState } from 'react';
import { api, Especialidad } from '../../../lib/api';
import { useLang } from '../../../lib/i18n/context';

/** Specialties CRUD tab of the admin dashboard. */
export default function EspecialidadesTab() {
  const { t } = useLang();
  const admin = t('admin');
  const common = t('common');
  const [list, setList] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', icono: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.especialidades.getAll().then(setList).finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditId(null);
    setForm({ nombre: '', descripcion: '', icono: '' });
    setMsg(null);
    setShowForm(true);
  }

  function openEdit(e: Especialidad) {
    setEditId(e.id);
    setForm({ nombre: e.nombre, descripcion: e.descripcion ?? '', icono: e.icono ?? '' });
    setMsg(null);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) { setMsg({ text: admin.specialtyNameRequired, ok: false }); return; }
    setSaving(true);
    setMsg(null);
    try {
      if (editId) {
        const updated = await api.admin.editarEspecialidad(editId, {
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          icono: form.icono || undefined,
        });
        setList(prev => prev.map(e => e.id === editId ? updated : e));
      } else {
        const created = await api.admin.crearEspecialidad({
          nombre: form.nombre,
          descripcion: form.descripcion || undefined,
          icono: form.icono || undefined,
        });
        setList(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      }
      setMsg({ text: editId ? admin.specialtyUpdated : admin.specialtyCreated, ok: true });
      setShowForm(false);
    } catch (e: any) {
      setMsg({ text: e.message ?? admin.saveError, ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(admin.deleteSpecialtyConfirm.replace('{{name}}', nombre))) return;
    try {
      await api.admin.eliminarEspecialidad(id);
      setList(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      alert(e.message ?? admin.deleteError);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">{admin.specialties}</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {admin.newSpecialty}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <h2 className="font-semibold text-slate-700 mb-4">{editId ? admin.editSpecialty : admin.newSpecialty}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{admin.specialtyName}</label>
              <input
                value={form.nombre}
                onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{admin.specialtyDesc}</label>
              <input
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{admin.specialtyIcon}</label>
              <input
                value={form.icono}
                onChange={e => setForm(p => ({ ...p, icono: e.target.value }))}
                maxLength={10}
                className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? admin.saving : common.save}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50"
              >
                {common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm">{common.loading}</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">{admin.icon}</th>
                <th className="text-left px-4 py-3">{admin.name}</th>
                <th className="text-left px-4 py-3">{admin.description}</th>
                <th className="text-right px-4 py-3">{common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {list.map(e => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-xl">{e.icono ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{e.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{e.descripcion ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(e)}
                      className="text-blue-600 hover:underline text-xs mr-3"
                    >
                      {common.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(e.id, e.nombre)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      {common.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
