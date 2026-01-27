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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          billing_address: string | null
          city: string | null
          created_at: string
          credit_limit: number | null
          customer_type: string | null
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          name: string
          outstanding_balance: number | null
          phone: string | null
          pincode: string | null
          shipping_address: string | null
          state: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          city?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_type?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          outstanding_balance?: number | null
          phone?: string | null
          pincode?: string | null
          shipping_address?: string | null
          state?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          city?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_type?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          outstanding_balance?: number | null
          phone?: string | null
          pincode?: string | null
          shipping_address?: string | null
          state?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          expense_number: string
          id: string
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          receipt_url: string | null
          supplier_id: string | null
          tax_amount: number | null
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          expense_number: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          tax_amount?: number | null
          title: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          expense_number?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          tax_amount?: number | null
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_activities: {
        Row: {
          activity_date: string
          activity_type: string
          completed: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lead_id: string
          title: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          completed?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id: string
          title: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          completed?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          lead_number: string
          name: string
          notes: string | null
          phone: string | null
          priority: string | null
          source: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_number: string
          name: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_number?: string
          name?: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      offer_products: {
        Row: {
          id: string
          offer_id: string
          product_id: string
        }
        Insert: {
          id?: string
          offer_id: string
          product_id: string
        }
        Update: {
          id?: string
          offer_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_products_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          end_date: string | null
          id: string
          is_active: boolean
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_name: string | null
          cheque_date: string | null
          cheque_number: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          payment_number: string
          payment_type: string
          reference_id: string
          reference_type: string
          supplier_id: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_name?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          payment_number: string
          payment_type: string
          reference_id: string
          reference_type: string
          supplier_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_name?: string | null
          cheque_date?: string | null
          cheque_number?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_number?: string
          payment_type?: string
          reference_id?: string
          reference_type?: string
          supplier_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_visible: boolean
          max_stock_level: number | null
          min_stock_level: number | null
          name: string
          offer_price: number | null
          price: number
          reorder_point: number | null
          short_description: string | null
          sku: string | null
          slug: string
          stock_quantity: number
          tax_rate: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          max_stock_level?: number | null
          min_stock_level?: number | null
          name: string
          offer_price?: number | null
          price: number
          reorder_point?: number | null
          short_description?: string | null
          sku?: string | null
          slug: string
          stock_quantity?: number
          tax_rate?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_visible?: boolean
          max_stock_level?: number | null
          min_stock_level?: number | null
          name?: string
          offer_price?: number | null
          price?: number
          reorder_point?: number | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock_quantity?: number
          tax_rate?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          created_at: string
          discount_amount: number
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          paid_amount: number
          payment_status: string | null
          status: string | null
          subtotal: number
          supplier_id: string
          supplier_invoice_number: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          paid_amount?: number
          payment_status?: string | null
          status?: string | null
          subtotal?: number
          supplier_id: string
          supplier_invoice_number?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          paid_amount?: number
          payment_status?: string | null
          status?: string | null
          subtotal?: number
          supplier_id?: string
          supplier_invoice_number?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_items: {
        Row: {
          batch_number: string | null
          created_at: string
          discount_amount: number | null
          expiry_date: string | null
          id: string
          line_total: number
          product_id: string | null
          product_name: string
          product_sku: string | null
          purchase_invoice_id: string
          quantity: number
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          discount_amount?: number | null
          expiry_date?: string | null
          id?: string
          line_total: number
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          purchase_invoice_id: string
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          discount_amount?: number | null
          expiry_date?: string | null
          id?: string
          line_total?: number
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          purchase_invoice_id?: string
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_return_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          product_id: string | null
          product_name: string
          purchase_return_id: string
          quantity: number
          reason: string | null
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          product_id?: string | null
          product_name: string
          purchase_return_id: string
          quantity?: number
          reason?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string | null
          product_name?: string
          purchase_return_id?: string
          quantity?: number
          reason?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_items_purchase_return_id_fkey"
            columns: ["purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_returns: {
        Row: {
          created_at: string
          credit_note_number: string | null
          id: string
          notes: string | null
          original_purchase_id: string | null
          reason: string | null
          return_date: string
          return_number: string
          status: string | null
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_note_number?: string | null
          id?: string
          notes?: string | null
          original_purchase_id?: string | null
          reason?: string | null
          return_date?: string
          return_number: string
          status?: string | null
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_note_number?: string | null
          id?: string
          notes?: string | null
          original_purchase_id?: string | null
          reason?: string | null
          return_date?: string
          return_number?: string
          status?: string | null
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_original_purchase_id_fkey"
            columns: ["original_purchase_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      sales_return_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          product_id: string | null
          product_name: string
          quantity: number
          reason: string | null
          sales_return_id: string
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          product_id?: string | null
          product_name: string
          quantity?: number
          reason?: string | null
          sales_return_id: string
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          reason?: string | null
          sales_return_id?: string
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_sales_return_id_fkey"
            columns: ["sales_return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          }
        ]
      }
      sales_returns: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          id: string
          notes: string | null
          original_order_id: string | null
          reason: string | null
          refund_method: string | null
          refund_status: string | null
          return_date: string
          return_number: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          id?: string
          notes?: string | null
          original_order_id?: string | null
          reason?: string | null
          refund_method?: string | null
          refund_status?: string | null
          return_date?: string
          return_number: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          id?: string
          notes?: string | null
          original_order_id?: string | null
          reason?: string | null
          refund_method?: string | null
          refund_status?: string | null
          return_date?: string
          return_number?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_original_order_id_fkey"
            columns: ["original_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          google_maps_embed: string | null
          id: string
          phone: string | null
          store_name: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          google_maps_embed?: string | null
          id?: string
          phone?: string | null
          store_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          google_maps_embed?: string | null
          id?: string
          phone?: string | null
          store_name?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_person: string | null
          created_at: string
          credit_days: number
          credit_limit: number
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          name: string
          outstanding_balance: number
          pan_number: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string
          credit_days?: number
          credit_limit?: number
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          outstanding_balance?: number
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string
          credit_days?: number
          credit_limit?: number
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          outstanding_balance?: number
          pan_number?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
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
      website_settings: {
        Row: {
          business_id: string | null
          floating_button_template: string | null
          footer_text: string | null
          google_map_iframe_url: string | null
          hero_json: Json | null
          id: string
          latitude: number | null
          longitude: number | null
          maintenance_mode: boolean | null
          navbar_json: Json | null
          offer_popup_template: string | null
          popup_enabled: boolean | null
          popup_image_url: string | null
          primary_color: string | null
          product_inquiry_template: string | null
          secondary_color: string | null
          shop_address: string | null
          shop_email: string | null
          shop_logo_url: string | null
          shop_name: string | null
          shop_phone: string | null
          social_links_json: Json | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          business_id?: string | null
          floating_button_template?: string | null
          footer_text?: string | null
          google_map_iframe_url?: string | null
          hero_json?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          maintenance_mode?: boolean | null
          navbar_json?: Json | null
          offer_popup_template?: string | null
          popup_enabled?: boolean | null
          popup_image_url?: string | null
          primary_color?: string | null
          product_inquiry_template?: string | null
          secondary_color?: string | null
          shop_address?: string | null
          shop_email?: string | null
          shop_logo_url?: string | null
          shop_name?: string | null
          shop_phone?: string | null
          social_links_json?: Json | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          business_id?: string | null
          floating_button_template?: string | null
          footer_text?: string | null
          google_map_iframe_url?: string | null
          hero_json?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          maintenance_mode?: boolean | null
          navbar_json?: Json | null
          offer_popup_template?: string | null
          popup_enabled?: boolean | null
          popup_image_url?: string | null
          primary_color?: string | null
          product_inquiry_template?: string | null
          secondary_color?: string | null
          shop_address?: string | null
          shop_email?: string | null
          shop_logo_url?: string | null
          shop_name?: string | null
          shop_phone?: string | null
          social_links_json?: Json | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
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