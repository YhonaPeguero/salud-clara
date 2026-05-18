'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type { SearchResult, MinsalHistoricoPunto } from '@/lib/types'
import type { NationalStats } from '@/lib/search'
import { formatMillones, formatMillonesCompact, formatNumero, formatVariacion } from '@/lib/format'
import { ChatAssistant } from './ChatAssistant'

interface Props {
  initialHeroes: SearchResult[]
  dipresPeriodo: string | null
  minsalPeriodo: string | null
  stats: NationalStats
}

// ============================================================
// SMALL VISUAL PRIMITIVES
// ============================================================

function KmillaLogo({ className = 'w-7 h-7' }: { className?: string }) {
  // Corazón verde con heartbeat blanco. Coherente con el logo K-milla.
  return (
    <svg viewBox="0 0 36 32" className={className} fill="none" aria-hidden>
      <path
        d="M18 30c-1-.5-12-6.5-15.5-15A9 9 0 0 1 18 6.5 9 9 0 0 1 33.5 15C30 23.5 19 29.5 18 30Z"
        fill="#22C55E"
      />
      <path
        d="M5.5 16h5l2-4 3 9 2.5-6 2 3h10"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function KmillaWordmark({ size = 'nav', tone = 'light' }: { size?: 'nav' | 'footer'; tone?: 'light' | 'dark' }) {
  const text = tone === 'light' ? 'text-white' : 'text-[var(--color-foreground)]'
  const wordmarkClass = size === 'nav' ? 'text-xl sm:text-2xl' : 'text-lg'
  const logoSize = size === 'nav' ? 'w-7 h-7 sm:w-8 sm:h-8' : 'w-5 h-5'
  return (
    <span className="inline-flex items-center gap-2">
      <KmillaLogo className={logoSize} />
      <span
        className={`font-bold leading-none tracking-tight ${text} ${wordmarkClass}`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        K-milla
      </span>
    </span>
  )
}

function LiveDot({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]" />
      </span>
      <span className="text-[11px] font-medium text-[var(--color-success)] tracking-wide">{label}</span>
    </span>
  )
}

function SourceBadge({ source, variant }: { source: string; variant: 'dipres' | 'minsal' }) {
  const colors = {
    dipres: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20',
    minsal: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/20',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${colors[variant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${variant === 'dipres' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-accent)]'}`} />
      {source}
    </span>
  )
}

// Number that animates from 0 → target on mount (and on value change).
function CountUp({
  value,
  format = (n) => formatNumero(Math.round(n)),
  durationMs = 1100,
}: {
  value: number | null
  format?: (n: number) => string
  durationMs?: number
}) {
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(0)
  const fromRef = useRef(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (value == null) return
    fromRef.current = shown
    startRef.current = null
    const target = value
    const step = (t: number) => {
      if (startRef.current == null) startRef.current = t
      const elapsed = t - startRef.current
      const k = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - k, 3)
      setShown(fromRef.current + (target - fromRef.current) * eased)
      if (k < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs])

  if (value == null) return <>Sin dato</>
  // SSR + primer paint cliente: valor final. Después del mount, anima.
  return <>{format(mounted ? shown : value)}</>
}

// SVG sparkline — 8 puntos, sin librería.
function Sparkline({
  points,
  field,
  color,
  height = 32,
}: {
  points: MinsalHistoricoPunto[]
  field: 'espera_cirugia' | 'espera_consulta_especialidad'
  color: string
  height?: number
}) {
  const series = useMemo(
    () =>
      points
        .map((p) => p[field])
        .map((v) => (v == null ? null : Number(v))),
    [points, field],
  )
  const valid = series.filter((v): v is number => v != null)
  if (valid.length < 2) return null

  const w = 120
  const h = height
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  const range = max - min || 1
  const stepX = w / (series.length - 1)
  const y = (v: number) => h - ((v - min) / range) * (h - 4) - 2

  // Build path skipping nulls.
  let d = ''
  let inSegment = false
  series.forEach((v, i) => {
    if (v == null) {
      inSegment = false
      return
    }
    const cmd = inSegment ? 'L' : 'M'
    d += `${cmd}${(i * stepX).toFixed(1)},${y(v).toFixed(1)} `
    inSegment = true
  })

  // Last-point marker
  let lastIdx = -1
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i] != null) {
      lastIdx = i
      break
    }
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="sparkline-path" />
      {lastIdx >= 0 && series[lastIdx] != null && (
        <circle cx={lastIdx * stepX} cy={y(series[lastIdx]!)} r={2.5} fill={color} />
      )}
    </svg>
  )
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct == null) {
    return <span className="text-[10px] text-[var(--color-muted-foreground)] whitespace-nowrap">— sin comparativo</span>
  }
  const up = pct >= 0
  const arrow = up ? '▲' : '▼'
  // Tono descriptivo: solo color, sin texto valorativo.
  const color = up ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'
  return (
    <span className={`text-[10px] font-semibold tabular-nums whitespace-nowrap ${color}`} title="Variación vs. mismo trimestre del año anterior">
      {arrow} {formatVariacion(pct)} a/a
    </span>
  )
}

// ============================================================
// HERO STATS
// ============================================================

function HeroStats({ stats, dipresPeriodo, minsalPeriodo }: { stats: NationalStats; dipresPeriodo: string | null; minsalPeriodo: string | null }) {
  const items = [
    {
      kicker: 'Presupuesto',
      value: <CountUp value={stats.totalPresupuestoVigenteMM} format={(n) => formatMillonesCompact(n)} />,
      sub: dipresPeriodo ?? 'DIPRES',
      tone: 'primary' as const,
      hint: 'B = billones de pesos chilenos (millones de millones).',
    },
    {
      kicker: 'Ejecutado',
      value: <CountUp value={stats.pctEjecucionNacional} format={(n) => `${n.toFixed(1)}%`} />,
      sub: 'del presupuesto',
      tone: 'primary' as const,
      hint: 'Devengado sobre presupuesto vigente, agregado nacional.',
    },
    {
      kicker: 'Esperan cirugía',
      value: <CountUp value={stats.totalEsperaCirugia} />,
      sub: minsalPeriodo ?? 'MINSAL',
      tone: 'accent' as const,
      hint: 'Suma de personas en lista de espera quirúrgica en todos los Servicios de Salud.',
    },
    {
      kicker: 'Esperan consulta',
      value: <CountUp value={stats.totalEsperaConsulta} />,
      sub: minsalPeriodo ?? 'MINSAL',
      tone: 'accent' as const,
      hint: 'Suma de personas esperando consulta de especialidad en todos los Servicios de Salud.',
    },
  ]

  return (
    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10">
      {items.map((it, i) => (
        <div
          key={it.kicker}
          className="bg-[var(--color-surface-dark)] px-3 sm:px-4 py-3.5 sm:py-4 animate-stagger min-w-0"
          style={{ animationDelay: `${120 + i * 80}ms` }}
          title={it.hint}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50 truncate">{it.kicker}</p>
          <p className={`mt-1.5 text-xl sm:text-2xl md:text-2xl font-bold tabular-nums leading-tight whitespace-nowrap ${it.tone === 'primary' ? 'text-white' : 'text-[var(--color-accent)]'}`}>
            {it.value}
          </p>
          <p className="mt-1 text-[10px] text-white/35 truncate">{it.sub}</p>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// SEARCH INPUT
// ============================================================

function SearchInput({
  query,
  onChange,
  onSubmit,
  onClear,
  loading,
  inputRef,
}: {
  query: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onClear: () => void
  loading: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/20 border border-white/10 flex items-center">
        <div className="pl-4 pr-2 flex-shrink-0">
          {loading ? (
            <div className="w-[18px] h-[18px] border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-[18px] h-[18px] text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe tu hospital, comuna o ciudad…"
          className="flex-1 py-4 text-base text-[var(--color-foreground)] bg-transparent focus:outline-none placeholder:text-gray-400"
          autoComplete="off"
          aria-label="Buscar hospital o comuna"
        />
        <div className="flex items-center gap-1 pr-2 flex-shrink-0">
          {query && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-gray-600 px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              Limpiar
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-muted)] disabled:opacity-40 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
          >
            Buscar
          </button>
        </div>
      </div>
    </form>
  )
}

function QuickSearchTags({ onSelect }: { onSelect: (term: string) => void }) {
  const tags = [
    { label: 'San José', term: 'Hospital San José' },
    { label: 'Temuco', term: 'Temuco' },
    { label: 'Puente Alto', term: 'Puente Alto' },
  ]
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 px-2">
      <span className="text-[11px] text-white/40">Probar:</span>
      {tags.map((t) => (
        <button
          key={t.term}
          onClick={() => onSelect(t.term)}
          className="text-[11px] text-white/70 hover:text-white bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 px-3 py-1 rounded-full transition-all whitespace-nowrap"
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ============================================================
// RESULT CARD
// ============================================================

function BudgetBar({ vigenteMM, devengadoMM, pct }: { vigenteMM: number | null; devengadoMM: number | null; pct: number | null }) {
  const getColor = (p: number | null) => {
    if (p == null) return 'var(--color-muted-foreground)'
    if (p >= 95) return 'var(--color-success)'
    if (p >= 80) return 'var(--color-warning)'
    return 'var(--color-danger)'
  }
  const color = getColor(pct)
  const barPct = pct == null ? 0 : Math.min(pct, 100)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-widest">Asignado</p>
          <p className="text-2xl md:text-3xl font-bold text-[var(--color-foreground)] mt-1 tabular-nums">
            <CountUp value={vigenteMM} format={(n) => formatMillones(n)} />
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase tracking-widest">Ejecutado</p>
          <p className="text-2xl md:text-3xl font-bold mt-1 tabular-nums" style={{ color }}>
            <CountUp value={devengadoMM} format={(n) => formatMillones(n)} />
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="h-3 bg-[var(--color-muted)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
            style={{ width: `${barPct}%`, backgroundColor: color }}
          >
            <div className="absolute inset-0 animate-shimmer" />
          </div>
        </div>
        <div className="absolute -top-1 w-0.5 h-5 bg-[var(--color-foreground)]/30" style={{ left: '100%', transform: 'translateX(-1px)' }} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-muted-foreground)]">0%</span>
        <span className="font-semibold px-2.5 py-0.5 rounded-full tabular-nums" style={{ backgroundColor: `${color}22`, color }}>
          {pct == null ? 'Sin dato' : `${pct.toFixed(1)}% ejecutado`}
        </span>
        <span className="text-[var(--color-muted-foreground)]">100%</span>
      </div>
    </div>
  )
}

function WaitMetric({
  label,
  value,
  trend,
  historico,
  field,
  color,
}: {
  label: string
  value: number | null
  trend: number | null
  historico: MinsalHistoricoPunto[]
  field: 'espera_cirugia' | 'espera_consulta_especialidad'
  color: string
}) {
  return (
    <div className="rounded-xl bg-[var(--color-muted)]/40 border border-[var(--color-border)]/60 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.1em] flex-1 min-w-0">{label}</p>
        <TrendBadge pct={trend} />
      </div>
      <div className="mt-3 flex items-end justify-between gap-4 min-w-0">
        <div className="min-w-0">
          {value == null ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Sin dato cargado.</p>
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-[var(--color-foreground)] tabular-nums leading-none">
              <CountUp value={value} />
              <span className="text-xs font-normal text-[var(--color-muted-foreground)] ml-1.5">personas</span>
            </p>
          )}
        </div>
        <div className="shrink-0">
          <Sparkline points={historico} field={field} color={color} />
        </div>
      </div>
    </div>
  )
}

function ResultCard({ result, delay = 0 }: { result: SearchResult; delay?: number }) {
  const { entry, dipres, establecimiento, minsal } = result
  const esComuna = entry.tipo === 'comuna'
  const hospitalNombre = establecimiento?.nombre ?? entry.display_nombre
  const historico = minsal?.historico ?? []

  return (
    <article
      className="animate-stagger bg-[var(--color-card)] rounded-3xl shadow-xl shadow-[var(--color-foreground)]/5 overflow-hidden border border-[var(--color-border)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <header className="relative bg-[var(--color-surface-dark)] px-5 sm:px-6 py-5 overflow-hidden noise-overlay">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary-muted)] mb-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {esComuna ? 'Comuna' : 'Hospital'}
            </span>
            <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold leading-tight">{hospitalNombre}</h2>
            <p className="text-white/55 text-xs sm:text-sm mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{entry.region}</span>
            </p>
          </div>
          {entry.es_hero && (
            <span className="shrink-0 bg-[var(--color-primary)]/90 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
              Ejemplo
            </span>
          )}
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--color-accent)]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      </header>

      {/* DIPRES Section */}
      <section className="px-5 sm:px-6 py-6 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <SourceBadge source="DIPRES" variant="dipres" />
          <span className="text-[10px] text-[var(--color-muted-foreground)] tabular-nums">{dipres.mes_corte ?? 'sin corte'}</span>
        </div>
        <p className="text-[13px] text-[var(--color-muted-foreground)] mb-5">
          Presupuesto de <span className="font-semibold text-[var(--color-card-foreground)]">{dipres.nombre}</span>
        </p>
        <BudgetBar vigenteMM={dipres.presupuesto_vigente_MM} devengadoMM={dipres.devengado_MM} pct={dipres.pct_ejecucion} />
      </section>

      {/* MINSAL Section */}
      <section className="px-5 sm:px-6 py-6 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <SourceBadge source="MINSAL" variant="minsal" />
          {minsal && (
            <span className="text-[10px] text-[var(--color-muted-foreground)] tabular-nums">{minsal.fecha_corte ?? 'sin corte'}</span>
          )}
        </div>

        <p className="text-[13px] text-[var(--color-muted-foreground)] mb-5">
          Personas en espera en toda la red (no solo este hospital).
        </p>

        {minsal ? (
          <div className="space-y-3">
            <WaitMetric
              label="Esperan cirugía"
              value={minsal.espera_cirugia}
              trend={minsal.variacion_cirugia_pct}
              historico={historico}
              field="espera_cirugia"
              color="var(--color-accent)"
            />
            <WaitMetric
              label="Esperan consulta de especialidad"
              value={minsal.espera_consulta_especialidad}
              trend={minsal.variacion_consulta_pct}
              historico={historico}
              field="espera_consulta_especialidad"
              color="var(--color-primary)"
            />
          </div>
        ) : (
          <div className="bg-[var(--color-muted)] rounded-2xl p-5 text-center">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No hay datos de lista de espera cargados para este Servicio de Salud.
            </p>
          </div>
        )}
      </section>

      {/* Insight Section */}
      <section className="px-5 sm:px-6 py-5 bg-[var(--color-muted)]/40">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 rounded-xl bg-[var(--color-primary)]/10">
            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-primary)] mb-1">En palabras simples</p>
            <p className="text-[13px] sm:text-sm text-[var(--color-card-foreground)] leading-relaxed">{result.parrafo}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-5 sm:px-6 py-3.5 bg-[var(--color-card)] border-t border-[var(--color-border)]">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-[var(--color-muted-foreground)]">
          <a href="https://www.dipres.gob.cl/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Fuente DIPRES
          </a>
          <span className="text-[var(--color-border)]">·</span>
          <a href="https://www.listaesperasalud.cl/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Fuente MINSAL
          </a>
        </div>
      </footer>
    </article>
  )
}

// ============================================================
// MAIN
// ============================================================

export function SearchClient({ initialHeroes, dipresPeriodo, minsalPeriodo, stats }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      if (!res.ok) throw new Error('Error en la búsqueda')
      const data = await res.json()
      setResults(data.results ?? [])
      setSearched(true)
    } catch {
      setError('No pudimos completar la búsqueda. Por favor intenta de nuevo.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    debounceRef.current = setTimeout(() => doSearch(value), 350)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    doSearch(query)
  }

  function handleHeroClick(term: string) {
    setQuery(term)
    doSearch(term)
    inputRef.current?.focus()
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setSearched(false)
    setError(null)
    inputRef.current?.focus()
  }

  const showHeroes = !searched && !loading && results.length === 0

  return (
    <div className="min-h-screen bg-[var(--color-background)] overflow-x-clip">
      {/* HERO */}
      <header className="relative bg-[var(--color-surface-dark)] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 bg-[var(--color-primary)]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-64 sm:w-80 h-64 sm:h-80 bg-[var(--color-accent)]/15 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[var(--color-primary)]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-14">
          {/* Top nav */}
          <nav className="flex items-center justify-between mb-10 sm:mb-12">
            <KmillaWordmark size="nav" />
            <LiveDot label="Datos oficiales" />
          </nav>

          {/* Pitch */}
          <div className="text-center mb-8 max-w-xl mx-auto animate-stagger" style={{ animationDelay: '60ms' }}>
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary-muted)] mb-3 sm:mb-4">
              DIPRES + MINSAL · datos oficiales
            </p>
            <h1 className="text-[26px] sm:text-4xl md:text-5xl font-bold text-white leading-[1.15]">
              Tu hospital,{' '}
              <span className="animated-gradient-text">en números públicos.</span>
            </h1>
            <p className="mt-4 sm:mt-5 text-[13px] sm:text-base text-white/60 max-w-sm sm:max-w-md mx-auto leading-relaxed">
              Presupuesto recibido y personas en espera de tu Servicio de Salud. Una sola búsqueda.
            </p>
          </div>

          {/* Search */}
          <div className="animate-stagger" style={{ animationDelay: '180ms' }}>
            <SearchInput
              query={query}
              onChange={handleQueryChange}
              onSubmit={handleSubmit}
              onClear={handleClear}
              loading={loading}
              inputRef={inputRef}
            />
            <QuickSearchTags onSelect={handleHeroClick} />
          </div>

          <HeroStats stats={stats} dipresPeriodo={dipresPeriodo} minsalPeriodo={minsalPeriodo} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--color-background)] to-transparent pointer-events-none" />
      </header>

      {/* RESULTS */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16 text-[var(--color-muted-foreground)]">
            <div className="relative">
              <div className="w-12 h-12 border-3 border-[var(--color-primary)]/20 rounded-full" />
              <div className="absolute inset-0 w-12 h-12 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm">Buscando en los datos oficiales…</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20 rounded-2xl px-6 py-5 text-[var(--color-danger)] text-sm flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {searched && !loading && !error && results.length === 0 && (
          <div className="bg-[var(--color-warning)]/5 border border-[var(--color-warning)]/20 rounded-2xl px-6 py-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-[var(--color-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-[var(--color-warning)] font-semibold">Sin resultados para &quot;{query}&quot;</p>
                <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
                  Intenta con el nombre de un hospital, comuna o ciudad.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {initialHeroes.map((h) => (
                <button
                  key={h.entry.id}
                  onClick={() => handleHeroClick(h.entry.display_nombre)}
                  className="text-xs bg-[var(--color-warning)]/10 hover:bg-[var(--color-warning)]/20 text-[var(--color-warning)] px-3 py-1.5 rounded-full transition-colors"
                >
                  {h.entry.display_nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-8">
            {results.length > 1 && (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {results.length} resultados para <span className="font-semibold text-[var(--color-foreground)]">&quot;{query}&quot;</span>
              </p>
            )}
            {results.map((r, i) => (
              <ResultCard key={r.entry.id} result={r} delay={i * 80} />
            ))}
          </div>
        )}

        {showHeroes && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted-foreground)]">Ejemplos en vivo</p>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
            <div className="space-y-8">
              {initialHeroes.map((r, i) => (
                <ResultCard key={r.entry.id} result={r} delay={i * 120} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[var(--color-border)]">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center">
              <KmillaWordmark size="footer" tone="dark" />
            </div>
            <p className="text-[11px] text-[var(--color-muted-foreground)] max-w-md mx-auto leading-relaxed">
              Cada cifra está trazada a su fuente oficial en{' '}
              <a href="https://github.com/YhonaPeguero/salud-clara/blob/main/data/_data_audit.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-foreground)]">
                data/_data_audit.md
              </a>
              . El presupuesto y la lista de espera corresponden al Servicio de Salud regional, no al hospital individual.
            </p>
            <div className="flex items-center justify-center gap-3 text-[11px] text-[var(--color-muted-foreground)]">
              <a href="https://www.dipres.gob.cl" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)] transition-colors">DIPRES</a>
              <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
              <a href="https://www.listaesperasalud.cl" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors">MINSAL</a>
              <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
              <a href="https://github.com/YhonaPeguero/salud-clara" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-foreground)] transition-colors">GitHub</a>
            </div>
            <p className="text-[10px] text-[var(--color-muted-foreground)]/60">Hack@LATAM 2026 · Transparency & Corruption</p>
          </div>
        </footer>
      </main>

      <ChatAssistant />
    </div>
  )
}
