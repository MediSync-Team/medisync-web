'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/i18n/context';
import { api, PagosDashboardResponse } from '../../lib/api';
import { CreditCardIcon, VideoIcon, BuildingIcon } from '../../components/icons';
import Spinner from '../../components/Spinner';
import { formatClinicInstantDate, formatClinicInstantDateTime, formatClinicInstantTime, getLocale } from '../../lib/date';

export default function PagosView() {
  const { lang, t } = useLang();
  const d = t('dashboard');
  const pg = t('pagination');
  const m = t('modality');
  const [data, setData] = useState<PagosDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [desde, setDesde] = useState(`${currentYear}-${currentMonth}-01`);
  const [hasta, setHasta] = useState(`${currentYear}-${currentMonth}-${new Date(currentYear, new Date().getMonth() + 1, 0).getDate()}`);
  const [estado, setEstado] = useState('TODOS');
  const [applied, setApplied] = useState({ desde: '', hasta: '', estado: 'TODOS' });

  const load = async (p = 1, filters = applied) => {
    setLoading(true);
    try {
      const res = await api.profesional.getPagos({
        desde: filters.desde || undefined,
        hasta: filters.hasta || undefined,
        estado: filters.estado !== 'TODOS' ? filters.estado : undefined,
        page: p,
        limit: 15,
      });
      setData(res);
      setPage(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1, { desde: '', hasta: '', estado: 'TODOS' }); }, []);

  const applyFilters = () => {
    const f = { desde, hasta, estado };
    setApplied(f);
    load(1, f);
  };

  const clearFilters = () => {
    setDesde(`${currentYear}-${currentMonth}-01`);
    setHasta(`${currentYear}-${currentMonth}-${new Date(currentYear, new Date().getMonth() + 1, 0).getDate()}`);
    setEstado('TODOS');
    const f = { desde: '', hasta: '', estado: 'TODOS' };
    setApplied(f);
    load(1, f);
  };

  const [exporting, setExporting] = useState(false);
  const exportarCSV = async () => {
    setExporting(true);
    try {
      const res = await api.profesional.getPagos({
        desde: applied.desde || undefined,
        hasta: applied.hasta || undefined,
        estado: applied.estado !== 'TODOS' ? applied.estado : undefined,
        page: 1,
        limit: 1000,
      });
      const rows = [
        tx.csvHeaders,
        ...res.pagos.map(p => [
          new Date(p.createdAt).toLocaleDateString(getLocale(lang)),
          formatClinicInstantDateTime(p.turno.fechaHora, getLocale(lang), { dateStyle: 'short', timeStyle: 'short' }),
          p.turno.paciente ? `${p.turno.paciente.nombre} ${p.turno.paciente.apellido}` : tx.noAccount,
          p.turno.paciente?.email ?? '',
          p.turno.modalidad === 'VIRTUAL' ? m.VIRTUAL : m.PRESENCIAL,
          p.monto.toFixed(2),
          p.comisionPorcentaje.toFixed(1),
          p.montoNeto.toFixed(2),
          p.estado,
          p.mpPaymentId ?? '',
        ]),
      ];
      const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagos-medisync-${applied.desde || 'todos'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat(getLocale(lang), { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const estadoBadgeClass = (e: string) => {
    if (e === 'APROBADO') return 'badge badge-green';
    if (e === 'PENDIENTE') return 'badge badge-yellow';
    if (e === 'RECHAZADO') return 'badge badge-red';
    return 'badge badge-gray';
  };

  const estadoLabel = (e: string) => {
    const map: Record<string, string> = {
      APROBADO: d.approved,
      PENDIENTE: lang === 'es' ? 'Pendiente' : 'Pending',
      RECHAZADO: lang === 'es' ? 'Rechazado' : 'Rejected',
      REEMBOLSADO: lang === 'es' ? 'Reembolsado' : 'Refunded',
    };
    return map[e] ?? e;
  };

  const modalidadIcon = (m: string) => (
    m === 'VIRTUAL'
      ? <VideoIcon size={13} className="text-blue-600" />
      : <BuildingIcon size={13} className="text-emerald-600" />
  );

  const tx = lang === 'es'
    ? {
        csvHeaders: ['Fecha pago', 'Fecha turno', 'Paciente', 'Email', 'Modalidad', 'Monto bruto', 'Comision %', 'Monto neto', 'Estado', 'ID pago MP'],
        noAccount: 'Sin cuenta',
        billedGross: 'Facturado (bruto)',
        approvedPayments: 'pagos aprobados',
        netReceived: 'Neto recibido',
        commission: '-10% comision',
        pendingCollection: 'Pendiente de cobro',
        payment: 'pago',
        payments: 'pagos',
        transactions: 'Transacciones',
        approvedShort: 'aprob.',
        monthlyBilling: 'Facturacion por fecha de turno - ultimos 12 meses',
        from: 'Desde',
        to: 'Hasta',
        status: 'Estado',
        all: 'Todos',
        filter: 'Filtrar',
        clear: 'Limpiar',
        exporting: 'Exportando...',
        exportCsv: 'Exportar CSV',
        loadingPayments: 'Cargando pagos...',
        noPayments: 'No hay pagos en el periodo seleccionado.',
        date: 'Fecha',
        patient: 'Paciente',
        modality: 'Modalidad',
        appointment: 'Turno',
        grossAmount: 'Monto bruto',
        gross: 'Bruto',
        net: 'Neto',
      }
    : {
        csvHeaders: ['Payment date', 'Appointment date', 'Patient', 'Email', 'Modality', 'Gross amount', 'Commission %', 'Net amount', 'Status', 'Payment ID MP'],
        noAccount: 'No account',
        billedGross: 'Billed (gross)',
        approvedPayments: 'approved payments',
        netReceived: 'Net received',
        commission: '-10% commission',
        pendingCollection: 'Pending collection',
        payment: 'payment',
        payments: 'payments',
        transactions: 'Transactions',
        approvedShort: 'approved',
        monthlyBilling: 'Billing by appointment date - last 12 months',
        from: 'From',
        to: 'To',
        status: 'Status',
        all: 'All',
        filter: 'Filter',
        clear: 'Clear',
        exporting: 'Exporting...',
        exportCsv: 'Export CSV',
        loadingPayments: 'Loading payments...',
        noPayments: 'No payments in the selected period.',
        date: 'Date',
        patient: 'Patient',
        modality: 'Modality',
        appointment: 'Appointment',
        grossAmount: 'Gross amount',
        gross: 'Gross',
        net: 'Net',
      };

  // Bar chart helpers
  const maxBruto = data ? Math.max(...data.mesesResumen.map(m => m.bruto), 1) : 1;

  return (
    <div className="space-y-6">

      {/* -- Summary cards ---------------------------------------- */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: tx.billedGross, value: fmt(data.totales.bruto), sub: tx.approvedPayments, color: 'emerald' },
            { label: tx.netReceived, value: fmt(data.totales.neto), sub: tx.commission, color: 'blue' },
            { label: tx.pendingCollection, value: fmt(data.totales.pendiente), sub: `${data.totales.pendientes} ${data.totales.pendientes !== 1 ? tx.payments : tx.payment}`, color: 'amber' },
            { label: tx.transactions, value: String(data.totales.aprobados + data.totales.pendientes), sub: `${data.totales.aprobados} ${tx.approvedShort}`, color: 'purple' },
          ].map(card => (
            <div key={card.label} className="stat-card">
              <p className="stat-label">{card.label}</p>
              <p className={`text-xl font-bold mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>{card.value}</p>
              <p className="stat-desc">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* -- Monthly bar chart ------------------------------------ */}
      {data && data.mesesResumen.some(m => m.bruto > 0) && (
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            {tx.monthlyBilling}
          </p>
          <div className="flex items-end gap-1.5 h-28">
            {data.mesesResumen.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                  <p className="font-semibold">{m.mes}</p>
                  <p>{fmt(m.bruto)} bruto</p>
                  <p className="text-slate-300">{fmt(m.neto)} neto</p>
                  <p className="text-slate-400">{m.cantidad} pago{m.cantidad !== 1 ? 's' : ''}</p>
                </div>
                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all ${m.bruto > 0 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-200 dark:bg-slate-600'}`}
                  style={{ height: `${Math.max(4, (m.bruto / maxBruto) * 96)}px` }}
                />
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none">{m.mes}</span>
              </div>
            ))}
          </div>
          {/* Y-axis reference */}
          <div className="flex justify-between mt-2 text-[10px] text-slate-400">
            <span>$0</span>
            <span>{fmt(maxBruto / 2)}</span>
            <span>{fmt(maxBruto)}</span>
          </div>
        </div>
      )}

      {/* -- Filters ---------------------------------------------- */}
      <div className="flex flex-wrap items-end gap-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
        <div>
          <label className="field-label text-xs">{tx.from}</label>
          <input type="date" className="field-input mt-1 text-sm" value={desde} onChange={e => setDesde(e.target.value)} />
        </div>
        <div>
          <label className="field-label text-xs">{tx.to}</label>
          <input type="date" className="field-input mt-1 text-sm" value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
        <div>
          <label className="field-label text-xs">{tx.status}</label>
          <select className="field-select mt-1 text-sm" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="TODOS">{tx.all}</option>
            <option value="APROBADO">{estadoLabel('APROBADO')}</option>
            <option value="PENDIENTE">{estadoLabel('PENDIENTE')}</option>
            <option value="RECHAZADO">{estadoLabel('RECHAZADO')}</option>
          </select>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0 flex-wrap">
          <button onClick={applyFilters} className="btn btn-primary text-sm">{tx.filter}</button>
          <button onClick={clearFilters} className="btn btn-ghost text-sm text-slate-500">{tx.clear}</button>
          <button
            onClick={exportarCSV}
            disabled={exporting || !data || data.pagos.length === 0}
            className="btn btn-ghost text-sm text-emerald-700 border border-emerald-200 hover:bg-emerald-50 disabled:opacity-40 flex items-center gap-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {exporting ? tx.exporting : tx.exportCsv}
          </button>
        </div>
      </div>

      {/* -- Table ------------------------------------------------ */}
      {loading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-slate-400">
          <Spinner size={20} />
          {tx.loadingPayments}
        </div>
      ) : !data || data.pagos.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-3xl mb-2 text-blue-700 flex items-center justify-center"><CreditCardIcon size={26} /></p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{tx.noPayments}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                  {[tx.date, tx.patient, tx.modality, tx.appointment, tx.grossAmount, tx.net, tx.status].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.pagos.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString(getLocale(lang), { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      {p.turno.paciente
                        ? <><p className="font-medium text-slate-800 dark:text-slate-100">{p.turno.paciente.nombre} {p.turno.paciente.apellido}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{p.turno.paciente.email}</p></>
                        : <span className="text-slate-400">{d.noAccount}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center">{modalidadIcon(p.turno.modalidad)}</span>
                      <span className="ml-1">{p.turno.modalidad === 'VIRTUAL' ? m.VIRTUAL : m.PRESENCIAL}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      {formatClinicInstantDate(p.turno.fechaHora, getLocale(lang), { day: '2-digit', month: 'short' })}
                      {' '}
                      {formatClinicInstantTime(p.turno.fechaHora, getLocale(lang))}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      {fmt(p.monto)}
                    </td>
                    <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                      {p.estado === 'APROBADO' ? fmt(p.montoNeto) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={estadoBadgeClass(p.estado)}>{estadoLabel(p.estado)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {data.pagos.map(p => (
              <div key={p.id} className="card p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                      {p.turno.paciente ? `${p.turno.paciente.nombre} ${p.turno.paciente.apellido}` : d.noAccount}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatClinicInstantDate(p.turno.fechaHora, getLocale(lang), { day: '2-digit', month: 'short', year: '2-digit' })}
                      {' · '}
                      {modalidadIcon(p.turno.modalidad)} {p.turno.modalidad === 'VIRTUAL' ? m.VIRTUAL : m.PRESENCIAL}
                    </p>
                  </div>
                  <span className={estadoBadgeClass(p.estado)}>{estadoLabel(p.estado)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-slate-400">{tx.gross}</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{fmt(p.monto)}</p>
                  </div>
                  {p.estado === 'APROBADO' && (
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{tx.net}</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(p.montoNeto)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {(data.pagination.pages ?? data.pagination.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pg.showing} {((page - 1) * 15) + 1}–{Math.min(page * 15, data.pagination.total)} {pg.of} {data.pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => load(page - 1)}
                  className="btn btn-ghost text-sm disabled:opacity-40"
                >
                  {d.previous}
                </button>
                <button
                  disabled={page >= (data.pagination.pages ?? data.pagination.totalPages ?? 1)}
                  onClick={() => load(page + 1)}
                  className="btn btn-ghost text-sm disabled:opacity-40"
                >
                  {d.next}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
