import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { getVehicleRanking, mockVehicles } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Car, Filter, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

export const Route = createFileRoute('/veiculos')({
  head: () => ({
    meta: [
      { title: 'Veículos — FleetAudit' },
      { name: 'description', content: 'Análise de consumo por veículo' },
    ],
  }),
  component: VeiculosPage,
});

function VeiculosPage() {
  const ranking = getVehicleRanking();
  const [selectedModelo, setSelectedModelo] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'mediaKml' | 'totalValor' | 'totalLitros'>('mediaKml');

  const modelos = useMemo(() => {
    const set = new Set(ranking.map((v) => v.modelo));
    return Array.from(set).sort();
  }, [ranking]);

  const filtered = useMemo(() => {
    let data = selectedModelo === 'ALL' ? ranking : ranking.filter((v) => v.modelo === selectedModelo);
    return [...data].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [ranking, selectedModelo, sortBy]);

  const avgKml = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round((filtered.reduce((s, v) => s + v.mediaKml, 0) / filtered.length) * 100) / 100;
  }, [filtered]);

  const modelComparison = useMemo(() => {
    const byModel: Record<string, { totalKm: number; totalLitros: number; totalValor: number; count: number }> = {};
    ranking.forEach((v) => {
      if (!byModel[v.modelo]) byModel[v.modelo] = { totalKm: 0, totalLitros: 0, totalValor: 0, count: 0 };
      byModel[v.modelo].totalKm += v.totalKm;
      byModel[v.modelo].totalLitros += v.totalLitros;
      byModel[v.modelo].totalValor += v.totalValor;
      byModel[v.modelo].count += 1;
    });
    return Object.entries(byModel)
      .map(([modelo, d]) => ({
        modelo,
        mediaKml: Math.round((d.totalKm / d.totalLitros) * 100) / 100,
        valorMedio: Math.round(d.totalValor / d.count),
        veiculos: d.count,
      }))
      .sort((a, b) => b.mediaKml - a.mediaKml);
  }, [ranking]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Veículos</h1>
            <p className="text-sm text-muted-foreground">Análise de consumo e performance por veículo</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={selectedModelo}
              onChange={(e) => setSelectedModelo(e.target.value)}
              className="appearance-none rounded-lg border border-input bg-muted/50 py-2 pl-8 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Todos os modelos</option>
              {modelos.map((m) => (
                <option key={m} value={m}>{m}</option>
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
              <option value="totalValor">Ordenar por gasto</option>
              <option value="totalLitros">Ordenar por litros</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          {selectedModelo !== 'ALL' && (
            <button
              onClick={() => setSelectedModelo('ALL')}
              className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar filtro ✕
            </button>
          )}
        </div>

        {/* Model Comparison Chart */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Comparação entre Modelos (km/L)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modelComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
              <XAxis dataKey="modelo" stroke="oklch(0.5 0.02 260)" fontSize={10} />
              <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
              <Tooltip
                contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }}
                formatter={(value: number, name: string) => [name === 'mediaKml' ? `${value} km/L` : `R$ ${value.toLocaleString('pt-BR')}`, name === 'mediaKml' ? 'Média km/L' : 'Gasto médio']}
              />
              <Bar dataKey="mediaKml" fill="oklch(0.75 0.16 55)" radius={[4, 4, 0, 0]} name="Média km/L" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Filtered vehicle chart */}
        <div className="glass-card rounded-xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {selectedModelo === 'ALL' ? 'Consumo por Veículo (km/L)' : `Placas do modelo ${selectedModelo} (km/L)`}
            </h3>
            {selectedModelo !== 'ALL' && (
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {filtered.length} veículo{filtered.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
              <XAxis dataKey="placa" stroke="oklch(0.5 0.02 260)" fontSize={10} />
              <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
              <Tooltip
                contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }}
                formatter={(value: number) => [`${value} km/L`, 'Consumo']}
                labelFormatter={(label) => {
                  const v = filtered.find((f) => f.placa === label);
                  return v ? `${label} (${v.modelo})` : label;
                }}
              />
              <ReferenceLine y={avgKml} stroke="oklch(0.6 0.22 25)" strokeDasharray="5 5" label={{ value: `Média: ${avgKml}`, fill: 'oklch(0.6 0.22 25)', fontSize: 10, position: 'right' }} />
              <Bar dataKey="mediaKml" radius={[4, 4, 0, 0]} name="km/L">
                {filtered.map((v) => {
                  const belowAvg = v.mediaKml < avgKml * 0.85;
                  return <Cell key={v.placa} fill={belowAvg ? 'oklch(0.6 0.22 25)' : 'oklch(0.75 0.16 55)'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[10px] text-muted-foreground">Barras vermelhas indicam consumo 15%+ abaixo da média do grupo</p>
        </div>

        {/* Vehicle cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((v) => {
            const vehicle = mockVehicles.find((mv) => mv.placa === v.placa);
            const desvio = avgKml > 0 ? Math.round(((v.mediaKml - avgKml) / avgKml) * 100) : 0;
            return (
              <div key={v.placa} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2"><Car className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{v.placa}</p>
                    <p className="text-[10px] text-muted-foreground">{v.modelo}</p>
                  </div>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${desvio >= 0 ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                    {desvio > 0 ? '+' : ''}{desvio}%
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-lg font-bold text-foreground">{v.mediaKml}</p>
                    <p className="text-[10px] text-muted-foreground">km/L</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{v.abastecimentos}</p>
                    <p className="text-[10px] text-muted-foreground">abast.</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{v.totalLitros.toLocaleString('pt-BR')}L</p>
                    <p className="text-[10px] text-muted-foreground">total litros</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">R$ {v.totalValor.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-muted-foreground">total gasto</p>
                  </div>
                </div>
                {vehicle && (
                  <div className="mt-2 border-t border-border pt-2">
                    <p className="text-[10px] text-muted-foreground">Ref: {vehicle.consumo_referencia} km/L • {vehicle.contrato}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

// Need Cell import for conditional coloring
import { Cell } from 'recharts';
