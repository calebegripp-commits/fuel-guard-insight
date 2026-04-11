import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useState, useEffect } from 'react';
import { Search, Download, CalendarDays, Eye, Loader2 } from 'lucide-react';
import { runAuditCrossRef, type AuditCrossResult, type AuditCrossStatus } from '@/lib/audit-crossref';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [statusFilter, setStatusFilter] = useState<AuditCrossStatus | 'ALL'>('ALL');
  const [placaFilter, setPlacaFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [results, setResults] = useState<AuditCrossResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AuditCrossResult | null>(null);

  useEffect(() => {
    loadAudit();
  }, []);

  async function loadAudit() {
    setLoading(true);
    setError(null);
    try {
      const data = await runAuditCrossRef({
        placa: placaFilter || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar auditoria');
    } finally {
      setLoading(false);
    }
  }

  const filtered = results.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  const conforme = results.filter((r) => r.status === 'CONFORME').length;
  const suspeito = results.filter((r) => r.status === 'SUSPEITO').length;
  const naoConforme = results.filter((r) => r.status === 'NAO_CONFORME').length;
  const conformidade = results.length > 0 ? Math.round((conforme / results.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Auditoria</h1>
            <p className="text-sm text-muted-foreground">Cruzamento entre histórico de consumo e rastreador</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{conformidade}%</p>
            <p className="text-xs text-muted-foreground">Conformidade</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-success">{conforme}</p>
            <p className="text-xs text-muted-foreground">Conformes</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-warning">{suspeito}</p>
            <p className="text-xs text-muted-foreground">Suspeitos</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{naoConforme}</p>
            <p className="text-xs text-muted-foreground">Não Conformes</p>
          </div>
        </div>

        {/* Filters */}
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
            onClick={loadAudit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Buscar
          </button>
        </div>

        {/* Status filter chips */}
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

        {/* Loading / Error / Empty states */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Processando auditoria...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum registro encontrado. Importe dados na página de Upload primeiro.
          </div>
        )}

        {/* Results table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="glass-card overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Data', 'Placa', 'Motorista', 'Posto', 'Litros', 'Valor', 'km/L', 'Status', 'Motivo', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((r) => (
                    <tr key={r.id} className="border-b border-border/50 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-2.5 text-xs text-foreground">
                        {r.data_hora ? new Date(r.data_hora).toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-foreground">{r.placa || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-foreground">{r.motorista || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-foreground">{r.posto || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-foreground">{r.quantidade_total ? `${r.quantidade_total}L` : '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-foreground">
                        {r.valor_venda ? `R$ ${Number(r.valor_venda).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.km_litro ?? '—'}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                      <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-muted-foreground" title={r.motivo}>{r.motivo}</td>
                      <td className="px-4 py-2.5">
                        {r.status === 'SUSPEITO' && (
                          <button
                            onClick={() => setSelectedRecord(r)}
                            className="flex items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning hover:bg-warning/20"
                          >
                            <Eye className="h-3 w-3" />
                            Detalhes
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border bg-muted/20 px-4 py-2.5">
              <p className="text-xs text-muted-foreground">
                Mostrando {Math.min(filtered.length, 100)} de {filtered.length} resultados
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes do Registro Suspeito</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Placa</p>
                  <p className="font-mono font-semibold text-foreground">{selectedRecord.placa}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data/Hora</p>
                  <p className="text-foreground">
                    {selectedRecord.data_hora ? new Date(selectedRecord.data_hora).toLocaleString('pt-BR') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Motorista</p>
                  <p className="text-foreground">{selectedRecord.motorista || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posto</p>
                  <p className="text-foreground">{selectedRecord.posto || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Litros</p>
                  <p className="text-foreground">{selectedRecord.quantidade_total ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-foreground">
                    {selectedRecord.valor_venda ? `R$ ${Number(selectedRecord.valor_venda).toFixed(2)}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">km/L</p>
                  <p className="text-foreground">{selectedRecord.km_litro ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">km Rodado</p>
                  <p className="text-foreground">{selectedRecord.km_rodado ?? '—'}</p>
                </div>
              </div>

              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                <p className="mb-1 text-xs font-medium text-warning">Motivo da Suspeita</p>
                <p className="text-xs text-foreground">{selectedRecord.motivo}</p>
              </div>

              {selectedRecord.rastreador && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Dados do Rastreador</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Unidade</p>
                      <p className="text-foreground">{selectedRecord.rastreador.unidade_rastreada}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Placa Extraída</p>
                      <p className="font-mono text-foreground">{selectedRecord.rastreador.placa_extraida || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Área/Rota</p>
                      <p className="text-foreground">{selectedRecord.rastreador.area_rota || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data Rastreador</p>
                      <p className="text-foreground">
                        {selectedRecord.rastreador.data_inicial_timestamp
                          ? new Date(selectedRecord.rastreador.data_inicial_timestamp).toLocaleString('pt-BR')
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
