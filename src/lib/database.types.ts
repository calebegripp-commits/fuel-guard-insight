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
