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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          analyst: string | null
          client: string | null
          created_at: string
          description: string
          id: string
        }
        Insert: {
          action: string
          analyst?: string | null
          client?: string | null
          created_at?: string
          description: string
          id?: string
        }
        Update: {
          action?: string
          analyst?: string | null
          client?: string | null
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      analysts: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          active_strategy_id: string | null
          audience_pains: string | null
          avatar_url: string | null
          banned_topics: string | null
          brand_values: string | null
          competitors: string[] | null
          content_pillars: string | null
          created_at: string
          cta_preferences: string | null
          current_social_presence: string | null
          differentials: string | null
          hashtags_base: string | null
          id: string
          instagram_handle: string | null
          main_offer: string | null
          name: string
          niche: string | null
          objective: string | null
          posting_frequency: string | null
          products_services: string | null
          social_networks: string[] | null
          success_references: string | null
          target_audience: string | null
          tone_of_voice: string | null
        }
        Insert: {
          active_strategy_id?: string | null
          audience_pains?: string | null
          avatar_url?: string | null
          banned_topics?: string | null
          brand_values?: string | null
          competitors?: string[] | null
          content_pillars?: string | null
          created_at?: string
          cta_preferences?: string | null
          current_social_presence?: string | null
          differentials?: string | null
          hashtags_base?: string | null
          id?: string
          instagram_handle?: string | null
          main_offer?: string | null
          name: string
          niche?: string | null
          objective?: string | null
          posting_frequency?: string | null
          products_services?: string | null
          social_networks?: string[] | null
          success_references?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
        }
        Update: {
          active_strategy_id?: string | null
          audience_pains?: string | null
          avatar_url?: string | null
          banned_topics?: string | null
          brand_values?: string | null
          competitors?: string[] | null
          content_pillars?: string | null
          created_at?: string
          cta_preferences?: string | null
          current_social_presence?: string | null
          differentials?: string | null
          hashtags_base?: string | null
          id?: string
          instagram_handle?: string | null
          main_offer?: string | null
          name?: string
          niche?: string | null
          objective?: string | null
          posting_frequency?: string | null
          products_services?: string | null
          social_networks?: string[] | null
          success_references?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_active_strategy_id_fkey"
            columns: ["active_strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      copies: {
        Row: {
          campaign_type: string | null
          client_id: string | null
          created_at: string
          format: string | null
          framework: string
          generated_copy: string | null
          id: string
          produto: string | null
          publico_alvo: string | null
          sections: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_type?: string | null
          client_id?: string | null
          created_at?: string
          format?: string | null
          framework: string
          generated_copy?: string | null
          id?: string
          produto?: string | null
          publico_alvo?: string | null
          sections?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_type?: string | null
          client_id?: string | null
          created_at?: string
          format?: string | null
          framework?: string
          generated_copy?: string | null
          id?: string
          produto?: string | null
          publico_alvo?: string | null
          sections?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          analyst: string | null
          client: string | null
          created_at: string
          date: string | null
          format: string | null
          funnel_stage: string | null
          hashtags: string[] | null
          headline: string | null
          id: string
          legend: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analyst?: string | null
          client?: string | null
          created_at?: string
          date?: string | null
          format?: string | null
          funnel_stage?: string | null
          hashtags?: string[] | null
          headline?: string | null
          id?: string
          legend?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analyst?: string | null
          client?: string | null
          created_at?: string
          date?: string | null
          format?: string | null
          funnel_stage?: string | null
          hashtags?: string[] | null
          headline?: string | null
          id?: string
          legend?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instagram_accounts: {
        Row: {
          access_token: string
          auto_publish: boolean
          client_id: string
          connected_by: string | null
          created_at: string
          id: string
          ig_business_id: string
          ig_username: string | null
          page_id: string
          page_name: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          auto_publish?: boolean
          client_id: string
          connected_by?: string | null
          created_at?: string
          id?: string
          ig_business_id: string
          ig_username?: string | null
          page_id: string
          page_name?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          auto_publish?: boolean
          client_id?: string
          connected_by?: string | null
          created_at?: string
          id?: string
          ig_business_id?: string
          ig_username?: string | null
          page_id?: string
          page_name?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_accounts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_publish_log: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string | null
          id: string
          ig_media_id: string | null
          post_id: string | null
          status: string
          triggered_by: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ig_media_id?: string | null
          post_id?: string | null
          status: string
          triggered_by?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ig_media_id?: string | null
          post_id?: string | null
          status?: string
          triggered_by?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          analyst: string
          art_url: string | null
          art_urls: string[] | null
          auto_publish_instagram: boolean
          channels: string[] | null
          client: string
          created_at: string
          date: string
          format: string
          funnel_stage: string
          hashtags: string[]
          headline: string
          id: string
          instagram_status: string | null
          legend: string | null
          reference: string | null
          scheduled_time: string
          title: string
          updated_at: string
        }
        Insert: {
          analyst: string
          art_url?: string | null
          art_urls?: string[] | null
          auto_publish_instagram?: boolean
          channels?: string[] | null
          client: string
          created_at?: string
          date: string
          format: string
          funnel_stage: string
          hashtags?: string[]
          headline: string
          id?: string
          instagram_status?: string | null
          legend?: string | null
          reference?: string | null
          scheduled_time?: string
          title: string
          updated_at?: string
        }
        Update: {
          analyst?: string
          art_url?: string | null
          art_urls?: string[] | null
          auto_publish_instagram?: boolean
          channels?: string[] | null
          client?: string
          created_at?: string
          date?: string
          format?: string
          funnel_stage?: string
          hashtags?: string[]
          headline?: string
          id?: string
          instagram_status?: string | null
          legend?: string | null
          reference?: string | null
          scheduled_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reverse_engineered_copies: {
        Row: {
          analise: Json
          client_id: string | null
          contexto_extra: string | null
          created_at: string
          hooks_alternativos: Json | null
          id: string
          source: string
          source_url: string | null
          title: string | null
          transcript: string
          updated_at: string
          user_id: string
          variacao: Json
        }
        Insert: {
          analise?: Json
          client_id?: string | null
          contexto_extra?: string | null
          created_at?: string
          hooks_alternativos?: Json | null
          id?: string
          source?: string
          source_url?: string | null
          title?: string | null
          transcript: string
          updated_at?: string
          user_id: string
          variacao?: Json
        }
        Update: {
          analise?: Json
          client_id?: string | null
          contexto_extra?: string | null
          created_at?: string
          hooks_alternativos?: Json | null
          id?: string
          source?: string
          source_url?: string | null
          title?: string | null
          transcript?: string
          updated_at?: string
          user_id?: string
          variacao?: Json
        }
        Relationships: [
          {
            foreignKeyName: "reverse_engineered_copies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    },
  },
} as const
