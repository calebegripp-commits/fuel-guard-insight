import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { getVehicleRanking, mockVehicles } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Car } from 'lucide-react';

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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Veículos</h1>
          <p className="text-sm text-muted-foreground">Análise de consumo e performance por veículo</p>
        </div>

        {/* Chart */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Consumo Médio por Veículo (km/L)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ranking}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
              <XAxis dataKey="placa" stroke="oklch(0.5 0.02 260)" fontSize={10} />
              <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }} />
              <Bar dataKey="mediaKml" fill="oklch(0.75 0.16 55)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ranking.map((v) => {
            const vehicle = mockVehicles.find((mv) => mv.placa === v.placa);
            return (
              <div key={v.placa} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2"><Car className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{v.placa}</p>
                    <p className="text-[10px] text-muted-foreground">{v.modelo}</p>
                  </div>
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
