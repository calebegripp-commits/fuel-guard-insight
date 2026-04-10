import type { AuditStatus } from '@/lib/audit-engine';

const statusConfig: Record<AuditStatus, { label: string; className: string }> = {
  CONFORME: { label: 'Conforme', className: 'bg-success/15 text-success border-success/30' },
  SUSPEITO: { label: 'Suspeito', className: 'bg-warning/15 text-warning border-warning/30' },
  NAO_CONFORME: { label: 'Não Conforme', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export function StatusBadge({ status }: { status: AuditStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
