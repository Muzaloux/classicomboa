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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          edition_id: string
          entity_id: string
          id: number
          new_status: string | null
          old_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          edition_id: string
          entity_id: string
          id?: never
          new_status?: string | null
          old_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          edition_id?: string
          entity_id?: string
          id?: never
          new_status?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "event_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      edition_staff: {
        Row: {
          created_at: string
          edition_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edition_staff_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "event_editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edition_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_editions: {
        Row: {
          city: string
          country: string
          created_at: string
          edition_number: number
          event_date: string
          id: string
          name: string
          slug: string
          status: string
          ticket_capacity: number | null
          timezone: string
          venue: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          edition_number: number
          event_date: string
          id: string
          name: string
          slug: string
          status?: string
          ticket_capacity?: number | null
          timezone?: string
          venue: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          edition_number?: number
          event_date?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          ticket_capacity?: number | null
          timezone?: string
          venue?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          consent_at: string
          created_at: string
          edition_id: string
          email: string
          id: string
          kind: string
          message: string
          name: string
          organization: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          consent_at?: string
          created_at?: string
          edition_id: string
          email: string
          id?: string
          kind: string
          message: string
          name: string
          organization?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          consent_at?: string
          created_at?: string
          edition_id?: string
          email?: string
          id?: string
          kind?: string
          message?: string
          name?: string
          organization?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "event_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_id: string
          outcome: string
          payment_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          outcome: string
          payment_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          outcome?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_xaf: number
          confirmed_by: string | null
          contact: string | null
          created_at: string
          currency: string
          id: string
          order_id: string
          provider: string
          provider_reference: string
          receipt_reference: string | null
          settled_at: string | null
          status: string
        }
        Insert: {
          amount_xaf: number
          confirmed_by?: string | null
          contact?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          provider: string
          provider_reference: string
          receipt_reference?: string | null
          settled_at?: string | null
          status?: string
        }
        Update: {
          amount_xaf?: number
          confirmed_by?: string | null
          contact?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          provider?: string
          provider_reference?: string
          receipt_reference?: string | null
          settled_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_limits: {
        Row: {
          attempts: number
          bucket: string
          window_start: string
        }
        Insert: {
          attempts?: number
          bucket: string
          window_start: string
        }
        Update: {
          attempts?: number
          bucket?: string
          window_start?: string
        }
        Relationships: []
      }
      ticket_checkins: {
        Row: {
          edition_id: string
          gate: string
          id: string
          result: string
          scanned_at: string
          scanned_by: string
          ticket_id: string | null
        }
        Insert: {
          edition_id: string
          gate: string
          id?: string
          result: string
          scanned_at?: string
          scanned_by: string
          ticket_id?: string | null
        }
        Update: {
          edition_id?: string
          gate?: string
          id?: string
          result?: string
          scanned_at?: string
          scanned_by?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_checkins_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "event_editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_checkins_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_checkins_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_order_items: {
        Row: {
          id: string
          name: string
          order_id: string
          quantity: number
          ticket_type_id: string
          total_xaf: number | null
          unit_price_xaf: number
        }
        Insert: {
          id?: string
          name: string
          order_id: string
          quantity: number
          ticket_type_id: string
          total_xaf?: number | null
          unit_price_xaf: number
        }
        Update: {
          id?: string
          name?: string
          order_id?: string
          quantity?: number
          ticket_type_id?: string
          total_xaf?: number | null
          unit_price_xaf?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_order_items_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_orders: {
        Row: {
          access_hash: string
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string
          edition_id: string
          expires_at: string
          id: string
          is_test: boolean
          quantity: number
          reference: string
          request_id: string
          status: string
          ticket_type_id: string
          total_xaf: number
        }
        Insert: {
          access_hash: string
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          edition_id: string
          expires_at?: string
          id?: string
          is_test: boolean
          quantity: number
          reference?: string
          request_id: string
          status?: string
          ticket_type_id: string
          total_xaf: number
        }
        Update: {
          access_hash?: string
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          edition_id?: string
          expires_at?: string
          id?: string
          is_test?: boolean
          quantity?: number
          reference?: string
          request_id?: string
          status?: string
          ticket_type_id?: string
          total_xaf?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_orders_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "event_editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_orders_ticket_type_id_edition_id_fkey"
            columns: ["ticket_type_id", "edition_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id", "edition_id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          capacity: number
          created_at: string
          edition_id: string
          id: string
          is_test: boolean
          name: string
          price_xaf: number
          sale_end: string | null
          sale_start: string | null
          status: string
        }
        Insert: {
          capacity: number
          created_at?: string
          edition_id: string
          id?: string
          is_test?: boolean
          name: string
          price_xaf: number
          sale_end?: string | null
          sale_start?: string | null
          status?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          edition_id?: string
          id?: string
          is_test?: boolean
          name?: string
          price_xaf?: number
          sale_end?: string | null
          sale_start?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "event_editions"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          checked_in_at: string | null
          edition_id: string
          holder_name: string
          id: string
          is_test: boolean
          issued_at: string
          order_id: string
          qr_token: string
          status: string
          ticket_code: string
          ticket_type_id: string
          unit_number: number
        }
        Insert: {
          checked_in_at?: string | null
          edition_id: string
          holder_name: string
          id?: string
          is_test: boolean
          issued_at?: string
          order_id: string
          qr_token?: string
          status?: string
          ticket_code?: string
          ticket_type_id: string
          unit_number: number
        }
        Update: {
          checked_in_at?: string | null
          edition_id?: string
          holder_name?: string
          id?: string
          is_test?: boolean
          issued_at?: string
          order_id?: string
          qr_token?: string
          status?: string
          ticket_code?: string
          ticket_type_id?: string
          unit_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_edition_id_fkey"
            columns: ["order_id", "edition_id"]
            isOneToOne: false
            referencedRelation: "ticket_orders"
            referencedColumns: ["id", "edition_id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_edition_id_fkey"
            columns: ["ticket_type_id", "edition_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id", "edition_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          city: string
          created_at: string
          display_name: string
          id: string
          phone: string | null
          preferred_locale: string
          status: string
          updated_at: string
        }
        Insert: {
          city?: string
          created_at?: string
          display_name?: string
          id: string
          phone?: string | null
          preferred_locale?: string
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          display_name?: string
          id?: string
          phone?: string | null
          preferred_locale?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_inquiries: {
        Args: { target_edition: string }
        Returns: boolean
      }
      check_in_ticket: {
        Args: {
          p_edition: string
          p_gate: string
          p_input: string
          p_test: boolean
        }
        Returns: Json
      }
      configure_ticket_type: {
        Args: {
          p_capacity: number
          p_edition: string
          p_id: string
          p_name: string
          p_price: number
          p_status: string
        }
        Returns: undefined
      }
      confirm_manual_payment: {
        Args: {
          p_amount: number
          p_edition: string
          p_receipt: string
          p_reference: string
        }
        Returns: string
      }
      has_edition_role: {
        Args: { p_edition: string; p_roles: string[] }
        Returns: boolean
      }
      reserve_manual_ticket_order: {
        Args: {
          p_access_hash: string
          p_contact: string
          p_edition: string
          p_email: string
          p_name: string
          p_phone: string
          p_quantity: number
          p_request: string
          p_type: string
        }
        Returns: string
      }
      reserve_ticket_order: {
        Args: {
          p_access_hash: string
          p_email: string
          p_name: string
          p_phone: string
          p_quantity: number
          p_request: string
          p_test: boolean
          p_type: string
        }
        Returns: string
      }
      set_inquiry_status: {
        Args: { p_edition: string; p_id: string; p_status: string }
        Returns: undefined
      }
      settle_test_payment: {
        Args: {
          p_amount: number
          p_currency: string
          p_event: string
          p_outcome: string
          p_reference: string
        }
        Returns: string
      }
      submit_inquiry: {
        Args: {
          p_edition: string
          p_email: string
          p_kind: string
          p_message: string
          p_name: string
          p_organization: string
          p_phone: string
        }
        Returns: string
      }
      ticket_catalog: {
        Args: { p_edition: string; p_test: boolean }
        Returns: {
          available: number
          id: string
          is_test: boolean
          name: string
          price_xaf: number
        }[]
      }
      void_ticket: {
        Args: { p_code: string; p_edition: string }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
