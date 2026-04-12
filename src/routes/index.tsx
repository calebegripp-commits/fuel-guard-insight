import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { MetricCard } from '@/components/MetricCard';
import { useState, useEffect } from 'react';
import { Fuel, DollarSign, Gauge, ClipboardCheck, TrendingUp, AlertTriangle, Search, CalendarDays, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { fetchDashboardData, type DashboardMetrics, type MonthlyPoint, type VehicleRank } from '@/lib/dashboard-data';
import type { AuditCrossResult } from '@/lib/audit-crossref';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'FleetAudit — Dashboard de Auditoria de Frotas' },
      { name: 'description', content: 'Sistema de auditoria e análise de consumo de combustível para frotas' },
    ],
  }),
  component: DashboardPage,
});

const CHART_COLORS = [
  'oklch(0.65 0.18 145)',   // success green
  'oklch(0.78 0.16 70)',    // warning yellow
  'oklch(0.6 0.22 25)',     // destructive red
];

const TOOLTIP_STYLE = {
  background: 'oklch(0.19 0.025 260)',
  border: '1px solid oklch(0.28 0.02 260)',
  borderRadius: 8,
  color: 'oklch(0.95 0.01 260)',
};

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [placaFilter, setPlacaFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [vehicleRanking, setVehicleRanking] = useState<VehicleRank[]>([]);
  const [auditResults, setAuditResults] = useState<AuditCrossResult[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchDashboardData({
        placa: placaFilter || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });
      setMetrics(data.metrics);
      setMonthly(data.monthly);
      setVehicleRanking(data.vehicleRanking);
      setAuditResults(data.auditResults);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  const pieData = metrics
    ? [
        { name: 'Conforme', value: metrics.conforme },
        { name: 'Suspeito', value: metrics.suspeito },
        { name: 'Não Conforme', value: metrics.naoConforme },
      ]
    : [];

  const top10Worst = vehicleRanking.slice(0, 10);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral da auditoria de frotas — dados reais</p>
          </div>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Placa</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar por placa..."
                value={placaFilter}
                onChange={(e) => setPlacaFilter(e.target.value)}
                className="w-full rounded-lg border border-input bg-muted/50 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Data Início</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full rounded-lg border border-input bg-muted/50 py-2 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg border border-input bg-muted/50 py-2 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={loadData}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Filtrar
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando dados...</span>
          </div>
        )}

        {!loading && metrics && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard title="Abastecimentos" value={metrics.totalAbastecimentos} icon={Fuel} />
              <MetricCard title="Total Litros" value={`${metrics.totalLitros.toLocaleString('pt-BR')}L`} icon={Fuel} />
              <MetricCard title="Valor Total" value={`R$ ${metrics.totalValor.toLocaleString('pt-BR')}`} icon={DollarSign} />
              <MetricCard title="Média km/L" value={metrics.mediaKml} icon={Gauge} variant="success" />
              <MetricCard title="R$/km" value={`R$ ${metrics.valorPorKm}`} icon={TrendingUp} />
              <MetricCard title="Conformidade" value={`${metrics.conformidade}%`} icon={ClipboardCheck} variant={metrics.conformidade >= 80 ? 'success' : 'warning'} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Monthly consumption */}
              <div className="glass-card col-span-2 rounded-xl p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Consumo Mensal (L)</h3>
                {monthly.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={monthly}>
                      <defs>
                        <linearGradient id="gradLitros" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.75 0.16 55)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.75 0.16 55)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                      <XAxis dataKey="month" stroke="oklch(0.5 0.02 260)" fontSize={11} />
                      <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="litros" stroke="oklch(0.75 0.16 55)" fill="url(#gradLitros)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">Sem dados de consumo mensal</p>
                )}
              </div>

              {/* Audit pie */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Status da Auditoria</h3>
                {pieData.some((d) => d.value > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex justify-center gap-4">
                      {pieData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                          {d.name} ({d.value})
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">Sem dados de auditoria</p>
                )}
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Top 10 worst km/L */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                  Top 10 — Pior Consumo (km/L)
                </h3>
                {top10Worst.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={top10Worst} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                      <XAxis type="number" stroke="oklch(0.5 0.02 260)" fontSize={11} />
                      <YAxis type="category" dataKey="placa" stroke="oklch(0.5 0.02 260)" fontSize={10} width={80} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value: number, _name: string, props: any) => {
                          const item = props.payload as VehicleRank;
                          return [`${value} km/L${item.anomalia ? ' ⚠️ ANOMALIA' : ''}`, 'Consumo'];
                        }}
                      />
                      <Bar
                        dataKey="mediaKml"
                        radius={[0, 4, 4, 0]}
                        fill="oklch(0.75 0.16 55)"
                        // Color anomalies red
                        shape={(props: any) => {
                          const { x, y, width, height, payload } = props;
                          const fill = payload.anomalia ? 'oklch(0.6 0.22 25)' : 'oklch(0.75 0.16 55)';
                          return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />;
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">Sem dados de veículos</p>
                )}
                {top10Worst.some((v) => v.anomalia) && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    Veículos em vermelho estão com consumo 20% abaixo da média do modelo
                  </div>
                )}
              </div>

              {/* Monthly km/L trend */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Evolução Média km/L</h3>
                {monthly.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                      <XAxis dataKey="month" stroke="oklch(0.5 0.02 260)" fontSize={11} />
                      <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="mediaKml" stroke="oklch(0.65 0.18 145)" strokeWidth={2} dot={{ fill: 'oklch(0.65 0.18 145)', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">Sem dados mensais</p>
                )}
              </div>
            </div>

            {/* Anomaly table */}
            {vehicleRanking.some((v) => v.anomalia) && (
              <div className="glass-card rounded-xl p-5">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h3 className="text-sm font-semibold text-foreground">Veículos com Anomalia de Consumo</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {['Placa', 'Modelo', 'km/L Veículo', 'Abastecimentos', 'Total Litros', 'Total km'].map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleRanking.filter((v) => v.anomalia).map((v) => (
                        <tr key={v.placa} className="border-b border-border/50 bg-destructive/5">
                          <td className="px-4 py-2 font-mono text-xs font-semibold text-destructive">{v.placa}</td>
                          <td className="px-4 py-2 text-xs text-foreground">{v.modelo}</td>
                          <td className="px-4 py-2 font-mono text-xs text-destructive font-bold">{v.mediaKml}</td>
                          <td className="px-4 py-2 text-xs text-foreground">{v.abastecimentos}</td>
                          <td className="px-4 py-2 text-xs text-foreground">{v.totalLitros}L</td>
                          <td className="px-4 py-2 text-xs text-foreground">{v.totalKm} km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && !metrics && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhum dado encontrado. Importe planilhas na página de Upload.
          </p>
        )}
      </div>
    </AppLayout>
  );
}
