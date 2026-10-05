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
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          at: string
          changes: Json
          entity_key: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          at?: string
          changes?: Json
          entity_key: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          at?: string
          changes?: Json
          entity_key?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          entity_key: string
          entity_type: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          entity_key: string
          entity_type: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          entity_key?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      balance_collections: {
        Row: {
          amount: number
          collected_by: string
          note: string | null
          order_id: string
          recorded_at: string
          recorded_by: string
          remitted: boolean
        }
        Insert: {
          amount: number
          collected_by?: string
          note?: string | null
          order_id: string
          recorded_at?: string
          recorded_by: string
          remitted?: boolean
        }
        Update: {
          amount?: number
          collected_by?: string
          note?: string | null
          order_id?: string
          recorded_at?: string
          recorded_by?: string
          remitted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "balance_collections_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_availability: {
        Row: {
          available: boolean
          kind: string
          note: string | null
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          available?: boolean
          kind: string
          note?: string | null
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          available?: boolean
          kind?: string
          note?: string | null
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
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
      crm_enqueue_errors: {
        Row: {
          at: string
          error_code: string | null
          id: string
          source_id: string | null
          source_table: string | null
        }
        Insert: {
          at?: string
          error_code?: string | null
          id?: string
          source_id?: string | null
          source_table?: string | null
        }
        Update: {
          at?: string
          error_code?: string | null
          id?: string
          source_id?: string | null
          source_table?: string | null
        }
        Relationships: []
      }
      crm_mappings: {
        Row: {
          entity_type: string
          source_id: string
          source_table: string
          synced_at: string
          zoho_account_id: string | null
          zoho_id: string
        }
        Insert: {
          entity_type: string
          source_id: string
          source_table: string
          synced_at?: string
          zoho_account_id?: string | null
          zoho_id: string
        }
        Update: {
          entity_type?: string
          source_id?: string
          source_table?: string
          synced_at?: string
          zoho_account_id?: string | null
          zoho_id?: string
        }
        Relationships: []
      }
      crm_outbox: {
        Row: {
          attempts: number
          claimed_version: number | null
          created_at: string
          entity_type: string
          id: string
          last_error: string | null
          last_error_code: string | null
          lease_expires_at: string | null
          lease_owner: string | null
          next_attempt_at: string
          processed_version: number
          source_id: string
          source_table: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          attempts?: number
          claimed_version?: number | null
          created_at?: string
          entity_type: string
          id?: string
          last_error?: string | null
          last_error_code?: string | null
          lease_expires_at?: string | null
          lease_owner?: string | null
          next_attempt_at?: string
          processed_version?: number
          source_id: string
          source_table: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          attempts?: number
          claimed_version?: number | null
          created_at?: string
          entity_type?: string
          id?: string
          last_error?: string | null
          last_error_code?: string | null
          lease_expires_at?: string | null
          lease_owner?: string | null
          next_attempt_at?: string
          processed_version?: number
          source_id?: string
          source_table?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      crm_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      crm_sync_attempts: {
        Row: {
          at: string
          error_code: string | null
          http_status: number | null
          id: string
          ok: boolean
          outbox_id: string | null
          summary: string | null
        }
        Insert: {
          at?: string
          error_code?: string | null
          http_status?: number | null
          id?: string
          ok: boolean
          outbox_id?: string | null
          summary?: string | null
        }
        Update: {
          at?: string
          error_code?: string | null
          http_status?: number | null
          id?: string
          ok?: boolean
          outbox_id?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_sync_attempts_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "crm_outbox"
            referencedColumns: ["id"]
          },
        ]
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
      message_meta: {
        Row: {
          assigned_to: string | null
          classification: string
          classified_by: string
          is_read: boolean
          message_id: string
          quote_stage: string
          related_order_id: string | null
          related_user_id: string | null
          stage_changed_at: string | null
          updated_at: string
          version: number
        }
        Insert: {
          assigned_to?: string | null
          classification?: string
          classified_by?: string
          is_read?: boolean
          message_id: string
          quote_stage?: string
          related_order_id?: string | null
          related_user_id?: string | null
          stage_changed_at?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          assigned_to?: string | null
          classification?: string
          classified_by?: string
          is_read?: boolean
          message_id?: string
          quote_stage?: string
          related_order_id?: string | null
          related_user_id?: string | null
          stage_changed_at?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_meta_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "contact_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_meta_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      order_ops: {
        Row: {
          assigned_to: string | null
          cost_mad: number | null
          delivery_notes: string | null
          internal_notes: string | null
          ops_stage: string
          order_id: string
          production_notes: string | null
          supplier: string | null
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          assigned_to?: string | null
          cost_mad?: number | null
          delivery_notes?: string | null
          internal_notes?: string | null
          ops_stage?: string
          order_id: string
          production_notes?: string | null
          supplier?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          assigned_to?: string | null
          cost_mad?: number | null
          delivery_notes?: string | null
          internal_notes?: string | null
          ops_stage?: string
          order_id?: string
          production_notes?: string | null
          supplier?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_ops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
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
      team_members: {
        Row: {
          active: boolean
          display_name: string | null
          email: string
          granted_at: string
          granted_by: string | null
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          display_name?: string | null
          email: string
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          display_name?: string | null
          email?: string
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
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
      admin_action_queue: { Args: never; Returns: Json }
      admin_add_note: {
        Args: { _actor: string; _body: string; _key: string; _type: string }
        Returns: string
      }
      admin_customers: {
        Args: { _limit: number; _offset: number; _q: string }
        Returns: {
          collected: number
          company: string
          customer_key: string
          email: string
          last_activity: string
          messages: number
          name: string
          order_value: number
          orders: number
          outstanding: number
          phone: string
          quotes: number
          total_count: number
          user_id: string
        }[]
      }
      admin_grant_member: {
        Args: { _actor: string; _email: string; _name: string; _role: string }
        Returns: string
      }
      admin_messages_page: {
        Args: {
          _assignee: string
          _classification: string
          _limit: number
          _offset: number
          _q: string
          _quotes: boolean
          _stage: string
          _unread: boolean
        }
        Returns: {
          message_id: string
          total_count: number
        }[]
      }
      admin_order_money: {
        Args: never
        Returns: {
          collected: number
          confirmed: boolean
          courier_held: number
          created_at: string
          order_id: string
          order_value: number
          outstanding: number
        }[]
      }
      admin_orders_page: {
        Args: {
          _assignee: string
          _from: string
          _limit: number
          _offset: number
          _payment: string
          _q: string
          _stage: string
          _status: string
          _to: string
        }
        Returns: {
          order_id: string
          total_count: number
        }[]
      }
      admin_quote_stage_counts: { Args: never; Returns: Json }
      admin_record_balance: {
        Args: {
          _actor: string
          _note: string
          _order: string
          _remitted: boolean
        }
        Returns: number
      }
      admin_report: { Args: { _from: string; _to: string }; Returns: Json }
      admin_revoke_member: {
        Args: { _actor: string; _role: string; _target: string }
        Returns: undefined
      }
      admin_set_availability: {
        Args: {
          _actor: string
          _available: boolean
          _kind: string
          _note: string
          _slug: string
        }
        Returns: undefined
      }
      admin_staff_directory: {
        Args: never
        Returns: {
          active: boolean
          display_name: string
          email: string
          granted_at: string
          revoked_at: string
          role: string
          user_id: string
        }[]
      }
      admin_update_message: {
        Args: { _actor: string; _expected: number; _f: Json; _msg: string }
        Returns: number
      }
      admin_update_order_ops: {
        Args: { _actor: string; _expected: number; _f: Json; _order: string }
        Returns: number
      }
      catalog_unavailable: { Args: { _items: Json }; Returns: string[] }
      crm_claim: {
        Args: { _lease_seconds?: number; _limit?: number; _owner: string }
        Returns: {
          attempts: number
          claimed_version: number | null
          created_at: string
          entity_type: string
          id: string
          last_error: string | null
          last_error_code: string | null
          lease_expires_at: string | null
          lease_owner: string | null
          next_attempt_at: string
          processed_version: number
          source_id: string
          source_table: string
          status: string
          updated_at: string
          version: number
        }[]
        SetofOptions: {
          from: "*"
          to: "crm_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      crm_complete: {
        Args: {
          _account_id?: string
          _error?: string
          _error_code?: string
          _http?: number
          _id: string
          _ok: boolean
          _owner: string
          _retry_after_seconds?: number
          _terminal?: string
          _zoho_id?: string
        }
        Returns: string
      }
      crm_enqueue: {
        Args: { _entity: string; _id: string; _table: string }
        Returns: undefined
      }
      crm_reconcile: { Args: never; Returns: number }
      crm_retry: { Args: { _id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_staff_role: { Args: never; Returns: string }
      staff_role_of: { Args: { _uid: string }; Returns: string }
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
