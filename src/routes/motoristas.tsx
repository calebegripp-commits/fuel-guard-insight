import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2, Filter, ChevronDown, Download, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { exportToExcel } from '@/lib/export-utils';
import { toast } from 'sonner';

export const Route = createFileRoute('/motoristas')({
  head: () => ({
    meta: [
      { title: 'Motoristas — FleetAudit' },
      { name: 'description', content: 'Ranking de consumo por motorista' },
    ],
  }),
  component: MotoristasPage,
});

interface DriverAgg {
  motorista: string;
  mediaKml: number;
  totalLitros: number;
  totalValor: number;
  totalKm: number;
  abastecimentos: number;
}

const TOOLTIP_STYLE = {
  background: 'oklch(0.19 0.025 260)',
  border: '1px solid oklch(0.28 0.02 260)',
  borderRadius: 8,
  color: 'oklch(0.95 0.01 260)',
};

function MotoristasPage() {
  const [drivers, setDrivers] = useState<DriverAgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'mediaKml' | 'totalValor' | 'totalLitros'>('mediaKml');
  const [selectedMotorista, setSelectedMotorista] = useState('ALL');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('historico_consumo').select('*');
    const consumo = data || [];

    const byDriver: Record<string, { km: number; litros: number; valor: number; count: number }> = {};
    consumo.forEach((r: any) => {
      const m = r.motorista || 'Desconhecido';
      if (!byDriver[m]) byDriver[m] = { km: 0, litros: 0, valor: 0, count: 0 };
      byDriver[m].km += Number(r.km_rodado) || 0;
      byDriver[m].litros += Number(r.quantidade_total) || 0;
      byDriver[m].valor += Number(r.valor_venda) || 0;
      byDriver[m].count += 1;
    });

    setDrivers(
      Object.entries(byDriver).map(([motorista, d]) => ({
        motorista,
        mediaKml: d.litros > 0 ? Math.round((d.km / d.litros) * 100) / 100 : 0,
        totalLitros: Math.round(d.litros),
        totalValor: Math.round(d.valor),
        totalKm: Math.round(d.km),
        abastecimentos: d.count,
      }))
    );
    setLoading(false);
  }

  const sorted = useMemo(() => {
    const data = selectedMotorista === 'ALL' ? drivers : drivers.filter((d) => d.motorista === selectedMotorista);
    return [...data].sort((a, b) => sortBy === 'mediaKml' ? b.mediaKml - a.mediaKml : b[sortBy] - a[sortBy]);
  }, [drivers, sortBy, selectedMotorista]);

  const avgKml = useMemo(() => {
    if (sorted.length === 0) return 0;
    return Math.round((sorted.reduce((s, d) => s + d.mediaKml, 0) / sorted.length) * 100) / 100;
  }, [sorted]);

  function handleExport() {
    const data = sorted.map((d) => ({
      Motorista: d.motorista,
      'km/L': d.mediaKml,
      'Total Litros': d.totalLitros,
      'Total Valor': d.totalValor,
      'Total km': d.totalKm,
      Abastecimentos: d.abastecimentos,
    }));
    exportToExcel(data, 'motoristas-fleetaudit', 'Motoristas');
    toast.success('Relatório exportado');
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Motoristas</h1>
            <p className="text-sm text-muted-foreground">Ranking e análise de consumo — dados reais</p>
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Exportar Excel
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <select value={selectedMotorista} onChange={(e) => setSelectedMotorista(e.target.value)} className="appearance-none rounded-lg border border-input bg-muted/50 py-2 pl-8 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="ALL">Todos os motoristas</option>
                  {drivers.map((d) => <option key={d.motorista} value={d.motorista}>{d.motorista}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="appearance-none rounded-lg border border-input bg-muted/50 py-2 pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="mediaKml">Ordenar por km/L</option>
                  <option value="totalValor">Ordenar por gasto total</option>
                  <option value="totalLitros">Ordenar por litros</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="glass-card rounded-xl p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Consumo Médio (km/L)</h3>
                {sorted.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sorted}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                      <XAxis dataKey="motorista" stroke="oklch(0.5 0.02 260)" fontSize={10} />
                      <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} km/L`, 'Consumo']} />
                      <ReferenceLine y={avgKml} stroke="oklch(0.6 0.22 25)" strokeDasharray="5 5" label={{ value: `Média: ${avgKml}`, fill: 'oklch(0.6 0.22 25)', fontSize: 10, position: 'right' }} />
                      <Bar dataKey="mediaKml" radius={[4, 4, 0, 0]}>
                        {sorted.map((d) => (
                          <Cell key={d.motorista} fill={d.mediaKml < avgKml * 0.85 ? 'oklch(0.6 0.22 25)' : 'oklch(0.65 0.18 145)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-16 text-center text-sm text-muted-foreground">Sem dados</p>}
              </div>
              <div className="glass-card rounded-xl p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Gasto Total por Motorista (R$)</h3>
                {sorted.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[...sorted].sort((a, b) => b.totalValor - a.totalValor)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                      <XAxis dataKey="motorista" stroke="oklch(0.5 0.02 260)" fontSize={10} />
                      <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Gasto']} />
                      <Bar dataKey="totalValor" fill="oklch(0.78 0.16 70)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="py-16 text-center text-sm text-muted-foreground">Sem dados</p>}
              </div>
            </div>

            {/* Ranking list */}
            <div className="space-y-3">
              {sorted.map((d, i) => {
                const desvio = avgKml > 0 ? Math.round(((d.mediaKml - avgKml) / avgKml) * 100) : 0;
                return (
                  <div key={d.motorista} className="glass-card flex items-center justify-between rounded-xl px-5 py-4 transition-all hover:ring-1 hover:ring-border">
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
              {sorted.length === 0 && (
                <p className="py-16 text-center text-sm text-muted-foreground">Nenhum motorista encontrado. Importe o histórico de consumo.</p>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
