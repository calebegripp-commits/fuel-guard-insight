import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, FileWarning, CircleAlert, Car, Loader2, Filter, ChevronDown } from 'lucide-react';
import { fetchAlerts, type AlertItem } from '@/lib/alerts-engine';

export const Route = createFileRoute('/alertas')({
  head: () => ({
    meta: [
      { title: 'Alertas — FleetAudit' },
      { name: 'description', content: 'Alertas e anomalias detectadas automaticamente' },
    ],
  }),
  component: AlertasPage,
});

const iconMap: Record<AlertItem['type'], typeof AlertTriangle> = {
  placa_invalida: CircleAlert,
  suspeito: FileWarning,
  nao_conforme: ShieldAlert,
  desvio_consumo: AlertTriangle,
  nao_cadastrado: Car,
};

const typeLabels: Record<AlertItem['type'], string> = {
  placa_invalida: 'Placa Inválida',
  suspeito: 'Suspeito',
  nao_conforme: 'Não Conforme',
  desvio_consumo: 'Desvio de Consumo',
  nao_cadastrado: 'Não Cadastrado',
};

const severityStyles: Record<string, string> = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-warning bg-warning/5',
  low: 'border-l-info bg-info/5',
};

function AlertasPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<AlertItem['type'] | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'high' | 'medium' | 'low'>('ALL');

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  }

  const filtered = alerts.filter((a) => {
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const mediumCount = alerts.filter((a) => a.severity === 'medium').length;
  const lowCount = alerts.filter((a) => a.severity === 'low').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
          <p className="text-sm text-muted-foreground">Anomalias e inconsistências detectadas automaticamente a partir dos dados reais</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{highCount}</p>
            <p className="text-xs text-muted-foreground">Alta severidade</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-warning">{mediumCount}</p>
            <p className="text-xs text-muted-foreground">Média severidade</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-info">{lowCount}</p>
            <p className="text-xs text-muted-foreground">Baixa severidade</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
            <p className="text-xs text-muted-foreground">Total de alertas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="appearance-none rounded-lg border border-input bg-muted/50 py-2 pl-8 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Todos os tipos</option>
              <option value="placa_invalida">Placa Inválida</option>
              <option value="suspeito">Suspeito</option>
              <option value="nao_conforme">Não Conforme</option>
              <option value="desvio_consumo">Desvio de Consumo</option>
              <option value="nao_cadastrado">Não Cadastrado</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <div className="flex gap-1.5">
            {(['ALL', 'high', 'medium', 'low'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  severityFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'ALL' ? 'Todos' : s === 'high' ? 'Alto' : s === 'medium' ? 'Médio' : 'Baixo'}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Analisando dados...</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhum alerta encontrado. Importe dados na página de Upload.
          </p>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((alert) => {
              const Icon = iconMap[alert.type];
              return (
                <div key={alert.id} className={`rounded-xl border-l-4 p-5 glass-card ${severityStyles[alert.severity]}`}>
                  <div className="flex items-start gap-4">
                    <Icon className={`h-5 w-5 flex-shrink-0 ${alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-warning' : 'text-info'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">{alert.placa}</span>
                        {alert.data && <span>{new Date(alert.data).toLocaleString('pt-BR')}</span>}
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{typeLabels[alert.type]}</span>
                      </div>
                      {alert.detail && (
                        <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p>
                      )}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      alert.severity === 'high' ? 'bg-destructive/15 text-destructive' : alert.severity === 'medium' ? 'bg-warning/15 text-warning' : 'bg-info/15 text-info'
                    }`}>
                      {alert.severity === 'high' ? 'Alto' : alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
