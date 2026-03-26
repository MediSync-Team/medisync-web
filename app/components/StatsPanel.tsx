'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B'];

interface StatsData {
  turnosPorMes: {
    mes: string;
    total: number;
    completados: number;
    cancelados: number;
    ausentes: number;
  }[];
  ingresosPorMes: {
    mes: string;
    bruto: number;
    neto: number;
  }[];
  resumen: {
    totalTurnos: number;
    totalPacientes: number;
  };
}

export default function StatsPanel({ stats }: { stats: StatsData | null }) {
  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
        <p className="text-gray-500">Cargando estadísticas...</p>
      </div>
    );
  }

  const estadoData = [
    { name: 'Completados', value: stats.turnosPorMes.reduce((acc, m) => acc + m.completados, 0) },
    { name: 'Cancelados', value: stats.turnosPorMes.reduce((acc, m) => acc + m.cancelados, 0) },
    { name: 'Ausentes', value: stats.turnosPorMes.reduce((acc, m) => acc + m.ausentes, 0) },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-80">Total Turnos</p>
          <p className="text-3xl font-bold">{stats.resumen.totalTurnos}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <p className="text-sm opacity-80">Pacientes Atendidos</p>
          <p className="text-3xl font-bold">{stats.resumen.totalPacientes}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Turnos por Mes</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.turnosPorMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="completados" name="Completados" fill="#10B981" />
              <Bar dataKey="ausentes" name="Ausentes" fill="#EF4444" />
              <Bar dataKey="cancelados" name="Cancelados" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Estado de Turnos</h3>
          {estadoData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estadoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Tendencia de Turnos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.turnosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" name="Total" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Ingresos por Mes</h3>
        {stats.ingresosPorMes.some(i => i.bruto > 0) ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ingresosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString('es-AR')}`, '']} />
                <Bar dataKey="bruto" name="Bruto" fill="#3B82F6" />
                <Bar dataKey="neto" name="Neto" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Integrá Mercado Pago para ver ingresos</p>
          </div>
        )}
      </div>
    </div>
  );
}
