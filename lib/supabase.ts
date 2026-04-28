import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Trend = {
  id: string
  source: string
  title: string
  url: string | null
  score: number
  comments: number
  category: string
  keywords: string[]
  raw_data: Record<string, any>
  collected_at: string
  date: string
}

export type Script = {
  id: string
  trend_id: string | null
  title: string
  hook: string
  body: string
  cta: string
  duration_seconds: number
  platform: string
  status: 'pending' | 'audio_done' | 'published'
  elevenlabs_audio_url: string | null
  model_used: string
  created_at: string
}
