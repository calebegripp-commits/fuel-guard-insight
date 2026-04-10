import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { getDriverRanking, mockFuelings, mockVehicles } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Users, Trophy, Filter, ChevronDown, TrendingDown, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';

export const Route = createFileRoute('/motoristas')({
  head: () => ({
    meta: [
      { title: 'Motoristas — FleetAudit' },
      { name: 'description', content: 'Ranking de consumo por motorista' },
    ],
  }),
  component: MotoristasPage,
});

function MotoristasPage() {
  const ranking = getDriverRanking();
  const [sortBy, setSortBy] = useState<'mediaKml' | 'totalValor' | 'totalLitros'>('mediaKml');
  const [selectedMotorista, setSelectedMotorista] = useState<string>('ALL');

  const sorted = useMemo(() => {
    const data = selectedMotorista === 'ALL' ? ranking : ranking.filter((d) => d.motorista === selectedMotorista);
    if (sortBy === 'mediaKml') return [...data].sort((a, b) => b.mediaKml - a.mediaKml);
    if (sortBy === 'totalValor') return [...data].sort((a, b) => b.totalValor - a.totalValor);
    return [...data].sort((a, b) => b.totalLitros - a.totalLitros);
  }, [ranking, sortBy, selectedMotorista]);

  const avgKml = useMemo(() => {
    if (sorted.length === 0) return 0;
    return Math.round((sorted.reduce((s, d) => s + d.mediaKml, 0) / sorted.length) * 100) / 100;
  }, [sorted]);

  // Per-driver vehicle breakdown
  const driverDetails = useMemo(() => {
    if (selectedMotorista === 'ALL') return null;
    const fuelings = mockFuelings.filter((f) => f.motorista === selectedMotorista);
    const byVehicle: Record<string, { litros: number; km: number; valor: number; count: number; modelo: string }> = {};
    fuelings.forEach((f) => {
      if (!byVehicle[f.placa]) {
        const v = mockVehicles.find((v) => v.placa === f.placa);
        byVehicle[f.placa] = { litros: 0, km: 0, valor: 0, count: 0, modelo: v?.modelo || '' };
      }
      byVehicle[f.placa].litros += f.litros;
      byVehicle[f.placa].km += f.km;
      byVehicle[f.placa].valor += f.valor;
      byVehicle[f.placa].count += 1;
    });
    return Object.entries(byVehicle).map(([placa, d]) => ({
      placa,
      modelo: d.modelo,
      mediaKml: Math.round((d.km / d.litros) * 100) / 100,
      totalValor: Math.round(d.valor),
      abastecimentos: d.count,
    }));
  }, [selectedMotorista]);

  // Gasto comparison chart data
  const gastoChart = useMemo(() => {
    return [...ranking].sort((a, b) => b.totalValor - a.totalValor).map((d) => ({
      motorista: d.motorista,
      totalValor: d.totalValor,
    }));
  }, [ranking]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Motoristas</h1>
          <p className="text-sm text-muted-foreground">Ranking e análise de consumo por motorista</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={selectedMotorista}
              onChange={(e) => setSelectedMotorista(e.target.value)}
              className="appearance-none rounded-lg border border-input bg-muted/50 py-2 pl-8 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Todos os motoristas</option>
              {ranking.map((d) => (
                <option key={d.motorista} value={d.motorista}>{d.motorista}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none rounded-lg border border-input bg-muted/50 py-2 pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="mediaKml">Ordenar por km/L</option>
              <option value="totalValor">Ordenar por gasto total</option>
              <option value="totalLitros">Ordenar por litros</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {selectedMotorista !== 'ALL' && (
            <button
              onClick={() => setSelectedMotorista('ALL')}
              className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar filtro ✕
            </button>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* km/L ranking */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Consumo Médio (km/L)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sorted}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                <XAxis dataKey="motorista" stroke="oklch(0.5 0.02 260)" fontSize={10} />
                <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }} formatter={(v: number) => [`${v} km/L`, 'Consumo']} />
                <ReferenceLine y={avgKml} stroke="oklch(0.6 0.22 25)" strokeDasharray="5 5" label={{ value: `Média: ${avgKml}`, fill: 'oklch(0.6 0.22 25)', fontSize: 10, position: 'right' }} />
                <Bar dataKey="mediaKml" radius={[4, 4, 0, 0]}>
                  {sorted.map((d) => (
                    <Cell key={d.motorista} fill={d.mediaKml < avgKml * 0.85 ? 'oklch(0.6 0.22 25)' : 'oklch(0.65 0.18 145)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gasto total */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Gasto Total por Motorista (R$)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gastoChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                <XAxis dataKey="motorista" stroke="oklch(0.5 0.02 260)" fontSize={10} />
                <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Gasto']} />
                <Bar dataKey="totalValor" fill="oklch(0.78 0.16 70)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Driver vehicle details when filtered */}
        {driverDetails && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Veículos utilizados por {selectedMotorista}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Placa', 'Modelo', 'km/L', 'Gasto Total', 'Abastecimentos'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {driverDetails.map((d) => (
                    <tr key={d.placa} className="border-b border-border/50">
                      <td className="px-4 py-2 font-mono text-xs font-semibold text-foreground">{d.placa}</td>
                      <td className="px-4 py-2 text-xs text-foreground">{d.modelo}</td>
                      <td className="px-4 py-2 text-xs text-foreground">{d.mediaKml}</td>
                      <td className="px-4 py-2 text-xs text-foreground">R$ {d.totalValor.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-2 text-xs text-foreground">{d.abastecimentos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ranking list */}
        <div className="space-y-3">
          {sorted.map((d, i) => {
            const desvio = avgKml > 0 ? Math.round(((d.mediaKml - avgKml) / avgKml) * 100) : 0;
            return (
              <div
                key={d.motorista}
                className={`glass-card flex items-center justify-between rounded-xl px-5 py-4 cursor-pointer transition-all ${selectedMotorista === d.motorista ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-border'}`}
                onClick={() => setSelectedMotorista(selectedMotorista === d.motorista ? 'ALL' : d.motorista)}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {i === 0 ? <Trophy className="h-4 w-4" /> : i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{d.motorista}</p>
                    <p className="text-xs text-muted-foreground">{d.abastecimentos} abastecimentos</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div className="flex items-center gap-1">
                    {desvio >= 0 ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                    <span className={`text-[10px] font-semibold ${desvio >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {desvio > 0 ? '+' : ''}{desvio}%
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{d.mediaKml}</p>
                    <p className="text-[10px] text-muted-foreground">km/L</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{d.totalLitros.toLocaleString('pt-BR')}L</p>
                    <p className="text-[10px] text-muted-foreground">total</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">R$ {d.totalValor.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-muted-foreground">gasto</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
