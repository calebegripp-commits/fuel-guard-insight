import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { mockAuditResults, getDashboardMetrics } from '@/lib/mock-data';
import { useState } from 'react';
import { Search, Filter, Download } from 'lucide-react';
import type { AuditStatus } from '@/lib/audit-engine';

export const Route = createFileRoute('/auditoria')({
  head: () => ({
    meta: [
      { title: 'Auditoria — FleetAudit' },
      { name: 'description', content: 'Resultados da auditoria de abastecimentos' },
    ],
  }),
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const [statusFilter, setStatusFilter] = useState<AuditStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const metrics = getDashboardMetrics();

  const filtered = mockAuditResults.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.fueling.placa.toLowerCase().includes(q) ||
        r.fueling.motorista.toLowerCase().includes(q) ||
        r.fueling.contrato.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auditoria</h1>
            <p className="text-sm text-muted-foreground">Análise de conformidade dos abastecimentos</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{metrics.conformidade}%</p>
            <p className="text-xs text-muted-foreground">Conformidade</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-success">{metrics.conforme}</p>
            <p className="text-xs text-muted-foreground">Conformes</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-warning">{metrics.suspeito}</p>
            <p className="text-xs text-muted-foreground">Suspeitos</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{metrics.naoConforme}</p>
            <p className="text-xs text-muted-foreground">Não Conformes</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar placa, motorista ou contrato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-muted/50 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1.5">
            {(['ALL', 'CONFORME', 'SUSPEITO', 'NAO_CONFORME'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'ALL' ? 'Todos' : s === 'NAO_CONFORME' ? 'Não Conforme' : s === 'CONFORME' ? 'Conforme' : 'Suspeito'}
              </button>
            ))}
          </div>
        </div>

        {/* Results table */}
        <div className="glass-card overflow-hidden rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['ID', 'Placa', 'Data', 'Motorista', 'Litros', 'Valor', 'km/L', 'Desvio', 'Status', 'Motivo'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((r) => (
                  <tr key={r.fueling.id} className="border-b border-border/50 transition-colors hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.fueling.id}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground">{r.fueling.placa}</td>
                    <td className="px-4 py-2.5 text-xs text-foreground">{r.fueling.data.toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-2.5 text-xs text-foreground">{r.fueling.motorista}</td>
                    <td className="px-4 py-2.5 text-xs text-foreground">{r.fueling.litros}L</td>
                    <td className="px-4 py-2.5 text-xs text-foreground">R$ {r.fueling.valor.toFixed(2)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.consumo_kml}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={r.desvio_media && Math.abs(r.desvio_media) > 20 ? 'text-destructive' : 'text-muted-foreground'}>
                        {r.desvio_media ? `${r.desvio_media > 0 ? '+' : ''}${r.desvio_media}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-muted-foreground">{r.reasons.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-muted/20 px-4 py-2.5">
            <p className="text-xs text-muted-foreground">Mostrando {Math.min(filtered.length, 50)} de {filtered.length} resultados</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
