import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { UploadFlow } from '@/components/upload/UploadFlow';

export const Route = createFileRoute('/upload')({
  head: () => ({
    meta: [
      { title: 'Importação — FleetAudit' },
      { name: 'description', content: 'Importar planilhas de abastecimento e rastreamento' },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importação de Dados</h1>
          <p className="text-sm text-muted-foreground">Importe suas planilhas para análise de auditoria</p>
        </div>

        <div className="grid gap-6">
          <UploadFlow
            type="rastreador"
            title="Importar Rastreador"
            description="Planilha do rastreador com Área/Rota, Unidade Rastreada e Data Inicial"
          />
          <UploadFlow
            type="frota"
            title="Importar Relação de Frota"
            description="Cadastro da frota com Placa, Modelo e Responsável Local"
          />
          <UploadFlow
            type="consumo"
            title="Importar Histórico de Consumo"
            description="Histórico de abastecimentos com KM, litros, valores e posto"
          />
        </div>
      </div>
    </AppLayout>
  );
}
