import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { getMockAlerts } from '@/lib/mock-data';
import { AlertTriangle, ShieldAlert, FileWarning, CircleAlert } from 'lucide-react';

export const Route = createFileRoute('/alertas')({
  head: () => ({
    meta: [
      { title: 'Alertas — FleetAudit' },
      { name: 'description', content: 'Alertas e anomalias detectadas' },
    ],
  }),
  component: AlertasPage,
});

const iconMap = {
  consumo_alto: AlertTriangle,
  sem_rastreador: ShieldAlert,
  dados_inconsistentes: FileWarning,
  placa_invalida: CircleAlert,
};

const severityStyles = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-warning bg-warning/5',
  low: 'border-l-info bg-info/5',
};

function AlertasPage() {
  const alerts = getMockAlerts();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
          <p className="text-sm text-muted-foreground">Anomalias e inconsistências detectadas automaticamente</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{alerts.filter((a) => a.severity === 'high').length}</p>
            <p className="text-xs text-muted-foreground">Alta severidade</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-warning">{alerts.filter((a) => a.severity === 'medium').length}</p>
            <p className="text-xs text-muted-foreground">Média severidade</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-info">{alerts.filter((a) => a.severity === 'low').length}</p>
            <p className="text-xs text-muted-foreground">Baixa severidade</p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
            <p className="text-xs text-muted-foreground">Total de alertas</p>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = iconMap[alert.type];
            return (
              <div key={alert.id} className={`rounded-xl border-l-4 p-5 glass-card ${severityStyles[alert.severity]}`}>
                <div className="flex items-start gap-4">
                  <Icon className={`h-5 w-5 flex-shrink-0 ${alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-warning' : 'text-info'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">{alert.placa}</span>
                      <span>{alert.data.toLocaleDateString('pt-BR')}</span>
                      <span className="capitalize">{alert.type.replace(/_/g, ' ')}</span>
                    </div>
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
      </div>
    </AppLayout>
  );
}
