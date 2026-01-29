export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          avatar_url: string | null
          tier: 'free' | 'pro' | 'business'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          avatar_url?: string | null
          tier?: 'free' | 'pro' | 'business'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          avatar_url?: string | null
          tier?: 'free' | 'pro' | 'business'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          default_currency: string
          default_hourly_rate: number | null
          week_starts_on: number
          time_format: '12h' | '24h'
          date_format: string
          invoice_prefix: string
          invoice_notes: string | null
          invoice_terms: string | null
          max_timer_hours: number | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          default_currency?: string
          default_hourly_rate?: number | null
          week_starts_on?: number
          time_format?: '12h' | '24h'
          date_format?: string
          invoice_prefix?: string
          invoice_notes?: string | null
          invoice_terms?: string | null
          max_timer_hours?: number | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          default_currency?: string
          default_hourly_rate?: number | null
          week_starts_on?: number
          time_format?: '12h' | '24h'
          date_format?: string
          invoice_prefix?: string
          invoice_notes?: string | null
          invoice_terms?: string | null
          max_timer_hours?: number | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          contact_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          currency: string
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          currency?: string
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          currency?: string
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          name: string
          color: string
          hourly_rate: number | null
          is_billable: boolean
          is_default: boolean
          is_archived: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          name: string
          color?: string
          hourly_rate?: number | null
          is_billable?: boolean
          is_default?: boolean
          is_archived?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          name?: string
          color?: string
          hourly_rate?: number | null
          is_billable?: boolean
          is_default?: boolean
          is_archived?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          description: string | null
          start_time: string
          end_time: string | null
          duration_seconds: number
          is_billable: boolean
          hourly_rate: number | null
          invoice_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          description?: string | null
          start_time: string
          end_time?: string | null
          duration_seconds?: number
          is_billable?: boolean
          hourly_rate?: number | null
          invoice_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          description?: string | null
          start_time?: string
          end_time?: string | null
          duration_seconds?: number
          is_billable?: boolean
          hourly_rate?: number | null
          invoice_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      active_timers: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          description: string | null
          start_time: string
          elapsed_seconds: number
          is_billable: boolean
          is_paused: boolean
          paused_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          description?: string | null
          start_time: string
          elapsed_seconds?: number
          is_billable?: boolean
          is_paused?: boolean
          paused_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          description?: string | null
          start_time?: string
          elapsed_seconds?: number
          is_billable?: boolean
          is_paused?: boolean
          paused_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string
          invoice_number: string
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
          issue_date: string
          due_date: string
          paid_date: string | null
          subtotal: number
          tax_rate: number
          tax_amount: number
          discount_amount: number
          total: number
          currency: string
          notes: string | null
          terms: string | null
          public_token: string
          sent_at: string | null
          reminder_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          invoice_number: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
          issue_date?: string
          due_date: string
          paid_date?: string | null
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          discount_amount?: number
          total?: number
          currency?: string
          notes?: string | null
          terms?: string | null
          public_token?: string
          sent_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          invoice_number?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
          issue_date?: string
          due_date?: string
          paid_date?: string | null
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          discount_amount?: number
          total?: number
          currency?: string
          notes?: string | null
          terms?: string | null
          public_token?: string
          sent_at?: string | null
          reminder_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          time_entry_id: string | null
          description: string
          quantity: number
          unit_price: number
          amount: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          time_entry_id?: string | null
          description: string
          quantity: number
          unit_price: number
          amount?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          time_entry_id?: string | null
          description?: string
          quantity?: number
          unit_price?: number
          amount?: number
          sort_order?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_tier: 'free' | 'pro' | 'business'
      invoice_status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void'
    }
  }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Entity types
export type User = Tables<'users'>
export type UserSettings = Tables<'user_settings'>
export type Client = Tables<'clients'>
export type Project = Tables<'projects'>
export type TimeEntry = Tables<'time_entries'>
export type ActiveTimer = Tables<'active_timers'>
export type Invoice = Tables<'invoices'>
export type InvoiceLineItem = Tables<'invoice_line_items'>

// Insert types
export type InsertUser = InsertTables<'users'>
export type InsertUserSettings = InsertTables<'user_settings'>
export type InsertClient = InsertTables<'clients'>
export type InsertProject = InsertTables<'projects'>
export type InsertTimeEntry = InsertTables<'time_entries'>
export type InsertActiveTimer = InsertTables<'active_timers'>
export type InsertInvoice = InsertTables<'invoices'>
export type InsertInvoiceLineItem = InsertTables<'invoice_line_items'>

// Update types
export type UpdateUser = UpdateTables<'users'>
export type UpdateUserSettings = UpdateTables<'user_settings'>
export type UpdateClient = UpdateTables<'clients'>
export type UpdateProject = UpdateTables<'projects'>
export type UpdateTimeEntry = UpdateTables<'time_entries'>
export type UpdateActiveTimer = UpdateTables<'active_timers'>
export type UpdateInvoice = UpdateTables<'invoices'>
export type UpdateInvoiceLineItem = UpdateTables<'invoice_line_items'>
