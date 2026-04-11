import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface UploadResultProps {
  total: number;
  success: number;
  errors: number;
  invalidPlates?: number;
  errorMessages?: string[];
}

export function UploadResult({ total, success, errors, invalidPlates, errorMessages }: UploadResultProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <p className="text-sm font-semibold text-foreground">Resultado da Importação</p>
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-success">
          <CheckCircle className="h-4 w-4" />
          {success} importados
        </span>
        {errors > 0 && (
          <span className="flex items-center gap-1.5 text-destructive">
            <XCircle className="h-4 w-4" />
            {errors} erros
          </span>
        )}
        {invalidPlates != null && invalidPlates > 0 && (
          <span className="flex items-center gap-1.5 text-warning">
            <AlertCircle className="h-4 w-4" />
            {invalidPlates} placas inválidas
          </span>
        )}
      </div>
      {errorMessages && errorMessages.length > 0 && (
        <div className="max-h-24 overflow-auto rounded bg-destructive/10 p-2 text-xs text-destructive">
          {errorMessages.slice(0, 5).map((msg, i) => <p key={i}>{msg}</p>)}
          {errorMessages.length > 5 && <p>...e mais {errorMessages.length - 5} erros</p>}
        </div>
      )}
    </div>
  );
}
