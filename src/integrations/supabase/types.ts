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
      analytics_data: {
        Row: {
          avg_session_duration: number | null
          bounce_rate: number | null
          created_at: string
          date: string
          id: string
          pageviews: number
          sessions: number
          source: string | null
        }
        Insert: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string
          date: string
          id?: string
          pageviews?: number
          sessions?: number
          source?: string | null
        }
        Update: {
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string
          date?: string
          id?: string
          pageviews?: number
          sessions?: number
          source?: string | null
        }
        Relationships: []
      }
      clean_data: {
        Row: {
          category: string | null
          created_at: string
          id: string
          month: string
          quantity_returned: number | null
          quantity_sold: number | null
          revenue: number | null
          shop_id: string
          shop_name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          month: string
          quantity_returned?: number | null
          quantity_sold?: number | null
          revenue?: number | null
          shop_id: string
          shop_name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          month?: string
          quantity_returned?: number | null
          quantity_sold?: number | null
          revenue?: number | null
          shop_id?: string
          shop_name?: string | null
        }
        Relationships: []
      }
      distribution_events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          event_name: string
          event_type: string
          id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          event_name: string
          event_type?: string
          id?: string
          start_date: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          event_name?: string
          event_type?: string
          id?: string
          start_date?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          row_count: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          row_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          row_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      forecast_data: {
        Row: {
          actual: number | null
          created_at: string
          forecast: number | null
          generated_by: string | null
          growth_rate: number | null
          id: string
          lower_bound: number | null
          month: string
          scenario: string
          upper_bound: number | null
        }
        Insert: {
          actual?: number | null
          created_at?: string
          forecast?: number | null
          generated_by?: string | null
          growth_rate?: number | null
          id?: string
          lower_bound?: number | null
          month: string
          scenario?: string
          upper_bound?: number | null
        }
        Update: {
          actual?: number | null
          created_at?: string
          forecast?: number | null
          generated_by?: string | null
          growth_rate?: number | null
          id?: string
          lower_bound?: number | null
          month?: string
          scenario?: string
          upper_bound?: number | null
        }
        Relationships: []
      }
      insights: {
        Row: {
          category: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          metric: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          metric?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          metric?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      model_metrics: {
        Row: {
          created_at: string
          evaluated_at: string
          id: string
          metric_name: string
          metric_value: number
          model_version: string | null
        }
        Insert: {
          created_at?: string
          evaluated_at?: string
          id?: string
          metric_name: string
          metric_value?: number
          model_version?: string | null
        }
        Update: {
          created_at?: string
          evaluated_at?: string
          id?: string
          metric_name?: string
          metric_value?: number
          model_version?: string | null
        }
        Relationships: []
      }
      monthly_summary: {
        Row: {
          created_at: string
          forecast_revenue: number | null
          id: string
          month: string
          return_rate_pct: number | null
          revenue: number | null
          sell_through_pct: number | null
          total_returns: number
          total_sales: number
        }
        Insert: {
          created_at?: string
          forecast_revenue?: number | null
          id?: string
          month: string
          return_rate_pct?: number | null
          revenue?: number | null
          sell_through_pct?: number | null
          total_returns?: number
          total_sales?: number
        }
        Update: {
          created_at?: string
          forecast_revenue?: number | null
          id?: string
          month?: string
          return_rate_pct?: number | null
          revenue?: number | null
          sell_through_pct?: number | null
          total_returns?: number
          total_sales?: number
        }
        Relationships: []
      }
      parsed_data: {
        Row: {
          created_at: string
          data: Json
          file_upload_id: string
          id: string
          row_index: number
        }
        Insert: {
          created_at?: string
          data: Json
          file_upload_id: string
          id?: string
          row_index: number
        }
        Update: {
          created_at?: string
          data?: Json
          file_upload_id?: string
          id?: string
          row_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "parsed_data_file_upload_id_fkey"
            columns: ["file_upload_id"]
            isOneToOne: false
            referencedRelation: "file_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          actual_returns: number | null
          actual_sales: number | null
          created_at: string
          id: string
          month: string
          predicted_returns: number | null
          predicted_sales: number
          shop_id: string
          shop_name: string | null
        }
        Insert: {
          actual_returns?: number | null
          actual_sales?: number | null
          created_at?: string
          id?: string
          month: string
          predicted_returns?: number | null
          predicted_sales?: number
          shop_id: string
          shop_name?: string | null
        }
        Update: {
          actual_returns?: number | null
          actual_sales?: number | null
          created_at?: string
          id?: string
          month?: string
          predicted_returns?: number | null
          predicted_sales?: number
          shop_id?: string
          shop_name?: string | null
        }
        Relationships: []
      }
      traffic_sources: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          percentage: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          name: string
          percentage?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          percentage?: number
        }
        Relationships: []
      }
      trend_analysis: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          insight: string | null
          location: string | null
          metric_name: string
          metric_value: number
          period: string | null
          trend_direction: string | null
        }
        Insert: {
          analysis_type?: string
          created_at?: string
          id?: string
          insight?: string | null
          location?: string | null
          metric_name: string
          metric_value?: number
          period?: string | null
          trend_direction?: string | null
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          insight?: string | null
          location?: string | null
          metric_name?: string
          metric_value?: number
          period?: string | null
          trend_direction?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
