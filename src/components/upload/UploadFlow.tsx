import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  parseSpreadsheet, autoMapColumns, mapRow, toISO,
  extractModeloPlaca,
  RASTREADOR_COLUMNS, FROTA_COLUMNS, CONSUMO_COLUMNS,
  type ColumnMapping,
} from '@/lib/upload-helpers';
import { ColumnMapper } from './ColumnMapper';
import { UploadResult } from './UploadResult';
import { normalizePlate as normPlate } from '@/lib/plate-extractor';

type FlowType = 'rastreador' | 'frota' | 'consumo';

interface UploadFlowProps {
  type: FlowType;
  title: string;
  description: string;
}

const FLOW_CONFIG: Record<FlowType, { columns: Record<string, readonly string[]>; table: string }> = {
  rastreador: { columns: RASTREADOR_COLUMNS, table: 'rastreador_bruto' },
  frota: { columns: FROTA_COLUMNS, table: 'relacao_frota' },
  consumo: { columns: CONSUMO_COLUMNS, table: 'historico_consumo' },
};

const BATCH_SIZE = 100;

export function UploadFlow({ type, title, description }: UploadFlowProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetData, setSheetData] = useState<{ data: Record<string, unknown>[]; columns: string[] } | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ total: number; success: number; errors: number; invalidPlates: number; errorMessages: string[] } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = FLOW_CONFIG[type];

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResult(null);
    setProgress(0);
    const buffer = await f.arrayBuffer();
    const parsed = parseSpreadsheet(buffer);
    setSheetData(parsed);
    const autoMap = autoMapColumns(parsed.columns, config.columns);
    setMapping(autoMap);
  }, [config]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const processAndUpload = useCallback(async () => {
    if (!sheetData) return;
    setUploading(true);
    setProgress(0);

    const rows = sheetData.data;
    let success = 0;
    let errors = 0;
    let invalidPlates = 0;
    const errorMessages: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const records = batch.map((row) => {
        const mapped = mapRow(row, mapping);

        if (type === 'rastreador') {
          const raw = String(mapped.unidade_rastreada || '');
          const { modelo, placa, placaValida } = extractModeloPlaca(raw);
          if (!placaValida) invalidPlates++;
          return {
            area_rota: mapped.area_rota ? String(mapped.area_rota) : null,
            unidade_rastreada: raw,
            modelo_extraido: modelo || null,
            placa_extraida: placa || null,
            data_inicial_timestamp: toISO(mapped.data_inicial_timestamp),
          };
        }

        if (type === 'frota') {
          const placa = normPlate(String(mapped.placa || ''));
          return {
            placa,
            modelo: mapped.modelo ? String(mapped.modelo) : null,
            responsavel_local: mapped.responsavel_local ? String(mapped.responsavel_local) : null,
          };
        }

        // consumo
        const placa = normPlate(String(mapped.placa || ''));
        return {
          data_hora: toISO(mapped.data_hora),
          placa: placa || null,
          motorista: mapped.motorista ? String(mapped.motorista) : null,
          km_anterior: mapped.km_anterior != null ? Number(mapped.km_anterior) || null : null,
          km_rodado: mapped.km_rodado != null ? Number(mapped.km_rodado) || null : null,
          km_litro: mapped.km_litro != null ? Number(mapped.km_litro) || null : null,
          quantidade_total: mapped.quantidade_total != null ? Number(mapped.quantidade_total) || null : null,
          preco_unitario: mapped.preco_unitario != null ? Number(mapped.preco_unitario) || null : null,
          valor_venda: mapped.valor_venda != null ? Number(mapped.valor_venda) || null : null,
          produto: mapped.produto ? String(mapped.produto) : null,
          posto: mapped.posto ? String(mapped.posto) : null,
        };
      });

      const { error } = await supabase.from(config.table as 'rastreador_bruto' | 'relacao_frota' | 'historico_consumo').insert(records as any);

      if (error) {
        errors += batch.length;
        errorMessages.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        success += batch.length;
      }

      setProgress(Math.min(100, Math.round(((i + batch.length) / rows.length) * 100)));
    }

    setResult({ total: rows.length, success, errors, invalidPlates, errorMessages });
    setUploading(false);
  }, [sheetData, mapping, type, config]);

  const reset = () => {
    setFile(null);
    setSheetData(null);
    setMapping({});
    setProgress(0);
    setResult(null);
  };

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {!file && (
        <div
          className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">Arraste ou clique para selecionar (.csv, .xlsx, .xls)</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
          />
        </div>
      )}

      {file && sheetData && (
        <>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-foreground">{file.name}</p>
              <p className="text-[10px] text-muted-foreground">{sheetData.data.length} registros • {sheetData.columns.length} colunas</p>
            </div>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">✕ Remover</button>
          </div>

          {/* Column mapper for unmapped fields */}
          <ColumnMapper mapping={mapping} sheetColumns={sheetData.columns} onUpdate={setMapping} />

          {/* Mapped columns preview */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Mapeamento de colunas</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(mapping).filter(([, v]) => v).map(([db, sheet]) => (
                <span key={db} className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-mono text-primary">
                  {sheet} → {db}
                </span>
              ))}
            </div>
          </div>

          {/* Data preview */}
          <div className="max-h-40 overflow-auto rounded-lg bg-muted/30">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  {sheetData.columns.slice(0, 8).map((c) => (
                    <th key={c} className="sticky top-0 bg-muted px-2 py-1 text-left font-medium text-muted-foreground">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetData.data.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-t border-border/30">
                    {sheetData.columns.slice(0, 8).map((c) => (
                      <td key={c} className="px-2 py-1 text-foreground">{String(row[c] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Importando... {progress}%
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Result */}
          {result && <UploadResult {...result} />}

          {/* Action button */}
          {!result && (
            <button
              onClick={processAndUpload}
              disabled={uploading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? 'Importando...' : `Importar ${sheetData.data.length} registros`}
            </button>
          )}

          {result && (
            <button onClick={reset} className="w-full rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">
              Importar outro arquivo
            </button>
          )}
        </>
      )}
    </div>
  );
}
