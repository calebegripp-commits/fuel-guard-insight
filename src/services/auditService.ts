/**
 * Audit service — re-exporta acesso aos dados de auditoria já calculados pelos
 * triggers do banco. A lógica pesada de cruzamento vive em PostgreSQL
 * (refresh_all_metrics).
 */
export { getAuditoria, getMetricasVeiculo, getStatusDados, refreshMetrics } from './reprocessService';
export type { AuditoriaConsumoRow, MetricaVeiculo, StatusDadosVeiculo } from './reprocessService';
