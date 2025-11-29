export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          user_id: string
          role: "admin" | "moderator" | "user"
          created_at: string | null
        }
        Insert: {
          user_id: string
          role: "admin" | "moderator" | "user"
          created_at?: string | null
        }
        Update: {
          user_id?: string
          role?: "admin" | "moderator" | "user"
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          instagram: string | null
          tiktok: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          instagram?: string | null
          tiktok?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          instagram?: string | null
          tiktok?: string | null
          updated_at?: string | null
        }
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          start_date: string | null
          end_date: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          start_date: string
          end_date: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          start_date?: string
          end_date?: string
        }
      }
      user_event_points: {
        Row: {
          user_id: string
          event_id: string
          points: number
        }
        Insert: {
          user_id: string
          event_id: string
          points?: number
        }
        Update: {
          user_id?: string
          event_id?: string
          points?: number
        }
      }
      missions: {
        Row: {
          id: string
          event_id: string
          name: string
          description: string | null
          image_url: string | null
          points: number
          identifier: string
          created_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          description?: string | null
          image_url?: string | null
          points?: number
          identifier?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          points?: number
          identifier?: string
          created_at?: string | null
        }
      }
      hidden_points: {
        Row: {
          id: string
          event_id: string
          name: string
          description: string | null
          points: number
          identifier: string
          created_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          description?: string | null
          points?: number
          identifier?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          description?: string | null
          points?: number
          identifier?: string
          created_at?: string | null
        }
      }
      connections: {
        Row: {
          id: string
          user_id: string
          connected_user_id: string
          event_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          connected_user_id: string
          event_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          connected_user_id?: string
          event_id?: string
          created_at?: string | null
        }
      }
      scans: {
        Row: {
          id: string
          user_id: string
          event_id: string
          qrcode_identifier: string
          type: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          qrcode_identifier: string
          type: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          qrcode_identifier?: string
          type?: string
          created_at?: string | null
        }
      }
    }
    Functions: {
      scan_code: {
        Args: {
          p_event_id: string
          p_code_identifier: string
        }
        Returns: Json
      }
      scan_user: {
        Args: {
          p_event_id: string
          p_target_user_id: string
        }
        Returns: Json
      }
    }
  }
}
