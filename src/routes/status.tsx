import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { getStatusDados, type StatusDadosVeiculo } from '@/services/reprocessService';
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/status')({
  head: () => ({
    meta: [
      { title: 'Status dos Dados — FleetAudit' },
      { name: 'description', content: 'Painel de completude de dados por veículo' },
    ],
  }),
  component: StatusPage,
});

function StatusPage() {
  const [rows, setRows] = useState<StatusDadosVeiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'completo' | 'parcial' | 'incompleto'>('todos');

  useEffect(() => {
    getStatusDados()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'todos' ? rows : rows.filter((r) => r.completude === filter);

  const counts = {
    completo: rows.filter((r) => r.completude === 'completo').length,
    parcial: rows.filter((r) => r.completude === 'parcial').length,
    incompleto: rows.filter((r) => r.completude === 'incompleto').length,
    total: rows.length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Status dos Dados</h1>
          <p className="text-sm text-muted-foreground">
            Completude por veículo — fontes disponíveis (frota, consumo, rastreador)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total de placas" value={counts.total} tone="muted" />
              <StatCard label="Completos" value={counts.completo} tone="success" onClick={() => setFilter('completo')} active={filter === 'completo'} />
              <StatCard label="Parciais" value={counts.parcial} tone="warning" onClick={() => setFilter('parcial')} active={filter === 'parcial'} />
              <StatCard label="Incompletos" value={counts.incompleto} tone="danger" onClick={() => setFilter('incompleto')} active={filter === 'incompleto'} />
            </div>

            <div className="flex gap-2 text-xs">
              {(['todos', 'completo', 'parcial', 'incompleto'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 transition-colors ${
                    filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="glass-card overflow-hidden rounded-xl">
              <div className="max-h-[60vh] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                    <tr className="text-left text-xs uppercase text-muted-foreground">
                      <th className="px-4 py-2">Placa</th>
                      <th className="px-4 py-2 text-center">Frota</th>
                      <th className="px-4 py-2 text-center">Consumo</th>
                      <th className="px-4 py-2 text-center">Rastreador</th>
                      <th className="px-4 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.placa} className="border-t border-border/30 hover:bg-muted/30">
                        <td className="px-4 py-2 font-mono font-semibold text-foreground">{r.placa}</td>
                        <td className="px-4 py-2 text-center"><Cell ok={r.tem_frota} /></td>
                        <td className="px-4 py-2 text-center">
                          <Cell ok={r.tem_consumo} extra={r.num_consumo > 0 ? `${r.num_consumo}x` : undefined} />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <Cell ok={r.tem_rastreador} extra={r.num_rastreador > 0 ? `${r.num_rastreador}x` : undefined} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <StatusBadge value={r.completude} />
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          Nenhum veículo nesse filtro
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, tone, onClick, active }: { label: string; value: number; tone: 'muted' | 'success' | 'warning' | 'danger'; onClick?: () => void; active?: boolean }) {
  const toneCls = {
    muted: 'border-border',
    success: 'border-green-500/40 text-green-400',
    warning: 'border-yellow-500/40 text-yellow-400',
    danger: 'border-red-500/40 text-red-400',
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`glass-card rounded-xl p-4 text-left transition-all ${toneCls} ${active ? 'ring-2 ring-primary' : ''} ${onClick ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default'}`}
    >
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </button>
  );
}

function Cell({ ok, extra }: { ok: boolean; extra?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {ok ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-muted-foreground/40" />}
      {extra && <span className="text-[10px] text-muted-foreground">{extra}</span>}
    </span>
  );
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, { cls: string; icon: typeof CheckCircle2 }> = {
    completo: { cls: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
    parcial: { cls: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
    incompleto: { cls: 'bg-red-500/20 text-red-400', icon: XCircle },
  };
  const cfg = map[value] ?? map.incompleto;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {value}
    </span>
  );
}
