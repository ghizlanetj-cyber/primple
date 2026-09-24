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
      contact_messages: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          topic: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          topic?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          topic?: string | null
        }
        Relationships: []
      }
      design_conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      design_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "design_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_files: {
        Row: {
          bucket: string
          created_at: string
          file_name: string
          guest_token: string | null
          id: string
          mime_type: string | null
          order_id: string | null
          order_reference: string | null
          path: string
          size_bytes: number
          status: string
          user_id: string | null
        }
        Insert: {
          bucket?: string
          created_at?: string
          file_name: string
          guest_token?: string | null
          id?: string
          mime_type?: string | null
          order_id?: string | null
          order_reference?: string | null
          path: string
          size_bytes?: number
          status?: string
          user_id?: string | null
        }
        Update: {
          bucket?: string
          created_at?: string
          file_name?: string
          guest_token?: string | null
          id?: string
          mime_type?: string | null
          order_id?: string | null
          order_reference?: string | null
          path?: string
          size_bytes?: number
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          balance_amount: number
          city: string | null
          claim_token: string | null
          claimed_at: string | null
          company: string | null
          contact_name: string | null
          created_at: string
          delivery: number
          deposit_amount: number
          deposit_paid: boolean
          email: string | null
          expected_at: string | null
          guest_email: string | null
          id: string
          items: Json
          paid_at: string | null
          payment_method: string
          payment_status: string
          phone: string | null
          postcode: string | null
          printer: string | null
          reference: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          youcanpay_token_id: string | null
          youcanpay_transaction_id: string | null
        }
        Insert: {
          address?: string | null
          balance_amount?: number
          city?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          company?: string | null
          contact_name?: string | null
          created_at?: string
          delivery?: number
          deposit_amount?: number
          deposit_paid?: boolean
          email?: string | null
          expected_at?: string | null
          guest_email?: string | null
          id?: string
          items?: Json
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          phone?: string | null
          postcode?: string | null
          printer?: string | null
          reference: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          youcanpay_token_id?: string | null
          youcanpay_transaction_id?: string | null
        }
        Update: {
          address?: string | null
          balance_amount?: number
          city?: string | null
          claim_token?: string | null
          claimed_at?: string | null
          company?: string | null
          contact_name?: string | null
          created_at?: string
          delivery?: number
          deposit_amount?: number
          deposit_paid?: boolean
          email?: string | null
          expected_at?: string | null
          guest_email?: string | null
          id?: string
          items?: Json
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          phone?: string | null
          postcode?: string | null
          printer?: string | null
          reference?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          youcanpay_token_id?: string | null
          youcanpay_transaction_id?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          detail: string | null
          environment: string
          event: string
          http_status: number | null
          id: string
          ok: boolean
          order_kind: string
          reference: string | null
          youcanpay_token_id: string | null
          youcanpay_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          environment: string
          event: string
          http_status?: number | null
          id?: string
          ok?: boolean
          order_kind?: string
          reference?: string | null
          youcanpay_token_id?: string | null
          youcanpay_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          environment?: string
          event?: string
          http_status?: number | null
          id?: string
          ok?: boolean
          order_kind?: string
          reference?: string | null
          youcanpay_token_id?: string | null
          youcanpay_transaction_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          customer_address: string | null
          customer_city: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          items: Json
          paid_at: string | null
          reference: string
          status: string
          user_id: string | null
          youcanpay_token_id: string | null
          youcanpay_transaction_id: string | null
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          paid_at?: string | null
          reference: string
          status?: string
          user_id?: string | null
          youcanpay_token_id?: string | null
          youcanpay_transaction_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_address?: string | null
          customer_city?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          paid_at?: string | null
          reference?: string
          status?: string
          user_id?: string | null
          youcanpay_token_id?: string | null
          youcanpay_transaction_id?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
