'use client'

import { useEffect, useState } from 'react'
import { supabase, type Trend, type Script } from '@/lib/supabase'
import { format } from 'date-fns'

const SOURCE_COLORS: Record<string, string> = {
  reddit: '#ff4500',
  youtube: '#ff0000',
  google_trends: '#4285f4',
  rednote: '#ff2442',
  twitter_nitter: '#1da1f2',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'PENDING',    color: '#666' },
  audio_done:{ label: 'AUDIO READY',color: '#f59e0b' },
  published: { label: 'PUBLISHED',  color: '#22c55e' },
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ color, borderColor: color }}
      className="text-xs border px-2 py-0.5 rounded font-mono uppercase tracking-widest">
      {text}
    </span>
  )
}

function TrendCard({ trend }: { trend: Trend }) {
  const color = SOURCE_COLORS[trend.source] ?? '#888'
  const isZh = trend.raw_data?.language === 'zh'
  return (
    <div className="border border-[#1e1e1e] bg-[#111] rounded-lg p-4 hover:border-[#333] transition-colors animate-slide-up">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span style={{ color }} className="text-xs font-mono uppercase tracking-widest">
          {trend.source.replace('_', '/')}
        </span>
        <div className="flex items-center gap-2">
          {isZh && <Badge text="ZH" color="#ff2442" />}
          <Badge text={trend.category} color="#f59e0b" />
        </div>
      </div>
      <p className="text-sm text-[#e8e8e8] leading-relaxed mb-3 line-clamp-2">
        {trend.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-xs text-[#555] font-mono">
          <span>↑ {trend.score.toLocaleString()}</span>
          {trend.comments > 0 && <span>💬 {trend.comments.toLocaleString()}</span>}
        </div>
        {trend.keywords?.length > 0 && (
          <div className="flex gap-1 flex-wrap justify-end">
            {trend.keywords.slice(0, 3).map(k => (
              <span key={k} className="text-xs text-[#444] bg-[#1a1a1a] px-2 py-0.5 rounded">
                {k}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ScriptCard({ script, onAudioGenerated }: {
  script: Script
  onAudioGenerated: (id: string, url: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [audio, setAudio] = useState(script.elevenlabs_audio_url)
  const [status, setStatus] = useState(script.status)
  const isZh = script.body?.includes('的') || script.hook?.includes('的')

  const fullText = `${script.hook}. ${script.body}. ${script.cta}`

  async function generateAudio() {
    setLoading(true)
    try {
      const res = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: script.id, text: fullText, language: isZh ? 'zh' : 'en' }),
      })
      const data = await res.json()
      if (data.audioUrl) {
        setAudio(data.audioUrl)
        setStatus('audio_done')
        onAudioGenerated(script.id, data.audioUrl)
      }
    } finally {
      setLoading(false)
    }
  }

  async function markPublished() {
    await fetch('/api/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptId: script.id, status: 'published' }),
    })
    setStatus('published')
  }

  const st = STATUS_LABELS[status]

  return (
    <div className="border border-[#1e1e1e] bg-[#111] rounded-lg p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-display font-700 text-[#e8e8e8] text-base leading-snug">
          {script.title}
        </h3>
        <Badge text={st.label} color={st.color} />
      </div>

      {/* Hook */}
      <div className="mb-3">
        <span className="text-xs text-[#f59e0b] font-mono uppercase tracking-widest mb-1 block">
          ▶ Hook (0–3s)
        </span>
        <p className="text-sm text-[#ccc] bg-[#0d0d0d] border border-[#1e1e1e] rounded p-3 leading-relaxed italic">
          "{script.hook}"
        </p>
      </div>

      {/* Body */}
      <div className="mb-3">
        <span className="text-xs text-[#555] font-mono uppercase tracking-widest mb-1 block">
          Story
        </span>
        <p className="text-sm text-[#999] leading-relaxed">
          {script.body}
        </p>
      </div>

      {/* CTA */}
      <div className="mb-4">
        <span className="text-xs text-[#555] font-mono uppercase tracking-widest mb-1 block">
          CTA
        </span>
        <p className="text-sm text-[#666]">{script.cta}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-[#444] font-mono mb-4">
        <span>⏱ {script.duration_seconds}s</span>
        <span>📱 {script.platform}</span>
        <span>🤖 {script.model_used}</span>
        {isZh && <Badge text="中文" color="#ff2442" />}
      </div>

      {/* Audio player */}
      {audio && (
        <audio controls className="w-full mb-3 h-8 opacity-80" src={audio} />
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {status === 'pending' && (
          <button
            onClick={generateAudio}
            disabled={loading}
            className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-40 text-black text-xs font-mono font-500 uppercase tracking-widest py-2 px-4 rounded transition-colors"
          >
            {loading ? 'Generating...' : '⚡ Generate Audio'}
          </button>
        )}
        {status === 'audio_done' && (
          <>
            <button
              onClick={generateAudio}
              disabled={loading}
              className="bg-[#1a1a1a] hover:bg-[#222] text-[#888] text-xs font-mono py-2 px-3 rounded transition-colors border border-[#2a2a2a]"
            >
              {loading ? '...' : '↻ Regen'}
            </button>
            <button
              onClick={markPublished}
              className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-mono font-500 uppercase tracking-widest py-2 px-4 rounded transition-colors"
            >
              ✓ Mark Published
            </button>
          </>
        )}
        {status === 'published' && (
          <div className="flex-1 text-center text-xs text-[#22c55e] font-mono py-2">
            ✓ Published
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stats bar ──────────────────────────────────────────────────────────────────
function StatsBar({ trends, scripts }: { trends: Trend[]; scripts: Script[] }) {
  const bySource = trends.reduce((acc, t) => {
    acc[t.source] = (acc[t.source] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const pending = scripts.filter(s => s.status === 'pending').length
  const audioDone = scripts.filter(s => s.status === 'audio_done').length
  const published = scripts.filter(s => s.status === 'published').length

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {[
        { label: 'Trends today', value: trends.length, color: '#f59e0b' },
        { label: 'Scripts pending', value: pending, color: '#666' },
        { label: 'Audio ready', value: audioDone, color: '#f59e0b' },
        { label: 'Published', value: published, color: '#22c55e' },
      ].map(stat => (
        <div key={stat.label} className="border border-[#1e1e1e] bg-[#111] rounded-lg p-4">
          <div style={{ color: stat.color }} className="text-2xl font-display font-800 mb-1">
            {stat.value}
          </div>
          <div className="text-xs text-[#555] font-mono uppercase tracking-widest">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [trends, setTrends] = useState<Trend[]>([])
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'scripts' | 'trends'>('scripts')
  const [filter, setFilter] = useState<string>('all')
  const today = format(new Date(), 'MMM dd, yyyy')

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: s }] = await Promise.all([
        supabase.from('trends').select('*').eq('date', new Date().toISOString().split('T')[0]).order('score', { ascending: false }).limit(100),
        supabase.from('scripts').select('*').order('created_at', { ascending: false }).limit(50),
      ])
      setTrends(t ?? [])
      setScripts(s ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filteredTrends = filter === 'all' ? trends : trends.filter(t => t.source === filter)
  const sources = [...new Set(trends.map(t => t.source))]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#333] font-mono text-sm animate-pulse">Loading intelligence...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-800 text-[#e8e8e8] tracking-tight mb-1">
            TREND MONITOR
          </h1>
          <p className="text-xs text-[#444] font-mono">{today} · Content Intelligence Dashboard</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#444] font-mono">NEXT RUN</div>
          <div className="text-sm text-[#f59e0b] font-mono">08:00 UTC</div>
        </div>
      </div>

      {/* Stats */}
      <StatsBar trends={trends} scripts={scripts} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#1e1e1e] pb-0">
        {(['scripts', 'trends'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-mono text-xs uppercase tracking-widest px-4 py-2 border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-[#f59e0b] text-[#f59e0b]'
                : 'border-transparent text-[#444] hover:text-[#888]'
            }`}
          >
            {t} {t === 'scripts' ? `(${scripts.length})` : `(${trends.length})`}
          </button>
        ))}
      </div>

      {/* Scripts Tab */}
      {tab === 'scripts' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['all', 'pending', 'audio_done', 'published'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-xs font-mono px-3 py-1 rounded border transition-colors ${
                  filter === s
                    ? 'border-[#f59e0b] text-[#f59e0b]'
                    : 'border-[#1e1e1e] text-[#444] hover:border-[#333]'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {scripts
              .filter(s => filter === 'all' || s.status === filter)
              .map(s => (
                <ScriptCard
                  key={s.id}
                  script={s}
                  onAudioGenerated={(id, url) => {
                    setScripts(prev => prev.map(sc =>
                      sc.id === id ? { ...sc, elevenlabs_audio_url: url, status: 'audio_done' } : sc
                    ))
                  }}
                />
              ))}
          </div>
          {scripts.length === 0 && (
            <div className="text-center text-[#333] font-mono text-sm py-20">
              No scripts yet. Run the monitor first.
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs font-mono px-3 py-1 rounded border transition-colors ${
                filter === 'all' ? 'border-[#f59e0b] text-[#f59e0b]' : 'border-[#1e1e1e] text-[#444]'
              }`}
            >
              all
            </button>
            {sources.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{ borderColor: filter === s ? SOURCE_COLORS[s] : undefined, color: filter === s ? SOURCE_COLORS[s] : undefined }}
                className="text-xs font-mono px-3 py-1 rounded border border-[#1e1e1e] text-[#444] hover:border-[#333] transition-colors"
              >
                {s.replace('_', '/')}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTrends.map(t => (
              <TrendCard key={t.id} trend={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
