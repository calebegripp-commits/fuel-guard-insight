import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  parseSpreadsheet,
  autoMapColumns,
  detectSheetType,
  mapRow,
  COLUMN_ALIASES,
  type ColumnMapping,
  type SheetType,
} from '@/services/importService';
import {
  toISO,
  toNumber,
  toText,
  normalizePlate,
  extractModeloPlaca,
} from '@/services/normalizationService';
import { ColumnMapper } from './ColumnMapper';
import { UploadResult } from './UploadResult';

type FlowType = 'rastreador' | 'frota' | 'consumo';

interface UploadFlowProps {
  type: FlowType;
  title: string;
  description: string;
}

const FLOW_CONFIG: Record<FlowType, { table: string; label: string }> = {
  rastreador: { table: 'rastreador_bruto', label: 'Rastreador' },
  frota: { table: 'relacao_frota', label: 'Relação de Frota' },
  consumo: { table: 'historico_consumo', label: 'Histórico de Consumo' },
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
  const [detected, setDetected] = useState<{ type: SheetType; confidence: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = FLOW_CONFIG[type];
  const mismatch = detected && detected.type !== 'unknown' && detected.type !== type;

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResult(null);
    setProgress(0);
    const buffer = await f.arrayBuffer();
    const parsed = parseSpreadsheet(buffer);
    setSheetData(parsed);

    const det = detectSheetType(parsed.columns);
    setDetected({ type: det.type, confidence: det.confidence });

    // Use mapping for the *expected* type of this card. If detected differs,
    // user gets a warning but can still proceed (or we re-map for detected).
    const expectedKey: FlowType = det.type !== 'unknown' && det.type !== type ? (det.type as FlowType) : type;
    setMapping(autoMapColumns(parsed.columns, COLUMN_ALIASES[expectedKey]));
  }, [type]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const effectiveType: FlowType = (detected && detected.type !== 'unknown' ? (detected.type as FlowType) : type);
  const effectiveConfig = FLOW_CONFIG[effectiveType];

  // If user changes detection acknowledgment, recompute mapping
  useEffect(() => {
    if (sheetData) {
      setMapping(autoMapColumns(sheetData.columns, COLUMN_ALIASES[effectiveType]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveType]);

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

        if (effectiveType === 'rastreador') {
          const raw = String(mapped.unidade_rastreada || '');
          const { modelo, placa, valida } = extractModeloPlaca(raw);
          if (!valida) invalidPlates++;
          return {
            area_rota: toText(mapped.area_rota),
            unidade_rastreada: raw,
            modelo_extraido: modelo || null,
            placa_extraida: placa,
            data_inicial_timestamp: toISO(mapped.data_inicial_timestamp),
          };
        }

        if (effectiveType === 'frota') {
          const placa = normalizePlate(mapped.placa);
          return {
            placa: placa || '',
            modelo: toText(mapped.modelo),
            responsavel_local: toText(mapped.responsavel_local),
          };
        }

        const placa = normalizePlate(mapped.placa);
        return {
          data_hora: toISO(mapped.data_hora),
          placa,
          motorista: toText(mapped.motorista),
          km_anterior: toNumber(mapped.km_anterior),
          km_rodado: toNumber(mapped.km_rodado),
          km_litro: toNumber(mapped.km_litro),
          quantidade_total: toNumber(mapped.quantidade_total),
          preco_unitario: toNumber(mapped.preco_unitario),
          valor_venda: toNumber(mapped.valor_venda),
          produto: toText(mapped.produto),
          posto: toText(mapped.posto),
        };
      });

      const tableName = effectiveConfig.table as 'rastreador_bruto' | 'relacao_frota' | 'historico_consumo';
      const { error } = await supabase.from(tableName).insert(records as never);

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
  }, [sheetData, mapping, effectiveType, effectiveConfig]);

  const reset = () => {
    setFile(null);
    setSheetData(null);
    setMapping({});
    setProgress(0);
    setResult(null);
    setDetected(null);
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
          <p className="mt-1 text-[10px] text-muted-foreground/70">A ordem não importa — auto-detecção do tipo</p>
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

          {detected && detected.type !== 'unknown' && (
            <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
              mismatch ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300' : 'border-green-500/40 bg-green-500/10 text-green-300'
            }`}>
              {mismatch ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="font-semibold">
                  {mismatch ? 'Tipo detectado diferente do esperado' : 'Planilha reconhecida'}
                </p>
                <p className="text-[11px] opacity-90">
                  Detectado: <b>{FLOW_CONFIG[detected.type as FlowType]?.label ?? detected.type}</b>
                  {' '}({Math.round(detected.confidence * 100)}% de confiança).
                  {mismatch && ` Os dados serão importados como "${FLOW_CONFIG[detected.type as FlowType]?.label}".`}
                </p>
              </div>
            </div>
          )}
          {detected && detected.type === 'unknown' && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Não foi possível identificar o tipo da planilha automaticamente. Use o mapeamento manual abaixo.</p>
            </div>
          )}

          <ColumnMapper mapping={mapping} sheetColumns={sheetData.columns} onUpdate={setMapping} />

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

          {uploading && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Importando... {progress}% — recálculo automático rodará no servidor
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {result && <UploadResult {...result} />}

          {!result && (
            <button
              onClick={processAndUpload}
              disabled={uploading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {uploading ? 'Importando...' : `Importar ${sheetData.data.length} registros como ${effectiveConfig.label}`}
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
