import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { getDriverRanking } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Trophy } from 'lucide-react';

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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Motoristas</h1>
          <p className="text-sm text-muted-foreground">Ranking e análise de consumo por motorista</p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Consumo Médio por Motorista (km/L)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ranking}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
              <XAxis dataKey="motorista" stroke="oklch(0.5 0.02 260)" fontSize={10} />
              <YAxis stroke="oklch(0.5 0.02 260)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'oklch(0.19 0.025 260)', border: '1px solid oklch(0.28 0.02 260)', borderRadius: 8, color: 'oklch(0.95 0.01 260)' }} />
              <Bar dataKey="mediaKml" fill="oklch(0.65 0.18 145)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {ranking.map((d, i) => (
            <div key={d.motorista} className="glass-card flex items-center justify-between rounded-xl px-5 py-4">
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
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
