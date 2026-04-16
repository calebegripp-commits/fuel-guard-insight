export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      abastecimentos: {
        Row: {
          created_at: string
          data_hora: string
          id: string
          km_odometro: number | null
          litros: number
          motorista: string | null
          placa_original: string
          placa_validada: string | null
          posto: string | null
          status_auditoria: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_hora: string
          id?: string
          km_odometro?: number | null
          litros: number
          motorista?: string | null
          placa_original: string
          placa_validada?: string | null
          posto?: string | null
          status_auditoria?: string
          valor_total: number
        }
        Update: {
          created_at?: string
          data_hora?: string
          id?: string
          km_odometro?: number | null
          litros?: number
          motorista?: string | null
          placa_original?: string
          placa_validada?: string | null
          posto?: string | null
          status_auditoria?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "abastecimentos_placa_validada_fkey"
            columns: ["placa_validada"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["placa"]
          },
        ]
      }
      auditoria_consumo: {
        Row: {
          area_rota_rastreador: string | null
          atualizado_em: string
          consumo_id: string
          data_hora: string | null
          diff_minutos: number | null
          id: string
          motivo: string | null
          placa: string | null
          posto: string | null
          status: string
        }
        Insert: {
          area_rota_rastreador?: string | null
          atualizado_em?: string
          consumo_id: string
          data_hora?: string | null
          diff_minutos?: number | null
          id?: string
          motivo?: string | null
          placa?: string | null
          posto?: string | null
          status: string
        }
        Update: {
          area_rota_rastreador?: string | null
          atualizado_em?: string
          consumo_id?: string
          data_hora?: string | null
          diff_minutos?: number | null
          id?: string
          motivo?: string | null
          placa?: string | null
          posto?: string | null
          status?: string
        }
        Relationships: []
      }
      historico_consumo: {
        Row: {
          created_at: string
          data_hora: string | null
          id: string
          km_anterior: number | null
          km_litro: number | null
          km_rodado: number | null
          motorista: string | null
          placa: string | null
          posto: string | null
          preco_unitario: number | null
          produto: string | null
          quantidade_total: number | null
          valor_venda: number | null
        }
        Insert: {
          created_at?: string
          data_hora?: string | null
          id?: string
          km_anterior?: number | null
          km_litro?: number | null
          km_rodado?: number | null
          motorista?: string | null
          placa?: string | null
          posto?: string | null
          preco_unitario?: number | null
          produto?: string | null
          quantidade_total?: number | null
          valor_venda?: number | null
        }
        Update: {
          created_at?: string
          data_hora?: string | null
          id?: string
          km_anterior?: number | null
          km_litro?: number | null
          km_rodado?: number | null
          motorista?: string | null
          placa?: string | null
          posto?: string | null
          preco_unitario?: number | null
          produto?: string | null
          quantidade_total?: number | null
          valor_venda?: number | null
        }
        Relationships: []
      }
      metricas_veiculo: {
        Row: {
          atualizado_em: string
          custo_por_km: number | null
          desvio_consumo: boolean
          km_por_litro: number | null
          modelo: string | null
          num_abastecimentos: number
          placa: string
          primeiro_abastecimento: string | null
          responsavel_local: string | null
          total_km_rodado: number
          total_litros: number
          total_valor: number
          ultimo_abastecimento: string | null
        }
        Insert: {
          atualizado_em?: string
          custo_por_km?: number | null
          desvio_consumo?: boolean
          km_por_litro?: number | null
          modelo?: string | null
          num_abastecimentos?: number
          placa: string
          primeiro_abastecimento?: string | null
          responsavel_local?: string | null
          total_km_rodado?: number
          total_litros?: number
          total_valor?: number
          ultimo_abastecimento?: string | null
        }
        Update: {
          atualizado_em?: string
          custo_por_km?: number | null
          desvio_consumo?: boolean
          km_por_litro?: number | null
          modelo?: string | null
          num_abastecimentos?: number
          placa?: string
          primeiro_abastecimento?: string | null
          responsavel_local?: string | null
          total_km_rodado?: number
          total_litros?: number
          total_valor?: number
          ultimo_abastecimento?: string | null
        }
        Relationships: []
      }
      rastreador_bruto: {
        Row: {
          area_rota: string | null
          created_at: string
          data_inicial_timestamp: string | null
          id: string
          modelo_extraido: string | null
          placa_extraida: string | null
          unidade_rastreada: string
        }
        Insert: {
          area_rota?: string | null
          created_at?: string
          data_inicial_timestamp?: string | null
          id?: string
          modelo_extraido?: string | null
          placa_extraida?: string | null
          unidade_rastreada: string
        }
        Update: {
          area_rota?: string | null
          created_at?: string
          data_inicial_timestamp?: string | null
          id?: string
          modelo_extraido?: string | null
          placa_extraida?: string | null
          unidade_rastreada?: string
        }
        Relationships: []
      }
      rastreamento: {
        Row: {
          created_at: string
          data_hora: string
          id: string
          ignicao: boolean | null
          latitude: number | null
          longitude: number | null
          placa: string
          velocidade: number | null
        }
        Insert: {
          created_at?: string
          data_hora: string
          id?: string
          ignicao?: boolean | null
          latitude?: number | null
          longitude?: number | null
          placa: string
          velocidade?: number | null
        }
        Update: {
          created_at?: string
          data_hora?: string
          id?: string
          ignicao?: boolean | null
          latitude?: number | null
          longitude?: number | null
          placa?: string
          velocidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rastreamento_placa_fkey"
            columns: ["placa"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["placa"]
          },
        ]
      }
      relacao_frota: {
        Row: {
          created_at: string
          id: string
          modelo: string | null
          placa: string
          responsavel_local: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          modelo?: string | null
          placa: string
          responsavel_local?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          modelo?: string | null
          placa?: string
          responsavel_local?: string | null
        }
        Relationships: []
      }
      status_dados_veiculo: {
        Row: {
          atualizado_em: string
          completude: string
          num_consumo: number
          num_rastreador: number
          placa: string
          tem_consumo: boolean
          tem_frota: boolean
          tem_rastreador: boolean
        }
        Insert: {
          atualizado_em?: string
          completude?: string
          num_consumo?: number
          num_rastreador?: number
          placa: string
          tem_consumo?: boolean
          tem_frota?: boolean
          tem_rastreador?: boolean
        }
        Update: {
          atualizado_em?: string
          completude?: string
          num_consumo?: number
          num_rastreador?: number
          placa?: string
          tem_consumo?: boolean
          tem_frota?: boolean
          tem_rastreador?: boolean
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          capacidade_tanque: number
          contrato: string | null
          created_at: string
          id: string
          modelo: string
          placa: string
        }
        Insert: {
          capacidade_tanque?: number
          contrato?: string | null
          created_at?: string
          id?: string
          modelo: string
          placa: string
        }
        Update: {
          capacidade_tanque?: number
          contrato?: string | null
          created_at?: string
          id?: string
          modelo?: string
          placa?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      extract_plate_from_text: { Args: { input: string }; Returns: string }
      normalize_plate: { Args: { input: string }; Returns: string }
      refresh_all_metrics: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
