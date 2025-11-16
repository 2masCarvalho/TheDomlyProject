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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerta: {
        Row: {
          created_at: string
          data_alerta: string
          estado: Database["public"]["Enums"]["estado_alerta"]
          id_alerta: string
          id_ativo: string
          mensagem: string | null
          tipo_alerta: Database["public"]["Enums"]["tipo_alerta"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_alerta?: string
          estado?: Database["public"]["Enums"]["estado_alerta"]
          id_alerta?: string
          id_ativo: string
          mensagem?: string | null
          tipo_alerta: Database["public"]["Enums"]["tipo_alerta"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_alerta?: string
          estado?: Database["public"]["Enums"]["estado_alerta"]
          id_alerta?: string
          id_ativo?: string
          mensagem?: string | null
          tipo_alerta?: Database["public"]["Enums"]["tipo_alerta"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerta_id_ativo_fkey"
            columns: ["id_ativo"]
            isOneToOne: false
            referencedRelation: "ativo"
            referencedColumns: ["id_ativo"]
          },
        ]
      }
      ativo: {
        Row: {
          categoria: string
          created_at: string
          data_criacao: string
          data_instalacao: string | null
          id_ativo: string
          id_condominio: string
          marca: string | null
          modelo: string | null
          nome: string
          num_serie: string | null
          updated_at: string
        }
        Insert: {
          categoria: string
          created_at?: string
          data_criacao?: string
          data_instalacao?: string | null
          id_ativo?: string
          id_condominio: string
          marca?: string | null
          modelo?: string | null
          nome: string
          num_serie?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          data_criacao?: string
          data_instalacao?: string | null
          id_ativo?: string
          id_condominio?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          num_serie?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ativo_id_condominio_fkey"
            columns: ["id_condominio"]
            isOneToOne: false
            referencedRelation: "condominio"
            referencedColumns: ["id_condominio"]
          },
        ]
      }
      condominio: {
        Row: {
          cidade: string
          codigo_postal: string
          created_at: string
          data_criacao: string
          id_condominio: string
          id_user: string
          morada: string
          nif: number
          nome: string
          updated_at: string
        }
        Insert: {
          cidade: string
          codigo_postal: string
          created_at?: string
          data_criacao?: string
          id_condominio?: string
          id_user: string
          morada: string
          nif: number
          nome: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          codigo_postal?: string
          created_at?: string
          data_criacao?: string
          id_condominio?: string
          id_user?: string
          morada?: string
          nif?: number
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "condominio_id_user_fkey"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documento: {
        Row: {
          created_at: string
          data_emissao: string | null
          data_upload: string
          id_ativo: string | null
          id_condominio: string | null
          id_documento: string
          nome: string
          tipo_documento: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          data_emissao?: string | null
          data_upload?: string
          id_ativo?: string | null
          id_condominio?: string | null
          id_documento?: string
          nome: string
          tipo_documento: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          data_emissao?: string | null
          data_upload?: string
          id_ativo?: string | null
          id_condominio?: string | null
          id_documento?: string
          nome?: string
          tipo_documento?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_id_ativo_fkey"
            columns: ["id_ativo"]
            isOneToOne: false
            referencedRelation: "ativo"
            referencedColumns: ["id_ativo"]
          },
          {
            foreignKeyName: "documento_id_condominio_fkey"
            columns: ["id_condominio"]
            isOneToOne: false
            referencedRelation: "condominio"
            referencedColumns: ["id_condominio"]
          },
        ]
      }
      empresa: {
        Row: {
          area: Database["public"]["Enums"]["area_empresa"]
          contacto: string
          created_at: string
          email: string | null
          id_empresa: string
          morada: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          area: Database["public"]["Enums"]["area_empresa"]
          contacto: string
          created_at?: string
          email?: string | null
          id_empresa?: string
          morada?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          area?: Database["public"]["Enums"]["area_empresa"]
          contacto?: string
          created_at?: string
          email?: string | null
          id_empresa?: string
          morada?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      manutencao: {
        Row: {
          created_at: string
          custo: number | null
          data_agendada: string
          data_conclusao: string | null
          descricao: string
          estado: Database["public"]["Enums"]["estado_manutencao"]
          id_ativo: string
          id_empresa: string
          id_manutencao: string
          proxima_manutencao_prevista: string | null
          tipo_manutencao: Database["public"]["Enums"]["tipo_manutencao"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo?: number | null
          data_agendada: string
          data_conclusao?: string | null
          descricao: string
          estado?: Database["public"]["Enums"]["estado_manutencao"]
          id_ativo: string
          id_empresa: string
          id_manutencao?: string
          proxima_manutencao_prevista?: string | null
          tipo_manutencao: Database["public"]["Enums"]["tipo_manutencao"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo?: number | null
          data_agendada?: string
          data_conclusao?: string | null
          descricao?: string
          estado?: Database["public"]["Enums"]["estado_manutencao"]
          id_ativo?: string
          id_empresa?: string
          id_manutencao?: string
          proxima_manutencao_prevista?: string | null
          tipo_manutencao?: Database["public"]["Enums"]["tipo_manutencao"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencao_id_ativo_fkey"
            columns: ["id_ativo"]
            isOneToOne: false
            referencedRelation: "ativo"
            referencedColumns: ["id_ativo"]
          },
          {
            foreignKeyName: "manutencao_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id_empresa"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          empresa: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          empresa?: string | null
          id: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      area_empresa:
        | "Eletricidade"
        | "Canalizacao"
        | "AVAC"
        | "Elevadores"
        | "Seguranca"
        | "Limpeza"
        | "Jardinagem"
        | "Outra"
      estado_alerta: "Ativo" | "Resolvido" | "Ignorado"
      estado_manutencao: "Agendada" | "Concluída" | "Cancelada"
      tipo_alerta: "Manutencao" | "Garantia" | "Inspeção" | "Avaria" | "Outro"
      tipo_manutencao: "Preventiva" | "Corretiva" | "Inspeção"
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
    Enums: {
      app_role: ["admin", "user"],
      area_empresa: [
        "Eletricidade",
        "Canalizacao",
        "AVAC",
        "Elevadores",
        "Seguranca",
        "Limpeza",
        "Jardinagem",
        "Outra",
      ],
      estado_alerta: ["Ativo", "Resolvido", "Ignorado"],
      estado_manutencao: ["Agendada", "Concluída", "Cancelada"],
      tipo_alerta: ["Manutencao", "Garantia", "Inspeção", "Avaria", "Outro"],
      tipo_manutencao: ["Preventiva", "Corretiva", "Inspeção"],
    },
  },
} as const
