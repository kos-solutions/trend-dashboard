import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { scriptId, text, language } = await req.json()

  const voiceId = language === 'zh'
    ? process.env.ELEVENLABS_VOICE_ZH ?? 'pNInz6obpgDQGcFmaJgB'
    : process.env.ELEVENLABS_VOICE_EN ?? 'pNInz6obpgDQGcFmaJgB'

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const audioBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(audioBuffer).toString('base64')
    const audioUrl = `data:audio/mpeg;base64,${base64}`

    // Actualizăm statusul în Supabase
    await supabase
      .from('scripts')
      .update({ status: 'audio_done', elevenlabs_audio_url: audioUrl })
      .eq('id', scriptId)

    return NextResponse.json({ audioUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
