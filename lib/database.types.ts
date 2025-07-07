export interface Database {
  public: {
    Tables: {
      keywords: {
        Row: {
          id: number
          keyword: string
          target_url: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          keyword: string
          target_url: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          keyword?: string
          target_url?: string
          active?: boolean
          updated_at?: string
        }
      }
      impressions: {
        Row: {
          id: number
          keyword_id: number | null
          keyword: string
          user_session: string | null
          created_at: string
        }
        Insert: {
          id?: number
          keyword_id?: number | null
          keyword: string
          user_session?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          keyword_id?: number | null
          keyword?: string
          user_session?: string | null
        }
      }
      clicks: {
        Row: {
          id: number
          keyword_id: number | null
          keyword: string
          user_session: string | null
          target_url: string
          created_at: string
        }
        Insert: {
          id?: number
          keyword_id?: number | null
          keyword: string
          user_session?: string | null
          target_url: string
          created_at?: string
        }
        Update: {
          id?: number
          keyword_id?: number | null
          keyword?: string
          user_session?: string | null
          target_url?: string
        }
      }
      analytics_summary: {
        Row: {
          id: number
          keyword: string
          date: string
          impressions: number
          clicks: number
          revenue: number
        }
        Insert: {
          id?: number
          keyword: string
          date: string
          impressions?: number
          clicks?: number
          revenue?: number
        }
        Update: {
          id?: number
          keyword?: string
          date?: string
          impressions?: number
          clicks?: number
          revenue?: number
        }
      }
    }
  }
}

export type Keyword = Database["public"]["Tables"]["keywords"]["Row"]
export type KeywordInsert = Database["public"]["Tables"]["keywords"]["Insert"]
export type KeywordUpdate = Database["public"]["Tables"]["keywords"]["Update"]
