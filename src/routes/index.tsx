import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { getDashboardMetrics, getMonthlyData, getVehicleRanking, mockAuditResults, getMockAlerts } from '@/lib/mock-data';
import { Fuel, DollarSign, Gauge, ClipboardCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';

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

function DashboardPage() {
  const metrics = getDashboardMetrics();
  const monthly = getMonthlyData();
  const vehicleRanking = getVehicleRanking();
  const alerts = getMockAlerts();
  const recentAudits = mockAuditResults.slice(-10).reverse();

  const pieData = [
    { name: 'Conforme', value: metrics.conforme },
    { name: 'Suspeito', value: metrics.suspeito },
    { name: 'Não Conforme', value: metrics.naoConforme },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral da auditoria de frotas</p>
        </div>

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
                <Tooltip contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }} />
                <Area type="monotone" dataKey="litros" stroke="oklch(0.75 0.16 55)" fill="url(#gradLitros)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Audit pie */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Status da Auditoria</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Vehicle Ranking */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Ranking de Veículos (km/L)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={vehicleRanking} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                <XAxis type="number" stroke="oklch(0.5 0.02 260)" fontSize={11} />
                <YAxis type="category" dataKey="placa" stroke="oklch(0.5 0.02 260)" fontSize={10} width={70} />
                <Tooltip contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }} />
                <Bar dataKey="mediaKml" fill="oklch(0.75 0.16 55)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly km/L trend */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Evolução Média km/L</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                <XAxis dataKey="month" stroke="oklch(0.5 0.02 260)" fontSize={11} />
                <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }} />
                <Line type="monotone" dataKey="mediaKml" stroke="oklch(0.65 0.18 145)" strokeWidth={2} dot={{ fill: 'oklch(0.65 0.18 145)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts + Recent Audits */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Alerts */}
          <div className="glass-card rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Alertas Recentes</h3>
            </div>
            <div className="space-y-3">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${a.severity === 'high' ? 'bg-destructive' : a.severity === 'medium' ? 'bg-warning' : 'bg-info'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground">{a.placa} • {a.data.toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Audits */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Últimas Auditorias</h3>
            <div className="space-y-2">
              {recentAudits.map((r) => (
                <div key={r.fueling.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-foreground">{r.fueling.placa}</p>
                    <p className="text-[10px] text-muted-foreground">{r.fueling.data.toLocaleDateString('pt-BR')} • {r.fueling.motorista}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">{r.consumo_kml} km/L</span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
