import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Car, Filter, ChevronDown, Loader2, Pencil, Trash2, Check, X, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { exportToExcel } from '@/lib/export-utils';
import { toast } from 'sonner';

export const Route = createFileRoute('/veiculos')({
  head: () => ({
    meta: [
      { title: 'Veículos — FleetAudit' },
      { name: 'description', content: 'Gestão e análise de consumo por veículo' },
    ],
  }),
  component: VeiculosPage,
});

interface FrotaRecord {
  id: string;
  placa: string;
  modelo: string | null;
  responsavel_local: string | null;
}

interface ConsumoAgg {
  placa: string;
  modelo: string;
  responsavel: string;
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

function VeiculosPage() {
  const [frota, setFrota] = useState<FrotaRecord[]>([]);
  const [consumoAgg, setConsumoAgg] = useState<ConsumoAgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModelo, setSelectedModelo] = useState('ALL');
  const [sortBy, setSortBy] = useState<'mediaKml' | 'totalValor' | 'totalLitros'>('mediaKml');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ modelo: string; responsavel_local: string }>({ modelo: '', responsavel_local: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [frotaRes, consumoRes] = await Promise.all([
      supabase.from('relacao_frota').select('*'),
      supabase.from('historico_consumo').select('*'),
    ]);
    const frotaData = (frotaRes.data || []) as FrotaRecord[];
    setFrota(frotaData);

    // Build consumption aggregates
    const modeloMap: Record<string, { modelo: string; responsavel: string }> = {};
    frotaData.forEach((f) => {
      const p = f.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
      modeloMap[p] = { modelo: f.modelo || 'Desconhecido', responsavel: f.responsavel_local || '—' };
    });

    const byV: Record<string, { km: number; litros: number; valor: number; count: number }> = {};
    (consumoRes.data || []).forEach((r: any) => {
      const p = (r.placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!p) return;
      if (!byV[p]) byV[p] = { km: 0, litros: 0, valor: 0, count: 0 };
      byV[p].km += Number(r.km_rodado) || 0;
      byV[p].litros += Number(r.quantidade_total) || 0;
      byV[p].valor += Number(r.valor_venda) || 0;
      byV[p].count += 1;
    });

    const aggs: ConsumoAgg[] = Object.entries(byV).map(([placa, d]) => ({
      placa,
      modelo: modeloMap[placa]?.modelo || 'Desconhecido',
      responsavel: modeloMap[placa]?.responsavel || '—',
      mediaKml: d.litros > 0 ? Math.round((d.km / d.litros) * 100) / 100 : 0,
      totalLitros: Math.round(d.litros),
      totalValor: Math.round(d.valor),
      totalKm: Math.round(d.km),
      abastecimentos: d.count,
    }));
    setConsumoAgg(aggs);
    setLoading(false);
  }

  const modelos = useMemo(() => Array.from(new Set(consumoAgg.map((v) => v.modelo))).sort(), [consumoAgg]);

  const filtered = useMemo(() => {
    let data = selectedModelo === 'ALL' ? consumoAgg : consumoAgg.filter((v) => v.modelo === selectedModelo);
    return [...data].sort((a, b) => sortBy === 'mediaKml' ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]);
  }, [consumoAgg, selectedModelo, sortBy]);

  const avgKml = useMemo(() => {
    if (filtered.length === 0) return 0;
    return Math.round((filtered.reduce((s, v) => s + v.mediaKml, 0) / filtered.length) * 100) / 100;
  }, [filtered]);

  async function startEdit(f: FrotaRecord) {
    setEditingId(f.id);
    setEditValues({ modelo: f.modelo || '', responsavel_local: f.responsavel_local || '' });
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from('relacao_frota')
      .update({ modelo: editValues.modelo, responsavel_local: editValues.responsavel_local })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('Veículo atualizado');
      setEditingId(null);
      loadData();
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm('Remover este veículo da frota?')) return;
    const { error } = await supabase.from('relacao_frota').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao remover: ' + error.message);
    } else {
      toast.success('Veículo removido');
      loadData();
    }
  }

  function handleExport() {
    const data = filtered.map((v) => ({
      Placa: v.placa,
      Modelo: v.modelo,
      'km/L': v.mediaKml,
      'Total Litros': v.totalLitros,
      'Total Valor': v.totalValor,
      'Total km': v.totalKm,
      Abastecimentos: v.abastecimentos,
    }));
    exportToExcel(data, 'veiculos-fleetaudit', 'Veículos');
    toast.success('Relatório exportado');
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Veículos</h1>
            <p className="text-sm text-muted-foreground">Gestão da frota e análise de consumo — dados reais</p>
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
                <select value={selectedModelo} onChange={(e) => setSelectedModelo(e.target.value)} className="appearance-none rounded-lg border border-input bg-muted/50 py-2 pl-8 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="ALL">Todos os modelos</option>
                  {modelos.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="appearance-none rounded-lg border border-input bg-muted/50 py-2 pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="mediaKml">Ordenar por km/L</option>
                  <option value="totalValor">Ordenar por gasto</option>
                  <option value="totalLitros">Ordenar por litros</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Chart */}
            {filtered.length > 0 && (
              <div className="glass-card rounded-xl p-5">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Consumo por Veículo (km/L) — Pior → Melhor</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filtered.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                    <XAxis dataKey="placa" stroke="oklch(0.5 0.02 260)" fontSize={10} />
                    <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v} km/L`, 'Consumo']} />
                    <ReferenceLine y={avgKml} stroke="oklch(0.6 0.22 25)" strokeDasharray="5 5" label={{ value: `Média: ${avgKml}`, fill: 'oklch(0.6 0.22 25)', fontSize: 10, position: 'right' }} />
                    <Bar dataKey="mediaKml" radius={[4, 4, 0, 0]}>
                      {filtered.slice(0, 15).map((v) => (
                        <Cell key={v.placa} fill={v.mediaKml < avgKml * 0.85 ? 'oklch(0.6 0.22 25)' : 'oklch(0.75 0.16 55)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Editable frota table */}
            <div className="glass-card rounded-xl p-5">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Cadastro da Frota ({frota.length} veículos)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Placa', 'Modelo', 'Responsável', 'Ações'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {frota.map((f) => (
                      <tr key={f.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground">{f.placa}</td>
                        <td className="px-4 py-2.5 text-xs text-foreground">
                          {editingId === f.id ? (
                            <input value={editValues.modelo} onChange={(e) => setEditValues((v) => ({ ...v, modelo: e.target.value }))} className="w-full rounded border border-input bg-muted/50 px-2 py-1 text-xs text-foreground" />
                          ) : (f.modelo || '—')}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-foreground">
                          {editingId === f.id ? (
                            <input value={editValues.responsavel_local} onChange={(e) => setEditValues((v) => ({ ...v, responsavel_local: e.target.value }))} className="w-full rounded border border-input bg-muted/50 px-2 py-1 text-xs text-foreground" />
                          ) : (f.responsavel_local || '—')}
                        </td>
                        <td className="px-4 py-2.5">
                          {editingId === f.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => saveEdit(f.id)} className="rounded p-1 text-success hover:bg-success/10"><Check className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setEditingId(null)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button onClick={() => startEdit(f)} className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-primary/10"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => deleteRecord(f.id)} className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {frota.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">Nenhum veículo cadastrado. Importe a relação de frota.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vehicle cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {filtered.slice(0, 12).map((v) => {
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
                    <div className="mt-2 border-t border-border pt-2">
                      <p className="text-[10px] text-muted-foreground">Resp: {v.responsavel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
