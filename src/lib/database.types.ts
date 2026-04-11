/**
 * TypeScript types matching the Supabase database schema
 */

export interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
  capacidade_tanque: number;
  contrato: string | null;
  created_at: string;
}

export interface VeiculoInsert {
  placa: string;
  modelo: string;
  capacidade_tanque: number;
  contrato?: string | null;
}

export interface Abastecimento {
  id: string;
  data_hora: string;
  placa_original: string;
  placa_validada: string | null;
  litros: number;
  valor_total: number;
  posto: string | null;
  motorista: string | null;
  km_odometro: number | null;
  status_auditoria: string;
  created_at: string;
}

export interface AbastecimentoInsert {
  data_hora: string;
  placa_original: string;
  placa_validada?: string | null;
  litros: number;
  valor_total: number;
  posto?: string | null;
  motorista?: string | null;
  km_odometro?: number | null;
  status_auditoria?: string;
}

export interface Rastreamento {
  id: string;
  placa: string;
  data_hora: string;
  latitude: number | null;
  longitude: number | null;
  ignicao: boolean;
  velocidade: number;
  created_at: string;
}

export interface RastreamentoInsert {
  placa: string;
  data_hora: string;
  latitude?: number | null;
  longitude?: number | null;
  ignicao?: boolean;
  velocidade?: number;
}

export type StatusAuditoria = 'PENDENTE' | 'CONFORME' | 'NAO_CONFORME' | 'SUSPEITO';

// --- Novas tabelas para importação de planilhas ---

export interface RastreadorBruto {
  id: string;
  area_rota: string | null;
  unidade_rastreada: string;
  modelo_extraido: string | null;
  placa_extraida: string | null;
  data_inicial_timestamp: string | null;
  created_at: string;
}

export interface RastreadorBrutoInsert {
  area_rota?: string | null;
  unidade_rastreada: string;
  modelo_extraido?: string | null;
  placa_extraida?: string | null;
  data_inicial_timestamp?: string | null;
}

export interface RelacaoFrota {
  id: string;
  placa: string;
  modelo: string | null;
  responsavel_local: string | null;
  created_at: string;
}

export interface RelacaoFrotaInsert {
  placa: string;
  modelo?: string | null;
  responsavel_local?: string | null;
}

export interface HistoricoConsumo {
  id: string;
  data_hora: string | null;
  placa: string | null;
  motorista: string | null;
  km_anterior: number | null;
  km_rodado: number | null;
  km_litro: number | null;
  quantidade_total: number | null;
  preco_unitario: number | null;
  valor_venda: number | null;
  produto: string | null;
  posto: string | null;
  created_at: string;
}

export interface HistoricoConsumoInsert {
  data_hora?: string | null;
  placa?: string | null;
  motorista?: string | null;
  km_anterior?: number | null;
  km_rodado?: number | null;
  km_litro?: number | null;
  quantidade_total?: number | null;
  preco_unitario?: number | null;
  valor_venda?: number | null;
  produto?: string | null;
  posto?: string | null;
}
