import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/AppLayout';
import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { extractPlate } from '@/lib/plate-extractor';

export const Route = createFileRoute('/upload')({
  head: () => ({
    meta: [
      { title: 'Importação — FleetAudit' },
      { name: 'description', content: 'Importar planilhas de abastecimento e rastreamento' },
    ],
  }),
  component: UploadPage,
});

interface UploadedFile {
  name: string;
  type: 'csv' | 'xlsx';
  rows: number;
  columns: string[];
  data: Record<string, unknown>[];
  plateResults?: { placa_extraida: string; placa_valida: boolean }[];
}

function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setProcessing(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv') {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        const data = result.data as Record<string, unknown>[];
        const columns = result.meta.fields || [];

        // Try plate extraction on vehicle-like columns
        let plateResults: UploadedFile['plateResults'];
        const vehicleCol = columns.find((c) => /veiculo|veículo|vehicle|descri/i.test(c));
        if (vehicleCol) {
          plateResults = data.map((row) => extractPlate(String(row[vehicleCol] || '')));
        }

        setFiles((prev) => [...prev, { name: file.name, type: 'csv', rows: data.length, columns, data, plateResults }]);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
        const columns = data.length > 0 ? Object.keys(data[0]) : [];

        let plateResults: UploadedFile['plateResults'];
        const vehicleCol = columns.find((c) => /veiculo|veículo|vehicle|descri/i.test(c));
        if (vehicleCol) {
          plateResults = data.map((row) => extractPlate(String(row[vehicleCol] || '')));
        }

        setFiles((prev) => [...prev, { name: file.name, type: 'xlsx', rows: data.length, columns, data, plateResults }]);
      }
    } catch (err) {
      console.error('Error processing file:', err);
    }
    setProcessing(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) Array.from(e.target.files).forEach(processFile);
  }, [processFile]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importação de Dados</h1>
          <p className="text-sm text-muted-foreground">Importe arquivos CSV e Excel para análise</p>
        </div>

        {/* Upload Area */}
        <div
          className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="mt-4 text-sm font-medium text-foreground">
            {processing ? 'Processando...' : 'Arraste arquivos aqui ou clique para selecionar'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Suporta CSV, XLS e XLSX</p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={handleFileInput}
          />
        </div>

        {/* File types guide */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: 'Abastecimentos', desc: 'CSV com dados de abastecimento', ext: 'CSV' },
            { title: 'Rastreador', desc: 'Excel com dados do rastreador', ext: 'XLSX' },
            { title: 'Frota', desc: 'Excel com dados dos veículos', ext: 'XLSX' },
          ].map((t) => (
            <div key={t.title} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                  <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{t.ext}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Uploaded files */}
        {files.map((f, idx) => (
          <div key={idx} className="glass-card rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.rows} registros • {f.columns.length} colunas</p>
                </div>
              </div>
              <button onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Column preview */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {f.columns.map((col) => (
                <span key={col} className="rounded-md bg-muted px-2 py-1 text-[10px] font-mono text-muted-foreground">{col}</span>
              ))}
            </div>

            {/* Plate extraction results */}
            {f.plateResults && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-2 text-xs font-semibold text-foreground">Extração de Placas</p>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {f.plateResults.filter((p) => p.placa_valida).length} válidas
                  </span>
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {f.plateResults.filter((p) => !p.placa_valida).length} inválidas
                  </span>
                </div>
                <div className="mt-2 max-h-40 overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="pb-1 text-left font-medium">Placa Extraída</th>
                        <th className="pb-1 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {f.plateResults.slice(0, 20).map((p, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="py-1 font-mono text-foreground">{p.placa_extraida || '—'}</td>
                          <td className="py-1">
                            {p.placa_valida ? (
                              <span className="text-success">✓ Válida</span>
                            ) : (
                              <span className="text-destructive">✗ Inválida</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Data preview */}
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-xs font-semibold text-foreground">Preview dos dados</p>
              <div className="max-h-48 overflow-auto rounded-lg bg-muted/50">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr>
                      {f.columns.slice(0, 8).map((col) => (
                        <th key={col} className="sticky top-0 bg-muted px-2 py-1.5 text-left font-medium text-muted-foreground">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {f.data.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t border-border/30">
                        {f.columns.slice(0, 8).map((col) => (
                          <td key={col} className="px-2 py-1 text-foreground">{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
