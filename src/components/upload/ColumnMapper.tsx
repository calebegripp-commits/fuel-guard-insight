import type { ColumnMapping } from '@/lib/upload-helpers';

interface ColumnMapperProps {
  mapping: ColumnMapping;
  sheetColumns: string[];
  onUpdate: (mapping: ColumnMapping) => void;
}

export function ColumnMapper({ mapping, sheetColumns, onUpdate }: ColumnMapperProps) {
  const unmapped = Object.entries(mapping).filter(([, v]) => !v);
  if (unmapped.length === 0) return null;

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
      <p className="mb-3 text-sm font-semibold text-warning">
        ⚠ {unmapped.length} campo(s) não mapeado(s) automaticamente
      </p>
      <div className="grid gap-2">
        {unmapped.map(([dbField]) => (
          <div key={dbField} className="flex items-center gap-3">
            <span className="w-40 text-xs font-mono text-muted-foreground">{dbField}</span>
            <select
              className="flex-1 rounded-md border border-border bg-muted px-2 py-1.5 text-xs text-foreground"
              value={mapping[dbField] ?? ''}
              onChange={(e) => onUpdate({ ...mapping, [dbField]: e.target.value || null })}
            >
              <option value="">— Ignorar —</option>
              {sheetColumns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
